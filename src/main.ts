import { MarkdownView, Notice, Plugin, TFile } from "obsidian";

import {
	getHeaderLevel,
	getNextNumber,
	isNeedUpdateNumber,
	isNeedInsertNumber,
	removeHeaderNumber,
	isHeader,
} from "./core";
import { getAutoNumberingYaml, setAutoNumberingYaml } from "./utils";
import {
	HeaderEnhancerSettingTab,
	DEFAULT_SETTINGS,
	HeaderEnhancerSettings,
	AutoNumberingMode,
} from "./setting";
import { getAutoNumberingConfig } from "./config";
import { I18n } from "./i18n";
import { BacklinkManager } from "./backlinks";
import { EditorHandlers } from "./editor/editor-handlers";
import { StyleManager } from "./styles/style-manager";

export default class HeaderEnhancerPlugin extends Plugin {
	settings: HeaderEnhancerSettings;
	statusBarItemEl: HTMLElement;
	ribbonIconEl: HTMLElement;
	backlinkManager: BacklinkManager;
	editorHandlers: EditorHandlers;
	styleManager: StyleManager;

	async onload() {
		await this.loadSettings();
		
		// Initialize managers
		this.backlinkManager = new BacklinkManager(this.app);
		this.editorHandlers = new EditorHandlers(this);
		this.styleManager = new StyleManager(this.settings);

		// Apply CSS styles
		this.styleManager.applyCSSStyles();

		// Creates an icon in the left ribbon.
		this.ribbonIconEl = this.addRibbonIcon(
			"heading-glyph",
			"Header Enhancer",
			async (_evt: MouseEvent) => {
				const app = this.app; // this is the obsidian App instance
				const activeView =
					app.workspace.getActiveViewOfType(MarkdownView);
				if (!activeView) {
					new Notice(
						"No active MarkdownView, cannot toggle auto numbering."
					);
					return;
				}
				// Toggle header numbering on/off - direct toggle without dialog
				if (this.settings.autoNumberingMode !== AutoNumberingMode.OFF) {
					this.settings.autoNumberingMode = AutoNumberingMode.OFF;
					new Notice("Auto numbering is off");
					await this.handleRemoveHeaderNumber(activeView);
				} else {
					// Turn on auto-numbering directly
					this.settings.autoNumberingMode = AutoNumberingMode.ON;
					new Notice("Auto numbering is on");
					await this.handleAddHeaderNumber(activeView);
				}
				await this.saveSettings();
				this.handleShowStateBarChange();
			}
		);

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		this.statusBarItemEl = this.addStatusBarItem();
		this.handleShowStateBarChange();
		this.handleShowSidebarChange();

		// Register editor extensions
		const keyHandlers = this.editorHandlers.registerKeyHandlers();
		keyHandlers.forEach(handler => this.registerEditorExtension(handler));

		// This adds a command that can be triggered anywhere
		this.addCommand({
			id: "toggle-auto-numbering",
			name: "toggle auto numbering",
			callback: async () => {
				const app = this.app; // this is the obsidian App instance
				const activeView =
					app.workspace.getActiveViewOfType(MarkdownView);
				if (!activeView) {
					new Notice(
						"No active MarkdownView, cannot toggle auto numbering."
					);
					return;
				}
				// Toggle header numbering on/off - direct toggle without dialog
				if (this.settings.autoNumberingMode !== AutoNumberingMode.OFF) {
					this.settings.autoNumberingMode = AutoNumberingMode.OFF;
					new Notice("Auto numbering is off");
					await this.handleRemoveHeaderNumber(activeView);
				} else {
					// Turn on auto-numbering directly
					this.settings.autoNumberingMode = AutoNumberingMode.ON;
					new Notice("Auto numbering is on");
					await this.handleAddHeaderNumber(activeView);
				}
				await this.saveSettings();
				this.handleShowStateBarChange();
			},
		});

		this.addCommand({
			id: "add-auto-numbering-yaml",
			name: "add auto numbering yaml",
			callback: () => {
				const app = this.app;
				const activeView =
					app.workspace.getActiveViewOfType(MarkdownView);
				if (!activeView) {
					new Notice(
						"No active MarkdownView, cannot add auto numbering yaml."
					);
					return;
				} else {
					const editor = activeView.editor;
					const yaml = getAutoNumberingYaml(editor);
					if (yaml === "") {
						setAutoNumberingYaml(editor);
					} else {
						new Notice("auto numbering yaml already exists");
					}
				}
			},
		});

		this.addCommand({
			id: "reset-auto-numbering-yaml",
			name: "reset auto numbering yaml",
			callback: () => {
				const app = this.app;
				const activeView =
					app.workspace.getActiveViewOfType(MarkdownView);
				if (!activeView) {
					new Notice(
						"No active MarkdownView, cannot reset auto numbering yaml."
					);
					return;
				} else {
					const editor = activeView.editor;
					const yaml = getAutoNumberingYaml(editor);
					if (yaml === "") {
						new Notice("auto numbering yaml not exists");
					} else {
						const value = [
							"state on",
							"first-level h2",
							"max 1",
							"start-at 1",
							"separator .",
						];
						setAutoNumberingYaml(editor, value);
					}
				}
			},
		});

		this.addCommand({
			id: "remove-auto-numbering-yaml",
			name: "remove auto numbering yaml",
			callback: () => {
				const app = this.app;
				const activeView =
					app.workspace.getActiveViewOfType(MarkdownView);
				if (!activeView) {
					new Notice(
						"No active MarkdownView, cannot remove auto numbering yaml."
					);
					return;
				} else {
					const editor = activeView.editor;
					const yaml = getAutoNumberingYaml(editor);
					if (yaml === "") {
						new Notice("auto numbering yaml not exists");
					} else {
						setAutoNumberingYaml(editor, []);
					}
				}
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new HeaderEnhancerSettingTab(this.app, this));

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(
			window.setInterval(() => {
				// Reserved for future periodic maintenance tasks
			}, 5 * 60 * 1000)
		);
	}

	onunload() {
		// Clean up styles
		this.styleManager.removeCSSStyles();
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
		// Update style manager with new settings
		this.styleManager.updateSettings(this.settings);
	}

	handleShowStateBarChange() {
		if (this.settings.showOnStatusBar) {
			// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
			const i18n = I18n.getInstance();
			let autoNumberingStatus: string;
			switch (this.settings.autoNumberingMode) {
				case AutoNumberingMode.OFF:
					autoNumberingStatus = i18n.t("statusBar.off");
					break;
				case AutoNumberingMode.ON:
					autoNumberingStatus = i18n.t("statusBar.on");
					break;
				case AutoNumberingMode.YAML_CONTROLLED:
					autoNumberingStatus = i18n.t("statusBar.yaml");
					break;
				default:
					autoNumberingStatus = "Unknown";
					break;
			}
			this.statusBarItemEl.setText(
				`${i18n.t("statusBar.title")}: ${autoNumberingStatus}`
			);
			this.statusBarItemEl.show();
		} else {
			this.statusBarItemEl.hide();
		}
	}

	handleShowSidebarChange() {
		if (this.settings.showOnSidebar) {
			this.ribbonIconEl.show();
		} else {
			this.ribbonIconEl.hide();
		}
	}

	async handleAddHeaderNumber(view: MarkdownView): Promise<boolean> {
		const editor = view.editor;
		const lineCount = editor.lineCount();
		let docCharCount = 0;

		const config = getAutoNumberingConfig(this.settings, editor);

		if (this.settings.autoNumberingMode !== AutoNumberingMode.ON) {
			return false;
		}

		// Get current file for backlink processing
		const currentFile = view.file;
		const headerChanges: Array<{lineIndex: number, oldText: string, newText: string, originalHeading: string}> = [];

		if (config.state) {
			let insertNumber: number[] = [Number(config.startNumber) - 1];
			let isCodeBlock: boolean = false;
			for (let i = 0; i <= lineCount; i++) {
				const line = editor.getLine(i);
				docCharCount += line.length;

				if (line.startsWith("```")) {
					isCodeBlock = !isCodeBlock;
					if (line.slice(3).contains("```")) {
						isCodeBlock = !isCodeBlock;
					}
				}

				if (isCodeBlock) {
					continue;
				}

				if (isHeader(line)) {
					const [headerLevel, realHeaderLevel] = getHeaderLevel(
						line,
						config.startLevel
					);
					if (headerLevel <= 0) {
						continue;
					}
					insertNumber = getNextNumber(insertNumber, headerLevel);
					const insertNumberStr = insertNumber.join(config.separator);
					
					let newLine: string | null = null;
					let originalHeading: string | null = null;
					
					if (
						isNeedInsertNumber(
							line,
							this.settings.autoNumberingHeaderSeparator
						)
					) {
						// Add numbering to header - extract original title
						originalHeading = line.substring(realHeaderLevel + 1).trim();
						
						newLine = "#".repeat(realHeaderLevel) +
							" " +
							insertNumberStr +
							this.settings.autoNumberingHeaderSeparator +
							line.substring(realHeaderLevel + 1);
					} else if (
						isNeedUpdateNumber(
							insertNumberStr,
							line,
							this.settings.autoNumberingHeaderSeparator
						)
					) {
						// Update existing numbering - extract title after separator
						const textAfterSeparator = line.split(this.settings.autoNumberingHeaderSeparator)[1];
						originalHeading = textAfterSeparator ? textAfterSeparator.trim() : null;
						
						const originNumberLength = line
							.split(
								this.settings.autoNumberingHeaderSeparator
							)[0]
							.split(" ")[1].length;
						newLine = "#".repeat(realHeaderLevel) +
							" " +
							insertNumberStr +
							line.substring(
								realHeaderLevel + originNumberLength + 1
							);
					}

					// Record header changes for backlink updates
					if (newLine && newLine !== line && originalHeading) {
						headerChanges.push({
							lineIndex: i,
							oldText: line,
							newText: newLine,
							originalHeading: originalHeading
						});
						
						// Apply changes
						editor.setLine(i, newLine);
					}
				}
			}

			// Handle backlink updates
			if (this.settings.updateBacklinks && headerChanges.length > 0 && currentFile) {
				await this.updateBacklinksForChanges(currentFile, headerChanges);
			}
		}
		return true;
	}

	/**
	 * Handle backlink updates when headers change
	 */
	private async updateBacklinksForChanges(
		currentFile: TFile, 
		headerChanges: Array<{lineIndex: number, oldText: string, newText: string, originalHeading: string}>
	): Promise<void> {
		try {
			for (const change of headerChanges) {
				const oldHeading = change.originalHeading;
				// const newHeading = this.extractHeadingText(change.newText);
				
				// Update backlinks when header format changes (numbering added)
				if (oldHeading && change.oldText !== change.newText) {
					// Find backlinks pointing to the old heading
					const backlinks = await this.backlinkManager.findHeadingBacklinks(
						currentFile, 
						oldHeading.trim()
					);
					
					// Create updated links with new heading format
					const updates = backlinks.map(link => {
						const fullNewHeading = this.extractFullHeadingWithNumber(change.newText);
						const newLink = link.oldLink.replace(
							`#${oldHeading.trim()}`, 
							`#${fullNewHeading}`
						);
						return {
							...link,
							newLink: newLink
						};
					});
					
					// Update backlinks in batch
					if (updates.length > 0) {
						await this.backlinkManager.updateBacklinks(updates);
					}
				}
			}
		} catch (error) {
			console.error('Error updating backlinks:', error);
			new Notice('Failed to update backlinks: ' + error.message);
		}
	}

	/**
	 * Extract plain heading text (remove # symbols and numbering)
	 */
	private extractHeadingText(headerLine: string): string | null {
		// Match header line: ## [optional numbering] header text
		// Support various numbering formats: 1.1, 1.1\t, etc.
		const match = headerLine.match(/^#+\s*(?:\d+[\.\-\/,]*\d*\s*[\t\s]*)?\s*(.+)$/);
		return match ? match[1].trim() : null;
	}

	/**
	 * Extract full heading text with numbering (remove # symbols but keep numbering)
	 */
	private extractFullHeadingWithNumber(headerLine: string): string {
		// Match header line: ## numbering header text, extract numbering + header part
		const match = headerLine.match(/^#+\s*(.+)$/);
		return match ? match[1].trim() : headerLine;
	}

	async handleRemoveHeaderNumber(view: MarkdownView): Promise<boolean> {
		const editor = view.editor;
		const lineCount = editor.lineCount();

		const config = getAutoNumberingConfig(this.settings, editor);
		
		// Get current file for backlink processing
		const currentFile = view.file;
		const headerChanges: Array<{lineIndex: number, oldText: string, newText: string, originalHeading: string}> = [];

		if (this.settings.autoNumberingMode !== AutoNumberingMode.ON) {
			for (let i = 0; i <= lineCount; i++) {
				const line = editor.getLine(i);
				if (isHeader(line)) {
					const [headerLevel, _] = getHeaderLevel(
						line,
						config.startLevel
					);
					if (headerLevel <= 0) {
						continue;
					}
					
					const newLine = removeHeaderNumber(
						line,
						this.settings.autoNumberingHeaderSeparator
					);
					
					// Only record and update when line actually changes
					if (newLine !== line) {
						// Extract pure title text after removing numbering
						const originalHeading = this.extractHeadingText(newLine);
						
						if (originalHeading) {
							headerChanges.push({
								lineIndex: i,
								oldText: line,
								newText: newLine,
								originalHeading: originalHeading
							});
						}
						
						editor.setLine(i, newLine);
					}
				}
			}
			
			// Handle backlink updates - from numbered format back to original format
			if (this.settings.updateBacklinks && headerChanges.length > 0 && currentFile) {
				await this.updateBacklinksForRemoval(currentFile, headerChanges);
			}
		}
		return true;
	}

	/**
	 * Handle backlink updates when removing header numbers
	 */
	private async updateBacklinksForRemoval(
		currentFile: TFile, 
		headerChanges: Array<{lineIndex: number, oldText: string, newText: string, originalHeading: string}>
	): Promise<void> {
		try {
			for (const change of headerChanges) {
				const oldFullHeading = this.extractFullHeadingWithNumber(change.oldText);
				const newHeading = change.originalHeading;
				
				if (oldFullHeading && newHeading) {
					// Find backlinks pointing to the numbered heading
					const backlinks = await this.backlinkManager.findHeadingBacklinks(
						currentFile, 
						oldFullHeading
					);
					
					// Create updated links - from numbered format back to original format
					const updates = backlinks.map(link => {
						const newLink = link.oldLink.replace(
							`#${oldFullHeading}`, 
							`#${newHeading}`
						);
						return {
							...link,
							newLink: newLink
						};
					});
					
					// Update backlinks in batch
					if (updates.length > 0) {
						await this.backlinkManager.updateBacklinks(updates);
					}
				}
			}
		} catch (error) {
			console.error('Error updating backlinks for removal:', error);
			new Notice('Failed to update backlinks during removal: ' + error.message);
		}
	}

}
