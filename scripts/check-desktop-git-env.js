#!/usr/bin/env node
/**
 * Cross-platform desktop-git-env check.
 *
 * Mirrors scripts/check-desktop-git-env.sh but works on Windows too.
 * Uses ripgrep (rg) if available, otherwise silently skips.
 */
import { execSync } from "node:child_process";

const TARGET_DIR = "apps/desktop/src";
let failures = false;

function reportViolation(message, pattern, globs = []) {
  const globArgs = globs.map((g) => `--glob ${g}`).join(" ");
  const cmd = `rg -n -U --pcre2 ${JSON.stringify(pattern)} ${TARGET_DIR} ${globArgs}`;
  try {
    const output = execSync(cmd, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    if (output.trim()) {
      console.log(message);
      console.log(output);
      console.log();
      failures = true;
    }
  } catch {
    // rg returns non-zero when no matches found — that's fine
  }
}

// Verify rg is available
try {
  execSync("rg --version", { stdio: "pipe" });
} catch {
  console.log(
    "[check-desktop-git-env] ripgrep (rg) not found, skipping checks",
  );
  process.exit(0);
}

reportViolation(
  "[desktop-git-env] Direct runtime imports from simple-git are forbidden. Use getSimpleGitWithShellPath from workspaces/utils/git-client.ts.",
  "^import(?!\\\\s+type\\\\b).*['\"]simple-git['\"]",
  [
    "!**/*.test.ts",
    "!apps/desktop/src/lib/trpc/routers/workspaces/utils/git-client.ts",
  ],
);

reportViolation(
  "[desktop-git-env] Direct simpleGit(...) construction is forbidden outside git-client.ts.",
  "\\\\bsimpleGit\\\\(",
  [
    "!**/*.test.ts",
    "!apps/desktop/src/lib/trpc/routers/workspaces/utils/git-client.ts",
  ],
);

reportViolation(
  "[desktop-git-env] Raw execFile/execFileAsync git calls are forbidden. Use execGitWithShellPath from workspaces/utils/git-client.ts.",
  "\\\\bexecFile(?:Async)?\\\\(\\\\s*['\"]git['\"]",
  [
    "!**/*.test.ts",
    "!apps/desktop/src/lib/trpc/routers/workspaces/utils/git-client.ts",
  ],
);

reportViolation(
  '[desktop-git-env] execWithShellEnv("git", ...) is forbidden. Use execGitWithShellPath from workspaces/utils/git-client.ts.',
  "\\\\bexecWithShellEnv\\\\(\\\\s*['\"]git['\"]",
  ["!**/*.test.ts"],
);

if (failures) {
  process.exit(1);
}
