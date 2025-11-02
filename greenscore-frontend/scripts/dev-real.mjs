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
  await run("node", ["./scripts/genabi.mjs"]);
  await run(
    "next",
    ["dev"],
    {
      NODE_ENV: "development",
      NEXT_PUBLIC_FHEVM_MODE: "relayer",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  );
}

main().catch((error) => {
  console.error("[dev] failed:", error.message ?? error);
  process.exitCode = 1;
});


