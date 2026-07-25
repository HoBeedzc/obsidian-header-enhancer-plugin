import assert from "node:assert/strict";
import test from "node:test";
import { EditorSelection, EditorState } from "@codemirror/state";
import { build } from "esbuild";

const result = await build({
	entryPoints: ["src/editor/heading-change.ts"],
	bundle: true,
	format: "esm",
	platform: "node",
	write: false,
	logLevel: "silent",
});
const source = result.outputFiles[0].text;
const headingChange = await import(
	`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
);

function applyChange(doc, changes, userEvent = "input.type") {
	const state = EditorState.create({ doc });
	const transaction = state.update({ changes, userEvent });
	return { state, transaction };
}

test("tracks a changed heading until the cursor leaves its line", () => {
	const tracker = new headingChange.HeadingChangeTracker();
	const { state, transaction } = applyChange(
		"# 1 Heading\nParagraph",
		{ from: 11, to: 11, insert: " updated" }
	);

	tracker.applyChanges(state.doc, transaction.state.doc, transaction.changes);
	assert.equal(
		tracker.hasSelectionOnDirtyLine(
			transaction.state.doc,
			EditorSelection.single(19)
		),
		true
	);
	assert.equal(
		tracker.consumeIfSelectionLeft(
			transaction.state.doc,
			EditorSelection.single(19)
		),
		false
	);
	assert.equal(
		tracker.consumeIfSelectionLeft(
			transaction.state.doc,
			EditorSelection.single(transaction.state.doc.length)
		),
		true
	);
});

test("tracks lines changed into or out of headings", () => {
	for (const [doc, changes] of [
		["Paragraph\nNext", { from: 0, to: 0, insert: "# " }],
		["# Heading\nNext", { from: 0, to: 2, insert: "" }],
	]) {
		const tracker = new headingChange.HeadingChangeTracker();
		const { state, transaction } = applyChange(doc, changes);
		tracker.applyChanges(state.doc, transaction.state.doc, transaction.changes);

		assert.equal(
			tracker.consumeIfSelectionLeft(
				transaction.state.doc,
				EditorSelection.single(transaction.state.doc.length)
			),
			true
		);
	}
});

test("does not track ordinary paragraph edits", () => {
	const tracker = new headingChange.HeadingChangeTracker();
	const { state, transaction } = applyChange(
		"Paragraph\nNext",
		{ from: 9, to: 9, insert: " updated" }
	);

	tracker.applyChanges(state.doc, transaction.state.doc, transaction.changes);
	assert.equal(
		tracker.consumeIfSelectionLeft(
			transaction.state.doc,
			EditorSelection.single(transaction.state.doc.length)
		),
		false
	);
});

test("consumes a changed heading when the editor loses focus", () => {
	const tracker = new headingChange.HeadingChangeTracker();
	const { state, transaction } = applyChange(
		"# Heading\nParagraph",
		{ from: 9, insert: " updated" }
	);

	tracker.applyChanges(state.doc, transaction.state.doc, transaction.changes);
	assert.equal(tracker.consume(), true);
	assert.equal(tracker.consume(), false);
});

test("tracks document edits and ignores plugin numbering transactions", () => {
	const state = EditorState.create({ doc: "# Heading" });
	const userTransaction = state.update({
		changes: { from: 9, insert: " updated" },
		userEvent: "input.type",
	});
	const programmaticTransaction = state.update({
		changes: { from: 9, insert: " updated" },
	});
	const pluginTransaction = state.update({
		changes: { from: 2, insert: "1 " },
		userEvent: headingChange.HEADER_ENHANCER_USER_EVENT,
	});

	assert.equal(headingChange.isTrackedDocumentChange(userTransaction), true);
	assert.equal(headingChange.isTrackedDocumentChange(programmaticTransaction), true);
	assert.equal(headingChange.isTrackedDocumentChange(pluginTransaction), false);
	assert.equal(
		headingChange.isTrackedDocumentChange(state.update({ selection: { anchor: 1 } })),
		false
	);
});

test("waits for every cursor to leave modified heading lines", () => {
	const tracker = new headingChange.HeadingChangeTracker();
	const state = EditorState.create({ doc: "# First\n# Second\nParagraph" });
	const transaction = state.update({
		changes: [
			{ from: 7, insert: " updated" },
			{ from: 16, insert: " updated" },
		],
		userEvent: "input.type",
	});

	tracker.applyChanges(state.doc, transaction.state.doc, transaction.changes);
	assert.equal(
		tracker.consumeIfSelectionLeft(
			transaction.state.doc,
			EditorSelection.create([
				EditorSelection.cursor(5),
				EditorSelection.cursor(25),
			])
		),
		false
	);
	assert.equal(
		tracker.consumeIfSelectionLeft(
			transaction.state.doc,
			EditorSelection.single(transaction.state.doc.length)
		),
		true
	);
});

test("keeps tracking a changed heading when earlier lines shift", () => {
	const tracker = new headingChange.HeadingChangeTracker();
	const initialState = EditorState.create({ doc: "# Heading\nParagraph" });
	const headingEdit = initialState.update({
		changes: { from: 9, insert: " updated" },
		userEvent: "input.type",
	});
	tracker.applyChanges(
		initialState.doc,
		headingEdit.state.doc,
		headingEdit.changes
	);

	const lineInsert = headingEdit.state.update({
		changes: { from: 0, insert: "Intro\n" },
		userEvent: "input.type",
	});
	tracker.applyChanges(
		headingEdit.state.doc,
		lineInsert.state.doc,
		lineInsert.changes
	);

	assert.equal(
		tracker.hasSelectionOnDirtyLine(
			lineInsert.state.doc,
			EditorSelection.single(12)
		),
		true
	);
	assert.equal(
		tracker.consumeIfSelectionLeft(
			lineInsert.state.doc,
			EditorSelection.single(lineInsert.state.doc.length)
		),
		true
	);
});
