import { MarkdownView, Notice, Plugin, } from 'obsidian';
import { EditorView, keymap } from '@codemirror/view';
import { Prec } from "@codemirror/state";

import { getHeaderLevel, getNextNumber, isNeedUpdateNumber, isNeedInsertNumber, removeHeaderNumber } from './core';
import { HeaderEnhancerSettingTab, DEFAULT_SETTINGS, HeaderEnhancerSettings } from './setting';

export default class HeaderEnhancerPlugin extends Plugin {
	settings: HeaderEnhancerSettings;
	statusBarItemEl: HTMLElement;

	async onload() {
		await this.loadSettings();

		// Creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('document', 'Header Enhancer', (evt: MouseEvent) => {
			const activeView = app.workspace.getActiveViewOfType(MarkdownView);
			if (!activeView) {
				new Notice('No active MarkdownView, cannot toggle automatic numbering.');
				return;
			}
			// toggle header numbering on/off
			if (this.settings.isAutoNumbering) {
				this.settings.isAutoNumbering = false;
				new Notice('Automatic numbering is off');
				this.handleRemoveHeaderNumber(activeView);
			} else {
				// turn on auto-numbering
				this.settings.isAutoNumbering = true;
				new Notice('Automatic numbering is on');
				this.handleAddHeaderNumber(activeView);
			}
			this.handleShowStateBarChange();
		});

		// Perform additional things with the ribbon
		ribbonIconEl.addClass('header-enhancer-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		this.statusBarItemEl = this.addStatusBarItem();
		this.handleShowStateBarChange();

		// 
		this.registerEditorExtension(Prec.highest(keymap.of([
			{
				key: "Enter",
				run: (view: EditorView): boolean => {
					const success = this.handlePressEnter(view);
					return success;
				}
			}
		])));

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'toggle-automatic-numbering',
			name: 'Toggle automatic numbering',
			callback: () => {
				const activeView = app.workspace.getActiveViewOfType(MarkdownView);
				if (!activeView) {
					new Notice('No active MarkdownView, cannot toggle automatic numbering.');
					return;
				}
				// toggle header numbering on/off
				if (this.settings.isAutoNumbering) {
					this.settings.isAutoNumbering = false;
					new Notice('Automatic numbering is off');
					this.handleRemoveHeaderNumber(activeView);
				} else {
					// turn on auto-numbering
					this.settings.isAutoNumbering = true;
					new Notice('Automatic numbering is on');
					this.handleAddHeaderNumber(activeView);
				}
				this.handleShowStateBarChange();
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new HeaderEnhancerSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	handleShowStateBarChange() {
		if (this.settings.showOnStatusBar) {
			// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
			const autoNumberingStatus = this.settings.isAutoNumbering ? 'On' : 'Off';
			this.statusBarItemEl.setText('Automatic Numbering: ' + autoNumberingStatus);
		} else {
			this.statusBarItemEl.setText('');
		}
	}

	handleAddHeaderNumber(view: MarkdownView): boolean {
		const editor = view.editor;
		const lineCount = editor.lineCount();
		let docCharCount = 0;

		if (this.settings.isAutoNumbering) {
			let insertNumber = [Number(this.settings.autoNumberingStartNumber) - 1];
			for (let i = 0; i <= lineCount; i++) {
				const line = editor.getLine(i);
				// const fromPos = line.from;
				docCharCount += line.length;

				if (!line.startsWith('#')) continue; // not a header
				else if (line.startsWith('######')) continue; // H7 ignore
				else {
					const headerLevel = getHeaderLevel(line);
					insertNumber = getNextNumber(insertNumber, headerLevel);
					const insertNumberStr = insertNumber.join(this.settings.autoNumberingSeparator);
					if (isNeedInsertNumber(line)) {
						editor.setLine(i, '#'.repeat(headerLevel) + ' ' + insertNumberStr + '\t' + line.substring(headerLevel + 1));
					}
					else if (isNeedUpdateNumber(insertNumberStr, line)) {
						const originNumberLength = line.split('\t')[0].split(' ')[1].length;
						editor.setLine(i, '#'.repeat(headerLevel) + ' ' + insertNumberStr + line.substring(headerLevel + originNumberLength + 1));
					}
				}
			}
		}
		return true;
	}

	handleRemoveHeaderNumber(view: MarkdownView): boolean {
		const editor = view.editor;
		const lineCount = editor.lineCount();
		let docCharCount = 0;

		if (!this.settings.isAutoNumbering) {
			let insertNumber = [Number(this.settings.autoNumberingStartNumber) - 1];
			for (let i = 0; i <= lineCount; i++) {
				const line = editor.getLine(i);
				// const fromPos = line.from;
				docCharCount += line.length;

				if (!line.startsWith('#')) continue; // not a header
				else if (line.startsWith('######')) continue; // H7 ignore
				else {
					editor.setLine(i, removeHeaderNumber(line));
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

		// instert a new line in current pos first
		changes.push({
			from: pos,
			to: pos,
			insert: '\n',
		});

		if (this.settings.isAutoNumbering) {
			let insertNumber = [Number(this.settings.autoNumberingStartNumber) - 1];
			for (let i = 1; i <= lineCount; i++) {
				const line = doc.line(i);
				const fromPos = line.from;
				docCharCount += line.length;

				if (!line.text.startsWith('#')) continue; // not a header
				else if (line.text.startsWith('######')) continue; // H7
				else {
					const headerLevel = getHeaderLevel(line.text);
					insertNumber = getNextNumber(insertNumber, headerLevel);
					const insertNumberStr = insertNumber.join(this.settings.autoNumberingSeparator);

					if (isNeedInsertNumber(line.text)) {
						if (docCharCount <= pos) {
							insertCharCountBeforePos += insertNumberStr.length + 1;
						}
						insertCharCount += insertNumberStr.length + 1;
						docCharCount += insertNumberStr.length + 1;
						changes.push({
							from: fromPos + headerLevel + 1,
							to: fromPos + headerLevel + 1,
							insert: insertNumberStr + '\t',
						});
					} else if (isNeedUpdateNumber(insertNumberStr, line.text)) {
						const fromPos = line.from + headerLevel + 1;
						const toPos = fromPos + line.text.split('\t')[0].split(' ')[1].length;
						if (docCharCount <= pos) {
							insertCharCountBeforePos += insertNumberStr.length - toPos + fromPos;
						}
						insertCharCount += insertNumberStr.length - toPos + fromPos;
						docCharCount += insertNumberStr.length - toPos + fromPos;
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

}
