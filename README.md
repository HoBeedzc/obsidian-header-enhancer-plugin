<h1 align="center">Obsidian Header Enhancer</h1>
<div align="center">

[[中文](./README.zh.md)] [[English](./README.md)]

</div>

A powerful Obsidian plugin that enhances markdown headers with automatic numbering, intelligent backlink management, and custom fonts.

**Current Version**: 0.4.1

## ✨ Features

### 🔢 Smart Auto Numbering
Automatically adds hierarchical numbering (1.1, 1.2, 2.1) with real-time updates.

- Global & per-document control with master switch
- Auto header level detection and configurable separators (`.`, `-`, `/`, `,`)
- Flexible start levels (H1-H6) and YAML frontmatter override
- Bulk operations across entire vault with confirmation dialogs

![header-auto-numbering-example](./doc/img/header-auto-numbering-example.gif)

### 🔗 Intelligent Backlink Management
Automatically updates `[[file#header]]` links when headers change, with batch processing and bidirectional support.

### 🎨 Font Customization
Separate font family and size controls for headers and document titles, with live preview and organized font categories.

### 📝 YAML Configuration
Per-file control using frontmatter:
```yaml
---
header-auto-numbering: ["state on", "first-level h2", "max 1", "start-at 1", "separator ."]
---
``` 

## 🚀 Installation

### From Community Plugins (Recommended)
1. Open **Settings** → **Community plugins** → **Browse**
2. Search "**Header Enhancer**" → **Install** → Enable

### Manual Installation
1. Download [latest release](https://github.com/HoBeedzc/obsidian-header-enhancer-plugin/releases/latest)
2. Extract to `<vault>/.obsidian/plugins/header-enhancer/`
3. Reload Obsidian

## ⚙️ Usage Guide

### Quick Start

1. **Enable the Plugin**
   - After installation, find "Header Enhancer" in settings
   - Turn on "Enable Auto Numbering Function" master switch

2. **Start Using**
   - Press `Enter` on a header line (e.g., `## Header`)
   - Plugin automatically adds numbering (e.g., `## 1. Header`)
   - Sub-headers get hierarchical numbers (1.1, 1.1.1, etc.)

### Dual-Level Control System

**Global Control** (Entire Vault)
- Location: Settings → Header Enhancer → "Enable Auto Numbering Function"
- Purpose: Controls auto-numbering functionality for entire vault
- Status: When disabled, auto-numbering unavailable for all documents

**Document Control** (Individual File)
- Method 1: Click header icon 📝 in left sidebar (ribbon)
- Method 2: Command palette (`Ctrl/Cmd+P`) → "Toggle Document Auto Numbering"
- Requirement: Global switch must be enabled first
- Status: Bottom status bar shows current document state

### Settings Explained

**Numbering Configuration**
- **Start Level**: Which header level to begin numbering (e.g., start from H2, skip H1)
- **End Level**: Which header level to stop numbering
- **Auto Detection**: Automatically detect header levels in document
- **Separator**: Number separator, supports `.` (1.1), `-` (1-1), `/` (1/1), `,` (1,1)
- **Start Number**: First header number (default: 1)

**Font Customization**
- **Header Fonts**: Control Markdown headers (#, ##, ###) font family/size
- **Title Fonts**: Control document title font family/size
- Organized font categories (Serif, Sans-Serif, Monospace, etc.)
- Live preview in settings panel

**Backlinks**
- Enable "Update Backlinks" to auto-update links when adding/removing numbers
- Supports `[[file#header]]` format link maintenance

### Per-File YAML Configuration

For files needing special numbering rules, add at the beginning:

```yaml
---
header-auto-numbering: ["state on", "first-level h2", "max 1", "start-at 1", "separator ."]
---
```

**Parameters:**
- `state on/off`: Enable/disable numbering for this file
- `first-level h1-h6`: Starting header level
- `max N`: Maximum nesting depth
- `start-at N`: Starting number
- `separator ./-/,`: Separator character

**Quick Tip:** Use command "Add auto numbering yaml" to insert correct format quickly

### Common Commands

| Command | Access | Description |
|---------|--------|-------------|
| Toggle Global Auto Numbering | Command palette | Enable/disable numbering for entire vault |
| Toggle Document Auto Numbering | Ribbon icon / Command palette | Control current document numbering |
| Bulk apply numbering | Command palette | Add numbering to all files (with confirmation) |
| Bulk remove numbering | Command palette | Remove numbering from all files (with confirmation) |
| Add auto numbering yaml | Command palette | Add YAML config to current file |

### Usage Tips

**Daily Usage**
- ✅ Press `Enter` on header line to auto-add/update numbering
- ✅ After manually changing header level, move cursor to line and press `Enter` to refresh
- ✅ Click ribbon icon to quickly toggle current document numbering

**Bulk Operations**
- ⚠️ Always backup vault before bulk operations
- 💡 Bulk apply shows confirmation dialog with scope options
- 💡 Bulk remove supports safe rollback mechanism

**Special Scenarios**
- 📝 Daily notes: Global on, disable individual files with YAML
- 📚 Knowledge management: Use different separators for different doc types
- 🎯 Project docs: Start from H2, preserve H1 as document title

## 🐛 Known Issues
- Manual refresh needed when changing header levels (press `Enter`)
- Default separator uses tab character (`\t`)

Report bugs at [GitHub Issues](https://github.com/HoBeedzc/obsidian-header-enhancer-plugin/issues)

## 📊 Changelog

### v0.4.1 (Current)
- Fixed headers with spaces support (English & Chinese)
- Improved regex pattern matching for special cases

### v0.4.0
- Global & document-level dual control system
- Auto header level detection
- Enhanced i18n and status indicators

Full changelog: [doc/changelog.md](./doc/changelog.md)

## 💖 Support

<a href="https://bmc.link/hobee">
  <img src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=hobee&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff" />
</a>

**Made with ❤️ by [Hobee Liu](https://github.com/HoBeedzc)**

Contributions welcome! See [GitHub](https://github.com/HoBeedzc/obsidian-header-enhancer-plugin) for details.
