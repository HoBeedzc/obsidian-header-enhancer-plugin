import { Editor } from "obsidian";
import { HeaderEnhancerSettings, AutoNumberingMode } from "./setting";
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
		config = applyYamlConfig(config, editor);
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

function applyYamlConfig(config: AutoNumberingConfig, editor: Editor): AutoNumberingConfig {
	const yaml = getAutoNumberingYaml(editor);
	if (yaml === "") return config;

	for (const item of yaml) {
		const [key, ...valueParts] = item.split(" ");
		const value = valueParts.join(" "); // Handle values with spaces
		switch (key) {
			case "state":
				config.state = value === "on";
				break;
			case "first-level":
				// Parse "h2" -> 2
				config.startLevel = parseInt(value.substring(1));
				break;
			case "max":
				// This is max levels, not end level
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
	return config;
}
