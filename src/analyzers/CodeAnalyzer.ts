import * as fs from 'fs-extra';
import * as path from 'path';
import * as glob from 'glob';
import chalk from 'chalk';

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

export class CodeAnalyzer {
  private supportedExtensions = ['.ts', '.js', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c'];

  async analyze(projectPath: string, options: AnalysisOptions): Promise<AnalysisResult> {
    console.log(chalk.gray('📊 Starting code analysis...'));

    const files = await this.getProjectFiles(projectPath);
    const results: AnalysisResult = {
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
      } catch (error: Error) {
        console.warn(chalk.yellow(`⚠️  Error analyzing ${file}: ${error.message}`));
      }
    }

    results.averageComplexity = results.filesAnalyzed > 0 ? totalComplexity / results.filesAnalyzed : 0;
    results.score = this.calculateScore(results);

    // Generate suggestions
    results.suggestions = this.generateSuggestions(results);

    return results;
  }

  private async getProjectFiles(projectPath: string): Promise<string[]> {
    const files: string[] = [];

    for (const ext of this.supportedExtensions) {
      const pattern = path.join(projectPath, '**/*' + ext);
      const matchingFiles = glob.sync(pattern, {
        ignore: ['**/node_modules/**', '**/*.test.*', '**/__tests__/**']
      });
      files.push(...matchingFiles);
    }

    return files.filter(fs.existsSync);
  }

  private async analyzeFile(filePath: string): Promise<FileAnalysisResult> {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    const issues: CodeIssue[] = [];

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

  private analyzeComplexity(content: string, filePath: string, issues: CodeIssue[]) {
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

  private analyzeNamingConventions(content: string, filePath: string, issues: CodeIssue[]) {
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

  private analyzeComments(content: string, filePath: string, issues: CodeIssue[]) {
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

  private analyzeImports(content: string, filePath: string, issues: CodeIssue[]) {
    // Check for unused imports (basic detection)
    const importRegex = /(?:import|require)\s*(?:\{[^}]*\}|\*)?\s*from\s*['"]([^'"]+)['"]/g;
    const matches = [...content.matchAll(importRegex)];

    matches.forEach(match => {
      const importPath = match[1];
      if (importPath.startsWith('.') && !content.includes(importPath.replace(/\.[^.]+$/, ''))) {
        issues.push({
          file: filePath,
          line: match.index! + 1,
          column: 1,
          type: 'warning',
          message: `Potential unused import: ${importPath}`,
          severity: 'medium'
        });
      }
    });
  }

  private calculateCyclomaticComplexity(content: string): number {
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

  private estimateTestCoverage(filePath: string): number {
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

  private calculateCommentRatio(content: string): number {
    const lines = content.split('\n');
    const commentLines = lines.filter(line =>
      line.trim().startsWith('//') ||
      line.trim().startsWith('#') ||
      line.trim().startsWith('/*') ||
      line.trim().startsWith('*') ||
      line.trim().startsWith('"""') ||
      line.trim().startsWith("'''")
    );

    return lines.length > 0 ? commentLines.length / lines.length : 0;
  }

  private calculateScore(result: AnalysisResult): number {
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

  private generateSuggestions(result: AnalysisResult): string[] {
    const suggestions: string[] = [];

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

  toString(): string {
    // This will be implemented by the calling code
    return '';
  }
}

interface FileAnalysisResult {
  file: string;
  lines: number;
  complexity: number;
  coverage: number;
  issues: CodeIssue[];
}