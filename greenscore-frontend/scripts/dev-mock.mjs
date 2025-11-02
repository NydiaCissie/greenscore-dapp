#!/usr/bin/env node

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function run(command, args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      env: { ...process.env, ...env },
      cwd: path.resolve(__dirname, ".."),
    });
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
      } else {
        resolve(undefined);
      }
    });
  });
}

async function main() {
  await run("node", ["./scripts/is-hardhat-node-running.mjs"]);
  await run("node", ["./scripts/genabi.mjs"]);
  await run(
    "next",
    ["dev"],
    {
      NODE_ENV: "development",
      NEXT_PUBLIC_FHEVM_MODE: "mock",
      NEXT_PUBLIC_MOCK_CHAIN_ID: "31337",
      NEXT_PUBLIC_MOCK_RPC_URL: process.env.HARDHAT_RPC_URL ?? "http://127.0.0.1:8545",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  );
}

main().catch((error) => {
  console.error("[dev:mock] failed:", error.message ?? error);
  process.exitCode = 1;
});

