# 更新记录 - Changelog

## [0.6.0] - 2026-06-16
### Improved
- 🔒 改进社区插件 Scorecard 风险项 - Improved community plugin Scorecard risk findings
  - 使用 Obsidian DOM API 替换设置界面的 unsafe HTML 渲染 - Replaced unsafe settings UI HTML rendering with Obsidian DOM APIs
  - 将运行时注入样式迁移到 `styles.css` - Moved runtime-injected styles into `styles.css`
  - 新增可复现依赖锁定并固定依赖版本 - Added reproducible dependency locking and pinned package versions
  - 移除 `builtin-modules` 依赖并使用 Node 内置模块列表 - Removed `builtin-modules` dependency in favor of Node builtin module metadata
  - 显式声明 CodeMirror 运行依赖 - Explicitly declared CodeMirror runtime dependencies
  - 更新 Obsidian 1.8.7+ 兼容性元数据 - Updated compatibility metadata for Obsidian 1.8.7+
### Fixed
- 🐛 改进弹窗进度显示和延时调用的 Obsidian 兼容性 - Improved modal progress display and timeout calls for Obsidian compatibility

## [0.5.2] - 2026-06-06
### Fixed
- 🐛 修复手动/YAML 标题层级范围未正确生效的问题 - Fixed configured manual/YAML header level ranges not being fully respected
- 🐛 修复选中标题文本后按 Backspace 或直接输入无法正常删除/替换的问题 - Fixed deleting or replacing selected heading text with Backspace or direct typing
- 🐛 修复带缩进的代码块围栏导致后续标题编号异常的问题 - Fixed indented code fences causing later header numbering issues

## [0.5.1] - 2025-11-03
### Fixed
- 🐛 修复 Enter 键在标题行的自动编号行为 - Fixed Enter key behavior for automatic header numbering on header lines
- 🐛 修复 YAML 状态与文档切换按钮的同步问题 - Fixed YAML state synchronization with document toggle button
### Improved
- 🔧 提升整体稳定性和用户体验 - Improved overall stability and user experience
- 🔧 优化编辑器事件处理和状态管理 - Optimized editor event handling and state management

## [0.5.0] - 2025-10-30
### Added
- ✨ 🆕 YAML 模式智能默认值系统 - YAML mode smart defaults system
  - 支持为没有 YAML 配置的文档设置默认值 - Support default settings for documents without YAML configuration
  - 新增"没有 YAML 的文档处理方式"选项（不编号/使用默认设置） - Added "Documents without YAML configuration" option (no numbering/use defaults)
  - YAML 模式独立的默认配置（起始层级、结束层级、起始数字、分隔符） - Separate default configuration for YAML mode (start level, end level, start number, separator)
  - 大幅减少手动添加 YAML 配置的需求 - Significantly reduced need for manual YAML configuration
- ✨ 🆕 统一的 YAML 格式 - Unified YAML format
  - 新格式使用 `start-level` 和 `end-level` 替代 `first-level` 和 `max` - New format uses `start-level` and `end-level` instead of `first-level` and `max`
  - 与设置界面保持完全一致，更加直观 - Fully consistent with settings UI, more intuitive
  - 向后兼容旧格式（已标记为 deprecated） - Backward compatible with old format (marked as deprecated)
- ✨ 🆕 新命令："为当前文件应用自定义配置" - New command: "Apply Custom YAML Configuration"
  - 自动插入使用用户默认设置的 YAML 模板 - Automatically insert YAML template with user default settings
  - 插入后可直接编辑修改 - Can be edited directly after insertion
### Improved
- 🔧 动态 YAML 示例显示 - Dynamic YAML example display
  - 设置界面中的 YAML 示例实时反映用户配置 - YAML example in settings UI reflects user configuration in real-time
  - 修改任何默认值时，示例立即更新 - Example updates immediately when changing any default value
- 🔧 简化命令系统 - Simplified command system
  - 删除重复的 "Add Auto Numbering YAML" 命令 - Removed duplicate "Add Auto Numbering YAML" command
  - 保留功能更完整的新命令 - Retained new command with more complete functionality
- 🔧 代码质量改进 - Code quality improvements
  - 为废弃的 YAML 键添加 `@deprecated` 标记 - Added `@deprecated` annotations for deprecated YAML keys
  - 添加运行时警告提示用户更新格式 - Added runtime warnings to prompt users to update format
  - 完善的向后兼容性保证 - Comprehensive backward compatibility guarantees
### Changed
- ⚠️ 废弃旧的 YAML 格式键 - Deprecated old YAML format keys
  - `first-level` → `start-level` (仍可用但已废弃) - `first-level` → `start-level` (still works but deprecated)
  - `max` → `end-level` (仍可用但已废弃) - `max` → `end-level` (still works but deprecated)
  - 使用旧格式时控制台会显示警告 - Console warnings when using old format
  - 计划在未来版本中移除旧格式支持 - Planned removal of old format support in future versions

## [0.4.1] - 2025-10-28
### Fixed
- 🐛 修复标题包含空格时自动编号失效的问题 - Fixed header auto-numbering failure when headers contain spaces
- 🐛 修复英文标题（单词间必然有空格）无法使用自动编号的问题 - Fixed English headers (which always contain spaces between words) unable to use auto-numbering
- 🐛 修复中文标题使用空格分隔时编号失效的问题 - Fixed Chinese headers with spaces as separators unable to be numbered
### Improved
- 🔧 核心编号函数改用正则表达式匹配替代简单split操作 - Core numbering functions now use regex pattern matching instead of simple split operations
- 🔧 改进 `isNeedInsertNumber` 函数，使用 `/^\d+(?:\.\d+)*\s+/` 模式检测编号 - Improved `isNeedInsertNumber` function using `/^\d+(?:\.\d+)*\s+/` pattern to detect numbering
- 🔧 改进 `isNeedUpdateNumber` 函数，正确提取和比较现有编号 - Improved `isNeedUpdateNumber` function to correctly extract and compare existing numbers
- 🔧 改进 `removeHeaderNumber` 函数，保留标题中的所有空格 - Improved `removeHeaderNumber` function to preserve all spaces in header content
- 🔧 更好地处理特殊空格情况（多空格、Tab字符等） - Better handling of special space cases (multiple spaces, tabs, etc.)

## [0.4.0] - 2025-09-02
### Added
- ✨ 🆕 全局与文档级别控制系统 - Global & Document-Level Control system
  - 整个知识库的主开关功能 - Master switch for entire vault functionality
  - 单文档级别的编号控制 - Per-document numbering control
  - 独立的全局和文档切换命令 - Separate global and document toggle commands
- ✨ 🆕 自动标题级别检测 - Auto Header Level Detection
  - 智能检测文档中存在的标题级别 - Intelligent detection of header levels in documents
  - 自动配置编号范围和层次结构 - Auto-configure numbering range and hierarchy
- ✨ 🆕 增强的国际化支持 - Enhanced internationalization support
  - 新功能的中英文翻译完整覆盖 - Complete Chinese and English translation coverage for new features
  - 改进的通知消息和用户提示 - Improved notification messages and user prompts
- ✨ 🆕 视觉状态指示器 - Visual status indicators
  - 状态栏显示当前文档和全局状态 - Status bar shows current document and global status
  - 功能区图标反映编号状态 - Ribbon icon reflects numbering status
### Improved
- 🔧 设置界面全面重构 - Comprehensive settings UI refactoring
  - 新增全局启用/禁用主开关 - Added global enable/disable master switch
  - 依赖选项的智能显示/隐藏 - Smart show/hide of dependent options
  - 改进的设置组织和用户引导 - Improved settings organization and user guidance
- 🔧 用户体验大幅提升 - Significantly enhanced user experience
  - 清楚区分全局和文档控制功能 - Clear distinction between global and document controls
  - 上下文感知的操作提示 - Context-aware operation prompts
  - 智能化的功能状态管理 - Intelligent feature state management
- 🔧 状态同步和UI响应优化 - Status synchronization and UI responsiveness optimization
  - 实时状态更新和视觉反馈 - Real-time status updates and visual feedback
  - 文档切换时的状态同步 - Status sync when switching documents
  - 改进的异步操作处理 - Improved async operation handling
### Fixed
- 🐛 命令系统优化和混淆消除 - Command system optimization and confusion elimination
  - 移除遗留的切换命令避免用户困惑 - Remove legacy toggle commands to avoid user confusion
  - 统一命名规范和功能职责 - Unified naming conventions and functional responsibilities
- 🐛 状态管理和持久化改进 - State management and persistence improvements
  - 修复文档状态的存储和恢复问题 - Fixed document state storage and restoration issues
  - 改进跨会话的状态一致性 - Improved cross-session state consistency
- 🐛 边界情况处理和错误恢复 - Edge case handling and error recovery
  - 改进异常情况下的用户体验 - Improved user experience in exceptional cases
  - 增强错误提示和引导信息 - Enhanced error prompts and guidance information

## [0.3.3] - 2025-08-26
### Fixed
- 修复 build 失败的问题 - Fixed build failure issue

## [0.3.2] - 2025-08-26
### Fixed
- 修复 build 失败的问题 - Fixed build failure issue

## [0.3.1] - 2024-08-26
### Added
- 🆕 批量操作对话框，带确认和进度跟踪 - Bulk operation dialogs with confirmation and progress tracking
- 🆕 自动编号激活对话框，提供知识库范围应用选项 - Auto-numbering activation dialog with vault-wide application option
- 🆕 自动编号移除确认对话框，提供批量移除选项 - Auto-numbering removal confirmation with bulk removal option
- 🆕 增强的 YAML 架构，提供更好的验证和用户指导 - Enhanced YAML schema with better validation and user guidance
- 🆕 扩展的字体系列分类，提供有组织的字体选择 - Expanded font family categories with organized font selection
- 🆕 长时间操作的进度指示器 - Progress indicators for long-running operations
### Improved
- 🔧 提取和模块化编辑器处理程序和CSS样式管理 - Extracted and modularized editor handlers and CSS style management
- 🔧 更好的批量操作错误处理和用户反馈 - Better error handling and user feedback for bulk operations
- 🔧 增强的对话框UI，提供警告和手动操作提示 - Enhanced dialog UI with warnings and manual operation tips
- 🔧 改进的批量处理性能，带适当的延迟避免编辑器冲突 - Improved bulk processing performance with proper timing to avoid editor conflicts
### Fixed
- 🐛 批量处理和编辑器冲突防护的各种边界情况 - Various edge cases in bulk processing and editor conflict prevention
- 🐛 对话框状态管理和按钮禁用的问题 - Issues with dialog state management and button disabling
- 🐛 大型知识库处理的内存和性能优化 - Memory and performance optimizations for large vault processing

## [0.3.0] - 2025-08-25
### Added
- 🆕 自定义字体系统，支持独立的标题和文档标题字体控制 - Custom typography system with separate header and title font controls
- 🆕 设置中编号格式和字体更改的实时预览 - Live preview for both numbering format and font changes in settings
- 🆕 侧边栏切换选项，可显示/隐藏功能区图标 - Sidebar toggle option to show/hide the ribbon icon
- 🆕 增强的设置界面，改进的验证和国际化支持 - Enhanced settings UI with improved validation and internationalization
### Improved
- 🔧 将"最大标题级别"重命名为"结束标题级别"以提高清晰度 - Renamed "max header level" to "end header level" for clarity
- 🔧 设置中的YAML控制和禁用状态预览 - YAML-controlled and disabled state previews in settings
- 🔧 更好的设置组织和用户体验 - Better settings organization and user experience
- 🔧 增强字体样式的实时应用和CSS集成 - Enhanced real-time font style application and CSS integration
### Fixed
- 🐛 各种UI一致性问题和边界情况 - Various UI consistency issues and edge cases
- 🐛 修复字体设置中的样式继承问题 - Fixed style inheritance issues in font settings
- 🐛 改进设置页面的响应性和稳定性 - Improved settings page responsiveness and stability

## [0.2.1] - 2025-08-25
### Fixed
- 修复 build 失败的问题 - Fixed build failure issue

## [0.2.0] - 2024-08-24
### Added
- 🆕 智能反向链接管理系统 - Intelligent backlink management system
- 🆕 自动更新 `[[文件名#标题]]` 链接功能 - Automatic `[[file#header]]` link updates
- 🆕 批量链接处理和错误恢复机制 - Batch link processing with error recovery
- 🆕 双向链接更新（添加和移除编号时） - Bidirectional link updates (when adding/removing numbering)
- 🆕 BacklinkManager 类处理复杂链接场景 - BacklinkManager class for complex link scenarios
### Improved
- 🔧 增强标题文本提取和解析算法 - Enhanced header text extraction and parsing algorithms
- 🔧 优化用户通知和错误处理机制 - Improved user notifications and error handling
- 🔧 完善设置界面的反向链接配置选项 - Enhanced backlink settings in configuration UI
- 🔧 更新中英文文档以反映新功能 - Updated documentation in both languages to reflect new features
### Fixed
- 🐛 修复标题编号逻辑中的多个边界情况 - Fixed multiple edge cases in header numbering logic
- 🐛 改进代码块检测，避免误操作 - Improved code block detection to prevent false operations
- 🐛 优化异步操作的错误处理 - Enhanced error handling for async operations

## [0.1.8] - 2025-08-24
### Fixed
- 修复无法安装插件的问题 - Fixed the problem of "Unable to Install Plugin"

## [0.1.7] - 2025-08-14
### Fixed
- 修复 TypeScript 编译错误：异步函数返回类型不匹配问题 - Fixed TypeScript compilation error: async function return type mismatch
- 修复 Enter 键处理器中 Promise<boolean> 与 boolean 类型冲突 - Fixed Promise<boolean> vs boolean type conflict in Enter key handler

## [0.1.6] - 2025-08-14
### Refactor
- 将布尔标志替换为枚举 AutoNumberingMode（OFF/ON/YAML_CONTROLLED），提升配置清晰度 - Replace boolean flags with AutoNumberingMode enum for clarity
- 设置页将开关改为下拉选择，交互更一致 - Settings UI: toggles replaced by dropdown
### Fixed
- 修复 `removeHeaderNumber` 中标题文本提取问题 - Fix header text extraction bug in `removeHeaderNumber`
### Changed
- 改进状态栏显示并完善国际化 - Improve status bar display with proper internationalization
- 更新中英文翻译以匹配新模式 - Update i18n strings to match new mode system

## [0.1.5] - 2024-12-15
### Added
- 增加多语言支持 - Added multi-language support

## [0.1.4] - 2024-06-12
### Refactor
- 重构了代码，提高了代码质量 - Refactored the code to improve code quality

## [0.1.3] - 2023-11-27
### Fixed
- 修复 issue#16 中提到的【无法忽略代码块中 '#' 的问题 - Fixed the problem of "Unable to Ignore '#' in Code Block" mentioned in issue#16

## [0.1.2] - 2023-10-30
### Fixed
- 修复发版错误 - Fixed release error

## [0.1.1] - 2023-10-27
### Fixed
- 修复发版错误 - Fixed release error

## [0.1.0] - 2023-10-27
### Added
- 增加【支持空格作为分隔符】的功能 - Added the function of "Support Space as Separator"

## [0.0.6] - 2023-10-05
### Added
- 增加【使用Yaml控制标题编号】的功能 - Added the function of "Use Yaml to Control Header Numbering"

## [0.0.5] - 2023-10-02
### Fixed
- 修复 issue#5 中提到的【列表中插入新行】的问题 - Fixed the problem of "Insert New Line in List" mentioned in issue#5

## [0.0.4] - 2023-09-09
### Added
- 增加设置中【预览自定义编号样式】实时渲染的功能 - Added the function of real-time rendering of "Preview Custom Numbering Style" in the settings
### Fixed
- 修复 issue#1 中提到的【标题开始编号】设置不起作用的问题 - Fixed the problem that the "Title Start Numbering" setting does not work mentioned in issue#1

## [0.0.3] - 2023-09-05
### Changed
- 根据审核意见完成插件修改 - Complete plugin modification according to review opinions

## [0.0.2] - 2023-08-07
### Changed
- 更新插件 id ，为发布做准备 - Update plugin id for release

## [0.0.1] - 2023-08-07
### Added
- 初步完成了主要功能模块 - Primary function modules completed
### Changed  
- 优化了用户体验 - Optimized user experience
### Fixed
- 修复插入自动编号后光标位移的bug - Fixed cursor displacement bug after inserting automatic numbering

## [0.0.0] - 2023-07-01 
### Added
- 创建了项目,初始化了仓库 - Created project and initialized repository
