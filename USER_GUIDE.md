# DELA×PM統合システム - ユーザーガイド

## 概要

DELA×PM統合システムは、PMplatto（番組管理）とPMliberary（エピソード管理）を統合したプロジェクト管理システムです。

## システム構成

### 統合されたシステム
- **PMplatto**: 32番組の管理機能
- **PMliberary**: エピソード・ダッシュボード機能
- **統合ダッシュボード**: 両システムを一元管理

### 技術スタック
- **フロントエンド**: Next.js 15 + React 18 + TypeScript
- **バックエンド**: Supabase (PostgreSQL + Auth + Realtime)
- **スタイリング**: Tailwind CSS
- **パッケージ管理**: pnpm + Turbo monorepo

## 移行完了状況

### ✅ 完了済み
1. **システム分析**: 両システムの詳細分析完了
2. **統合仕様策定**: Spec-Driven Development完了
3. **データバックアップ**: PMplatto 32番組 + PMliberary データ取得完了
4. **統合アプリ構築**: Next.js統合アプリケーション完成
5. **手動移行準備**: SQL移行スクリプト完成

### 📋 手動実行が必要
以下の手動移行作業が完了すると、システムが本格稼働します：

## 手動移行手順

### ステップ1: データベーススキーマ拡張

PMliberaryのSupabase管理画面で以下を実行：

```sql
-- project_type列の追加
ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS project_type text DEFAULT 'liberary';

-- PMplatto用フィールドの追加
ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS pr_80text text,
ADD COLUMN IF NOT EXISTS pr_200text text,
ADD COLUMN IF NOT EXISTS source_system text,
ADD COLUMN IF NOT EXISTS migrated_at timestamptz,
ADD COLUMN IF NOT EXISTS legacy_id text;
```

### ステップ2: PMplattoデータ移行

`scripts/pmplatto-programs-insert.sql`の内容をSupabase SQL Editorで実行：
- 32番組すべてのデータが挿入されます
- `project_type = 'platto'`として識別されます

### ステップ3: 移行確認

```sql
-- 移行結果確認
SELECT 
  project_type, 
  COUNT(*) as program_count
FROM programs 
GROUP BY project_type;
```

期待結果:
- `platto`: 32件
- `liberary`: 0件（空の場合）

## システム利用方法

### 1. アクセス方法

**開発環境**: http://localhost:3000
**本番環境**: デプロイ後のURL

### 2. 認証

Supabase Authを使用:
- メールアドレス + パスワード
- Google/GitHub認証（設定済みの場合）

### 3. メイン機能

#### 統合ダッシュボード
- PMplattoとPMliberaryの統合ビュー
- プロジェクト種別の切り替え
- リアルタイムデータ更新

#### PMplattoモード
- 32番組の一覧表示
- 番組詳細管理
- ステータス更新
- キャスティング情報

#### PMliberaryモード
- エピソード管理
- 制作進行管理
- ダッシュボード機能

### 4. プロジェクト切り替え

ナビゲーションメニューから：
- 「統合ダッシュボード」: 全体概要
- 「PMplatto」: 番組管理
- 「PMliberary」: エピソード管理

## システム管理

### データバックアップ

自動バックアップファイル:
```
scripts/pmplatto_programs_2025-07-23T14-58-39.json
scripts/pmplatto_calendar_tasks_2025-07-23T14-58-39.json
```

### 開発環境セットアップ

```bash
# リポジトリクローン
git clone [repository-url]
cd DELAxPM

# 依存関係インストール
pnpm install

# 開発サーバー起動
pnpm dev:unified
```

### 本番デプロイ

```bash
# ビルド確認
pnpm deploy:check

# Vercelデプロイ
vercel --prod

# Netlifyデプロイ
netlify deploy --prod
```

## トラブルシューティング

### よくある問題

#### 1. データが表示されない
**原因**: 手動移行が未完了
**解決**: ステップ1-3の手動移行を実行

#### 2. 認証エラー
**原因**: Supabase設定の問題
**解決**: `.env.local`の環境変数を確認

#### 3. ビルドエラー
**原因**: 依存関係の問題
**解決**: 
```bash
pnpm clean
pnpm install
pnpm build:unified
```

### エラーログ確認

```bash
# 開発環境ログ
pnpm dev:unified

# Supabaseログ
# Supabase Dashboard > Logs で確認
```

## サポート・連絡先

### 技術サポート
- **開発者**: プロジェクト管理者
- **Supabase**: PMliberary管理者権限が必要
- **GitHub**: Issues で報告

### 移行サポート
手動移行でお困りの場合：
1. `scripts/manual-migration.sql`を参照
2. Supabase管理画面でのSQL実行サポート
3. データ整合性チェックの支援

### システム要件
- **Node.js**: 18以上
- **ブラウザ**: Chrome, Firefox, Safari最新版
- **ネットワーク**: インターネット接続必須（Supabase接続）

---

**重要**: 手動移行完了後、システムは完全に統合され、PMplattoとPMliberaryの全機能を一つのインターフェースで利用できます。