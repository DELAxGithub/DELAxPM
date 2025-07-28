#!/usr/bin/env node

/**
 * Claude Code Integration Hooks
 * 
 * このスクリプトはClaude Codeの作業完了時に自動実行される統合フックです。
 * 以下の機能を提供：
 * 1. 作業完了検知
 * 2. 自動品質チェック
 * 3. 自動コミット・デプロイ
 * 4. 進捗レポート生成
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class ClaudeHooks {
  constructor() {
    this.projectRoot = process.cwd();
    this.config = this.loadConfig();
    this.sessionId = this.generateSessionId();
  }

  loadConfig() {
    const defaultConfig = {
      hooks: {
        enabled: true,
        autoCommit: true,
        autoTest: true,
        autoDeploy: false, // Deploy only on explicit request
        generateReport: true
      },
      notifications: {
        console: true,
        file: true,
        slack: false
      },
      quality: {
        requireTests: true,
        requireLint: true,
        requireBuild: true
      }
    };

    try {
      const configPath = path.join(this.projectRoot, '.claude-config.json');
      if (fs.existsSync(configPath)) {
        const userConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return this.mergeDeep(defaultConfig, userConfig);
      }
    } catch (error) {
      this.log('Failed to load config, using defaults', 'warning');
    }

    return defaultConfig;
  }

  mergeDeep(target, source) {
    const output = Object.assign({}, target);
    Object.keys(source).forEach(key => {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        output[key] = this.mergeDeep(target[key] || {}, source[key]);
      } else {
        output[key] = source[key];
      }
    });
    return output;
  }

  generateSessionId() {
    return `claude-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      warning: chalk.yellow,
      error: chalk.red,
      header: chalk.cyan.bold
    };
    
    const prefix = type === 'header' ? '🤖 Claude Code:' : '   →';
    console.log(`${chalk.gray(timestamp)} ${prefix} ${colors[type](message)}`);
  }

  async executeCommand(command, options = {}) {
    try {
      const result = execSync(command, {
        cwd: this.projectRoot,
        encoding: 'utf8',
        stdio: options.silent ? 'pipe' : 'inherit',
        ...options
      });
      return result.trim();
    } catch (error) {
      if (!options.silent) {
        this.log(`Command failed: ${command}`, 'error');
      }
      throw error;
    }
  }

  async detectWorkCompletion() {
    try {
      // Check for recent file modifications (within last 5 minutes)
      const recentFiles = await this.executeCommand(
        `find . -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs ls -lt | head -10`,
        { silent: true }
      );

      // Check git status for uncommitted changes
      const gitStatus = await this.executeCommand('git status --porcelain', { silent: true });
      
      return {
        hasRecentChanges: recentFiles.length > 0,
        hasUncommittedChanges: gitStatus.length > 0,
        changedFiles: this.parseGitStatus(gitStatus)
      };
    } catch (error) {
      this.log('Failed to detect work completion', 'error');
      return { hasRecentChanges: false, hasUncommittedChanges: false, changedFiles: [] };
    }
  }

  parseGitStatus(status) {
    return status
      .split('\\n')
      .filter(line => line.trim())
      .map(line => {
        const match = line.match(/^\\s*([AMDRC?])\\s+(.+)$/);
        return match ? { status: match[1], file: match[2] } : null;
      })
      .filter(Boolean);
  }

  async runQualityChecks() {
    this.log('Running quality checks...', 'info');
    
    const checks = [
      {
        name: 'TypeScript Check',
        command: 'pnpm type-check',
        required: this.config.quality.requireLint,
        timeout: 30000
      },
      {
        name: 'ESLint',
        command: 'pnpm lint',
        required: this.config.quality.requireLint,
        timeout: 20000
      },
      {
        name: 'Build Test',
        command: 'pnpm build:unified',
        required: this.config.quality.requireBuild,
        timeout: 60000
      }
    ];

    const results = {};
    
    for (const check of checks) {
      try {
        this.log(`  Checking: ${check.name}`, 'info');
        await this.executeCommand(check.command, { 
          silent: false,
          timeout: check.timeout 
        });
        results[check.name] = { status: 'passed', required: check.required };
        this.log(`  ✅ ${check.name} passed`, 'success');
      } catch (error) {
        results[check.name] = { 
          status: 'failed', 
          required: check.required,
          error: error.message 
        };
        this.log(`  ❌ ${check.name} failed`, 'error');
        
        if (check.required) {
          throw new Error(`Required check ${check.name} failed`);
        }
      }
    }

    return results;
  }

  async generateWorkReport(workDetection, qualityResults) {
    const report = {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      workDetection,
      qualityResults,
      summary: this.generateSummary(workDetection, qualityResults)
    };

    // Save to file if configured
    if (this.config.notifications.file) {
      const reportsDir = path.join(this.projectRoot, '.claude-reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }
      
      const reportFile = path.join(reportsDir, `${this.sessionId}.json`);
      fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
      this.log(`Report saved: ${reportFile}`, 'info');
    }

    return report;
  }

  generateSummary(workDetection, qualityResults) {
    const totalChecks = Object.keys(qualityResults).length;
    const passedChecks = Object.values(qualityResults).filter(r => r.status === 'passed').length;
    const failedChecks = totalChecks - passedChecks;
    
    return {
      filesChanged: workDetection.changedFiles.length,
      qualityScore: totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 100,
      checksTotal: totalChecks,
      checksPassed: passedChecks,
      checksFailed: failedChecks,
      overallStatus: failedChecks === 0 ? 'success' : 'warning'
    };
  }

  async triggerAutoCommit() {
    if (!this.config.hooks.autoCommit) {
      this.log('Auto-commit disabled', 'warning');
      return false;
    }

    try {
      this.log('Triggering auto-commit...', 'info');
      await this.executeCommand('node scripts/auto-commit.js');
      return true;
    } catch (error) {
      this.log('Auto-commit failed', 'error');
      return false;
    }
  }

  async triggerDeployment() {
    if (!this.config.hooks.autoDeploy) {
      this.log('Auto-deploy disabled', 'info');
      return false;
    }

    try {
      this.log('Triggering deployment...', 'info');
      // Trigger GitHub Actions workflow
      await this.executeCommand('gh workflow run deploy.yml');
      this.log('Deployment workflow triggered', 'success');
      return true;
    } catch (error) {
      this.log('Failed to trigger deployment', 'error');
      return false;
    }
  }

  async sendNotifications(report) {
    if (this.config.notifications.console) {
      this.displayConsoleReport(report);
    }

    // Future: Add Slack/email notifications
    if (this.config.notifications.slack) {
      // TODO: Implement Slack notifications
      this.log('Slack notifications not yet implemented', 'warning');
    }
  }

  displayConsoleReport(report) {
    const { summary } = report;
    
    console.log('\\n' + '='.repeat(60));
    this.log('Claude Code Session Complete', 'header');
    console.log('='.repeat(60));
    
    this.log(`Session ID: ${report.sessionId}`, 'info');
    this.log(`Files Modified: ${summary.filesChanged}`, 'info');
    this.log(`Quality Score: ${summary.qualityScore}%`, 
      summary.qualityScore >= 80 ? 'success' : 'warning');
    this.log(`Quality Checks: ${summary.checksPassed}/${summary.checksTotal} passed`, 
      summary.checksFailed === 0 ? 'success' : 'warning');
    
    if (summary.overallStatus === 'success') {
      this.log('🎉 All systems green - ready for deployment!', 'success');
    } else {
      this.log('⚠️  Some issues detected - review before deployment', 'warning');
    }
    
    console.log('='.repeat(60) + '\\n');
  }

  async run() {
    if (!this.config.hooks.enabled) {
      this.log('Hooks disabled in configuration', 'warning');
      return;
    }

    try {
      this.log('Starting Claude Code integration hooks...', 'header');

      // 1. Detect work completion
      const workDetection = await this.detectWorkCompletion();
      
      if (!workDetection.hasUncommittedChanges) {
        this.log('No uncommitted changes detected', 'info');
        return;
      }

      this.log(`Detected ${workDetection.changedFiles.length} modified files`, 'info');

      // 2. Run quality checks
      let qualityResults = {};
      if (this.config.hooks.autoTest) {
        try {
          qualityResults = await this.runQualityChecks();
        } catch (error) {
          this.log('Quality checks failed - aborting automation', 'error');
          qualityResults = { error: error.message };
        }
      }

      // 3. Generate report
      const report = await this.generateWorkReport(workDetection, qualityResults);

      // 4. Auto-commit if quality checks passed
      if (this.config.hooks.autoCommit && !qualityResults.error) {
        await this.triggerAutoCommit();
      }

      // 5. Auto-deploy if configured and everything passed
      if (this.config.hooks.autoDeploy && report.summary.overallStatus === 'success') {
        await this.triggerDeployment();
      }

      // 6. Send notifications
      await this.sendNotifications(report);

    } catch (error) {
      this.log(`Hook execution failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// CLI interface
if (require.main === module) {
  const hooks = new ClaudeHooks();
  hooks.run().catch(error => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  });
}

module.exports = ClaudeHooks;