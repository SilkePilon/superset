import { describe, expect, it } from "bun:test";
import {
	buildAgentFileCommand,
	buildAgentPromptCommand,
} from "./agent-command";

describe("buildAgentPromptCommand", () => {
	it("adds `--` before codex prompt payload", () => {
		const command = buildAgentPromptCommand({
			prompt: "- Only modified file: runtime.ts",
			randomId: "1234-5678",
			agent: "codex",
			platform: "darwin",
		});

		expect(command).toContain(
			"model_supports_reasoning_summaries=true -- \"$(cat <<'SUPERSET_PROMPT_12345678'",
		);
		expect(command).toContain("- Only modified file: runtime.ts");
	});

	it("does not change non-codex commands", () => {
		const command = buildAgentPromptCommand({
			prompt: "hello",
			randomId: "abcd-efgh",
			agent: "claude",
			platform: "darwin",
		});

		expect(command).toStartWith(
			"claude --dangerously-skip-permissions \"$(cat <<'SUPERSET_PROMPT_abcdefgh'",
		);
	});

	it("uses Amp interactive stdin mode for prompt launches", () => {
		const command = buildAgentPromptCommand({
			prompt: "hello",
			randomId: "amp-1234",
			agent: "amp",
			platform: "darwin",
		});

		expect(command).toStartWith("amp <<'SUPERSET_PROMPT_amp1234'");
		expect(command).not.toContain("amp -x");
	});

	it("uses Amp interactive stdin mode for file launches", () => {
		const command = buildAgentFileCommand({
			filePath: ".superset/task-demo.md",
			agent: "amp",
			platform: "darwin",
		});

		expect(command).toBe("amp < '.superset/task-demo.md'");
	});

	it("uses pi interactive mode for prompt launches", () => {
		const command = buildAgentPromptCommand({
			prompt: "hello",
			randomId: "pi-1234",
			agent: "pi",
			platform: "darwin",
		});

		expect(command).toStartWith("pi \"$(cat <<'SUPERSET_PROMPT_pi1234'");
		expect(command).not.toContain("pi -p");
	});

	it("generates PowerShell EncodedCommand on Windows", () => {
		const command = buildAgentPromptCommand({
			prompt: "Fix the bug",
			randomId: "win-1234",
			agent: "claude",
			platform: "win32",
		});

		expect(command).toStartWith("powershell -NoProfile -EncodedCommand ");
		const encoded = command.replace("powershell -NoProfile -EncodedCommand ", "");
		const decoded = Buffer.from(encoded, "base64").toString("utf16le");
		expect(decoded).toContain("claude --dangerously-skip-permissions $p");
		expect(decoded).toContain("Fix the bug");
	});

	it("generates PowerShell file command on Windows", () => {
		const command = buildAgentFileCommand({
			filePath: "path/to/task.md",
			agent: "claude",
			platform: "win32",
		});

		expect(command).toStartWith("powershell -NoProfile -EncodedCommand ");
		const encoded = command.replace("powershell -NoProfile -EncodedCommand ", "");
		const decoded = Buffer.from(encoded, "base64").toString("utf16le");
		expect(decoded).toContain("Get-Content -Raw");
		expect(decoded).toContain("path\\to\\task.md");
	});
});
