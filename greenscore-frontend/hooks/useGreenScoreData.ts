"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ethers, type JsonRpcSigner, type Contract } from "ethers";
import { ensureDecryptionSignature } from "@/fhevm/signature";

const BUCKET_COUNT = 5;

type HandlesPayload = {
  score: string;
  actions: string;
  pending: string;
  globalScore: string;
  globalActions: string;
  buckets: string[];
  leaderboard: string[];
  plainActionCount: number;
};

type DecryptedPayload = {
  score?: bigint;
  actions?: bigint;
  pending?: bigint;
  globalScore?: bigint;
  globalActions?: bigint;
  buckets: Array<bigint | undefined>;
  leaderboard: Array<bigint | undefined>;
};

function isZeroHandle(handle: string | undefined) {
  return !handle || handle === ethers.ZeroHash;
}

export function useGreenScoreData({
  reader,
  account,
  instance,
  signer,
}: {
  reader?: Contract;
  account?: string;
  instance: any;
  signer?: JsonRpcSigner;
}) {
  const contractAddress = typeof reader?.target === "string" ? (reader.target as `0x${string}`) : undefined;

  const handlesQuery = useQuery<HandlesPayload>({
    queryKey: ["greenscore-handles", contractAddress, account],
    enabled: Boolean(reader && account && contractAddress),
    refetchOnWindowFocus: false,
    queryFn: async () => {
      if (!reader || !account) throw new Error("Contract not ready");
      const [score, actions, pending, globalScore, globalActions, plainActionCount] = await Promise.all([
        reader.getEncryptedScore(account),
        reader.getEncryptedActionCount(account),
        reader.getEncryptedPendingRewards(account),
        reader.getEncryptedGlobalScore(),
        reader.getEncryptedGlobalActions(),
        reader.getPlainActionCount(account),
      ]);

      const buckets: string[] = [];
      const leaderboard: string[] = [];
      for (let i = 0; i < BUCKET_COUNT; i += 1) {
        buckets.push(await reader.getBucketAggregate(i));
        leaderboard.push(await reader.getLeaderboardSlot(i));
      }

      return {
        score,
        actions,
        pending,
        globalScore,
        globalActions,
        buckets,
        leaderboard,
        plainActionCount: Number(plainActionCount ?? 0),
      } satisfies HandlesPayload;
    },
  });

  const decryptQuery = useQuery<DecryptedPayload>({
    queryKey: [
      "greenscore-decrypt",
      handlesQuery.data?.score,
      handlesQuery.data?.actions,
      handlesQuery.data?.pending,
      handlesQuery.data?.globalScore,
      handlesQuery.data?.globalActions,
      handlesQuery.data?.buckets,
      contractAddress,
      account,
    ],
    enabled:
      Boolean(instance && signer && handlesQuery.data && contractAddress && account) &&
      !handlesQuery.isLoading,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      if (!instance || !signer || !handlesQuery.data || !contractAddress) {
        throw new Error("Missing prerequisites");
      }

      const signature = await ensureDecryptionSignature(instance, contractAddress, signer);

      const handles: Array<{ handle: string; contractAddress: string }> = [];
      const appendHandle = (handle?: string) => {
        if (handle && !isZeroHandle(handle)) {
          handles.push({ handle, contractAddress });
        }
      };

      appendHandle(handlesQuery.data.score);
      appendHandle(handlesQuery.data.actions);
      appendHandle(handlesQuery.data.pending);
      appendHandle(handlesQuery.data.globalScore);
      appendHandle(handlesQuery.data.globalActions);
      handlesQuery.data.buckets.forEach(appendHandle);
      handlesQuery.data.leaderboard.forEach(appendHandle);

      const result = handles.length
        ? await instance.userDecrypt(
            handles,
            signature.privateKey,
            signature.publicKey,
            signature.signature,
            signature.contractAddresses,
            signature.userAddress,
            signature.startTimestamp,
            signature.durationDays,
          )
        : {};

      const readValue = (handle?: string): bigint | undefined => {
        if (!handle || isZeroHandle(handle)) return undefined;
        const value = result[handle];
        if (value === undefined || value === null) return undefined;
        try {
          return BigInt(value);
        } catch {
          return undefined;
        }
      };

      return {
        score: readValue(handlesQuery.data.score),
        actions: readValue(handlesQuery.data.actions),
        pending: readValue(handlesQuery.data.pending),
        globalScore: readValue(handlesQuery.data.globalScore),
        globalActions: readValue(handlesQuery.data.globalActions),
        buckets: handlesQuery.data.buckets.map((handle) => readValue(handle)),
        leaderboard: handlesQuery.data.leaderboard.map((handle) => readValue(handle)),
      } satisfies DecryptedPayload;
    },
  });

  return useMemo(
    () => ({
      handles: handlesQuery.data,
      decrypted: decryptQuery.data,
      plainActionCount: handlesQuery.data?.plainActionCount ?? 0,
      isLoading: handlesQuery.isLoading || decryptQuery.isLoading,
      refetch: () => {
        void handlesQuery.refetch();
        void decryptQuery.refetch();
      },
    }),
    [handlesQuery, decryptQuery],
  );
}


