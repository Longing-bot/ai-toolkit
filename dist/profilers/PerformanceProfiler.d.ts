export interface PerformanceOptions {
    metrics: string[];
    detailed: boolean;
}
export interface PerformanceMetric {
    name: string;
    value: number;
    unit: string;
    description: string;
    recommendation?: string;
}
export interface ProfilingResult {
    filesAnalyzed: number;
    totalComplexity: number;
    averageComplexity: number;
    memoryUsage: PerformanceMetric[];
    runtimeMetrics: PerformanceMetric[];
    complexityMetrics: PerformanceMetric[];
    recommendations: string[];
}
export declare class PerformanceProfiler {
    private supportedExtensions;
    profile(projectPath: string, options: PerformanceOptions): Promise<ProfilingResult>;
    private getProjectFiles;
    private analyzePerformance;
    private calculateCyclomaticComplexity;
    private analyzeComplexityPatterns;
    private analyzeMemoryPatterns;
    private analyzeRuntimePatterns;
    private calculateMaxNestingLevel;
    private generateMemoryMetrics;
    private generateRuntimeMetrics;
    private generateComplexityMetrics;
    private estimateHeapUsage;
    private generateRecommendations;
}
//# sourceMappingURL=PerformanceProfiler.d.ts.map