# DELAxPM統合システム - Supabaseデータベース統合設計仕様書

## 概要

PMplatto（9段階番組進捗管理）とPMliberary（10段階エピソード進捗管理）を統合したDELAxPMシステムにおけるSupabaseデータベース統合設計の詳細仕様書です。

## プロジェクト要件

### システム統合概要
- **PMplatto**: 9段階の番組制作進捗管理システム
- **PMliberary**: 10段階のエピソード制作進捗管理システム
- **統合目標**: 共通データベースによる統合管理とmonorepo構成での運用

### 技術要件
- **データベース**: Supabase PostgreSQL
- **セキュリティ**: Row Level Security (RLS)
- **データ整合性**: 既存データの完全性保持
- **パフォーマンス**: インデックス最適化とクエリ性能向上

## 現状分析

### PMplatto既存構造
```sql
-- 番組テーブル（簡易版）
CREATE TABLE programs (
  id bigint PRIMARY KEY,
  program_id text,
  title text NOT NULL,
  subtitle text,
  status text NOT NULL,  -- 9段階ステータス
  first_air_date date,
  re_air_date date,
  filming_date date,
  complete_date date,
  cast1 text,
  cast2 text,
  script_url text,
  pr_text text,
  notes text,
  created_at timestamptz,
  updated_at timestamptz
);
```

**PMplatto 9段階ステータス**:
1. キャスティング中
2. ロケ済  
3. VE済
4. MA済
5. 初号試写済
6. 局プレ済
7. 完パケ済
8. OA済
9. 請求済

### PMliberary既存構造
```sql
-- エピソードテーブル
CREATE TABLE episodes (
  id bigint PRIMARY KEY,
  episode_id text UNIQUE,
  title text NOT NULL,
  episode_type text CHECK (episode_type IN ('interview', 'vtr')),
  season integer,
  episode_number integer,
  script_url text,
  current_status text,  -- 10段階ステータス
  director text,
  due_date date,
  guest_name text,      -- インタビュー用
  recording_date date,  -- インタビュー用
  recording_location text, -- インタビュー用
  material_status text, -- VTR用
  created_at timestamptz,
  updated_at timestamptz
);
```

**PMliberary 10段階ステータス**:
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

## 統合データベース設計

### 1. 統合スキーマアーキテクチャ

#### 主要テーブル構成
```
1. users - ユーザー管理
2. programs - 番組マスター（シーズン管理含む）
3. episodes - エピソード管理（プラッと・リベラリー統合）
4. program_statuses - 番組ステータスマスター
5. episode_statuses - エピソードステータスマスター
6. calendar_events - カレンダー・イベント管理
7. team_events - チームイベント
8. status_history - ステータス変更履歴
9. dashboard_widgets - ダッシュボード設定
10. dashboard_memos - ダッシュボードメモ
```

#### プロジェクト識別設計
統合システムでは`project_type`列による識別を採用：
- `'platto'` - PMplatto由来のデータ
- `'liberary'` - PMliberary由来のデータ
- `'unified'` - 統合後の新規データ

### 2. 統合テーブル仕様

#### 2.1 programs テーブル（統合版）
```sql
CREATE TABLE programs (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  program_id text,
  title text NOT NULL,
  subtitle text,
  program_type text CHECK (program_type IN ('single', 'series', 'season')) DEFAULT 'single',
  season_number integer,
  current_status text REFERENCES program_statuses(status_name),
  
  -- プロジェクト識別
  project_type text CHECK (project_type IN ('platto', 'liberary', 'unified')) DEFAULT 'unified',
  
  -- 日程関連
  first_air_date date,
  re_air_date date,
  filming_date date,
  complete_date date,
  
  -- スタッフ・キャスト
  cast1 text,
  cast2 text,
  director text,
  producer text,
  
  -- 制作情報
  script_url text,
  pr_text text,
  notes text,
  client_name text,
  budget decimal,
  broadcast_time text,
  
  -- 進捗日程（プラッと用）
  editing_date date,
  mixing_date date,
  first_preview_date date,
  station_preview_date date,
  final_package_date date,
  on_air_date date,
  billing_date date,
  
  -- システム管理
  assigned_users text[],
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### 2.2 episodes テーブル（統合版）
```sql
CREATE TABLE episodes (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  episode_id text NOT NULL UNIQUE,
  program_id bigint REFERENCES programs(id) ON DELETE CASCADE,
  title text NOT NULL,
  episode_type text CHECK (episode_type IN ('interview', 'vtr', 'regular')) NOT NULL,
  season integer DEFAULT 1,
  episode_number integer NOT NULL,
  
  -- プロジェクト識別
  project_type text CHECK (project_type IN ('platto', 'liberary', 'unified')) DEFAULT 'unified',
  
  -- 制作情報
  script_url text,
  current_status text REFERENCES episode_statuses(status_name),
  director text,
  due_date date,
  
  -- インタビュー用項目
  interview_guest text,
  interview_date date,
  interview_location text,
  
  -- VTR用項目
  vtr_location text,
  vtr_theme text,
  
  -- その他
  notes text,
  estimated_duration interval,
  assigned_users text[],
  
  -- システム管理
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(program_id, season, episode_number)
);
```

### 3. データ移行戦略

#### 3.1 移行フェーズ
1. **フェーズ1**: 統合スキーマの作成
2. **フェーズ2**: PMplatto データの移行とproject_type='platto'タグ付け
3. **フェーズ3**: PMliberary データの移行とproject_type='liberary'タグ付け
4. **フェーズ4**: データ整合性検証
5. **フェーズ5**: インデックス最適化

#### 3.2 PMplatto データ移行マッピング
```sql
-- programs テーブル移行
INSERT INTO programs (
  program_id, title, subtitle, current_status,
  project_type, first_air_date, re_air_date,
  filming_date, complete_date, cast1, cast2,
  script_url, pr_text, notes, created_at, updated_at
)
SELECT 
  program_id, title, subtitle, status as current_status,
  'platto' as project_type, first_air_date, re_air_date,
  filming_date, complete_date, cast1, cast2,
  script_url, pr_text, notes, created_at, updated_at
FROM temp_platto_programs;
```

#### 3.3 PMliberary データ移行マッピング
```sql
-- episodes テーブル移行
INSERT INTO episodes (
  episode_id, title, episode_type, season, episode_number,
  project_type, script_url, current_status, director, due_date,
  interview_guest, interview_date, interview_location,
  notes, created_at, updated_at
)
SELECT 
  episode_id, title, episode_type, season, episode_number,
  'liberary' as project_type, script_url, current_status, 
  director, due_date, guest_name as interview_guest,
  recording_date as interview_date, recording_location as interview_location,
  '' as notes, created_at, updated_at
FROM temp_liberary_episodes;
```

### 4. セキュリティ設計

#### 4.1 Row Level Security (RLS) ポリシー
```sql
-- 認証されたユーザーのみアクセス可能
CREATE POLICY "Authenticated users can access programs" 
ON programs FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access episodes" 
ON episodes FOR ALL USING (auth.role() = 'authenticated');

-- プロジェクトタイプ別アクセス制御（オプション）
CREATE POLICY "Users can access assigned project types" 
ON programs FOR SELECT USING (
  auth.role() = 'authenticated' AND
  (project_type = ANY(
    SELECT unnest(string_to_array(auth.jwt() ->> 'allowed_projects', ','))
  ) OR 
  auth.jwt() ->> 'role' = 'admin')
);
```

#### 4.2 データ検証制約
```sql
-- プロジェクトタイプの整合性
ALTER TABLE programs ADD CONSTRAINT check_project_type_consistency
CHECK (project_type IN ('platto', 'liberary', 'unified'));

ALTER TABLE episodes ADD CONSTRAINT check_project_type_consistency  
CHECK (project_type IN ('platto', 'liberary', 'unified'));

-- ステータスの整合性
ALTER TABLE programs ADD CONSTRAINT check_program_status_exists
FOREIGN KEY (current_status) REFERENCES program_statuses(status_name);

ALTER TABLE episodes ADD CONSTRAINT check_episode_status_exists
FOREIGN KEY (current_status) REFERENCES episode_statuses(status_name);
```

### 5. パフォーマンス最適化

#### 5.1 インデックス設計
```sql
-- 基本インデックス
CREATE INDEX idx_programs_project_type ON programs(project_type);
CREATE INDEX idx_programs_status ON programs(current_status);
CREATE INDEX idx_episodes_project_type ON episodes(project_type);
CREATE INDEX idx_episodes_status ON episodes(current_status);

-- 複合インデックス
CREATE INDEX idx_programs_type_status ON programs(project_type, current_status);
CREATE INDEX idx_episodes_type_status ON episodes(project_type, current_status);
CREATE INDEX idx_episodes_program_season ON episodes(program_id, season);

-- 日付検索用インデックス
CREATE INDEX idx_programs_air_date ON programs(first_air_date) WHERE first_air_date IS NOT NULL;
CREATE INDEX idx_episodes_due_date ON episodes(due_date) WHERE due_date IS NOT NULL;
```

#### 5.2 クエリ最適化ビュー
```sql
-- 統合進捗ダッシュボード用ビュー
CREATE VIEW unified_progress_summary AS
SELECT 
  project_type,
  COUNT(*) as total_items,
  COUNT(*) FILTER (WHERE current_status LIKE '%完%') as completed_items,
  ROUND(
    COUNT(*) FILTER (WHERE current_status LIKE '%完%') * 100.0 / COUNT(*), 
    2
  ) as completion_rate
FROM (
  SELECT project_type, current_status FROM programs
  UNION ALL
  SELECT project_type, current_status FROM episodes
) combined
GROUP BY project_type;
```

### 6. 監査とトレーサビリティ

#### 6.1 変更履歴の記録
```sql
-- 統合ステータス履歴テーブル
CREATE TABLE status_history (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  target_type text CHECK (target_type IN ('program', 'episode')) NOT NULL,
  target_id bigint NOT NULL,
  project_type text CHECK (project_type IN ('platto', 'liberary', 'unified')),
  old_status text,
  new_status text NOT NULL,
  changed_by uuid REFERENCES users(id),
  changed_at timestamptz DEFAULT now(),
  change_reason text,
  metadata jsonb
);
```

#### 6.2 移行ログテーブル
```sql
-- データ移行の追跡
CREATE TABLE migration_log (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  migration_type text CHECK (migration_type IN ('platto_programs', 'liberary_episodes', 'schema_update')),
  source_table text,
  target_table text,
  records_processed integer,
  records_successful integer,
  records_failed integer,
  error_details jsonb,
  executed_at timestamptz DEFAULT now(),
  execution_time interval
);
```

## 実装ファイル

### 1. 000_unified_schema.sql
統合データベーススキーマの作成とマスターデータの初期化

### 2. 001_migrate_existing_data.sql  
既存のPMplattoとPMliberaryデータの移行スクリプト

### 3. supabase/.env.example
統合環境における環境変数設定のテンプレート

## 承認フロー

### 段階1: 要件確認 ✅
- プロジェクト概要の確認
- 既存システムの分析
- 統合要件の定義

### 段階2: 設計レビュー（次段階）
- スキーマ設計の詳細レビュー
- データ移行戦略の検証
- セキュリティ・パフォーマンス要件の確認

### 段階3: 実装タスク（最終段階）
- 実装ファイルの作成
- テスト戦略の策定
- デプロイ手順の確定

## リスク管理

### 高リスク項目
1. **データ整合性**: 既存データの完全性保持
2. **ダウンタイム**: 移行中のサービス停止時間最小化
3. **パフォーマンス**: 大量データ処理における性能低下

### 軽減策
1. **段階的移行**: フェーズ分割による影響範囲限定
2. **ロールバック計画**: 各段階での復旧手順確立
3. **テスト環境**: 本番同等環境での事前検証

## 成功指標

1. **データ完全性**: 移行前後のレコード数・整合性100%一致
2. **パフォーマンス**: レスポンス時間2秒以内維持
3. **可用性**: ダウンタイム1時間以内
4. **ユーザー満足度**: 既存機能の完全再現

---

**作成日**: 2025-07-23  
**バージョン**: 1.0  
**次回レビュー予定**: 設計レビュー完了後