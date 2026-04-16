export interface TestOptions {
    framework: 'jest' | 'mocha' | 'vitest';
    type: 'unit' | 'integration' | 'e2e';
    coverage: boolean;
}
export declare class TestGenerator {
    private supportedExtensions;
    generateTests(sourcePath: string, options: TestOptions): Promise<void>;
    private getSourceFiles;
    private generateTestFiles;
    private generateTestForFile;
    private generateTestCode;
    private generateJestSetup;
    private generateMochaSetup;
    private generateVitestSetup;
    private generateClassTests;
    private generateFunctionTests;
    private generateExportTests;
    private generateBasicStructureTests;
    private addCoverageInstrumentation;
    private extractImports;
    private extractExports;
    private extractClasses;
    private extractFunctions;
    private extractMethodsFromContent;
    private extractPropertiesFromContent;
    private parseParameters;
    private toCamelCase;
    private getDefaultValue;
    private getExpectedType;
    private estimateCoverage;
}
//# sourceMappingURL=TestGenerator.d.ts.map