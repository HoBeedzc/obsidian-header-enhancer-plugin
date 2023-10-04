// reference https://github.com/lijyze/obsidian-state-switcher/blob/main/src/util.ts
import { Editor, EditorPosition, parseYaml, stringifyYaml } from "obsidian";

const YAML_REGEX = /^---\n(?:((?:.|\n)*?)\n)?---(?=\n|$)/;
const DEFAULT_YAML_SETTING = ['state on', 'start-level h2', 'max-level h1', 'start-number 1', 'separator .']

// Get yaml section
function getYaml(editor: Editor): string {
    const matchResult = editor.getValue().match(YAML_REGEX);

    return matchResult?.[0] ?? '';
}

export function getAutoNumberingYaml(editor: Editor): string {
    const yaml = getYaml(editor);
    const parsedYaml = parseYaml(yaml.slice(4, -4));

    return parsedYaml?.["header-auto-numbering"] ?? '';
}

export function setAutoNumberingYaml(editor: Editor, value: string[] = DEFAULT_YAML_SETTING): void {
    const yaml = getYaml(editor);
    const parsedYaml = parseYaml(yaml.slice(4, -4));

    if (parsedYaml) {
        parsedYaml["header-auto-numbering"] = value;
    }

    const newContent = `---\n${stringifyYaml(parsedYaml)}---`;
    const startPosition: EditorPosition = { line: 0, ch: 0 };
    const endPosition: EditorPosition = editor.offsetToPos(yaml.length);
    editor.replaceRange(newContent, startPosition, endPosition);
}