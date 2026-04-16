import { PerformanceProfiler, ProfilingResult } from '../profilers/PerformanceProfiler';

describe('PerformanceProfiler', () => {
  let profiler: PerformanceProfiler;

  beforeEach(() => {
    profiler = new PerformanceProfiler();
  });

  describe('profile', () => {
    it('should analyze performance of TypeScript files', async () => {
      const testDir = './test-performance';
      await require('fs-extra').ensureDir(testDir);

      // Create a complex TypeScript file
      const complexCode = `
        export class DataProcessor {
          private cache: Map<string, any> = new Map();

          processLargeDataset(data: any[]): any[] {
            if (!data || data.length === 0) {
              return [];
            }

            const result: any[] = [];
            for (let i = 0; i < data.length; i++) {
              if (data[i].isValid && data[i].active) {
                while (this.cache.has(data[i].id)) {
                  const cached = this.cache.get(data[i].id);
                  if (cached.pending) {
                    result.push(this.processItem(cached));
                  }
                }
              }
            }

            return result;
          }

          private processItem(item: any): any {
            switch (item.type) {
              case 'A':
                return item.value * 2;
              case 'B':
                return item.value + 10;
              default:
                return item.value;
            }
          }
        }

        export function expensiveCalculation(items: any[]): number {
          let total = 0;
          items.forEach((item, index) => {
            if (index % 2 === 0) {
              total += item.value * Math.random();
            } else {
              total -= item.value / 2;
            }
          });
          return total;
        }
      `;

      const testFile = require('path').join(testDir, 'processor.ts');
      await require('fs-extra').writeFile(testFile, complexCode);

      const result = await profiler.profile(testDir, {
        metrics: ['complexity', 'memory', 'runtime'],
        detailed: true
      });

      expect(result).toBeDefined();
      expect(result.filesAnalyzed).toBe(1);
      expect(result.totalComplexity).toBeGreaterThan(0);
      expect(result.averageComplexity).toBeGreaterThan(0);
      expect(result.memoryUsage).toBeInstanceOf(Array);
      expect(result.runtimeMetrics).toBeInstanceOf(Array);
      expect(result.complexityMetrics).toBeInstanceOf(Array);
      expect(result.recommendations).toBeInstanceOf(Array);

      // Cleanup
      await require('fs-extra').remove(testDir);

      console.log('✅ Performance profiling test passed');
    });

    it('should handle empty directory gracefully', async () => {
      const emptyDir = './empty-performance-test';
      await require('fs-extra').ensureDir(emptyDir);

      const result = await profiler.profile(emptyDir, {
        metrics: ['complexity'],
        detailed: false
      });

      expect(result.filesAnalyzed).toBe(0);
      expect(result.totalComplexity).toBe(0);
      expect(result.averageComplexity).toBe(0);
      expect(result.memoryUsage).toHaveLength(0);
      expect(result.runtimeMetrics).toHaveLength(0);
      expect(result.complexityMetrics).toHaveLength(0);
      expect(result.recommendations).toContain(
        'Use lazy loading for large datasets to reduce initial memory footprint'
      );

      // Cleanup
      await require('fs-extra').remove(emptyDir);

      console.log('✅ Empty directory handling test passed');
    });
  });

  describe('cyclomatic complexity calculation', () => {
    it('should correctly calculate simple function complexity', () => {
      const simpleFunction = `
        function add(a, b) {
          return a + b;
        }
      `;

      const complexity = profiler['calculateCyclomaticComplexity'](simpleFunction);
      expect(complexity).toBe(1); // Base complexity only
    });

    it('should calculate complexity with multiple decision points', () => {
      const complexFunction = `
        function processData(data) {
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
          
          return data;
        }
      `;

      const complexity = profiler['calculateCyclomaticComplexity'](complexFunction);
      expect(complexity).toBeGreaterThan(1);
      expect(complexity).toBeGreaterThanOrEqual(7); // if + for + if + while + else + return
    });

    it('should handle ternary operators in complexity calculation', () => {
      const ternaryFunction = `
        function getValue(condition) {
          return condition ? expensiveOperation() : defaultValue;
        }
      `;

      const complexity = profiler['calculateCyclomaticComplexity'](ternaryFunction);
      expect(complexity).toBeGreaterThan(1);
    });
  });

  describe('nesting level analysis', () => {
    it('should detect deeply nested code', () => {
      const deeplyNested = `
        function deeplyNested() {
          if (condition1) {
            if (condition2) {
              if (condition3) {
                if (condition4) {
                  if (condition5) {
                    // Very deep nesting
                  }
                }
              }
            }
          }
        }
      `;

      const maxDepth = profiler['calculateMaxNestingLevel'](deeplyNested);
      expect(maxDepth).toBe(5);
    });

    it('should handle balanced braces correctly', () => {
      const balancedCode = `
        function balanced() {
          if (true) {
            for (let i = 0; i < 10; i++) {
              console.log(i);
            }
          }
          return true;
        }
      `;

      const maxDepth = profiler['calculateMaxNestingLevel'](balancedCode);
      expect(maxDepth).toBe(3); // function + if + for
    });
  });

  describe('memory pattern analysis', () => {
    it('should detect large array initialization', () => {
      const largeArrayCode = `
        function createLargeData() {
          const hugeArray = [
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
            11, 12, 13, 14, 15, 16, 17, 18, 19, 20
          ]; // Large inline array
        }
      `;

      profiler['analyzeMemoryPatterns'](largeArrayCode, 'test.js');
      // Should log warning about large array
    });

    it('should detect potential recursion patterns', () => {
      const recursiveCode = `
        function factorial(n) {
          if (n <= 1) return 1;
          return n * factorial(n - 1); // Recursive call
        }

        function nestedRecursive() {
          function inner() {
            inner(); // Self-recursion
          }
          inner();
        }
      `;

      profiler['analyzeMemoryPatterns'](recursiveCode, 'test.js');
      // Should log warning about deep recursion
    });
  });

  describe('runtime pattern analysis', () => {
    it('should detect nested loops', () => {
      const nestedLoopsCode = `
        function processData(data) {
          for (const item of data) {
            for (const subItem of item.subItems) {
              for (const detail of subItem.details) {
                processDetail(detail);
              }
            }
          }
        }
      `;

      profiler['analyzeRuntimePatterns'](nestedLoopsCode, 'test.js');
      // Should log warning about multiple nested loops
    });

    it('should detect chained operations', () => {
      const chainedOperationsCode = `
        function transformData(data) {
          return data
            .filter(item => item.active)
            .map(item => ({ ...item, processed: true }))
            .reduce((acc, item) => acc + item.value, 0);
        }
      `;

      profiler['analyzeRuntimePatterns'](chainedOperationsCode, 'test.js');
      // Should log warning about multiple chained operations
    });
  });

  describe('metric generation', () => {
    it('should generate memory usage metrics', () => {
      const files = ['./file1.ts', './file2.ts'];
      const memoryMetrics = profiler['generateMemoryMetrics'](files);

      expect(memoryMetrics).toBeInstanceOf(Array);
      expect(memoryMetrics.length).toBeGreaterThan(0);
      expect(memoryMetrics[0]).toHaveProperty('name');
      expect(memoryMetrics[0]).toHaveProperty('value');
      expect(memoryMetrics[0]).toHaveProperty('unit');
      expect(memoryMetrics[0]).toHaveProperty('description');
    });

    it('should generate runtime metrics', () => {
      const files = ['./complex-file.ts'];
      const runtimeMetrics = profiler['generateRuntimeMetrics'](files);

      expect(runtimeMetrics).toBeInstanceOf(Array);
      expect(runtimeMetrics.some(m => m.name === 'Cyclomatic Complexity')).toBe(true);
      expect(runtimeMetrics.some(m => m.name === 'Estimated Execution Time')).toBe(true);
    });

    it('should generate complexity metrics with ratings', () => {
      const lowComplexity = 3;
      const mediumComplexity = 8;
      const highComplexity = 15;

      const lowMetrics = profiler['generateComplexityMetrics'](lowComplexity);
      const mediumMetrics = profiler['generateComplexityMetrics'](mediumComplexity);
      const highMetrics = profiler['generateComplexityMetrics'](highComplexity);

      expect(lowMetrics.some(m => m.name === 'Complexity Rating')).toBe(true);
      expect(mediumMetrics.some(m => m.name === 'Complexity Rating')).toBe(true);
      expect(highMetrics.some(m => m.name === 'Complexity Rating')).toBe(true);
    });
  });

  describe('heap usage estimation', () => {
    it('should estimate heap usage based on code characteristics', () => {
      const minimalCode = `
        function add(a, b) {
          return a + b;
        }
      `;

      const complexCode = `
        export class DataManager {
          private data: Map<string, any> = new Map();
          private cache: WeakMap<object, any> = new WeakMap();

          constructor(private config: Config) {}

          process(data: any[]) {
            return data.map(item => ({
              ...item,
              processed: true,
              timestamp: Date.now()
            }));
          }
        }
      `;

      const minimalHeap = profiler['estimateHeapUsage']([minimalCode]);
      const complexHeap = profiler['estimateHeapUsage']([complexCode]);

      expect(complexHeap).toBeGreaterThan(minimalHeap);
      expect(typeof minimalHeap).toBe('number');
      expect(typeof complexHeap).toBe('number');
    });
  });

  describe('recommendation generation', () => {
    it('should provide complexity-based recommendations', () => {
      const lowComplexity = 5;
      const highComplexity = 20;

      const lowRecommendations = profiler['generateRecommendations'](5, lowComplexity, 10);
      const highRecommendations = profiler['generateRecommendations'](20, highComplexity, 10);

      expect(lowRecommendations).not.toContain(expect.stringContaining('Refactor functions with high cyclomatic complexity'));
      expect(highRecommendations).toContain(expect.stringContaining('Refactor functions with high cyclomatic complexity'));
      expect(highRecommendations).toContain(expect.stringContaining('Critical: Several functions have very high complexity'));
    });

    it('should provide file organization recommendations', () => {
      const manyFilesRecommendations = profiler['generateRecommendations'](100, 5, 60);
      expect(manyFilesRecommendations).toContain(
        expect.stringContaining('consider organizing code into logical modules')
      );
    });

    it('should provide general performance recommendations', () => {
      const recommendations = profiler['generateRecommendations'](50, 8, 20);

      expect(recommendations).toContain(
        expect.stringContaining('Use lazy loading for large datasets')
      );
      expect(recommendations).toContain(
        expect.stringContaining('Profile actual performance bottlenecks')
      );
      expect(recommendations).toContain(
        expect.stringContaining('Use efficient data structures')
      );
      expect(recommendations).toContain(
        expect.stringContaining('Implement proper error handling')
      );
    });
  });

  describe('file discovery', () => {
    it('should find supported source files', async () => {
      const testDir = './test-performance-files';
      await require('fs-extra').ensureDir(testDir);

      // Create different TypeScript/JavaScript file types
      const files = [
        require('path').join(testDir, 'component.tsx'),
        require('path').join(testDir, 'utils.js'),
        require('path').join(testDir, 'service.ts'),
        require('path').join(testDir, 'model.jsx')
      ];

      for (const file of files) {
        await require('fs-extra').writeFile(file, '// Test content');
      }

      const discoveredFiles = await profiler['getProjectFiles'](testDir);

      expect(discoveredFiles).toHaveLength(4);
      expect(discoveredFiles.every(f => f.endsWith('.ts') || f.endsWith('.js') || f.endsWith('.tsx'))).toBe(true);

      // Cleanup
      await require('fs-extra').remove(testDir);

      console.log('✅ File discovery test passed');
    });
  });
});