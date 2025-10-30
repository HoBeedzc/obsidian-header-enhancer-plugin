import { Editor } from "obsidian";
import { HeaderEnhancerSettings, AutoNumberingMode, YamlFallbackMode } from "./setting";
import { getAutoNumberingYaml } from "./utils";
import { analyzeHeaderLevels } from "./core";

export interface AutoNumberingConfig {
	state: boolean;
	startLevel: number;
	endLevel: number;
	startNumber: number;
	separator: string;
}

export function getAutoNumberingConfig(
	setting: HeaderEnhancerSettings,
	editor: Editor,
	getDocumentState?: (filePath: string) => boolean,
	currentFilePath?: string
): AutoNumberingConfig {
	let config: AutoNumberingConfig = {
		state: setting.autoNumberingMode !== AutoNumberingMode.OFF,
		startLevel: setting.startHeaderLevel,
		endLevel: setting.endHeaderLevel,
		startNumber: parseInt(setting.autoNumberingStartNumber),
		separator: setting.autoNumberingSeparator,
	};

	// Check global enablement first
	if (!setting.globalAutoNumberingEnabled) {
		config.state = false;
		return config;
	}

	// Check per-document state if available
	if (getDocumentState && currentFilePath) {
		const documentEnabled = getDocumentState(currentFilePath);
		if (!documentEnabled) {
			config.state = false;
			return config;
		}
	}

	// YAML配置优先级最高
	if (setting.autoNumberingMode === AutoNumberingMode.YAML_CONTROLLED) {
		config = applyYamlConfig(config, editor, setting);
	}
	// 自动检测模式
	else if (setting.isAutoDetectHeaderLevel && setting.autoNumberingMode === AutoNumberingMode.ON) {
		const content = editor.getValue();
		const analysis = analyzeHeaderLevels(content);
		
		if (!analysis.isEmpty) {
			config.startLevel = analysis.minLevel;
			config.endLevel = analysis.maxLevel;
		}
		// 如果文档无标题，保持默认配置
	}

	return config;
}

function applyYamlConfig(config: AutoNumberingConfig, editor: Editor, setting: HeaderEnhancerSettings): AutoNumberingConfig {
	const yaml = getAutoNumberingYaml(editor);

	// If no YAML exists, use fallback mode
	if (yaml === "") {
		if (setting.yamlFallbackMode === YamlFallbackMode.NO_NUMBERING) {
			// No numbering for files without YAML
			config.state = false;
		} else {
			// Use YAML default values
			config.state = true;
			config.startLevel = setting.yamlDefaultStartLevel;
			config.endLevel = setting.yamlDefaultEndLevel;
			config.startNumber = parseInt(setting.yamlDefaultStartNumber);
			config.separator = setting.yamlDefaultSeparator;
		}
		return config;
	}

	// YAML exists, parse and apply it
	let hasDeprecatedKeys = false;
	const deprecatedKeys: string[] = [];

	for (const item of yaml) {
		const [key, ...valueParts] = item.split(" ");
		const value = valueParts.join(" "); // Handle values with spaces
		switch (key) {
			case "state":
				config.state = value === "on";
				break;
			case "start-level":
				// Parse "h2" -> 2
				config.startLevel = parseInt(value.substring(1));
				break;
			case "first-level": // @deprecated since v0.4.2 - Use "start-level" instead
				hasDeprecatedKeys = true;
				deprecatedKeys.push("first-level");
				// Parse "h2" -> 2
				config.startLevel = parseInt(value.substring(1));
				break;
			case "end-level":
				// Parse "h6" -> 6
				config.endLevel = parseInt(value.substring(1));
				break;
			case "max": // @deprecated since v0.4.2 - Use "end-level" instead
				hasDeprecatedKeys = true;
				deprecatedKeys.push("max");
				// Keep backward compatibility: max levels, not end level
				config.endLevel = config.startLevel + parseInt(value) - 1;
				break;
			case "start-at":
				config.startNumber = parseInt(value);
				break;
			case "separator":
				config.separator = value;
				break;
		}
	}

	// Log deprecation warning (will be removed in future version)
	if (hasDeprecatedKeys) {
		console.warn(
			`[Header Enhancer] Deprecated YAML keys detected: ${deprecatedKeys.join(", ")}. ` +
			`Please update to new format: use "start-level" instead of "first-level", ` +
			`and "end-level" instead of "max". The old format will be removed in a future version.`
		);
	}

	return config;
}
