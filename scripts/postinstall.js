#!/usr/bin/env node
/**
 * Cross-platform postinstall script.
 *
 * Mirrors scripts/postinstall.sh but works on Windows too.
 */
import { execSync } from "node:child_process";

// Prevent infinite recursion during postinstall
// electron-builder install-app-deps can trigger nested bun installs
// which would re-run postinstall, spawning hundreds of processes
if (process.env.SUPERSET_POSTINSTALL_RUNNING) {
  process.exit(0);
}

process.env.SUPERSET_POSTINSTALL_RUNNING = "1";

function run(cmd) {
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: "inherit", env: process.env });
}

// Run sherif for workspace validation
run("sherif");

// GitHub CI runs multiple Bun install jobs that do not need desktop native rebuilds.
if (process.env.CI) {
  process.exit(0);
}

// Install native dependencies for desktop app
run("bun run --filter=@superset/desktop install:deps");
