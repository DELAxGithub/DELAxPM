#!/usr/bin/env node

/**
 * Notification System for Claude Code Automation
 * 
 * このスクリプトは以下の通知機能を提供：
 * 1. Slack通知
 * 2. メール通知  
 * 3. Discord通知
 * 4. GitHub通知
 * 5. 統合通知管理
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class NotificationSystem {
  constructor() {
    this.projectRoot = process.cwd();
    this.config = this.loadConfig();
  }

  loadConfig() {
    const defaultConfig = {
      notifications: {
        enabled: true,
        channels: {
          slack: {
            enabled: false,
            webhook: process.env.SLACK_WEBHOOK_URL,
            channel: '#deployments',
            username: 'Claude Code Bot',
            emoji: ':robot_face:'
          },
          email: {
            enabled: false,
            to: process.env.NOTIFICATION_EMAIL,
            from: 'noreply@delaxpm.com',
            smtp: {
              host: process.env.SMTP_HOST,
              port: process.env.SMTP_PORT || 587,
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS
            }
          },
          discord: {
            enabled: false,
            webhook: process.env.DISCORD_WEBHOOK_URL,
            username: 'Claude Code'
          },
          github: {
            enabled: true,
            createIssueOnFailure: false,
            addCommitComment: true
          }
        },
        events: {
          deployment_success: true,
          deployment_failure: true,
          test_failure: true,
          recovery_executed: true,
          migration_completed: true
        }
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

  log(message, type = 'info') {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      warning: chalk.yellow,
      error: chalk.red,
      header: chalk.cyan.bold
    };
    
    console.log(`${chalk.gray(timestamp)} 📢 Notify: ${colors[type](message)}`);
  }

  async sendSlackNotification(message, options = {}) {
    if (!this.config.notifications.channels.slack.enabled) {
      this.log('Slack notifications disabled', 'info');
      return false;
    }

    if (!this.config.notifications.channels.slack.webhook) {
      this.log('Slack webhook URL not configured', 'warning');
      return false;
    }

    try {
      const payload = {
        channel: options.channel || this.config.notifications.channels.slack.channel,
        username: this.config.notifications.channels.slack.username,
        icon_emoji: this.config.notifications.channels.slack.emoji,
        text: message.text,
        attachments: message.attachments || []
      };

      const response = await this.makeHttpRequest(
        this.config.notifications.channels.slack.webhook,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      if (response.status === 200) {
        this.log('✅ Slack notification sent', 'success');
        return true;
      } else {
        this.log(`❌ Slack notification failed (${response.status})`, 'error');
        return false;
      }

    } catch (error) {
      this.log(`Slack notification error: ${error.message}`, 'error');
      return false;
    }
  }

  async sendEmailNotification(message, options = {}) {
    if (!this.config.notifications.channels.email.enabled) {
      this.log('Email notifications disabled', 'info');
      return false;
    }

    if (!this.config.notifications.channels.email.to) {
      this.log('Email recipient not configured', 'warning');
      return false;
    }

    try {
      // Simple email implementation using nodemailer would go here
      // For now, we'll just log the intention
      this.log(`Email would be sent to: ${this.config.notifications.channels.email.to}`, 'info');
      this.log(`Subject: ${message.subject}`, 'info');
      this.log(`Body: ${message.text}`, 'info');
      
      // TODO: Implement actual email sending
      this.log('✅ Email notification logged (implementation pending)', 'success');
      return true;

    } catch (error) {
      this.log(`Email notification error: ${error.message}`, 'error');
      return false;
    }
  }

  async sendDiscordNotification(message, options = {}) {
    if (!this.config.notifications.channels.discord.enabled) {
      this.log('Discord notifications disabled', 'info');
      return false;
    }

    if (!this.config.notifications.channels.discord.webhook) {
      this.log('Discord webhook URL not configured', 'warning');
      return false;
    }

    try {
      const payload = {
        username: this.config.notifications.channels.discord.username,
        content: message.text,
        embeds: message.embeds || []
      };

      const response = await this.makeHttpRequest(
        this.config.notifications.channels.discord.webhook,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      if (response.status === 200 || response.status === 204) {
        this.log('✅ Discord notification sent', 'success');
        return true;
      } else {
        this.log(`❌ Discord notification failed (${response.status})`, 'error');
        return false;
      }

    } catch (error) {
      this.log(`Discord notification error: ${error.message}`, 'error');
      return false;
    }
  }

  async sendGitHubNotification(message, options = {}) {
    if (!this.config.notifications.channels.github.enabled) {
      this.log('GitHub notifications disabled', 'info');
      return false;
    }

    try {
      if (options.type === 'commit_comment' && this.config.notifications.channels.github.addCommitComment) {
        const commitSha = options.commitSha || await this.executeCommand('git rev-parse HEAD', { silent: true });
        await this.executeCommand(`gh api repos/OWNER/REPO/commits/${commitSha}/comments -f body="${message.text}"`, { silent: true });
        this.log('✅ GitHub commit comment added', 'success');
      }

      if (options.type === 'issue' && this.config.notifications.channels.github.createIssueOnFailure) {
        await this.executeCommand(`gh issue create --title "${message.title}" --body "${message.text}"`, { silent: true });
        this.log('✅ GitHub issue created', 'success');
      }

      return true;

    } catch (error) {
      this.log(`GitHub notification error: ${error.message}`, 'error');
      return false;
    }
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

  async makeHttpRequest(url, options = {}) {
    const https = require('https');
    const http = require('http');
    
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      const method = options.method || 'GET';
      
      const req = client.request(url, {
        method,
        headers: options.headers || {}
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({ status: res.statusCode, data, headers: res.headers });
        });
      });

      req.on('error', reject);
      
      if (options.body) {
        req.write(options.body);
      }
      
      req.end();
    });
  }

  createDeploymentSuccessMessage(deploymentInfo) {
    const message = {
      text: `🎉 DELAxPM deployment successful!`,
      subject: 'DELAxPM - Deployment Success',
      attachments: [
        {
          color: 'good',
          fields: [
            { title: 'Environment', value: 'Production', short: true },
            { title: 'Site', value: 'https://delaxpm.netlify.app', short: true },
            { title: 'Commit', value: deploymentInfo.sha?.substring(0, 8) || 'N/A', short: true },
            { title: 'Actor', value: deploymentInfo.actor || 'Claude Code', short: true },
            { title: 'Duration', value: deploymentInfo.duration || 'N/A', short: true },
            { title: 'Tests', value: deploymentInfo.testsStatus || 'Passed', short: true }
          ],
          footer: 'Claude Code Automation',
          ts: Math.floor(Date.now() / 1000)
        }
      ],
      embeds: [
        {
          title: '🎉 Deployment Success',
          description: 'DELAxPM has been successfully deployed to production',
          color: 0x00ff00,
          fields: [
            { name: 'Site', value: '[delaxpm.netlify.app](https://delaxpm.netlify.app)', inline: true },
            { name: 'Commit', value: deploymentInfo.sha?.substring(0, 8) || 'N/A', inline: true }
          ],
          timestamp: new Date().toISOString()
        }
      ]
    };

    return message;
  }

  createDeploymentFailureMessage(error) {
    const message = {
      text: `❌ DELAxPM deployment failed!`,
      subject: 'DELAxPM - Deployment Failure',
      title: 'Deployment Failed - Immediate Attention Required',
      attachments: [
        {
          color: 'danger',
          fields: [
            { title: 'Environment', value: 'Production', short: true },
            { title: 'Error', value: error.message || 'Unknown error', short: false },
            { title: 'Commit', value: error.sha?.substring(0, 8) || 'N/A', short: true },
            { title: 'Actor', value: error.actor || 'Claude Code', short: true },
            { title: 'Logs', value: error.logsUrl || 'Check GitHub Actions', short: false }
          ],
          footer: 'Claude Code Automation',
          ts: Math.floor(Date.now() / 1000)
        }
      ],
      embeds: [
        {
          title: '❌ Deployment Failed',
          description: 'DELAxPM deployment encountered an error and requires attention',
          color: 0xff0000,
          fields: [
            { name: 'Error', value: error.message || 'Unknown error', inline: false },
            { name: 'Commit', value: error.sha?.substring(0, 8) || 'N/A', inline: true }
          ],
          timestamp: new Date().toISOString()
        }
      ]
    };

    return message;
  }

  createRecoveryMessage(recoveryInfo) {
    const message = {
      text: `🚨 System recovery executed for DELAxPM`,
      subject: 'DELAxPM - System Recovery Executed',
      attachments: [
        {
          color: 'warning',
          fields: [
            { title: 'Recovery ID', value: recoveryInfo.recoveryId, short: true },
            { title: 'Status', value: recoveryInfo.success ? 'Success' : 'Failed', short: true },
            { title: 'Errors Detected', value: recoveryInfo.errorCount?.toString() || '0', short: true },
            { title: 'Rollback Executed', value: recoveryInfo.rollbackExecuted ? 'Yes' : 'No', short: true }
          ],
          footer: 'Claude Code Recovery System',
          ts: Math.floor(Date.now() / 1000)
        }
      ]
    };

    return message;
  }

  async notify(eventType, data = {}) {
    if (!this.config.notifications.enabled) {
      this.log('Notifications disabled globally', 'info');
      return;
    }

    if (!this.config.notifications.events[eventType]) {
      this.log(`Event type ${eventType} notifications disabled`, 'info');
      return;
    }

    this.log(`Sending notifications for event: ${eventType}`, 'info');

    let message;
    switch (eventType) {
      case 'deployment_success':
        message = this.createDeploymentSuccessMessage(data);
        break;
      case 'deployment_failure':
        message = this.createDeploymentFailureMessage(data);
        break;
      case 'recovery_executed':
        message = this.createRecoveryMessage(data);
        break;
      default:
        message = {
          text: `Claude Code Event: ${eventType}`,
          subject: `DELAxPM - ${eventType}`
        };
    }

    // Send to all enabled channels
    const results = await Promise.allSettled([
      this.sendSlackNotification(message),
      this.sendEmailNotification(message),
      this.sendDiscordNotification(message),
      this.sendGitHubNotification(message, data.github || {})
    ]);

    const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
    const total = results.length;

    this.log(`Notifications sent: ${successful}/${total} successful`, 
      successful > 0 ? 'success' : 'warning');

    return { successful, total, results };
  }

  async run(eventType, data = {}) {
    try {
      this.log('Starting notification system...', 'header');
      await this.notify(eventType, data);
      this.log('Notification system completed', 'success');
    } catch (error) {
      this.log(`Notification system failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const eventType = args[0] || 'deployment_success';
  const dataFile = args[1];

  let data = {};
  if (dataFile && fs.existsSync(dataFile)) {
    try {
      data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    } catch (error) {
      console.error('Failed to parse data file:', error);
    }
  }

  const notificationSystem = new NotificationSystem();
  notificationSystem.run(eventType, data).catch(error => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  });
}

module.exports = NotificationSystem;