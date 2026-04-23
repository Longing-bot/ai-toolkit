"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentationGenerator = void 0;
const tslib_1 = require("tslib");
const fs = tslib_1.__importStar(require("fs-extra"));
const path = tslib_1.__importStar(require("path"));
const glob = tslib_1.__importStar(require("glob"));
const chalk_1 = tslib_1.__importDefault(require("chalk"));
class DocumentationGenerator {
    constructor() {
        Object.defineProperty(this, "supportedExtensions", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ['.ts', '.js', '.jsx', '.tsx']
        });
    }
    async generate(sourcePath, options) {
        console.log(chalk_1.default.gray('📚 Analyzing source code for documentation...'));
        const files = await this.getSourceFiles(sourcePath);
        const apiDocs = await this.extractAPIDocs(files);
        await this.generateDocumentation(apiDocs, options);
    }
    async getSourceFiles(sourcePath) {
        const files = [];
        for (const ext of this.supportedExtensions) {
            const pattern = path.join(sourcePath, '**/*' + ext);
            const matchingFiles = glob.sync(pattern, {
                ignore: ['**/node_modules/**', '**/*.test.*', '**/__tests__/**']
            });
            files.push(...matchingFiles);
        }
        return files.filter(fs.existsSync);
    }
    async extractAPIDocs(files) {
        const apiDocs = [];
        for (const file of files) {
            try {
                const content = await fs.readFile(file, 'utf8');
                const relativePath = path.relative(process.cwd(), file);
                const fileDocs = this.parseFileForAPI(content, relativePath);
                apiDocs.push(...fileDocs);
            }
            catch (error) {
                console.warn(chalk_1.default.yellow(`⚠️  Error parsing ${file}: ${error.message}`));
            }
        }
        return apiDocs;
    }
    parseFileForAPI(content, filePath) {
        const docs = [];
        const lines = content.split('\n');
        // Extract class definitions
        const classMatches = content.match(/export\s+class\s+(\w+)[^{]*{[^}]*}/g);
        if (classMatches) {
            classMatches.forEach(match => {
                const className = match.match(/export\s+class\s+(\w+)/)?.[1];
                if (className) {
                    docs.push({
                        type: 'class',
                        name: className,
                        filePath,
                        methods: [],
                        properties: [],
                        description: this.extractJSDoc(content, className)
                    });
                }
            });
        }
        // Extract function definitions
        const functionMatches = content.match(/(?:export\s+)?(?:(?:async\s+)?function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*[=>{])/g);
        if (functionMatches) {
            functionMatches.forEach(match => {
                let functionName = '';
                let isAsync = false;
                if (match.includes('async function')) {
                    functionName = match.match(/async\s+function\s+(\w+)/)?.[1] || '';
                    isAsync = true;
                }
                else if (match.includes('= async')) {
                    functionName = match.match(/const\s+(\w+)\s*=/)?.slice(1).find(Boolean) || '';
                    isAsync = true;
                }
                else if (match.includes('function')) {
                    functionName = match.match(/function\s+(\w+)/)?.[1] || '';
                }
                else {
                    functionName = match.match(/const\s+(\w+)\s*=/)?.[1] || '';
                }
                if (functionName && !docs.some(doc => doc.type === 'function' && doc.name === functionName)) {
                    docs.push({
                        type: 'function',
                        name: functionName,
                        filePath,
                        parameters: this.extractParameters(match),
                        returnType: this.extractReturnType(content, functionName),
                        description: this.extractFunctionDescription(content, functionName),
                        isAsync
                    });
                }
            });
        }
        // Extract variables with types
        const variableMatches = content.match(/export\s+(?:const|let|var)\s+(\w+)\s*:\s*([^;]+);/g);
        if (variableMatches) {
            variableMatches.forEach(match => {
                const varMatch = match.match(/export\s+(?:const|let|var)\s+(\w+)\s*:\s*([^;]+);/);
                if (varMatch) {
                    docs.push({
                        type: 'variable',
                        name: varMatch[1],
                        filePath,
                        type: varMatch[2].trim(),
                        description: this.extractVariableDescription(content, varMatch[1])
                    });
                }
            });
        }
        return docs;
    }
    extractJSDoc(content, identifier) {
        const jsdocRegex = /\/\*\*[\s\S]*?\*\/\s*(?:export\s+)?(?:class|interface|enum|type)\s+\w+/g;
        const matches = [...content.matchAll(jsdocRegex)];
        for (const match of matches) {
            const commentEnd = match.index;
            const commentStart = content.lastIndexOf('/**', commentEnd - 500);
            if (commentStart !== -1) {
                const jsdocContent = content.slice(commentStart, commentEnd + match[0].length);
                const description = jsdocContent.replace(/\/\*\*|\*\//g, '')
                    .replace(/^\s*\*\s?/gm, '')
                    .trim();
                if (description) {
                    return description;
                }
            }
        }
        return `Class ${identifier} - TODO: Add description`;
    }
    extractFunctionDescription(content, functionName) {
        const lines = content.split('\n');
        let inFunction = false;
        let description = '';
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.includes(`function ${functionName}`) || line.includes(`${functionName} = `)) {
                inFunction = true;
                // Look for JSDoc comments before the function
                for (let j = Math.max(0, i - 10); j < i; j++) {
                    if (lines[j].includes('/**') && lines[j].includes('*/')) {
                        description = lines[j].replace(/\/\*\*|\*\//g, '')
                            .replace(/^\s*\*\s?/gm, '')
                            .trim();
                        break;
                    }
                }
                break;
            }
        }
        return description || `Function ${functionName} - TODO: Add description`;
    }
    extractParameters(functionSignature) {
        const params = [];
        const paramMatch = functionSignature.match(/\(([^)]*)\)/);
        if (paramMatch) {
            const paramString = paramMatch[1];
            if (paramString.trim()) {
                const paramParts = paramString.split(',').map(p => p.trim());
                paramParts.forEach(part => {
                    const paramMatch = part.match(/(\w+)(?::\s*([^=]+))?(?:\s*=\s*.+)?/);
                    if (paramMatch) {
                        params.push({
                            name: paramMatch[1],
                            type: paramMatch[2]?.trim() || 'any',
                            required: !part.includes('=')
                        });
                    }
                });
            }
        }
        return params;
    }
    extractReturnType(content, functionName) {
        // Simple regex to find return type annotations
        const returnMatch = content.match(new RegExp(`${functionName}\\([^)]*\\)\\s*:\\s*(\\w+|\\[.*\\]|\\{.*\\}|Promise<.*>)`, 'g'));
        return returnMatch?.[0]?.match(/:\s*(\w+|\[.*\]|\{.*\}|Promise<.*>)/)?.[1] || 'void';
    }
    extractVariableDescription(content, variableName) {
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.includes(variableName) && line.includes(':')) {
                // Look for JSDoc comments above the variable
                for (let j = Math.max(0, i - 5); j < i; j++) {
                    if (lines[j].includes('/**') && lines[j].includes('*/')) {
                        return lines[j].replace(/\/\*\*|\*\//g, '')
                            .replace(/^\s*\*\s?/gm, '')
                            .trim();
                    }
                }
            }
        }
        return `Variable ${variableName} - TODO: Add description`;
    }
    async generateDocumentation(apiDocs, options) {
        await fs.ensureDir(options.outputDir);
        switch (options.format) {
            case 'markdown':
                await this.generateMarkdownDocs(apiDocs, options.outputDir);
                break;
            case 'html':
                await this.generateHTMLDocs(apiDocs, options.outputDir);
                break;
            case 'json':
                await this.generateJSONDocs(apiDocs, options.outputDir);
                break;
        }
    }
    async generateMarkdownDocs(apiDocs, outputDir) {
        const indexContent = this.generateMarkdownIndex(apiDocs);
        await fs.writeFile(path.join(outputDir, 'README.md'), indexContent);
        // Generate API reference
        const apiContent = this.generateMarkdownAPIReference(apiDocs);
        await fs.writeFile(path.join(outputDir, 'API.md'), apiContent);
        // Generate individual file documentation
        const filesByPath = this.groupDocsByFile(apiDocs);
        for (const [filePath, docs] of Object.entries(filesByPath)) {
            const fileName = path.basename(filePath, path.extname(filePath));
            const content = this.generateMarkdownFileReference(docs, filePath);
            await fs.writeFile(path.join(outputDir, `${fileName}.md`), content);
        }
    }
    generateMarkdownIndex(apiDocs) {
        const sections = {
            classes: apiDocs.filter(d => d.type === 'class'),
            functions: apiDocs.filter(d => d.type === 'function'),
            variables: apiDocs.filter(d => d.type === 'variable')
        };
        return `# API Documentation

Generated on ${new Date().toISOString()}

## Overview

This document provides comprehensive API documentation for the codebase.

### Classes (${sections.classes.length})
${sections.classes.map(c => `- [\`${c.name}\`](classes/${c.name}.md)`).join('\n')}

### Functions (${sections.functions.length})
${sections.functions.map(f => `- [\`${f.name}\`](functions/${f.name}.md)`).join('\n')}

### Variables (${sections.variables.length})
${sections.variables.map(v => `- [\`${v.name}\`](variables/${v.name}.md)`).join('\n')}
`;
    }
    generateMarkdownAPIReference(apiDocs) {
        const sections = {
            classes: apiDocs.filter(d => d.type === 'class'),
            functions: apiDocs.filter(d => d.type === 'function'),
            variables: apiDocs.filter(d => d.type === 'variable')
        };
        let content = '# API Reference\n\n';
        if (sections.classes.length > 0) {
            content += '## Classes\n\n';
            sections.classes.forEach(cls => {
                content += `### ${cls.name}\n\n`;
                content += `${cls.description}\n\n`;
                if (cls.methods.length > 0) {
                    content += '#### Methods\n\n';
                    cls.methods.forEach(method => {
                        content += `##### \`${method.name}()\`\n\n`;
                        content += `${method.description}\n\n`;
                        if (method.parameters.length > 0) {
                            content += '**Parameters:**\n';
                            method.parameters.forEach(param => {
                                content += `- \`${param.name}\` (${param.type})${param.required ? ' *required*' : ''}: ${param.description || 'No description'}\n`;
                            });
                            content += '\n';
                        }
                    });
                }
                content += '\n---\n\n';
            });
        }
        return content;
    }
    async generateHTMLDocs(apiDocs, outputDir) {
        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Documentation</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1, h2, h3 { color: #333; }
        .api-item { background: #f9f9f9; padding: 15px; margin: 10px 0; border-left: 4px solid #007acc; border-radius: 4px; }
        .code { background: #2d2d2d; color: #fff; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
        .parameter { margin: 5px 0; }
        .required { color: #d73a49; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <h1>API Documentation</h1>
        <p>Generated on ${new Date().toISOString()}</p>
        
        <h2>Classes</h2>
        ${apiDocs.filter(d => d.type === 'class').map(this.generateHTMLItem).join('\n')}
        
        <h2>Functions</h2>
        ${apiDocs.filter(d => d.type === 'function').map(this.generateHTMLItem).join('\n')}
        
        <h2>Variables</h2>
        ${apiDocs.filter(d => d.type === 'variable').map(this.generateHTMLItem).join('\n')}
    </div>
</body>
</html>`;
        await fs.writeFile(path.join(outputDir, 'index.html'), htmlContent);
    }
    generateHTMLItem(doc) {
        const itemClass = doc.type === 'class' ? 'class' : doc.type === 'function' ? 'function' : 'variable';
        return `<div class="api-item ${itemClass}">
        <h3><span class="code">${doc.name}</span></h3>
        <p>${doc.description}</p>
        ${this.generateHTMLParams(doc)}
    </div>`;
    }
    generateHTMLParams(doc) {
        if (!doc.parameters || doc.parameters.length === 0)
            return '';
        return `<div class="parameters">
        <h4>Parameters:</h4>
        ${doc.parameters.map(param => `<div class="parameter">\`${param.name}\` <span class="${param.required ? 'required' : ''}">${param.type}</span>: ${param.description || 'No description'}</div>`).join('\n        ')}
    </div>`;
    }
    async generateJSONDocs(apiDocs, outputDir) {
        const jsonData = {
            generatedAt: new Date().toISOString(),
            totalItems: apiDocs.length,
            classes: apiDocs.filter(d => d.type === 'class'),
            functions: apiDocs.filter(d => d.type === 'function'),
            variables: apiDocs.filter(d => d.type === 'variable')
        };
        await fs.writeFile(path.join(outputDir, 'api-docs.json'), JSON.stringify(jsonData, null, 2));
    }
    groupDocsByFile(apiDocs) {
        const grouped = {};
        apiDocs.forEach(doc => {
            if (!grouped[doc.filePath]) {
                grouped[doc.filePath] = [];
            }
            grouped[doc.filePath].push(doc);
        });
        return grouped;
    }
    generateMarkdownFileReference(docs, filePath) {
        const fileName = path.basename(filePath);
        const relativePath = path.relative(process.cwd(), filePath);
        return `# ${fileName}

**File Path:** \`${relativePath}\`

${docs.map(doc => this.generateMarkdownDoc(doc)).join('\n\n---\n\n')}
`;
    }
    generateMarkdownDoc(doc) {
        switch (doc.type) {
            case 'class':
                return `## Class: \`${doc.name}\`

${doc.description}

### Properties
${doc.properties?.map(prop => `- \`${prop.name}\`: ${prop.type}`).join('\n') || 'None documented'}

### Methods
${doc.methods?.map(method => `#### \`${method.name}()\`
  
${method.description}
  
**Parameters:**
${method.parameters?.map(p => `- \`${p.name}\` (${p.type})${p.required ? ' *required*' : ''}: ${p.description || 'No description'}`).join('\n') || 'None'}
`).join('\n') || 'None documented'}`;
            case 'function':
                return `## Function: \`${doc.name}()\`

${doc.description}

**Parameters:**
${doc.parameters?.map(p => `- \`${p.name}\` (${p.type})${p.required ? ' *required*' : ''}: ${p.description || 'No description'}`).join('\n') || 'None'}

**Returns:** \`${doc.returnType || 'void'}\``;
            case 'variable':
                return `## Variable: \`${doc.name}\`

${doc.description}

**Type:** \`${doc.type}\``;
            default:
                return `## ${doc.name}`;
        }
    }
}
exports.DocumentationGenerator = DocumentationGenerator;
//# sourceMappingURL=DocumentationGenerator.js.map