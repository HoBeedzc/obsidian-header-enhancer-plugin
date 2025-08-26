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

							// 只有在标题行并且自动编号开启时才进行处理
							if (!isHeader(currentLine.text) || this.plugin.settings.autoNumberingMode === AutoNumberingMode.OFF) {
								return false; // 不处理，让默认处理程序处理
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
		
		// 注意：这个检查已经在外层run函数做过了，这里可以简化
		// 但保留这个检查作为额外的安全措施
		if (!isHeader(currentLine.text) || this.plugin.settings.autoNumberingMode !== AutoNumberingMode.ON) {
			return false;
		}
	
		const editor = activeView.editor;
		const config = getAutoNumberingConfig(this.plugin.settings, editor);
		
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
		if (config.state) {
			// 使用setTimeout确保编辑操作已完成
			setTimeout(async () => {
				await this.plugin.handleAddHeaderNumber(activeView);
			}, 10);
		}
		
		return true;
	}

	/**
	 * 处理 Backspace 键按下事件
	 */
	handlePressBackspace(view: EditorView): boolean {
		let state = view.state;
		let doc = state.doc;
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
			// some header may be deleted, so we need to recalculate the number
			// TODO: feature
		}

		view.dispatch({
			changes,
			selection: { anchor: pos - 1 },
			userEvent: "HeaderEnhancer.changeAutoNumbering",
		});

		return true;
	}
}