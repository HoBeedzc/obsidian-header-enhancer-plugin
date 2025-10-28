<h1 align="center">Obsidian Header Enhancer｜Obsidian 标题增强插件</h1>
<div align="center">

[[中文](./README.zh.md)] [[English](./README.md)]

</div>

功能强大的 Obsidian 插件，为 Markdown 标题提供自动编号、智能反向链接管理和自定义字体。

**当前版本**: 0.4.1

## ✨ 功能特性

### 🔢 智能自动编号
自动添加层次化编号（1.1、1.2、2.1），实时更新。

- 全局与单文档双级控制
- 自动标题级别检测，可配置分隔符（`.`、`-`、`/`、`,`）
- 灵活的起始级别（H1-H6）和 YAML 前置元数据覆盖
- 带确认对话框的批量操作

![header-auto-numbering-example](./doc/img/header-auto-numbering-example.gif)

### 🔗 智能反向链接管理
标题变化时自动更新 `[[文件名#标题]]` 链接，支持批量处理和双向更新。

### 🎨 字体自定义
标题和文档标题独立的字体系列和大小控制，实时预览，分类字体选择。

### 📝 YAML 配置
使用前置元数据进行单文件控制：
```yaml
---
header-auto-numbering: ["state on", "first-level h2", "max 1", "start-at 1", "separator ."]
---
```

## 🚀 安装

### 社区插件（推荐）
1. 打开 **设置** → **社区插件** → **浏览**
2. 搜索 "**Header Enhancer**" → **安装** → 启用

### 手动安装
1. 下载 [最新版本](https://github.com/HoBeedzc/obsidian-header-enhancer-plugin/releases/latest)
2. 解压到 `<库目录>/.obsidian/plugins/header-enhancer/`
3. 重新加载 Obsidian

## ⚙️ 使用教程

### 快速开始

1. **启用插件**
   - 安装后，在设置中找到 "Header Enhancer"
   - 打开 "启用自动编号功能" 主开关

2. **开始使用**
   - 在标题行（如 `## 标题`）按 `Enter` 键
   - 插件会自动添加编号（如 `## 1. 标题`）
   - 子标题会自动生成层次编号（1.1、1.1.1 等）

### 双级控制系统

**全局控制**（整个知识库）
- 位置：设置 → Header Enhancer → "启用自动编号功能"
- 作用：控制整个知识库是否启用自动编号功能
- 状态：关闭后，所有文档都无法使用自动编号

**文档控制**（单个文件）
- 方式 1：点击左侧功能区的标题图标 📝
- 方式 2：命令面板（`Ctrl/Cmd+P`）→ "切换文档自动编号"
- 前提：全局开关必须先开启
- 状态：底部状态栏显示当前文档状态

### 设置详解

**编号配置**
- **起始级别**：从哪个标题级别开始编号（如从 H2 开始，H1 不编号）
- **结束级别**：在哪个标题级别停止编号
- **自动检测**：开启后自动识别文档中的标题级别
- **分隔符**：编号间的分隔符，支持 `.`（1.1）、`-`（1-1）、`/`（1/1）、`,`（1,1）
- **起始数字**：第一个标题的编号（默认为 1）

**字体自定义**
- **标题字体**：控制 Markdown 标题（#、##、###）的字体
- **文档标题字体**：控制文档第一行标题的字体
- 提供分类字体选择（衬线、无衬线、等宽等）
- 设置面板中可实时预览效果

**反向链接**
- 开启 "更新反向链接" 后，添加/移除编号时自动更新相关链接
- 支持 `[[文件名#标题]]` 格式的链接自动维护

### YAML 单文件配置

如果某个文件需要特殊的编号规则，可以在文件开头添加：

```yaml
---
header-auto-numbering: ["state on", "first-level h2", "max 1", "start-at 1", "separator ."]
---
```

**参数说明：**
- `state on/off`：该文件是否启用编号
- `first-level h1-h6`：起始标题级别
- `max N`：最大嵌套层数
- `start-at N`：起始编号
- `separator ./-/,`：分隔符

**快捷操作：** 使用命令 "添加自动编号 YAML" 可快速插入正确格式的配置

### 常用命令

| 命令 | 快捷方式 | 说明 |
|------|---------|------|
| 切换全局自动编号 | 命令面板 | 开启/关闭整个知识库的编号功能 |
| 切换文档自动编号 | 功能区图标 / 命令面板 | 控制当前文档的编号状态 |
| 批量应用编号 | 命令面板 | 为所有文件添加编号（带确认对话框） |
| 批量移除编号 | 命令面板 | 从所有文件移除编号（带确认对话框） |
| 添加自动编号 YAML | 命令面板 | 在当前文件添加 YAML 配置 |

### 使用技巧

**日常使用**
- ✅ 在标题行按 `Enter` 自动添加/更新编号
- ✅ 手动修改标题级别后，光标移到该行按 `Enter` 刷新
- ✅ 点击功能区图标快速切换当前文档的编号状态

**批量操作**
- ⚠️ 批量操作前务必备份知识库
- 💡 使用批量应用时会显示确认对话框，可选择处理范围
- 💡 批量移除支持安全回滚机制

**特殊场景**
- 📝 日常笔记：全局开启，个别文件用 YAML 关闭
- 📚 知识管理：使用不同分隔符区分不同类型文档
- 🎯 项目文档：从 H2 开始编号，保留 H1 作为文档标题

## 🐛 已知问题
- 更改标题级别需手动刷新（按 `Enter`）
- 默认分隔符使用制表符（`\t`）

在 [GitHub Issues](https://github.com/HoBeedzc/obsidian-header-enhancer-plugin/issues) 报告问题

## 📊 更新日志

### v0.4.1（当前）
- 修复标题包含空格的支持（英文和中文）
- 改进正则表达式模式匹配处理特殊情况

### v0.4.0
- 全局与文档级别双控制系统
- 自动标题级别检测
- 增强国际化和状态指示器

完整更新日志：[doc/changelog.md](./doc/changelog.md)

## 💖 支持

<a href="https://bmc.link/hobee">
  <img src="https://img.buymeacoffee.com/button-api/?text=请我喝杯咖啡&emoji=&slug=hobee&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff" />
</a>

**由 [Hobee Liu](https://github.com/HoBeedzc) 用 ❤️ 制作**

欢迎贡献！详情见 [GitHub](https://github.com/HoBeedzc/obsidian-header-enhancer-plugin)
