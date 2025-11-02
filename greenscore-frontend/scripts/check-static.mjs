#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.resolve(__dirname, "..");

const forbiddenMatchers = [
  /getServerSideProps/,
  /getInitialProps/,
  /getStaticProps/,
  /getStaticPaths/,
  /next\/headers/,
  /next\/cookies/,
  /next\/server/,
  /export\s+const\s+dynamic\s*=/,
  /unstable_cache/,
];

async function scanFile(filePath) {
  const content = await fs.readFile(filePath, "utf-8");
  const hits = forbiddenMatchers
    .map((pattern) => (pattern.test(content) ? pattern.source : null))
    .filter(Boolean);
  if (hits.length) {
    throw new Error(`Forbidden pattern(s) ${hits.join(", ")} detected in ${path.relative(root, filePath)}`);
  }
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const resolved = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "api") {
        throw new Error(`API routes are not allowed. Remove directory: ${path.relative(root, resolved)}`);
      }
      if (entry.name.startsWith("[")) {
        throw new Error(`Dynamic routes require explicit generateStaticParams. Remove or adjust: ${path.relative(root, resolved)}`);
      }
      await walk(resolved);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      await scanFile(resolved);
    }
  }
}

async function main() {
  await walk(path.join(root, "app"));
  console.log("[check:static] All checks passed.");
}

main().catch((error) => {
  console.error("[check:static] Failed:", error.message ?? error);
  process.exitCode = 1;
});


