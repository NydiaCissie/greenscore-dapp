import type { JsonRpcSigner } from "ethers";
import { clearDecryptionSignature } from "@/store/decryption-store";

type SignaturePayload = {
  privateKey: string;
  publicKey: string;
  signature: string;
  contractAddresses: string[];
  userAddress: string;
  startTimestamp: number;
  durationDays: number;
};

/**
 * Generate a fresh decryption signature for each decrypt operation.
 * No caching - user must sign every time they want to decrypt.
 */
export async function ensureDecryptionSignature(
  instance: any,
  contractAddress: string,
  signer: JsonRpcSigner,
): Promise<SignaturePayload> {
  const userAddress = (await signer.getAddress()) as `0x${string}`;

  // Always generate a new keypair and signature (no caching)
  const { publicKey, privateKey } = instance.generateKeypair();
  const startTimestamp = Math.floor(Date.now() / 1000);
  const durationDays = 365;
  const contractAddresses = [contractAddress];

  const eip712 = instance.createEIP712(publicKey, contractAddresses, startTimestamp, durationDays);

  const signature = await signer.signTypedData(
    eip712.domain,
    { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
    eip712.message,
  );

  const payload: SignaturePayload = {
    privateKey,
    publicKey,
    signature,
    contractAddresses,
    userAddress,
    startTimestamp,
    durationDays,
  };

  // No persistence - signature is only valid for this decrypt operation

  return payload;
}

export function dropDecryptionSignature(account: string) {
  clearDecryptionSignature(account);
}


