<h1 align="center">Obsidian Header Enhancer｜Obsidian 标题增强插件</h1>
<div align="center">

[[中文](./README.zh.md)] [[English](./README.md)]

</div>

这个插件旨在增强 [Obsidian](https://obsidian.md) 的标题。该插件将自动检测标题级别并为标题添加序号。

**警告:**
- 这个插件还处于早期开发阶段,所以可能存在一些bug。如果您发现任何bug,请随时在[问题跟踪](https://github.com/HoBeedzc/obsidian-header-enhancer-plugin/issues)中报告。
- 数据是无价的,所以请记得在使用测试版插件(版本号像0.x.x)时创建备份。

## 核心特性

### 1. 标题自动编号
标题自动编号提供了为标题添加序号的功能。当您按`Enter`键创建新行时,序号将被添加到标题中,并在您更改标题级别时更新。

**示例:**

![header-auto-numbering-example](./doc/img/header-auto-numbering-example.gif)

**警告:**
- 标题自动编号使用`\t`分隔自动编号和标题。如果您的标题包含`\t`,则标题自动编号可能无法正常工作。  
- 标题自动编号将直接修改您的 Markdown 源文件,以便在其他 Markdown 编辑器中呈现。
- 如果您将分隔符设置为`Space`,请确保您的标题不包含空格。

### 2. 隔离标题字体 [开发中]
隔离标题字体提供了将标题字体与内容分离的功能。

## 安装

### 从Obsidian【推荐】
1. 打开设置 -> 第三方插件
2. 禁用安全模式 
3. 点击浏览社区插件
4. 搜索“Header Enhancer”
5. 点击安装
6. 安装完成后,关闭社区插件窗口并启用新安装的插件

### 从GitHub
1. 下载 [最新版本](https://github.com/HoBeedzc/obsidian-header-enhancer-plugin/releases/latest)
2. 将zip归档提取到`<vault>/.obsidian/plugins/`中,以便`main.js`文件在`<vault>/.obsidian/plugins/header-enhancer/`文件夹中。
3. 重新加载Obsidian
4. 如果提示安全模式,可以禁用安全模式并启用插件。

## 用法
### 标题自动编号
标题自动编号默认启用。您可以在插件设置中禁用它。

#### a. 更改自动编号起始标题级别  
您可以在插件设置中更改自动编号的起始标题级别。默认值为`1`,这意味着自动编号从 H1 或 `#` 开始。

#### b. 自定义编号样式
您可以在插件设置中自定义编号样式并预览样式。目前仅支持自定义分隔符。

#### c. 使用Yaml控制标题编号
您可以在插件设置中使用Yaml控制标题编号。默认值为`false`,这意味着使用自动编号。如果您将其设置为`true`,则可以使用Yaml控制标题编号。

**示例:**
![yaml-example](./doc/img/yaml-example.gif)

## 已知 bug
这里列出了一些已知的bug,我会尽快修复它们。
- [ ] 当您更改标题级别时,自动编号不会立即更新。您需要将光标移动到标题行并按`Enter`键来更新它。  

## 待办事项
- [x] 设置支持中文。 - 标题增强器

## 更新日志
完整的更新日志可以在[这里](./doc/changelog.md).找到。

## 致谢
- https://github.com/Yaozhuwa/easy-typing-obsidian
- https://github.com/lijyze/obsidian-state-switcher
- https://github.com/onlyafly/number-headings-obsidian

## 支持
如果您喜欢这个插件,您可以通过以下方式支持我:

<a href="https://bmc.link/hobee"><img src="https://img.buymeacoffee.com/button-api/?text=请我喝杯咖啡&emoji=&slug=hobee&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff" /></a>
