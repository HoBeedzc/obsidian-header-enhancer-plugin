import { HeaderLevelAnalysis, analyzeHeaderLevels } from './core';

export class HeaderAnalysisCache {
    private cache = new Map<string, {analysis: HeaderLevelAnalysis, timestamp: number}>();
    private readonly CACHE_DURATION = 5000; // 5秒缓存
    
    getAnalysis(filePath: string, content: string): HeaderLevelAnalysis {
        const cached = this.cache.get(filePath);
        const now = Date.now();
        
        if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
            return cached.analysis;
        }
        
        const analysis = analyzeHeaderLevels(content);
        this.cache.set(filePath, { analysis, timestamp: now });
        
        return analysis;
    }
    
    clearCache(): void {
        this.cache.clear();
    }

    // 清理过期缓存
    cleanExpiredCache(): void {
        const now = Date.now();
        for (const [key, cached] of this.cache.entries()) {
            if ((now - cached.timestamp) >= this.CACHE_DURATION) {
                this.cache.delete(key);
            }
        }
    }
}