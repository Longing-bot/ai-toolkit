import * as fs from 'fs-extra';
import * as path from 'path';
import * as glob from 'glob';
import chalk from 'chalk';

export interface SecurityOptions {
  severity: 'high' | 'medium' | 'low';
  autoFix: boolean;
}

export interface SecurityIssue {
  file: string;
  line: number;
  column: number;
  ruleId: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  cwe?: string;
  remediation?: string;
  code?: string;
}

export interface ScanResult {
  issues: SecurityIssue[];
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    filesScanned: number;
  };
  recommendations: string[];
}

export class SecurityScanner {
  private rules = [
    // SQL Injection
    {
      id: 'sql-injection',
      pattern: /(?:execute|exec|query)\s*\(\s*['"]\s*\+\s*[^)]+['"]/gi,
      title: 'Potential SQL Injection',
      description: 'User input is directly concatenated into SQL queries',
      severity: 'high' as const,
      category: 'Injection',
      cwe: 'CWE-89'
    },
    {
      id: 'eval-usage',
      pattern: /\beval\s*\(/g,
      title: 'Usage of eval()',
      description: 'eval() can execute arbitrary code and should be avoided',
      severity: 'critical' as const,
      category: 'Code Injection',
      cwe: 'CWE-94'
    },
    {
      id: 'innerHTML-assignment',
      pattern: /\.innerHTML\s*=|document\.write/gi,
      title: 'Potential XSS via innerHTML',
      description: 'innerHTML assignment can lead to cross-site scripting',
      severity: 'medium' as const,
      category: 'Cross-Site Scripting',
      cwe: 'CWE-79'
    },
    {
      id: 'document-write',
      pattern: /document\.write\s*\(/gi,
      title: 'Use of document.write()',
      description: 'document.write() can be dangerous in modern web applications',
      severity: 'medium' as const,
      category: 'DOM Manipulation',
      cwe: 'CWE-95'
    },
    {
      id: 'password-hardcoded',
      pattern: /password\s*[=:]\s*['"][^'"]+['"]/gi,
      title: 'Hardcoded Password',
      description: 'Password found in source code - should use environment variables',
      severity: 'critical' as const,
      category: 'Secrets',
      cwe: 'CWE-798'
    },
    {
      id: 'api-key-exposed',
      pattern: /[a-zA-Z0-9]{32,}/gi,
      title: 'Potential API Key Exposure',
      description: 'Long alphanumeric string that might be an API key',
      severity: 'high' as const,
      category: 'Secrets',
      cwe: 'CWE-798'
    },
    {
      id: 'unsafe-regex',
      pattern: /\/[^\/]+\/[gimy]{1,4}(?!\))/gi,
      title: 'Potentially Dangerous Regular Expression',
      description: 'Regular expression without proper anchoring may cause ReDoS',
      severity: 'medium' as const,
      category: 'Denial of Service',
      cwe: 'CWE-400'
    },
    {
      id: 'path-traversal',
      pattern: /\.\.\/|\.\.\\|\.\.%2e/gi,
      title: 'Path Traversal Vulnerability',
      description: 'Potential directory traversal attack vector detected',
      severity: 'high' as const,
      category: 'Path Traversal',
      cwe: 'CWE-22'
    },
    {
      id: 'deserialization',
      pattern: /JSON\.parse\s*\(|unserialize\s*\(/gi,
      title: 'Unsafe Deserialization',
      description: 'Deserializing untrusted data can lead to object injection',
      severity: 'high' as const,
      category: 'Deserialization',
      cwe: 'CWE-502'
    },
    {
      id: 'crypto-weak',
      pattern: /(md5|sha1|base64_encode)/gi,
      title: 'Weak Cryptographic Algorithm',
      description: 'Using deprecated or weak cryptographic algorithms',
      severity: 'medium' as const,
      category: 'Cryptography',
      cwe: 'CWE-327'
    }
  ];

  async scan(projectPath: string, options: SecurityOptions): Promise<ScanResult> {
    console.log(chalk.gray('🔒 Starting security scan...'));

    const files = await this.getProjectFiles(projectPath);
    const issues: SecurityIssue[] = [];

    for (const file of files) {
      try {
        const fileIssues = await this.scanFile(file, options);
        issues.push(...fileIssues);
      } catch (error: any) {
        console.warn(chalk.yellow(`⚠️  Error scanning ${file}: ${error.message}`));
      }
    }

    const filteredIssues = this.filterBySeverity(issues, options.severity);
    const summary = this.generateSummary(filteredIssues, files.length);
    const recommendations = this.generateRecommendations(filteredIssues);

    return {
      issues: filteredIssues,
      summary,
      recommendations
    };
  }

  private async getProjectFiles(projectPath: string): Promise<string[]> {
    const files: string[] = [];

    // Scan common source file patterns
    const patterns = [
      '**/*.js',
      '**/*.ts', 
      '**/*.jsx',
      '**/*.tsx',
      '**/*.py',
      '**/*.java',
      '**/*.php',
      '**/*.rb',
      '**/*.go',
      '**/*.cpp',
      '**/*.c',
      '**/*.cs',
      '**/*.env',
      '**/*.config.*',
      '**/package.json',
      '**/composer.json',
      '**/Gemfile.lock',
      '**/requirements.txt'
    ];

    for (const pattern of patterns) {
      const matchingFiles = glob.sync(path.join(projectPath, pattern), {
        ignore: ['**/node_modules/**', '**/vendor/**', '**/dist/**', '**/build/**']
      });
      files.push(...matchingFiles);
    }

    return files.filter(fs.existsSync);
  }

  private async scanFile(filePath: string, options: SecurityOptions): Promise<SecurityIssue[]> {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    const issues: SecurityIssue[] = [];

    this.rules.forEach(rule => {
      const matches = content.matchAll(new RegExp(rule.pattern.source, rule.pattern.flags));

      for (const match of matches) {
        const lineNumber = this.findLineNumber(lines, match.index!);
        const column = (match.index! - lines.slice(0, lineNumber - 1).join('\n').length) + 1;

        const issue: SecurityIssue = {
          file: filePath,
          line: lineNumber,
          column,
          ruleId: rule.id,
          title: rule.title,
          description: rule.description,
          severity: rule.severity,
          category: rule.category,
          cwe: rule.cwe,
          code: this.extractCodeSnippet(content, lineNumber, 3),
          remediation: this.getRemediation(rule.id)
        };

        issues.push(issue);
      }
    });

    return issues;
  }

  private findLineNumber(lines: string[], position: number): number {
    let currentPos = 0;
    for (let i = 0; i < lines.length; i++) {
      if (currentPos + lines[i].length >= position) {
        return i + 1;
      }
      currentPos += lines[i].length + 1; // +1 for newline character
    }
    return lines.length;
  }

  private extractCodeSnippet(content: string, lineNumber: number, contextLines: number): string {
    const lines = content.split('\n');
    const startLine = Math.max(0, lineNumber - contextLines - 1);
    const endLine = Math.min(lines.length, lineNumber + contextLines);

    return lines.slice(startLine, endLine).join('\n');
  }

  private filterBySeverity(issues: SecurityIssue[], minSeverity: string): SecurityIssue[] {
    const severityLevels: { [key: string]: number } = { low: 0, medium: 1, high: 2, critical: 3 };
    const minLevel = severityLevels[minSeverity] || 0;

    return issues.filter(issue => {
      const issueLevel = severityLevels[issue.severity] || 0;
      return issueLevel >= minLevel;
    });
  }

  private generateSummary(issues: SecurityIssue[], filesScanned: number): ScanResult['summary'] {
    const summary = {
      total: issues.length,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      filesScanned
    };

    issues.forEach(issue => {
      switch (issue.severity) {
        case 'critical':
          summary.critical++;
          break;
        case 'high':
          summary.high++;
          break;
        case 'medium':
          summary.medium++;
          break;
        case 'low':
          summary.low++;
          break;
      }
    });

    return summary;
  }

  private generateRecommendations(issues: SecurityIssue[]): string[] {
    const recommendations: Set<string> = new Set();

    // Group issues by category for targeted recommendations
    const categoryIssues = new Map<string, SecurityIssue[]>();

    issues.forEach(issue => {
      if (!categoryIssues.has(issue.category)) {
        categoryIssues.set(issue.category, []);
      }
      categoryIssues.get(issue.category)!.push(issue);
    });

    // Generate specific recommendations based on categories
    categoryIssues.forEach((categoryIssues, category) => {
      switch (category) {
        case 'Secrets':
          recommendations.add('Use environment variables or secret management services instead of hardcoding secrets');
          recommendations.add('Consider using .gitignore to exclude configuration files with secrets');
          break;

        case 'Injection':
          recommendations.add('Use parameterized queries or prepared statements for database operations');
          recommendations.add('Implement input validation and sanitization');
          break;

        case 'Cross-Site Scripting':
          recommendations.add('Use textContent instead of innerHTML when possible');
          recommendations.add('Implement Content Security Policy (CSP) headers');
          break;

        case 'Cryptography':
          recommendations.add('Use strong, up-to-date cryptographic algorithms');
          recommendations.add('Follow established cryptographic libraries and best practices');
          break;

        case 'Path Traversal':
          recommendations.add('Validate and sanitize all user-provided file paths');
          recommendations.add('Use allowlists for acceptable file extensions');
          break;

        default:
          recommendations.add(`Review and address ${category} vulnerabilities`);
      }
    });

    // Global recommendations
    const highSeverityCount = issues.filter(i => i.severity === 'high' || i.severity === 'critical').length;
    if (highSeverityCount > 0) {
      recommendations.add('Prioritize fixing high and critical severity vulnerabilities first');
    }

    if (issues.length > 10) {
      recommendations.add('Consider implementing automated security testing in your CI/CD pipeline');
    }

    recommendations.add('Regularly update dependencies to patch known vulnerabilities');

    return Array.from(recommendations);
  }

  private getRemediation(ruleId: string): string {
    const remediations: Record<string, string> = {
      'sql-injection': 'Use parameterized queries or prepared statements. Never concatenate user input directly into SQL queries.',
      'eval-usage': 'Avoid using eval(). If absolutely necessary, validate and sanitize the input thoroughly.',
      'innerHTML-assignment': 'Use textContent or createElement/textNode methods instead of innerHTML. Consider using DOM manipulation libraries.',
      'document-write': 'Avoid document.write(). Use modern DOM manipulation methods like appendChild or insertAdjacentHTML.',
      'password-hardcoded': 'Store passwords in environment variables or secure secret management systems.',
      'api-key-exposed': 'Move API keys to environment variables and ensure they are not committed to version control.',
      'unsafe-regex': 'Anchor regular expressions properly and consider using non-capturing groups to prevent catastrophic backtracking.',
      'path-traversal': 'Validate file paths against allowlists and use canonicalization to prevent directory traversal attacks.',
      'deserialization': 'Only deserialize data from trusted sources. Consider using safer alternatives like JSON.parse() with validation.',
      'crypto-weak': 'Replace weak cryptographic algorithms with modern, well-vetted alternatives like SHA-256, bcrypt, or Argon2.'
    };

    return remediations[ruleId] || 'Review the vulnerability and implement appropriate security controls.';
  }

  toString(): string {
    // This will be implemented by the calling code
    return '';
  }
}