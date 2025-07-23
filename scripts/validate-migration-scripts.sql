/*
===============================================================================
DELA×PM統合システム - 移行スクリプト検証テスト
===============================================================================

目的: 移行・バックアップ・ロールバックスクリプトの動作検証
対象: テスト環境での実行（本番実行前の検証）
実行: 検証用データベースで実行推奨

使用方法:
1. テスト用データベース環境を準備
2. PMliberary・PMplattoのサンプルデータを投入
3. 本スクリプトで各段階の動作を検証
4. 問題があれば修正後に再検証

===============================================================================
*/

-- 検証実行開始ログ
SELECT 'DELA×PM 移行スクリプト検証開始: ' || now() as validation_start;

-- =============================================================================
-- Phase 1: テスト環境準備
-- =============================================================================

-- 検証メタデータテーブル作成
CREATE TABLE IF NOT EXISTS validation_metadata (
  id bigserial PRIMARY KEY,
  test_phase text NOT NULL,
  test_case text NOT NULL,
  expected_result text,
  actual_result text,
  status text CHECK (status IN ('pass', 'fail', 'warning', 'skip')),
  error_message text,
  execution_time interval,
  created_at timestamptz DEFAULT now()
);

-- 検証開始記録
INSERT INTO validation_metadata (test_phase, test_case, status) 
VALUES ('preparation', 'validation_start', 'pass');

-- テスト用サンプルデータ作成
DO $$
DECLARE
  programs_exists boolean;
  episodes_exists boolean;
BEGIN
  RAISE NOTICE '=== Phase 1: テスト環境準備 ===';
  
  -- 既存テーブル確認
  SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'programs') INTO programs_exists;
  SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'episodes') INTO episodes_exists;
  
  IF NOT programs_exists THEN
    -- PMliberary風のテストテーブル作成
    CREATE TABLE programs (
      id bigserial PRIMARY KEY,
      program_id text UNIQUE NOT NULL,
      title text NOT NULL,
      subtitle text,
      current_status text,
      program_type text,
      season_number integer,
      first_air_date date,
      re_air_date date,
      filming_date date,
      complete_date date,
      cast1 text,
      cast2 text,
      director text,
      producer text,
      script_url text,
      pr_text text,
      notes text,
      client_name text,
      budget numeric,
      broadcast_time text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
    
    RAISE NOTICE 'テスト用programsテーブル作成';
  END IF;
  
  IF NOT episodes_exists THEN
    CREATE TABLE episodes (
      id bigserial PRIMARY KEY,
      episode_id text UNIQUE NOT NULL,
      program_id text NOT NULL,
      title text NOT NULL,
      episode_type text CHECK (episode_type IN ('interview', 'vtr')),
      season integer,
      episode_number integer,
      script_url text,
      current_status text,
      director text,
      due_date date,
      interview_guest text,
      interview_date date,
      interview_location text,
      vtr_location text,
      vtr_theme text,
      notes text,
      estimated_duration interval,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
    
    CREATE TABLE episode_statuses (
      id bigserial PRIMARY KEY,
      status_name text UNIQUE NOT NULL,
      status_order integer,
      color_code text,
      created_at timestamptz DEFAULT now()
    );
    
    CREATE TABLE status_history (
      id bigserial PRIMARY KEY,
      episode_id text NOT NULL,
      old_status text,
      new_status text,
      changed_by text,
      changed_at timestamptz DEFAULT now(),
      notes text
    );
    
    CREATE TABLE team_events (
      id bigserial PRIMARY KEY,
      title text NOT NULL,
      event_type text,
      start_date date,
      end_date date,
      description text,
      location text,
      participants text[],
      created_by text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
    
    RAISE NOTICE 'テスト用episodesテーブル群作成';
  END IF;
  
  INSERT INTO validation_metadata (test_phase, test_case, status) 
  VALUES ('preparation', 'test_tables_created', 'pass');
END $$;

-- サンプルデータ投入
DO $$
DECLARE
  sample_programs integer := 0;
  sample_episodes integer := 0;
BEGIN
  -- PMliberary風サンプルプログラム
  INSERT INTO programs (
    program_id, title, subtitle, current_status, program_type, season_number,
    first_air_date, cast1, cast2, director, producer, client_name
  ) VALUES 
    ('LIB001', 'テストリベラリー番組1', 'サブタイトル1', '台本作成中', 'regular', 1,
     '2024-04-01', '出演者A', '出演者B', '演出者1', 'プロデューサー1', 'クライアント1'),
    ('LIB002', 'テストリベラリー番組2', 'サブタイトル2', '撮影準備中', 'special', 1,
     '2024-05-01', '出演者C', '出演者D', '演出者2', 'プロデューサー2', 'クライアント2'),
    ('LIB003', 'テストリベラリー番組3', 'サブタイトル3', '完パケ納品', 'regular', 2,
     '2024-06-01', '出演者E', '出演者F', '演出者3', 'プロデューサー3', 'クライアント3')
  ON CONFLICT (program_id) DO NOTHING;
  
  GET DIAGNOSTICS sample_programs = ROW_COUNT;
  
  -- PMliberary風サンプルエピソード
  INSERT INTO episodes (
    episode_id, program_id, title, episode_type, season, episode_number,
    current_status, director, interview_guest, vtr_theme
  ) VALUES 
    ('EP001', 'LIB001', 'エピソード1', 'interview', 1, 1, '台本作成中', '演出者1', 'ゲスト1', NULL),
    ('EP002', 'LIB001', 'エピソード2', 'vtr', 1, 2, '撮影準備中', '演出者1', NULL, 'VTRテーマ1'),
    ('EP003', 'LIB002', 'エピソード3', 'interview', 1, 1, '編集中', '演出者2', 'ゲスト2', NULL),
    ('EP004', 'LIB003', 'エピソード4', 'vtr', 2, 1, '完パケ納品', '演出者3', NULL, 'VTRテーマ2')
  ON CONFLICT (episode_id) DO NOTHING;
  
  GET DIAGNOSTICS sample_episodes = ROW_COUNT;
  
  -- エピソードステータス
  INSERT INTO episode_statuses (status_name, status_order, color_code) VALUES 
    ('台本作成中', 1, '#fbbf24'),
    ('撮影準備中', 2, '#fb923c'),
    ('編集中', 3, '#60a5fa'),
    ('完パケ納品', 10, '#10b981')
  ON CONFLICT (status_name) DO NOTHING;
  
  INSERT INTO validation_metadata (test_phase, test_case, actual_result, status) 
  VALUES ('preparation', 'sample_data_inserted', 
          format('programs:%s, episodes:%s', sample_programs, sample_episodes), 'pass');
          
  RAISE NOTICE 'サンプルデータ投入: programs=%, episodes=%', sample_programs, sample_episodes;
END $$;

-- =============================================================================
-- Phase 2: バックアップスクリプト検証
-- =============================================================================

DO $$
DECLARE
  start_time timestamptz := now();
  backup_programs bigint;
  backup_episodes bigint;
  backup_tables_created integer := 0;
BEGIN
  RAISE NOTICE '=== Phase 2: バックアップスクリプト検証 ===';
  
  -- バックアップメタデータテーブル作成（backup-data.sqlの一部をシミュレート）
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
  
  -- PMliberaryデータのバックアップシミュレート
  DROP TABLE IF EXISTS backup_liberary_programs;
  CREATE TABLE backup_liberary_programs AS 
  SELECT 
    id, program_id, title, subtitle, current_status as status, program_type, season_number,
    first_air_date, re_air_date, filming_date, complete_date,
    cast1, cast2, director, producer, script_url, pr_text, notes,
    client_name, budget, broadcast_time,
    'liberary' as source_project,
    now() as backup_timestamp,
    created_at, updated_at
  FROM programs;
  
  GET DIAGNOSTICS backup_programs = ROW_COUNT;
  backup_tables_created := backup_tables_created + 1;
  
  DROP TABLE IF EXISTS backup_liberary_episodes;
  CREATE TABLE backup_liberary_episodes AS 
  SELECT 
    id, episode_id, program_id, title, episode_type, season, episode_number,
    script_url, current_status, director, due_date, interview_guest,
    interview_date, interview_location, vtr_location, vtr_theme, notes,
    estimated_duration,
    'liberary' as source_project,
    now() as backup_timestamp,
    created_at, updated_at
  FROM episodes;
  
  GET DIAGNOSTICS backup_episodes = ROW_COUNT;
  backup_tables_created := backup_tables_created + 1;
  
  -- バックアップメタデータ記録
  INSERT INTO backup_metadata (backup_type, source_project, table_name, record_count, notes) VALUES 
    ('full_backup', 'liberary', 'programs', backup_programs, 'テスト用PMliberaryプログラムバックアップ'),
    ('full_backup', 'liberary', 'episodes', backup_episodes, 'テスト用PMliberaryエピソードバックアップ');
  
  -- 検証結果記録
  INSERT INTO validation_metadata (
    test_phase, test_case, expected_result, actual_result, status, execution_time
  ) VALUES (
    'backup_validation', 'backup_tables_created', 
    'programs and episodes backup tables created',
    format('backup_programs:%s, backup_episodes:%s', backup_programs, backup_episodes),
    CASE WHEN backup_programs > 0 AND backup_episodes > 0 THEN 'pass' ELSE 'fail' END,
    now() - start_time
  );
  
  RAISE NOTICE 'バックアップ検証完了: programs=%, episodes=%', backup_programs, backup_episodes;
END $$;

-- =============================================================================
-- Phase 3: 移行スクリプト検証（部分実行）
-- =============================================================================

DO $$
DECLARE
  start_time timestamptz := now();
  original_programs bigint;
  programs_with_project_type bigint;
  migration_columns_added boolean := false;
BEGIN
  RAISE NOTICE '=== Phase 3: 移行スクリプト検証 ===';
  
  -- 移行前のレコード数
  SELECT COUNT(*) INTO original_programs FROM programs;
  
  -- スキーマ拡張のシミュレート（migrate-to-unified.sqlのPhase 1部分）
  BEGIN
    -- project_type列追加
    ALTER TABLE programs ADD COLUMN project_type text DEFAULT 'liberary';
    UPDATE programs SET project_type = 'liberary' WHERE project_type IS NULL;
    ALTER TABLE programs ALTER COLUMN project_type SET NOT NULL;
    ALTER TABLE programs ADD CONSTRAINT programs_project_type_check 
    CHECK (project_type IN ('platto', 'liberary', 'unified'));
    
    -- PMplatto用フィールド追加
    ALTER TABLE programs ADD COLUMN pr_80text text;
    ALTER TABLE programs ADD COLUMN pr_200text text;
    ALTER TABLE programs ADD COLUMN pr_completed boolean DEFAULT false;
    ALTER TABLE programs ADD COLUMN source_system text;
    ALTER TABLE programs ADD COLUMN migrated_at timestamptz;
    ALTER TABLE programs ADD COLUMN legacy_id text;
    
    migration_columns_added := true;
    
    RAISE NOTICE '移行用スキーマ拡張完了';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'スキーマ拡張: 列が既に存在します（スキップ）';
    migration_columns_added := true;
  WHEN OTHERS THEN
    RAISE WARNING '移行スキーマ拡張でエラー: %', SQLERRM;
    migration_columns_added := false;
  END;
  
  -- project_type設定後のレコード数確認
  SELECT COUNT(*) INTO programs_with_project_type FROM programs WHERE project_type = 'liberary';
  
  -- インデックス作成テスト
  BEGIN
    CREATE INDEX IF NOT EXISTS idx_programs_project_type_test ON programs(project_type);
    RAISE NOTICE 'project_typeインデックス作成成功';
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'インデックス作成でエラー: %', SQLERRM;
  END;
  
  -- 検証結果記録
  INSERT INTO validation_metadata (
    test_phase, test_case, expected_result, actual_result, status, execution_time
  ) VALUES (
    'migration_validation', 'schema_extension', 
    format('project_type added to %s programs', original_programs),
    format('migration_columns_added:%s, programs_with_project_type:%s', migration_columns_added, programs_with_project_type),
    CASE WHEN migration_columns_added AND programs_with_project_type = original_programs THEN 'pass' ELSE 'fail' END,
    now() - start_time
  );
  
  RAISE NOTICE '移行スキーマ検証完了: 拡張=%、project_type設定=%', migration_columns_added, programs_with_project_type;
END $$;

-- PMplattoデータ投入テスト
DO $$
DECLARE
  start_time timestamptz := now();
  platto_programs_added bigint;
  total_programs_after bigint;
BEGIN
  -- テスト用PMplattoデータ追加
  INSERT INTO programs (
    program_id, title, subtitle, current_status, project_type,
    first_air_date, cast1, cast2, director, pr_80text, pr_200text,
    source_system, migrated_at, legacy_id
  ) VALUES 
    ('PLT001', 'テストプラット番組1', 'サブタイトル1', 'キャスティング中', 'platto',
     '2024-04-15', '出演者G', '出演者H', '演出者4', 'PR80文字テスト', 'PR200文字テスト',
     'pmplatto', now(), 'original_1'),
    ('PLT002', 'テストプラット番組2', 'サブタイトル2', 'OA済', 'platto',
     '2024-05-15', '出演者I', '出演者J', '演出者5', 'PR80文字テスト2', 'PR200文字テスト2',
     'pmplatto', now(), 'original_2')
  ON CONFLICT (program_id) DO NOTHING;
  
  GET DIAGNOSTICS platto_programs_added = ROW_COUNT;
  SELECT COUNT(*) INTO total_programs_after FROM programs;
  
  -- 検証結果記録
  INSERT INTO validation_metadata (
    test_phase, test_case, expected_result, actual_result, status, execution_time
  ) VALUES (
    'migration_validation', 'platto_data_integration', 
    'PMplatto test data added successfully',
    format('platto_programs_added:%s, total_programs:%s', platto_programs_added, total_programs_after),
    CASE WHEN platto_programs_added > 0 THEN 'pass' ELSE 'fail' END,
    now() - start_time
  );
  
  RAISE NOTICE 'PMplattoデータ統合テスト完了: 追加=%、総数=%', platto_programs_added, total_programs_after;
END $$;

-- =============================================================================
-- Phase 4: ロールバックスクリプト検証
-- =============================================================================

DO $$
DECLARE
  start_time timestamptz := now();
  platto_programs_before bigint;
  platto_programs_after bigint;
  project_type_exists boolean;
BEGIN
  RAISE NOTICE '=== Phase 4: ロールバックスクリプト検証 ===';
  
  -- ロールバック前のPMplattoデータ数
  SELECT COUNT(*) INTO platto_programs_before FROM programs WHERE project_type = 'platto';
  
  -- PMplattoデータ削除のシミュレート（rollback-procedures.sqlの一部）
  DELETE FROM programs WHERE project_type = 'platto';
  
  SELECT COUNT(*) INTO platto_programs_after FROM programs WHERE project_type = 'platto';
  
  -- project_type列削除のシミュレート
  BEGIN
    ALTER TABLE programs DROP CONSTRAINT IF EXISTS programs_project_type_check;
    ALTER TABLE programs DROP COLUMN IF EXISTS project_type;
    
    -- PMplatto用フィールド削除
    ALTER TABLE programs DROP COLUMN IF EXISTS pr_80text;
    ALTER TABLE programs DROP COLUMN IF EXISTS pr_200text;
    ALTER TABLE programs DROP COLUMN IF EXISTS pr_completed;
    ALTER TABLE programs DROP COLUMN IF EXISTS source_system;
    ALTER TABLE programs DROP COLUMN IF EXISTS migrated_at;
    ALTER TABLE programs DROP COLUMN IF EXISTS legacy_id;
    
    -- インデックス削除
    DROP INDEX IF EXISTS idx_programs_project_type_test;
    
    RAISE NOTICE 'ロールバックスキーマ変更完了';
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'ロールバックスキーマ変更でエラー: %', SQLERRM;
  END;
  
  -- project_type列が削除されたか確認
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'programs' AND column_name = 'project_type'
  ) INTO project_type_exists;
  
  -- 検証結果記録
  INSERT INTO validation_metadata (
    test_phase, test_case, expected_result, actual_result, status, execution_time
  ) VALUES (
    'rollback_validation', 'platto_data_cleanup', 
    format('PMplatto data deleted, project_type column removed'),
    format('platto_before:%s, platto_after:%s, project_type_exists:%s', 
           platto_programs_before, platto_programs_after, project_type_exists),
    CASE WHEN platto_programs_after = 0 AND NOT project_type_exists THEN 'pass' ELSE 'fail' END,
    now() - start_time
  );
  
  RAISE NOTICE 'ロールバック検証完了: platto削除=%→%、project_type列存在=%', 
               platto_programs_before, platto_programs_after, project_type_exists;
END $$;

-- =============================================================================
-- Phase 5: データ整合性・性能検証
-- =============================================================================

DO $$
DECLARE
  start_time timestamptz := now();
  total_programs bigint;
  total_episodes bigint;
  orphaned_episodes bigint;
  query_time interval;
  query_start timestamptz;
BEGIN
  RAISE NOTICE '=== Phase 5: データ整合性・性能検証 ===';
  
  -- レコード数確認
  SELECT COUNT(*) INTO total_programs FROM programs;
  SELECT COUNT(*) INTO total_episodes FROM episodes;
  
  -- データ整合性チェック
  SELECT COUNT(*) INTO orphaned_episodes
  FROM episodes e
  LEFT JOIN programs p ON e.program_id = p.program_id
  WHERE p.id IS NULL;
  
  -- クエリ性能テスト
  query_start := clock_timestamp();
  PERFORM COUNT(*) FROM programs WHERE title LIKE '%テスト%';
  query_time := clock_timestamp() - query_start;
  
  -- 検証結果記録
  INSERT INTO validation_metadata (
    test_phase, test_case, expected_result, actual_result, status, execution_time
  ) VALUES (
    'integrity_validation', 'data_consistency_check', 
    'No orphaned episodes, reasonable query performance',
    format('programs:%s, episodes:%s, orphaned:%s, query_time:%s', 
           total_programs, total_episodes, orphaned_episodes, query_time),
    CASE WHEN orphaned_episodes = 0 AND query_time < interval '1 second' THEN 'pass' 
         WHEN orphaned_episodes = 0 THEN 'warning' 
         ELSE 'fail' END,
    now() - start_time
  );
  
  RAISE NOTICE '整合性検証完了: programs=%, episodes=%, 孤立=%, クエリ時間=%', 
               total_programs, total_episodes, orphaned_episodes, query_time;
END $$;

-- =============================================================================
-- Phase 6: バックアップ復旧検証
-- =============================================================================

DO $$
DECLARE
  start_time timestamptz := now();
  programs_before_restore bigint;
  programs_after_restore bigint;
  episodes_after_restore bigint;
  restore_success boolean := true;
BEGIN
  RAISE NOTICE '=== Phase 6: バックアップ復旧検証 ===';
  
  SELECT COUNT(*) INTO programs_before_restore FROM programs;
  
  -- 現在のデータを削除してバックアップから復旧のシミュレート
  DELETE FROM programs;
  DELETE FROM episodes;
  
  BEGIN
    -- バックアップからの復旧
    INSERT INTO programs (
      id, program_id, title, subtitle, current_status, program_type, season_number,
      first_air_date, re_air_date, filming_date, complete_date,
      cast1, cast2, director, producer, script_url, pr_text, notes,
      client_name, budget, broadcast_time, created_at, updated_at
    )
    SELECT 
      id, program_id, title, subtitle, status, program_type, season_number,
      first_air_date, re_air_date, filming_date, complete_date,
      cast1, cast2, director, producer, script_url, pr_text, notes,
      client_name, budget, broadcast_time, backup_timestamp, backup_timestamp
    FROM backup_liberary_programs;
    
    INSERT INTO episodes (
      id, episode_id, program_id, title, episode_type, season, episode_number,
      script_url, current_status, director, due_date, interview_guest,
      interview_date, interview_location, vtr_location, vtr_theme, notes,
      estimated_duration, created_at, updated_at
    )
    SELECT 
      id, episode_id, program_id, title, episode_type, season, episode_number,
      script_url, current_status, director, due_date, interview_guest,
      interview_date, interview_location, vtr_location, vtr_theme, notes,
      estimated_duration, backup_timestamp, backup_timestamp
    FROM backup_liberary_episodes;
    
    -- シーケンス調整
    PERFORM setval('programs_id_seq', (SELECT COALESCE(MAX(id), 1) FROM programs));
    PERFORM setval('episodes_id_seq', (SELECT COALESCE(MAX(id), 1) FROM episodes));
    
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'バックアップ復旧でエラー: %', SQLERRM;
    restore_success := false;
  END;
  
  SELECT COUNT(*) INTO programs_after_restore FROM programs;
  SELECT COUNT(*) INTO episodes_after_restore FROM episodes;
  
  -- 検証結果記録
  INSERT INTO validation_metadata (
    test_phase, test_case, expected_result, actual_result, status, execution_time
  ) VALUES (
    'backup_restore_validation', 'restore_from_backup', 
    'Data successfully restored from backup',
    format('restore_success:%s, programs_restored:%s, episodes_restored:%s', 
           restore_success, programs_after_restore, episodes_after_restore),
    CASE WHEN restore_success AND programs_after_restore > 0 AND episodes_after_restore > 0 THEN 'pass' ELSE 'fail' END,
    now() - start_time
  );
  
  RAISE NOTICE 'バックアップ復旧検証完了: 成功=%, programs=%, episodes=%', 
               restore_success, programs_after_restore, episodes_after_restore;
END $$;

-- =============================================================================
-- 検証結果サマリー
-- =============================================================================

DO $$
DECLARE
  total_tests bigint;
  passed_tests bigint;
  failed_tests bigint;
  warning_tests bigint;
  validation_duration interval;
  validation_start_time timestamptz;
BEGIN
  RAISE NOTICE '=== 検証結果サマリー ===';
  
  -- 検証開始時刻取得
  SELECT created_at INTO validation_start_time 
  FROM validation_metadata 
  WHERE test_phase = 'preparation' AND test_case = 'validation_start'
  ORDER BY created_at DESC 
  LIMIT 1;
  
  validation_duration := now() - validation_start_time;
  
  -- テスト結果集計
  SELECT COUNT(*) INTO total_tests FROM validation_metadata WHERE status IN ('pass', 'fail', 'warning');
  SELECT COUNT(*) INTO passed_tests FROM validation_metadata WHERE status = 'pass';
  SELECT COUNT(*) INTO failed_tests FROM validation_metadata WHERE status = 'fail';
  SELECT COUNT(*) INTO warning_tests FROM validation_metadata WHERE status = 'warning';
  
  -- サマリー記録
  INSERT INTO validation_metadata (
    test_phase, test_case, actual_result, status
  ) VALUES (
    'completion', 'validation_summary',
    format('総テスト数:%s, 成功:%s, 失敗:%s, 警告:%s, 実行時間:%s', 
           total_tests, passed_tests, failed_tests, warning_tests, validation_duration),
    CASE WHEN failed_tests = 0 THEN 'pass' ELSE 'fail' END
  );
  
  RAISE NOTICE '検証完了サマリー:';
  RAISE NOTICE '  総テスト数: %', total_tests;
  RAISE NOTICE '  成功: %', passed_tests;
  RAISE NOTICE '  失敗: %', failed_tests;
  RAISE NOTICE '  警告: %', warning_tests;
  RAISE NOTICE '  実行時間: %', validation_duration;
  RAISE NOTICE '  成功率: %%%', ROUND((passed_tests::numeric / total_tests::numeric) * 100, 1);
END $$;

-- =============================================================================
-- 詳細検証結果表示
-- =============================================================================

-- 検証結果一覧
SELECT '=== 検証結果詳細 ===' as results_header;

SELECT 
  test_phase,
  test_case,
  expected_result,
  actual_result,
  status,
  execution_time,
  CASE 
    WHEN error_message IS NOT NULL THEN error_message
    ELSE 'OK'
  END as message,
  created_at
FROM validation_metadata
WHERE status IN ('pass', 'fail', 'warning')
ORDER BY created_at;

-- 失敗・警告テストの詳細
SELECT '=== 要確認項目 ===' as issues_header;

SELECT 
  test_phase,
  test_case,
  status,
  actual_result,
  error_message,
  created_at
FROM validation_metadata
WHERE status IN ('fail', 'warning')
ORDER BY status DESC, created_at;

-- 検証完了ログ
SELECT 'DELA×PM 移行スクリプト検証完了: ' || now() as validation_end;

/*
===============================================================================
検証結果の評価基準:

PASS: テストが期待通りに完了
FAIL: テストが失敗、修正が必要
WARNING: テストは完了したが性能面等で注意が必要

次のステップ:
1. FAILステータスのテストがある場合は該当スクリプトを修正
2. WARNINGステータスは性能改善やログ確認
3. 全テストがPASSの場合は本番移行準備を進行

推奨事項:
- 各移行フェーズでこの検証スクリプトを実行
- 本番環境移行前の最終確認として使用
- 移行後のヘルスチェックとしても活用可能

===============================================================================
*/