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
            mode: {
                name: "自动编号模式",
                desc: "控制标题自动编号的工作方式",
                off: "关闭",
                on: "启用",
                yaml: "通过YAML控制"
            },
            headerLevel: {
                name: "标题级别设置",
                desc: "配置标题级别设置"
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
                fromLevel: "从级别",
                toLevel: "到级别",
                autoDetect: "（自动检测）",
                manual: "（手动）",
                yamlControlled: "（YAML控制）",
                disabled: "（已关闭）"
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
        font: {
            title: "标题字体设置",
            separate: {
                name: "独立标题字体",
                desc: "为标题使用独立的字体设置"
            },
            preview: {
                title: "字体预览",
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
    statusBar: {
        title: "标题增强器",
        off: "关闭",
        on: "启用",
        yaml: "YAML"
    }
};
