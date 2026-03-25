#!/usr/bin/env node
/**
 * Cross-platform lint wrapper that fails on ANY diagnostic (info, warn, or error).
 *
 * Mirrors scripts/lint.sh but works on Windows too.
 */
import { execSync } from "node:child_process";

const args = process.argv.slice(2).join(" ");

let output = "";
let exitCode = 0;
try {
  output = execSync(`bunx @biomejs/biome@2.4.2 check ${args}`, {
    encoding: "utf-8",
    stdio: ["inherit", "pipe", "pipe"],
  });
  process.stdout.write(output);
} catch (err) {
  exitCode = err.status ?? 1;
  output = (err.stdout ?? "") + (err.stderr ?? "");
  process.stdout.write(output);
}

// Check if there are any diagnostics (errors, warnings, or infos)
if (/Found \d+ (error|info|warning)/.test(output)) {
  process.exit(1);
}

try {
  execSync("node scripts/check-desktop-git-env.js", { stdio: "inherit" });
} catch {
  // check-desktop-git-env failure is non-fatal on platforms where it may not apply
}

process.exit(exitCode);
