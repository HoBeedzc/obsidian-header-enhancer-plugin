export default {
    settings: {
        title: "标题增强设置",
        general: "常规",
        language: {
            name: "语言",
            desc: "自动编号的语言"
        },
        statusBar: {
            name: "在状态栏显示",
            desc: "在状态栏显示当前标题级别"
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
            enable: {
                name: "启用自动编号",
                desc: "启用标题自动编号",
                notice: "此选项只能在侧边栏中更改"
            },
            useYaml: {
                name: "使用YAML",
                desc: "使用YAML控制标题编号格式"
            },
            headerLevel: {
                name: "标题级别设置",
                desc: "配置标题级别设置"
            },
            startNumber: {
                name: "起始编号",
                desc: "自动编号的起始数字",
                placeholder: "输入数字"
            },
            separator: {
                name: "数字分隔符",
                desc: "数字之间的分隔符（可选 '. , / -'）",
                placeholder: "输入分隔符"
            },
            headerSeparator: {
                name: "标题分隔符",
                desc: "标题编号和文本之间的分隔符",
                error: "启用自动编号时无法更改标题分隔符"
            },
            format: {
                name: "你的自动编号格式是",
                fromLevel: "从 H",
                toLevel: "到 H",
                autoDetect: "[自动检测]",
                manual: "[手动]"
            }
        },
        font: {
            title: "标题字体设置",
            separate: {
                name: "独立标题字体",
                desc: "为标题使用不同的字体设置",
                notice: "此功能暂不可用，请等待下一个版本"
            },
            family: {
                name: "字体系列",
                desc: "标题字体系列（默认继承全局字体）",
                placeholder: "全局字体"
            },
            size: {
                name: "字体大小",
                desc: "标题字体大小（默认继承全局字体大小）",
                placeholder: "全局字体大小"
            }
        },
        reset: {
            name: "重置设置",
            confirm: "确定要将设置重置为默认值吗？"
        },
        moreInfo: "更多信息",
        author: "作者：",
        license: "许可证：",
        githubRepo: "Github仓库：",
        anyQuestion: "有任何问题？请在这里反馈"
    }
};
