import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import HeaderEnhancerPlugin from './main';

export interface HeaderEnhancerSettings {
    language: string;
    showOnStatusBar: boolean;
    startHeaderLevel: string;
    isAutoNumbering: boolean;
    autoNumberingStartNumber: string;
    autoNumberingSeparator: string;
    isSeparateTitleFont: boolean;
    titleFontFamily: string;
    titleFontSize: string;
}

export const DEFAULT_SETTINGS: HeaderEnhancerSettings = {
    language: 'en',
    showOnStatusBar: true,
    startHeaderLevel: 'H1',
    isAutoNumbering: true,
    autoNumberingStartNumber: '1',
    autoNumberingSeparator: '.',
    isSeparateTitleFont: true,
    titleFontFamily: 'inherit',
    titleFontSize: 'inherit'
}

export class HeaderEnhancerSettingTab extends PluginSettingTab {
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
                    this.plugin.settings.language = value;
                    await this.plugin.saveSettings();
                });
            });
        new Setting(containerEl)
            .setName('Show on status bar')
            .setDesc('Show automatic numbering status on status bar')
            .addToggle((toggle) => {
                toggle.setValue(this.plugin.settings.showOnStatusBar)
                    .onChange(async (value) => {
                        this.plugin.settings.showOnStatusBar = value;
                        await this.plugin.saveSettings();
                        this.plugin.handleShowStateBarChange();
                    })
            });

        containerEl.createEl('h2', { text: 'Header Auto Numbering' });
        new Setting(containerEl)
            .setName('Enable')
            .setDesc('Enable auto numbering')
            .addToggle((toggle) => {
                toggle.setValue(this.plugin.settings.isAutoNumbering)
                    .onChange(async (value) => {
                        this.plugin.settings.isAutoNumbering = value;
                        await this.plugin.saveSettings();
                        this.plugin.handleShowStateBarChange();
                    })
            });
        new Setting(containerEl)
            .setName('Start header level')
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
                    this.plugin.settings.startHeaderLevel = value;
                    await this.plugin.saveSettings();
                });
            });
        new Setting(containerEl)
            .setName('Start number')
            .setDesc('Start numbering at this number')
            .addText(text => text
                .setPlaceholder('Enter your secret')
                .setValue(this.plugin.settings.autoNumberingStartNumber)
                .onChange(async (value) => {
                    this.plugin.settings.autoNumberingStartNumber = value;
                    await this.plugin.saveSettings();
                }));
        new Setting(containerEl)
            .setName('Separator')
            .setDesc('Separator between numbers. Only support one of \'.,/-\'')
            .addText(text => text
                .setPlaceholder('Enter your separator')
                .setValue(this.plugin.settings.autoNumberingSeparator)
                .onChange(async (value) => {
                    if (this.checkSeparator(value)) {
                        this.plugin.settings.autoNumberingSeparator = value;
                        await this.plugin.saveSettings();
                    } else {
                        new Notice('Separator should be one of \'.,/-\'');
                    }
                }));
        new Setting(containerEl)
            .setName('Your auto numbering format is like ' +
                this.plugin.settings.autoNumberingStartNumber + this.plugin.settings.autoNumberingSeparator + '1' + this.plugin.settings.autoNumberingSeparator + '1')

        containerEl.createEl('h2', { text: 'Isolate Title Font [W.I.P]' });
        new Setting(containerEl)
            .setName('Enable')
            .setDesc('Isolate title font from content')
            .addToggle((toggle) => {
                toggle.setValue(this.plugin.settings.isSeparateTitleFont)
                    .onChange(async (value) => {
                        this.plugin.settings.isSeparateTitleFont = value;
                        await this.plugin.saveSettings();
                    })
            });
        new Setting(containerEl)
            .setName('Font family')
            .setDesc('Title font family, inherit from global font by default')
            .addText(text => text
                .setPlaceholder('global font')
                .setValue(this.plugin.settings.titleFontFamily)
                .onChange(async (value) => {
                    this.plugin.settings.titleFontFamily = value;
                    await this.plugin.saveSettings();
                }));
        new Setting(containerEl)
            .setName('Font size')
            .setDesc('Title font size, inherit from global font size by default')
            .addText(text => text
                .setPlaceholder('global font size')
                .setValue(this.plugin.settings.titleFontSize)
                .onChange(async (value) => {
                    this.plugin.settings.titleFontSize = value;
                    await this.plugin.saveSettings();
                }));

        containerEl.createEl('h2', { text: 'More Info' });
        containerEl.createEl("p", { text: "Author: " }).createEl("a", {
            text: "Hobee Liu",
            href: "https://github.com/HoBeedzc",
        });
        containerEl.createEl("p", { text: "License: " }).createEl("a", {
            text: "MIT",
            href: "https://github.com/HoBeedzc/obsidian-header-enhancer-plugin/blob/master/LICENSE",
        });
        containerEl.createEl("p", { text: "Feedback: " }).createEl("a", {
            text: "Github Issues",
            href: "https://github.com/HoBeedzc/obsidian-header-enhancer-plugin/issues",
        });
        containerEl.createEl("p", { text: "Github Repo: " }).createEl("a", {
            text: "obsidian-header-enhancer",
            href: "https://github.com/HoBeedzc/obsidian-header-enhancer-plugin",
        });
    }

    checkSeparator(separator: string): boolean {
        if (separator.length != 1) {
            return false;
        }
        const separators = ['.', ',', '-', '/'];
        return separators.includes(separator);
    }
}
