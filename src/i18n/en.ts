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
        autoDetect: {
            name: "Auto Detect Header Level",
            desc: "Automatically detect header level based on context"
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
                name: "Header Level Settings",
                desc: "Configure the header level settings"
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
            format: {
                name: "Your auto numbering format is",
                fromLevel: "from H",
                toLevel: "to H",
                autoDetect: "[Auto Detect]",
                manual: "[Manual]"
            }
        },
        font: {
            title: "Title Font Settings",
            separate: {
                name: "Separate Title Font",
                desc: "Use different font settings for titles",
                notice: "This feature is not available now, please wait for the next version"
            },
            family: {
                name: "Font Family",
                desc: "Title font family (inherit from global font by default)",
                placeholder: "global font"
            },
            size: {
                name: "Font Size",
                desc: "Title font size (inherit from global font size by default)",
                placeholder: "global font size"
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
    statusBar: {
        title: "Header Enhancer",
        off: "Off",
        on: "On",
        yaml: "YAML"
    }
};
