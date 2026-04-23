"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceProfiler = void 0;
const tslib_1 = require("tslib");
const fs = tslib_1.__importStar(require("fs-extra"));
const path = tslib_1.__importStar(require("path"));
const glob = tslib_1.__importStar(require("glob"));
const chalk_1 = tslib_1.__importDefault(require("chalk"));
class PerformanceProfiler {
    constructor() {
        Object.defineProperty(this, "supportedExtensions", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ['.ts', '.js', '.jsx', '.tsx']
        });
    }
    async profile(projectPath, options) {
        console.log(chalk_1.default.gray('⚡ Analyzing performance patterns...'));
        const files = await this.getProjectFiles(projectPath);
        const result = await this.analyzePerformance(files, options);
        return result;
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
    async analyzePerformance(files, options) {
        let totalComplexity = 0;
        const fileCount = files.length;
        // Analyze each file for performance characteristics
        for (const file of files) {
            try {
                const content = await fs.readFile(file, 'utf8');
                const complexity = this.calculateCyclomaticComplexity(content);
                totalComplexity += complexity;
                // Collect specific metrics based on options
                if (options.metrics.includes('complexity')) {
                    this.analyzeComplexityPatterns(content, file);
                }
                if (options.metrics.includes('memory')) {
                    this.analyzeMemoryPatterns(content, file);
                }
                if (options.metrics.includes('runtime')) {
                    this.analyzeRuntimePatterns(content, file);
                }
            }
            catch (error) {
                console.warn(chalk_1.default.yellow(`⚠️  Error analyzing ${file}: ${error.message}`));
            }
        }
        const averageComplexity = fileCount > 0 ? totalComplexity / fileCount : 0;
        return {
            filesAnalyzed: fileCount,
            totalComplexity,
            averageComplexity,
            memoryUsage: this.generateMemoryMetrics(files),
            runtimeMetrics: this.generateRuntimeMetrics(files),
            complexityMetrics: this.generateComplexityMetrics(averageComplexity),
            recommendations: this.generateRecommendations(totalComplexity, averageComplexity, fileCount)
        };
    }
    calculateCyclomaticComplexity(content) {
        // Count decision points that increase cyclomatic complexity
        const conditions = [
            /\bif\b/g,
            /\belse\b/g,
            /\bwhile\b/g,
            /\bfor\b/g,
            /\bswitch\b/g,
            /&&/g,
            /\|\|/g,
            /\?.*:/g, // ternary operators
            /catch\s*\(/g
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
    analyzeComplexityPatterns(content, filePath) {
        // Look for nested structures that might indicate high complexity
        const nestingLevels = this.calculateMaxNestingLevel(content);
        if (nestingLevels > 5) {
            console.log(chalk_1.default.yellow(`⚠️  High nesting level (${nestingLevels}) in ${filePath}`));
        }
    }
    analyzeMemoryPatterns(content, filePath) {
        // Detect potential memory leaks and inefficient patterns
        const largeArrays = (content.match(/const\s+\w+\s*=\s*\[[^\]]{100,}\]/g) || []).length;
        const deepRecursion = (content.match(/\bfunction\s+\w+\s*\([^)]*\)\s*{[\s\S]*?\bfunction\s+\w+\s*\([^)]*\)/g) || []).length;
        if (largeArrays > 0) {
            console.log(chalk_1.default.yellow(`⚠️  Large array initialization detected in ${filePath}`));
        }
        if (deepRecursion > 0) {
            console.log(chalk_1.default.yellow(`⚠️  Potential deep recursion detected in ${filePath}`));
        }
    }
    analyzeRuntimePatterns(content, filePath) {
        // Detect potentially slow operations
        const nestedLoops = (content.match(/\b(for|while)\b[^{]*\{[^{}]*(?:\{(?:[^{}]|\{[^{}]*\})*\})*[^}]*\}/g) || []).length;
        const expensiveOperations = (content.match(/\.(map|filter|reduce|forEach)\([^,]*,[^)]*\)/g) || []).length;
        if (nestedLoops > 2) {
            console.log(chalk_1.default.yellow(`⚠️  Multiple nested loops detected in ${filePath}`));
        }
        if (expensiveOperations > 3) {
            console.log(chalk_1.default.yellow(`⚠️  Multiple chained operations detected in ${filePath}`));
        }
    }
    calculateMaxNestingLevel(content) {
        let maxDepth = 0;
        let currentDepth = 0;
        for (const char of content) {
            if (char === '{') {
                currentDepth++;
                maxDepth = Math.max(maxDepth, currentDepth);
            }
            else if (char === '}') {
                currentDepth--;
            }
        }
        return maxDepth;
    }
    generateMemoryMetrics(files) {
        const metrics = [];
        // Estimate memory usage based on file sizes and patterns
        const totalSize = files.reduce((sum, file) => {
            try {
                const stats = fs.statSync(file);
                return sum + stats.size;
            }
            catch {
                return sum;
            }
        }, 0);
        metrics.push({
            name: 'Total Code Size',
            value: totalSize,
            unit: 'bytes',
            description: `Total size of analyzed source files`
        });
        // Estimate heap usage based on common patterns
        const estimatedHeap = this.estimateHeapUsage(files);
        metrics.push({
            name: 'Estimated Heap Usage',
            value: estimatedHeap,
            unit: 'MB',
            description: 'Estimated memory footprint during execution'
        });
        return metrics;
    }
    generateRuntimeMetrics(files) {
        const metrics = [];
        // Calculate estimated execution time based on complexity
        let totalComplexity = 0;
        files.forEach(file => {
            try {
                const content = fs.readFileSync(file, 'utf8');
                totalComplexity += this.calculateCyclomaticComplexity(content);
            }
            catch {
                // Ignore files that can't be read
            }
        });
        metrics.push({
            name: 'Cyclomatic Complexity',
            value: totalComplexity,
            unit: 'points',
            description: 'Sum of all decision points in the codebase'
        });
        metrics.push({
            name: 'Estimated Execution Time',
            value: totalComplexity * 0.1, // Rough estimate: 0.1ms per complexity point
            unit: 'ms',
            description: 'Estimated execution time for typical operations'
        });
        return metrics;
    }
    generateComplexityMetrics(averageComplexity) {
        const metrics = [];
        metrics.push({
            name: 'Average Complexity',
            value: averageComplexity,
            unit: 'points',
            description: 'Average cyclomatic complexity per function'
        });
        // Add complexity analysis
        if (averageComplexity < 5) {
            metrics.push({
                name: 'Complexity Rating',
                value: 90,
                unit: '%',
                description: 'Low complexity - excellent maintainability',
                recommendation: 'Continue following simple, readable coding practices'
            });
        }
        else if (averageComplexity < 10) {
            metrics.push({
                name: 'Complexity Rating',
                value: 70,
                unit: '%',
                description: 'Moderate complexity - good maintainability',
                recommendation: 'Consider breaking down complex functions when they exceed 10 complexity points'
            });
        }
        else {
            metrics.push({
                name: 'Complexity Rating',
                value: 40,
                unit: '%',
                description: 'High complexity - needs refactoring',
                recommendation: 'Refactor complex functions into smaller, more focused units'
            });
        }
        return metrics;
    }
    estimateHeapUsage(files) {
        // Rough estimation based on code patterns and file count
        let baseUsage = 0.1; // Base overhead
        files.forEach(file => {
            try {
                const content = fs.readFileSync(file, 'utf8');
                const lines = content.split('\n').length;
                const functions = (content.match(/function/g) || []).length;
                const classes = (content.match(/class/g) || []).length;
                // Estimate memory usage per file
                baseUsage += lines * 0.01; // ~10 bytes per line
                baseUsage += functions * 0.5; // ~500KB per function
                baseUsage += classes * 1.0; // ~1MB per class
            }
            catch {
                // Ignore unreadable files
            }
        });
        return Math.round(baseUsage * 100) / 100; // Round to 2 decimal places
    }
    generateRecommendations(totalComplexity, averageComplexity, fileCount) {
        const recommendations = [];
        // Complexity-based recommendations
        if (averageComplexity > 10) {
            recommendations.push('Refactor functions with high cyclomatic complexity (>10) into smaller units');
            recommendations.push('Consider using design patterns to simplify complex logic flows');
        }
        if (averageComplexity > 15) {
            recommendations.push('Critical: Several functions have very high complexity - immediate refactoring recommended');
        }
        // File organization recommendations
        if (fileCount > 50) {
            recommendations.push('Large number of files detected - consider organizing code into logical modules');
        }
        // Memory optimization recommendations
        recommendations.push('Use lazy loading for large datasets to reduce initial memory footprint');
        recommendations.push('Consider implementing caching strategies for frequently accessed data');
        // Runtime optimization recommendations
        recommendations.push('Profile actual performance bottlenecks before optimizing - focus on hot paths');
        recommendations.push('Use efficient data structures (e.g., Maps instead of Objects for frequent lookups)');
        // General best practices
        recommendations.push('Implement proper error handling to prevent performance degradation');
        recommendations.push('Consider asynchronous processing for CPU-intensive operations');
        return recommendations;
    }
}
exports.PerformanceProfiler = PerformanceProfiler;
//# sourceMappingURL=PerformanceProfiler.js.map