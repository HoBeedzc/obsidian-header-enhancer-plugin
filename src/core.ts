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
	// Extract the part after the # symbols
	const match = text.match(/^(#{1,6})\s+(.*)/);
	if (!match) return false;

	const contentAfterHash = match[2];

	if (splitor == " ") {
		// Check if content starts with a number pattern (e.g., "1.1 text" or "1 text")
		// Should return false if numbering exists, true if it doesn't
		return !/^\d+(?:\.\d+)*\s+/.test(contentAfterHash);
	} else {
		// For other splitors, check if the splitor exists in the content
		return !contentAfterHash.contains(splitor);
	}
}

export function isNeedUpdateNumber(
	nextNumsStr: string,
	text: string,
	splitor: string
): boolean {
	// Extract the part after the # symbols
	const match = text.match(/^(#{1,6})\s+(.*)/);
	if (!match) return false;

	const contentAfterHash = match[2];
	let cntNumsStr: string;

	if (splitor == " ") {
		// Extract the number pattern at the start (e.g., "1.1" from "1.1 header text")
		const numMatch = contentAfterHash.match(/^(\d+(?:\.\d+)*)\s+/);
		if (!numMatch) return true; // No number found, needs update
		cntNumsStr = numMatch[1];
	} else {
		// For other splitors, extract number before the splitor
		const parts = contentAfterHash.split(splitor);
		if (parts.length < 2) return true; // No splitor found, needs update
		cntNumsStr = parts[0].trim();
	}
	return nextNumsStr !== cntNumsStr;
}

export function removeHeaderNumber(text: string, splitor: string): string {
	// remove '1.1 splitor' from '## 1.1 splitor text'
	// Extract the # symbols and content
	const match = text.match(/^(#{1,6})\s+(.*)/);
	if (!match) return text;

	const sharp = match[1];
	const contentAfterHash = match[2];

	if (splitor == " ") {
		// Remove number pattern at the start (e.g., "1.1 " from "1.1 header text")
		const header = contentAfterHash.replace(/^\d+(?:\.\d+)*\s+/, '');
		return sharp + " " + header;
	} else {
		// For other splitors, remove everything before and including the first splitor
		if (!contentAfterHash.contains(splitor)) return text;
		const parts = contentAfterHash.split(splitor);
		const header = parts.slice(1).join(splitor).trim();
		return sharp + " " + header;
	}
}

export function isHeader(text: string): boolean {
	return /^#{1,6} .*/.test(text.trim());
}

export function updateCodeBlockState(line: string, isCodeBlock: boolean): boolean {
	const trimmedLine = line.trimStart();
	if (!trimmedLine.startsWith("```")) {
		return isCodeBlock;
	}

	isCodeBlock = !isCodeBlock;
	if (trimmedLine.slice(3).includes("```")) {
		isCodeBlock = !isCodeBlock;
	}
	return isCodeBlock;
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
		isCodeBlock = updateCodeBlockState(line, isCodeBlock);
		
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
