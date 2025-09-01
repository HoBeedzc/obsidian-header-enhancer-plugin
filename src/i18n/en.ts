export default {
    settings: {
        title: "Header Enhancer Settings",
        general: "General",
        language: {
            name: "Language",
            desc: "Language for automatic numbering"
        },
        statusBar: {
            name: "Show on Status Bar",
            desc: "Show current header level on status bar"
        },
        sidebar: {
            name: "Show on Sidebar",
            desc: "Show Header Enhancer icon in the sidebar ribbon"
        },
        autoDetect: {
            name: "Auto Detect Header Level",
            desc: "Automatically detect and use the highest and lowest header levels in the document for numbering"
        },
        headerLevel: {
            start: {
                name: "Start Header Level",
                desc: "The starting level for headers"
            },
            max: {
                name: "Max Header Level",
                desc: "Maximum level for headers"
            }
        },
        autoNumbering: {
            title: "Header Auto Numbering",
            mode: {
                name: "Auto Numbering Mode",
                desc: "Control how header auto numbering works",
                off: "Off",
                on: "On",
                yaml: "Controlled by YAML"
            },
            headerLevel: {
                name: "Header Level Numbering Method",
                toggleLabel: "🔧 Enable Auto Detection",
                desc: {
                    autoDetect: "✅ Auto Detection Mode: Intelligently determine numbering range based on document content",
                    manual: "⚙️ Manual Setting Mode: Use fixed level range settings",
                    yamlControl: "📋 YAML Control Mode: Configure through file frontmatter"
                }
            },
            startNumber: {
                name: "Start Number",
                desc: "Start numbering at this number",
                placeholder: "Enter a number"
            },
            separator: {
                name: "Number Separator",
                desc: "Separator between numbers (one of '. , / -')",
                placeholder: "Enter separator"
            },
            headerSeparator: {
                name: "Header Separator",
                desc: "Separator between header number and text",
                error: "You can't change header separator when auto numbering is enabled"
            },
            updateBacklinks: {
                name: "Update Backlinks",
                desc: "⚠️ Warning: Automatically update backlinks when headers change. May impact performance in large vaults."
            },
            endLevelError: "Max header level should be greater than or equal to start header level",
            startLevelError: "Start header level should be less than or equal to max header level",
            format: {
                name: "Your auto numbering format is",
                fromLevel: "from",
                toLevel: "to",
                autoDetect: "Auto Detect",
                manual: "Manual",
                yamlControlled: "[Controlled by YAML]",
                disabled: "[Disabled]"
            },
            removeConfirmation: {
                title: "Turn Off Auto Numbering",
                message: "You are about to turn off auto numbering. What would you like to do with existing numbering in your documents?",
                warningTitle: "⚠️ Performance Warning",
                warningMessage: "This operation will scan all markdown files in your vault. In large vaults, this may take several minutes and temporarily impact Obsidian's performance.",
                removeAndTurnOff: "Remove all numbering and turn off",
                removeAndTurnOffDesc: "Scan all files and remove header numbering, then disable auto numbering",
                turnOffOnly: "Turn off without removing",
                turnOffOnlyDesc: "Disable auto numbering but keep existing numbers in documents",
                cancel: "Cancel",
                processing: "Processing files...",
                progressStatus: "Processed {current} of {total} files",
                completed: "Successfully removed numbering from {count} files",
                error: "Error occurred while processing files: {error}",
                noNumberingFound: "No files with header numbering were found",
                manualTip: "You can also manually disable auto numbering for individual files using the sidebar button."
            },
            activationConfirmation: {
                title: "Enable Auto Numbering",
                message: "You are about to enable auto numbering. What would you like to do with existing documents in your vault?",
                warningTitle: "⚠️ Performance Warning",
                warningMessage: "This operation will scan all markdown files in your vault. In large vaults, this may take several minutes and temporarily impact Obsidian's performance.",
                addToAll: "Add numbering to all documents",
                addToAllDesc: "Scan all files and add header numbering to existing documents",
                turnOnOnly: "Turn on without adding",
                turnOnOnlyDesc: "Enable auto numbering but keep existing documents unchanged",
                cancel: "Cancel",
                processing: "Adding numbering to files...",
                progressStatus: "Processed {current} of {total} files",
                completed: "Successfully added numbering to {count} files",
                error: "Error occurred while processing files: {error}",
                noHeadersFound: "No files with headers were found",
                manualTip: "You can also manually enable auto numbering for individual files using the sidebar button."
            }
        },
        headerFont: {
            title: "Header Font Settings",
            separate: {
                name: "Separate Header Font",
                desc: "Use different font settings for markdown headers (# ## ###)"
            },
            preview: {
                title: "Header Font Preview",
                sample: "Sample Header"
            },
            family: {
                name: "Font Family",
                desc: "Header font family (inherit from global font by default)",
                options: {
                    inherit: "Inherit from global font"
                }
            },
            size: {
                name: "Font Size", 
                desc: "Header font size (inherit from global font size by default)",
                options: {
                    inherit: "Inherit from global size",
                    smaller: "Smaller",
                    small: "Small", 
                    normal: "Normal",
                    large: "Large",
                    larger: "Larger",
                    xlarge: "Extra Large",
                    xxlarge: "Extra Extra Large"
                }
            }
        },
        titleFont: {
            title: "Title Font Settings",
            separate: {
                name: "Separate Title Font",
                desc: "Use different font settings for document titles"
            },
            preview: {
                title: "Title Font Preview",
                sample: "Sample Document Title"
            },
            family: {
                name: "Font Family",
                desc: "Title font family (inherit from global font by default)",
                options: {
                    inherit: "Inherit from global font"
                }
            },
            size: {
                name: "Font Size",
                desc: "Title font size (inherit from global font size by default)",
                options: {
                    inherit: "Inherit from global size",
                    smaller: "Smaller",
                    small: "Small", 
                    normal: "Normal",
                    large: "Large",
                    larger: "Larger",
                    xlarge: "Extra Large",
                    xxlarge: "Extra Extra Large"
                }
            }
        },
        resetSettings: {
            name: "Reset Settings",
            confirm: "Are you sure you want to reset settings to default?"
        },
        moreInfo: "More Information",
        author: "Author: ",
        license: "License: ",
        githubRepo: "GitHub Repository: ",
        anyQuestion: "Any questions? "
    },
    autoDetection: {
        currentDocument: "Current Document Analysis",
        noActiveDocument: "No active document",
        noHeaders: "No headers detected",
        detected: "Detected levels",
        range: "Level range",
        mapping: "Number mapping", 
        totalHeaders: "Total headers",
        modes: {
            autoDetect: "🔧 Current Mode: Auto Detect - Intelligently determine numbering range based on document content",
            yamlControl: "⚙️ Current Mode: YAML Control - Configure through file frontmatter",
            manual: "🎯 Current Mode: Manual - Use fixed level range"
        },
        info: {
            yamlMode: {
                title: "⚙️ YAML Control Mode",
                description: "In this mode, header numbering is controlled by YAML frontmatter in files. Please add the following configuration at the beginning of your document:",
                usage: "You can use plugin commands to quickly add or modify these configurations."
            },
            offMode: {
                title: "⏸️ Auto Numbering Disabled",
                description: "Header auto numbering is currently disabled. To enable auto numbering, please select \"On\" or \"Controlled by YAML\" mode above."
            }
        }
    },
    statusBar: {
        title: "Header Enhancer",
        off: "Off",
        on: "On",
        yaml: "YAML",
        auto: "Auto",
        autoNoHeaders: "Auto(No Headers)"
    }
};
