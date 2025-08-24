import { TFile, App, Notice, ReferenceCache } from "obsidian";

/**
 * Represents header link update information
 */
export interface HeaderLinkUpdate {
    sourceFile: TFile;          // File containing the link
    oldLink: string;            // Original link text "[[file#old heading]]"
    newLink: string;            // New link text "[[file#1.1 old heading]]"
    position: {
        start: { line: number; ch: number };
        end: { line: number; ch: number };
    };
}

/**
 * Backlink manager for handling header link updates
 */
export class BacklinkManager {
    constructor(private app: App) {}

    /**
     * Find backlinks pointing to a specific heading
     * @param targetFile Target file
     * @param oldHeading Original heading text (without # symbols)
     * @returns List of link updates needed
     */
    async findHeadingBacklinks(
        targetFile: TFile, 
        oldHeading: string
    ): Promise<HeaderLinkUpdate[]> {
        const updates: HeaderLinkUpdate[] = [];
        
        try {
            // Get all backlinks for the target file
            const backlinksMap = this.app.metadataCache.getBacklinksForFile(targetFile);
            
            // Check if backlinks exist
            if (!backlinksMap) {
                return updates;
            }
            
            // Obsidian's getBacklinksForFile returns a wrapper object, actual Map is in .data property
            let actualMap = backlinksMap;
            if (backlinksMap.data && backlinksMap.data instanceof Map) {
                actualMap = backlinksMap.data;
            }
            
            // Check if map is empty
            if (!actualMap || actualMap.size === 0) {
                return updates;
            }

            // Iterate through all source files that reference the target file
            for (const [sourcePath, references] of actualMap) {
                
                const sourceFile = this.app.vault.getAbstractFileByPath(sourcePath);
                if (!(sourceFile instanceof TFile)) continue;

                // 读取源文件内容
                const content = await this.app.vault.read(sourceFile);
                const lines = content.split('\n');

                // 检查每个引用
                for (const ref of references) {
                    if (this.isReferenceCache(ref)) {
                        const linkUpdate = this.extractHeaderLink(
                            sourceFile, 
                            ref, 
                            lines, 
                            targetFile.basename,
                            oldHeading
                        );
                        
                        if (linkUpdate) {
                            console.log('Found matching header link:', linkUpdate);
                            updates.push(linkUpdate);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error finding heading backlinks:', error);
            new Notice('Error finding backlinks: ' + error.message);
        }

        console.log('Total header link updates found:', updates.length);
        return updates;
    }

    /**
     * 批量更新链接
     * @param updates 需要更新的链接列表
     * @returns 是否全部更新成功
     */
    async updateBacklinks(updates: HeaderLinkUpdate[]): Promise<boolean> {
        if (updates.length === 0) return true;

        const updatePromises: Promise<void>[] = [];
        const backupData: { file: TFile; content: string }[] = [];

        try {
            // 创建备份和批量更新
            for (const update of updates) {
                // 备份原文件内容
                const originalContent = await this.app.vault.read(update.sourceFile);
                backupData.push({ file: update.sourceFile, content: originalContent });

                // 创建更新Promise
                updatePromises.push(this.updateSingleBacklink(update, originalContent));
            }

            // 并行执行所有更新
            await Promise.all(updatePromises);
            
            console.log(`Successfully updated ${updates.length} backlinks`);
            return true;

        } catch (error) {
            console.error('Error updating backlinks:', error);
            
            // 回滚操作
            try {
                const rollbackPromises = backupData.map(backup => 
                    this.app.vault.modify(backup.file, backup.content)
                );
                await Promise.all(rollbackPromises);
                new Notice('Backlink update failed, changes rolled back');
            } catch (rollbackError) {
                console.error('Failed to rollback changes:', rollbackError);
                new Notice('Critical error: Failed to rollback backlink changes');
            }
            
            return false;
        }
    }

     * Update a single backlink
     */
    private async updateSingleBacklink(
        update: HeaderLinkUpdate, 
        originalContent: string
    ): Promise<void> {
        const lines = originalContent.split('\n');
        const { line } = update.position.start;
        
        if (line >= lines.length) return;

        // 替换链接文本
        const oldLine = lines[line];
        const newLine = oldLine.replace(update.oldLink, update.newLink);
        
        if (oldLine !== newLine) {
            lines[line] = newLine;
            const newContent = lines.join('\n');
            await this.app.vault.modify(update.sourceFile, newContent);
        }
    }

    /**
     * Extract header link information from a reference
     */
    private extractHeaderLink(
        sourceFile: TFile,
        ref: ReferenceCache,
        lines: string[],
        targetFileName: string,
        oldHeading: string
    ): HeaderLinkUpdate | null {
        const { line, ch } = ref.position.start;
        
        if (line >= lines.length) return null;
        
        const lineContent = lines[line];
        
        // Check if this reference points to the heading we're looking for
        // ref.link format is like "Superlink#Superlink header" or "Superlink#H"
        const expectedLinkPrefix = `${targetFileName}#`;
        
        if (ref.link && ref.link.startsWith(expectedLinkPrefix)) {
            // Extract heading part from the link
            const linkHeading = ref.link.substring(expectedLinkPrefix.length);
            
            // Check if it matches the heading we're looking for (exact or partial match)
            // Normalize spaces since Tab might be converted to spaces
            const normalizedLinkHeading = this.normalizeSpaces(linkHeading);
            const normalizedOldHeading = this.normalizeSpaces(oldHeading);
            
            if (normalizedLinkHeading === normalizedOldHeading || 
                normalizedLinkHeading.includes(normalizedOldHeading) || 
                normalizedOldHeading.includes(normalizedLinkHeading)) {
                
                // Create update information
                const linkUpdate: HeaderLinkUpdate = {
                    sourceFile,
                    oldLink: ref.original, // Use original link text
                    newLink: ref.original, // Set to same initially, will be updated in main.ts
                    position: {
                        start: { line: ref.position.start.line, ch: ref.position.start.col },
                        end: { line: ref.position.end.line, ch: ref.position.end.col }
                    }
                };
                
                return linkUpdate;
            }
        }

        return null;
    }

    /**
     * Type guard: check if reference is ReferenceCache type
     */
    private isReferenceCache(ref: any): ref is ReferenceCache {
        return ref && typeof ref === 'object' && 'position' in ref;
    }

    /**
     * Normalize spaces - convert multiple whitespace characters (including Tab) to single space
     */
    private normalizeSpaces(text: string): string {
        return text.replace(/\s+/g, ' ').trim();
    }
}