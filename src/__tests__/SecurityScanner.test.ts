import { SecurityScanner, ScanResult } from '../scanners/SecurityScanner';

describe('SecurityScanner', () => {
  let scanner: SecurityScanner;

  beforeEach(() => {
    scanner = new SecurityScanner();
  });

  describe('scan', () => {
    it('should scan project files for security issues', async () => {
      const testDir = './test-security-scan';
      await require('fs-extra').ensureDir(testDir);

      // Create a test file with potential security issues
      const vulnerableCode = `
        // SQL Injection vulnerability
        function getUser(id) {
          return db.query("SELECT * FROM users WHERE id = " + id);
        }

        // eval usage
        function processData(data) {
          return eval(data);
        }

        // Hardcoded password
        const PASSWORD = 'secret123';

        // XSS vulnerability
        function displayContent(element, content) {
          element.innerHTML = content;
        }
      `;

      const testFile = require('path').join(testDir, 'vulnerable.js');
      await require('fs-extra').writeFile(testFile, vulnerableCode);

      const result = await scanner.scan(testDir, {
        severity: 'medium',
        autoFix: false
      });

      expect(result).toBeDefined();
      expect(result.issues).toBeInstanceOf(Array);
      expect(result.summary).toBeDefined();
      expect(result.recommendations).toBeInstanceOf(Array);

      // Should detect some security issues
      expect(result.summary.total).toBeGreaterThan(0);

      // Cleanup
      await require('fs-extra').remove(testDir);

      console.log('✅ Security scan test passed');
    });

    it('should filter issues by severity correctly', async () => {
      const testDir = './test-severity-filter';
      await require('fs-extra').ensureDir(testDir);

      const codeWithIssues = `
        // Critical issue
        function vulnerable() {
          eval('malicious code');
          const password = 'hardcoded-secret';
        }

        // Medium issue
        function sqlInjected() {
          return query("SELECT * FROM users WHERE id = " + userId);
        }

        // Low issue
        function xssVulnerable() {
          element.innerHTML = userInput;
        }
      `;

      const testFile = require('path').join(testDir, 'mixed.js');
      await require('fs-extra').writeFile(testFile, codeWithIssues);

      const lowSeverityResult = await scanner.scan(testDir, {
        severity: 'low',
        autoFix: false
      });

      const mediumSeverityResult = await scanner.scan(testDir, {
        severity: 'medium',
        autoFix: false
      });

      const highSeverityResult = await scanner.scan(testDir, {
        severity: 'high',
        autoFix: false
      });

      // Each subsequent filter should have fewer or equal issues
      expect(mediumSeverityResult.summary.total)
        .toBeLessThanOrEqual(lowSeverityResult.summary.total);
      expect(highSeverityResult.summary.total)
        .toBeLessThanOrEqual(mediumSeverityResult.summary.total);

      // Cleanup
      await require('fs-extra').remove(testDir);

      console.log('✅ Severity filtering test passed');
    });
  });

  describe('rule detection', () => {
    it('should detect SQL injection patterns', () => {
      const sqlInjectionCode = `
        function getUserData(userId) {
          const query = "SELECT * FROM users WHERE id = " + userId;
          return database.execute(query);
        }
      `;

      const issues = scanner['scanFile'](sqlInjectionCode, { severity: 'high', autoFix: false });
      const sqlIssues = issues.filter((issue: any) =>
        issue.ruleId === 'sql-injection'
      );

      expect(sqlIssues.length).toBeGreaterThan(0);
    });

    it('should detect eval usage', () => {
      const evalCode = `
        function process(input) {
          return eval(input);
        }

        const result = eval("2 + 2");
      `;

      const issues = scanner['scanFile'](evalCode, { severity: 'critical', autoFix: false });
      const evalIssues = issues.filter((issue: any) =>
        issue.ruleId === 'eval-usage'
      );

      expect(evalIssues.length).toBeGreaterThan(0);
    });

    it('should detect hardcoded passwords', () => {
      const passwordCode = `
        const API_PASSWORD = 'my-secret-password-123';
        const DB_PASSWORD = 'admin@123';
        export const SECRET_KEY = 'super-secret-key';
      `;

      const issues = scanner['scanFile'](passwordCode, { severity: 'critical', autoFix: false });
      const passwordIssues = issues.filter((issue: any) =>
        issue.ruleId === 'password-hardcoded'
      );

      expect(passwordIssues.length).toBeGreaterThan(0);
    });

    it('should detect innerHTML assignment', () => {
      const xssCode = `
        function renderUser(user) {
          document.getElementById('user-info').innerHTML = user.name;
          element.innerHTML = user.description;
        }
      `;

      const issues = scanner['scanFile'](xssCode, { severity: 'medium', autoFix: false });
      const xssIssues = issues.filter((issue: any) =>
        issue.ruleId === 'innerHTML-assignment'
      );

      expect(xssIssues.length).toBeGreaterThan(0);
    });

    it('should detect path traversal attempts', () => {
      const pathTraversalCode = `
        function readFile(filename) {
          const filePath = '../config/' + filename;
          const fullPath = path.join(__dirname, '..', filename);
          return fs.readFileSync(filePath);
        }
      `;

      const issues = scanner['scanFile'](pathTraversalCode, { severity: 'high', autoFix: false });
      const pathIssues = issues.filter((issue: any) =>
        issue.ruleId === 'path-traversal'
      );

      expect(pathIssues.length).toBeGreaterThan(0);
    });
  });

  describe('line number calculation', () => {
    it('should correctly calculate line numbers', () => {
      const content = 'Line 1\nLine 2\nLine 3\nLine 4';
      const position = content.indexOf('Line 3');

      const lineNumber = scanner['findLineNumber'](content.split('\n'), position);
      expect(lineNumber).toBe(3);
    });

    it('should handle edge cases in line calculation', () => {
      const singleLine = 'Single line without newline';
      const position = singleLine.length - 5;

      const lineNumber = scanner['findLineNumber']([singleLine], position);
      expect(lineNumber).toBe(1);
    });
  });

  describe('code snippet extraction', () => {
    it('should extract context around issues', () => {
      const content = `
        Line 1: const x = 1;
        Line 2: function vulnerable() {
        Line 3:   return eval(data); // Security issue here
        Line 4:   const password = 'secret';
        Line 5: }
        Line 6: const y = 2;
      `;

      const snippet = scanner['extractCodeSnippet'](content, 3, 2);
      expect(snippet).toContain('function vulnerable() {');
      expect(snippet).toContain('return eval(data);');
      expect(snippet).toContain('const password = \'secret\';');
    });
  });

  describe('summary generation', () => {
    it('should generate correct summary statistics', () => {
      const mockIssues = [
        { severity: 'critical' as const, category: 'XSS' },
        { severity: 'high' as const, category: 'SQL Injection' },
        { severity: 'medium' as const, category: 'Hardcoded Secrets' },
        { severity: 'medium' as const, category: 'XSS' },
        { severity: 'low' as const, category: 'Weak Crypto' }
      ];

      const summary = scanner['generateSummary'](mockIssues, 10);

      expect(summary.total).toBe(5);
      expect(summary.critical).toBe(1);
      expect(summary.high).toBe(1);
      expect(summary.medium).toBe(2);
      expect(summary.low).toBe(1);
      expect(summary.filesScanned).toBe(10);
    });
  });

  describe('recommendation generation', () => {
    it('should generate targeted recommendations based on issue categories', () => {
      const mockIssues = [
        { category: 'Secrets', severity: 'high' as const },
        { category: 'SQL Injection', severity: 'high' as const },
        { category: 'Cross-Site Scripting', severity: 'medium' as const }
      ];

      const recommendations = scanner['generateRecommendations'](mockIssues);

      expect(recommendations).toContain(expect.stringContaining('environment variables'));
      expect(recommendations).toContain(expect.stringContaining('parameterized queries'));
      expect(recommendations).toContain(expect.stringContaining('textContent instead of innerHTML'));
    });

    it('should provide general security recommendations', () => {
      const recommendations = scanner['generateRecommendations']([], 0, 5);

      expect(recommendations).toContain(expect.stringContaining('automated security testing'));
      expect(recommendations).toContain(expect.stringContaining('update dependencies'));
    });
  });

  describe('remediation guidance', () => {
    it('should provide specific remediation advice for each rule', () => {
      const remediation = scanner['getRemediation']('sql-injection');
      expect(remediation).toContain('parameterized queries');
      expect(remediation).toContain('Never concatenate user input');

      const evalRemediation = scanner['getRemediation']('eval-usage');
      expect(evalRemediation).toContain('Avoid using eval()');

      const passwordRemediation = scanner['getRemediation']('password-hardcoded');
      expect(passwordRemediation).toContain('environment variables');
    });
  });

  describe('file discovery', () => {
    it('should find various source file types', async () => {
      const testDir = './test-file-discovery';
      await require('fs-extra').ensureDir(testDir);

      // Create different file types
      const jsFile = require('path').join(testDir, 'script.js');
      const tsFile = require('path').join(testDir, 'component.ts');
      const pyFile = require('path').join(testDir, 'utils.py');

      await require('fs-extra').writeFile(jsFile, '// JavaScript file');
      await require('fs-extra').writeFile(tsFile, '// TypeScript file');
      await require('fs-extra').writeFile(pyFile, '// Python file');

      const files = await scanner['getProjectFiles'](testDir);

      expect(files).toHaveLength(3);
      expect(files.some(f => f.endsWith('.js'))).toBe(true);
      expect(files.some(f => f.endsWith('.ts'))).toBe(true);
      expect(files.some(f => f.endsWith('.py'))).toBe(true);

      // Cleanup
      await require('fs-extra').remove(testDir);

      console.log('✅ File discovery test passed');
    });
  });
});