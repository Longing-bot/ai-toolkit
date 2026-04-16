# AI Toolkit CLI

A comprehensive command-line toolkit for AI-powered development workflows, code analysis, and automation.

## Features

- **Code Analysis**: Advanced static code analysis with AI insights
- **Documentation Generator**: Automatically generate documentation from code comments
- **Testing Assistant**: AI-powered test case generation and review
- **Code Refactoring**: Suggest improvements and refactorings
- **Performance Profiling**: Analyze code performance patterns
- **Security Scanner**: Security vulnerability detection

## Installation

```bash
npm install -g ai-toolkit-cli
```

## Quick Start

```bash
# Analyze a project
ai-toolkit analyze ./my-project

# Generate documentation
ai-toolkit docs ./src --output ./docs

# Create tests
ai-toolkit test ./src --framework jest

# Security scan
ai-toolkit security ./src
```

## Usage Examples

### Basic Code Analysis
```bash
ai-toolkit analyze ./project
```

Output:
```
📊 Analysis Results:
├── Complexity: 2.3 (Good)
├── Coverage: 85% 
├── Issues: 3 minor
└── Suggestions: 2 improvements found
```

### Documentation Generation
```bash
ai-toolkit docs ./src/components --format markdown --output ./docs/api
```

### Test Generation
```bash
ai-toolkit test ./src/utils/calculator.js --type unit --framework jest
```

## Configuration

Create `.ai-toolkit.json` in your project root:

```json
{
  "analysis": {
    "complexityThreshold": 10,
    "coverageTarget": 90,
    "excludePatterns": ["**/*.test.*", "node_modules/**"]
  },
  "documentation": {
    "formats": ["markdown", "html"],
    "includePrivate": false
  }
}
```

## API Reference

### Commands

#### `ai-toolkit analyze <path>`
Analyze code quality and complexity.

**Options:**
- `--format [json|text|html]` - Output format
- `--threshold <number>` - Complexity threshold
- `--include-dependencies` - Include dependency analysis

#### `ai-toolkit docs <source> [options]`
Generate documentation from source code.

**Options:**
- `--output <dir>` - Output directory
- `--format [markdown|html|json]` - Documentation format
- `--template <name>` - Documentation template

#### `ai-toolkit test <source> [options]`
Generate and manage test cases.

**Options:**
- `--framework [jest|mocha|vitest]` - Testing framework
- `--type [unit|integration|e2e]` - Test type
- `--coverage` - Include coverage analysis

#### `ai-toolkit security <path>`
Scan for security vulnerabilities.

**Options:**
- `--severity [high|medium|low]` - Minimum severity level
- `--auto-fix` - Attempt automatic fixes

## Development

### Setup
```bash
git clone https://github.com/Longing-bot/ai-toolkit.git
cd ai-toolkit
npm install
npm run build
```

### Running Tests
```bash
npm test
npm run test:watch
```

### Building
```bash
npm run build
npm run build:watch
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details.