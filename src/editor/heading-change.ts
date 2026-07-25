import type { ChangeDesc, EditorSelection, Text, Transaction } from "@codemirror/state";

import { isHeader } from "../core";

export const HEADER_ENHANCER_USER_EVENT = "HeaderEnhancer.changeAutoNumbering";

export function isTrackedDocumentChange(transaction: Transaction): boolean {
	return transaction.docChanged &&
		!transaction.isUserEvent(HEADER_ENHANCER_USER_EVENT);
}

export class HeadingChangeTracker {
	private dirtyLinePositions = new Set<number>();

	applyChanges(startDoc: Text, doc: Text, changes: ChangeDesc): void {
		this.dirtyLinePositions = new Set(
			Array.from(this.dirtyLinePositions, (position) => changes.mapPos(position, 1))
		);

		changes.iterChangedRanges((fromA, toA, fromB, toB) => {
			this.addHeadingLines(startDoc, fromA, toA, (position) =>
				changes.mapPos(position, 1)
			);
			this.addHeadingLines(doc, fromB, toB, (position) => position);
		});
	}

	clear(): void {
		this.dirtyLinePositions.clear();
	}

	consume(): boolean {
		if (this.dirtyLinePositions.size === 0) {
			return false;
		}

		this.clear();
		return true;
	}

	hasSelectionOnDirtyLine(doc: Text, selection: EditorSelection): boolean {
		return this.dirtyLinePositions.size > 0 &&
			this.selectionTouchesDirtyLine(doc, selection);
	}

	consumeIfSelectionLeft(doc: Text, selection: EditorSelection): boolean {
		if (this.dirtyLinePositions.size === 0 || this.hasSelectionOnDirtyLine(doc, selection)) {
			return false;
		}

		return this.consume();
	}

	private addHeadingLines(
		doc: Text,
		from: number,
		to: number,
		mapPosition: (position: number) => number
	): void {
		const startLine = doc.lineAt(Math.min(from, doc.length)).number;
		const endLine = doc.lineAt(Math.min(to, doc.length)).number;

		for (let lineNumber = startLine; lineNumber <= endLine; lineNumber++) {
			const line = doc.line(lineNumber);
			if (isHeader(line.text)) {
				this.dirtyLinePositions.add(mapPosition(line.from));
			}
		}
	}

	private selectionTouchesDirtyLine(doc: Text, selection: EditorSelection): boolean {
		const dirtyLineNumbers = new Set(
			Array.from(this.dirtyLinePositions, (position) => doc.lineAt(position).number)
		);

		return selection.ranges.some((range) => {
			const fromLine = doc.lineAt(range.from).number;
			const toLine = doc.lineAt(range.to).number;
			return Array.from(dirtyLineNumbers).some(
				(lineNumber) => lineNumber >= fromLine && lineNumber <= toLine
			);
		});
	}
}
