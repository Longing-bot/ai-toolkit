# Contributing to AI Toolkit CLI

Thank you for your interest in contributing to AI Toolkit CLI! This document provides guidelines and instructions for contributing to the project.

## 🚀 Quick Start

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/ai-toolkit.git
   cd ai-toolkit
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Set up pre-commit hooks**:
   ```bash
   npm run prepare
   ```
5. **Create a feature branch**:
   ```bash
   git checkout -b feature/amazing-feature
   ```
6. **Make your changes** and write tests
7. **Run tests**:
   ```bash
   npm test
   ```
8. **Commit your changes**:
   ```bash
   git commit -m "Add amazing feature"
   ```
9. **Push to your fork**:
   ```bash
   git push origin feature/amazing-feature
   ```
10. **Open a Pull Request**

## 📋 Development Guidelines

### Code Style

We follow strict TypeScript standards:

- **TypeScript**: Strict mode enabled, no implicit any
- **ESLint**: Configured with @typescript-eslint/recommended
- **Prettier**: Automatic code formatting
- **Import Order**: Alphabetical with type imports first

**Example:**
```typescript
import { readFileSync } from 'fs';
import { join } from 'path';

import type { Config } from './types/config';
import { CodeAnalyzer } from './analyzers/code-analyzer';
```

### Git Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes

**Examples:**
```
feat(analyzer): add support for Python files
fix(scanner): resolve memory leak in large file processing
docs(readme): update installation instructions
refactor(test-generator): simplify Jest test creation
```

### Branch Naming

Use descriptive branch names:

- `feature/add-python-support`
- `bugfix/fix-line-number-calculation`
- `docs/update-api-reference`
- `refactor/optimize-performance`

## 🧪 Testing

### Writing Tests

All new features must include comprehensive tests:

```typescript
describe('CodeAnalyzer', () => {
  it('should analyze simple JavaScript code', async () => {
    // Arrange
    const analyzer = new CodeAnalyzer();
    const testDir = './test-project';

    // Act
    const result = await analyzer.analyze(testDir, options);

    // Assert
    expect(result.filesAnalyzed).toBeGreaterThanOrEqual(0);
    // ... more assertions
  });
});
```

### Test Coverage Requirements

- **Unit Tests**: 90%+ coverage for all modules
- **Integration Tests**: End-to-end workflow tests
- **Edge Cases**: Boundary condition testing
- **Error Handling**: Exception scenario coverage

**Run tests:**
```bash
npm test                    # All tests
npm run test:watch         # Watch mode
npm run test:coverage     # With coverage report
```

### Performance Testing

For performance-related changes:

```bash
npm run test:performance   # Performance benchmarks
npm run profile           # Profile execution time
```

## 🔧 Building and Development

### Local Development

```bash
# Clean and build
npm run clean && npm run build

# Development with watch mode
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Formatting
npm run format
```

### Pre-commit Hooks

We use Husky to enforce quality:

- **TypeScript compilation**: Ensures no compilation errors
- **ESLint**: Checks code style and patterns
- **Prettier**: Auto-formats code
- **Tests**: Runs unit tests before commits

### Debugging

**VS Code Debug Configuration:**
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Analyzer",
      "program": "${workspaceFolder}/src/index.ts",
      "preLaunchTask": "tsc: build - tsconfig.json",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"]
    }
  ]
}
```

## 📦 Release Process

### Version Bumping

We use semantic versioning (SemVer):

- **Major**: Breaking changes
- **Minor**: New features (backwards compatible)
- **Patch**: Bug fixes (backwards compatible)

**Bump version:**
```bash
npm version patch  # Bug fixes
npm version minor  # New features
npm version major  # Breaking changes
```

### Release Checklist

Before each release:

- [ ] All tests pass (`npm test`)
- [ ] Code coverage meets threshold (≥90%)
- [ ] TypeScript compilation successful
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped appropriately
- [ ] Release notes drafted
- [ ] CI/CD pipeline tested

### Publishing

**Publish to NPM:**
```bash
npm publish --access public
```

**GitHub Release:**
1. Create release tag
2. Draft release notes
3. Upload artifacts if needed
4. Publish release

## 🎯 Feature Requests

We welcome feature requests! Please:

1. **Check existing issues** first
2. **Search discussions** for similar proposals
3. **Open a new issue** with:
   - Clear problem description
   - Use case examples
   - Proposed solution (optional)
   - Alternative solutions considered

**Feature Template:**
```markdown
## Problem Statement

[Describe the problem you're trying to solve]

## Proposed Solution

[Describe your proposed solution]

## Alternatives Considered

- [Alternative 1]
- [Alternative 2]

## Additional Context

[Any additional information, screenshots, etc.]
```

## 🐛 Bug Reports

Please include in bug reports:

- **Environment**: Node.js version, OS, package version
- **Steps to Reproduce**: Exact commands and inputs
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Error Logs**: Full error messages and stack traces
- **Minimal Example**: Smallest code that reproduces the issue

**Bug Report Template:**
```markdown
## Environment

- Node.js version: [e.g., v18.16.0]
- Operating System: [e.g., macOS 13.4]
- Package Version: [e.g., v1.0.0]

## Steps to Reproduce

1. [First step]
2. [Second step]
3. [And so on...]

## Expected Behavior

[What should happen]

## Actual Behavior

[What actually happens]

## Error Logs

```
Paste full error output here
```

## Minimal Example

```javascript
// Paste minimal code that reproduces the issue
```
```

## 🤝 Code of Conduct

This project follows the [Contributor Covenant](https://www.contributor-covenant.org/) Code of Conduct. By participating, you agree to maintain a respectful and inclusive environment.

### Our Standards

- **Be respectful** and inclusive
- **Provide constructive feedback**
- **Focus on technical merit**
- **Respect differing viewpoints**
- **Gracefully accept criticism**

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or insulting comments
- Personal attacks
- Publishing others' private information
- Any conduct that could reasonably be considered inappropriate

## 📚 Learning Resources

### Getting Started with Open Source

- [How to Contribute to Open Source](https://opensource.guide/how-to-contribute/)
- [Finding Ways to Contribute](https://www.firsttimersonly.com/)
- [GitHub Flow Guide](https://guides.github.com/introduction/flow/)

### TypeScript Best Practices

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Effective TypeScript](https://effectivetypescript.com/)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)

### Testing in JavaScript/TypeScript

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/)
- [Node.js Testing Best Practices](https://github.com/goldbergyoni/nodebestpractices#testing-and-debugging)

## 💬 Communication

- **GitHub Issues**: For bugs and feature requests
- **Discord Server**: Real-time chat and discussions
- **Email**: longing@openclaw.ai for sensitive issues
- **Security Issues**: Please report privately via email

## 🙏 Acknowledgments

We would like to thank all our contributors and the open source community for their continued support and feedback.

---

*Remember: Every contribution, no matter how small, makes a difference. Thank you for being part of the AI Toolkit CLI community!*