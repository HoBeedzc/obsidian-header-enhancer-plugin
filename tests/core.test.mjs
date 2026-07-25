import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";

const result = await build({
	entryPoints: ["src/core.ts"],
	bundle: true,
	format: "esm",
	platform: "node",
	write: false,
	logLevel: "silent",
});
const source = result.outputFiles[0].text;
const core = await import(
	`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
);

test("updates an existing heading number with a space separator", () => {
	assert.equal(core.setHeaderNumber("# 2 Header Two", "3", " "), "# 3 Header Two");
});

test("updates an existing heading number with a tab separator", () => {
	assert.equal(
		core.setHeaderNumber("## 1.2\tSub-header two", "1.3", "\t"),
		"## 1.3\tSub-header two"
	);
});

test("supports every configured number separator with a space header separator", () => {
	for (const separator of [".", ",", "-", "/"]) {
		const currentNumber = `1${separator}2`;
		const nextNumber = `1${separator}3`;
		const heading = `## ${currentNumber} Sub-header two`;

		assert.equal(core.isNeedInsertNumber(heading, " "), false);
		assert.equal(core.isNeedUpdateNumber(nextNumber, heading, " "), true);
		assert.equal(
			core.setHeaderNumber(heading, nextNumber, " "),
			`## ${nextNumber} Sub-header two`
		);
	}
});

test("preserves heading text and its internal whitespace while renumbering", () => {
	assert.equal(
		core.setHeaderNumber("## 1.2 A  heading with spaces", "1.3", " "),
		"## 1.3 A  heading with spaces"
	);
});

test("adds a number to an unnumbered heading", () => {
	assert.equal(core.setHeaderNumber("## New heading", "1.2", " "), "## 1.2 New heading");
});

test("renumbers headings after inserting a heading in the middle", () => {
	const headings = [
		["# 1 Header One", 1],
		["## 1.1 Sub-header one", 2],
		["## New sub-header", 2],
		["## 1.2 Sub-header two", 2],
		["# 2 Header Two", 1],
	];
	let numbers = [0];

	const result = headings.map(([heading, level]) => {
		numbers = core.getNextNumber(numbers, level);
		return core.setHeaderNumber(heading, numbers.join("."), " ");
	});

	assert.deepEqual(result, [
		"# 1 Header One",
		"## 1.1 Sub-header one",
		"## 1.2 New sub-header",
		"## 1.3 Sub-header two",
		"# 2 Header Two",
	]);
});
