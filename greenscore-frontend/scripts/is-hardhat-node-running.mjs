#!/usr/bin/env node

const url = process.env.HARDHAT_RPC_URL ?? "http://127.0.0.1:8545";

async function main() {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "eth_chainId", params: [], id: 1 }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    if (!payload?.result) {
      throw new Error("无效的链响应");
    }

    console.log(`[is-hardhat-node-running] Connected to ${url}, chainId=${parseInt(payload.result, 16)}`);

    const metadataResp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "fhevm_relayer_metadata", params: [], id: 2 }),
    });

    if (metadataResp.ok) {
      console.log("[is-hardhat-node-running] FHEVM relayer metadata detected.");
    } else {
      console.warn("[is-hardhat-node-running] 未返回 fhevm_relayer_metadata，继续运行。");
    }
  } catch (error) {
    console.error(`[is-hardhat-node-running] 无法连接 ${url}:`, error?.message ?? error);
    process.exitCode = 1;
  }
}

main();


