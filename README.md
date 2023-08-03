<h1 align="center">Obsidian Header Enhancer</h1>
<div align="center">

[[中文](./README.zh.md)] [[English](./README.md)]

</div>

This plugin is designed to enhance the header of [Obsidian](https://obsidian.md). The plugin will auto detect the header level and add number to the header.

## Core Features
### 1. Header Auto Numbering
Header auto numbering provides the ability to add number to the header. The number will be added to the header when you press `Enter` key to create a new line and it will be updated when you change the header level.

example:
![](https://raw.githubusercontent.com/hobeen/obsidian-header-enhancer/master/images/header-auto-numbering.gif)

warning:
- Header Auto Numbering use `\t` split auto-number and your header. If your header contains `\t`, Header Auto Numbering may not work properly.
- Header Auto Numbering will modify your Markdown source file directly, so that can be render in other Markdown editor. 

### 2. Isolate Title Font [W.I.P]
Isolate title font provides the ability to isolate the title font from the content. 

## Installation

### From Obsidian
1. Open Settings -> Third-party plugins
2. Disable Safe mode
3. Click Browse community plugins
4. Search for "Header Enhancer"
5. Click Install
6. Once installed, close the community plugins window and enable the newly installed plugin

### From GitHub
1. Download the [Latest release]
2. Extract the zip archive in `<vault>/.obsidian/plugins/` so that the `main.js` file is within the folder `<vault>/.obsidian/plugins/header-enhancer/`.
3. Reload Obsidian
4. If prompted about Safe Mode, you can disable safe mode and enable the plugin.

## Usage
### Header Auto Numbering
Header auto numbering is enabled by default. You can disable it in the plugin settings.

## ChangeLog
Full changelog can be found [here](CHANGELOG.md). [W.I.P]

## Acknowledgements
- https://github.com/Yaozhuwa/easy-typing-obsidian

## Support
If you like this plugin, you can support me by:

<a href="https://bmc.link/hobee"><img src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=hobee&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff" /></a>
