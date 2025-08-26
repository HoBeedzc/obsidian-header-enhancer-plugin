# 更新记录 - Changelog

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