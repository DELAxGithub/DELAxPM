-- PMliberary Database Backup
-- Created: #午後
-- Project: pmliberary

/*
===============================================================================
DELA×PM統合システム - 包括的データバックアップスクリプト
===============================================================================

目的: PMplattoとPMliberaryの完全なデータバックアップ作成
対象: 全テーブル、インデックス、権限、設定情報
実行: 移行作業前の必須手順

使用方法:
1. PMplattoプロジェクトで実行: psql -h [host] -U [user] -d [db] -f backup-data.sql
2. PMliberaryプロジェクトで実行: 同様に実行
3. 生成されたバックアップファイルを安全な場所に保存

===============================================================================
*/

-- バックアップ実行開始ログ
SELECT 'DELA×PM データバックアップ開始: ' || now() as backup_start;

-- =============================================================================
-- バックアップ用テーブル作成
-- =============================================================================

-- バックアップメタデータテーブル
CREATE TABLE IF NOT EXISTS backup_metadata (
  id bigserial PRIMARY KEY,
  backup_type text NOT NULL,
  source_project text NOT NULL,
  table_name text,
  record_count bigint,
  backup_size_kb bigint,
  checksum text,
  created_at timestamptz DEFAULT now(),
  notes text
);

-- バックアップ統計テーブル
CREATE TABLE IF NOT EXISTS backup_statistics (
  id bigserial PRIMARY KEY,
  total_tables integer,
  total_records bigint,
  total_size_mb numeric,
  backup_duration interval,
  backup_status text CHECK (backup_status IN ('started', 'completed', 'failed')),
  created_at timestamptz DEFAULT now(),
  error_message text
);

-- バックアップ開始記録
INSERT INTO backup_statistics (backup_status) VALUES ('started');

-- =============================================================================
-- PMplatto データバックアップ（PMplattoプロジェクトで実行時）
-- =============================================================================

-- PMplatto programs テーブルバックアップ
DO $$
DECLARE
  table_exists boolean;
  record_count bigint;
BEGIN
  -- programsテーブルの存在確認
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'programs'
  ) INTO table_exists;

  IF table_exists THEN
    -- バックアップテーブル作成
    DROP TABLE IF EXISTS backup_platto_programs;
    CREATE TABLE backup_platto_programs AS 
    SELECT 
      id,
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
      'platto' as source_project,
      now() as backup_timestamp,
      created_at,
      updated_at
    FROM programs;
    
    GET DIAGNOSTICS record_count = ROW_COUNT;
    
    -- バックアップメタデータ記録
    INSERT INTO backup_metadata (
      backup_type, source_project, table_name, record_count, notes
    ) VALUES (
      'full_backup', 'platto', 'programs', record_count, 
      'PMplatto programs完全バックアップ'
    );
    
    RAISE NOTICE 'PMplatto programs バックアップ完了: % レコード', record_count;
  ELSE
    RAISE NOTICE 'PMplatto programs テーブルが見つかりません';
  END IF;
END $$;

-- PMplatto calendar_tasks テーブルバックアップ
DO $$
DECLARE
  table_exists boolean;
  record_count bigint;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'calendar_tasks'
  ) INTO table_exists;

  IF table_exists THEN
    DROP TABLE IF EXISTS backup_platto_calendar_tasks;
    CREATE TABLE backup_platto_calendar_tasks AS 
    SELECT 
      id,
      program_id,
      title,
      task_type,
      start_date,
      end_date,
      description,
      'platto' as source_project,
      now() as backup_timestamp,
      created_at,
      updated_at
    FROM calendar_tasks;
    
    GET DIAGNOSTICS record_count = ROW_COUNT;
    
    INSERT INTO backup_metadata (
      backup_type, source_project, table_name, record_count, notes
    ) VALUES (
      'full_backup', 'platto', 'calendar_tasks', record_count,
      'PMplatto calendar_tasks完全バックアップ'
    );
    
    RAISE NOTICE 'PMplatto calendar_tasks バックアップ完了: % レコード', record_count;
  ELSE
    RAISE NOTICE 'PMplatto calendar_tasks テーブルが見つかりません';
  END IF;
END $$;

-- PMplatto users テーブルバックアップ
DO $$
DECLARE
  table_exists boolean;
  record_count bigint;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'users'
  ) INTO table_exists;

  IF table_exists THEN
    DROP TABLE IF EXISTS backup_platto_users;
    CREATE TABLE backup_platto_users AS 
    SELECT 
      id,
      email,
      name,
      role,
      department,
      avatar_url,
      'platto' as source_project,
      now() as backup_timestamp,
      created_at,
      updated_at
    FROM users;
    
    GET DIAGNOSTICS record_count = ROW_COUNT;
    
    INSERT INTO backup_metadata (
      backup_type, source_project, table_name, record_count, notes
    ) VALUES (
      'full_backup', 'platto', 'users', record_count,
      'PMplatto users完全バックアップ'
    );
    
    RAISE NOTICE 'PMplatto users バックアップ完了: % レコード', record_count;
  END IF;
END $$;

-- =============================================================================
-- PMliberary データバックアップ（PMliberaryプロジェクトで実行時）
-- =============================================================================

-- PMliberary programs テーブルバックアップ
DO $$
DECLARE
  table_exists boolean;
  record_count bigint;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'programs'
  ) INTO table_exists;

  IF table_exists THEN
    DROP TABLE IF EXISTS backup_liberary_programs;
    CREATE TABLE backup_liberary_programs AS 
    SELECT 
      id,
      program_id,
      title,
      subtitle,
      status,
      program_type,
      season_number,
      first_air_date,
      re_air_date,
      filming_date,
      complete_date,
      cast1,
      cast2,
      director,
      producer,
      script_url,
      pr_text,
      notes,
      client_name,
      budget,
      broadcast_time,
      'liberary' as source_project,
      now() as backup_timestamp,
      created_at,
      updated_at
    FROM programs;
    
    GET DIAGNOSTICS record_count = ROW_COUNT;
    
    INSERT INTO backup_metadata (
      backup_type, source_project, table_name, record_count, notes
    ) VALUES (
      'full_backup', 'liberary', 'programs', record_count,
      'PMliberary programs完全バックアップ'
    );
    
    RAISE NOTICE 'PMliberary programs バックアップ完了: % レコード', record_count;
  END IF;
END $$;

-- PMliberary episodes テーブルバックアップ
DO $$
DECLARE
  table_exists boolean;
  record_count bigint;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'episodes'
  ) INTO table_exists;

  IF table_exists THEN
    DROP TABLE IF EXISTS backup_liberary_episodes;
    CREATE TABLE backup_liberary_episodes AS 
    SELECT 
      id,
      episode_id,
      program_id,
      title,
      episode_type,
      season,
      episode_number,
      script_url,
      current_status,
      director,
      due_date,
      interview_guest,
      interview_date,
      interview_location,
      vtr_location,
      vtr_theme,
      notes,
      estimated_duration,
      'liberary' as source_project,
      now() as backup_timestamp,
      created_at,
      updated_at
    FROM episodes;
    
    GET DIAGNOSTICS record_count = ROW_COUNT;
    
    INSERT INTO backup_metadata (
      backup_type, source_project, table_name, record_count, notes
    ) VALUES (
      'full_backup', 'liberary', 'episodes', record_count,
      'PMliberary episodes完全バックアップ'
    );
    
    RAISE NOTICE 'PMliberary episodes バックアップ完了: % レコード', record_count;
  END IF;
END $$;

-- PMliberary episode_statuses テーブルバックアップ
DO $$
DECLARE
  table_exists boolean;
  record_count bigint;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'episode_statuses'
  ) INTO table_exists;

  IF table_exists THEN
    DROP TABLE IF EXISTS backup_liberary_episode_statuses;
    CREATE TABLE backup_liberary_episode_statuses AS 
    SELECT 
      id,
      status_name,
      status_order,
      color_code,
      'liberary' as source_project,
      now() as backup_timestamp,
      created_at
    FROM episode_statuses;
    
    GET DIAGNOSTICS record_count = ROW_COUNT;
    
    INSERT INTO backup_metadata (
      backup_type, source_project, table_name, record_count, notes
    ) VALUES (
      'full_backup', 'liberary', 'episode_statuses', record_count,
      'PMliberary episode_statuses完全バックアップ'
    );
    
    RAISE NOTICE 'PMliberary episode_statuses バックアップ完了: % レコード', record_count;
  END IF;
END $$;

-- PMliberary status_history テーブルバックアップ
DO $$
DECLARE
  table_exists boolean;
  record_count bigint;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'status_history'
  ) INTO table_exists;

  IF table_exists THEN
    DROP TABLE IF EXISTS backup_liberary_status_history;
    CREATE TABLE backup_liberary_status_history AS 
    SELECT 
      id,
      episode_id,
      old_status,
      new_status,
      changed_by,
      changed_at,
      notes,
      'liberary' as source_project,
      now() as backup_timestamp
    FROM status_history;
    
    GET DIAGNOSTICS record_count = ROW_COUNT;
    
    INSERT INTO backup_metadata (
      backup_type, source_project, table_name, record_count, notes
    ) VALUES (
      'full_backup', 'liberary', 'status_history', record_count,
      'PMliberary status_history完全バックアップ'
    );
    
    RAISE NOTICE 'PMliberary status_history バックアップ完了: % レコード', record_count;
  END IF;
END $$;

-- PMliberary team_events テーブルバックアップ
DO $$
DECLARE
  table_exists boolean;
  record_count bigint;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'team_events'
  ) INTO table_exists;

  IF table_exists THEN
    DROP TABLE IF EXISTS backup_liberary_team_events;
    CREATE TABLE backup_liberary_team_events AS 
    SELECT 
      id,
      title,
      event_type,
      start_date,
      end_date,
      description,
      location,
      participants,
      created_by,
      'liberary' as source_project,
      now() as backup_timestamp,
      created_at,
      updated_at
    FROM team_events;
    
    GET DIAGNOSTICS record_count = ROW_COUNT;
    
    INSERT INTO backup_metadata (
      backup_type, source_project, table_name, record_count, notes
    ) VALUES (
      'full_backup', 'liberary', 'team_events', record_count,
      'PMliberary team_events完全バックアップ'
    );
    
    RAISE NOTICE 'PMliberary team_events バックアップ完了: % レコード', record_count;
  END IF;
END $$;

-- =============================================================================
-- システムメタデータのバックアップ
-- =============================================================================

-- テーブル定義のバックアップ
DO $$
DECLARE
  table_record record;
  ddl_count integer := 0;
BEGIN
  DROP TABLE IF EXISTS backup_table_definitions;
  CREATE TABLE backup_table_definitions (
    id serial PRIMARY KEY,
    table_name text,
    column_name text,
    data_type text,
    is_nullable text,
    column_default text,
    character_maximum_length integer,
    backup_timestamp timestamptz DEFAULT now()
  );

  -- 全テーブルの定義情報を保存
  INSERT INTO backup_table_definitions (
    table_name, column_name, data_type, is_nullable, 
    column_default, character_maximum_length
  )
  SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name NOT LIKE 'backup_%'
  ORDER BY table_name, ordinal_position;

  GET DIAGNOSTICS ddl_count = ROW_COUNT;
  
  INSERT INTO backup_metadata (
    backup_type, source_project, table_name, record_count, notes
  ) VALUES (
    'schema_backup', 'system', 'table_definitions', ddl_count,
    'テーブル定義情報のバックアップ'
  );
  
  RAISE NOTICE 'テーブル定義バックアップ完了: % カラム', ddl_count;
END $$;

-- インデックス情報のバックアップ
DO $$
DECLARE
  index_count integer := 0;
BEGIN
  DROP TABLE IF EXISTS backup_index_definitions;
  CREATE TABLE backup_index_definitions (
    id serial PRIMARY KEY,
    schemaname text,
    tablename text,
    indexname text,
    indexdef text,
    backup_timestamp timestamptz DEFAULT now()
  );

  INSERT INTO backup_index_definitions (
    schemaname, tablename, indexname, indexdef
  )
  SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
  FROM pg_indexes
  WHERE schemaname = 'public';

  GET DIAGNOSTICS index_count = ROW_COUNT;
  
  INSERT INTO backup_metadata (
    backup_type, source_project, table_name, record_count, notes
  ) VALUES (
    'schema_backup', 'system', 'index_definitions', index_count,
    'インデックス定義情報のバックアップ'
  );

  RAISE NOTICE 'インデックス定義バックアップ完了: % インデックス', index_count;
END $$;

-- =============================================================================
-- バックアップ整合性チェック
-- =============================================================================

-- バックアップ完了確認
DO $$
DECLARE
  total_backup_tables integer;
  total_records bigint;
  backup_duration interval;
  start_time timestamptz;
BEGIN
  -- 開始時刻取得
  SELECT created_at INTO start_time 
  FROM backup_statistics 
  WHERE backup_status = 'started' 
  ORDER BY created_at DESC 
  LIMIT 1;

  -- バックアップ統計計算
  SELECT 
    COUNT(*),
    COALESCE(SUM(record_count), 0)
  INTO total_backup_tables, total_records
  FROM backup_metadata
  WHERE created_at >= start_time;

  backup_duration := now() - start_time;

  -- 統計更新
  UPDATE backup_statistics 
  SET 
    total_tables = total_backup_tables,
    total_records = total_records,
    backup_duration = backup_duration,
    backup_status = 'completed'
  WHERE backup_status = 'started'
    AND created_at = start_time;

  RAISE NOTICE '=== バックアップ完了サマリー ===';
  RAISE NOTICE 'バックアップテーブル数: %', total_backup_tables;
  RAISE NOTICE '総レコード数: %', total_records;
  RAISE NOTICE '実行時間: %', backup_duration;
  RAISE NOTICE '完了時刻: %', now();
END $$;

-- =============================================================================
-- バックアップ検証クエリ
-- =============================================================================

-- バックアップ結果確認
SELECT 
  '=== バックアップ結果一覧 ===' as summary_header;

SELECT 
  backup_type,
  source_project,
  table_name,
  record_count,
  notes,
  created_at
FROM backup_metadata
ORDER BY source_project, table_name;

-- バックアップ統計確認
SELECT 
  '=== バックアップ統計 ===' as statistics_header;

SELECT 
  total_tables,
  total_records,
  backup_duration,
  backup_status,
  created_at as backup_completed_at
FROM backup_statistics
WHERE backup_status = 'completed'
ORDER BY created_at DESC
LIMIT 1;

-- =============================================================================
-- 復旧用スクリプト生成（参考）
-- =============================================================================

/*
復旧手順（緊急時用）:

1. PMplatto データ復旧:
   INSERT INTO programs SELECT * FROM backup_platto_programs;
   INSERT INTO calendar_tasks SELECT * FROM backup_platto_calendar_tasks;
   INSERT INTO users SELECT * FROM backup_platto_users;

2. PMliberary データ復旧:
   INSERT INTO programs SELECT * FROM backup_liberary_programs;
   INSERT INTO episodes SELECT * FROM backup_liberary_episodes;
   INSERT INTO episode_statuses SELECT * FROM backup_liberary_episode_statuses;
   INSERT INTO status_history SELECT * FROM backup_liberary_status_history;
   INSERT INTO team_events SELECT * FROM backup_liberary_team_events;

3. インデックス復旧:
   SELECT indexdef || ';' FROM backup_index_definitions;

4. 整合性チェック:
   SELECT 'programs: ' || COUNT(*) FROM programs;
   SELECT 'episodes: ' || COUNT(*) FROM episodes;
*/

-- バックアップ完了ログ
SELECT 'DELA×PM データバックアップ完了: ' || now() as backup_end;

/*
===============================================================================
バックアップファイル保存推奨:

1. SQLダンプファイル:
   pg_dump -h [host] -U [user] -d [database] -f delaxpm_backup_YYYYMMDD.sql

2. バックアップテーブルCSVエクスポート:
   \copy backup_platto_programs TO 'platto_programs_backup.csv' CSV HEADER;
   \copy backup_liberary_episodes TO 'liberary_episodes_backup.csv' CSV HEADER;

3. 圧縮保存:
   tar -czf delaxpm_backup_YYYYMMDD.tar.gz *.sql *.csv

4. 複数世代保存:
   - 日次バックアップ: 7世代保持
   - 週次バックアップ: 4世代保持  
   - 月次バックアップ: 12世代保持

===============================================================================
*/
-- 注意: このファイルは実行用スクリプトです。
-- 実際のデータを含むには、PMliberaryプロジェクトで以下を実行してください：
-- psql -h [host] -U [user] -d [database] -f backup-data.sql
