# 🤖 DELAxPM 完全自動化CI/CDシステム セットアップガイド

Claude Codeで機能追加要望 → 自動コード生成・テスト・本番デプロイまで完全自動化されたシステムです。

## 🚀 システム概要

このシステムにより、以下のワークフローが完全自動化されます：

1. **Claude Codeで機能追加要望** 
2. **自動コード生成・品質チェック**
3. **自動コミット・プッシュ**
4. **GitHub Actions CI/CD起動**
5. **Supabaseマイグレーション自動実行**
6. **本番環境への自動デプロイ**
7. **ヘルスチェック・通知**

## 📋 必要なセットアップ

### 1. GitHub Secrets設定

以下のSecretsをGitHubリポジトリに設定してください：

```bash
# Supabase関連
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_ACCESS_TOKEN=your-access-token
SUPABASE_PROJECT_ID=your-project-id

# Netlify関連
NETLIFY_AUTH_TOKEN=your-netlify-auth-token
NETLIFY_SITE_ID=your-site-id

# 通知関連（オプション）
SLACK_WEBHOOK_URL=your-slack-webhook
NOTIFICATION_EMAIL=your-email@example.com
DISCORD_WEBHOOK_URL=your-discord-webhook
```

### 2. GitHub CLI セットアップ

ローカル環境でGitHub CLIをセットアップ：

```bash
# GitHub CLI インストール（macOS）
brew install gh

# 認証
gh auth login

# リポジトリに接続
gh repo set-default
```

### 3. Supabase CLI セットアップ

```bash
# Supabase CLI インストール
npm install -g supabase

# プロジェクトにリンク
cd supabase
supabase login
supabase link --project-ref your-project-id
```

## 🔧 使用方法

### Claude Codeでの自動化実行

#### 1. 基本的な自動化
```bash
# 変更検知・品質チェック・自動コミット
pnpm claude:auto

# フル自動化（コミット + デプロイ）
pnpm claude:full
```

#### 2. 個別実行
```bash
# 自動コミットのみ
pnpm claude:commit

# 品質チェックのみ
pnpm claude:check

# デプロイトリガーのみ
pnpm claude:deploy
```

#### 3. 手動テスト実行
```bash
# GitHub Actions テスト実行
pnpm claude:test

# 自動化システムテスト
node scripts/test-automation.js
```

### 設定のカスタマイズ

`.claude-config.json` で動作をカスタマイズできます：

```json
{
  "autoCommit": {
    "enabled": true,
    "autoTest": true,
    "autoPush": true,
    "qualityGates": true
  },
  "hooks": {
    "autoCommit": true,
    "autoTest": true,
    "autoDeploy": false  // 本番は手動トリガー推奨
  },
  "notifications": {
    "slack": true,
    "email": false
  }
}
```

## 🎯 完全自動化ワークフロー

### Claude Codeでの典型的な作業フロー

1. **機能追加要望**
   ```
   「ユーザー管理機能を追加して」
   ```

2. **Claude Codeが自動実行**
   - コード生成
   - 品質チェック（TypeScript、ESLint、ビルド）
   - 自動コミット・プッシュ
   - GitHub Actions起動

3. **CI/CDパイプライン自動実行**
   - ビルド＆テスト
   - データベースマイグレーション
   - Netlifyデプロイ
   - ヘルスチェック

4. **結果通知**
   - デプロイ成功/失敗通知
   - エラー時の自動ロールバック
   - https://delaxpm.netlify.app で確認

## 🚨 エラーハンドリング

### 自動復旧機能

- **品質チェック失敗**: 自動コミットを停止、問題点を通知
- **デプロイ失敗**: 自動ロールバック実行
- **ヘルスチェック失敗**: 前回成功版への復旧

### 手動復旧コマンド

```bash
# エラー復旧システム実行
node scripts/error-recovery.js

# Supabaseマイグレーション手動実行
node scripts/supabase-auto-migrate.js

# 通知システムテスト
node scripts/notification-system.js deployment_success
```

## 📊 監視・レポート

### ログとレポート

- **自動化ログ**: `.claude-logs/` 
- **テストレポート**: `.claude-reports/`
- **復旧スナップショット**: `.claude-recovery/`

### 通知チャンネル

- **Slack**: #deployments チャンネル
- **メール**: 設定したアドレスに送信
- **GitHub**: コミットコメント、Issue作成

## 🎮 よく使うコマンド

```bash
# 開発環境起動
pnpm dev:unified

# 品質チェック実行
pnpm claude:check

# 自動化テスト
node scripts/test-automation.js

# データベース状態確認
pnpm db:status

# 本番デプロイ実行
pnpm deploy:prod
```

## 🔍 トラブルシューティング

### よくある問題

1. **GitHub Actions失敗**
   - Secrets設定を確認
   - `gh workflow run deploy.yml` で手動実行

2. **Supabaseマイグレーション失敗**
   - `supabase status` で接続確認
   - 手動マイグレーション実行

3. **ビルドエラー**
   - `pnpm claude:check` で詳細確認
   - 依存関係の再インストール

### サポート

- **ログ確認**: `.claude-logs/` ディレクトリ
- **テスト実行**: `node scripts/test-automation.js`
- **設定検証**: `.claude-config.json` 確認

## 🎉 完成！

これで、Claude Codeに「○○機能を追加して」と伝えるだけで、本番環境までの全てが自動化されました！

**次回から**: 機能追加要望 → 自動でhttps://delaxpm.netlify.app に反映 🚀