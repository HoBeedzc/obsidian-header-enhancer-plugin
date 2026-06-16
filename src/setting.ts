import { App, Modal, PluginSettingTab, Setting, Notice, MarkdownView } from "obsidian";
import HeaderEnhancerPlugin from "./main";
import { I18n } from './i18n';
import { analyzeHeaderLevels, HeaderLevelAnalysis } from './core';

export enum AutoNumberingMode {
	OFF = "off",
	ON = "on",
	YAML_CONTROLLED = "yaml"
}

export enum YamlFallbackMode {
	NO_NUMBERING = "no_numbering",
	USE_DEFAULT = "use_default"
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
	// YAML mode specific settings
	yamlFallbackMode: YamlFallbackMode;
	yamlDefaultStartLevel: number;
	yamlDefaultEndLevel: number;
	yamlDefaultStartNumber: string;
	yamlDefaultSeparator: string;
	// Global function enablement
	globalAutoNumberingEnabled: boolean;
	// Per-document state management (stored as stringified JSON)
	perDocumentStates: string;
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
	isAutoDetectHeaderLevel: false, // 自动检测文档中的标题层级功能
	startHeaderLevel: 1,
	endHeaderLevel: 6,
	autoNumberingMode: AutoNumberingMode.ON,
	autoNumberingStartNumber: "1",
	autoNumberingSeparator: ".",
	autoNumberingHeaderSeparator: "\t",
	updateBacklinks: false,
	// YAML mode specific settings
	yamlFallbackMode: YamlFallbackMode.USE_DEFAULT,
	yamlDefaultStartLevel: 2,
	yamlDefaultEndLevel: 6,
	yamlDefaultStartNumber: "1",
	yamlDefaultSeparator: ".",
	// Global function enablement - enabled by default for backward compatibility
	globalAutoNumberingEnabled: true,
	// Per-document state management - empty object as JSON string
	perDocumentStates: "{}",
	// Header font settings
	isSeparateHeaderFont: false,
	headerFontFamily: "inherit",
	headerFontSize: "inherit",
	// Title font settings  
	isSeparateTitleFont: false,
	titleFontFamily: "inherit",
	titleFontSize: "inherit",
};

class ResetSettingsConfirmModal extends Modal {
	constructor(
		app: App,
		private readonly message: string,
		private readonly onConfirm: () => Promise<void>
	) {
		super(app);
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("header-enhancer-reset-confirm");
		contentEl.createEl("p", { text: this.message });
		new Setting(contentEl)
			.addButton((button) => {
				button
					.setButtonText("Cancel")
					.onClick(() => this.close());
			})
			.addButton((button) => {
				button
					.setButtonText("Reset")
					.setWarning()
					.onClick(async () => {
						await this.onConfirm();
						this.close();
					});
			});
	}
}

export class HeaderEnhancerSettingTab extends PluginSettingTab {
	plugin: HeaderEnhancerPlugin;
	private formatPreviewContainer: HTMLElement | null = null;
	private autoDetectionPreviewContainer: HTMLElement | null = null;

	constructor(app: App, plugin: HeaderEnhancerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		const i18n = I18n.getInstance();

		containerEl.empty();
		// Reset format preview reference since empty() clears all elements
		this.formatPreviewContainer = null;
		this.autoDetectionPreviewContainer = null;

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
		
		// Global auto numbering toggle
		new Setting(containerEl)
			.setName(i18n.t("settings.autoNumbering.globalToggle.name"))
			.setDesc(i18n.t("settings.autoNumbering.globalToggle.desc"))
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.globalAutoNumberingEnabled)
					.onChange(async (value) => {
						this.plugin.settings.globalAutoNumberingEnabled = value;
						await this.plugin.saveSettings();
						this.plugin.handleShowStateBarChange();
						this.plugin.updateRibbonIconState();
						this.display(); // Refresh to show/hide dependent settings
					});
			});

		// Only show auto numbering mode and related settings if global toggle is enabled
		if (!this.plugin.settings.globalAutoNumberingEnabled) {
			// Show info message when global toggle is disabled
			const globalDisabledInfo = containerEl.createDiv({
				cls: "header-enhancer-global-disabled-info"
			});
			globalDisabledInfo.createDiv({
				text: i18n.t("settings.autoNumbering.globalDisabled.title"),
				cls: "header-enhancer-info-title"
			});
			globalDisabledInfo.createDiv({
				text: i18n.t("settings.autoNumbering.globalDisabled.description"),
				cls: "header-enhancer-info-description"
			});
			
			return; // Exit early, don't render other auto numbering settings
		}

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
								this.plugin.updateRibbonIconState();
								this.display();
							}
						);
						dialog.open();
						
						// Reset dropdown to previous value temporarily
						dropdown.setValue(this.plugin.settings.autoNumberingMode);
						
					} else if (this.plugin.settings.autoNumberingMode === AutoNumberingMode.OFF &&
							   newMode === AutoNumberingMode.ON) {
						
						// Only show dialog for OFF -> ON, not for OFF -> YAML
						// Import the dialog dynamically
						const { AutoNumberingActivationDialog } = await import('./dialogs');
						
						// Show activation confirmation dialog
						const dialog = new AutoNumberingActivationDialog(
							this.app,
							this.plugin,
							async (addToAll: boolean) => {
								this.plugin.settings.autoNumberingMode = newMode;
								await this.plugin.saveSettings();
								this.plugin.handleShowStateBarChange();
								this.plugin.updateRibbonIconState();
								this.display();
							}
						);
						dialog.open();
						
						// Reset dropdown to previous value temporarily
						dropdown.setValue(this.plugin.settings.autoNumberingMode);
						
					} else {
						// Direct setting change for other transitions (including OFF -> YAML)
						this.plugin.settings.autoNumberingMode = newMode;
						await this.plugin.saveSettings();
						this.plugin.handleShowStateBarChange();
						this.plugin.updateRibbonIconState();
						this.display();
					}
				});
			});

		// 只有在启用自动编号（ON模式）时才显示下面的设置
		if (this.plugin.settings.autoNumberingMode === AutoNumberingMode.ON) {
			this.renderAutoNumberingSettings(containerEl);
		} else if (this.plugin.settings.autoNumberingMode === AutoNumberingMode.YAML_CONTROLLED) {
			// YAML控制模式下显示配置选项
			this.renderYamlModeSettings(containerEl);
		} else {
			// OFF模式下显示提示信息
			const offInfo = containerEl.createDiv({
				cls: "header-enhancer-off-info"
			});
			offInfo.createDiv({
				text: i18n.t("autoDetection.info.offMode.title"),
				cls: "header-enhancer-info-title"
			});
			offInfo.createDiv({
				text: i18n.t("autoDetection.info.offMode.description"),
				cls: "header-enhancer-info-description"
			});
		}

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
			
			// Apply current font settings to preview
			this.updateTitlePreviewStyles(titleEl);
		}

		this.createFontFamilySetting(containerEl, "title");
		this.createFontSizeSetting(containerEl, "title");

		// Reset Settings
		new Setting(containerEl)
			.addButton((button) => {
				button.setButtonText(i18n.t("settings.resetSettings.name")).onClick(async () => {
					new ResetSettingsConfirmModal(
						this.app,
						i18n.t("settings.resetSettings.confirm"),
						async () => {
							this.plugin.settings = DEFAULT_SETTINGS;
							await this.plugin.saveSettings();
							this.display();
						}
					).open();
				});
			});

		// More Information Section
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

	/**
	 * 渲染自动编号相关的设置项
	 */
	private renderAutoNumberingSettings(containerEl: HTMLElement): void {
		const i18n = I18n.getInstance();
		
		// 标题编号方式选择
		const headerLevelSetting = new Setting(containerEl)
			.setName(i18n.t("settings.autoNumbering.headerLevel.name"));

		// 动态设置描述文本
		const updateSettingDesc = () => {
			if (this.plugin.settings.autoNumberingMode === AutoNumberingMode.YAML_CONTROLLED) {
				headerLevelSetting.setDesc(i18n.t("settings.autoNumbering.headerLevel.desc.yamlControl"));
			} else if (this.plugin.settings.isAutoDetectHeaderLevel && 
				this.plugin.settings.autoNumberingMode === AutoNumberingMode.ON) {
				headerLevelSetting.setDesc(i18n.t("settings.autoNumbering.headerLevel.desc.autoDetect"));
			} else {
				headerLevelSetting.setDesc(i18n.t("settings.autoNumbering.headerLevel.desc.manual"));
			}
		};

		updateSettingDesc(); // 初始设置描述

		headerLevelSetting.addToggle((toggle) => {
			toggle.setValue(this.plugin.settings.isAutoDetectHeaderLevel)
				.onChange(async (value) => {
					this.plugin.settings.isAutoDetectHeaderLevel = value;
					await this.plugin.saveSettings();
					updateSettingDesc(); // 更新描述
					this.display(); // 重新渲染界面
				})
				.setDisabled(this.plugin.settings.autoNumberingMode === AutoNumberingMode.YAML_CONTROLLED);
		});

		// 根据自动检测开关状态显示不同的配置选项
		if (this.plugin.settings.isAutoDetectHeaderLevel && 
			this.plugin.settings.autoNumberingMode === AutoNumberingMode.ON) {
			
			// 自动检测模式：显示预览区域
			this.autoDetectionPreviewContainer = containerEl.createDiv({ 
				cls: "header-enhancer-auto-detection-preview" 
			});
			
			// 添加标题
			this.autoDetectionPreviewContainer.createDiv({
				text: "🔧 智能检测结果",
				cls: "header-enhancer-auto-detection-title"
			});
			
			this.updateAutoDetectionPreview();
		} else {
			// 手动模式：显示层级选择器
			new Setting(containerEl)
				.setName(i18n.t("settings.headerLevel.start.name"))
				.setDesc(i18n.t("settings.headerLevel.start.desc"))
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
					dropdown.setDisabled(this.plugin.settings.autoNumberingMode === AutoNumberingMode.YAML_CONTROLLED);
					dropdown.onChange(async (value) => {
						if (this.checkStartLevel(parseInt(value, 10))) {
							this.plugin.settings.startHeaderLevel = parseInt(value, 10);
							await this.plugin.saveSettings();
							this.updateFormatPreview();
						} else {
							new Notice(
								i18n.t("settings.autoNumbering.startLevelError")
							);
							// Restore to original setting value
							dropdown.setValue(this.plugin.settings.startHeaderLevel.toString());
						}
					});
				});
				
			new Setting(containerEl)
				.setName(i18n.t("settings.headerLevel.max.name"))
				.setDesc(i18n.t("settings.headerLevel.max.desc"))
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
					dropdown.setDisabled(this.plugin.settings.autoNumberingMode === AutoNumberingMode.YAML_CONTROLLED);
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
							// Restore to original setting value
							dropdown.setValue(this.plugin.settings.endHeaderLevel.toString());
						}
					});
				});
		}

		// 其他设置项（起始数字、分隔符等）
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
					this.plugin.settings.autoNumberingHeaderSeparator = value;
					await this.plugin.saveSettings();
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
					})
					.setDisabled(this.plugin.settings.autoNumberingMode === AutoNumberingMode.YAML_CONTROLLED);
			});

		// 格式预览 - 简洁展示
		const formatPreviewContainer = containerEl.createDiv({ 
			cls: "header-enhancer-format-preview-container" 
		});
		
		// 标题
		const previewTitle = formatPreviewContainer.createDiv({
			cls: "header-enhancer-format-preview-title"
		});
		previewTitle.createSpan({
			text: "🎯",
			cls: "header-enhancer-format-preview-icon"
		});
		previewTitle.createSpan({
			text: i18n.t("settings.autoNumbering.format.name")
		});
		
		// 格式预览内容容器
		const previewContent = formatPreviewContainer.createDiv({
			cls: "format-preview-content"
		});
		this.formatPreviewContainer = previewContent;
		
		// 初始化格式预览内容
		this.renderFormatPreview(previewContent);
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
				
				// Western Sans-Serif Fonts
				dropdown.addOption("Arial, sans-serif", "Arial");
				dropdown.addOption("Helvetica, Arial, sans-serif", "Helvetica");
				dropdown.addOption("Verdana, Geneva, sans-serif", "Verdana");
				dropdown.addOption("Tahoma, Geneva, sans-serif", "Tahoma");
				dropdown.addOption("'Trebuchet MS', Helvetica, sans-serif", "Trebuchet MS");
				dropdown.addOption("'Lucida Sans Unicode', 'Lucida Grande', sans-serif", "Lucida Sans");
				dropdown.addOption("Impact, Charcoal, sans-serif", "Impact");
				dropdown.addOption("'Comic Sans MS', cursive", "Comic Sans MS");
				
				// Western Serif Fonts
				dropdown.addOption("'Times New Roman', Times, serif", "Times New Roman");
				dropdown.addOption("Georgia, serif", "Georgia");
				dropdown.addOption("'Palatino Linotype', 'Book Antiqua', Palatino, serif", "Palatino");
				dropdown.addOption("Garamond, serif", "Garamond");
				dropdown.addOption("'Book Antiqua', Palatino, serif", "Book Antiqua");
				
				// Monospace Fonts
				dropdown.addOption("'Courier New', Courier, monospace", "Courier New");
				dropdown.addOption("Consolas, 'Liberation Mono', monospace", "Consolas");
				dropdown.addOption("Monaco, 'Lucida Console', monospace", "Monaco");
				dropdown.addOption("'JetBrains Mono', Consolas, monospace", "JetBrains Mono");
				dropdown.addOption("'Fira Code', Consolas, monospace", "Fira Code");
				dropdown.addOption("Menlo, Monaco, monospace", "Menlo");
				
				// Chinese Sans-Serif Fonts
				dropdown.addOption("'Microsoft YaHei', '微软雅黑', Arial, sans-serif", "Microsoft YaHei (微软雅黑)");
				dropdown.addOption("'PingFang SC', '苹方-简', 'Helvetica Neue', Arial, sans-serif", "PingFang SC (苹方-简)");
				dropdown.addOption("'Hiragino Sans GB', '冬青黑体简体中文', 'Microsoft YaHei', sans-serif", "Hiragino Sans GB (冬青黑体)");
				dropdown.addOption("'Source Han Sans SC', '思源黑体 CN', 'Noto Sans CJK SC', sans-serif", "Source Han Sans SC (思源黑体)");
				dropdown.addOption("'Noto Sans SC', '思源黑体', sans-serif", "Noto Sans SC");
				dropdown.addOption("SimHei, '黑体', sans-serif", "SimHei (黑体)");
				dropdown.addOption("'WenQuanYi Micro Hei', '文泉驿微米黑', sans-serif", "WenQuanYi Micro Hei (文泉驿微米黑)");
				
				// Chinese Serif Fonts
				dropdown.addOption("'Songti SC', '宋体-简', SimSun, serif", "Songti SC (宋体-简)");
				dropdown.addOption("SimSun, '宋体', serif", "SimSun (宋体)");
				dropdown.addOption("'Source Han Serif SC', '思源宋体 CN', 'Noto Serif CJK SC', serif", "Source Han Serif SC (思源宋体)");
				dropdown.addOption("'Noto Serif SC', '思源宋体', serif", "Noto Serif SC");
				dropdown.addOption("'STSong', '华文宋体', SimSun, serif", "STSong (华文宋体)");
				dropdown.addOption("'FangSong', '仿宋', serif", "FangSong (仿宋)");
				
				// System UI Fonts
				dropdown.addOption("system-ui, -apple-system, sans-serif", "System UI");
				dropdown.addOption("-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", "System Default");
				
				// Mixed Chinese + English Fallbacks
				dropdown.addOption("'PingFang SC', 'Microsoft YaHei', 'Hiragino Sans GB', Arial, sans-serif", "中英文无衬线混合");
				dropdown.addOption("'Songti SC', 'Source Han Serif SC', 'Times New Roman', serif", "中英文衬线混合");
				
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

	/**
	 * Update auto detection preview
	 */
	updateAutoDetectionPreview(): void {
		if (!this.autoDetectionPreviewContainer) return;
		
		const i18n = I18n.getInstance();
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		
		// 查找或创建内容容器
		let contentContainer = this.autoDetectionPreviewContainer.querySelector('.preview-content') as HTMLElement;
		if (!contentContainer) {
			contentContainer = this.autoDetectionPreviewContainer.createDiv({
				cls: "preview-content"
			});
		}
		contentContainer.empty();
		
		if (!activeView) {
			contentContainer.createDiv({
				text: i18n.t("autoDetection.noActiveDocument"),
				cls: "header-enhancer-muted-italic"
			});
			// 更新格式预览，即使没有活动文档
			this.updateFormatPreview();
			return;
		}
		
		const content = activeView.editor.getValue();
		const analysis = analyzeHeaderLevels(content);
		this.renderAnalysisResult(contentContainer, analysis);
		
		// 当自动检测预览更新时，同时更新格式预览
		this.updateFormatPreview();
	}

	/**
	 * Render analysis result for display
	 */
	renderAnalysisResult(containerEl: HTMLElement, analysis: HeaderLevelAnalysis): void {
		const i18n = I18n.getInstance();
		
		if (analysis.isEmpty) {
			containerEl.createDiv({
				text: `📝 ${i18n.t("autoDetection.noHeaders")}`,
				cls: "header-enhancer-empty-analysis"
			});
			return;
		}
		
		const grid = containerEl.createDiv({
			cls: "header-enhancer-analysis-grid"
		});

		const detectedRow = this.createAnalysisRow(grid, `${i18n.t("autoDetection.detected")}:`);
		analysis.usedLevels.forEach((level) => {
			detectedRow.createSpan({
				text: `H${level}`,
				cls: "header-enhancer-level-chip"
			});
		});

		const rangeRow = this.createAnalysisRow(grid, `${i18n.t("autoDetection.range")}:`);
		rangeRow.createSpan({
			text: `H${analysis.minLevel} - H${analysis.maxLevel}`,
			cls: "header-enhancer-range-badge"
		});

		const mappingRow = this.createAnalysisRow(grid, `${i18n.t("autoDetection.mapping")}:`, true);
		analysis.usedLevels.forEach((level, index) => {
			mappingRow.createSpan({
				text: `H${level}→${index + 1}级`,
				cls: "header-enhancer-mapping-chip"
			});
		});

		const totalRow = this.createAnalysisRow(grid, `${i18n.t("autoDetection.totalHeaders")}:`);
		totalRow.createSpan({
			text: analysis.headerCount.toString(),
			cls: "header-enhancer-total-badge"
		});
	}

	/**
	 * Create an analysis row and return its value container.
	 */
	private createAnalysisRow(containerEl: HTMLElement, label: string, alignStart = false): HTMLElement {
		const row = containerEl.createDiv({
			cls: alignStart ? "header-enhancer-analysis-row header-enhancer-analysis-row-start" : "header-enhancer-analysis-row"
		});
		row.createEl("strong", {
			text: label,
			cls: "header-enhancer-analysis-label"
		});
		return row.createDiv({
			cls: "header-enhancer-analysis-values"
		});
	}

	/**
	 * Render format preview
	 */
	renderFormatPreview(containerEl: HTMLElement): void {
		const i18n = I18n.getInstance();
		containerEl.empty();
		
		switch (this.plugin.settings.autoNumberingMode) {
			case AutoNumberingMode.OFF:
				this.renderEmptyFormatState(
					containerEl,
					"⏹️",
					i18n.t("settings.autoNumbering.format.disabled"),
					"header-enhancer-format-state-muted"
				);
				return;
			
			case AutoNumberingMode.YAML_CONTROLLED:
				this.renderEmptyFormatState(
					containerEl,
					"📄",
					i18n.t("settings.autoNumbering.format.yamlControlled"),
					"header-enhancer-format-state-yaml"
				);
				return;
			
			case AutoNumberingMode.ON:
			default:
				// 构建格式示例
				const formatExample = this.plugin.settings.autoNumberingStartNumber +
					this.plugin.settings.autoNumberingSeparator +
					"1" +
					this.plugin.settings.autoNumberingSeparator +
					"1";
				
				let levelInfo: string;
				let statusClass: string;
				
				// 如果启用了自动检测，尝试获取当前文档的实际层级范围
				if (this.plugin.settings.isAutoDetectHeaderLevel) {
					const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
					if (activeView) {
						const content = activeView.editor.getValue();
						const analysis = analyzeHeaderLevels(content);
						
						if (!analysis.isEmpty) {
							levelInfo = `${i18n.t("settings.autoNumbering.format.fromLevel")} H${analysis.minLevel} ${i18n.t("settings.autoNumbering.format.toLevel")} H${analysis.maxLevel}`;
							statusClass = "header-enhancer-status-auto";
						} else {
							levelInfo = i18n.t("autoDetection.noHeaders");
							statusClass = "header-enhancer-status-warning";
						}
					} else {
						levelInfo = i18n.t("autoDetection.noActiveDocument");
						statusClass = "header-enhancer-status-muted";
					}
				} else {
					// 手动模式：使用设置的层级
					levelInfo = `${i18n.t("settings.autoNumbering.format.fromLevel")} H${this.plugin.settings.startHeaderLevel} ${i18n.t("settings.autoNumbering.format.toLevel")} H${this.plugin.settings.endHeaderLevel}`;
					statusClass = "header-enhancer-status-manual";
				}
				
				const preview = containerEl.createDiv({
					cls: "header-enhancer-format-preview"
				});
				const exampleWrapper = preview.createDiv({
					cls: "header-enhancer-format-example-wrapper"
				});
				exampleWrapper.createDiv({
					text: formatExample,
					cls: "header-enhancer-format-example"
				});

				const details = preview.createDiv({
					cls: "header-enhancer-format-details"
				});
				const levelInfoEl = details.createDiv({
					cls: "header-enhancer-format-level-info"
				});
				levelInfoEl.createSpan({
					text: "📏",
					cls: "header-enhancer-format-preview-icon"
				});
				levelInfoEl.createSpan({
					text: levelInfo
				});
				details.createSpan({
					text: this.plugin.settings.isAutoDetectHeaderLevel ?
						i18n.t("settings.autoNumbering.format.autoDetect") :
						i18n.t("settings.autoNumbering.format.manual"),
					cls: `header-enhancer-status-badge ${statusClass}`
				});
				return;
		}
	}

	private renderEmptyFormatState(containerEl: HTMLElement, icon: string, text: string, stateClass: string): void {
		const stateEl = containerEl.createDiv({
			cls: `header-enhancer-format-state ${stateClass}`
		});
		stateEl.createDiv({
			text: icon,
			cls: "header-enhancer-format-state-icon"
		});
		stateEl.createDiv({
			text,
			cls: "header-enhancer-format-state-text"
		});
	}

	/**
	 * Update format preview
	 */
	updateFormatPreview(): void {
		if (this.formatPreviewContainer) {
			this.renderFormatPreview(this.formatPreviewContainer);
		}
	}

	/**
	 * Validation methods
	 */
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
	 * 渲染 YAML 模式的设置项
	 */
	private renderYamlModeSettings(containerEl: HTMLElement): void {
		const i18n = I18n.getInstance();

		// 构建动态 YAML 示例（使用用户的默认设置）
		const yamlExample = `["state on", "start-level h${this.plugin.settings.yamlDefaultStartLevel}", "end-level h${this.plugin.settings.yamlDefaultEndLevel}", "start-at ${this.plugin.settings.yamlDefaultStartNumber}", "separator ${this.plugin.settings.yamlDefaultSeparator}"]`;

		// YAML 模式说明信息
		const yamlInfo = containerEl.createDiv({
			cls: "header-enhancer-yaml-info"
		});
		yamlInfo.createDiv({
			text: i18n.t("autoDetection.info.yamlMode.title"),
			cls: "header-enhancer-yaml-title"
		});
		const yamlDescription = yamlInfo.createDiv({
			cls: "header-enhancer-yaml-description"
		});
		yamlDescription.createDiv({
			text: i18n.t("autoDetection.info.yamlMode.description")
		});
		yamlDescription.createEl("code", {
			text: `---\nheader-auto-numbering: ${yamlExample}\n---`,
			cls: "header-enhancer-yaml-example"
		});
		yamlDescription.createDiv({
			text: i18n.t("autoDetection.info.yamlMode.usage")
		});

		// 没有 YAML 的文档操作选项
		new Setting(containerEl)
			.setName(i18n.t("settings.yamlMode.fallback.name"))
			.setDesc(i18n.t("settings.yamlMode.fallback.desc"))
			.addDropdown((dropdown) => {
				dropdown.addOption(YamlFallbackMode.NO_NUMBERING, i18n.t("settings.yamlMode.fallback.noNumbering"));
				dropdown.addOption(YamlFallbackMode.USE_DEFAULT, i18n.t("settings.yamlMode.fallback.useDefault"));
				dropdown.setValue(this.plugin.settings.yamlFallbackMode);
				dropdown.onChange(async (value) => {
					this.plugin.settings.yamlFallbackMode = value as YamlFallbackMode;
					await this.plugin.saveSettings();
					this.display(); // 重新渲染以显示/隐藏默认值配置
				});
			});

		// 如果选择了使用默认值，显示默认值配置选项
		if (this.plugin.settings.yamlFallbackMode === YamlFallbackMode.USE_DEFAULT) {
			// 默认起始层级
			new Setting(containerEl)
				.setName(i18n.t("settings.yamlMode.defaultStartLevel.name"))
				.setDesc(i18n.t("settings.yamlMode.defaultStartLevel.desc"))
				.addDropdown((dropdown) => {
					dropdown.addOption("1", "H1");
					dropdown.addOption("2", "H2");
					dropdown.addOption("3", "H3");
					dropdown.addOption("4", "H4");
					dropdown.addOption("5", "H5");
					dropdown.addOption("6", "H6");
					dropdown.setValue(this.plugin.settings.yamlDefaultStartLevel.toString());
					dropdown.onChange(async (value) => {
						const numValue = parseInt(value, 10);
						if (numValue <= this.plugin.settings.yamlDefaultEndLevel) {
							this.plugin.settings.yamlDefaultStartLevel = numValue;
							await this.plugin.saveSettings();
							this.display(); // 刷新界面以更新 YAML 示例
						} else {
							new Notice(i18n.t("settings.autoNumbering.startLevelError"));
							dropdown.setValue(this.plugin.settings.yamlDefaultStartLevel.toString());
						}
					});
				});

			// 默认结束层级
			new Setting(containerEl)
				.setName(i18n.t("settings.yamlMode.defaultEndLevel.name"))
				.setDesc(i18n.t("settings.yamlMode.defaultEndLevel.desc"))
				.addDropdown((dropdown) => {
					dropdown.addOption("1", "H1");
					dropdown.addOption("2", "H2");
					dropdown.addOption("3", "H3");
					dropdown.addOption("4", "H4");
					dropdown.addOption("5", "H5");
					dropdown.addOption("6", "H6");
					dropdown.setValue(this.plugin.settings.yamlDefaultEndLevel.toString());
					dropdown.onChange(async (value) => {
						const numValue = parseInt(value, 10);
						if (numValue >= this.plugin.settings.yamlDefaultStartLevel) {
							this.plugin.settings.yamlDefaultEndLevel = numValue;
							await this.plugin.saveSettings();
							this.display(); // 刷新界面以更新 YAML 示例
						} else {
							new Notice(i18n.t("settings.autoNumbering.endLevelError"));
							dropdown.setValue(this.plugin.settings.yamlDefaultEndLevel.toString());
						}
					});
				});

			// 默认起始数字
			new Setting(containerEl)
				.setName(i18n.t("settings.yamlMode.defaultStartNumber.name"))
				.setDesc(i18n.t("settings.yamlMode.defaultStartNumber.desc"))
				.addDropdown((dropdown) => {
					dropdown.addOption("0", "0");
					dropdown.addOption("1", "1");
					dropdown.setValue(this.plugin.settings.yamlDefaultStartNumber);
					dropdown.onChange(async (value) => {
						this.plugin.settings.yamlDefaultStartNumber = value;
						await this.plugin.saveSettings();
						this.display(); // 刷新界面以更新 YAML 示例
					});
				});

			// 默认分隔符
			new Setting(containerEl)
				.setName(i18n.t("settings.yamlMode.defaultSeparator.name"))
				.setDesc(i18n.t("settings.yamlMode.defaultSeparator.desc"))
				.addDropdown((dropdown) => {
					dropdown.addOption(".", ".");
					dropdown.addOption(",", ",");
					dropdown.addOption("-", "-");
					dropdown.addOption("/", "/");
					dropdown.setValue(this.plugin.settings.yamlDefaultSeparator);
					dropdown.onChange(async (value) => {
						this.plugin.settings.yamlDefaultSeparator = value;
						await this.plugin.saveSettings();
						this.display(); // 刷新界面以更新 YAML 示例
					});
				});
		}
	}
}
