import { MarkdownView, Notice, Plugin } from "obsidian";
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

export default class HeaderEnhancerPlugin extends Plugin {
	settings: HeaderEnhancerSettings;
	statusBarItemEl: HTMLElement;

	async onload() {
		await this.loadSettings();

		// Creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon(
			"heading-glyph",
			"Header Enhancer",
			(evt: MouseEvent) => {
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
					this.handleRemoveHeaderNumber(activeView);
				} else {
					// turn on auto-numbering
					this.settings.autoNumberingMode = AutoNumberingMode.ON;
					new Notice("Auto numbering is on");
					this.handleAddHeaderNumber(activeView);
				}
				this.handleShowStateBarChange();
			}
		);

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		this.statusBarItemEl = this.addStatusBarItem();
		this.handleShowStateBarChange();

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
			callback: () => {
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
					this.handleRemoveHeaderNumber(activeView);
				} else {
					// turn on auto-numbering
					this.settings.autoNumberingMode = AutoNumberingMode.ON;
					new Notice("Auto numbering is on");
					this.handleAddHeaderNumber(activeView);
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
			window.setInterval(() => console.log("setInterval"), 5 * 60 * 1000)
		);
	}

	onunload() {}

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

	handleAddHeaderNumber(view: MarkdownView): boolean {
		const editor = view.editor;
		const lineCount = editor.lineCount();
		let docCharCount = 0;

		const config = getAutoNumberingConfig(this.settings, editor);

		if (this.settings.autoNumberingMode !== AutoNumberingMode.ON) {
			return false;
		}

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
					if (
						isNeedInsertNumber(
							line,
							this.settings.autoNumberingHeaderSeparator
						)
					) {
						editor.setLine(
							i,
							"#".repeat(realHeaderLevel) +
								" " +
								insertNumberStr +
								this.settings.autoNumberingHeaderSeparator +
								line.substring(realHeaderLevel + 1)
						);
					} else if (
						isNeedUpdateNumber(
							insertNumberStr,
							line,
							this.settings.autoNumberingHeaderSeparator
						)
					) {
						const originNumberLength = line
							.split(
								this.settings.autoNumberingHeaderSeparator
							)[0]
							.split(" ")[1].length;
						editor.setLine(
							i,
							"#".repeat(realHeaderLevel) +
								" " +
								insertNumberStr +
								line.substring(
									realHeaderLevel + originNumberLength + 1
								)
						);
					}
				}
			}
		}
		return true;
	}

	handleRemoveHeaderNumber(view: MarkdownView): boolean {
		const editor = view.editor;
		const lineCount = editor.lineCount();

		const config = getAutoNumberingConfig(this.settings, editor);

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
					editor.setLine(
						i,
						removeHeaderNumber(
							line,
							this.settings.autoNumberingHeaderSeparator
						)
					);
				}
			}
		}
		return true;
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
			setTimeout(() => {
				this.handleAddHeaderNumber(activeView);
			}, 10);
		}
		
		return true;
	}

	handlePressBackspace(view: EditorView): boolean {
		let state = view.state;
		let doc = state.doc;
		const pos = state.selection.main.to;
		// let posLine = doc.lineAt(pos)
		const lineCount = doc.lines;
		const changes = [];
		let docCharCount = 0;
		let insertCharCount = 0;
		let insertCharCountBeforePos = 0; // count of inserted chars, used to calculate the position of cursor

		if (!isHeader(doc.lineAt(pos).text)) {
			return false;
		}

		// instert a new line in current pos first
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
}
