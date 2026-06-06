import { EditorView, keymap } from "@codemirror/view";
import { Prec, Extension } from "@codemirror/state";
import { MarkdownView } from "obsidian";
import { isHeader } from "../core";
import { getAutoNumberingConfig } from "../config";
import { AutoNumberingMode } from "../setting";
import type HeaderEnhancerPlugin from "../main";

/**
 * 处理编辑器相关的操作，包括按键处理和 CodeMirror 集成
 */
export class EditorHandlers {
	constructor(private plugin: HeaderEnhancerPlugin) {}

	/**
	 * 注册 CodeMirror 按键处理扩展
	 */
	registerKeyHandlers(): Extension[] {
		return [
			// Enter 键处理
			Prec.highest(
				keymap.of([
					{
						key: "Enter",
						run: (view: EditorView): boolean => {
							const state = view.state;
							const pos = state.selection.main.to;
							const currentLine = state.doc.lineAt(pos);

							// 只有在标题行时才考虑处理
							if (!isHeader(currentLine.text)) {
								return false; // 不是标题行，让默认处理程序处理
							}

							// 如果模式是 OFF，不处理
							if (this.plugin.settings.autoNumberingMode === AutoNumberingMode.OFF) {
								return false;
							}

							// 检查完整的配置状态（包括全局开关、文档级别开关、YAML配置）
							const app = this.plugin.app;
							const activeView = app.workspace.getActiveViewOfType(MarkdownView);
							if (activeView) {
								const editor = activeView.editor;
								const filePath = activeView.file?.path;
								const config = getAutoNumberingConfig(
									this.plugin.settings,
									editor,
									filePath ? (path: string) => this.plugin.getDocumentAutoNumberingState(path) : undefined,
									filePath
								);

								// 如果最终状态是关闭的（全局关闭、文档级别关闭、或YAML中state为off），
								// 不处理，让默认换行生效
								if (!config.state) {
									return false;
								}
							}

							// 执行自定义Enter处理 - 异步调用但不等待结果
							this.handlePressEnter(view);
							return true; // 表示我们已经处理了这个事件
						},
					},
				])
			),
			// Backspace 键处理
			Prec.highest(
				keymap.of([
					{
						key: "Backspace",
						run: (view: EditorView): boolean => {
							const state = view.state;
							if (!state.selection.main.empty) {
								return false;
							}
							const pos = state.selection.main.to;
                    		const currentLine = state.doc.lineAt(pos);
                    
                    		// 只有在标题行时才进行处理
                    		if (!isHeader(currentLine.text)) {
                        		return false; // 不处理，让默认处理程序处理
                    		}
                    
                    		return this.handlePressBackspace(view);
						},
					},
				])
			)
		];
	}

	/**
	 * 处理 Enter 键按下事件
	 */
	async handlePressEnter(view: EditorView): Promise<boolean> {
		let state = view.state;
		let doc = state.doc;
		const pos = state.selection.main.to;

		const app = this.plugin.app;
		const activeView = app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView) {
			return false; // 让默认处理程序处理
		}

		// 获取当前行信息
		const currentLine = doc.lineAt(pos);

		// 先获取配置（包括 YAML 配置和文档级状态）
		const editor = activeView.editor;
		const filePath = activeView.file?.path;
		const config = getAutoNumberingConfig(
			this.plugin.settings,
			editor,
			filePath ? (path: string) => this.plugin.getDocumentAutoNumberingState(path) : undefined,
			filePath
		);

		// 检查是否需要处理：必须是标题行且配置开启
		// config.state 会根据 autoNumberingMode (ON/OFF/YAML_CONTROLLED)、YAML 配置和文档级状态计算最终状态
		if (!isHeader(currentLine.text) || !config.state) {
			return false;
		}
		
		// 处理在标题中间按Enter的情况
		// 获取光标前后的文本
		const textBeforeCursor = currentLine.text.substring(0, pos - currentLine.from);
		const textAfterCursor = currentLine.text.substring(pos - currentLine.from);
		
		// 创建更改操作 - 直接替换整行，而不是分多次操作
		const changes = [{
			from: currentLine.from,
			to: currentLine.to,
			insert: textBeforeCursor + "\n" + textAfterCursor
		}];
		
		// 应用更改并设置光标位置
		view.dispatch({
			changes,
			selection: { anchor: currentLine.from + textBeforeCursor.length + 1 },
			userEvent: "HeaderEnhancer.changeAutoNumbering",
		});

		// 在操作完成后更新标题编号
		// 使用setTimeout确保编辑操作已完成
		setTimeout(async () => {
			await this.plugin.handleAddHeaderNumber(activeView);
			// 如果是自动检测模式，更新状态栏
			if (this.plugin.settings.isAutoDetectHeaderLevel) {
				this.plugin.handleShowStateBarChange();
			}
		}, 10);

		return true;
	}

	/**
	 * 处理 Backspace 键按下事件
	 */
	handlePressBackspace(view: EditorView): boolean {
		let state = view.state;
		let doc = state.doc;
		if (!state.selection.main.empty) {
			return false;
		}
		const pos = state.selection.main.to;
		const changes = [];

		if (!isHeader(doc.lineAt(pos).text)) {
			return false;
		}

		// insert a new line in current pos first
		changes.push({
			from: pos - 1,
			to: pos,
			insert: "",
		});

		if (this.plugin.settings.autoNumberingMode === AutoNumberingMode.ON) {
			// Note: Header deletion recalculation is not yet implemented
			// This would require analyzing all headers and renumbering them
		}

		view.dispatch({
			changes,
			selection: { anchor: pos - 1 },
			userEvent: "HeaderEnhancer.changeAutoNumbering",
		});

		return true;
	}
}
