export default {
    settings: {
        title: "标题增强器设置",
        general: "常规",
        language: {
            name: "语言",
            desc: "自动编号的语言"
        },
        statusBar: {
            name: "在状态栏显示",
            desc: "在状态栏显示当前标题级别"
        },
        sidebar: {
            name: "在侧边栏显示",
            desc: "在侧边栏功能区显示标题增强器图标"
        },
        autoDetect: {
            name: "自动检测标题级别",
            desc: "根据上下文自动检测标题级别"
        },
        headerLevel: {
            start: {
                name: "起始标题级别",
                desc: "标题的起始级别"
            },
            max: {
                name: "最大标题级别",
                desc: "标题的最大级别"
            }
        },
        autoNumbering: {
            title: "标题自动编号",
            globalToggle: {
                name: "启用自动编号功能",
                desc: "主开关，用于启用/禁用整个自动编号功能。禁用时，无论其他设置如何，都不会有文档进行自动编号。"
            },
            globalDisabled: {
                title: "自动编号功能已禁用",
                description: "自动编号功能当前在全局范围内被禁用。请在上方启用它以访问其他自动编号设置并使用侧边栏按钮控制单个文档。"
            },
            mode: {
                name: "自动编号模式",
                desc: "控制标题自动编号的工作方式",
                off: "关闭",
                on: "启用",
                yaml: "通过YAML控制"
            },
            headerLevel: {
                name: "标题层级编号方式",
                toggleLabel: "🔧 启用自动检测",
                desc: {
                    autoDetect: "✅ 自动检测模式：根据文档内容智能确定编号范围",
                    manual: "⚙️ 手动设置模式：使用固定的层级范围设置",
                    yamlControl: "📋 YAML控制模式：通过文件前置元数据配置"
                }
            },
            startNumber: {
                name: "起始数字",
                desc: "从此数字开始编号",
                placeholder: "输入数字",
                error: "起始数字必须是有效数字"
            },
            separator: {
                name: "数字分隔符",
                desc: "数字之间的分隔符（. , / - 中的一个）",
                placeholder: "输入分隔符",
                error: "分隔符必须是以下之一：. , / -"
            },
            headerSeparator: {
                name: "标题分隔符",
                desc: "数字和标题文本之间的分隔符",
                error: "无效的标题分隔符"
            },
            updateBacklinks: {
                name: "更新反向链接",
                desc: "⚠️ 警告：当标题改变时自动更新反向链接。在大型知识库中可能会影响性能。"
            },
            endLevelError: "最大标题级别应该大于或等于起始标题级别",
            startLevelError: "起始标题级别应该小于或等于最大标题级别",
            format: {
                name: "当前格式",
                fromLevel: "从",
                toLevel: "到",
                autoDetect: "自动检测",
                manual: "手动",
                yamlControlled: "（YAML控制）",
                disabled: "（已关闭）"
            },
            removeConfirmation: {
                title: "关闭自动编号",
                message: "您即将关闭自动编号功能。对于文档中现有的编号，您希望如何处理？",
                warningTitle: "⚠️ 性能警告",
                warningMessage: "此操作将扫描知识库中的所有markdown文件。在大型知识库中，这可能需要几分钟时间并暂时影响Obsidian的性能。",
                removeAndTurnOff: "移除所有编号并关闭",
                removeAndTurnOffDesc: "扫描所有文件并移除标题编号，然后禁用自动编号",
                turnOffOnly: "仅关闭不移除",
                turnOffOnlyDesc: "禁用自动编号但保留文档中的现有编号",
                cancel: "取消",
                processing: "正在处理文件...",
                progressStatus: "已处理 {current}/{total} 个文件",
                completed: "成功从 {count} 个文件中移除编号",
                error: "处理文件时发生错误：{error}",
                noNumberingFound: "未找到包含标题编号的文件",
                manualTip: "你也可以通过侧边栏按钮手动关闭单个文件的自动编号。"
            },
            activationConfirmation: {
                title: "启用自动编号",
                message: "您即将启用自动编号功能。对于知识库中现有的文档，您希望如何处理？",
                warningTitle: "⚠️ 性能警告",
                warningMessage: "此操作将扫描知识库中的所有markdown文件。在大型知识库中，这可能需要几分钟时间并暂时影响Obsidian的性能。",
                addToAll: "为所有文档添加编号",
                addToAllDesc: "扫描所有文件并为现有文档添加标题编号",
                turnOnOnly: "仅启用不添加",
                turnOnOnlyDesc: "启用自动编号功能但保持现有文档不变",
                cancel: "取消",
                processing: "正在为文件添加编号...",
                progressStatus: "已处理 {current}/{total} 个文件",
                completed: "成功为 {count} 个文件添加编号",
                error: "处理文件时发生错误：{error}",
                noHeadersFound: "未找到包含标题的文件",
                manualTip: "你也可以通过侧边栏按钮手动启用单个文件的自动编号。"
            }
        },
        headerFont: {
            title: "标题字体设置",
            separate: {
                name: "独立标题字体",
                desc: "为markdown标题使用独立的字体设置 (# ## ###)"
            },
            preview: {
                title: "标题字体预览",
                sample: "示例标题"
            },
            family: {
                name: "字体族",
                desc: "标题字体族（默认继承全局字体）",
                options: {
                    inherit: "继承全局字体"
                }
            },
            size: {
                name: "字体大小",
                desc: "标题字体大小（默认继承全局字体大小）",
                options: {
                    inherit: "继承全局大小",
                    smaller: "较小",
                    small: "小",
                    normal: "正常",
                    large: "大",
                    larger: "较大", 
                    xlarge: "特大",
                    xxlarge: "超大"
                }
            }
        },
        titleFont: {
            title: "文档标题字体设置",
            separate: {
                name: "独立文档标题字体",
                desc: "为文档标题使用独立的字体设置"
            },
            preview: {
                title: "文档标题字体预览",
                sample: "示例文档标题"
            },
            family: {
                name: "字体族",
                desc: "文档标题字体族（默认继承全局字体）",
                options: {
                    inherit: "继承全局字体"
                }
            },
            size: {
                name: "字体大小",
                desc: "文档标题字体大小（默认继承全局字体大小）",
                options: {
                    inherit: "继承全局大小",
                    smaller: "较小",
                    small: "小",
                    normal: "正常",
                    large: "大",
                    larger: "较大", 
                    xlarge: "特大",
                    xxlarge: "超大"
                }
            }
        },
        resetSettings: {
            name: "重置设置",
            confirm: "您确定要将所有设置重置为默认值吗？"
        },
        moreInfo: "更多信息",
        author: "作者：",
        license: "许可证：",
        githubRepo: "GitHub 仓库：",
        anyQuestion: "有任何问题？"
    },
    autoDetection: {
        currentDocument: "当前文档检测结果",
        noActiveDocument: "没有活动文档",
        noHeaders: "未检测到标题",
        detected: "检测到层级",
        range: "层级范围", 
        mapping: "编号映射",
        totalHeaders: "标题总数",
        modes: {
            autoDetect: "🔧 当前模式：自动检测 - 将根据文档内容智能确定编号范围",
            yamlControl: "⚙️ 当前模式：YAML控制 - 通过文件前置元数据配置",
            manual: "🎯 当前模式：手动设置 - 使用固定的层级范围"
        },
        info: {
            yamlMode: {
                title: "⚙️ YAML控制模式",
                description: "在此模式下，标题编号由文件的YAML前置元数据控制。请在文档开头添加如下配置：",
                usage: "您可以使用插件命令来快速添加或修改这些配置。"
            },
            offMode: {
                title: "⏸️ 自动编号已关闭",
                description: "当前标题自动编号功能已禁用。要启用自动编号，请在上方选择\"启用\"或\"通过YAML控制\"模式。"
            }
        }
    },
    statusBar: {
        title: "标题增强器",
        off: "关闭",
        on: "启用",
        yaml: "YAML",
        auto: "自动",
        autoNoHeaders: "自动(无标题)",
        globalDisabled: "全局禁用",
        documentEnabled: "文档启用",
        documentDisabled: "文档关闭"
    },
    commands: {
        toggleGlobalAutoNumbering: "切换全局自动编号",
        toggleDocumentAutoNumbering: "切换文档自动编号",
        addAutoNumberingYaml: "添加自动编号YAML配置",
        resetAutoNumberingYaml: "重置自动编号YAML配置",
        removeAutoNumberingYaml: "移除自动编号YAML配置"
    },
    notices: {
        noActiveView: "没有活跃的MarkdownView，无法切换自动编号。",
        globalDisabledNotice: "自动编号在全局范围内被禁用。请先在设置中启用。",
        globalAutoNumberingEnabled: "全局自动编号已启用",
        globalAutoNumberingDisabled: "全局自动编号已禁用",
        autoNumberingEnabledForDocument: "已为此文档启用自动编号",
        autoNumberingDisabledForDocument: "已为此文档禁用自动编号",
        yamlAlreadyExists: "自动编号YAML配置已存在",
        yamlNotExists: "自动编号YAML配置不存在"
    }
};
