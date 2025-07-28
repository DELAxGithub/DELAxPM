# DELA×PM 統合進捗管理システム

プラッと進捗すごろく と リベラリー を統合したmonorepo構成の進捗管理システムです。

## 概要

このプロジェクトは以下の2つのシステムを統合し、より効率的な番組制作進捗管理を実現します：

- **プラッと進捗すごろく**: 番組制作の進捗管理システム（9段階ステータス）
- **リベラリー**: エピソード管理とチームダッシュボード（10段階ステータス）

## プロジェクト構成

```
DELAxPM/
├── packages/
│   └── core/                    # 共通ライブラリ
│       ├── src/
│       │   ├── types/          # 共通型定義
│       │   └── utils/          # 共通ユーティリティ
│       └── package.json
├── apps/
│   └── unified/                # 統合Next.jsアプリ
│       ├── src/
│       │   ├── app/           # Next.js App Router
│       │   ├── components/    # Reactコンポーネント
│       │   ├── contexts/      # Reactコンテキスト
│       │   └── lib/          # アプリ固有のライブラリ
│       └── package.json
├── supabase/                   # 統合データベース
│   ├── config.toml
│   └── migrations/
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

## 技術スタック

### フロントエンド
- **Next.js 15** (App Router)
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Lucide React** for icons

### バックエンド・データベース
- **Supabase** (PostgreSQL + 認証 + リアルタイム)
- **Row Level Security (RLS)** によるセキュリティ

### 開発ツール
- **pnpm** - パッケージマネージャー
- **Turbo** - モノレポビルドツール
- **TypeScript** - 型安全性
- **ESLint** - コード品質

## セットアップ

### 前提条件
- Node.js 18以上
- pnpm 8以上
- Supabase CLI

### インストール

```bash
# リポジトリをクローン
git clone <repository-url>
cd DELAxPM

# 依存関係をインストール
pnpm install

# 共通ライブラリをビルド
pnpm build --filter=@delaxpm/core

# 開発サーバーを起動
pnpm dev
```

### Supabaseセットアップ

```bash
# Supabaseの初期化
npx supabase init

# ローカル環境の起動
npx supabase start

# マイグレーションの適用
npx supabase db reset
```

### 環境変数

`.env.local` ファイルを作成し、以下の変数を設定してください：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 主要機能

### 統合されたデータモデル

#### 番組管理（プラッと系）
- 9段階の進捗ステータス（キャスティング中 → 請求済）
- 番組マスター情報
- 制作スケジュール管理

#### エピソード管理（リベラリー系）
- 10段階の進捗ステータス（台本作成中 → 完パケ納品）
- インタビュー・VTR分類
- シーズン・エピソード番号管理

#### 共通機能
- カレンダー・スケジュール管理
- チームダッシュボード
- ステータス変更履歴
- ユーザー管理・権限制御

## 開発コマンド

```bash
# 全体のビルド
pnpm build

# 開発サーバー（全アプリ同時起動）
pnpm dev

# リンター実行
pnpm lint

# 型チェック
pnpm type-check

# 特定パッケージのみ実行
pnpm dev --filter=@delaxpm/unified
pnpm build --filter=@delaxpm/core
```

## データベース設計

### 主要テーブル

1. **programs** - 番組マスター（シーズン管理含む）
2. **episodes** - エピソード管理（プラッと・リベラリー統合）
3. **program_statuses** - 番組ステータスマスター
4. **episode_statuses** - エピソードステータスマスター
5. **calendar_events** - カレンダー・イベント管理
6. **team_events** - チームイベント
7. **users** - ユーザー管理
8. **status_history** - ステータス変更履歴
9. **dashboard_widgets** - ダッシュボード設定
10. **dashboard_memos** - ダッシュボードメモ

### ステータス管理

#### 番組ステータス（9段階）
1. キャスティング中
2. ロケ済
3. VE済
4. MA済
5. 初号試写済
6. 局プレ済
7. 完パケ済
8. OA済
9. 請求済

#### エピソードステータス（10段階）
1. 台本作成中
2. 素材準備
3. 素材確定
4. 編集中
5. 試写1
6. 修正1
7. MA中
8. 初稿完成
9. 修正中
10. 完パケ納品

## パッケージ構成

### @delaxpm/core
共通ライブラリパッケージ
- 型定義（Program, Episode, Calendar, etc.）
- ユーティリティ関数（日付処理、ステータス管理、バリデーション）
- 共通定数・設定

### @delaxpm/unified
統合Next.jsアプリケーション
- プラッと・リベラリー両方の機能を統合
- 共通UIコンポーネント
- ルーティング・ページ管理

## 移行元システム

### プラッと進捗すごろく
- **リポジトリ**: https://github.com/DELAxGithub/PMplatto.git
- **特徴**: 番組制作の9段階進捗管理
- **技術**: React + Vite + Supabase

### リベラリー
- **リポジトリ**: https://github.com/DELAxGithub/PMliberary
- **特徴**: エピソード管理 + チームダッシュボード
- **技術**: React + Vite + Supabase

## 貢献

1. フォークを作成
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## ライセンス

このプロジェクトは私的利用を目的としています。
<- rm Podfile.lock
- rm -rf Pods/
- pod cache clean CI/CD Test: Mon 28 Jul 2025 12:07:07 EDT -->
