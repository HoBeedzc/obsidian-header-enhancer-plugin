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
} from "./setting";
import { getAutoNumberingConfig } from "./config";

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
				if (this.settings.isAutoNumbering) {
					this.settings.isAutoNumbering = false;
					new Notice("Auto numbering is off");
					this.handleRemoveHeaderNumber(activeView);
				} else {
					// turn on auto-numbering
					this.settings.isAutoNumbering = true;
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
							const success = this.handlePressEnter(view);
							return success;
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
							const success = this.handlePressBackspace(view);
							return success;
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
				if (this.settings.isAutoNumbering) {
					this.settings.isAutoNumbering = false;
					new Notice("Auto numbering is off");
					this.handleRemoveHeaderNumber(activeView);
				} else {
					// turn on auto-numbering
					this.settings.isAutoNumbering = true;
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
			const autoNumberingStatus = this.settings.isAutoNumbering
				? "On"
				: "Off";
			this.statusBarItemEl.setText(
				"Auto Numbering: " + autoNumberingStatus
			);
		} else {
			this.statusBarItemEl.setText("");
		}
	}

	handleAddHeaderNumber(view: MarkdownView): boolean {
		const editor = view.editor;
		const lineCount = editor.lineCount();
		let docCharCount = 0;

		const config = getAutoNumberingConfig(this.settings, editor);

		if (!this.settings.isAutoNumbering) {
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

		if (!this.settings.isAutoNumbering) {
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

	handlePressEnter(view: EditorView): boolean {
		let state = view.state;
		let doc = state.doc;
		const pos = state.selection.main.to;
		// let posLine = doc.lineAt(pos)
		const lineCount = doc.lines;
		const changes = [];
		let docCharCount = 0;
		let insertCharCount = 0;
		let insertCharCountBeforePos = 0; // count of inserted chars, used to calculate the position of cursor

		const app = this.app; // this is the obsidian App instance
		const activeView = app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView) {
			new Notice("No active MarkdownView, cannot toggle auto numbering.");
			return false;
		}

		if (!this.settings.isAutoNumbering) {
			return false;
		}

		const editor = activeView.editor;
		const config = getAutoNumberingConfig(this.settings, editor);

		if (!isHeader(doc.lineAt(pos).text)) {
			return false;
		}

		// instert a new line in current pos first
		changes.push({
			from: pos,
			to: pos,
			insert: "\n",
		});

		if (config.state) {
			let insertNumber = [Number(config.startNumber) - 1];
			let isCodeBlock :boolean = false;
			for (let i = 1; i <= lineCount; i++) {
				const line = doc.line(i);
				const fromPos = line.from;
				docCharCount += line.length;
				
				if (line.text.startsWith("```")) {
					isCodeBlock = !isCodeBlock;
					if (line.text.slice(3).contains("```")) {
						isCodeBlock = !isCodeBlock;
					}
				}

				if (isCodeBlock) {
					continue;
				}
				

				if (isHeader(line.text)) {
					const [headerLevel, realHeaderLevel] = getHeaderLevel(
						line.text,
						config.startLevel
					);
					if (headerLevel <= 0) {
						continue;
					}
					insertNumber = getNextNumber(insertNumber, headerLevel);
					const insertNumberStr = insertNumber.join(config.separator);

					if (
						isNeedInsertNumber(
							line.text,
							this.settings.autoNumberingHeaderSeparator
						)
					) {
						if (docCharCount <= pos) {
							insertCharCountBeforePos +=
								insertNumberStr.length + 1;
						}
						insertCharCount += insertNumberStr.length + 1;
						docCharCount += insertNumberStr.length + 1;
						changes.push({
							from: fromPos + realHeaderLevel + 1,
							to: fromPos + realHeaderLevel + 1,
							insert:
								insertNumberStr +
								this.settings.autoNumberingHeaderSeparator,
						});
					} else if (
						isNeedUpdateNumber(
							insertNumberStr,
							line.text,
							this.settings.autoNumberingHeaderSeparator
						)
					) {
						const fromPos = line.from + realHeaderLevel + 1;
						const toPos =
							fromPos +
							line.text
								.split(
									this.settings.autoNumberingHeaderSeparator
								)[0]
								.split(" ")[1].length;
						if (docCharCount <= pos) {
							insertCharCountBeforePos +=
								insertNumberStr.length - toPos + fromPos;
						}
						insertCharCount +=
							insertNumberStr.length - toPos + fromPos;
						docCharCount +=
							insertNumberStr.length - toPos + fromPos;
						changes.push({
							from: fromPos,
							to: toPos,
							insert: insertNumberStr,
						});
					}
				}
			}
		}

		view.dispatch({
			changes,
			selection: { anchor: pos + 1 + insertCharCountBeforePos },
			userEvent: "HeaderEnhancer.changeAutoNumbering",
		});

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

		if (this.settings.isAutoNumbering) {
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
