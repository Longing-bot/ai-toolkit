export interface AnalysisOptions {
    format: 'json' | 'text' | 'html';
    complexityThreshold: number;
    includeDependencies: boolean;
}
export interface AnalysisResult {
    filesAnalyzed: number;
    totalLines: number;
    averageComplexity: number;
    coverage: number;
    issues: CodeIssue[];
    suggestions: string[];
    score: number;
}
export interface CodeIssue {
    file: string;
    line: number;
    column: number;
    type: 'error' | 'warning' | 'info';
    message: string;
    severity: 'high' | 'medium' | 'low';
}
export declare class CodeAnalyzer {
    private supportedExtensions;
    analyze(projectPath: string, options: AnalysisOptions): Promise<AnalysisResult>;
    private getProjectFiles;
    private analyzeFile;
    private analyzeComplexity;
    private analyzeNamingConventions;
    private analyzeComments;
    private analyzeImports;
    private calculateCyclomaticComplexity;
    private estimateTestCoverage;
    private calculateCommentRatio;
    private calculateScore;
    private generateSuggestions;
    toString(): string;
}
//# sourceMappingURL=CodeAnalyzer.d.ts.map