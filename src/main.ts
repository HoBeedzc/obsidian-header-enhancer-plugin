import { MarkdownView, Notice, Plugin, TFile } from "obsidian";
import { EditorView, keymap } from "@codemirror/view";
import { Prec } from "@codemirror/state";

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

export default class HeaderEnhancerPlugin extends Plugin {
	settings: HeaderEnhancerSettings;
	statusBarItemEl: HTMLElement;
	ribbonIconEl: HTMLElement;
	backlinkManager: BacklinkManager;
	private headerFontStyleEl: HTMLStyleElement | null = null;
	private titleFontStyleEl: HTMLStyleElement | null = null;

	async onload() {
		await this.loadSettings();
		
		// Initialize backlink manager
		this.backlinkManager = new BacklinkManager(this.app);

		// Apply CSS styles for header and title fonts
		this.applyCSSStyles();

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
				// toggle header numbering on/off
				if (this.settings.autoNumberingMode !== AutoNumberingMode.OFF) {
					this.settings.autoNumberingMode = AutoNumberingMode.OFF;
					new Notice("Auto numbering is off");
					await this.handleRemoveHeaderNumber(activeView);
				} else {
					// turn on auto-numbering
					this.settings.autoNumberingMode = AutoNumberingMode.ON;
					new Notice("Auto numbering is on");
					await this.handleAddHeaderNumber(activeView);
				}
				this.handleShowStateBarChange();
			}
		);

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		this.statusBarItemEl = this.addStatusBarItem();
		this.handleShowStateBarChange();
		this.handleShowSidebarChange();

		// register keymap
		this.registerEditorExtension(
			Prec.highest(
				keymap.of([
					{
						key: "Enter",
						run: (view: EditorView): boolean => {
							const state = view.state;
							const pos = state.selection.main.to;
							const currentLine = state.doc.lineAt(pos);

							// 只有在标题行并且自动编号开启时才进行处理
							if (!isHeader(currentLine.text) || this.settings.autoNumberingMode === AutoNumberingMode.OFF) {
								return false; // 不处理，让默认处理程序处理
							}

							// 执行自定义Enter处理 - 异步调用但不等待结果
							this.handlePressEnter(view);
							return true; // 表示我们已经处理了这个事件
						},
					},
				])
			)
		);

		this.registerEditorExtension(
			Prec.highest(
				keymap.of([
					{
						key: "Backspace",
						run: (view: EditorView): boolean => {
							const state = view.state;
                    		const pos = state.selection.main.to;
                    		const currentLine = state.doc.lineAt(pos);
                    
                    		// 只有在标题行时才进行处理
                    		if (!isHeader(currentLine.text)) {
                        		return false; // 不处理，让默认处理程序处理
                    		}
                    
                    		return this.handlePressBackspace(view);
						},
					},
				])
			)
		);

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
				// toggle header numbering on/off
				if (this.settings.autoNumberingMode !== AutoNumberingMode.OFF) {
					this.settings.autoNumberingMode = AutoNumberingMode.OFF;
					new Notice("Auto numbering is off");
					await this.handleRemoveHeaderNumber(activeView);
				} else {
					// turn on auto-numbering
					this.settings.autoNumberingMode = AutoNumberingMode.ON;
					new Notice("Auto numbering is on");
					await this.handleAddHeaderNumber(activeView);
				}
				this.handleShowStateBarChange();
			},
		});

		this.addCommand({
			id: "add-auto-numbering-yaml",
			name: "add auto numbering yaml",
			callback: () => {
				app = this.app;
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
				app = this.app;
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
				app = this.app;
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
				// Periodic maintenance tasks can be added here
			}, 5 * 60 * 1000)
		);
	}

	onunload() {
		// Clean up header and title font styles
		this.removeCSSStyles();
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
						// 这是要添加编号的情况 - 提取原始标题
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
						// 这是要更新编号的情况 - 提取去除编号后的标题
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

					// 记录标题变化用于反向链接更新
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
					
					// 只有当行实际改变时才记录和更新
					if (newLine !== line) {
						// 提取移除编号后的纯标题文本
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
			
			// 处理反向链接更新 - 从编号格式更新回原始格式
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

	async handlePressEnter(view: EditorView): Promise<boolean> {
		let state = view.state;
		let doc = state.doc;
		const pos = state.selection.main.to;
		
		const app = this.app;
		const activeView = app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView) {
			return false; // 让默认处理程序处理
		}
	
		// 获取当前行信息
		const currentLine = doc.lineAt(pos);
		
		// 注意：这个检查已经在外层run函数做过了，这里可以简化
		// 但保留这个检查作为额外的安全措施
		if (!isHeader(currentLine.text) || this.settings.autoNumberingMode !== AutoNumberingMode.ON) {
			return false;
		}
	
		const editor = activeView.editor;
		const config = getAutoNumberingConfig(this.settings, editor);
		
		// 处理在标题中间按Enter的情况
		// 获取光标前后的文本
		const textBeforeCursor = currentLine.text.substring(0, pos - currentLine.from);
		const textAfterCursor = currentLine.text.substring(pos - currentLine.from);
		
		// 创建更改操作 - 直接替换整行，而不是分多次操作
		const changes = [{
			from: currentLine.from,
			to: currentLine.to,
			insert: textBeforeCursor + "\n" + textAfterCursor
		}];
		
		// 应用更改并设置光标位置
		view.dispatch({
			changes,
			selection: { anchor: currentLine.from + textBeforeCursor.length + 1 },
			userEvent: "HeaderEnhancer.changeAutoNumbering",
		});
		
		// 在操作完成后更新标题编号
		if (config.state) {
			// 使用setTimeout确保编辑操作已完成
			setTimeout(async () => {
				await this.handleAddHeaderNumber(activeView);
			}, 10);
		}
		
		return true;
	}

	handlePressBackspace(view: EditorView): boolean {
		let state = view.state;
		let doc = state.doc;
		const pos = state.selection.main.to;
		const changes = [];

		if (!isHeader(doc.lineAt(pos).text)) {
			return false;
		}

		// insert a new line in current pos first
		changes.push({
			from: pos - 1,
			to: pos,
			insert: "",
		});

		if (this.settings.autoNumberingMode === AutoNumberingMode.ON) {
			// some header may be deleted, so we need to recalculate the number
			// TODO: feature
		}

		view.dispatch({
			changes,
			selection: { anchor: pos - 1 },
			userEvent: "HeaderEnhancer.changeAutoNumbering",
		});

		return true;
	}

	/**
	 * Apply CSS styles for header and title font customization
	 */
	applyCSSStyles(): void {
		// Apply header font styles
		this.applyHeaderFontStyles();
		// Apply title font styles
		this.applyTitleFontStyles();
	}

	/**
	 * Apply CSS styles for header font customization
	 */
	applyHeaderFontStyles(): void {
		// Remove existing header font styles first
		this.removeHeaderFontStyles();
		
		if (!this.settings.isSeparateHeaderFont) {
			return;
		}

		// Create header font style element
		this.headerFontStyleEl = document.createElement('style');
		this.headerFontStyleEl.id = 'header-enhancer-header-font-styles';

		let cssRules = '';
		
		// Generate CSS selectors for all header levels (H1-H6)
		const headerSelectors = [
			'.markdown-preview-view h1',
			'.markdown-preview-view h2', 
			'.markdown-preview-view h3',
			'.markdown-preview-view h4',
			'.markdown-preview-view h5',
			'.markdown-preview-view h6',
			'.markdown-source-view.mod-cm6 .HyperMD-header-1',
			'.markdown-source-view.mod-cm6 .HyperMD-header-2',
			'.markdown-source-view.mod-cm6 .HyperMD-header-3',
			'.markdown-source-view.mod-cm6 .HyperMD-header-4',
			'.markdown-source-view.mod-cm6 .HyperMD-header-5',
			'.markdown-source-view.mod-cm6 .HyperMD-header-6'
		].join(', ');

		// Apply font family if set and not inherit
		if (this.settings.headerFontFamily && this.settings.headerFontFamily !== 'inherit') {
			cssRules += `${headerSelectors} { font-family: ${this.settings.headerFontFamily} !important; }\n`;
		}

		// Apply font size if set and not inherit  
		if (this.settings.headerFontSize && this.settings.headerFontSize !== 'inherit') {
			cssRules += `${headerSelectors} { font-size: ${this.settings.headerFontSize} !important; }\n`;
		}

		// Set the CSS content
		this.headerFontStyleEl.textContent = cssRules;
		
		// Append to document head
		if (cssRules) {
			document.head.appendChild(this.headerFontStyleEl);
		}
	}

	/**
	 * Apply CSS styles for title font customization
	 */
	applyTitleFontStyles(): void {
		// Remove existing title font styles first
		this.removeTitleFontStyles();
		
		if (!this.settings.isSeparateTitleFont) {
			return;
		}

		// Create title font style element
		this.titleFontStyleEl = document.createElement('style');
		this.titleFontStyleEl.id = 'header-enhancer-title-font-styles';

		let cssRules = '';
		
		// Generate CSS selectors for document titles - MUCH MORE SPECIFIC
		const titleSelectors = [
			// File title in tab - only target specific tab title elements
			'.workspace-tab-header-inner-title',
			'.workspace-tab-header .workspace-tab-header-inner-title', 
			'.workspace-tabs .workspace-tab-header-inner-title',
			// View header title
			'.workspace-leaf-content .view-header-title',
			// Document inline title (the main title displayed in document)
			'.inline-title',
			'.markdown-preview-view .inline-title',
			'.markdown-source-view .inline-title',
			// File title in file explorer
			'.nav-file-title-content',
			'.tree-item-inner.nav-file-title-content',
			// Frontmatter title display
			'.frontmatter-container .metadata-property[data-property-key="title"] .metadata-property-value'
		].join(', ');

		// Apply font family if set and not inherit
		if (this.settings.titleFontFamily && this.settings.titleFontFamily !== 'inherit') {
			cssRules += `${titleSelectors} { font-family: ${this.settings.titleFontFamily} !important; }\n`;
		}

		// Apply font size if set and not inherit  
		if (this.settings.titleFontSize && this.settings.titleFontSize !== 'inherit') {
			cssRules += `${titleSelectors} { font-size: ${this.settings.titleFontSize} !important; }\n`;
		}

		// Set the CSS content
		this.titleFontStyleEl.textContent = cssRules;
		
		// Append to document head
		if (cssRules) {
			document.head.appendChild(this.titleFontStyleEl);
		}
	}

	/**
	 * Remove CSS styles for header and title font customization
	 */
	removeCSSStyles(): void {
		this.removeHeaderFontStyles();
		this.removeTitleFontStyles();
	}

	/**
	 * Remove CSS styles for header font customization
	 */
	removeHeaderFontStyles(): void {
		if (this.headerFontStyleEl) {
			this.headerFontStyleEl.remove();
			this.headerFontStyleEl = null;
		}
	}

	/**
	 * Remove CSS styles for title font customization
	 */
	removeTitleFontStyles(): void {
		if (this.titleFontStyleEl) {
			this.titleFontStyleEl.remove();
			this.titleFontStyleEl = null;
		}
	}
}
