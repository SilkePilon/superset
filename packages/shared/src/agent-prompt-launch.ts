/**
 * Prompt transports define the small set of ways a CLI can receive prompt
 * payloads. Keep this enum intentionally small and add a new transport only
 * when a real agent requires it. Avoid arbitrary per-agent shell templates.
 */
export type PromptTransport = "argv" | "stdin";

function resolveDelimiter(prompt: string, randomId: string): string {
	let delimiter = `SUPERSET_PROMPT_${randomId.replaceAll("-", "")}`;
	while (prompt.includes(delimiter)) {
		delimiter = `${delimiter}_X`;
	}
	return delimiter;
}

function quoteSingleShell(value: string): string {
	return value.replaceAll("'", "'\\''");
}

function joinCommand(command: string, suffix?: string): string {
	return suffix ? `${command} ${suffix}` : command;
}

/**
 * Build a PowerShell -EncodedCommand string that safely passes multiline
 * prompts without any quoting/escaping issues between cmd.exe and PowerShell.
 */
function buildWindowsPromptCommand(
	prompt: string,
	command: string,
	suffix?: string,
): string {
	const suffixStr = suffix ? ` ${suffix}` : "";
	const psScript = `$p = @'\n${prompt}\n'@\n${command} $p${suffixStr}`;
	const encoded = Buffer.from(psScript, "utf16le").toString("base64");
	return `powershell -NoProfile -EncodedCommand ${encoded}`;
}

function buildWindowsFileCommand(
	filePath: string,
	command: string,
	suffix?: string,
): string {
	const suffixStr = suffix ? ` ${suffix}` : "";
	const normalizedPath = filePath.replaceAll("/", "\\");
	const psScript = `${command} (Get-Content -Raw '${normalizedPath}')${suffixStr}`;
	const encoded = Buffer.from(psScript, "utf16le").toString("base64");
	return `powershell -NoProfile -EncodedCommand ${encoded}`;
}

export function buildPromptCommandString({
	command,
	suffix,
	transport,
	prompt,
	randomId,
	platform,
}: {
	command: string;
	suffix?: string;
	transport: PromptTransport;
	prompt: string;
	randomId: string;
	platform?: NodeJS.Platform;
}): string {
	if ((platform ?? process.platform) === "win32") {
		return buildWindowsPromptCommand(prompt, command, suffix);
	}

	const delimiter = resolveDelimiter(prompt, randomId);
	const fullCommand = joinCommand(command, suffix);

	if (transport === "stdin") {
		return `${fullCommand} <<'${delimiter}'\n${prompt}\n${delimiter}`;
	}

	return `${command} "$(cat <<'${delimiter}'\n${prompt}\n${delimiter}\n)"${suffix ? ` ${suffix}` : ""}`;
}

export function buildPromptFileCommandString({
	command,
	suffix,
	transport,
	filePath,
	platform,
}: {
	command: string;
	suffix?: string;
	transport: PromptTransport;
	filePath: string;
	platform?: NodeJS.Platform;
}): string {
	if ((platform ?? process.platform) === "win32") {
		return buildWindowsFileCommand(filePath, command, suffix);
	}

	const escapedPath = quoteSingleShell(filePath);
	const fullCommand = joinCommand(command, suffix);

	if (transport === "stdin") {
		return `${fullCommand} < '${escapedPath}'`;
	}

	return `${command} "$(cat '${escapedPath}')"${suffix ? ` ${suffix}` : ""}`;
}
