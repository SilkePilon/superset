import { describe, expect, it } from "bun:test";
import {
	buildPromptCommandString,
	buildPromptFileCommandString,
} from "./agent-prompt-launch";

describe("buildPromptCommandString (win32)", () => {
	it("generates a PowerShell EncodedCommand on Windows", () => {
		const command = buildPromptCommandString({
			prompt: "Fix the bug in main.ts",
			randomId: "1234-5678",
			command: "claude --dangerously-skip-permissions",
			transport: "argv",
			platform: "win32",
		});

		expect(command).toStartWith("powershell -NoProfile -EncodedCommand ");
		// Decode and verify the embedded script
		const encoded = command.replace(
			"powershell -NoProfile -EncodedCommand ",
			"",
		);
		const decoded = Buffer.from(encoded, "base64").toString("utf16le");
		expect(decoded).toContain("claude --dangerously-skip-permissions $p");
		expect(decoded).toContain("Fix the bug in main.ts");
	});

	it("includes suffix in PowerShell script on Windows", () => {
		const command = buildPromptCommandString({
			prompt: "hello",
			randomId: "abc",
			command: "gemini",
			suffix: "--yolo",
			transport: "argv",
			platform: "win32",
		});

		const encoded = command.replace(
			"powershell -NoProfile -EncodedCommand ",
			"",
		);
		const decoded = Buffer.from(encoded, "base64").toString("utf16le");
		expect(decoded).toContain("gemini $p --yolo");
	});

	it("handles multiline prompts on Windows", () => {
		const prompt = "Line 1\nLine 2\nLine 3";
		const command = buildPromptCommandString({
			prompt,
			randomId: "multi",
			command: "claude",
			transport: "argv",
			platform: "win32",
		});

		const encoded = command.replace(
			"powershell -NoProfile -EncodedCommand ",
			"",
		);
		const decoded = Buffer.from(encoded, "base64").toString("utf16le");
		expect(decoded).toContain("Line 1\nLine 2\nLine 3");
	});
});

describe("buildPromptFileCommandString (win32)", () => {
	it("generates a PowerShell EncodedCommand with Get-Content on Windows", () => {
		const command = buildPromptFileCommandString({
			filePath: ".superset/task.md",
			command: "claude --dangerously-skip-permissions",
			transport: "argv",
			platform: "win32",
		});

		expect(command).toStartWith("powershell -NoProfile -EncodedCommand ");
		const encoded = command.replace(
			"powershell -NoProfile -EncodedCommand ",
			"",
		);
		const decoded = Buffer.from(encoded, "base64").toString("utf16le");
		expect(decoded).toContain("Get-Content -Raw");
		expect(decoded).toContain(".superset\\task.md");
	});

	it("normalizes forward slashes to backslashes on Windows", () => {
		const command = buildPromptFileCommandString({
			filePath: "path/to/file.md",
			command: "claude",
			transport: "argv",
			platform: "win32",
		});

		const encoded = command.replace(
			"powershell -NoProfile -EncodedCommand ",
			"",
		);
		const decoded = Buffer.from(encoded, "base64").toString("utf16le");
		expect(decoded).toContain("path\\to\\file.md");
		expect(decoded).not.toContain("path/to/file.md");
	});

	it("includes suffix in file command on Windows", () => {
		const command = buildPromptFileCommandString({
			filePath: "task.md",
			command: "gemini",
			suffix: "--yolo",
			transport: "argv",
			platform: "win32",
		});

		const encoded = command.replace(
			"powershell -NoProfile -EncodedCommand ",
			"",
		);
		const decoded = Buffer.from(encoded, "base64").toString("utf16le");
		expect(decoded).toContain("--yolo");
	});
});

describe("buildPromptCommandString (unix)", () => {
	it("uses heredoc for argv transport", () => {
		const command = buildPromptCommandString({
			prompt: "hello",
			randomId: "1234",
			command: "claude",
			transport: "argv",
			platform: "darwin",
		});

		expect(command).toContain("$(cat <<'SUPERSET_PROMPT_1234'");
		expect(command).toContain("hello");
	});

	it("uses stdin redirect for stdin transport", () => {
		const command = buildPromptCommandString({
			prompt: "hello",
			randomId: "1234",
			command: "amp",
			transport: "stdin",
			platform: "darwin",
		});

		expect(command).toStartWith("amp <<'SUPERSET_PROMPT_1234'");
	});
});

describe("buildPromptFileCommandString (unix)", () => {
	it("uses cat for argv transport", () => {
		const command = buildPromptFileCommandString({
			filePath: "task.md",
			command: "claude",
			transport: "argv",
			platform: "darwin",
		});

		expect(command).toContain("$(cat 'task.md')");
	});

	it("uses stdin redirect for stdin transport", () => {
		const command = buildPromptFileCommandString({
			filePath: "task.md",
			command: "amp",
			transport: "stdin",
			platform: "darwin",
		});

		expect(command).toBe("amp < 'task.md'");
	});
});
