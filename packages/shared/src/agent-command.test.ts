import { describe, expect, it } from "bun:test";
import { buildAgentFileCommand, buildAgentPromptCommand } from "./agent-command";

describe("buildAgentPromptCommand", () => {
	it("adds `--` before codex prompt payload", () => {
		const command = buildAgentPromptCommand({
			prompt: "- Only modified file: runtime.ts",
			randomId: "1234-5678",
			agent: "codex",
			platform: "linux",
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
			platform: "linux",
		});

		expect(command).toStartWith(
			"claude --dangerously-skip-permissions \"$(cat <<'SUPERSET_PROMPT_abcdefgh'",
		);
	});

	it("uses pi interactive mode for prompt launches", () => {
		const command = buildAgentPromptCommand({
			prompt: "hello",
			randomId: "pi-1234",
			agent: "pi",
			platform: "linux",
		});

		expect(command).toStartWith("pi \"$(cat <<'SUPERSET_PROMPT_pi1234'");
		expect(command).not.toContain("pi -p");
	});
});

describe("buildAgentPromptCommand (win32)", () => {
	it("generates PowerShell EncodedCommand on Windows", () => {
		const command = buildAgentPromptCommand({
			prompt: "hello",
			randomId: "abcd-efgh",
			agent: "copilot",
			platform: "win32",
		});

		expect(command).toStartWith("powershell -NoProfile -EncodedCommand ");
		// Decode and verify the PowerShell script contains the prompt and command
		const base64 = command.replace("powershell -NoProfile -EncodedCommand ", "");
		const decoded = Buffer.from(base64, "base64").toString("utf16le");
		expect(decoded).toContain("copilot -i --allow-all $p --yolo");
		expect(decoded).toContain("hello");
		expect(decoded).toContain("@'");
	});

	it("handles multiline prompts on Windows", () => {
		const command = buildAgentPromptCommand({
			prompt: "line1\nline2\nline3",
			randomId: "1234-5678",
			agent: "claude",
			platform: "win32",
		});

		expect(command).toStartWith("powershell -NoProfile -EncodedCommand ");
		const base64 = command.replace("powershell -NoProfile -EncodedCommand ", "");
		const decoded = Buffer.from(base64, "base64").toString("utf16le");
		expect(decoded).toContain("line1\nline2\nline3");
		expect(decoded).toContain("claude --dangerously-skip-permissions $p");
	});
});

describe("buildAgentFileCommand (win32)", () => {
	it("generates PowerShell EncodedCommand for file reading on Windows", () => {
		const command = buildAgentFileCommand({
			filePath: ".superset/task-my-task.md",
			agent: "copilot",
			platform: "win32",
		});

		expect(command).toStartWith("powershell -NoProfile -EncodedCommand ");
		const base64 = command.replace("powershell -NoProfile -EncodedCommand ", "");
		const decoded = Buffer.from(base64, "base64").toString("utf16le");
		expect(decoded).toContain("Get-Content -Raw");
		expect(decoded).toContain(".superset\\task-my-task.md");
		expect(decoded).toContain("copilot -i --allow-all");
	});

	it("uses bash cat syntax on non-Windows", () => {
		const command = buildAgentFileCommand({
			filePath: ".superset/task.md",
			agent: "claude",
			platform: "linux",
		});

		expect(command).toContain("$(cat");
	});
});
