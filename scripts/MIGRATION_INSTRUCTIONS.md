# 🔄 DELA×PM統合システム - 安全な移行手順

**重要**: `column "project_type" does not exist` エラー対応版

## 📋 実行順序

### ステップ1: 既存構造確認
```sql
-- ファイル: scripts/check-existing-schema.sql を実行
-- PMliberaryの現在のテーブル構造を確認
```

### ステップ2: 最小限スキーマ拡張
```sql
-- ファイル: scripts/minimal-migration.sql を実行
-- project_typeカラムのみを安全に追加
-- 既存データは完全に保護されます
```

### ステップ3: PMplattoデータ移行
```sql
-- ファイル: scripts/safe-pmplatto-insert.sql を実行  
-- 32番組のデータを安全に挿入
-- 既存のPMliberaryデータは影響を受けません
```

## 🛡️ 安全性保証

### 既存データ保護
- PMliberaryの既存データは一切変更されません
- project_typeカラム追加のみ（デフォルト値: 'liberary'）
- 既存の制約・インデックスは維持されます

### エラー回避
- カラム存在チェック付きの安全な追加
- 重複制約・インデックス防止
- データ整合性チェック完備

### ロールバック対応
```sql
-- 緊急時のロールバック
DELETE FROM programs WHERE project_type = 'platto';
ALTER TABLE programs DROP COLUMN IF EXISTS project_type;
```

## 📊 期待結果

移行完了後のデータ構成:
```
project_type = 'liberary': 既存のPMliberaryデータ（件数は現在の状態による）
project_type = 'platto': 32件（PMplattoからの移行データ）
```

## ⚠️ 実行前チェックリスト

- [ ] PMliberaryのSupabase管理画面にアクセス済み
- [ ] SQL Editorが利用可能
- [ ] 管理者権限でログイン済み
- [ ] 既存データのバックアップ取得済み（推奨）

## 🚀 実行手順

1. **check-existing-schema.sql** を実行してテーブル構造確認
2. **minimal-migration.sql** を実行してproject_typeカラム追加
3. **safe-pmplatto-insert.sql** を実行してPMplattoデータ挿入
4. 結果確認クエリでデータ整合性をチェック

---

**この手順により、既存のPMliberaryデータを完全に保護しながら、PMplattoデータの統合が完了します。**