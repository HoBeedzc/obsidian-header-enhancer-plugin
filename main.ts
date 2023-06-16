import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { EditorState, Extension, StateField, Transaction, TransactionSpec, Text } from '@codemirror/state';
import { SelectionRange, Prec } from "@codemirror/state";
import { EditorView, keymap, ViewUpdate } from '@codemirror/view';

// Remember to rename these classes and interfaces!

interface HeaderEnhancerSettings {
	mySetting: string;
	language: string;
	startHeaderLevel: string;
	isAutoNumbering: boolean;
	autoNumberingStartNumber: string;
	autoNumberingSeparator: string;
	isSeparateTitleFont: boolean;
	titleFontFamily: string;
	titleFontSize: string;
}

const DEFAULT_SETTINGS: HeaderEnhancerSettings = {
	mySetting: 'default',
	language: 'en',
	startHeaderLevel: 'H1',
	isAutoNumbering: true,
	autoNumberingStartNumber: '1',
	autoNumberingSeparator: '.',
	isSeparateTitleFont: true,
	titleFontFamily: 'inherit',
	titleFontSize: 'inherit'
}

export default class HeaderEnhancerPlugin extends Plugin {
	settings: HeaderEnhancerSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Greet', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice! Hello World!');
		});

		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});

		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'header-automatic-numbering',
			name: 'Header Automatic Numbering',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const editorView = editor.cm as EditorView;
				let state = editorView.state;
				let line = state.doc.line(lineNumber)

				if (getPosLineType(state, line.from) == LineType.text) {
					let oldLine = line.text;
					let newLine = this.Formater.formatLine(state, lineNumber, this.settings, oldLine.length, 0)[0];
					if (oldLine != newLine) {
						editor.replaceRange(newLine, { line: lineNumber - 1, ch: 0 }, { line: lineNumber - 1, ch: oldLine.length });
						editor.setCursor({ line: lineNumber - 1, ch: editor.getLine(lineNumber - 1).length });
					}
				}
				return;


				// 选中所有类名包含 ".cm-header" 的元素
				const elements = document.querySelectorAll('.cm-header');
				console.log(elements);

				// 迭代修改样式
				elements.forEach((element: HTMLElement) => {
					// 在这里进行样式修改
					element.style.display = 'none';
				});

				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});

		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
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
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class HeaderEnhancerSettingTab extends PluginSettingTab {
	plugin: HeaderEnhancerPlugin;

	constructor(app: App, plugin: HeaderEnhancerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h1', { text: 'Header Enhancer Settings' });

		containerEl.createEl('h2', { text: 'General' });
		new Setting(containerEl)
			.setName('Language')
			.setDesc('Language for automatic numbering')
			.addDropdown((dropdown) => {
				dropdown.addOption('en', 'English');
				dropdown.addOption('zh', 'Chinese');
				dropdown.setValue(this.plugin.settings.language);
				dropdown.onChange(async (value) => {
					console.log('Language: ' + value);
					this.plugin.settings.language = value;
					await this.plugin.saveSettings();
				});
			});

		containerEl.createEl('h2', { text: 'Separate Title Font' });
		new Setting(containerEl)
			.setName('Enable')
			.setDesc('Separate title font from content')
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.isSeparateTitleFont)
					.onChange(async (value) => {
						console.log('Secret: ' + value);
						this.plugin.settings.isSeparateTitleFont = value;
						await this.plugin.saveSettings();
					})
			});
		new Setting(containerEl)
			.setName('Font Family')
			.setDesc('Title font family, inherit from global font by default')
			.addText(text => text
				.setPlaceholder('global font')
				.setValue(this.plugin.settings.titleFontFamily)
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.titleFontFamily = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Font Size')
			.setDesc('Title font size, inherit from global font size by default')
			.addText(text => text
				.setPlaceholder('global font size')
				.setValue(this.plugin.settings.titleFontSize)
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.titleFontSize = value;
					await this.plugin.saveSettings();
				}));

		containerEl.createEl('h2', { text: 'Header Automatic Numbering' });
		new Setting(containerEl)
			.setName('Start Header Level')
			.setDesc('Start numbering at this header level')
			.addDropdown((dropdown) => {
				dropdown.addOption('H1', 'H1');
				dropdown.addOption('H2', 'H2');
				dropdown.addOption('H3', 'H3');
				dropdown.addOption('H4', 'H4');
				dropdown.addOption('H5', 'H5');
				dropdown.addOption('H6', 'H6');
				dropdown.setValue(this.plugin.settings.startHeaderLevel);
				dropdown.onChange(async (value) => {
					console.log('startHeaderLevel: ' + value);
					this.plugin.settings.startHeaderLevel = value;
					await this.plugin.saveSettings();
				});
			});
		new Setting(containerEl)
			.setName('Start Number')
			.setDesc('Start numbering at this number')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.autoNumberingStartNumber)
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.autoNumberingStartNumber = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Separator')
			.setDesc('Separator between numbers')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.autoNumberingSeparator)
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.autoNumberingSeparator = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Your auto numbering format is like ' +
				this.plugin.settings.autoNumberingStartNumber + this.plugin.settings.autoNumberingSeparator + '1' + this.plugin.settings.autoNumberingSeparator + '1')


		containerEl.createEl('h2', { text: 'Advance' });
		new Setting(containerEl)
			.setName('Start Header Level')
			.setDesc('Start numbering at this header level')
			.addText(text => text
				.setPlaceholder('Enter starting header level')
				.setValue(this.plugin.settings.startHeaderLevel)
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));

		containerEl.createEl('h2', { text: 'About Author' });
	}
}
