#!/usr/bin/env node
import { mkdirSync, copyFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const clientsRoot = join(root, "..");
const outDir = join(root, "native");
mkdirSync(outDir, { recursive: true });

const build = spawnSync(
  "cargo",
  ["build", "-p", "termsh-core-napi", "--release"],
  { cwd: clientsRoot, stdio: "inherit" },
);
if (build.status !== 0) process.exit(build.status ?? 1);

const ext = process.platform === "win32" ? "dll" : process.platform === "darwin" ? "dylib" : "so";
const artifact = join(
  clientsRoot,
  "target/release",
  `libtermsh_core_napi.${ext}`,
);
const nodeName = "termsh-core-napi.node";
const dest = join(outDir, nodeName);

if (!existsSync(artifact)) {
  console.error(`Native artifact not found: ${artifact}`);
  process.exit(1);
}
copyFileSync(artifact, dest);
console.log(`Copied ${nodeName}`);
