import { JsonRpcProvider, type Eip1193Provider } from "ethers";
import { ensureRelayerSDK } from "./relayer-loader";
import { loadCachedKey, persistCachedKey } from "./public-keys";

type CreateInstanceParams = {
  provider: Eip1193Provider;
  chainId: number;
  signal: AbortSignal;
};

function throwIfAborted(signal: AbortSignal) {
  if (signal.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
}

type RelayerMetadataPayload = {
  result?: {
    ACLAddress: `0x${string}`;
    InputVerifierAddress: `0x${string}`;
    KMSVerifierAddress: `0x${string}`;
  };
  ACLAddress?: `0x${string}`;
  InputVerifierAddress?: `0x${string}`;
  KMSVerifierAddress?: `0x${string}`;
};

async function fetchMockMetadata(rpcUrl: string) {
  const body = JSON.stringify({ jsonrpc: "2.0", method: "fhevm_relayer_metadata", params: [], id: 42 });
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  if (!response.ok) {
    throw new Error(`Unable to fetch fhevm_relayer_metadata from ${rpcUrl}`);
  }
  const payload = (await response.json()) as RelayerMetadataPayload;
  return payload?.result ?? payload;
}

async function createMockInstance(chainId: number, signal: AbortSignal) {
  const rpcUrl = process.env.NEXT_PUBLIC_MOCK_RPC_URL ?? "http://127.0.0.1:8545";
  const metadata = await fetchMockMetadata(rpcUrl);
  throwIfAborted(signal);

  if (
    !metadata?.ACLAddress ||
    !metadata?.InputVerifierAddress ||
    !metadata?.KMSVerifierAddress ||
    typeof metadata.ACLAddress !== "string" ||
    typeof metadata.InputVerifierAddress !== "string" ||
    typeof metadata.KMSVerifierAddress !== "string"
  ) {
    throw new Error("Invalid FHEVM relayer metadata: missing ACL/Input/KMS verifier addresses");
  }

  const { MockFhevmInstance } = await import("@fhevm/mock-utils");
  const { Contract } = await import("ethers");
  const provider = new JsonRpcProvider(rpcUrl);

  // Query InputVerifier EIP712 domain for v0.9 compatibility
  const inputVerifierContract = new Contract(
    metadata.InputVerifierAddress,
    ["function eip712Domain() external view returns (bytes1, string, string, uint256, address, bytes32, uint256[])"],
    provider
  );
  const domain = await inputVerifierContract.eip712Domain();
  const verifyingContractAddressInputVerification = domain[4] as `0x${string}`; // index 4 is verifyingContract
  const gatewayChainId = Number(domain[3]); // index 3 is chainId

  throwIfAborted(signal);

  const instance = await MockFhevmInstance.create(
    provider,
    provider,
    {
      aclContractAddress: metadata.ACLAddress,
      chainId,
      gatewayChainId,
      inputVerifierContractAddress: metadata.InputVerifierAddress,
      kmsContractAddress: metadata.KMSVerifierAddress,
      verifyingContractAddressDecryption: "0x5ffdaAB0373E62E2ea2944776209aEf29E631A64",
      verifyingContractAddressInputVerification,
    },
    {
      // v0.9 requires 4th parameter: properties
      inputVerifierProperties: {},
      kmsVerifierProperties: {},
    }
  );
  throwIfAborted(signal);
  return instance;
}

async function createRelayerInstance(provider: Eip1193Provider, signal: AbortSignal) {
  console.log("[createRelayerInstance] Loading Relayer SDK...");
  const sdk = await ensureRelayerSDK(process.env.NEXT_PUBLIC_RELAYER_CDN_URL);
  console.log("[createRelayerInstance] ✅ Relayer SDK loaded");

  if (!sdk.__initialized__) {
    console.log("[createRelayerInstance] Initializing SDK...");
    throwIfAborted(signal);
    const initResult = await sdk.initSDK();
    if (!initResult) {
      throw new Error("Failed to initialise relayer SDK");
    }
    sdk.__initialized__ = true;
    console.log("[createRelayerInstance] ✅ SDK initialized");
  }

  // Get chainId from provider to select appropriate config
  console.log("[createRelayerInstance] Getting chainId from provider...");
  let chainIdHex: string;
  try {
    chainIdHex = (await provider.request({ method: "eth_chainId" })) as string;
  } catch (err) {
    console.error("[createRelayerInstance] ❌ Failed to get chainId:", err);
    throw new Error("Failed to get chainId from provider: " + (err as Error).message);
  }
  const chainId = parseInt(chainIdHex, 16);
  console.log(`[createRelayerInstance] ChainId from provider: ${chainId} (0x${chainIdHex})`);

  // Select network config based on chainId
  // Sepolia: 11155111, Ethereum: 1
  let networkConfig: any;
  if (chainId === 11155111) {
    console.log("[createRelayerInstance] Using SepoliaConfig");
    networkConfig = sdk.SepoliaConfig;
  } else if (chainId === 1) {
    console.log("[createRelayerInstance] Using EthereumConfig/MainnetConfig");
    networkConfig = sdk.EthereumConfig || sdk.MainnetConfig;
  } else {
    console.error(`[createRelayerInstance] ❌ Unsupported chainId: ${chainId}`);
    throw new Error(
      `Unsupported network (chainId: ${chainId}). Please connect to Sepolia (11155111) or Ethereum Mainnet (1).`
    );
  }

  if (!networkConfig?.aclContractAddress) {
    console.error(`[createRelayerInstance] ❌ No config found for chainId ${chainId}`);
    throw new Error(`Relayer SDK configuration missing for chainId ${chainId}`);
  }

  console.log("[createRelayerInstance] Network config:", {
    aclContractAddress: networkConfig.aclContractAddress,
    chainId: networkConfig.chainId,
  });

  const cached = loadCachedKey(networkConfig.aclContractAddress);
  console.log("[createRelayerInstance] Cached keys:", cached ? "found" : "not found");

  console.log("[createRelayerInstance] Creating FHEVM instance...");
  const instance = await sdk.createInstance({
    ...networkConfig,
    network: provider,
    publicKey: cached?.publicKey,
    publicParams: cached?.publicParams,
  });
  console.log("[createRelayerInstance] ✅ FHEVM instance created");

  persistCachedKey(networkConfig.aclContractAddress, {
    publicKey: instance.getPublicKey(),
    publicParams: instance.getPublicParams(2048),
  });
  console.log("[createRelayerInstance] ✅ Keys cached");

  return instance;
}

export async function createFhevmInstance(params: CreateInstanceParams) {
  const { provider, chainId, signal } = params;
  throwIfAborted(signal);

  console.log(`[createFhevmInstance] Starting for chainId: ${chainId}`);

  if (chainId === Number(process.env.NEXT_PUBLIC_MOCK_CHAIN_ID ?? 31337)) {
    console.log("[createFhevmInstance] Using Mock mode (local Hardhat node)");
    return createMockInstance(chainId, signal);
  }

  console.log("[createFhevmInstance] Using Relayer SDK mode (real network)");
  return createRelayerInstance(provider, signal);
}

