import { Editor, MarkdownView, Notice, Plugin, TFile } from "obsidian";

import {
	getHeaderLevel,
	getNextNumber,
	isNeedUpdateNumber,
	isNeedInsertNumber,
	removeHeaderNumber,
	isHeader,
	analyzeHeaderLevels,
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
	private perDocumentStatesMap: Map<string, boolean> = new Map();

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
				const i18n = I18n.getInstance();
				const app = this.app;
				const activeView = app.workspace.getActiveViewOfType(MarkdownView);
				if (!activeView?.file) {
					new Notice(i18n.t("notices.noActiveView"));
					return;
				}

				const filePath = activeView.file.path;
				
				// Check if global function is disabled
				if (!this.settings.globalAutoNumberingEnabled) {
					new Notice(i18n.t("notices.globalDisabledNotice"));
					return;
				}

				// Toggle document-specific state
				const currentState = this.getDocumentAutoNumberingState(filePath);
				const newState = !currentState;
				
				await this.setDocumentAutoNumberingState(filePath, newState);

				// Apply changes to document based on new state
				if (newState) {
					// Enable: add numbering to current document
					await this.handleAddHeaderNumber(activeView);
					new Notice(i18n.t("notices.autoNumberingEnabledForDocument"));
				} else {
					// Disable: remove numbering from current document
					await this.handleRemoveHeaderNumber(activeView);
					new Notice(i18n.t("notices.autoNumberingDisabledForDocument"));
				}

				this.updateAllUIStates();
			}
		);

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		this.statusBarItemEl = this.addStatusBarItem();
		this.handleShowStateBarChange();
		this.handleShowSidebarChange();

		// Update all UI states after initialization
		this.updateAllUIStates();

		// Register editor extensions
		const keyHandlers = this.editorHandlers.registerKeyHandlers();
		keyHandlers.forEach(handler => this.registerEditorExtension(handler));

		// Register event listeners for document switching
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', () => {
				// Always update UI states when switching documents
				this.updateAllUIStates();
			})
		);
		
		// Also listen for file open events to ensure state sync
		this.registerEvent(
			this.app.workspace.on('file-open', () => {
				// Small delay to ensure the view is fully loaded
				setTimeout(() => {
					this.updateAllUIStates();
				}, 50);
			})
		);

		// Initialize i18n
		const i18n = I18n.getInstance();
		
		// Global toggle command
		this.addCommand({
			id: "toggle-global-auto-numbering",
			name: i18n.t("commands.toggleGlobalAutoNumbering"),
			callback: async () => {
				const newState = !this.settings.globalAutoNumberingEnabled;
				this.settings.globalAutoNumberingEnabled = newState;
				await this.saveSettings();
				
				new Notice(newState ? i18n.t("notices.globalAutoNumberingEnabled") : i18n.t("notices.globalAutoNumberingDisabled"));
				this.updateAllUIStates();
			},
		});

		// Document toggle command
		this.addCommand({
			id: "toggle-document-auto-numbering",
			name: i18n.t("commands.toggleDocumentAutoNumbering"),
			callback: async () => {
				const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (!activeView?.file) {
					new Notice(i18n.t("notices.noActiveView"));
					return;
				}

				const filePath = activeView.file.path;
				
				// Check if global function is disabled
				if (!this.settings.globalAutoNumberingEnabled) {
					new Notice(i18n.t("notices.globalDisabledNotice"));
					return;
				}

				// Toggle document-specific state
				const currentState = this.getDocumentAutoNumberingState(filePath);
				const newState = !currentState;
				
				await this.setDocumentAutoNumberingState(filePath, newState);

				// Apply changes to document based on new state
				if (newState) {
					await this.handleAddHeaderNumber(activeView);
					new Notice(i18n.t("notices.autoNumberingEnabledForDocument"));
				} else {
					await this.handleRemoveHeaderNumber(activeView);
					new Notice(i18n.t("notices.autoNumberingDisabledForDocument"));
				}

				this.updateAllUIStates();
			},
		});

		// Remove the legacy toggle command to avoid confusion
		// Only keep the two clear, distinct commands: Global and Document

		this.addCommand({
			id: "add-auto-numbering-yaml",
			name: i18n.t("commands.addAutoNumberingYaml"),
			callback: () => {
				const app = this.app;
				const activeView =
					app.workspace.getActiveViewOfType(MarkdownView);
				if (!activeView) {
					new Notice(i18n.t("notices.noActiveView"));
					return;
				} else {
					const editor = activeView.editor;
					const yaml = getAutoNumberingYaml(editor);
					if (yaml === "") {
						setAutoNumberingYaml(editor);
					} else {
						new Notice(i18n.t("notices.yamlAlreadyExists"));
					}
				}
			},
		});

		this.addCommand({
			id: "reset-auto-numbering-yaml",
			name: i18n.t("commands.resetAutoNumberingYaml"),
			callback: () => {
				const app = this.app;
				const activeView =
					app.workspace.getActiveViewOfType(MarkdownView);
				if (!activeView) {
					new Notice(i18n.t("notices.noActiveView"));
					return;
				} else {
					const editor = activeView.editor;
					const yaml = getAutoNumberingYaml(editor);
					if (yaml === "") {
						new Notice(i18n.t("notices.yamlNotExists"));
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
			name: i18n.t("commands.removeAutoNumberingYaml"),
			callback: () => {
				const app = this.app;
				const activeView =
					app.workspace.getActiveViewOfType(MarkdownView);
				if (!activeView) {
					new Notice(i18n.t("notices.noActiveView"));
					return;
				} else {
					const editor = activeView.editor;
					const yaml = getAutoNumberingYaml(editor);
					if (yaml === "") {
						new Notice(i18n.t("notices.yamlNotExists"));
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
		
		// Backward compatibility migration
		this.migrateSettings();
		
		// Load per-document states from JSON string
		try {
			if (this.settings.perDocumentStates) {
				const parsedStates = JSON.parse(this.settings.perDocumentStates);
				this.perDocumentStatesMap = new Map(Object.entries(parsedStates));
			}
		} catch (error) {
			console.warn('Failed to parse perDocumentStates, using empty map:', error);
			this.perDocumentStatesMap = new Map();
		}
	}

	/**
	 * Migrate settings for backward compatibility
	 */
	private migrateSettings() {
		// If globalAutoNumberingEnabled is undefined (old version), set it based on current mode
		if (this.settings.globalAutoNumberingEnabled === undefined) {
			// Enable global toggle if mode is not OFF
			this.settings.globalAutoNumberingEnabled = this.settings.autoNumberingMode !== AutoNumberingMode.OFF;
		}
		
		// Initialize perDocumentStates if undefined
		if (this.settings.perDocumentStates === undefined) {
			this.settings.perDocumentStates = "{}";
		}
	}

	async saveSettings() {
		// Convert per-document states map to JSON string before saving
		const statesObject = Object.fromEntries(this.perDocumentStatesMap.entries());
		this.settings.perDocumentStates = JSON.stringify(statesObject);
		
		await this.saveData(this.settings);
		// Update style manager with new settings
		this.styleManager.updateSettings(this.settings);
	}

	/**
	 * Get the current document auto numbering state
	 * Legacy method - now uses unified state evaluation
	 */
	getDocumentAutoNumberingState(filePath: string): boolean {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView?.file || activeView.file.path !== filePath) {
			// For non-active documents, use simplified logic without YAML parsing
			return this.getSimpleDocumentState(filePath);
		}
		
		// For active document, use full state evaluation including YAML
		return this.getUnifiedDocumentState(activeView.editor, filePath);
	}

	/**
	 * Get unified document auto numbering state - includes YAML parsing
	 * This ensures UI and actual numbering use exactly the same logic
	 */
	getUnifiedDocumentState(editor: Editor, filePath: string): boolean {
		// Use the exact same logic as getAutoNumberingConfig but only return the state
		const config = getAutoNumberingConfig(
			this.settings, 
			editor,
			(path: string) => this.getSimpleDocumentState(path),
			filePath
		);
		
		// Debug logging for development - can be removed in production
		if (this.settings.language === 'debug' || console.debug) {
			console.debug(`HeaderEnhancer: Unified state for ${filePath}:`, {
				state: config.state,
				mode: this.settings.autoNumberingMode,
				globalEnabled: this.settings.globalAutoNumberingEnabled,
				hasPerDocumentState: this.perDocumentStatesMap.has(filePath),
				perDocumentState: this.perDocumentStatesMap.get(filePath)
			});
		}
		
		return config.state;
	}

	/**
	 * Get simple document state without YAML parsing (for non-active documents)
	 */
	private getSimpleDocumentState(filePath: string): boolean {
		// If global is disabled, always return false
		if (!this.settings.globalAutoNumberingEnabled) {
			return false;
		}
		
		// Check if this document has a specific state set
		if (this.perDocumentStatesMap.has(filePath)) {
			return this.perDocumentStatesMap.get(filePath) ?? false;
		}
		
		// For new documents, default based on current auto numbering mode
		// Both ON and YAML modes should be considered enabled by default
		return this.settings.autoNumberingMode !== AutoNumberingMode.OFF;
	}

	/**
	 * Set the current document auto numbering state
	 */
	async setDocumentAutoNumberingState(filePath: string, enabled: boolean): Promise<void> {
		this.perDocumentStatesMap.set(filePath, enabled);
		await this.saveSettings();
	}

	/**
	 * Update all UI states (ribbon icon, status bar)
	 */
	updateAllUIStates(): void {
		this.updateRibbonIconState();
		this.handleShowStateBarChange();
	}

	/**
	 * Update ribbon icon state based on global and document settings
	 */
	updateRibbonIconState(): void {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		
		// Handle case when no active markdown document
		if (!activeView?.file) {
			if (!this.settings.globalAutoNumberingEnabled) {
				this.ribbonIconEl.addClass('header-enhancer-global-disabled');
				this.ribbonIconEl.removeClass('header-enhancer-document-enabled');
				this.ribbonIconEl.removeClass('header-enhancer-document-disabled');
				this.ribbonIconEl.setAttribute('aria-label', 'Header Enhancer (Global Disabled)');
			} else {
				this.ribbonIconEl.removeClass('header-enhancer-global-disabled');
				this.ribbonIconEl.removeClass('header-enhancer-document-enabled');
				this.ribbonIconEl.addClass('header-enhancer-document-disabled');
				this.ribbonIconEl.setAttribute('aria-label', 'Header Enhancer (No Active Document)');
			}
			return;
		}

		const filePath = activeView.file.path;
		const globalEnabled = this.settings.globalAutoNumberingEnabled;
		const documentEnabled = this.getDocumentAutoNumberingState(filePath);

		// Update icon appearance based on state
		if (!globalEnabled) {
			this.ribbonIconEl.addClass('header-enhancer-global-disabled');
			this.ribbonIconEl.removeClass('header-enhancer-document-enabled');
			this.ribbonIconEl.removeClass('header-enhancer-document-disabled');
			this.ribbonIconEl.setAttribute('aria-label', 'Header Enhancer (Global Disabled)');
		} else if (documentEnabled) {
			this.ribbonIconEl.removeClass('header-enhancer-global-disabled');
			this.ribbonIconEl.addClass('header-enhancer-document-enabled');
			this.ribbonIconEl.removeClass('header-enhancer-document-disabled');
			this.ribbonIconEl.setAttribute('aria-label', 'Header Enhancer (Document Enabled)');
		} else {
			this.ribbonIconEl.removeClass('header-enhancer-global-disabled');
			this.ribbonIconEl.removeClass('header-enhancer-document-enabled');
			this.ribbonIconEl.addClass('header-enhancer-document-disabled');
			this.ribbonIconEl.setAttribute('aria-label', 'Header Enhancer (Document Disabled)');
		}
	}

	handleShowStateBarChange() {
		if (this.settings.showOnStatusBar) {
			const i18n = I18n.getInstance();
			let autoNumberingStatus: string;
			
			// Check global enablement first
			if (!this.settings.globalAutoNumberingEnabled) {
				autoNumberingStatus = i18n.t("statusBar.globalDisabled");
			} else {
				// Get current document state
				const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (!activeView?.file) {
					autoNumberingStatus = i18n.t("statusBar.off");
				} else {
					const filePath = activeView.file.path;
					const documentEnabled = this.getDocumentAutoNumberingState(filePath);
					
					if (documentEnabled) {
						// Document is enabled - show current mode details
						switch (this.settings.autoNumberingMode) {
							case AutoNumberingMode.ON:
								if (this.settings.isAutoDetectHeaderLevel) {
									const analysis = analyzeHeaderLevels(activeView.editor.getValue());
									if (!analysis.isEmpty) {
										autoNumberingStatus = `${i18n.t("statusBar.auto")}(H${analysis.minLevel}-H${analysis.maxLevel})`;
									} else {
										autoNumberingStatus = i18n.t("statusBar.autoNoHeaders");
									}
								} else {
									autoNumberingStatus = `${i18n.t("statusBar.on")}(H${this.settings.startHeaderLevel}-H${this.settings.endHeaderLevel})`;
								}
								break;
							case AutoNumberingMode.YAML_CONTROLLED:
								autoNumberingStatus = i18n.t("statusBar.yaml");
								break;
							case AutoNumberingMode.OFF:
							default:
								autoNumberingStatus = i18n.t("statusBar.documentEnabled");
								break;
						}
					} else {
						autoNumberingStatus = i18n.t("statusBar.documentDisabled");
					}
				}
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

		// Pass the document state getter to config
		const filePath = view.file?.path;
		const config = getAutoNumberingConfig(
			this.settings, 
			editor,
			filePath ? (path: string) => this.getDocumentAutoNumberingState(path) : undefined,
			filePath
		);

		// Check if numbering should be applied based on all conditions
		if (!config.state) {
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

		// Pass the document state getter to config
		const filePath = view.file?.path;
		const config = getAutoNumberingConfig(
			this.settings, 
			editor,
			filePath ? (path: string) => this.getDocumentAutoNumberingState(path) : undefined,
			filePath
		);
		
		// Get current file for backlink processing
		const currentFile = view.file;
		const headerChanges: Array<{lineIndex: number, oldText: string, newText: string, originalHeading: string}> = [];

		// Always attempt to remove numbering regardless of current state
		// This allows cleanup even when auto numbering is disabled
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
