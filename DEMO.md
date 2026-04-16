# AI Toolkit CLI - Demo

This document demonstrates the capabilities of the AI Toolkit CLI through practical examples.

## Installation

```bash
npm install -g ai-toolkit-cli
```

## Quick Start

### 1. Analyze Your Codebase

```bash
# Basic analysis
ai-toolkit analyze ./my-project

# With detailed output
ai-toolkit analyze ./my-project --format json --threshold 15 --include-dependencies
```

**Sample Output:**
```
🔍 Analyzing ./my-project...
📊 Analysis Results:
├── Files Analyzed: 47
├── Total Lines: 12,843
├── Average Complexity: 6.2
├── Coverage: 82%
├── Issues Found: 12 (3 high, 6 medium, 3 low)
└── Score: 85/100

💡 Suggestions:
├── Consider refactoring functions with complexity > 10
├── Increase test coverage to 90% target
└── Address 3 high-severity issues
```

### 2. Generate Documentation

```bash
# Generate markdown documentation
ai-toolkit docs ./src --output ./docs/api --format markdown

# Generate HTML documentation
ai-toolkit docs ./src --output ./docs/html --format html --template modern
```

**Generated Structure:**
```
docs/
├── README.md              # API overview
├── API.md               # Complete API reference
├── classes/
│   ├── Calculator.md    # Class documentation
│   └── UserService.md   # Another class
└── functions/
    ├── auth.md          # Function documentation
    └── utils.md         # Utility functions
```

### 3. Create Tests

```bash
# Generate Jest tests for TypeScript files
ai-toolkit test ./src --framework jest --type unit --coverage

# Generate Mocha tests for JavaScript files
ai-toolkit test ./lib --framework mocha --type integration
```

**Generated Test Structure:**
```
__tests__/
├── calculator.test.ts      # Unit tests for Calculator class
├── auth.spec.js            # Integration tests for Auth module
└── utils.test.tsx         # Component tests
```

### 4. Security Scanning

```bash
# Scan for security issues
ai-toolkit security ./src --severity medium

# Auto-fix critical issues
ai-toolkit security ./src --severity high --auto-fix
```

**Security Report Example:**
```
🔒 Security Scan Results:
├── Files Scanned: 23
├── Issues Found: 8
│   ├── Critical: 1 (Hardcoded password)
│   ├── High: 3 (SQL injection, eval usage, XSS)
│   ├── Medium: 3 (Weak crypto, path traversal)
│   └── Low: 1 (Magic numbers)
└── Recommendations: 5

🛠️  Auto-fix applied to 1 critical issue
```

### 5. Performance Profiling

```bash
# Profile code performance
ai-toolkit profile ./src --metrics complexity,memory,runtime --detailed

# Simple profiling
ai-toolkit profile ./lib --metrics runtime
```

**Performance Report:**
```
⚡ Performance Analysis:
├── Files Analyzed: 15
├── Total Complexity: 234
├── Average Complexity: 8.1
└── Memory Usage: 4.2 MB estimated

📈 Runtime Metrics:
├── Cyclomatic Complexity: 234 points
├── Estimated Execution Time: 23.4 ms
└── Complexity Rating: 70% (Good)

💡 Recommendations:
├── Refactor complex functions (>10 complexity)
├── Use lazy loading for large datasets
└── Profile actual bottlenecks before optimizing
```

## Advanced Usage

### Configuration File

Create `.ai-toolkit.json` in your project root:

```json
{
  "analysis": {
    "complexityThreshold": 10,
    "coverageTarget": 90,
    "excludePatterns": ["**/*.test.*", "node_modules/**"],
    "includeDependencies": true
  },
  "documentation": {
    "formats": ["markdown", "html"],
    "includePrivate": false,
    "template": "modern"
  },
  "testing": {
    "defaultFramework": "jest",
    "coverageThreshold": 80,
    "generateIntegrationTests": true
  },
  "security": {
    "autoFix": false,
    "severityLevel": "medium",
    "reportFormat": "json"
  }
}
```

### CI/CD Integration

Add to your GitHub Actions workflow:

```yaml
name: AI Toolkit Analysis
on: [push, pull_request]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
      - name: Install AI Toolkit
        run: npm install -g ai-toolkit-cli
      - name: Run Security Scan
        run: ai-toolkit security ./src --severity high
      - name: Generate Documentation
        run: ai-toolkit docs ./src --output ./docs
      - name: Create Tests
        run: ai-toolkit test ./src --coverage
```

### Custom Rules

Extend the toolkit with custom analysis rules:

```typescript
// custom-rules.ts
import { CodeAnalyzer } from 'ai-toolkit';

class CustomAnalyzer extends CodeAnalyzer {
  async analyzeCustomPatterns(content: string, filePath: string): Promise<void> {
    // Add your custom security checks
    if (content.includes('console.log')) {
      console.warn(`⚠️  Console logging detected in ${filePath}`);
    }

    // Check for TODO comments
    const todoMatches = content.match(/TODO|FIXME/g);
    if (todoMatches) {
      console.log(`📝 Found ${todoMatches.length} TODO/FIXME items`);
    }
  }
}

export default CustomAnalyzer;
```

## Real-World Examples

### E-commerce Application

```bash
# Analyze payment processing code
ai-toolkit analyze ./src/payment/

# Generate API documentation
ai-toolkit docs ./src/api/ --output ./docs/payment-api/

# Create comprehensive tests
ai-toolkit test ./src/payment/ --framework jest --coverage

# Security audit
ai-toolkit security ./src/payment/ --severity high --auto-fix
```

**Results:**
- ✅ 95/100 code quality score
- 📚 Complete API documentation generated
- 🧪 100% test coverage achieved
- 🔒 All critical security issues resolved

### Machine Learning Pipeline

```bash
# Profile performance of data processing
ai-toolkit profile ./src/data-pipeline/ --detailed

# Analyze model complexity
ai-toolkit analyze ./src/models/

# Generate documentation for ML components
ai-toolkit docs ./src/ml-components/ --template scientific
```

**Insights:**
- Identified memory bottlenecks in data loading
- Complexity analysis revealed optimization opportunities
- Generated scientific documentation with mathematical formulas

## Troubleshooting

### Common Issues

**Q: "Command not found" after installation**
A: Try `npm link` or add `/usr/local/bin` to your PATH.

**Q: Large files causing slow analysis**
A: Use `--exclude-patterns` to ignore generated files:
```bash
ai-toolkit analyze ./src --exclude-patterns "**/*.{min.js,dist.*,*.bundle.*}"
```

**Q: False positives in security scan**
A: Configure severity levels and add exceptions:
```bash
ai-toolkit security ./src --severity critical --exclude "**/legacy/**"
```

### Getting Help

```bash
# View all commands
ai-toolkit --help

# Get help for specific command
ai-toolkit analyze --help
ai-toolkit security --help

# Show version
ai-toolkit --version
```

## Performance Tips

1. **Incremental Analysis**: Only analyze changed files:
   ```bash
   ai-toolkit analyze ./src --since last-commit
   ```

2. **Parallel Processing**: Enable multi-threaded analysis:
   ```bash
   ai-toolkit analyze ./src --threads 4
   ```

3. **Cache Results**: Store analysis results for faster subsequent runs:
   ```bash
   ai-toolkit analyze ./src --cache
   ```

---

*This demo shows how AI Toolkit CLI can significantly improve development workflows by automating code analysis, documentation generation, testing, and security scanning.*