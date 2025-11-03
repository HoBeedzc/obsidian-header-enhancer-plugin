// Reference: https://github.com/lijyze/obsidian-state-switcher/blob/main/src/util.ts
import { Editor, EditorPosition, parseYaml, stringifyYaml } from "obsidian";

const YAML_REGEX = /^---\n(?:((?:.|\n)*?)\n)?---(?=\n|$)/;
const DEFAULT_YAML_SETTING = [
	"state on",
	"start-level h2",
	"end-level h6",
	"start-at 1",
	"separator .",
];

// Get yaml section
function getYaml(editor: Editor): string {
	const matchResult = editor.getValue().match(YAML_REGEX);

	return matchResult?.[0] ?? "";
}

export function getAutoNumberingYaml(editor: Editor): string {
	const yaml = getYaml(editor);
	const parsedYaml = parseYaml(yaml.slice(4, -4));

	return parsedYaml?.["header-auto-numbering"] ?? "";
}

export function setAutoNumberingYaml(
	editor: Editor,
	value: string[] = DEFAULT_YAML_SETTING
): void {
	const yaml = getYaml(editor);
	let parsedYaml = parseYaml(yaml.slice(4, -4));

	// If no YAML exists or parsing failed, create a new object
	if (!parsedYaml) {
		parsedYaml = {};
	}

	// Set or update the header-auto-numbering configuration
	parsedYaml["header-auto-numbering"] = value;

	const newContent = `---\n${stringifyYaml(parsedYaml)}---\n`;
	const startPosition: EditorPosition = { line: 0, ch: 0 };

	// Calculate end position: yaml.length + 1 to include the newline after "---"
	// This ensures we replace the entire YAML block including trailing newline
	let endOffset = yaml.length;
	if (yaml.length > 0) {
		// If YAML exists and there's a newline after it, include it in the replacement
		const contentAfterYaml = editor.getValue().substring(yaml.length, yaml.length + 1);
		if (contentAfterYaml === '\n') {
			endOffset += 1;
		}
	}
	const endPosition: EditorPosition = editor.offsetToPos(endOffset);

	editor.replaceRange(newContent, startPosition, endPosition);
}
