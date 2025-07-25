# DELAxPM - 進捗管理システム統合プロジェクト

このプロジェクトは、プラッと進捗すごろくとリベラリーを統合したmonorepo構成の進捗管理システムです。Claude Code Spec-Driven Developmentを使用して開発を進めています。

## プロジェクト概要

DELAxPMは、テレビ番組制作の進捗管理を効率化するための統合システムです：

- **プラッと進捗すごろく**: 番組制作の9段階進捗管理
- **リベラリー**: エピソード管理とチームダッシュボード（10段階進捗）
- **統合版**: 両システムの機能を統合し、包括的な制作管理を実現

### 主要技術スタック
- **フロントエンド**: Next.js 15 + React 18 + TypeScript
- **バックエンド**: Supabase (PostgreSQL + Auth + Realtime)
- **スタイリング**: Tailwind CSS
- **開発環境**: pnpm + Turbo (monorepo)

## プロジェクトコンテキスト

### Project Steering
- 製品概要: `.kiro/steering/product.md`
- 技術スタック: `.kiro/steering/tech.md`
- プロジェクト構造: `.kiro/steering/structure.md`
- 専門コンテキスト用のカスタムステアリング文書

### アクティブな仕様
- 現在の仕様: `.kiro/specs/` で進行中の仕様を確認
- 進捗確認: `/spec-status [feature-name]` で進捗をチェック

## 開発ガイドライン
- 思考は英語、回答の生成は日本語で行う

## Spec-Driven Development ワークフロー

### Phase 0: ステアリング生成（推奨）

#### Kiroステアリング (`.kiro/steering/`)
```
/steering-init          # 初期ステアリング文書の生成
/steering-update        # 変更後のステアリング更新
/steering-custom        # 専門コンテキスト用カスタムステアリング作成
```

**注意**: 新機能や空のプロジェクトの場合、ステアリングは推奨ですが必須ではありません。必要に応じて直接spec-requirementsから始めることも可能です。

### Phase 1: 仕様作成
```
/spec-init [feature-name]           # 仕様構造の初期化のみ
/spec-requirements [feature-name]   # 要件定義生成 → レビュー → 必要に応じて編集
/spec-design [feature-name]         # 技術設計生成 → レビュー → 必要に応じて編集
/spec-tasks [feature-name]          # 実装タスク生成 → レビュー → 必要に応じて編集
```

### Phase 2: 進捗追跡
```
/spec-status [feature-name]         # 現在の進捗とフェーズの確認
```

## Spec-Driven Development ワークフロー

Kiroの仕様駆動開発は厳格な **3段階承認ワークフロー** に従います：

### Phase 1: 要件定義生成・承認
1. **生成**: `/spec-requirements [feature-name]` - 要件定義書の生成
2. **レビュー**: 人間が `requirements.md` をレビューし、必要に応じて編集
3. **承認**: 手動で `spec.json` を更新し `"requirements": true` に設定

### Phase 2: 設計生成・承認
1. **生成**: `/spec-design [feature-name]` - 技術設計生成（要件承認が必要）
2. **レビュー**: 人間が `design.md` をレビューし、必要に応じて編集
3. **承認**: 手動で `spec.json` を更新し `"design": true` に設定

### Phase 3: タスク生成・承認
1. **生成**: `/spec-tasks [feature-name]` - 実装タスク生成（設計承認が必要）
2. **レビュー**: 人間が `tasks.md` をレビューし、必要に応じて編集
3. **承認**: 手動で `spec.json` を更新し `"tasks": true` に設定

### 実装
3つのフェーズが全て承認された後にのみ、実装を開始できます。

**重要な原則**: 各フェーズは次のフェーズに進む前に人間の明示的な承認が必要であり、開発プロセス全体を通じて品質と正確性を保証します。

## 開発ルール

1. **ステアリングを考慮**: 主要な開発前に `/steering-init` を実行（新機能では任意）
2. **3段階承認ワークフローに従う**: 要件 → 設計 → タスク → 実装
3. **手動承認が必要**: 各フェーズは人間のレビューによる明示的な承認が必要
4. **フェーズをスキップしない**: 設計には承認された要件が、タスクには承認された設計が必要
5. **タスクステータスを更新**: タスクに取り組む際は完了マークを付ける
6. **ステアリングを最新に保つ**: 大きな変更後は `/steering-update` を実行
7. **仕様準拠を確認**: `/spec-status` を使用してアライメントを検証

## 自動化

このプロジェクトではClaude Code hooksを使用して以下を実現：
- tasks.mdでのタスク進捗の自動追跡
- 仕様準拠チェック
- コンパクション中のコンテキスト保持
- ステアリングドリフトの検出

### タスク進捗追跡

実装作業時：
1. **手動追跡**: タスク完了時にtasks.mdのチェックボックスを手動更新
2. **進捗監視**: `/spec-status` で現在の完了状況を確認
3. **TodoWrite統合**: TodoWriteツールを使用してアクティブな作業項目を追跡
4. **ステータス可視化**: チェックボックス解析で完了パーセンテージを表示

## はじめに

1. ステアリング文書の初期化: `/steering-init`
2. 最初の仕様作成: `/spec-init [your-feature-name]`
3. 要件、設計、タスクのワークフローに従って進行

## DELAxPM固有の開発指針

### モノレポ構成
- `packages/core/`: 共通ライブラリ（型定義、ユーティリティ）
- `apps/unified/`: 統合Next.jsアプリケーション
- `supabase/`: 統合データベース設計

### 統合開発のポイント
- プラットとリベラリーの機能を統合
- 共通コンポーネントの再利用
- 統一されたデータベーススキーマ
- 段階的な機能統合戦略

### 品質保証
- TypeScriptによる型安全性
- ESLintによるコード品質
- Turboによる効率的なビルド
- 仕様駆動による設計品質

## Kiroステアリング詳細

Kiro形式のステアリングは、markdownファイルを通じて永続的なプロジェクト知識を提供：

### コアステアリング文書
- **product.md**: 製品概要、機能、ユースケース、価値提案
- **tech.md**: アーキテクチャ、技術スタック、開発環境、コマンド、ポート
- **structure.md**: ディレクトリ構成、コードパターン、命名規則

### カスタムステアリング
以下のような専門ステアリング文書を作成：
- API標準
- テストアプローチ
- コードスタイルガイドライン
- セキュリティポリシー
- データベース規約
- パフォーマンス標準
- デプロイメントワークフロー

### 包含モード
- **常時含まれる**: 全てのインタラクションで読み込み（デフォルト）
- **条件付き**: 特定のファイルパターンで読み込み（例: `"*.test.js"`）
- **手動**: `#filename` 参照でオンデマンド読み込み