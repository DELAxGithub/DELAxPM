#!/usr/bin/env node

/**
 * Auto-Commit Script for Claude Code Integration
 * 
 * このスクリプトはClaude Codeでコード生成後に自動的に：
 * 1. 変更ファイルを検出
 * 2. 品質チェック実行
 * 3. 自動コミット・プッシュ
 * 4. CI/CDパイプライン起動
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class AutoCommit {
  constructor() {
    this.projectRoot = process.cwd();
    this.config = this.loadConfig();
  }

  loadConfig() {
    const defaultConfig = {
      enabled: true,
      autoTest: true,
      autoPush: true,
      commitPrefix: '🤖 Auto:',
      qualityGates: true,
      maxFileSize: 1024 * 1024, // 1MB
      excludePatterns: [
        'node_modules/**',
        '.next/**',
        'dist/**',
        '*.log',
        '.env*'
      ]
    };

    try {
      const configPath = path.join(this.projectRoot, '.claude-config.json');
      if (fs.existsSync(configPath)) {
        const userConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return { ...defaultConfig, ...userConfig };
      }
    } catch (error) {
      console.warn(chalk.yellow('⚠️ Failed to load .claude-config.json, using defaults'));
    }

    return defaultConfig;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      warning: chalk.yellow,
      error: chalk.red
    };
    
    console.log(`${chalk.gray(timestamp)} ${colors[type] || chalk.blue}(message)`);
  }

  async executeCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        const result = execSync(command, {
          cwd: this.projectRoot,
          encoding: 'utf8',
          ...options
        });
        resolve(result.trim());
      } catch (error) {
        reject(error);
      }
    });
  }

  async checkGitStatus() {
    try {
      const status = await this.executeCommand('git status --porcelain');
      return status.split('\\n').filter(line => line.trim()).length > 0;
    } catch (error) {
      this.log('Git status check failed', 'error');
      throw error;
    }
  }

  async getChangedFiles() {
    try {
      const status = await this.executeCommand('git status --porcelain');
      return status
        .split('\\n')
        .filter(line => line.trim())
        .map(line => {
          const match = line.match(/^\\s*[AMDRC?]\\s+(.+)$/);
          return match ? match[1] : null;
        })
        .filter(Boolean);
    } catch (error) {
      this.log('Failed to get changed files', 'error');
      throw error;
    }
  }

  async runQualityGates() {
    if (!this.config.qualityGates) {
      this.log('Quality gates disabled, skipping', 'warning');
      return true;
    }

    this.log('🔍 Running quality gates...', 'info');

    const checks = [
      {
        name: 'TypeScript Type Check',
        command: 'pnpm type-check',
        required: true
      },
      {
        name: 'ESLint Check',
        command: 'pnpm lint',
        required: true
      },
      {
        name: 'Build Check',
        command: 'pnpm build:unified',
        required: false
      }
    ];

    for (const check of checks) {
      try {
        this.log(`Running ${check.name}...`, 'info');
        await this.executeCommand(check.command);
        this.log(`✅ ${check.name} passed`, 'success');
      } catch (error) {
        this.log(`❌ ${check.name} failed`, 'error');
        if (check.required) {
          this.log('Required quality gate failed, aborting commit', 'error');
          return false;
        }
      }
    }

    return true;
  }

  async generateCommitMessage(changedFiles) {
    const categories = {
      feat: [], fix: [], docs: [], style: [], refactor: [], test: [], chore: []
    };

    // Categorize changes
    changedFiles.forEach(file => {
      const ext = path.extname(file);
      const dir = path.dirname(file);
      
      if (file.includes('test') || file.includes('spec')) {
        categories.test.push(file);
      } else if (ext === '.md' || dir.includes('docs')) {
        categories.docs.push(file);
      } else if (ext === '.css' || ext === '.scss' || file.includes('style')) {
        categories.style.push(file);
      } else if (ext === '.ts' || ext === '.tsx' || ext === '.js' || ext === '.jsx') {
        // Simple heuristic: if it's a new file, it's probably a feature
        try {
          const gitLog = execSync(`git log --oneline -- "${file}"`, { encoding: 'utf8', stdio: 'pipe' });
          if (!gitLog.trim()) {
            categories.feat.push(file);
          } else {
            categories.fix.push(file);
          }
        } catch {
          categories.feat.push(file);
        }
      } else {
        categories.chore.push(file);
      }
    });

    // Generate message
    const messages = [];
    Object.entries(categories).forEach(([type, files]) => {
      if (files.length > 0) {
        messages.push(`${type}: ${files.length} file(s)`);
      }
    });

    const summary = messages.join(', ');
    const fileList = changedFiles.slice(0, 5).join(', ') + 
                    (changedFiles.length > 5 ? ` and ${changedFiles.length - 5} more` : '');

    return `${this.config.commitPrefix} ${summary}

Files: ${fileList}

Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>`;
  }

  async createCommit(message) {
    try {
      // Add all changes
      await this.executeCommand('git add .');
      
      // Create commit
      await this.executeCommand(`git commit -m "${message.replace(/"/g, '\\"')}"`);
      
      this.log('✅ Commit created successfully', 'success');
      return true;
    } catch (error) {
      this.log('❌ Failed to create commit', 'error');
      throw error;
    }
  }

  async pushChanges() {
    if (!this.config.autoPush) {
      this.log('Auto-push disabled, skipping', 'warning');
      return;
    }

    try {
      // Get current branch
      const branch = await this.executeCommand('git branch --show-current');
      
      this.log(`🚀 Pushing to origin/${branch}...`, 'info');
      await this.executeCommand(`git push origin ${branch}`);
      
      this.log('✅ Changes pushed successfully', 'success');
    } catch (error) {
      this.log('❌ Failed to push changes', 'error');
      throw error;
    }
  }

  async run() {
    if (!this.config.enabled) {
      this.log('Auto-commit disabled in config', 'warning');
      return;
    }

    try {
      this.log('🤖 Starting auto-commit process...', 'info');

      // Check if there are any changes
      const hasChanges = await this.checkGitStatus();
      if (!hasChanges) {
        this.log('No changes detected, nothing to commit', 'info');
        return;
      }

      // Get changed files
      const changedFiles = await this.getChangedFiles();
      this.log(`📁 Found ${changedFiles.length} changed files`, 'info');

      // Run quality gates
      const qualityPassed = await this.runQualityGates();
      if (!qualityPassed) {
        this.log('❌ Quality gates failed, aborting auto-commit', 'error');
        process.exit(1);
      }

      // Generate commit message
      const commitMessage = await this.generateCommitMessage(changedFiles);
      this.log('📝 Generated commit message', 'info');

      // Create commit
      await this.createCommit(commitMessage);

      // Push changes
      await this.pushChanges();

      this.log('🎉 Auto-commit process completed successfully!', 'success');
      this.log('🚀 CI/CD pipeline should start automatically', 'info');

    } catch (error) {
      this.log(`❌ Auto-commit failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// CLI interface
if (require.main === module) {
  const autoCommit = new AutoCommit();
  autoCommit.run().catch(error => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  });
}

module.exports = AutoCommit;