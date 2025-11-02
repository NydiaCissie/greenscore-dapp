"use client";

import { useWalletContext } from "@/lib/wallet-context";
import { useFhevmContext } from "@/lib/fhevm-context";
import { useBrowserProvider, useSigner } from "@/hooks/useEthersProviders";
import { useGreenScoreContract } from "@/hooks/useGreenScoreContract";
import { useGreenScoreData } from "@/hooks/useGreenScoreData";
import { useGreenScoreActions } from "@/hooks/useGreenScoreActions";

export function useGreenScoreRuntime() {
  const wallet = useWalletContext();
  const fhevm = useFhevmContext();
  const provider = useBrowserProvider(wallet.provider);
  const account = wallet.accounts[0];
  const signer = useSigner(provider, account);
  const contract = useGreenScoreContract({ chainId: wallet.chainId, provider, signer });
  const data = useGreenScoreData({ reader: contract.reader, account, instance: fhevm.instance, signer });
  const actions = useGreenScoreActions({ contract: contract.writer, signer, instance: fhevm.instance, account });

  const ready = Boolean(
    wallet.status === "connected" &&
      contract.writer &&
      contract.address &&
      account &&
      signer &&
      fhevm.status === "ready",
  );

  return {
    wallet,
    fhevm,
    provider,
    account,
    signer,
    contract,
    data,
    actions,
    ready,
  };
}

