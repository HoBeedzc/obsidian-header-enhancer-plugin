export function getHeaderLevel(text: string): number {
    const match = text.match(/^#+/);
    return match ? match[0].length : 0;
}

export function getNextNumber(cntNums: number[], headerLevel: number): number[] {
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

export function isNeedInsertNumber(text: string): boolean {
    if (text.contains('\t')) return false; // '###\ttext
    return true;
}

export function isNeedUpdateNumber(nextNumsStr: string, text: string): boolean {
    let cntNumsStr = text.split('\t')[0].split(' ')[0];
    return nextNumsStr !== cntNumsStr;
}

export function removeHeaderNumber(text: string): string {
    // remove '1.1\t' from '## 1.1\ttext'
    const sharp = text.split('\t')[0].split(' ')[0];
    return sharp + ' ' + text.split('\t')[1];
}

export function isHeader(text: string): boolean {
    return /^#{1,6} .*/.test(text.trim());
}