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
	showOnSidebar: boolean;
	isAutoDetectHeaderLevel: boolean;
	startHeaderLevel: number;
	endHeaderLevel: number;
	autoNumberingMode: AutoNumberingMode;
	autoNumberingStartNumber: string;
	autoNumberingSeparator: string;
	autoNumberingHeaderSeparator: string;
	updateBacklinks: boolean;
	// Header font settings (for markdown headers # ## ###)
	isSeparateHeaderFont: boolean;
	headerFontFamily: string;
	headerFontSize: string;
	// Title font settings (for document titles)
	isSeparateTitleFont: boolean;
	titleFontFamily: string;
	titleFontSize: string;
}

export const DEFAULT_SETTINGS: HeaderEnhancerSettings = {
	language: "en",
	showOnStatusBar: true,
	showOnSidebar: true,
	isAutoDetectHeaderLevel: false, // TODO: auto detect header level is not available now
	startHeaderLevel: 1,
	endHeaderLevel: 6,
	autoNumberingMode: AutoNumberingMode.ON,
	autoNumberingStartNumber: "1",
	autoNumberingSeparator: ".",
	autoNumberingHeaderSeparator: "\t",
	updateBacklinks: false,
	// Header font settings
	isSeparateHeaderFont: false,
	headerFontFamily: "inherit",
	headerFontSize: "inherit",
	// Title font settings  
	isSeparateTitleFont: false,
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
		new Setting(containerEl)
			.setName(i18n.t("settings.sidebar.name"))
			.setDesc(i18n.t("settings.sidebar.desc"))
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.showOnSidebar)
					.onChange(async (value) => {
						this.plugin.settings.showOnSidebar = value;
						await this.plugin.saveSettings();
						this.plugin.handleShowSidebarChange();
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
					const newMode = value as AutoNumberingMode;
					
					// Check if switching from ON/YAML to OFF
					if ((this.plugin.settings.autoNumberingMode === AutoNumberingMode.ON || 
						 this.plugin.settings.autoNumberingMode === AutoNumberingMode.YAML_CONTROLLED) &&
						newMode === AutoNumberingMode.OFF) {
						
						// Import the dialog dynamically
						const { AutoNumberingRemovalDialog } = await import('./dialogs');
						
						// Show confirmation dialog
						const dialog = new AutoNumberingRemovalDialog(
							this.app, 
							this.plugin,
							async (removeExisting: boolean) => {
								this.plugin.settings.autoNumberingMode = AutoNumberingMode.OFF;
								await this.plugin.saveSettings();
								this.plugin.handleShowStateBarChange();
								this.display();
							}
						);
						dialog.open();
						
						// Reset dropdown to previous value temporarily
						dropdown.setValue(this.plugin.settings.autoNumberingMode);
						
					} else {
						// Direct setting change for other transitions
						this.plugin.settings.autoNumberingMode = newMode;
						await this.plugin.saveSettings();
						this.plugin.handleShowStateBarChange();
						this.display();
					}
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

		// Header Font Settings Section
		containerEl.createEl("h2", { text: i18n.t("settings.headerFont.title") });
		new Setting(containerEl)
			.setName(i18n.t("settings.headerFont.separate.name"))
			.setDesc(i18n.t("settings.headerFont.separate.desc"))
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.isSeparateHeaderFont)
					.onChange(async (value) => {
						this.plugin.settings.isSeparateHeaderFont = value;
						await this.plugin.saveSettings();
						this.plugin.styleManager.applyCSSStyles();
						this.display();
					});
			});

		// Header Font preview section - only show when separate font is enabled
		if (this.plugin.settings.isSeparateHeaderFont) {
			const previewContainer = containerEl.createDiv({ cls: "header-enhancer-font-preview" });
			previewContainer.style.cssText = `
				margin: 1em 0;
				padding: 1em;
				border: 1px solid var(--background-modifier-border);
				border-radius: 6px;
				background: var(--background-secondary);
			`;
			
			previewContainer.createEl("div", { 
				text: i18n.t("settings.headerFont.preview.title"),
				cls: "setting-item-name"
			});
			
			const previewContent = previewContainer.createDiv({ cls: "font-preview-content" });
			
			// Create preview headers
			for (let i = 1; i <= 3; i++) {
				const tagName = i === 1 ? 'h1' : i === 2 ? 'h2' : 'h3';
				const headerEl = previewContent.createEl(tagName, { 
					text: `${i18n.t("settings.headerFont.preview.sample")} ${i}`,
					cls: "header-enhancer-preview-header"
				});
				
				// Apply current font settings to preview
				this.updateHeaderPreviewStyles(headerEl);
			}
		}
		this.createFontFamilySetting(containerEl, "header");
		this.createFontSizeSetting(containerEl, "header");

		// Title Font Settings Section
		containerEl.createEl("h2", { text: i18n.t("settings.titleFont.title") });
		new Setting(containerEl)
			.setName(i18n.t("settings.titleFont.separate.name"))
			.setDesc(i18n.t("settings.titleFont.separate.desc"))
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.isSeparateTitleFont)
					.onChange(async (value) => {
						this.plugin.settings.isSeparateTitleFont = value;
						await this.plugin.saveSettings();
						this.plugin.styleManager.applyCSSStyles();
						this.display();
					});
			});

		// Title Font preview section - only show when separate font is enabled
		if (this.plugin.settings.isSeparateTitleFont) {
			const previewContainer = containerEl.createDiv({ cls: "header-enhancer-title-font-preview" });
			previewContainer.style.cssText = `
				margin: 1em 0;
				padding: 1em;
				border: 1px solid var(--background-modifier-border);
				border-radius: 6px;
				background: var(--background-secondary);
			`;
			
			previewContainer.createEl("div", { 
				text: i18n.t("settings.titleFont.preview.title"),
				cls: "setting-item-name"
			});
			
			const previewContent = previewContainer.createDiv({ cls: "font-preview-content" });
			
			// Create title preview
			const titleEl = previewContent.createEl('div', { 
				text: i18n.t("settings.titleFont.preview.sample"),
				cls: "header-enhancer-preview-title"
			});
			titleEl.style.cssText = "font-size: 1.5em; font-weight: bold; margin: 0.5em 0;";
			
			// Apply current font settings to preview
			this.updateTitlePreviewStyles(titleEl);
		}

		this.createFontFamilySetting(containerEl, "title");
		this.createFontSizeSetting(containerEl, "title");
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

	checkHeaderSeparator(_separator: string): boolean {
		// only check when autoNumberingMode is ON
		if (this.plugin.settings.autoNumberingMode === AutoNumberingMode.ON) {
			return false;
		}
		return true;
	}

	/**
	 * Update preview styles for a single header element
	 */
	updateHeaderPreviewStyles(headerEl: HTMLElement): void {
		if (this.plugin.settings.headerFontFamily && this.plugin.settings.headerFontFamily !== 'inherit') {
			headerEl.style.fontFamily = this.plugin.settings.headerFontFamily;
		} else {
			headerEl.style.fontFamily = '';
		}

		if (this.plugin.settings.headerFontSize && this.plugin.settings.headerFontSize !== 'inherit') {
			headerEl.style.fontSize = this.plugin.settings.headerFontSize;
		} else {
			headerEl.style.fontSize = '';
		}
	}

	/**
	 * Update preview styles for title element
	 */
	updateTitlePreviewStyles(titleEl: HTMLElement): void {
		if (this.plugin.settings.titleFontFamily && this.plugin.settings.titleFontFamily !== 'inherit') {
			titleEl.style.fontFamily = this.plugin.settings.titleFontFamily;
		} else {
			titleEl.style.fontFamily = '';
		}

		if (this.plugin.settings.titleFontSize && this.plugin.settings.titleFontSize !== 'inherit') {
			titleEl.style.fontSize = this.plugin.settings.titleFontSize;
		} else {
			titleEl.style.fontSize = '';
		}
	}

	/**
	 * Update preview styles for all preview headers
	 */
	updateAllHeaderPreviewStyles(): void {
		const previewHeaders = this.containerEl.querySelectorAll('.header-enhancer-preview-header');
		previewHeaders.forEach((headerEl) => {
			this.updateHeaderPreviewStyles(headerEl as HTMLElement);
		});
	}

	/**
	 * Update preview styles for all preview titles  
	 */
	updateAllTitlePreviewStyles(): void {
		const previewTitles = this.containerEl.querySelectorAll('.header-enhancer-preview-title');
		previewTitles.forEach((titleEl) => {
			this.updateTitlePreviewStyles(titleEl as HTMLElement);
		});
	}

	/**
	 * Create font family setting for header or title
	 */
	createFontFamilySetting(containerEl: HTMLElement, type: "header" | "title"): void {
		const i18n = I18n.getInstance();
		const isHeader = type === "header";
		const settingsKey = isHeader ? "settings.headerFont" : "settings.titleFont";
		
		new Setting(containerEl)
			.setName(i18n.t(`${settingsKey}.family.name`))
			.setDesc(i18n.t(`${settingsKey}.family.desc`))
			.addDropdown((dropdown) => {
				// Add font family options
				dropdown.addOption("inherit", i18n.t(`${settingsKey}.family.options.inherit`));
				dropdown.addOption("Arial, sans-serif", "Arial");
				dropdown.addOption("Helvetica, Arial, sans-serif", "Helvetica");
				dropdown.addOption("'Times New Roman', Times, serif", "Times New Roman");
				dropdown.addOption("Georgia, serif", "Georgia");
				dropdown.addOption("'Courier New', Courier, monospace", "Courier New");
				dropdown.addOption("Consolas, 'Liberation Mono', monospace", "Consolas");
				dropdown.addOption("Monaco, 'Lucida Console', monospace", "Monaco");
				dropdown.addOption("Verdana, Geneva, sans-serif", "Verdana");
				dropdown.addOption("Tahoma, Geneva, sans-serif", "Tahoma");
				dropdown.addOption("'Trebuchet MS', Helvetica, sans-serif", "Trebuchet MS");
				dropdown.addOption("'Lucida Sans Unicode', 'Lucida Grande', sans-serif", "Lucida Sans");
				dropdown.addOption("Impact, Charcoal, sans-serif", "Impact");
				dropdown.addOption("'Palatino Linotype', 'Book Antiqua', Palatino, serif", "Palatino");
				dropdown.addOption("'Comic Sans MS', cursive", "Comic Sans MS");
				
				const currentValue = isHeader ? this.plugin.settings.headerFontFamily : this.plugin.settings.titleFontFamily;
				const isEnabled = isHeader ? this.plugin.settings.isSeparateHeaderFont : this.plugin.settings.isSeparateTitleFont;
				
				dropdown.setValue(currentValue);
				dropdown.setDisabled(!isEnabled);
				dropdown.onChange(async (value) => {
					if (isHeader) {
						this.plugin.settings.headerFontFamily = value;
					} else {
						this.plugin.settings.titleFontFamily = value;
					}
					await this.plugin.saveSettings();
					if (isEnabled) {
						this.plugin.styleManager.applyCSSStyles();
						if (isHeader) {
							this.updateAllHeaderPreviewStyles();
						} else {
							this.updateAllTitlePreviewStyles();
						}
					}
				});
			});
	}

	/**
	 * Create font size setting for header or title
	 */
	createFontSizeSetting(containerEl: HTMLElement, type: "header" | "title"): void {
		const i18n = I18n.getInstance();
		const isHeader = type === "header";
		const settingsKey = isHeader ? "settings.headerFont" : "settings.titleFont";
		
		new Setting(containerEl)
			.setName(i18n.t(`${settingsKey}.size.name`))
			.setDesc(i18n.t(`${settingsKey}.size.desc`))
			.addDropdown((dropdown) => {
				// Add font size options
				dropdown.addOption("inherit", i18n.t(`${settingsKey}.size.options.inherit`));
				dropdown.addOption("0.8em", i18n.t(`${settingsKey}.size.options.smaller`) + " (0.8em)");
				dropdown.addOption("0.9em", i18n.t(`${settingsKey}.size.options.small`) + " (0.9em)");
				dropdown.addOption("1em", i18n.t(`${settingsKey}.size.options.normal`) + " (1em)");
				dropdown.addOption("1.1em", i18n.t(`${settingsKey}.size.options.large`) + " (1.1em)");
				dropdown.addOption("1.2em", i18n.t(`${settingsKey}.size.options.larger`) + " (1.2em)");
				dropdown.addOption("1.3em", i18n.t(`${settingsKey}.size.options.xlarge`) + " (1.3em)");
				dropdown.addOption("1.5em", i18n.t(`${settingsKey}.size.options.xxlarge`) + " (1.5em)");
				dropdown.addOption("12px", "12px");
				dropdown.addOption("14px", "14px");
				dropdown.addOption("16px", "16px");
				dropdown.addOption("18px", "18px");
				dropdown.addOption("20px", "20px");
				dropdown.addOption("24px", "24px");
				dropdown.addOption("28px", "28px");
				dropdown.addOption("32px", "32px");
				dropdown.addOption("120%", "120%");
				dropdown.addOption("140%", "140%");
				
				const currentValue = isHeader ? this.plugin.settings.headerFontSize : this.plugin.settings.titleFontSize;
				const isEnabled = isHeader ? this.plugin.settings.isSeparateHeaderFont : this.plugin.settings.isSeparateTitleFont;
				
				dropdown.setValue(currentValue);
				dropdown.setDisabled(!isEnabled);
				dropdown.onChange(async (value) => {
					if (isHeader) {
						this.plugin.settings.headerFontSize = value;
					} else {
						this.plugin.settings.titleFontSize = value;
					}
					await this.plugin.saveSettings();
					if (isEnabled) {
						this.plugin.styleManager.applyCSSStyles();
						if (isHeader) {
							this.updateAllHeaderPreviewStyles();
						} else {
							this.updateAllTitlePreviewStyles();
						}
					}
				});
			});
	}
}
