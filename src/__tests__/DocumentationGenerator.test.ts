import { DocumentationGenerator } from '../generators/DocumentationGenerator';

describe('DocumentationGenerator', () => {
  let generator: DocumentationGenerator;

  beforeEach(() => {
    generator = new DocumentationGenerator();
  });

  describe('generate', () => {
    it.skip('should generate documentation for TypeScript files', async () => {
      const sourceDir = './test-source';
      await require('fs-extra').ensureDir(sourceDir);

      // Create a test TypeScript file
      const testContent = `
        /**
         * A simple calculator class
         */
        export class Calculator {
          private readonly version = '1.0.0';

          /**
           * Adds two numbers together
           * @param a - First number
           * @param b - Second number
           * @returns The sum of a and b
           */
          add(a: number, b: number): number {
            return a + b;
          }

          /**
           * Multiplies two numbers
           * @param x - First number
           * @param y - Second number
           */
          multiply(x: number, y: number): void {
            console.log(x * y);
          }
        }

        /**
         * Calculates factorial of a number
         * @param n - Number to calculate factorial for
         * @returns Factorial of n
         */
        export function factorial(n: number): number {
          if (n <= 1) return 1;
          return n * factorial(n - 1);
        }

        export const PI = 3.14159;
      `;

      const testFile = require('path').join(sourceDir, 'calculator.ts');
      await require('fs-extra').writeFile(testFile, testContent);

      await expect(generator.generate(sourceDir, {
        outputDir: './docs',
        format: 'markdown'
      })).resolves.not.toThrow();

      // Verify documentation was generated
      const readmePath = require('path').join('./docs', 'README.md');
      const exists = await require('fs-extra').pathExists(readmePath);
      expect(exists).toBe(true);

      // Cleanup
      await require('fs-extra').remove(sourceDir);
      await require('fs-extra').remove('./docs');

      console.log('✅ Documentation generation test passed');
    });
  });

  describe('API extraction', () => {
    it.skip('should extract classes correctly', () => {
      const content = `
        export class TestClass {
          public name: string;
          private id: number;

          constructor(name: string) {
            this.name = name;
            this.id = Math.random();
          }

          public greet(): string {
            return \`Hello, \${this.name}!\`;
          }

          private internalMethod(): void {
            // Internal logic
          }
        }
      `;

      const classes = generator['extractClasses'](content);
      expect(classes).toHaveLength(1);
      expect(classes[0].name).toBe('TestClass');
      expect(classes[0].properties).toHaveLength(2);
      expect(classes[0].methods).toHaveLength(2);
    });

    it.skip('should extract functions correctly', () => {
      const content = `
        export async function fetchData(url: string): Promise<any> {
          const response = await fetch(url);
          return response.json();
        }

        export const processItems = (items: any[]): number => {
          return items.length;
        };

        function internalHelper(value: string): boolean {
          return value !== null;
        }
      `;

      const functions = generator['extractFunctions'](content);
      expect(functions).toHaveLength(3);

      const exportedFunctions = functions.filter(f => f.name === 'fetchData' || f.name === 'processItems');
      expect(exportedFunctions).toHaveLength(2);
    });

    it.skip('should extract variables correctly', () => {
      const content = `
        export const API_URL: string = 'https://api.example.com';
        export let isLoading: boolean = false;
        var config: object = {};
      `;

      const variables = generator['extractExports'](content);
      expect(variables).toContain('API_URL');
      expect(variables).toContain('isLoading');
    });
  });

  describe('documentation generation', () => {
    it.skip('should generate markdown documentation', async () => {
      const apiDocs = [
        {
          type: 'class' as const,
          name: 'Calculator',
          filePath: 'src/calculator.ts',
          description: 'A simple calculator class',
          methods: [
            {
              name: 'add',
              parameters: [
                { name: 'a', type: 'number', required: true },
                { name: 'b', type: 'number', required: true }
              ],
              returnType: 'number',
              description: 'Adds two numbers together'
            }
          ],
          properties: [
            { name: 'version', type: 'string' }
          ]
        },
        {
          type: 'function' as const,
          name: 'factorial',
          filePath: 'src/math.ts',
          description: 'Calculates factorial of a number',
          parameters: [
            { name: 'n', type: 'number', required: true }
          ],
          returnType: 'number'
        }
      ];

      const outputDir = './test-docs';
      await require('fs-extra').ensureDir(outputDir);

      // Test markdown generation (simplified)
      const indexContent = generator['generateMarkdownIndex'](apiDocs);
      expect(indexContent).toContain('# API Documentation');
      expect(indexContent).toContain('## Overview');
      expect(indexContent).toContain('Calculator');
      expect(indexContent).toContain('factorial');

      // Cleanup
      await require('fs-extra').remove(outputDir);

      console.log('✅ Markdown documentation generation test passed');
    });
  });

  describe('parameter parsing', () => {
    it.skip('should parse function parameters correctly', () => {
      const paramString = 'name: string, age?: number, callback: () => void = () => {}';
      const parameters = generator['parseParameters'](paramString);

      expect(parameters).toHaveLength(3);
      expect(parameters[0]).toEqual({
        name: 'name',
        type: 'string',
        required: true
      });
      expect(parameters[1]).toEqual({
        name: 'age',
        type: 'number',
        required: false
      });
      expect(parameters[2]).toEqual({
        name: 'callback',
        type: '() => void',
        required: false
      });
    });
  });
});