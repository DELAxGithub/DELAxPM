# 🚀 Supabase CLI自動化セットアップガイド

## 📋 必要なGitHub Secrets

GitHubリポジトリの Settings > Secrets and variables > Actions で以下を設定：

### ステージング環境 (staging)
```
SUPABASE_ACCESS_TOKEN=sbp_xxx...xxx
SUPABASE_PROJECT_REF=pfrzcteapmwufnovmmfc
SUPABASE_DB_PASSWORD=your_database_password
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

### 本番環境 (production) - 将来用
```
PRODUCTION_SUPABASE_ACCESS_TOKEN=sbp_xxx...xxx
PRODUCTION_SUPABASE_PROJECT_REF=your_production_project_ref
PRODUCTION_SUPABASE_DB_PASSWORD=your_production_db_password
```

## 🔧 ローカル開発環境の設定

### 1. Supabase CLIのインストール
```bash
# macOS
brew install supabase/tap/supabase

# Linux/Windows
https://supabase.com/docs/guides/cli/getting-started#installing-the-supabase-cli
```

### 2. プロジェクトの初期化
```bash
# リポジトリをクローン
git clone <repository>
cd DELAxPM

# 依存関係をインストール
pnpm install

# Supabaseプロジェクトとリンク（必要な場合のみ）
cd supabase
supabase link --project-ref pfrzcteapmwufnovmmfc
```

### 3. 環境変数の設定
```bash
# .env.localを作成（既に存在する場合はスキップ）
cp apps/unified/.env.example apps/unified/.env.local

# 必要に応じて値を調整
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## 🚀 利用可能なコマンド

### データベース管理
```bash
# ローカルSupabaseを起動
pnpm db:start

# マイグレーションを実行（本番環境）
pnpm db:migrate

# ローカルデータベースをリセット
pnpm db:reset

# データベースの状態確認
pnpm db:status

# スキーマの差分確認
pnpm db:diff

# ローカルSupabaseを停止
pnpm db:stop
```

### 開発ワークフロー
```bash
# データベース付きで開発サーバー起動
pnpm dev:with-db

# 初回セットアップ（ローカルDB起動 + マイグレーション）
pnpm db:setup

# 通常の開発サーバー起動
pnpm dev:unified
```

## 🤖 自動化ワークフロー

### GitHub Actions
1. **プルリクエスト時**: 自動でマイグレーション検証
2. **マスターブランチプッシュ時**: ステージング環境に自動デプロイ
3. **手動実行**: 本番環境への安全なデプロイ

### 実行パイプライン
```
Code Push → Validation → Staging → (Manual Approval) → Production
```

## 🔍 トラブルシューティング

### よくある問題

#### 1. `supabase command not found`
```bash
# Supabase CLIを再インストール
brew reinstall supabase/tap/supabase

# PATHを確認
echo $PATH
which supabase
```

#### 2. マイグレーションエラー
```bash
# ローカル環境をリセット
pnpm db:stop
pnpm db:start
pnpm db:migrate
```

#### 3. 認証エラー
```bash
# アクセストークンを再設定
supabase login
# または環境変数で指定
export SUPABASE_ACCESS_TOKEN=sbp_xxx...xxx
```

#### 4. GitHub Actions失敗
- Secretsが正しく設定されているか確認
- ワークフロー権限を確認
- ログでエラーメッセージを確認

## 🎯 ベストプラクティス

### 開発時
1. **ローカル環境でテスト**: `pnpm db:setup` でローカル確認
2. **マイグレーション検証**: 本番前に必ずローカル実行
3. **バックアップ確認**: 重要なデータは事前にバックアップ

### 本番デプロイ時
1. **段階的デプロイ**: ステージング → 本番の順で実行
2. **手動承認**: 本番環境は手動トリガーのみ
3. **監視**: デプロイ後のヘルスチェック実行

## 📞 サポート

問題が発生した場合は、以下の情報を含めて報告：
1. 実行したコマンド
2. エラーメッセージの全文
3. 環境情報（OS、Node.js、pnpmバージョン）
4. GitHub Actionsのログ（該当する場合）

---
**作成日**: 2025-07-27  
**最終更新**: 2025-07-27