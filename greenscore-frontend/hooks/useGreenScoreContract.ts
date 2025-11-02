"use client";

import { useMemo } from "react";
import {
  Contract,
  ethers,
  type BrowserProvider,
  type ContractRunner,
  type JsonRpcSigner,
  type ContractTransactionResponse,
} from "ethers";
import { GreenScoreABI } from "@/abi/GreenScoreABI";
import { GreenScoreAddresses } from "@/abi/GreenScoreAddresses";

export type GreenScoreReadContract = Contract & {
  getEncryptedScore(account: string): Promise<string>;
  getEncryptedActionCount(account: string): Promise<string>;
  getEncryptedPendingRewards(account: string): Promise<string>;
  getEncryptedGlobalScore(): Promise<string>;
  getEncryptedGlobalActions(): Promise<string>;
  getBucketAggregate(bucketIndex: number): Promise<string>;
  getLeaderboardSlot(slotIndex: number): Promise<string>;
  getPlainActionCount(account: string): Promise<number>;
};

export type GreenScoreWriteContract = Contract & {
  submitAction(
    encryptedPoints: string,
    pointProof: string,
    encryptedActions: string,
    actionProof: string,
    bucketIndex: number,
    descriptionHash: string,
    plainActionIncrement: number,
  ): Promise<ContractTransactionResponse>;
  claimReward(encryptedAmount: string, proof: string): Promise<ContractTransactionResponse>;
};

type ContractBundle = {
  address?: `0x${string}`;
  reader?: GreenScoreReadContract;
  writer?: GreenScoreWriteContract;
  chainName?: string;
};

function resolveAddress(chainId?: number) {
  if (!chainId) return undefined;
  const entry = GreenScoreAddresses[String(chainId) as keyof typeof GreenScoreAddresses];
  const address = entry?.address as string | undefined;
  if (!address || address === ethers.ZeroAddress) {
    return undefined;
  }
  return { address: address as `0x${string}`, chainName: entry?.chainName as string | undefined };
}

export function useGreenScoreContract({
  chainId,
  provider,
  signer,
}: {
  chainId?: number;
  provider?: BrowserProvider;
  signer?: JsonRpcSigner;
}): ContractBundle {
  return useMemo(() => {
    const resolved = resolveAddress(chainId);
    if (!resolved) {
      return { address: undefined, chainName: undefined };
    }

    const reader: GreenScoreReadContract | undefined = provider
      ? (new Contract(resolved.address, GreenScoreABI.abi, provider as ContractRunner) as GreenScoreReadContract)
      : undefined;

    const writer: GreenScoreWriteContract | undefined = signer
      ? (new Contract(resolved.address, GreenScoreABI.abi, signer) as GreenScoreWriteContract)
      : undefined;

    return {
      address: resolved.address,
      chainName: resolved.chainName,
      reader,
      writer,
    };
  }, [chainId, provider, signer]);
}

