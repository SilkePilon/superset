#!/usr/bin/env node
/**
 * Trigger a canary desktop release via GitHub Actions.
 *
 * Usage: node scripts/release-canary.js [commit]
 */
import { execSync } from "node:child_process";

function run(cmd) {
  return execSync(cmd, {
    encoding: "utf-8",
    stdio: ["inherit", "pipe", "pipe"],
  }).trim();
}

function exec(cmd) {
  execSync(cmd, { stdio: "inherit" });
}

const commit = process.argv[2] ?? "";
let refFlag = "";
let tempBranch = "";

if (commit) {
  const fullSha = run(`git rev-parse ${commit}`);
  tempBranch = `canary-release-${fullSha.slice(0, 9)}`;
  exec(`git push origin ${fullSha}:refs/heads/${tempBranch}`);
  refFlag = `--ref ${tempBranch}`;
}

exec(
  `gh workflow run release-desktop-canary.yml -f force_build=true ${refFlag}`,
);

// Give GitHub a moment to register the run
await new Promise((resolve) => setTimeout(resolve, 2000));

const url = run(
  'gh run list --workflow=release-desktop-canary.yml --limit=1 --json url -q ".[0].url"',
);
console.log(url);
