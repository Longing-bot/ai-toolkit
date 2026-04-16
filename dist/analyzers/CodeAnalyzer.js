"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeAnalyzer = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const glob = __importStar(require("glob"));
const chalk_1 = __importDefault(require("chalk"));
class CodeAnalyzer {
    constructor() {
        this.supportedExtensions = ['.ts', '.js', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c'];
    }
    async analyze(projectPath, options) {
        console.log(chalk_1.default.gray('📊 Starting code analysis...'));
        const files = await this.getProjectFiles(projectPath);
        const results = {
            filesAnalyzed: 0,
            totalLines: 0,
            averageComplexity: 0,
            coverage: 0,
            issues: [],
            suggestions: [],
            score: 100
        };
        let totalComplexity = 0;
        for (const file of files) {
            try {
                const fileResult = await this.analyzeFile(file);
                results.filesAnalyzed++;
                results.totalLines += fileResult.lines;
                totalComplexity += fileResult.complexity;
                results.issues.push(...fileResult.issues);
                // Calculate coverage if available
                if (fileResult.coverage !== undefined) {
                    results.coverage = Math.max(results.coverage, fileResult.coverage);
                }
            }
            catch (error) {
                console.warn(chalk_1.default.yellow(`⚠️  Error analyzing ${file}: ${error.message}`));
            }
        }
        results.averageComplexity = results.filesAnalyzed > 0 ? totalComplexity / results.filesAnalyzed : 0;
        results.score = this.calculateScore(results);
        // Generate suggestions
        results.suggestions = this.generateSuggestions(results);
        return results;
    }
    async getProjectFiles(projectPath) {
        const files = [];
        for (const ext of this.supportedExtensions) {
            const pattern = path.join(projectPath, '**/*' + ext);
            const matchingFiles = glob.sync(pattern, {
                ignore: ['**/node_modules/**', '**/*.test.*', '**/__tests__/**']
            });
            files.push(...matchingFiles);
        }
        return files.filter(fs.existsSync);
    }
    async analyzeFile(filePath) {
        const content = await fs.readFile(filePath, 'utf8');
        const lines = content.split('\n');
        const issues = [];
        // Basic analysis patterns
        this.analyzeComplexity(content, filePath, issues);
        this.analyzeNamingConventions(content, filePath, issues);
        this.analyzeComments(content, filePath, issues);
        this.analyzeImports(content, filePath, issues);
        const complexity = this.calculateCyclomaticComplexity(content);
        const coverage = this.estimateTestCoverage(filePath);
        return {
            file: filePath,
            lines: lines.length,
            complexity,
            coverage,
            issues
        };
    }
    analyzeComplexity(content, filePath, issues) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const lines = content.split('\n');
        lines.forEach((line, index) => {
            const lineNumber = index + 1;
            // Check for nested blocks
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const braceCount = (line.match(/{/g) || []).length;
            const nestedBlocks = (line.match(/[{}]\s*{/g) || []).length;
            if (nestedBlocks > 2) {
                issues.push({
                    file: filePath,
                    line: lineNumber,
                    column: 1,
                    type: 'warning',
                    message: `High nesting level detected (${nestedBlocks} levels)`,
                    severity: 'medium'
                });
            }
            // Check for long functions
            if (line.includes('function') && line.length > 100) {
                issues.push({
                    file: filePath,
                    line: lineNumber,
                    column: 1,
                    type: 'info',
                    message: 'Consider breaking down large function declarations',
                    severity: 'low'
                });
            }
        });
    }
    analyzeNamingConventions(content, filePath, issues) {
        const lines = content.split('\n');
        lines.forEach((line, index) => {
            const lineNumber = index + 1;
            // Check for camelCase variables
            const variableMatches = line.match(/\b[a-z][a-zA-Z0-9]*\s*[=:]/g);
            if (variableMatches) {
                variableMatches.forEach(match => {
                    if (!match.includes('this.') && !match.includes('import')) {
                        issues.push({
                            file: filePath,
                            line: lineNumber,
                            column: 1,
                            type: 'info',
                            message: `Consider using descriptive variable names`,
                            severity: 'low'
                        });
                    }
                });
            }
            // Check for magic numbers
            const magicNumberMatches = line.match(/\b\d{3,}\b/g);
            magicNumberMatches?.forEach(match => {
                issues.push({
                    file: filePath,
                    line: lineNumber,
                    column: 1,
                    type: 'warning',
                    message: `Magic number detected: ${match}`,
                    severity: 'medium'
                });
            });
        });
    }
    analyzeComments(content, filePath, issues) {
        const commentRatio = this.calculateCommentRatio(content);
        if (commentRatio < 0.1) {
            issues.push({
                file: filePath,
                line: 1,
                column: 1,
                type: 'info',
                message: `Low comment ratio (${(commentRatio * 100).toFixed(1)}%)`,
                severity: 'low'
            });
        }
        // Check for TODO comments
        if (content.includes('// TODO') || content.includes('# TODO')) {
            issues.push({
                file: filePath,
                line: 1,
                column: 1,
                type: 'info',
                message: 'TODO comments found - consider addressing them',
                severity: 'low'
            });
        }
    }
    analyzeImports(content, filePath, issues) {
        // Check for unused imports (basic detection)
        const importRegex = /(?:import|require)\s*(?:\{[^}]*\}|\*)?\s*from\s*['"]([^'"]+)['"]/g;
        const matches = [...content.matchAll(importRegex)];
        matches.forEach(match => {
            const importPath = match[1];
            if (importPath.startsWith('.') && !content.includes(importPath.replace(/\.[^.]+$/, ''))) {
                issues.push({
                    file: filePath,
                    line: match.index + 1,
                    column: 1,
                    type: 'warning',
                    message: `Potential unused import: ${importPath}`,
                    severity: 'medium'
                });
            }
        });
    }
    calculateCyclomaticComplexity(content) {
        // Count decision points
        const conditions = [
            /\bif\b/g,
            /\belse\b/g,
            /\bwhile\b/g,
            /\bfor\b/g,
            /\bswitch\b/g,
            /&&/g,
            /\|\|/g
        ];
        let complexity = 1; // Base complexity
        conditions.forEach(condition => {
            const matches = content.match(condition);
            if (matches) {
                complexity += matches.length;
            }
        });
        return complexity;
    }
    estimateTestCoverage(filePath) {
        // Simple heuristic based on file location and naming
        const fileName = path.basename(filePath);
        const isTestFile = fileName.includes('test') || fileName.includes('spec');
        if (isTestFile) {
            return 85; // Assume test files have good coverage
        }
        // Check if corresponding test file exists
        const baseName = path.basename(filePath, path.extname(filePath));
        const testFileName = `${baseName}.test${path.extname(filePath)}`;
        const testFilePath = path.join(path.dirname(filePath), testFileName);
        return fs.existsSync(testFilePath) ? 75 : 40;
    }
    calculateCommentRatio(content) {
        const lines = content.split('\n');
        const commentLines = lines.filter(line => line.trim().startsWith('//') ||
            line.trim().startsWith('#') ||
            line.trim().startsWith('/*') ||
            line.trim().startsWith('*') ||
            line.trim().startsWith('"""') ||
            line.trim().startsWith("'''"));
        return lines.length > 0 ? commentLines.length / lines.length : 0;
    }
    calculateScore(result) {
        let score = 100;
        // Deduct points for issues
        result.issues.forEach(issue => {
            switch (issue.severity) {
                case 'high':
                    score -= 10;
                    break;
                case 'medium':
                    score -= 5;
                    break;
                case 'low':
                    score -= 2;
                    break;
            }
        });
        // Deduct points for low coverage
        if (result.coverage < 80) {
            score -= (80 - result.coverage) * 0.5;
        }
        // Deduct points for high complexity
        if (result.averageComplexity > 10) {
            score -= (result.averageComplexity - 10) * 2;
        }
        return Math.max(0, Math.round(score));
    }
    generateSuggestions(result) {
        const suggestions = [];
        if (result.averageComplexity > 15) {
            suggestions.push('Consider refactoring complex functions to reduce cyclomatic complexity');
        }
        if (result.coverage < 80) {
            suggestions.push('Increase test coverage to improve code reliability');
        }
        if (result.issues.filter(i => i.type === 'warning').length > 10) {
            suggestions.push('Address warning-level issues to improve code quality');
        }
        if (result.suggestions.length === 0) {
            suggestions.push('Great job! No major issues detected.');
        }
        return suggestions;
    }
    toString() {
        // This will be implemented by the calling code
        return '';
    }
}
exports.CodeAnalyzer = CodeAnalyzer;
//# sourceMappingURL=CodeAnalyzer.js.map