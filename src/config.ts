import { Editor } from "obsidian";
import { HeaderEnhancerSettings, AutoNumberingMode } from "./setting";
import { getAutoNumberingYaml } from "./utils";

export interface AutoNumberingConfig {
	state: boolean;
	startLevel: number;
	endLevel: number;
	startNumber: number;
	separator: string;
}

export function getAutoNumberingConfig(
	setting: HeaderEnhancerSettings,
	editor: Editor
): AutoNumberingConfig {
	const config: AutoNumberingConfig = {
		state: setting.autoNumberingMode !== AutoNumberingMode.OFF,
		startLevel: setting.startHeaderLevel,
		endLevel: setting.endHeaderLevel,
		startNumber: parseInt(setting.autoNumberingStartNumber),
		separator: setting.autoNumberingSeparator,
	};

	if (setting.autoNumberingMode === AutoNumberingMode.YAML_CONTROLLED) {
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
	}
	return config;
}
