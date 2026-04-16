#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { CodeAnalyzer } from './analyzers/CodeAnalyzer';
import { DocumentationGenerator } from './generators/DocumentationGenerator';
import { TestGenerator } from './generators/TestGenerator';
import { SecurityScanner } from './scanners/SecurityScanner';
import { PerformanceProfiler } from './profilers/PerformanceProfiler';

const program = new Command();

program
  .name('ai-toolkit')
  .description('AI-powered development toolkit for code analysis and automation')
  .version('1.0.0');

// Analyze command
program
  .command('analyze <path>')
  .description('Analyze code quality and complexity')
  .option('-f, --format <type>', 'Output format (json|text|html)', 'text')
  .option('-t, --threshold <number>', 'Complexity threshold', '10')
  .option('--include-dependencies', 'Include dependency analysis', false)
  .action(async (path: string, options) => {
    console.log(chalk.blue(`🔍 Analyzing ${path}...`));
    
    const analyzer = new CodeAnalyzer();
    const results = await analyzer.analyze(path, {
      format: options.format,
      complexityThreshold: parseInt(options.threshold),
      includeDependencies: options.includeDependencies
    });
    
    console.log(results.toString());
  });

// Documentation command
program
  .command('docs <source>')
  .description('Generate documentation from source code')
  .option('-o, --output <dir>', 'Output directory', './docs')
  .option('-f, --format <type>', 'Documentation format (markdown|html|json)', 'markdown')
  .option('-t, --template <name>', 'Documentation template')
  .action(async (source: string, options) => {
    console.log(chalk.blue(`📚 Generating documentation for ${source}...`));
    
    const generator = new DocumentationGenerator();
    await generator.generate(source, {
      outputDir: options.output,
      format: options.format,
      template: options.template
    });
    
    console.log(chalk.green(`✅ Documentation generated in ${options.output}`));
  });

// Test command
program
  .command('test <source>')
  .description('Generate and manage test cases')
  .option('-f, --framework <type>', 'Testing framework (jest|mocha|vitest)', 'jest')
  .option('-t, --type <kind>', 'Test type (unit|integration|e2e)', 'unit')
  .option('--coverage', 'Include coverage analysis', false)
  .action(async (source: string, options) => {
    console.log(chalk.blue(`🧪 Generating tests for ${source}...`));
    
    const generator = new TestGenerator();
    await generator.generateTests(source, {
      framework: options.framework,
      type: options.type,
      coverage: options.coverage
    });
    
    console.log(chalk.green(`✅ Tests generated successfully`));
  });

// Security command
program
  .command('security <path>')
  .description('Scan for security vulnerabilities')
  .option('-s, --severity <level>', 'Minimum severity level (high|medium|low)', 'medium')
  .option('--auto-fix', 'Attempt automatic fixes', false)
  .action(async (path: string, options) => {
    console.log(chalk.blue(`🔒 Scanning ${path} for security issues...`));
    
    const scanner = new SecurityScanner();
    const results = await scanner.scan(path, {
      severity: options.severity,
      autoFix: options.autoFix
    });
    
    console.log(results.toString());
  });

// Performance command
program
  .command('profile <path>')
  .description('Profile code performance patterns')
  .option('-m, --metrics <types>', 'Metrics to collect (complexity|memory|runtime)', 'complexity')
  .option('--detailed', 'Include detailed analysis', false)
  .action(async (path: string, options) => {
    console.log(chalk.blue(`⚡ Profiling performance of ${path}...`));
    
    const profiler = new PerformanceProfiler();
    const results = await profiler.profile(path, {
      metrics: options.metrics.split(','),
      detailed: options.detailed
    });
    
    console.log(results.toString());
  });

// Config command
program
  .command('config')
  .description('Manage configuration')
  .option('--init', 'Initialize default config', false)
  .option('--show', 'Show current config', false)
  .action((options) => {
    if (options.init) {
      console.log(chalk.blue('🚀 Initializing default configuration...'));
      // Initialize config logic here
    } else if (options.show) {
      console.log(chalk.blue('📋 Current configuration:'));
      // Show config logic here
    }
  });

// Help command
program
  .command('help [command]')
  .description('Get help for a specific command')
  .action((command) => {
    if (command) {
      console.log(program.commands.find(cmd => cmd.name() === command)?.helpInformation());
    } else {
      console.log(program.helpInformation());
    }
  });

console.log(chalk.cyan(`
╭─────────────────────────────────────╮
│     AI Toolkit CLI v1.0.0            │
│  🤖 AI-Powered Development Tools   │
╰─────────────────────────────────────╯
`));

program.parse(process.argv);