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

export interface HeaderLevelAnalysis {
	minLevel: number;      // 文档中最高层级（数字最小的#，如H2=2）
	maxLevel: number;      // 文档中最低层级（数字最大的#，如H5=5）
	usedLevels: number[];  // 文档中实际使用的所有层级，如[2,3,5]
	isEmpty: boolean;      // 文档是否无标题
	headerCount: number;   // 标题总数
}

export function analyzeHeaderLevels(content: string): HeaderLevelAnalysis {
	const lines = content.split('\n');
	const usedLevels: Set<number> = new Set();
	let isCodeBlock = false;
	let headerCount = 0;
	
	for (const line of lines) {
		// 处理代码块（复用现有逻辑）
		if (line.startsWith("```")) {
			isCodeBlock = !isCodeBlock;
			if (line.slice(3).includes("```")) {
				isCodeBlock = !isCodeBlock;
			}
		}
		
		if (isCodeBlock) continue;
		
		if (isHeader(line)) {
			const match = line.match(/^#+/);
			if (match) {
				const level = match[0].length;
				usedLevels.add(level);
				headerCount++;
			}
		}
	}
	
	if (usedLevels.size === 0) {
		return { 
			minLevel: 0, 
			maxLevel: 0, 
			usedLevels: [], 
			isEmpty: true, 
			headerCount: 0 
		};
	}
	
	const levels = Array.from(usedLevels).sort((a, b) => a - b);
	
	// 特殊情况处理：只有一个层级的情况，允许扩展到更深层级
	if (levels.length === 1) {
		const singleLevel = levels[0];
		return {
			minLevel: singleLevel,
			maxLevel: Math.min(singleLevel + 2, 6), // 默认扩展2级，但不超过H6
			usedLevels: levels,
			isEmpty: false,
			headerCount
		};
	}
	
	return {
		minLevel: levels[0],
		maxLevel: levels[levels.length - 1],
		usedLevels: levels,
		isEmpty: false,
		headerCount
	};
}
