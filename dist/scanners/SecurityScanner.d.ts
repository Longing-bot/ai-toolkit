export interface SecurityOptions {
    severity: 'high' | 'medium' | 'low';
    autoFix: boolean;
}
export interface SecurityIssue {
    file: string;
    line: number;
    column: number;
    ruleId: string;
    title: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    category: string;
    cwe?: string;
    remediation?: string;
    code?: string;
}
export interface ScanResult {
    issues: SecurityIssue[];
    summary: {
        total: number;
        critical: number;
        high: number;
        medium: number;
        low: number;
        filesScanned: number;
    };
    recommendations: string[];
}
export declare class SecurityScanner {
    private rules;
    scan(projectPath: string, options: SecurityOptions): Promise<ScanResult>;
    private getProjectFiles;
    private scanFile;
    private findLineNumber;
    private extractCodeSnippet;
    private filterBySeverity;
    private generateSummary;
    private generateRecommendations;
    private getRemediation;
    toString(): string;
}
//# sourceMappingURL=SecurityScanner.d.ts.map