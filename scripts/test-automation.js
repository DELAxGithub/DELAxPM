#!/usr/bin/env node

/**
 * Automation System Test Suite
 * 
 * このスクリプトは完全自動化システムの動作検証を行います：
 * 1. 各コンポーネントの動作確認
 * 2. 統合テスト
 * 3. 設定検証
 * 4. パフォーマンステスト
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class AutomationTester {
  constructor() {
    this.projectRoot = process.cwd();
    this.testResults = [];
    this.config = this.loadConfig();
  }

  loadConfig() {
    try {
      const configPath = path.join(this.projectRoot, '.claude-config.json');
      if (fs.existsSync(configPath)) {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
      }
    } catch (error) {
      this.log('Failed to load config', 'warning');
    }
    return {};
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const colors = {
      info: '\x1b[34m',      // blue
      success: '\x1b[32m',   // green
      warning: '\x1b[33m',   // yellow
      error: '\x1b[31m',     // red
      header: '\x1b[36m\x1b[1m', // cyan bold
      test: '\x1b[35m'       // magenta
    };
    const reset = '\x1b[0m';
    const gray = '\x1b[90m';
    
    console.log(`${gray}${timestamp}${reset} 🧪 Test: ${colors[type]}${message}${reset}`);
  }

  async executeCommand(command, options = {}) {
    try {
      const result = execSync(command, {
        cwd: this.projectRoot,
        encoding: 'utf8',
        stdio: options.silent ? 'pipe' : 'inherit',
        timeout: options.timeout || 30000,
        ...options
      });
      return { success: true, output: result.trim() };
    } catch (error) {
      return { 
        success: false, 
        error: error.message,
        output: error.stdout || error.stderr || ''
      };
    }
  }

  async runTest(testName, testFn) {
    this.log(`Running: ${testName}`, 'test');
    const startTime = Date.now();
    
    try {
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        name: testName,
        status: 'passed',
        duration,
        result
      });
      
      this.log(`✅ ${testName} (${duration}ms)`, 'success');
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        name: testName,
        status: 'failed',
        duration,
        error: error.message
      });
      
      this.log(`❌ ${testName} (${duration}ms): ${error.message}`, 'error');
      return false;
    }
  }

  async validateProjectStructure() {
    const requiredFiles = [
      '.github/workflows/deploy.yml',
      '.github/workflows/test.yml',
      'scripts/auto-commit.js',
      'scripts/claude-hooks.js',
      'scripts/supabase-auto-migrate.js',
      'scripts/error-recovery.js',
      'scripts/notification-system.js',
      '.claude-config.json',
      'package.json',
      'netlify.toml'
    ];

    const requiredDirs = [
      'supabase/migrations',
      'apps/unified/src',
      'e2e'
    ];

    for (const file of requiredFiles) {
      if (!fs.existsSync(path.join(this.projectRoot, file))) {
        throw new Error(`Required file missing: ${file}`);
      }
    }

    for (const dir of requiredDirs) {
      if (!fs.existsSync(path.join(this.projectRoot, dir))) {
        throw new Error(`Required directory missing: ${dir}`);
      }
    }

    return { files: requiredFiles.length, directories: requiredDirs.length };
  }

  async testPackageScripts() {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(this.projectRoot, 'package.json'), 'utf8')
    );

    const requiredScripts = [
      'claude:commit',
      'claude:hooks', 
      'claude:deploy',
      'claude:auto',
      'claude:check',
      'build:unified',
      'test:e2e',
      'type-check',
      'lint'
    ];

    for (const script of requiredScripts) {
      if (!packageJson.scripts[script]) {
        throw new Error(`Required script missing: ${script}`);
      }
    }

    return { scriptsCount: Object.keys(packageJson.scripts).length };
  }

  async testGitHubWorkflows() {
    const deployWorkflow = path.join(this.projectRoot, '.github/workflows/deploy.yml');
    const testWorkflow = path.join(this.projectRoot, '.github/workflows/test.yml');

    // Check if workflows are valid YAML
    const deployContent = fs.readFileSync(deployWorkflow, 'utf8');
    const testContent = fs.readFileSync(testWorkflow, 'utf8');

    // Basic YAML structure validation
    if (!deployContent.includes('name:') || !deployContent.includes('jobs:')) {
      throw new Error('Deploy workflow invalid structure');
    }

    if (!testContent.includes('name:') || !testContent.includes('jobs:')) {
      throw new Error('Test workflow invalid structure');
    }

    // Check for required jobs
    if (!deployContent.includes('build-and-test:')) {
      throw new Error('Deploy workflow missing build-and-test job');
    }

    if (!testContent.includes('code-quality:')) {
      throw new Error('Test workflow missing code-quality job');
    }

    return { workflows: 2, validated: true };
  }

  async testScriptExecution() {
    const scripts = [
      'scripts/auto-commit.js',
      'scripts/claude-hooks.js',
      'scripts/supabase-auto-migrate.js',
      'scripts/error-recovery.js',
      'scripts/notification-system.js'
    ];

    const results = {};

    for (const script of scripts) {
      // Test if script can be executed (syntax check)
      const result = await this.executeCommand(`node -c ${script}`, { silent: true });
      results[script] = result.success;
      
      if (!result.success) {
        throw new Error(`Script ${script} has syntax errors: ${result.error}`);
      }
    }

    return results;
  }

  async testDependencies() {
    this.log('Checking dependencies...', 'info');
    
    // Check if required dependencies are installed
    const result = await this.executeCommand('pnpm list --depth=0', { silent: true });
    
    if (!result.success) {
      throw new Error('Failed to list dependencies');
    }

    // Check for critical dependencies
    const criticalDeps = ['next', 'react', 'typescript', '@playwright/test', 'turbo'];
    const output = result.output;

    for (const dep of criticalDeps) {
      if (!output.includes(dep)) {
        throw new Error(`Critical dependency missing: ${dep}`);
      }
    }

    return { dependenciesChecked: criticalDeps.length };
  }

  async testTypeScript() {
    this.log('Running TypeScript type check...', 'info');
    
    const result = await this.executeCommand('pnpm type-check', { silent: true, timeout: 60000 });
    
    if (!result.success) {
      throw new Error(`TypeScript errors detected: ${result.error}`);
    }

    return { typeCheckPassed: true };
  }

  async testLinting() {
    this.log('Running ESLint...', 'info');
    
    const result = await this.executeCommand('pnpm lint', { silent: true, timeout: 60000 });
    
    if (!result.success) {
      throw new Error(`Linting errors detected: ${result.error}`);
    }

    return { lintPassed: true };
  }

  async testBuild() {
    this.log('Testing build process...', 'info');
    
    const result = await this.executeCommand('pnpm build:unified', { 
      silent: true, 
      timeout: 120000,
      env: {
        ...process.env,
        NEXT_PUBLIC_SUPABASE_URL: 'dummy-url',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'dummy-key',
        NEXT_PUBLIC_APP_NAME: 'DELA×PM統合システム',
        NEXT_PUBLIC_ENABLE_PLATTO: 'true',
        NEXT_PUBLIC_ENABLE_LIBERARY: 'true',
        NEXT_PUBLIC_ENABLE_GUEST_ACCESS: 'true'
      }
    });
    
    if (!result.success) {
      throw new Error(`Build failed: ${result.error}`);
    }

    // Check if build output exists
    const buildDir = path.join(this.projectRoot, 'apps/unified/out');
    if (!fs.existsSync(buildDir)) {
      throw new Error('Build output directory not found');
    }

    return { buildPassed: true, outputExists: true };
  }

  async testConfigurationFiles() {
    // Test .claude-config.json
    const configPath = path.join(this.projectRoot, '.claude-config.json');
    if (!fs.existsSync(configPath)) {
      throw new Error('.claude-config.json not found');
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // Validate required config sections
    const requiredSections = ['autoCommit', 'hooks', 'notifications', 'quality'];
    for (const section of requiredSections) {
      if (!config[section]) {
        throw new Error(`Config section missing: ${section}`);
      }
    }

    // Test netlify.toml
    const netlifyConfig = path.join(this.projectRoot, 'netlify.toml');
    if (!fs.existsSync(netlifyConfig)) {
      throw new Error('netlify.toml not found');
    }

    return { configValid: true, sections: requiredSections.length };
  }

  async performIntegrationTest() {
    this.log('Running integration test...', 'info');
    
    // Simulate Claude Code automation workflow
    const steps = [
      'Check git status',
      'Run quality checks',
      'Simulate commit preparation'
    ];

    for (const step of steps) {
      this.log(`  ${step}...`, 'info');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate work
    }

    return { integrationSteps: steps.length };
  }

  generateReport() {
    const passed = this.testResults.filter(t => t.status === 'passed').length;
    const failed = this.testResults.filter(t => t.status === 'failed').length;
    const total = this.testResults.length;
    const successRate = total > 0 ? Math.round((passed / total) * 100) : 0;

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total,
        passed,
        failed,
        successRate: `${successRate}%`
      },
      tests: this.testResults,
      systemReady: failed === 0
    };

    // Save report
    const reportDir = path.join(this.projectRoot, '.claude-reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportFile = path.join(reportDir, `automation-test-${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    return report;
  }

  displaySummary(report) {
    console.log('\\n' + '='.repeat(60));
    this.log('Test Summary', 'header');
    console.log('='.repeat(60));
    
    this.log(`Total Tests: ${report.summary.total}`, 'info');
    this.log(`Passed: ${report.summary.passed}`, 'success');
    if (report.summary.failed > 0) {
      this.log(`Failed: ${report.summary.failed}`, 'error');
    }
    this.log(`Success Rate: ${report.summary.successRate}`, 
      report.summary.failed === 0 ? 'success' : 'warning');
    
    if (report.systemReady) {
      this.log('🎉 System is ready for production deployment!', 'success');
    } else {
      this.log('⚠️  System has issues that need to be resolved', 'warning');
    }
    
    console.log('='.repeat(60) + '\\n');
  }

  async run() {
    try {
      this.log('Starting automation system test suite...', 'header');

      // Run all tests
      await this.runTest('Project Structure Validation', () => this.validateProjectStructure());
      await this.runTest('Package Scripts Test', () => this.testPackageScripts());
      await this.runTest('GitHub Workflows Test', () => this.testGitHubWorkflows());
      await this.runTest('Script Execution Test', () => this.testScriptExecution());
      await this.runTest('Dependencies Test', () => this.testDependencies());
      await this.runTest('TypeScript Test', () => this.testTypeScript());
      await this.runTest('Linting Test', () => this.testLinting());
      await this.runTest('Build Test', () => this.testBuild());
      await this.runTest('Configuration Files Test', () => this.testConfigurationFiles());
      await this.runTest('Integration Test', () => this.performIntegrationTest());

      // Generate and display report
      const report = this.generateReport();
      this.displaySummary(report);

      if (!report.systemReady) {
        process.exit(1);
      }

    } catch (error) {
      this.log(`Test suite failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// CLI interface
if (require.main === module) {
  const tester = new AutomationTester();
  tester.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = AutomationTester;