<h1 align="center">Obsidian Header Enhancer</h1>
<div align="center">

[[中文](./README.zh.md)] [[English](./README.md)]

</div>

A powerful Obsidian plugin that enhances your markdown headers with automatic numbering, intelligent backlink management, and customizable formatting options.

**Current Version**: 0.3.0

## ✨ Core Features

### 🔢 Smart Header Auto Numbering
Automatically adds hierarchical numbering to your headers (1.1, 1.2, 2.1, etc.) with intelligent detection and real-time updates.

**Key Features:**
- **Real-time Updates**: Numbers update automatically when you press `Enter` on header lines
- **Hierarchical Structure**: Supports nested numbering (1.1.1, 1.1.2, 1.2.1, etc.)
- **Customizable Separators**: Choose from `.`, `-`, `/`, or `,` as separators
- **Flexible Start Levels**: Configure which header level (H1-H6) to start numbering from
- **Per-file Control**: Override global settings using YAML frontmatter

![header-auto-numbering-example](./doc/img/header-auto-numbering-example.gif)

### 🔗 Intelligent Backlink Management
Automatically maintains backlinks when header numbering changes, ensuring your wiki-style links stay connected.

**Features:**
- **Automatic Link Updates**: Updates `[[file#header]]` links when headers get numbered
- **Batch Processing**: Efficiently handles multiple link updates across your vault
- **Bidirectional Updates**: Works both when adding and removing header numbers
- **Safe Operations**: Preserves link integrity with error handling and notifications

### 🎨 Custom Typography & Styling  
Fine-tune the visual appearance of your headers and document titles with advanced font customization.

**Features:**
- **Separate Header Fonts**: Customize font family and size for markdown headers (#, ##, ###, etc.)
- **Separate Title Fonts**: Customize font family and size specifically for document titles
- **Live Preview**: Real-time preview of font changes in the settings panel
- **Inheritance Support**: Use "inherit" to maintain Obsidian's default styling
- **Independent Control**: Header and title fonts can be customized separately

### 📝 YAML Configuration Support
Fine-tune header numbering behavior on a per-file basis using YAML frontmatter.

**Example Configuration:**
```yaml
---
header-auto-numbering: ["state on", "first-level h2", "max 1", "start-at 1", "separator ."]
---
```

### 🎯 Advanced Editor Integration
Seamless integration with Obsidian's editor using CodeMirror 6 extensions.

**Features:**
- **Smart Key Handling**: Custom `Enter` and `Backspace` behavior for headers
- **High Priority Handling**: Ensures compatibility with other plugins
- **Real-time Processing**: Immediate feedback and updates as you type 

## 🚀 Installation

### From Obsidian Community Plugins [Recommended]
1. Open **Settings** → **Community plugins**
2. Disable **Safe mode**
3. Click **Browse** community plugins
4. Search for "**Header Enhancer**"
5. Click **Install**
6. Enable the plugin in your installed plugins list

### Manual Installation
1. Download the [Latest release](https://github.com/HoBeedzc/obsidian-header-enhancer-plugin/releases/latest)
2. Extract the ZIP file to `<vault>/.obsidian/plugins/header-enhancer/`
3. Ensure `main.js`, `manifest.json`, and `styles.css` are in the plugin folder
4. Reload Obsidian or enable the plugin in Settings

## ⚙️ Configuration & Usage

### Basic Setup
The plugin is **enabled by default** after installation. You can:

- **Toggle via Ribbon**: Click the header icon in the left ribbon
- **Toggle via Command**: Use `Ctrl/Cmd+P` → "Header Enhancer: toggle auto numbering"
- **Status Bar**: View current status in the bottom status bar (if enabled)

### Global Settings

#### Numbering Configuration
- **Start Level**: Choose which header level (H1-H6) to begin numbering
- **End Level**: Choose which header level (H1-H6) to stop numbering  
- **Separator**: Select from `.`, `-`, `/`, or `,` (default: `.`)
- **Start Number**: Set the initial number (default: `1`)
- **Header Separator**: Character between number and header text (default: tab `\t`)
- **Format Preview**: Live preview of numbering format as you customize settings

#### Font Customization
- **Header Fonts**: Separate font family and size for markdown headers
- **Title Fonts**: Separate font family and size for document titles
- **Live Preview**: Real-time font preview in the settings panel
- **Inheritance**: Option to inherit from Obsidian's default styling

#### Backlink Management
- **Update Backlinks**: Automatically update `[[file#header]]` links when headers change
- **Safe Updates**: Batch processing with error handling and rollback capability

#### Interface Options
- **Show Status Bar**: Display auto-numbering status in the bottom bar
- **Show on Sidebar**: Toggle the ribbon icon in the left sidebar
- **Language**: English and Chinese (中文) support

### Per-file YAML Control

Override global settings for individual files using frontmatter:

```yaml
---
header-auto-numbering: ["state on", "first-level h2", "max 1", "start-at 1", "separator ."]
---
```

**YAML Parameters:**
- `state on/off`: Enable/disable for this file
- `first-level h1-h6`: Starting header level
- `max N`: Maximum nesting depth
- `start-at N`: Starting number
- `separator X`: Separator character

### Commands Available

| Command | Description |
|---------|-------------|
| **Toggle auto numbering** | Turn header numbering on/off |
| **Add auto numbering yaml** | Add YAML configuration to current file |
| **Reset auto numbering yaml** | Reset YAML to default values |
| **Remove auto numbering yaml** | Remove YAML configuration |

## 💡 Usage Tips

### Header Numbering Best Practices
1. **Consistent Structure**: Maintain logical header hierarchy (H1 → H2 → H3)
2. **YAML Override**: Use per-file YAML for special documents (no numbering, different start levels)
3. **Separator Choice**: Choose separators that don't conflict with your content
4. **Backup First**: Always backup your vault before bulk operations

### Backlink Management
- Links are updated automatically when you add/remove header numbers
- Works with standard Obsidian `[[file#header]]` syntax
- Handles complex header text with special characters
- Preserves link context and formatting

### Keyboard Shortcuts
- **Enter on Header Line**: Automatically adds/updates numbering for new headers
- **Backspace on Header**: Smart deletion handling (preserves structure)
- **Ribbon Click**: Quick toggle between numbered/unnumbered modes

## 🔧 Technical Details

### Architecture
- **CodeMirror 6 Integration**: High-priority key handling for seamless editing
- **Real-time Processing**: Immediate updates without performance impact
- **Safe File Operations**: Atomic updates with rollback capability
- **Internationalization**: Full i18n support with fallback system

### Compatibility
- **Obsidian Version**: Requires 0.16.0+
- **Platform Support**: Desktop and mobile
- **Plugin Compatibility**: High-priority keymaps prevent conflicts
- **Export Compatibility**: Numbered headers work in external Markdown editors

## 🐛 Known Issues & Troubleshooting

### Current Limitations
- **Manual Refresh Required**: When changing header levels, numbering may not update immediately. Move cursor to the header line and press `Enter` to refresh
- **Tab Character Separator**: Default separator uses tab (`\t`) character. If your headers contain tabs, numbering may not work correctly
- **Space in Headers**: When using space as separator, ensure headers don't contain leading/trailing spaces

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Numbers not updating | Header level changed manually | Press `Enter` on the header line to refresh |
| Backlinks broken after numbering | Links not updated automatically | Check "Update Backlinks" setting is enabled |
| Plugin conflicts | Key handling conflicts | Header Enhancer uses highest priority - report conflicts via GitHub |
| YAML not working | Incorrect YAML format | Use command "Add auto numbering yaml" for correct format |

### Reporting Issues
Found a bug? Please report it on [GitHub Issues](https://github.com/HoBeedzc/obsidian-header-enhancer-plugin/issues) with:
- Obsidian version
- Plugin version  
- Steps to reproduce
- Expected vs actual behavior

## 🗺️ Roadmap & Development

### Completed Features
- ✅ **Header Auto Numbering** - Smart hierarchical numbering system
- ✅ **YAML Configuration** - Per-file settings override
- ✅ **Backlink Management** - Automatic link updates (v0.2.0)
- ✅ **Custom Typography** - Separate header and title font customization (v0.3.0)
- ✅ **Live Settings Preview** - Real-time format and font preview (v0.3.0)
- ✅ **Enhanced UI Controls** - Improved settings with sidebar toggle (v0.3.0)
- ✅ **Internationalization** - English and Chinese support
- ✅ **Status Bar Integration** - Real-time status display
- ✅ **CodeMirror 6 Integration** - Modern editor compatibility

### Upcoming Features
- 🔄 **Auto-level Detection** - Intelligent header level detection
- 📱 **Mobile Optimization** - Enhanced mobile experience  
- 🔍 **Search Integration** - Header search and navigation
- 🎯 **Quick Actions** - Header manipulation shortcuts
- 🎨 **Advanced Styling** - More typography options and themes

## 📊 Changelog

### Version 0.3.0 (Current)
- ✨ **NEW**: Custom typography system with separate header and title font controls
- ✨ **NEW**: Live preview for both numbering format and font changes in settings
- ✨ **NEW**: Sidebar toggle option to show/hide the ribbon icon
- ✨ **NEW**: Enhanced settings UI with improved validation and internationalization
- 🔧 **IMPROVED**: Renamed "max header level" to "end header level" for clarity
- 🔧 **IMPROVED**: YAML-controlled and disabled state previews in settings
- 🔧 **IMPROVED**: Better settings organization and user experience
- 🐛 **FIXED**: Various UI consistency issues and edge cases

### Version 0.2.0
- ✨ **NEW**: Intelligent backlink management system
- ✨ **NEW**: Automatic `[[file#header]]` link updates
- ✨ **NEW**: Batch link processing with error recovery
- ✨ **NEW**: Bidirectional link updates (when adding/removing numbering)
- 🔧 **IMPROVED**: Enhanced header text extraction and parsing
- 🔧 **IMPROVED**: Better error handling and user notifications
- 🐛 **FIXED**: Multiple edge cases in header numbering logic

### Previous Versions
Full changelog available at [doc/changelog.md](./doc/changelog.md)

## 🙏 Acknowledgements & Credits

This plugin builds upon the excellent work of the Obsidian community:

- **[easy-typing-obsidian](https://github.com/Yaozhuwa/easy-typing-obsidian)** - Editor integration patterns
- **[obsidian-state-switcher](https://github.com/lijyze/obsidian-state-switcher)** - State management inspiration  
- **[number-headings-obsidian](https://github.com/onlyafly/number-headings-obsidian)** - Initial numbering concepts
- **Obsidian Community** - Feedback, testing, and feature suggestions

## 💖 Support & Contributing

### Show Your Support
If this plugin helps improve your note-taking workflow:

<a href="https://bmc.link/hobee">
  <img src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=hobee&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff" />
</a>

### Contributing
Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request with detailed description
4. Follow existing code style and patterns

### Development Setup
```bash
# Clone and setup
git clone https://github.com/HoBeedzc/obsidian-header-enhancer-plugin.git
cd obsidian-header-enhancer-plugin
npm install

# Development mode (watch & rebuild)
npm run dev

# Production build
npm run build

# Version bump
npm run version
```

---

<div align="center">

**Made with ❤️ by [Hobee Liu](https://github.com/HoBeedzc)**

⭐ **Star this repo** if you find it useful! ⭐

</div>
