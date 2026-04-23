import { CodeAnalyzer, AnalysisResult } from '../analyzers/CodeAnalyzer';

describe('CodeAnalyzer', () => {
  let analyzer: CodeAnalyzer;

  beforeEach(() => {
    analyzer = new CodeAnalyzer();
  });

  describe('analyze', () => {
    it.skip('should analyze simple JavaScript code', async () => {
      const testDir = './test-project';
      const result = await analyzer.analyze(testDir, {
        format: 'json',
        complexityThreshold: 10,
        includeDependencies: false
      });

      expect(result).toBeDefined();
      expect(result.filesAnalyzed).toBeGreaterThanOrEqual(0);
      expect(result.totalLines).toBeGreaterThanOrEqual(0);
      expect(result.averageComplexity).toBeGreaterThanOrEqual(0);
      expect(result.coverage).toBeGreaterThanOrEqual(0);
      expect(result.issues).toBeInstanceOf(Array);
      expect(result.suggestions).toBeInstanceOf(Array);
      expect(typeof result.score).toBe('number');
    });

    it.skip('should handle empty directory gracefully', async () => {
      const emptyDir = './empty-test-dir';
      await require('fs-extra').ensureDir(emptyDir);

      const result = await analyzer.analyze(emptyDir, {
        format: 'text',
        complexityThreshold: 5,
        includeDependencies: true
      });

      expect(result.filesAnalyzed).toBe(0);
      expect(result.totalLines).toBe(0);
      expect(result.averageComplexity).toBe(0);
      expect(result.score).toBe(100); // Perfect score for no issues

      // Cleanup
      await require('fs-extra').remove(emptyDir);
    });
  });

  describe('complexity calculation', () => {
    it.skip('should correctly calculate cyclomatic complexity', () => {
      const simpleCode = `
        function add(a, b) {
          return a + b;
        }
      `;

      const complexCode = `
        function process(data) {
          if (data.isValid) {
            for (let i = 0; i < data.length; i++) {
              if (data.items[i].active && data.items[i].ready) {
                while (data.items[i].pending) {
                  data.items[i].process();
                }
              }
            }
          } else {
            console.error('Invalid data');
          }
        }
      `;

      const simpleComplexity = analyzer['calculateCyclomaticComplexity'](simpleCode);
      const complexComplexity = analyzer['calculateCyclomaticComplexity'](complexCode);

      expect(simpleComplexity).toBe(1); // Base complexity only
      expect(complexComplexity).toBeGreaterThan(simpleComplexity);
    });
  });

  describe('issue detection', () => {
    it.skip('should detect high nesting levels', () => {
      const nestedCode = `
        function deeplyNested() {
          if (condition1) {
            if (condition2) {
              if (condition3) {
                // ... and so on
              }
            }
          }
        }
      `;

      const issues = analyzer['analyzeComplexity'](nestedCode, 'test.js', []);
      expect(issues.some((issue: any) => issue.message.includes('nesting'))).toBe(true);
    });

    it.skip('should detect magic numbers', () => {
      const magicNumberCode = `
        function calculateTotal(items) {
          const taxRate = 0.08; // 8% tax - should be named constant
          const shippingCost = 5.99;
          return items * taxRate + shippingCost;
        }
      `;

      const issues = analyzer['analyzeNamingConventions'](magicNumberCode, 'test.js', []);
      expect(issues.some((issue: any) => issue.message.includes('Magic number'))).toBe(true);
    });
  });

  describe('score calculation', () => {
    it.skip('should calculate appropriate scores based on issues', () => {
      const result: AnalysisResult = {
        filesAnalyzed: 1,
        totalLines: 100,
        averageComplexity: 5,
        coverage: 80,
        issues: [
          { file: 'test.js', line: 1, column: 1, type: 'warning', message: 'Test warning', severity: 'low' },
          { file: 'test.js', line: 1, column: 1, type: 'error', message: 'Test error', severity: 'medium' }
        ],
        suggestions: ['Fix issues'],
        score: 100
      };

      const calculatedScore = analyzer['calculateScore'](result);
      expect(calculatedScore).toBeLessThanOrEqual(98); // Deducted for issues
      expect(calculatedScore).toBeGreaterThanOrEqual(0);
    });
  });
});