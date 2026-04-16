export interface DocumentationOptions {
    outputDir: string;
    format: 'markdown' | 'html' | 'json';
    template?: string;
}
export declare class DocumentationGenerator {
    private supportedExtensions;
    generate(sourcePath: string, options: DocumentationOptions): Promise<void>;
    private getSourceFiles;
    private extractAPIDocs;
    private parseFileForAPI;
    private extractJSDoc;
    private extractFunctionDescription;
    private extractParameters;
    private extractReturnType;
    private extractVariableDescription;
    private generateDocumentation;
    private generateMarkdownDocs;
    private generateMarkdownIndex;
    private generateMarkdownAPIReference;
    private generateHTMLDocs;
    private generateHTMLItem;
    private generateHTMLParams;
    private generateJSONDocs;
    private groupDocsByFile;
    private generateMarkdownFileReference;
    private generateMarkdownDoc;
}
//# sourceMappingURL=DocumentationGenerator.d.ts.map