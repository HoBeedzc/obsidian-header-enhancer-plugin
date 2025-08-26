import type { HeaderEnhancerSettings } from "../setting";

/**
 * Manages all CSS styles for the plugin, including header fonts, document title fonts, and dialog styles
 */
export class StyleManager {
	private headerFontStyleEl: HTMLStyleElement | null = null;
	private titleFontStyleEl: HTMLStyleElement | null = null;
	private dialogStyleEl: HTMLStyleElement | null = null;

	constructor(private settings: HeaderEnhancerSettings) {}

	/**
	 * Apply all CSS styles
	 */
	applyCSSStyles(): void {
		this.applyHeaderFontStyles();
		this.applyTitleFontStyles();
		this.applyDialogStyles();
	}

	/**
	 * Remove all CSS styles
	 */
	removeCSSStyles(): void {
		this.removeHeaderFontStyles();
		this.removeTitleFontStyles();
		this.removeDialogStyles();
	}

	/**
	 * Apply header font styles (# ## ### etc.)
	 */
	applyHeaderFontStyles(): void {
		// 先移除现有的标题字体样式
		this.removeHeaderFontStyles();
		
		if (!this.settings.isSeparateHeaderFont) {
			return;
		}

		// 创建标题字体样式元素
		this.headerFontStyleEl = document.createElement('style');
		this.headerFontStyleEl.id = 'header-enhancer-header-font-styles';

		let cssRules = '';
		
		// 生成所有标题级别的 CSS 选择器 (H1-H6)
		const headerSelectors = [
			'.markdown-preview-view h1',
			'.markdown-preview-view h2', 
			'.markdown-preview-view h3',
			'.markdown-preview-view h4',
			'.markdown-preview-view h5',
			'.markdown-preview-view h6',
			'.markdown-source-view.mod-cm6 .HyperMD-header-1',
			'.markdown-source-view.mod-cm6 .HyperMD-header-2',
			'.markdown-source-view.mod-cm6 .HyperMD-header-3',
			'.markdown-source-view.mod-cm6 .HyperMD-header-4',
			'.markdown-source-view.mod-cm6 .HyperMD-header-5',
			'.markdown-source-view.mod-cm6 .HyperMD-header-6'
		].join(', ');

		// 应用字体系列（如果设置了且不是继承）
		if (this.settings.headerFontFamily && this.settings.headerFontFamily !== 'inherit') {
			cssRules += `${headerSelectors} { font-family: ${this.settings.headerFontFamily} !important; }\n`;
		}

		// 应用字体大小（如果设置了且不是继承）
		if (this.settings.headerFontSize && this.settings.headerFontSize !== 'inherit') {
			cssRules += `${headerSelectors} { font-size: ${this.settings.headerFontSize} !important; }\n`;
		}

		// 设置 CSS 内容
		this.headerFontStyleEl.textContent = cssRules;
		
		// 添加到文档头部
		if (cssRules) {
			document.head.appendChild(this.headerFontStyleEl);
		}
	}

	/**
	 * 应用文档标题字体样式
	 */
	applyTitleFontStyles(): void {
		// 先移除现有的标题字体样式
		this.removeTitleFontStyles();
		
		if (!this.settings.isSeparateTitleFont) {
			return;
		}

		// 创建标题字体样式元素
		this.titleFontStyleEl = document.createElement('style');
		this.titleFontStyleEl.id = 'header-enhancer-title-font-styles';

		let cssRules = '';
		
		// 生成文档标题的 CSS 选择器 - 高度特定化的选择器
		const titleSelectors = [
			// 标签页中的文件标题 - 只针对特定的标签标题元素
			'.workspace-tab-header-inner-title',
			'.workspace-tab-header .workspace-tab-header-inner-title', 
			'.workspace-tabs .workspace-tab-header-inner-title',
			// 视图标题栏标题
			'.workspace-leaf-content .view-header-title',
			// 文档内联标题（在文档中显示的主标题）
			'.inline-title',
			'.markdown-preview-view .inline-title',
			'.markdown-source-view .inline-title',
			// 文件资源管理器中的文件标题
			'.nav-file-title-content',
			'.tree-item-inner.nav-file-title-content',
			// Frontmatter 标题显示
			'.frontmatter-container .metadata-property[data-property-key="title"] .metadata-property-value'
		].join(', ');

		// 应用字体系列（如果设置了且不是继承）
		if (this.settings.titleFontFamily && this.settings.titleFontFamily !== 'inherit') {
			cssRules += `${titleSelectors} { font-family: ${this.settings.titleFontFamily} !important; }\n`;
		}

		// 应用字体大小（如果设置了且不是继承）
		if (this.settings.titleFontSize && this.settings.titleFontSize !== 'inherit') {
			cssRules += `${titleSelectors} { font-size: ${this.settings.titleFontSize} !important; }\n`;
		}

		// 设置 CSS 内容
		this.titleFontStyleEl.textContent = cssRules;
		
		// 添加到文档头部
		if (cssRules) {
			document.head.appendChild(this.titleFontStyleEl);
		}
	}

	/**
	 * 应用对话框组件样式
	 */
	applyDialogStyles(): void {
		// 先移除现有的对话框样式
		this.removeDialogStyles();
		
		// 创建对话框样式元素
		this.dialogStyleEl = document.createElement('style');
		this.dialogStyleEl.id = 'header-enhancer-dialog-styles';
		
		// 对话框 CSS 内容
		const dialogCSS = `
/* Auto numbering dialog styles - shared between removal and activation */
.header-enhancer-removal-dialog,
.header-enhancer-activation-dialog {
    max-width: 500px;
}

.header-enhancer-removal-dialog .modal-title,
.header-enhancer-activation-dialog .modal-title {
    margin-bottom: 1em;
    padding-bottom: 0.5em;
    color: var(--text-accent);
    border-bottom: 1px solid var(--background-modifier-border);
}

.header-enhancer-removal-dialog .modal-message,
.header-enhancer-activation-dialog .modal-message {
    margin-bottom: 1.5em;
    line-height: 1.5;
    color: var(--text-normal);
}

.header-enhancer-removal-dialog .modal-actions,
.header-enhancer-activation-dialog .modal-actions {
    margin-top: 1em;
    padding-top: 1em;
    border-top: 1px solid var(--background-modifier-border);
}

.header-enhancer-removal-dialog .modal-actions .setting-item,
.header-enhancer-activation-dialog .modal-actions .setting-item {
    margin-bottom: 0.75em;
    padding: 0.75em;
    background-color: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 6px;
    transition: all 0.2s ease;
}

.header-enhancer-removal-dialog .modal-actions .setting-item:hover,
.header-enhancer-activation-dialog .modal-actions .setting-item:hover {
    background-color: var(--background-secondary-alt);
    border-color: var(--background-modifier-border-hover);
}

/* Warning and tip text styles */
.header-enhancer-removal-dialog .setting-item-warning,
.header-enhancer-removal-dialog .setting-item-tip,
.header-enhancer-activation-dialog .setting-item-warning,
.header-enhancer-activation-dialog .setting-item-tip {
    margin-top: 0.5em;
    font-size: 0.85em;
    line-height: 1.3;
}

.header-enhancer-removal-dialog .warning-label,
.header-enhancer-activation-dialog .warning-label {
    color: var(--text-error);
    font-weight: 600;
}

.header-enhancer-removal-dialog .warning-text,
.header-enhancer-removal-dialog .progress-text,
.header-enhancer-activation-dialog .warning-text,
.header-enhancer-activation-dialog .progress-text {
    color: var(--text-muted);
    margin: 0;
}

.header-enhancer-removal-dialog .manual-tip-text,
.header-enhancer-activation-dialog .manual-tip-text {
    color: var(--text-muted);
    font-style: italic;
}

.header-enhancer-removal-dialog .modal-cancel,
.header-enhancer-activation-dialog .modal-cancel {
    margin-top: 1em;
    padding-top: 1em;
    text-align: center;
    border-top: 1px solid var(--background-modifier-border-focus);
}

.header-enhancer-removal-dialog .progress-container,
.header-enhancer-activation-dialog .progress-container {
    margin-top: 1em;
    padding: 1em;
    background-color: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 6px;
    text-align: center;
}

.header-enhancer-removal-dialog .progress-text,
.header-enhancer-activation-dialog .progress-text {
    font-size: 0.9em;
}

.header-enhancer-removal-dialog button:disabled,
.header-enhancer-activation-dialog button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
		`;
		
		this.dialogStyleEl.textContent = dialogCSS;
		document.head.appendChild(this.dialogStyleEl);
	}

	/**
	 * 移除标题字体样式
	 */
	removeHeaderFontStyles(): void {
		if (this.headerFontStyleEl) {
			this.headerFontStyleEl.remove();
			this.headerFontStyleEl = null;
		}
	}

	/**
	 * 移除文档标题字体样式
	 */
	removeTitleFontStyles(): void {
		if (this.titleFontStyleEl) {
			this.titleFontStyleEl.remove();
			this.titleFontStyleEl = null;
		}
	}

	/**
	 * 移除对话框样式
	 */
	removeDialogStyles(): void {
		if (this.dialogStyleEl) {
			this.dialogStyleEl.remove();
			this.dialogStyleEl = null;
		}
	}

	/**
	 * 更新设置引用（当设置改变时调用）
	 */
	updateSettings(newSettings: HeaderEnhancerSettings): void {
		this.settings = newSettings;
	}
}