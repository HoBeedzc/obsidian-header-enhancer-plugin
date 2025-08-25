import { App, PluginSettingTab, Setting, Notice } from "obsidian";
import HeaderEnhancerPlugin from "./main";
import { I18n } from './i18n';

export enum AutoNumberingMode {
	OFF = "off",
	ON = "on", 
	YAML_CONTROLLED = "yaml"
}

export interface HeaderEnhancerSettings {
	language: string;
	showOnStatusBar: boolean;
	isAutoDetectHeaderLevel: boolean;
	startHeaderLevel: number;
	endHeaderLevel: number;
	autoNumberingMode: AutoNumberingMode;
	autoNumberingStartNumber: string;
	autoNumberingSeparator: string;
	autoNumberingHeaderSeparator: string;
	updateBacklinks: boolean;
	isSeparateTitleFont: boolean;
	titleFontFamily: string;
	titleFontSize: string;
}

export const DEFAULT_SETTINGS: HeaderEnhancerSettings = {
	language: "en",
	showOnStatusBar: true,
	isAutoDetectHeaderLevel: false, // TODO: auto detect header level is not available now
	startHeaderLevel: 1,
	endHeaderLevel: 6,
	autoNumberingMode: AutoNumberingMode.ON,
	autoNumberingStartNumber: "1",
	autoNumberingSeparator: ".",
	autoNumberingHeaderSeparator: "\t",
	updateBacklinks: false,
	isSeparateTitleFont: true,
	titleFontFamily: "inherit",
	titleFontSize: "inherit",
};

export class HeaderEnhancerSettingTab extends PluginSettingTab {
	plugin: HeaderEnhancerPlugin;
	private formatPreviewSetting: Setting | null = null;

	constructor(app: App, plugin: HeaderEnhancerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		const i18n = I18n.getInstance();

		containerEl.empty();
		// 重置格式预览引用，因为 empty() 会清空所有元素
		this.formatPreviewSetting = null;

		containerEl.createEl("h1", { text: i18n.t("settings.title") });

		containerEl.createEl("h2", { text: i18n.t("settings.general") });
		new Setting(containerEl)
			.setName(i18n.t("settings.language.name"))
			.setDesc(i18n.t("settings.language.desc"))
			.addDropdown((dropdown) => {
				dropdown.addOption("en", "English");
				dropdown.addOption("zh", "中文");
				dropdown.setValue(this.plugin.settings.language);
				dropdown.onChange(async (value) => {
					this.plugin.settings.language = value;
					i18n.setLanguage(value);
					await this.plugin.saveSettings();
					this.plugin.handleShowStateBarChange(); // Refresh status bar with new language
					this.display(); // Refresh the settings page
				});
			});
		new Setting(containerEl)
			.setName(i18n.t("settings.statusBar.name"))
			.setDesc(i18n.t("settings.statusBar.desc"))
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.showOnStatusBar)
					.onChange(async (value) => {
						this.plugin.settings.showOnStatusBar = value;
						await this.plugin.saveSettings();
						this.plugin.handleShowStateBarChange();
					});
			});

		containerEl.createEl("h2", { text: i18n.t("settings.autoNumbering.title") });
		new Setting(containerEl)
			.setName(i18n.t("settings.autoNumbering.mode.name"))
			.setDesc(i18n.t("settings.autoNumbering.mode.desc"))
			.addDropdown((dropdown) => {
				dropdown.addOption(AutoNumberingMode.OFF, i18n.t("settings.autoNumbering.mode.off"));
				dropdown.addOption(AutoNumberingMode.ON, i18n.t("settings.autoNumbering.mode.on"));
				dropdown.addOption(AutoNumberingMode.YAML_CONTROLLED, i18n.t("settings.autoNumbering.mode.yaml"));
				dropdown.setValue(this.plugin.settings.autoNumberingMode);
				dropdown.onChange(async (value) => {
					this.plugin.settings.autoNumberingMode = value as AutoNumberingMode;
					await this.plugin.saveSettings();
					this.plugin.handleShowStateBarChange();
					this.display();
				});
			});
		new Setting(containerEl)
			.setName(i18n.t("settings.autoNumbering.headerLevel.name"))
			.setDesc(i18n.t("settings.autoNumbering.headerLevel.desc"))
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.isAutoDetectHeaderLevel)
					.onChange(async (value) => {
						this.plugin.settings.isAutoDetectHeaderLevel = value;
						await this.plugin.saveSettings();
						this.display();
					})
					.setDisabled(this.plugin.settings.autoNumberingMode === AutoNumberingMode.YAML_CONTROLLED);
			})
			.addDropdown((dropdown) => {
				dropdown.addOption("1", "H1");
				dropdown.addOption("2", "H2");
				dropdown.addOption("3", "H3");
				dropdown.addOption("4", "H4");
				dropdown.addOption("5", "H5");
				dropdown.addOption("6", "H6");
				dropdown.setValue(
					this.plugin.settings.startHeaderLevel.toString()
				);
				dropdown.setDisabled(this.plugin.settings.isAutoDetectHeaderLevel || this.plugin.settings.autoNumberingMode === AutoNumberingMode.YAML_CONTROLLED);
				dropdown.onChange(async (value) => {
					if (this.checkStartLevel(parseInt(value, 10))) {
						this.plugin.settings.startHeaderLevel = parseInt(value, 10);
						await this.plugin.saveSettings();
						this.updateFormatPreview();
					} else {
						new Notice(
							i18n.t("settings.autoNumbering.startLevelError")
						);
						// 恢复到原来的设置值
						dropdown.setValue(this.plugin.settings.startHeaderLevel.toString());
					}
				});
			})
			.addDropdown((dropdown) => {
				dropdown.addOption("1", "H1");
				dropdown.addOption("2", "H2");
				dropdown.addOption("3", "H3");
				dropdown.addOption("4", "H4");
				dropdown.addOption("5", "H5");
				dropdown.addOption("6", "H6");
				dropdown.setValue(
					this.plugin.settings.endHeaderLevel.toString()
				);
				dropdown.setDisabled(this.plugin.settings.isAutoDetectHeaderLevel || this.plugin.settings.autoNumberingMode === AutoNumberingMode.YAML_CONTROLLED);
				dropdown.onChange(async (value) => {
					if (this.checkEndLevel(parseInt(value, 10))) {
						this.plugin.settings.endHeaderLevel = parseInt(
							value,
							10
						);
						await this.plugin.saveSettings();
						this.updateFormatPreview();
					} else {
						new Notice(
							i18n.t("settings.autoNumbering.endLevelError")
						);
						// 恢复到原来的设置值
						dropdown.setValue(this.plugin.settings.endHeaderLevel.toString());
					}
				});
			});
		new Setting(containerEl)
			.setName(i18n.t("settings.autoNumbering.startNumber.name"))
			.setDesc(i18n.t("settings.autoNumbering.startNumber.desc"))
			.addDropdown((dropdown) => {
				dropdown.addOption("0", "0");
				dropdown.addOption("1", "1");
				dropdown.setValue(this.plugin.settings.autoNumberingStartNumber);
				dropdown.setDisabled(this.plugin.settings.autoNumberingMode === AutoNumberingMode.YAML_CONTROLLED);
				dropdown.onChange(async (value) => {
					this.plugin.settings.autoNumberingStartNumber = value;
					await this.plugin.saveSettings();
					this.updateFormatPreview();
				});
			});
		new Setting(containerEl)
			.setName(i18n.t("settings.autoNumbering.separator.name"))
			.setDesc(i18n.t("settings.autoNumbering.separator.desc"))
			.addDropdown((dropdown) => {
				dropdown.addOption(".", ".");
				dropdown.addOption(",", ",");
				dropdown.addOption("-", "-");
				dropdown.addOption("/", "/");
				dropdown.setValue(this.plugin.settings.autoNumberingSeparator);
				dropdown.setDisabled(this.plugin.settings.autoNumberingMode === AutoNumberingMode.YAML_CONTROLLED);
				dropdown.onChange(async (value) => {
					this.plugin.settings.autoNumberingSeparator = value;
					await this.plugin.saveSettings();
					this.updateFormatPreview();
				});
			});
		new Setting(containerEl)
			.setName(i18n.t("settings.autoNumbering.headerSeparator.name"))
			.setDesc(i18n.t("settings.autoNumbering.headerSeparator.desc"))
			.addDropdown((dropdown) => {
				dropdown.addOption("\t", "Tab");
				dropdown.addOption(" ", "Space");
				dropdown.setValue(
					this.plugin.settings.autoNumberingHeaderSeparator
				);
				dropdown.setDisabled(this.plugin.settings.autoNumberingMode === AutoNumberingMode.YAML_CONTROLLED);
				dropdown.onChange(async (value) => {
					if (this.checkHeaderSeparator(value)) {
						this.plugin.settings.autoNumberingHeaderSeparator =
							value;
						await this.plugin.saveSettings();
					} else {
						new Notice(i18n.t("settings.autoNumbering.headerSeparator.error"));
					}
				});
			});
		new Setting(containerEl)
			.setName(i18n.t("settings.autoNumbering.updateBacklinks.name"))
			.setDesc(i18n.t("settings.autoNumbering.updateBacklinks.desc"))
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.updateBacklinks)
					.onChange(async (value) => {
						this.plugin.settings.updateBacklinks = value;
						await this.plugin.saveSettings();
					});
			});
		this.formatPreviewSetting = new Setting(containerEl).setName(
			i18n.t("settings.autoNumbering.format.name") + ": " + this.getFormatPreview()
		);

		containerEl.createEl("h2", { text: i18n.t("settings.font.title") });
		new Setting(containerEl)
			.setName(i18n.t("settings.font.separate.name"))
			.setDesc(i18n.t("settings.font.separate.desc"))
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.isSeparateTitleFont)
					.onChange(async () => {
						new Notice(i18n.t("settings.font.separate.notice"));
					});
			});
		new Setting(containerEl)
			.setName(i18n.t("settings.font.family.name"))
			.setDesc(i18n.t("settings.font.family.desc"))
			.addText((text) =>
				text
					.setPlaceholder(i18n.t("settings.font.family.placeholder"))
					.setValue(this.plugin.settings.titleFontFamily)
					.onChange(async (value) => {
						this.plugin.settings.titleFontFamily = value;
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName(i18n.t("settings.font.size.name"))
			.setDesc(i18n.t("settings.font.size.desc"))
			.addText((text) =>
				text
					.setPlaceholder(i18n.t("settings.font.size.placeholder"))
					.setValue(this.plugin.settings.titleFontSize)
					.onChange(async (value) => {
						this.plugin.settings.titleFontSize = value;
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.addButton((button) => {
				button.setButtonText(i18n.t("settings.resetSettings.name")).onClick(async () => {
					if (
						confirm(
							i18n.t("settings.resetSettings.confirm")
						)
					) {
						this.plugin.settings = DEFAULT_SETTINGS;
						await this.plugin.saveSettings();
						this.display();
					}
				});
			});

		containerEl.createEl("h2", { text: i18n.t("settings.moreInfo") });
		containerEl.createEl("p", { text: i18n.t("settings.author") }).createEl("a", {
			text: "Hobee Liu",
			href: "https://github.com/HoBeedzc",
		});
		containerEl.createEl("p", { text: i18n.t("settings.license") }).createEl("a", {
			text: "MIT",
			href: "https://github.com/HoBeedzc/obsidian-header-enhancer-plugin/blob/master/LICENSE",
		});
		containerEl.createEl("p", { text: i18n.t("settings.githubRepo") }).createEl("a", {
			text: "obsidian-header-enhancer",
			href: "https://github.com/HoBeedzc/obsidian-header-enhancer-plugin",
		});
		containerEl
			.createEl("p", { text: i18n.t("settings.anyQuestion") })
			.createEl("a", {
				text: "Github Issues",
				href: "https://github.com/HoBeedzc/obsidian-header-enhancer-plugin/issues",
			});
	}

	getFormatPreview(): string {
		const i18n = I18n.getInstance();
		
		switch (this.plugin.settings.autoNumberingMode) {
			case AutoNumberingMode.OFF:
				return i18n.t("settings.autoNumbering.format.disabled");
			
			case AutoNumberingMode.YAML_CONTROLLED:
				return i18n.t("settings.autoNumbering.format.yamlControlled");
			
			case AutoNumberingMode.ON:
			default:
				// 构建实际的格式预览
				const formatExample = "\t" +
					this.plugin.settings.autoNumberingStartNumber +
					this.plugin.settings.autoNumberingSeparator +
					"1" +
					this.plugin.settings.autoNumberingSeparator +
					"1";
				
				const levelInfo = "\t" + 
					i18n.t("settings.autoNumbering.format.fromLevel") + " " +
					this.plugin.settings.startHeaderLevel +
					" " + 
					i18n.t("settings.autoNumbering.format.toLevel") + " " +
					this.plugin.settings.endHeaderLevel +
					" " +
					(this.plugin.settings.isAutoDetectHeaderLevel 
						? i18n.t("settings.autoNumbering.format.autoDetect")
						: i18n.t("settings.autoNumbering.format.manual"));
				
				return formatExample + levelInfo;
		}
	}

	updateFormatPreview(): void {
		if (this.formatPreviewSetting) {
			const i18n = I18n.getInstance();
			this.formatPreviewSetting.setName(
				i18n.t("settings.autoNumbering.format.name") + ": " + this.getFormatPreview()
			);
		}
	}

	checkEndLevel(maxLevel: number): boolean {
		return this.plugin.settings.startHeaderLevel <= maxLevel;
	}

	checkStartLevel(startLevel: number): boolean {
		return startLevel <= this.plugin.settings.endHeaderLevel;
	}

	checkStartNumber(startNumber: string): boolean {
		const reg = /^[0-9]*$/;
		return reg.test(startNumber);
	}

	checkSeparator(separator: string): boolean {
		if (separator.length != 1) {
			return false;
		}
		const separators = [".", ",", "-", "/"];
		return separators.includes(separator);
	}

	checkHeaderSeparator(separator: string): boolean {
		// only check when autoNumberingMode is ON
		if (this.plugin.settings.autoNumberingMode === AutoNumberingMode.ON) {
			return false;
		}
		return true;
	}
}
