"use client";

import { useCallback, useState } from "react";
import { ethers, type JsonRpcSigner } from "ethers";
import { actionDefinitions, findActionDefinition, type GreenActionId } from "@/lib/actions";
import type { GreenScoreWriteContract } from "@/hooks/useGreenScoreContract";

type SubmitPayload = {
  actionId: GreenActionId;
  quantity: number;
  description?: string;
};

type UseGreenScoreActionsParams = {
  contract?: GreenScoreWriteContract;
  signer?: JsonRpcSigner;
  instance: any;
  account?: string;
};

export function useGreenScoreActions({ contract, signer, instance, account }: UseGreenScoreActionsParams) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | undefined>(undefined);

  const submitAction = useCallback(
    async ({ actionId, quantity, description }: SubmitPayload) => {
      if (!contract || !signer || !instance || !account) {
        throw new Error("Wallet or FHEVM not ready");
      }
      const normalizedQuantity = Math.max(1, Math.round(quantity));
      const definition = findActionDefinition(actionId);
      const weightedPoints = BigInt(Math.max(1, Math.round(normalizedQuantity * definition.weight)));
      const increment = BigInt(normalizedQuantity);
      const descriptionHash = description && description.trim().length > 0
        ? ethers.keccak256(ethers.toUtf8Bytes(description.trim()))
        : ethers.ZeroHash;

      setIsSubmitting(true);
      try {
        const contractAddress = await contract.getAddress();
        const pointsInput = instance.createEncryptedInput(contractAddress, account);
        pointsInput.add64(weightedPoints);
        const encryptedPoints = await pointsInput.encrypt();

        const countInput = instance.createEncryptedInput(contractAddress, account);
        countInput.add64(increment);
        const encryptedCount = await countInput.encrypt();

        const tx = await contract.submitAction(
          encryptedPoints.handles[0],
          encryptedPoints.inputProof,
          encryptedCount.handles[0],
          encryptedCount.inputProof,
          definition.bucket,
          descriptionHash,
          normalizedQuantity,
        );

        const receipt = await tx.wait();
        setLastTxHash(receipt?.hash ?? tx.hash);
        return receipt;
      } finally {
        setIsSubmitting(false);
      }
    },
    [account, contract, instance, signer],
  );

  const claimReward = useCallback(
    async (amount: bigint) => {
      if (!contract || !signer || !instance || !account) {
        throw new Error("Wallet or FHEVM not ready");
      }
      if (amount <= 0n) {
        throw new Error("Nothing to claim");
      }

      setIsClaiming(true);
      try {
        const contractAddress = await contract.getAddress();
        const input = instance.createEncryptedInput(contractAddress, account);
        input.add64(amount);
        const encrypted = await input.encrypt();
        const tx = await contract.claimReward(encrypted.handles[0], encrypted.inputProof);
        const receipt = await tx.wait();
        setLastTxHash(receipt?.hash ?? tx.hash);
        return receipt;
      } finally {
        setIsClaiming(false);
      }
    },
    [account, contract, instance, signer],
  );

  return {
    actionDefinitions,
    submitAction,
    claimReward,
    isSubmitting,
    isClaiming,
    lastTxHash,
  };
}

