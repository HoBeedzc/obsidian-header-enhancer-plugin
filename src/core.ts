export function getHeaderLevel(
	text: string,
	startHeaderLevel: number
): [number, number] {
	const match = text.match(/^#+/);
	if (!match) return [0, 0];
	let level = match ? match[0].length : 0;
	return [level - startHeaderLevel + 1, level];
}

export function getNextNumber(
	cntNums: number[],
	headerLevel: number
): number[] {
	let nextNums = [...cntNums];
	if (nextNums.length >= headerLevel) {
		nextNums = nextNums.slice(0, headerLevel);
		nextNums[nextNums.length - 1]++;
	} else {
		while (nextNums.length < headerLevel) {
			nextNums.push(1);
		}
	}
	return nextNums;
}

export function isNeedInsertNumber(text: string, splitor: string): boolean {
	// '## header' true
	// '## 1.1 splitor header' false
	if (splitor == " ") return text.split(splitor).length === 2;
	else return !text.contains(splitor);
}

export function isNeedUpdateNumber(
	nextNumsStr: string,
	text: string,
	splitor: string
): boolean {
	let cntNumsStr: string;
	if (splitor == " ") {
		cntNumsStr = text.split(splitor)[1];
	} else {
		cntNumsStr = text.split(splitor)[0].split(" ")[1];
	}
	return nextNumsStr !== cntNumsStr;
}

export function removeHeaderNumber(text: string, splitor: string): string {
	// remove '1.1 splitor' from '## 1.1 splitor text'
	let sharp: string, header: string;
	if (splitor == " ") {
		sharp = text.split(splitor)[0];
		header = text.split(splitor).slice(2).join(splitor);
	} else {
		if (!text.contains(splitor)) return text;
		sharp = text.split(splitor)[0].split(" ")[0];
		header = text.split(splitor)[1];
	}
	return sharp + " " + header;
}

export function isHeader(text: string): boolean {
	return /^#{1,6} .*/.test(text.trim());
}
