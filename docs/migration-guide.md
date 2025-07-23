# DELA×PM統合システム - 移行実行ガイド

## 概要

本ガイドでは、Supabase無料枠制約下でのPMplattoとPMliberaryの統合移行を安全に実行するための詳細手順を説明します。

PMliberaryをベースとして、PMplattoデータを統合することで、1つのSupabaseプロジェクトで両システムの機能を提供する統合版を構築します。

## 前提条件

### 技術要件
- PMliberaryプロジェクトへのスーパーユーザーアクセス権限
- PMplattoプロジェクトからのデータエクスポート権限
- PostgreSQL/Supabase CLI環境
- 統合版Next.jsアプリケーションのデプロイ準備

### 業務要件
- 移行作業時間の確保（推奨：土曜日夜間 22:00-04:00）
- 関係者への事前通知と承認
- 移行後のユーザートレーニング計画

## 移行スケジュール

### 実行タイムライン
```
土曜日 22:00-04:00 (6時間のメンテナンス時間)

22:00-22:30  事前準備・最終バックアップ
22:30-23:30  PMplattoデータエクスポート・インポート
23:30-01:00  統合移行スクリプト実行
01:00-02:30  データ整合性チェック・機能テスト
02:30-03:30  統合版アプリケーションテスト
03:30-04:00  最終確認・サービス復旧
```

## Phase 0: 事前準備（作業開始前）

### 0.1 バックアップ実行

**PMplattoプロジェクト**で実行:
```bash
# 1. データベース接続確認
psql -h [pmplatto-host] -U [user] -d [database] -c "SELECT current_database(), current_user;"

# 2. バックアップスクリプト実行
psql -h [pmplatto-host] -U [user] -d [database] -f scripts/backup-data.sql

# 3. SQLダンプ作成
pg_dump -h [pmplatto-host] -U [user] -d [database] \
  --no-owner --no-privileges --clean --if-exists \
  -f backup/pmplatto_$(date +%Y%m%d_%H%M%S).sql

# 4. バックアップ検証
psql -h [pmplatto-host] -U [user] -d [database] -c "
  SELECT 'platto_programs: ' || COUNT(*) FROM backup_platto_programs;
  SELECT 'platto_users: ' || COUNT(*) FROM backup_platto_users;
  SELECT 'platto_calendar_tasks: ' || COUNT(*) FROM backup_platto_calendar_tasks;
"
```

**PMliberaryプロジェクト**で実行:
```bash
# 1. データベース接続確認
psql -h [pmliberary-host] -U [user] -d [database] -c "SELECT current_database(), current_user;"

# 2. バックアップスクリプト実行
psql -h [pmliberary-host] -U [user] -d [database] -f scripts/backup-data.sql

# 3. SQLダンプ作成
pg_dump -h [pmliberary-host] -U [user] -d [database] \
  --no-owner --no-privileges --clean --if-exists \
  -f backup/pmliberary_$(date +%Y%m%d_%H%M%S).sql

# 4. バックアップ検証
psql -h [pmliberary-host] -U [user] -d [database] -c "
  SELECT 'liberary_programs: ' || COUNT(*) FROM backup_liberary_programs;
  SELECT 'liberary_episodes: ' || COUNT(*) FROM backup_liberary_episodes;
  SELECT 'liberary_episode_statuses: ' || COUNT(*) FROM backup_liberary_episode_statuses;
"
```

### 0.2 移行準備確認

```bash
# 移行スクリプトの確認
cat scripts/migrate-to-unified.sql | head -50

# ロールバックスクリプトの確認
cat scripts/rollback-procedures.sql | head -20

# 統合版アプリケーションの準備確認
cd apps/unified
npm run build
npm run test
```

## Phase 1: PMplattoデータエクスポート（22:30-23:00）

### 1.1 PMplattoからのデータエクスポート

**PMplattoプロジェクト**で実行:
```bash
# プログラムデータのCSVエクスポート
psql -h [pmplatto-host] -U [user] -d [database] -c "
\copy (
  SELECT 
    id as legacy_id,
    program_id,
    title,
    subtitle,
    status,
    first_air_date,
    re_air_date,
    filming_date,
    complete_date,
    cast1,
    cast2,
    director,
    script_url,
    pr_text,
    notes,
    editing_date,
    mixing_date,
    first_preview_date,
    station_preview_date,
    final_package_date,
    on_air_date,
    billing_date,
    pr_80text,
    pr_200text,
    pr_completed,
    pr_due_date,
    created_at as original_created_at,
    updated_at as original_updated_at
  FROM programs
  ORDER BY id
) TO 'pmplatto_programs_export.csv' CSV HEADER;
"

# エクスポートファイル確認
wc -l pmplatto_programs_export.csv
head -5 pmplatto_programs_export.csv
```

### 1.2 エクスポートファイルの転送

```bash
# PMliberaryプロジェクト環境に転送
scp pmplatto_programs_export.csv [liberary-server]:/path/to/migration/
```

## Phase 2: 統合移行実行（23:00-01:00）

### 2.1 PMliberary環境での移行準備

**PMliberaryプロジェクト**で実行:
```bash
# 1. 移行スクリプト実行（Phase 1-2: 準備）
psql -h [pmliberary-host] -U [user] -d [database] -f scripts/migrate-to-unified.sql
```

スクリプトは以下のメッセージで一時停止します:
```
NOTICE: PMplattoデータがインポートされていません。上記の手順に従ってデータをインポートしてください。
```

### 2.2 PMplattoデータのインポート

```bash
# 2. PMplattoデータを一時テーブルにインポート
psql -h [pmliberary-host] -U [user] -d [database] -c "
\copy temp_platto_import(
  legacy_id,program_id,title,subtitle,status,
  first_air_date,re_air_date,filming_date,complete_date,
  cast1,cast2,director,script_url,pr_text,notes,
  editing_date,mixing_date,first_preview_date,station_preview_date,
  final_package_date,on_air_date,billing_date,
  pr_80text,pr_200text,pr_completed,pr_due_date,
  original_created_at,original_updated_at
) FROM 'pmplatto_programs_export.csv' CSV HEADER;
"

# 3. インポート確認
psql -h [pmliberary-host] -U [user] -d [database] -c "
  SELECT COUNT(*) as imported_records FROM temp_platto_import;
  SELECT validation_status, COUNT(*) FROM temp_platto_import GROUP BY validation_status;
"
```

### 2.3 移行スクリプト再実行

```bash
# 4. 残りの移行プロセス実行（Phase 3-7）
psql -h [pmliberary-host] -U [user] -d [database] -f scripts/migrate-to-unified.sql
```

### 2.4 移行結果確認

```bash
# 5. 移行完了確認
psql -h [pmliberary-host] -U [user] -d [database] -c "
  -- プロジェクト別レコード数
  SELECT project_type, COUNT(*) FROM programs GROUP BY project_type;
  SELECT project_type, COUNT(*) FROM episodes GROUP BY project_type;
  
  -- 移行ログ確認
  SELECT migration_phase, operation_type, record_count, status, notes 
  FROM migration_metadata 
  ORDER BY created_at;
  
  -- 最終確認
  SELECT 
    'PMplatto programs:' as description, 
    COUNT(*) as count 
  FROM programs 
  WHERE project_type = 'platto';
  
  SELECT 
    'PMliberary programs:' as description, 
    COUNT(*) as count 
  FROM programs 
    WHERE project_type = 'liberary';
"
```

## Phase 3: データ整合性チェック（01:00-01:30）

### 3.1 データ品質確認

```bash
# 必須フィールドチェック
psql -h [pmliberary-host] -U [user] -d [database] -c "
  -- タイトル欠損チェック
  SELECT 'Programs without title:', COUNT(*)
  FROM programs 
  WHERE title IS NULL OR title = '';
  
  -- project_type不正値チェック
  SELECT 'Invalid project_type:', COUNT(*)
  FROM programs 
  WHERE project_type NOT IN ('platto', 'liberary', 'unified');
  
  -- PMplattoデータのsource_systemチェック
  SELECT 'Platto without source_system:', COUNT(*)
  FROM programs 
  WHERE project_type = 'platto' AND source_system IS NULL;
"

# ステータス分布確認
psql -h [pmliberary-host] -U [user] -d [database] -c "
  SELECT 
    project_type,
    current_status,
    COUNT(*) as count
  FROM programs 
  WHERE project_type IN ('platto', 'liberary')
  GROUP BY project_type, current_status 
  ORDER BY project_type, count DESC;
"
```

### 3.2 関連データ整合性確認

```bash
# エピソードとプログラムの関連チェック（PMliberaryのみ）
psql -h [pmliberary-host] -U [user] -d [database] -c "
  -- 孤立エピソード確認
  SELECT 'Orphaned episodes:', COUNT(*)
  FROM episodes e
  LEFT JOIN programs p ON e.program_id = p.program_id
  WHERE p.id IS NULL;
  
  -- エピソード統計
  SELECT 
    p.project_type,
    COUNT(e.id) as episode_count
  FROM programs p
  LEFT JOIN episodes e ON p.program_id = e.program_id
  GROUP BY p.project_type;
"
```

## Phase 4: アプリケーション機能テスト（01:30-02:30）

### 4.1 統合版アプリケーションのデプロイ

```bash
# 統合版アプリケーションのビルド・デプロイ
cd apps/unified

# 環境変数確認
cat .env.local

# ビルド実行
npm run build

# デプロイ（Netlify/Vercel等）
npm run deploy
```

### 4.2 機能テスト実行

**ダッシュボード機能テスト**:
1. https://[統合版URL]/dashboard にアクセス
2. プラッと・リベラリーの統計表示確認
3. 進行中・完了数の正確性確認

**プラッと機能テスト**:
1. https://[統合版URL]/platto にアクセス
2. PMplattoからのデータ表示確認
3. ステータスバッジの正確性確認
4. 詳細情報の表示確認

**リベラリー機能テスト**:
1. https://[統合版URL]/liberary にアクセス
2. PMliberaryエピソードデータの表示確認
3. エピソードタイプフィルターの動作確認
4. ステータス表示の正確性確認

### 4.3 パフォーマンステスト

```bash
# データベースクエリパフォーマンス確認
psql -h [pmliberary-host] -U [user] -d [database] -c "
  -- プラッとデータのクエリ性能
  EXPLAIN ANALYZE 
  SELECT * FROM programs 
  WHERE project_type = 'platto' 
  ORDER BY updated_at DESC;
  
  -- リベラリーエピソードのクエリ性能
  EXPLAIN ANALYZE 
  SELECT * FROM episodes 
  WHERE project_type = 'liberary' 
  ORDER BY episode_number;
  
  -- ダッシュボード統計クエリ性能
  EXPLAIN ANALYZE 
  SELECT 
    project_type,
    current_status,
    COUNT(*) 
  FROM programs 
  GROUP BY project_type, current_status;
"
```

## Phase 5: ユーザー受け入れテスト（02:30-03:30）

### 5.1 業務シナリオテスト

**シナリオ1: プラッと番組確認**
1. プラッとページで番組一覧表示
2. 特定番組の詳細確認
3. ステータス別フィルタリング
4. 検索機能動作確認

**シナリオ2: リベラリーエピソード管理**
1. リベラリーページでエピソード一覧表示
2. インタビュー/VTRタイプ別表示
3. エピソード詳細情報確認
4. ステータス進捗確認

**シナリオ3: 統合ダッシュボード**
1. 両システムの統計情報表示
2. 進捗率計算の正確性
3. クイックアクション動作確認

### 5.2 データ検証テスト

**重要データポイントの確認**:
```bash
# 移行前後のレコード数比較
echo "=== 移行前後比較 ==="
echo "PMplatto移行前: [バックアップ時の件数]"
echo "PMliberary移行前: [バックアップ時の件数]"

psql -h [pmliberary-host] -U [user] -d [database] -c "
  SELECT 'PMplatto移行後: ' || COUNT(*) FROM programs WHERE project_type = 'platto';
  SELECT 'PMliberary移行後: ' || COUNT(*) FROM programs WHERE project_type = 'liberary';
  SELECT '総プログラム数: ' || COUNT(*) FROM programs;
  SELECT '総エピソード数: ' || COUNT(*) FROM episodes;
"
```

## Phase 6: 最終確認・サービス復旧（03:30-04:00）

### 6.1 システム稼働確認

```bash
# データベース接続状況確認
psql -h [pmliberary-host] -U [user] -d [database] -c "
  SELECT 
    'Database connection: OK' as status,
    current_database() as database,
    version() as postgres_version;
"

# 重要インデックス確認
psql -h [pmliberary-host] -U [user] -d [database] -c "
  SELECT 
    indexname,
    tablename
  FROM pg_indexes 
  WHERE indexname LIKE '%project_type%';
"
```

### 6.2 最終移行サマリー

```bash
# 最終移行レポート生成
psql -h [pmliberary-host] -U [user] -d [database] -c "
  SELECT '=== 最終移行サマリー ===' as header;
  
  SELECT 
    migration_phase,
    COUNT(*) as operations,
    SUM(record_count) as total_records,
    SUM(EXTRACT(EPOCH FROM execution_time)) as total_seconds
  FROM migration_metadata
  WHERE status = 'completed'
  GROUP BY migration_phase
  ORDER BY MIN(created_at);
  
  SELECT 
    '移行完了時刻: ' || MAX(created_at) as completion_time
  FROM migration_metadata
  WHERE migration_phase = 'completion';
" > migration_final_report.txt

# レポート確認
cat migration_final_report.txt
```

### 6.3 サービス復旧

1. **DNS/ルーティング切り替え**
   - 統合版URLへのトラフィック切り替え
   - 旧システムURLのメンテナンス表示

2. **監視設定**
   - アプリケーション監視の有効化
   - データベース監視の確認

3. **ユーザー通知**
   - 移行完了の案内送信
   - 新機能の簡単な説明

## 移行後の作業

### PMplattoプロジェクト削除（移行完了1週間後）

統合版の安定稼働確認後、PMplattoプロジェクトを削除してSupabase無料枠を1つ開放:

```bash
# 統合版の稼働確認（1週間の監視後）
# 1. データ損失がないことを確認
# 2. 全機能が正常動作することを確認
# 3. ユーザーからの問題報告がないことを確認

# PMplattoプロジェクト削除実行
# Supabaseダッシュボードから手動削除
# または Supabase CLI使用
supabase projects delete [pmplatto-project-id] --confirm
```

### 継続監視項目

1. **パフォーマンス監視**
   - レスポンス時間 2秒以内維持
   - データベースクエリ性能
   - メモリ・CPU使用率

2. **データ整合性監視**
   - 日次データ整合性チェック
   - バックアップ自動実行確認

3. **機能監視**
   - 重要機能の定期動作確認
   - エラー率監視（0.1%以下）

## トラブルシューティング

### よくある問題と対処法

**1. PMplattoデータインポートエラー**
```
エラー: CSV形式不正
対処: CSVヘッダーとカラム順序を確認、文字エンコーディング確認（UTF-8）
```

**2. 統合後のクエリ性能低下**
```
原因: インデックス不足
対処: project_type用インデックスの再作成
CREATE INDEX CONCURRENTLY idx_programs_project_type ON programs(project_type);
```

**3. アプリケーション接続エラー**
```
原因: 環境変数の設定ミス
対処: Supabase接続情報の再確認、RLS設定の確認
```

### 緊急時連絡先

- **システム管理者**: [連絡先]
- **データベース担当**: [連絡先]
- **アプリケーション開発者**: [連絡先]

### 移行失敗時のロールバック

移行に問題が発生した場合は、`scripts/rollback-procedures.sql`を使用して即座にロールバックを実行してください。

```bash
# 緊急ロールバック実行
psql -h [pmliberary-host] -U [user] -d [database] -f scripts/rollback-procedures.sql
```

## 移行完了チェックリスト

### 技術チェック
- [ ] PMplattoデータの完全移行確認
- [ ] PMliberaryデータの整合性確認  
- [ ] 統合版アプリケーションの正常動作
- [ ] データベースインデックスの最適化
- [ ] パフォーマンステスト合格

### 業務チェック
- [ ] 全機能の動作確認完了
- [ ] ユーザー受け入れテスト合格
- [ ] データ損失0件確認
- [ ] 移行前後の業務継続性確認

### 運用チェック
- [ ] 監視システムの正常動作
- [ ] バックアップ自動実行確認
- [ ] ユーザートレーニング完了
- [ ] ドキュメント更新完了

---

**移行責任者**: [名前]  
**実行日時**: [日時]  
**承認者**: [名前]  
**文書バージョン**: 1.0