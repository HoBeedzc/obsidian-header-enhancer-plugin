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
			const [key, value] = item.split(" ");
			switch (key) {
				case "state":
					config.state = value == "on" ? true : false;
					break;
				case "start-level":
					config.startLevel = parseInt(value[1]);
					break;
				case "end-level":
					config.endLevel = parseInt(value[1]);
					break;
				case "start-number":
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
