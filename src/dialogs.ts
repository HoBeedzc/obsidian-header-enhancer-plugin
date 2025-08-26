import { App, Modal, Setting, Notice, TFile } from "obsidian";
import HeaderEnhancerPlugin from "./main";
import { I18n } from "./i18n";
import { removeHeaderNumber, isHeader, getNextNumber } from "./core";
import { getAutoNumberingConfig } from "./config";

export class AutoNumberingRemovalDialog extends Modal {
    private plugin: HeaderEnhancerPlugin;
    private onConfirm: (removeExisting: boolean) => Promise<void>;
    private progressContainer: HTMLElement | null = null;
    private isProcessing = false;
    
    constructor(app: App, plugin: HeaderEnhancerPlugin, onConfirm: (removeExisting: boolean) => Promise<void>) {
        super(app);
        this.plugin = plugin;
        this.onConfirm = onConfirm;
        this.setTitle("Auto Numbering Settings");
    }

    onOpen(): void {
        const i18n = I18n.getInstance();
        const { contentEl } = this;
        
        contentEl.empty();
        contentEl.addClass("header-enhancer-removal-dialog");
        
        // Title
        contentEl.createEl("h2", { 
            text: i18n.t("settings.autoNumbering.removeConfirmation.title"),
            cls: "modal-title"
        });
        
        // Main message
        contentEl.createEl("p", { 
            text: i18n.t("settings.autoNumbering.removeConfirmation.message"),
            cls: "modal-message"
        });
        
        // Action buttons section
        const actionsEl = contentEl.createDiv({ cls: "modal-actions" });
        
        // Primary action - Remove and turn off (with warning inside)
        const removeAndTurnOffSetting = new Setting(actionsEl)
            .setName(i18n.t("settings.autoNumbering.removeConfirmation.removeAndTurnOff"))
            .setDesc(i18n.t("settings.autoNumbering.removeConfirmation.removeAndTurnOffDesc"))
            .addButton((button) => {
                button
                    .setButtonText(i18n.t("settings.autoNumbering.removeConfirmation.removeAndTurnOff"))
                    .setCta()
                    .onClick(async () => {
                        if (!this.isProcessing) {
                            await this.handleRemoveAndTurnOff();
                        }
                    });
            });
        
        // Add warning inside the first option
        const warningEl = removeAndTurnOffSetting.descEl.createDiv({ cls: "setting-item-warning" });
        warningEl.createEl("span", { 
            text: i18n.t("settings.autoNumbering.removeConfirmation.warningTitle") + " ",
            cls: "warning-label"
        });
        warningEl.createEl("span", { 
            text: i18n.t("settings.autoNumbering.removeConfirmation.warningMessage"),
            cls: "warning-text"
        });
        
        // Add manual tip
        const manualTipEl = removeAndTurnOffSetting.descEl.createDiv({ cls: "setting-item-tip" });
        manualTipEl.createEl("span", { 
            text: i18n.t("settings.autoNumbering.removeConfirmation.manualTip"),
            cls: "manual-tip-text"
        });
            
        // Secondary action - Turn off only
        new Setting(actionsEl)
            .setName(i18n.t("settings.autoNumbering.removeConfirmation.turnOffOnly"))
            .setDesc(i18n.t("settings.autoNumbering.removeConfirmation.turnOffOnlyDesc"))
            .addButton((button) => {
                button
                    .setButtonText(i18n.t("settings.autoNumbering.removeConfirmation.turnOffOnly"))
                    .onClick(async () => {
                        if (!this.isProcessing) {
                            await this.handleTurnOffOnly();
                        }
                    });
            });
            
        // Cancel button
        const cancelButtonEl = actionsEl.createDiv({ cls: "modal-cancel" });
        new Setting(cancelButtonEl)
            .addButton((button) => {
                button
                    .setButtonText(i18n.t("settings.autoNumbering.removeConfirmation.cancel"))
                    .onClick(() => {
                        if (!this.isProcessing) {
                            this.close();
                        }
                    });
            });
        
        // Progress container (initially hidden)
        this.progressContainer = contentEl.createDiv({ 
            cls: "progress-container",
            attr: { style: "display: none;" }
        });
    }

    private async handleRemoveAndTurnOff(): Promise<void> {
        this.isProcessing = true;
        try {
            this.showProgress();
            await this.removeAllHeaderNumbers();
            await this.onConfirm(true);
            this.close();
        } catch (error) {
            const i18n = I18n.getInstance();
            new Notice(i18n.t("settings.autoNumbering.removeConfirmation.error", { 
                error: error.message 
            }));
            this.hideProgress();
        } finally {
            this.isProcessing = false;
        }
    }
    
    private async handleTurnOffOnly(): Promise<void> {
        this.isProcessing = true;
        try {
            await this.onConfirm(false);
            this.close();
        } finally {
            this.isProcessing = false;
        }
    }
    
    private showProgress(): void {
        const i18n = I18n.getInstance();
        if (this.progressContainer) {
            this.progressContainer.style.display = "block";
            this.progressContainer.empty();
            this.progressContainer.createEl("p", { 
                text: i18n.t("settings.autoNumbering.removeConfirmation.processing"),
                cls: "progress-text"
            });
        }
        
        // Disable all buttons
        this.contentEl.querySelectorAll('button').forEach(button => {
            button.setAttribute('disabled', 'true');
        });
    }
    
    private hideProgress(): void {
        if (this.progressContainer) {
            this.progressContainer.style.display = "none";
            this.progressContainer.empty();
        }
        
        // Re-enable buttons
        this.contentEl.querySelectorAll('button').forEach(button => {
            button.removeAttribute('disabled');
        });
    }
    
    private async removeAllHeaderNumbers(): Promise<void> {
        const i18n = I18n.getInstance();
        const markdownFiles = this.app.vault.getMarkdownFiles();
        let processedCount = 0;
        let modifiedCount = 0;
        
        // Process files in smaller batches with longer delays to prevent conflicts with other plugins
        const batchSize = 5; // Reduced batch size
        const totalFiles = markdownFiles.length;
        
        for (let batchStart = 0; batchStart < totalFiles; batchStart += batchSize) {
            const batch = markdownFiles.slice(batchStart, Math.min(batchStart + batchSize, totalFiles));
            
            // Process batch with individual file delays
            for (const file of batch) {
                try {
                    const modified = await this.processFile(file);
                    if (modified) {
                        modifiedCount++;
                        // Additional delay after file modification to allow other plugins to process
                        await new Promise(resolve => setTimeout(resolve, 10));
                    }
                    processedCount++;
                    
                    // Update progress display
                    this.updateProgress(processedCount, totalFiles);
                    
                } catch (error) {
                    console.error(`Error processing file ${file.path}:`, error);
                }
                
                // Small delay between individual files
                await new Promise(resolve => setTimeout(resolve, 5));
            }
            
            // Longer delay between batches to allow system to stabilize
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        // Show completion message
        if (modifiedCount > 0) {
            new Notice(i18n.t("settings.autoNumbering.removeConfirmation.completed", { 
                count: modifiedCount.toString() 
            }));
        } else {
            new Notice(i18n.t("settings.autoNumbering.removeConfirmation.noNumberingFound"));
        }
    }
    
    private async processFile(file: TFile): Promise<boolean> {
        try {
            // Check if file is currently open in an editor
            const activeLeaves = this.app.workspace.getLeavesOfType('markdown');
            const isCurrentlyOpen = activeLeaves.some(leaf => {
                const view = leaf.view as any;
                return view.file && view.file.path === file.path;
            });
            
            const content = await this.app.vault.read(file);
            const lines = content.split('\n');
            let modified = false;
            
            // Check if file contains any code blocks to handle them properly
            let isInCodeBlock = false;
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                
                // Track code blocks
                if (line.startsWith("```")) {
                    isInCodeBlock = !isInCodeBlock;
                    continue;
                }
                
                // Skip processing headers inside code blocks
                if (isInCodeBlock) {
                    continue;
                }
                
                if (isHeader(line)) {
                    const newLine = removeHeaderNumber(line, this.plugin.settings.autoNumberingHeaderSeparator);
                    if (newLine !== line) {
                        lines[i] = newLine;
                        modified = true;
                    }
                }
            }
            
            if (modified) {
                await this.app.vault.modify(file, lines.join('\n'));
                
                // If file was currently open, add extra delay to prevent editor conflicts
                if (isCurrentlyOpen) {
                    await new Promise(resolve => setTimeout(resolve, 20));
                }
                
                // Handle backlink updates if enabled
                if (this.plugin.settings.updateBacklinks) {
                    // Note: Backlink updates would need to be implemented based on the changes made
                    // This is a simplified version - full implementation would track specific header changes
                }
            }
            
            return modified;
        } catch (error) {
            console.error(`Error processing file ${file.path}:`, error);
            return false;
        }
    }
    
    private updateProgress(current: number, total: number): void {
        const i18n = I18n.getInstance();
        if (this.progressContainer) {
            const progressText = this.progressContainer.querySelector('.progress-text');
            if (progressText) {
                progressText.textContent = i18n.t("settings.autoNumbering.removeConfirmation.progressStatus", { 
                    current: current.toString(), 
                    total: total.toString() 
                });
            }
        }
    }
    
    onClose(): void {
        // Clean up any resources if needed
        this.isProcessing = false;
    }
}

export class AutoNumberingActivationDialog extends Modal {
    private plugin: HeaderEnhancerPlugin;
    private onConfirm: (addToAll: boolean) => Promise<void>;
    private progressContainer: HTMLElement | null = null;
    private isProcessing = false;
    
    constructor(app: App, plugin: HeaderEnhancerPlugin, onConfirm: (addToAll: boolean) => Promise<void>) {
        super(app);
        this.plugin = plugin;
        this.onConfirm = onConfirm;
        this.setTitle("Auto Numbering Settings");
    }

    onOpen(): void {
        const i18n = I18n.getInstance();
        const { contentEl } = this;
        
        contentEl.empty();
        contentEl.addClass("header-enhancer-activation-dialog");
        
        // Title
        contentEl.createEl("h2", { 
            text: i18n.t("settings.autoNumbering.activationConfirmation.title"),
            cls: "modal-title"
        });
        
        // Main message
        contentEl.createEl("p", { 
            text: i18n.t("settings.autoNumbering.activationConfirmation.message"),
            cls: "modal-message"
        });
        
        // Action buttons section
        const actionsEl = contentEl.createDiv({ cls: "modal-actions" });
        
        // Primary action - Add to all documents (with warning inside)
        const addToAllSetting = new Setting(actionsEl)
            .setName(i18n.t("settings.autoNumbering.activationConfirmation.addToAll"))
            .setDesc(i18n.t("settings.autoNumbering.activationConfirmation.addToAllDesc"))
            .addButton((button) => {
                button
                    .setButtonText(i18n.t("settings.autoNumbering.activationConfirmation.addToAll"))
                    .setCta()
                    .onClick(async () => {
                        if (!this.isProcessing) {
                            await this.handleAddToAll();
                        }
                    });
            });
        
        // Add warning inside the first option
        const warningEl = addToAllSetting.descEl.createDiv({ cls: "setting-item-warning" });
        warningEl.createEl("span", { 
            text: i18n.t("settings.autoNumbering.activationConfirmation.warningTitle") + " ",
            cls: "warning-label"
        });
        warningEl.createEl("span", { 
            text: i18n.t("settings.autoNumbering.activationConfirmation.warningMessage"),
            cls: "warning-text"
        });
        
        // Add tip
        const tipEl = addToAllSetting.descEl.createDiv({ cls: "setting-item-tip" });
        tipEl.createEl("span", { 
            text: i18n.t("settings.autoNumbering.activationConfirmation.manualTip"),
            cls: "manual-tip-text"
        });
            
        // Secondary action - Turn on only
        new Setting(actionsEl)
            .setName(i18n.t("settings.autoNumbering.activationConfirmation.turnOnOnly"))
            .setDesc(i18n.t("settings.autoNumbering.activationConfirmation.turnOnOnlyDesc"))
            .addButton((button) => {
                button
                    .setButtonText(i18n.t("settings.autoNumbering.activationConfirmation.turnOnOnly"))
                    .onClick(async () => {
                        if (!this.isProcessing) {
                            await this.handleTurnOnOnly();
                        }
                    });
            });
            
        // Cancel button
        const cancelButtonEl = actionsEl.createDiv({ cls: "modal-cancel" });
        new Setting(cancelButtonEl)
            .addButton((button) => {
                button
                    .setButtonText(i18n.t("settings.autoNumbering.activationConfirmation.cancel"))
                    .onClick(() => {
                        if (!this.isProcessing) {
                            this.close();
                        }
                    });
            });
        
        // Progress container (initially hidden)
        this.progressContainer = contentEl.createDiv({ 
            cls: "progress-container",
            attr: { style: "display: none;" }
        });
    }

    private async handleAddToAll(): Promise<void> {
        this.isProcessing = true;
        try {
            this.showProgress();
            await this.addHeaderNumbersToAllFiles();
            await this.onConfirm(true);
            this.close();
        } catch (error) {
            const i18n = I18n.getInstance();
            new Notice(i18n.t("settings.autoNumbering.activationConfirmation.error", { 
                error: error.message 
            }));
            this.hideProgress();
        } finally {
            this.isProcessing = false;
        }
    }
    
    private async handleTurnOnOnly(): Promise<void> {
        this.isProcessing = true;
        try {
            await this.onConfirm(false);
            this.close();
        } finally {
            this.isProcessing = false;
        }
    }
    
    private showProgress(): void {
        const i18n = I18n.getInstance();
        if (this.progressContainer) {
            this.progressContainer.style.display = "block";
            this.progressContainer.empty();
            this.progressContainer.createEl("p", { 
                text: i18n.t("settings.autoNumbering.activationConfirmation.processing"),
                cls: "progress-text"
            });
        }
        
        // Disable all buttons
        this.contentEl.querySelectorAll('button').forEach(button => {
            button.setAttribute('disabled', 'true');
        });
    }
    
    private hideProgress(): void {
        if (this.progressContainer) {
            this.progressContainer.style.display = "none";
            this.progressContainer.empty();
        }
        
        // Re-enable buttons
        this.contentEl.querySelectorAll('button').forEach(button => {
            button.removeAttribute('disabled');
        });
    }
    
    private async addHeaderNumbersToAllFiles(): Promise<void> {
        const i18n = I18n.getInstance();
        const markdownFiles = this.app.vault.getMarkdownFiles();
        let processedCount = 0;
        let modifiedCount = 0;
        
        // Process files in smaller batches with delays
        const batchSize = 5;
        const totalFiles = markdownFiles.length;
        
        for (let batchStart = 0; batchStart < totalFiles; batchStart += batchSize) {
            const batch = markdownFiles.slice(batchStart, Math.min(batchStart + batchSize, totalFiles));
            
            for (const file of batch) {
                try {
                    const modified = await this.processFile(file);
                    if (modified) {
                        modifiedCount++;
                        // Additional delay after file modification
                        await new Promise(resolve => setTimeout(resolve, 10));
                    }
                    processedCount++;
                    
                    // Update progress display
                    this.updateProgress(processedCount, totalFiles);
                    
                } catch (error) {
                    console.error(`Error processing file ${file.path}:`, error);
                }
                
                // Small delay between individual files
                await new Promise(resolve => setTimeout(resolve, 5));
            }
            
            // Longer delay between batches
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        // Show completion message
        if (modifiedCount > 0) {
            new Notice(i18n.t("settings.autoNumbering.activationConfirmation.completed", { 
                count: modifiedCount.toString() 
            }));
        } else {
            new Notice(i18n.t("settings.autoNumbering.activationConfirmation.noHeadersFound"));
        }
    }
    
    private async processFile(file: TFile): Promise<boolean> {
        try {
            // Check if file is currently open in an editor
            const activeLeaves = this.app.workspace.getLeavesOfType('markdown');
            const isCurrentlyOpen = activeLeaves.some(leaf => {
                const view = leaf.view as any;
                return view.file && view.file.path === file.path;
            });
            
            const content = await this.app.vault.read(file);
            const lines = content.split('\n');
            let modified = false;
            
            // Simulate editor for getting config
            const mockEditor = {
                getValue: () => content,
                lineCount: () => lines.length,
                getLine: (n: number) => lines[n] || ""
            } as any;
            
            const config = getAutoNumberingConfig(this.plugin.settings, mockEditor);
            
            // Override config.state since we're in activation mode and want to process files
            // even though the plugin setting hasn't been changed yet
            config.state = true;
            
            let insertNumber: number[] = [Number(config.startNumber) - 1];
            let isInCodeBlock = false;
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                
                // Track code blocks
                if (line.startsWith("```")) {
                    isInCodeBlock = !isInCodeBlock;
                    if (line.slice(3).contains("```")) {
                        isInCodeBlock = !isInCodeBlock;
                    }
                }
                
                // Skip processing headers inside code blocks
                if (isInCodeBlock) {
                    continue;
                }
                
                if (isHeader(line)) {
                    // Use the same logic from main.ts handleAddHeaderNumber
                    const headerLevel = line.match(/^#+/)?.[0].length || 0;
                    if (headerLevel < config.startLevel || headerLevel > config.endLevel) {
                        continue;
                    }
                    
                    const adjustedLevel = headerLevel - config.startLevel + 1;
                    insertNumber = getNextNumber(insertNumber, adjustedLevel);
                    const insertNumberStr = insertNumber.join(config.separator);
                    
                    // Check if header needs numbering
                    if (!line.includes(this.plugin.settings.autoNumberingHeaderSeparator)) {
                        const newLine = "#".repeat(headerLevel) +
                            " " +
                            insertNumberStr +
                            this.plugin.settings.autoNumberingHeaderSeparator +
                            line.substring(headerLevel + 1);
                        
                        if (newLine !== line) {
                            lines[i] = newLine;
                            modified = true;
                        }
                    }
                }
            }
            
            if (modified) {
                await this.app.vault.modify(file, lines.join('\n'));
                
                // If file was currently open, add extra delay
                if (isCurrentlyOpen) {
                    await new Promise(resolve => setTimeout(resolve, 20));
                }
            }
            
            return modified;
        } catch (error) {
            console.error(`Error processing file ${file.path}:`, error);
            return false;
        }
    }
    
    private updateProgress(current: number, total: number): void {
        const i18n = I18n.getInstance();
        if (this.progressContainer) {
            const progressText = this.progressContainer.querySelector('.progress-text');
            if (progressText) {
                progressText.textContent = i18n.t("settings.autoNumbering.activationConfirmation.progressStatus", { 
                    current: current.toString(), 
                    total: total.toString() 
                });
            }
        }
    }
    
    onClose(): void {
        // Clean up any resources if needed
        this.isProcessing = false;
    }
}