import type { HeaderEnhancerSettings } from "../setting";

/**
 * Manages runtime CSS variables for user-configurable font settings.
 * Static plugin styles live in styles.css so Obsidian can load them directly.
 */
export class StyleManager {
	constructor(private settings: HeaderEnhancerSettings) {}

	applyCSSStyles(): void {
		this.applyHeaderFontStyles();
		this.applyTitleFontStyles();
	}

	removeCSSStyles(): void {
		this.removeHeaderFontStyles();
		this.removeTitleFontStyles();
	}

	applyHeaderFontStyles(): void {
		const hasHeaderFontFamily = this.settings.isSeparateHeaderFont &&
			this.settings.headerFontFamily &&
			this.settings.headerFontFamily !== "inherit";
		const hasHeaderFontSize = this.settings.isSeparateHeaderFont &&
			this.settings.headerFontSize &&
			this.settings.headerFontSize !== "inherit";

		activeDocument.body.toggleClass("header-enhancer-custom-header-font-family", hasHeaderFontFamily);
		activeDocument.body.toggleClass("header-enhancer-custom-header-font-size", hasHeaderFontSize);
		this.setBodyCssVariable(
			"--header-enhancer-header-font-family",
			hasHeaderFontFamily ? this.settings.headerFontFamily : ""
		);
		this.setBodyCssVariable(
			"--header-enhancer-header-font-size",
			hasHeaderFontSize ? this.settings.headerFontSize : ""
		);
	}

	applyTitleFontStyles(): void {
		const hasTitleFontFamily = this.settings.isSeparateTitleFont &&
			this.settings.titleFontFamily &&
			this.settings.titleFontFamily !== "inherit";
		const hasTitleFontSize = this.settings.isSeparateTitleFont &&
			this.settings.titleFontSize &&
			this.settings.titleFontSize !== "inherit";

		activeDocument.body.toggleClass("header-enhancer-custom-title-font-family", hasTitleFontFamily);
		activeDocument.body.toggleClass("header-enhancer-custom-title-font-size", hasTitleFontSize);
		this.setBodyCssVariable(
			"--header-enhancer-title-font-family",
			hasTitleFontFamily ? this.settings.titleFontFamily : ""
		);
		this.setBodyCssVariable(
			"--header-enhancer-title-font-size",
			hasTitleFontSize ? this.settings.titleFontSize : ""
		);
	}

	removeHeaderFontStyles(): void {
		activeDocument.body.removeClass("header-enhancer-custom-header-font-family");
		activeDocument.body.removeClass("header-enhancer-custom-header-font-size");
		this.setBodyCssVariable("--header-enhancer-header-font-family", "");
		this.setBodyCssVariable("--header-enhancer-header-font-size", "");
	}

	removeTitleFontStyles(): void {
		activeDocument.body.removeClass("header-enhancer-custom-title-font-family");
		activeDocument.body.removeClass("header-enhancer-custom-title-font-size");
		this.setBodyCssVariable("--header-enhancer-title-font-family", "");
		this.setBodyCssVariable("--header-enhancer-title-font-size", "");
	}

	updateSettings(newSettings: HeaderEnhancerSettings): void {
		this.settings = newSettings;
	}

	private setBodyCssVariable(name: string, value: string): void {
		activeDocument.body.setCssProps({ [name]: value || "inherit" });
	}
}
