#!/usr/bin/env node

/**
 * Error Recovery & Rollback System
 * 
 * このスクリプトは以下の機能を提供：
 * 1. デプロイメントエラーの自動検知
 * 2. 自動ロールバック機能
 * 3. エラー分析・レポート
 * 4. 復旧手順の自動実行
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class ErrorRecovery {
  constructor() {
    this.projectRoot = process.cwd();
    this.config = this.loadConfig();
    this.recoveryId = this.generateRecoveryId();
  }

  loadConfig() {
    const defaultConfig = {
      recovery: {
        enabled: true,
        autoRollback: true,
        maxRetries: 3,
        retryDelayMs: 10000,
        healthCheckUrl: 'https://delaxpm.netlify.app',
        healthCheckTimeout: 30000
      },
      monitoring: {
        checkInterval: 60000, // 1 minute
        alertThreshold: 3, // failures before alert
        recoveryWindow: 300000 // 5 minutes recovery window
      },
      rollback: {
        preserveLogs: true,
        createSnapshot: true,
        notifyOnRollback: true
      },
      notifications: {
        console: true,
        file: true,
        slack: false
      }
    };

    try {
      const configPath = path.join(this.projectRoot, '.claude-config.json');
      if (fs.existsSync(configPath)) {
        const userConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return { ...defaultConfig, ...userConfig.errorRecovery };
      }
    } catch (error) {
      this.log('Failed to load config, using defaults', 'warning');
    }

    return defaultConfig;
  }

  generateRecoveryId() {
    return `recovery-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      warning: chalk.yellow,
      error: chalk.red,
      critical: chalk.bgRed.white.bold,
      header: chalk.cyan.bold
    };
    
    const logMessage = `${chalk.gray(timestamp)} 🚨 Recovery: ${colors[type](message)}`;
    console.log(logMessage);

    if (this.config.notifications.file) {
      this.writeLogFile(logMessage);
    }
  }

  writeLogFile(message) {
    const logDir = path.join(this.projectRoot, '.claude-logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const logFile = path.join(logDir, 'error-recovery.log');
    const plainMessage = message.replace(/\\x1b\\[[0-9;]*m/g, '');
    fs.appendFileSync(logFile, `${new Date().toISOString()} ${plainMessage}\\n`);
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
      return result.trim();
    } catch (error) {
      if (!options.silent) {
        this.log(`Command failed: ${command}`, 'error');
      }
      throw error;
    }
  }

  async detectDeploymentErrors() {
    const errors = [];

    try {
      this.log('Checking for deployment errors...', 'info');

      // 1. Check GitHub Actions status
      try {
        const actionsStatus = await this.executeCommand('gh run list --limit 1 --json status,conclusion', { silent: true });
        const runs = JSON.parse(actionsStatus);
        
        if (runs.length > 0) {
          const latestRun = runs[0];
          if (latestRun.conclusion === 'failure') {
            errors.push({
              type: 'github_actions',
              severity: 'high',
              message: 'Latest GitHub Actions workflow failed',
              source: 'CI/CD Pipeline'
            });
          }
        }
      } catch (error) {
        this.log('Failed to check GitHub Actions status', 'warning');
      }

      // 2. Health check
      const healthResult = await this.performHealthCheck();
      if (!healthResult.healthy) {
        errors.push({
          type: 'health_check',
          severity: 'critical',
          message: `Health check failed: ${healthResult.error}`,
          source: 'Application Health'
        });
      }

      // 3. Check recent logs for errors
      const logErrors = await this.scanRecentLogs();
      errors.push(...logErrors);

      this.log(`Found ${errors.length} potential issues`, errors.length > 0 ? 'warning' : 'success');
      return errors;

    } catch (error) {
      this.log(`Error detection failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async performHealthCheck() {
    try {
      this.log('Performing health check...', 'info');

      const startTime = Date.now();
      const response = await this.makeHttpRequest(this.config.recovery.healthCheckUrl, {
        timeout: this.config.recovery.healthCheckTimeout
      });

      const responseTime = Date.now() - startTime;

      if (response.status === 200) {
        this.log(`✅ Health check passed (${responseTime}ms)`, 'success');
        return { healthy: true, responseTime };
      } else {
        this.log(`❌ Health check failed (HTTP ${response.status})`, 'error');
        return { healthy: false, error: `HTTP ${response.status}`, responseTime };
      }

    } catch (error) {
      this.log(`❌ Health check failed: ${error.message}`, 'error');
      return { healthy: false, error: error.message };
    }
  }

  async makeHttpRequest(url, options = {}) {
    // Simple HTTP request implementation
    const https = require('https');
    const http = require('http');
    
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      const timeout = options.timeout || 30000;

      const req = client.get(url, (res) => {
        resolve({ status: res.statusCode, headers: res.headers });
      });

      req.setTimeout(timeout, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.on('error', reject);
    });
  }

  async scanRecentLogs() {
    const errors = [];
    
    try {
      // Check Netlify deploy logs if available
      const netlifyLogPath = path.join(this.projectRoot, '.netlify');
      if (fs.existsSync(netlifyLogPath)) {
        // Parse deploy logs for errors (implementation would depend on log format)
        this.log('Scanning Netlify logs...', 'info');
      }

      // Check local error logs
      const errorLogPath = path.join(this.projectRoot, '.claude-logs', 'error-recovery.log');
      if (fs.existsSync(errorLogPath)) {
        const recentLogs = this.getRecentLogEntries(errorLogPath, 10);
        const errorEntries = recentLogs.filter(log => log.includes('ERROR') || log.includes('CRITICAL'));
        
        errorEntries.forEach(entry => {
          errors.push({
            type: 'log_error',
            severity: 'medium',
            message: entry,
            source: 'Application Logs'
          });
        });
      }

    } catch (error) {
      this.log('Failed to scan logs', 'warning');
    }

    return errors;
  }

  getRecentLogEntries(logPath, maxEntries) {
    try {
      const content = fs.readFileSync(logPath, 'utf8');
      const lines = content.split('\\n').filter(line => line.trim());
      return lines.slice(-maxEntries);
    } catch (error) {
      return [];
    }
  }

  async analyzeErrors(errors) {
    const analysis = {
      critical: errors.filter(e => e.severity === 'critical').length,
      high: errors.filter(e => e.severity === 'high').length,
      medium: errors.filter(e => e.severity === 'medium').length,
      requiresRollback: false,
      recommendedActions: []
    };

    // Determine if rollback is needed
    if (analysis.critical > 0) {
      analysis.requiresRollback = true;
      analysis.recommendedActions.push('Immediate rollback required');
    } else if (analysis.high > 2) {
      analysis.requiresRollback = true;
      analysis.recommendedActions.push('Multiple high-severity issues detected');
    }

    // Generate recommendations
    errors.forEach(error => {
      switch (error.type) {
        case 'health_check':
          analysis.recommendedActions.push('Check application health endpoints');
          break;
        case 'github_actions':
          analysis.recommendedActions.push('Review CI/CD pipeline logs');
          break;
        case 'log_error':
          analysis.recommendedActions.push('Investigate application error logs');
          break;
      }
    });

    return analysis;
  }

  async executeRollback() {
    if (!this.config.recovery.autoRollback) {
      this.log('Auto-rollback disabled', 'warning');
      return false;
    }

    try {
      this.log('Initiating rollback procedure...', 'critical');

      // 1. Create recovery snapshot
      if (this.config.rollback.createSnapshot) {
        await this.createRecoverySnapshot();
      }

      // 2. Get last successful deployment info
      const lastSuccessfulDeploy = await this.getLastSuccessfulDeploy();
      if (!lastSuccessfulDeploy) {
        throw new Error('No previous successful deployment found');
      }

      this.log(`Rolling back to deployment: ${lastSuccessfulDeploy.sha}`, 'info');

      // 3. Trigger rollback deployment
      await this.triggerRollbackDeploy(lastSuccessfulDeploy);

      // 4. Wait and verify rollback
      await this.verifyRollback();

      this.log('✅ Rollback completed successfully', 'success');
      return true;

    } catch (error) {
      this.log(`❌ Rollback failed: ${error.message}`, 'error');
      return false;
    }
  }

  async createRecoverySnapshot() {
    try {
      this.log('Creating recovery snapshot...', 'info');
      
      const snapshotData = {
        timestamp: new Date().toISOString(),
        recoveryId: this.recoveryId,
        currentCommit: await this.executeCommand('git rev-parse HEAD', { silent: true }),
        deploymentState: 'failed',
        errors: 'captured in error analysis'
      };

      const snapshotDir = path.join(this.projectRoot, '.claude-recovery');
      if (!fs.existsSync(snapshotDir)) {
        fs.mkdirSync(snapshotDir, { recursive: true });
      }

      const snapshotFile = path.join(snapshotDir, `${this.recoveryId}.json`);
      fs.writeFileSync(snapshotFile, JSON.stringify(snapshotData, null, 2));

      this.log(`Recovery snapshot created: ${snapshotFile}`, 'success');
    } catch (error) {
      this.log('Failed to create recovery snapshot', 'warning');
    }
  }

  async getLastSuccessfulDeploy() {
    try {
      // Get recent workflow runs and find the last successful one
      const runsOutput = await this.executeCommand('gh run list --limit 10 --json status,conclusion,headSha', { silent: true });
      const runs = JSON.parse(runsOutput);

      for (const run of runs) {
        if (run.conclusion === 'success') {
          return { sha: run.headSha, status: 'success' };
        }
      }

      return null;
    } catch (error) {
      this.log('Failed to get deployment history', 'error');
      return null;
    }
  }

  async triggerRollbackDeploy(deployment) {
    try {
      this.log('Triggering rollback deployment...', 'info');
      
      // Create a rollback commit
      await this.executeCommand(`git checkout ${deployment.sha}`, { silent: true });
      await this.executeCommand('git checkout -b rollback-emergency', { silent: true });
      await this.executeCommand('git push origin rollback-emergency --force', { silent: true });

      // Trigger deployment workflow
      await this.executeCommand('gh workflow run deploy.yml --ref rollback-emergency');

      this.log('Rollback deployment triggered', 'success');
    } catch (error) {
      throw new Error(`Failed to trigger rollback: ${error.message}`);
    }
  }

  async verifyRollback() {
    this.log('Verifying rollback...', 'info');
    
    // Wait for deployment to complete
    await this.sleep(30000); // 30 seconds

    // Perform health check
    const healthResult = await this.performHealthCheck();
    if (!healthResult.healthy) {
      throw new Error('Rollback verification failed - health check still failing');
    }

    this.log('✅ Rollback verification successful', 'success');
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async generateRecoveryReport(errors, analysis, rollbackExecuted) {
    const report = {
      recoveryId: this.recoveryId,
      timestamp: new Date().toISOString(),
      errors,
      analysis,
      rollbackExecuted,
      status: rollbackExecuted ? 'recovered' : 'requires_manual_intervention'
    };

    const reportFile = path.join(this.projectRoot, '.claude-reports', `recovery-${this.recoveryId}.json`);
    const reportDir = path.dirname(reportFile);

    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    this.log(`Recovery report saved: ${reportFile}`, 'info');

    return report;
  }

  async run() {
    if (!this.config.recovery.enabled) {
      this.log('Error recovery disabled', 'warning');
      return;
    }

    try {
      this.log('Starting error recovery system...', 'header');

      // 1. Detect errors
      const errors = await this.detectDeploymentErrors();

      if (errors.length === 0) {
        this.log('✅ No errors detected - system healthy', 'success');
        return;
      }

      // 2. Analyze errors
      const analysis = await this.analyzeErrors(errors);
      this.log(`Error analysis: ${analysis.critical} critical, ${analysis.high} high, ${analysis.medium} medium`, 'warning');

      // 3. Execute rollback if needed
      let rollbackExecuted = false;
      if (analysis.requiresRollback) {
        this.log('Errors require rollback - initiating recovery', 'critical');
        rollbackExecuted = await this.executeRollback();
      }

      // 4. Generate report
      await this.generateRecoveryReport(errors, analysis, rollbackExecuted);

      if (rollbackExecuted) {
        this.log('🎉 System recovered successfully', 'success');
      } else {
        this.log('⚠️ Manual intervention may be required', 'warning');
      }

    } catch (error) {
      this.log(`Recovery system failed: ${error.message}`, 'critical');
      process.exit(1);
    }
  }
}

// CLI interface
if (require.main === module) {
  const recovery = new ErrorRecovery();
  recovery.run().catch(error => {
    console.error(chalk.red('Fatal error in recovery system:'), error);
    process.exit(1);
  });
}

module.exports = ErrorRecovery;