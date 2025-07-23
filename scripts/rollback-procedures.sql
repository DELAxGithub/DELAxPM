/*
===============================================================================
DELA×PM統合システム - 緊急ロールバック手順
===============================================================================

目的: 統合移行に問題が発生した場合の緊急復旧処理
対象: PMliberaryプロジェクトで実行（統合移行を実行したデータベース）
実行: 移行失敗時または重大な問題発生時の緊急措置

警告:
- このスクリプトは移行後のデータを削除します
- バックアップからの復旧が前提となります
- 実行前に必ず管理者の承認を得てください

使用方法:
1. 移行失敗を確認
2. 管理者承認を取得
3. PMliberaryプロジェクトで実行: psql -h [host] -U [user] -d [db] -f rollback-procedures.sql
4. バックアップからの復旧実行

===============================================================================
*/

-- ロールバック実行開始ログ
SELECT 'DELA×PM 緊急ロールバック開始: ' || now() as rollback_start;

-- =============================================================================
-- Phase 1: ロールバック前状況確認
-- =============================================================================

-- ロールバックメタデータテーブル作成
CREATE TABLE IF NOT EXISTS rollback_metadata (
  id bigserial PRIMARY KEY,
  rollback_phase text NOT NULL,
  operation_type text NOT NULL,
  table_name text,
  record_count_before bigint,
  record_count_after bigint,
  execution_time interval,
  status text CHECK (status IN ('started', 'completed', 'failed')),
  error_message text,
  created_at timestamptz DEFAULT now(),
  notes text
);

-- ロールバック開始記録
INSERT INTO rollback_metadata (rollback_phase, operation_type, status, notes) 
VALUES ('preparation', 'rollback_start', 'started', '緊急ロールバック開始');

-- 現在の状況確認
DO $$
DECLARE
  total_programs bigint;
  platto_programs bigint;
  liberary_programs bigint;
  total_episodes bigint;
  migration_exists boolean;
BEGIN
  RAISE NOTICE '=== ロールバック前状況確認 ===';
  
  -- レコード数確認
  SELECT COUNT(*) INTO total_programs FROM programs;
  SELECT COUNT(*) INTO platto_programs FROM programs WHERE project_type = 'platto';
  SELECT COUNT(*) INTO liberary_programs FROM programs WHERE project_type = 'liberary';
  SELECT COUNT(*) INTO total_episodes FROM episodes;
  
  RAISE NOTICE '現在のプログラム数: % (platto=%, liberary=%)', total_programs, platto_programs, liberary_programs;
  RAISE NOTICE '現在のエピソード数: %', total_episodes;
  
  -- 移行テーブルの存在確認
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'migration_metadata'
  ) INTO migration_exists;
  
  IF migration_exists THEN
    RAISE NOTICE '移行メタデータテーブルが存在します';
  ELSE
    RAISE WARNING '移行メタデータテーブルが見つかりません - 移行が実行されていない可能性があります';
  END IF;
  
  -- バックアップテーブルの存在確認
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name LIKE 'backup_liberary_%'
  ) INTO migration_exists;
  
  IF migration_exists THEN
    RAISE NOTICE 'PMliberaryバックアップテーブルが存在します';
  ELSE
    RAISE WARNING 'PMliberaryバックアップテーブルが見つかりません';
  END IF;
  
  INSERT INTO rollback_metadata (
    rollback_phase, operation_type, record_count_before, status, notes
  ) VALUES (
    'preparation', 'status_check', total_programs, 'completed',
    format('programs=%s(platto=%s,liberary=%s), episodes=%s', total_programs, platto_programs, liberary_programs, total_episodes)
  );
END $$;

-- =============================================================================
-- Phase 2: PMplattoデータの削除
-- =============================================================================

DO $$
DECLARE
  start_time timestamptz := now();
  platto_count_before bigint;
  platto_count_after bigint;
  deleted_count bigint;
BEGIN
  RAISE NOTICE '=== Phase 2: PMplattoデータ削除開始 ===';
  
  -- 削除前のPMplattoデータ数確認
  SELECT COUNT(*) INTO platto_count_before FROM programs WHERE project_type = 'platto';
  
  IF platto_count_before = 0 THEN
    RAISE NOTICE 'PMplattoデータが見つかりません - スキップします';
    
    INSERT INTO rollback_metadata (
      rollback_phase, operation_type, table_name, record_count_before, 
      record_count_after, execution_time, status, notes
    ) VALUES (
      'cleanup', 'delete_platto_data', 'programs', 0, 0, now() - start_time, 
      'completed', 'PMplattoデータなし - スキップ'
    );
    
    RETURN;
  END IF;
  
  RAISE NOTICE 'PMplattoデータ削除対象: % レコード', platto_count_before;
  
  -- PMplattoプログラムデータの削除
  DELETE FROM programs WHERE project_type = 'platto';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- 削除後確認
  SELECT COUNT(*) INTO platto_count_after FROM programs WHERE project_type = 'platto';
  
  INSERT INTO rollback_metadata (
    rollback_phase, operation_type, table_name, record_count_before, 
    record_count_after, execution_time, status, notes
  ) VALUES (
    'cleanup', 'delete_platto_data', 'programs', platto_count_before, 
    platto_count_after, now() - start_time, 'completed',
    format('PMplattoデータ削除完了: %s レコード削除', deleted_count)
  );
  
  RAISE NOTICE 'PMplattoデータ削除完了: % レコード削除', deleted_count;
END $$;

-- =============================================================================
-- Phase 3: PMliberary拡張フィールドの削除
-- =============================================================================

DO $$
DECLARE
  start_time timestamptz := now();
  column_exists boolean;
  columns_dropped integer := 0;
BEGIN
  RAISE NOTICE '=== Phase 3: 拡張フィールド削除開始 ===';
  
  -- PMplatto用に追加されたフィールドを削除
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'programs' AND column_name = 'pr_80text'
  ) INTO column_exists;
  
  IF column_exists THEN
    -- PMplatto PR管理フィールド削除
    ALTER TABLE programs DROP COLUMN IF EXISTS pr_80text;
    ALTER TABLE programs DROP COLUMN IF EXISTS pr_200text;
    ALTER TABLE programs DROP COLUMN IF EXISTS pr_completed;
    ALTER TABLE programs DROP COLUMN IF EXISTS pr_due_date;
    
    -- PMplatto進捗日付フィールド削除
    ALTER TABLE programs DROP COLUMN IF EXISTS editing_date;
    ALTER TABLE programs DROP COLUMN IF EXISTS mixing_date;
    ALTER TABLE programs DROP COLUMN IF EXISTS first_preview_date;
    ALTER TABLE programs DROP COLUMN IF EXISTS station_preview_date;
    ALTER TABLE programs DROP COLUMN IF EXISTS final_package_date;
    ALTER TABLE programs DROP COLUMN IF EXISTS on_air_date;
    ALTER TABLE programs DROP COLUMN IF EXISTS billing_date;
    
    -- 移行トレーサビリティフィールド削除
    ALTER TABLE programs DROP COLUMN IF EXISTS source_system;
    ALTER TABLE programs DROP COLUMN IF EXISTS migrated_at;
    ALTER TABLE programs DROP COLUMN IF EXISTS legacy_id;
    
    columns_dropped := 14;
    RAISE NOTICE 'PMplatto用拡張フィールド削除: % フィールド', columns_dropped;
  ELSE
    RAISE NOTICE 'PMplatto用拡張フィールドが見つかりません - スキップ';
  END IF;
  
  INSERT INTO rollback_metadata (
    rollback_phase, operation_type, table_name, record_count_before, 
    execution_time, status, notes
  ) VALUES (
    'schema_cleanup', 'drop_columns', 'programs', columns_dropped,
    now() - start_time, 'completed',
    format('PMplatto用拡張フィールド削除: %s フィールド', columns_dropped)
  );
END $$;

-- =============================================================================
-- Phase 4: project_type列の処理
-- =============================================================================

DO $$
DECLARE
  start_time timestamptz := now();
  column_exists boolean;
  programs_updated bigint;
  episodes_updated bigint;
BEGIN
  RAISE NOTICE '=== Phase 4: project_type列処理開始 ===';
  
  -- programs テーブルのproject_type処理
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'programs' AND column_name = 'project_type'
  ) INTO column_exists;
  
  IF column_exists THEN
    -- PMliberaryデータのproject_type削除（NULLに設定）
    UPDATE programs SET project_type = NULL;
    GET DIAGNOSTICS programs_updated = ROW_COUNT;
    
    -- project_type列とCHECK制約削除
    ALTER TABLE programs DROP CONSTRAINT IF EXISTS programs_project_type_check;
    ALTER TABLE programs DROP COLUMN project_type;
    
    RAISE NOTICE 'programs.project_type列削除: % レコード更新', programs_updated;
  ELSE
    programs_updated := 0;
    RAISE NOTICE 'programs.project_type列が見つかりません';
  END IF;
  
  -- episodes テーブルのproject_type処理
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'episodes' AND column_name = 'project_type'
  ) INTO column_exists;
  
  IF column_exists THEN
    UPDATE episodes SET project_type = NULL;
    GET DIAGNOSTICS episodes_updated = ROW_COUNT;
    
    ALTER TABLE episodes DROP CONSTRAINT IF EXISTS episodes_project_type_check;
    ALTER TABLE episodes DROP COLUMN project_type;
    
    RAISE NOTICE 'episodes.project_type列削除: % レコード更新', episodes_updated;
  ELSE
    episodes_updated := 0;
    RAISE NOTICE 'episodes.project_type列が見つかりません';
  END IF;
  
  INSERT INTO rollback_metadata (
    rollback_phase, operation_type, record_count_before, execution_time, status, notes
  ) VALUES (
    'schema_cleanup', 'drop_project_type', programs_updated + episodes_updated,
    now() - start_time, 'completed',
    format('project_type列削除: programs=%s, episodes=%s', programs_updated, episodes_updated)
  );
END $$;

-- =============================================================================
-- Phase 5: 統合移行用インデックスの削除
-- =============================================================================

DO $$
DECLARE
  start_time timestamptz := now();
  indexes_dropped integer := 0;
BEGIN
  RAISE NOTICE '=== Phase 5: 統合移行用インデックス削除開始 ===';
  
  -- project_type関連インデックス削除
  DROP INDEX IF EXISTS idx_programs_project_type;
  DROP INDEX IF EXISTS idx_episodes_project_type;
  DROP INDEX IF EXISTS idx_programs_platto_status;
  DROP INDEX IF EXISTS idx_programs_source_system;
  DROP INDEX IF EXISTS idx_programs_legacy_id;
  
  indexes_dropped := 5;
  
  INSERT INTO rollback_metadata (
    rollback_phase, operation_type, record_count_before, execution_time, status, notes
  ) VALUES (
    'index_cleanup', 'drop_indexes', indexes_dropped, now() - start_time, 'completed',
    format('統合移行用インデックス削除: %s インデックス', indexes_dropped)
  );
  
  RAISE NOTICE '統合移行用インデックス削除完了: % インデックス', indexes_dropped;
END $$;

-- =============================================================================
-- Phase 6: PMliberaryデータの復旧（バックアップから）
-- =============================================================================

DO $$
DECLARE
  start_time timestamptz := now();
  backup_exists boolean;
  restored_programs bigint := 0;
  restored_episodes bigint := 0;
  restored_statuses bigint := 0;
  restored_history bigint := 0;
  restored_events bigint := 0;
BEGIN
  RAISE NOTICE '=== Phase 6: PMliberaryデータ復旧開始 ===';
  
  -- バックアップテーブル存在確認
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'backup_liberary_programs'
  ) INTO backup_exists;
  
  IF NOT backup_exists THEN
    RAISE EXCEPTION 'PMliberaryバックアップテーブルが見つかりません。手動復旧が必要です。';
  END IF;
  
  -- 現在のPMliberaryデータを削除
  DELETE FROM programs WHERE id IN (
    SELECT id FROM programs 
    WHERE created_at IS NOT NULL  -- 移行前のデータを識別
  );
  
  DELETE FROM episodes;
  DELETE FROM episode_statuses WHERE id > 0;  -- 既存ステータスのみ削除
  DELETE FROM status_history;
  DELETE FROM team_events;
  
  -- バックアップからのデータ復旧
  -- programs復旧
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
    client_name, budget, broadcast_time, 
    backup_timestamp, backup_timestamp
  FROM backup_liberary_programs;
  
  GET DIAGNOSTICS restored_programs = ROW_COUNT;
  
  -- episodes復旧
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
  
  GET DIAGNOSTICS restored_episodes = ROW_COUNT;
  
  -- episode_statuses復旧
  INSERT INTO episode_statuses (id, status_name, status_order, color_code, created_at)
  SELECT id, status_name, status_order, color_code, backup_timestamp
  FROM backup_liberary_episode_statuses;
  
  GET DIAGNOSTICS restored_statuses = ROW_COUNT;
  
  -- status_history復旧
  INSERT INTO status_history (id, episode_id, old_status, new_status, changed_by, changed_at, notes)
  SELECT id, episode_id, old_status, new_status, changed_by, changed_at, notes
  FROM backup_liberary_status_history;
  
  GET DIAGNOSTICS restored_history = ROW_COUNT;
  
  -- team_events復旧
  INSERT INTO team_events (
    id, title, event_type, start_date, end_date, description,
    location, participants, created_by, created_at, updated_at
  )
  SELECT 
    id, title, event_type, start_date, end_date, description,
    location, participants, created_by, backup_timestamp, backup_timestamp
  FROM backup_liberary_team_events;
  
  GET DIAGNOSTICS restored_events = ROW_COUNT;
  
  -- シーケンス値の調整
  PERFORM setval('programs_id_seq', (SELECT COALESCE(MAX(id), 1) FROM programs));
  PERFORM setval('episodes_id_seq', (SELECT COALESCE(MAX(id), 1) FROM episodes));
  PERFORM setval('episode_statuses_id_seq', (SELECT COALESCE(MAX(id), 1) FROM episode_statuses));
  PERFORM setval('status_history_id_seq', (SELECT COALESCE(MAX(id), 1) FROM status_history));
  PERFORM setval('team_events_id_seq', (SELECT COALESCE(MAX(id), 1) FROM team_events));
  
  INSERT INTO rollback_metadata (
    rollback_phase, operation_type, record_count_after, execution_time, status, notes
  ) VALUES (
    'data_restore', 'restore_from_backup', 
    restored_programs + restored_episodes + restored_statuses + restored_history + restored_events,
    now() - start_time, 'completed',
    format('データ復旧完了 - programs:%s, episodes:%s, statuses:%s, history:%s, events:%s', 
           restored_programs, restored_episodes, restored_statuses, restored_history, restored_events)
  );
  
  RAISE NOTICE 'PMliberaryデータ復旧完了:';
  RAISE NOTICE '  - programs: %', restored_programs;
  RAISE NOTICE '  - episodes: %', restored_episodes;
  RAISE NOTICE '  - episode_statuses: %', restored_statuses;
  RAISE NOTICE '  - status_history: %', restored_history;
  RAISE NOTICE '  - team_events: %', restored_events;
END $$;

-- =============================================================================
-- Phase 7: 統計情報更新・整合性確認
-- =============================================================================

DO $$
DECLARE
  start_time timestamptz := now();
  final_programs bigint;
  final_episodes bigint;
  final_statuses bigint;
BEGIN
  RAISE NOTICE '=== Phase 7: 統計更新・整合性確認開始 ===';
  
  -- 統計情報更新
  ANALYZE programs;
  ANALYZE episodes;
  ANALYZE episode_statuses;
  ANALYZE status_history;
  ANALYZE team_events;
  
  -- 最終レコード数確認
  SELECT COUNT(*) INTO final_programs FROM programs;
  SELECT COUNT(*) INTO final_episodes FROM episodes;
  SELECT COUNT(*) INTO final_statuses FROM episode_statuses;
  
  -- 整合性チェック
  DECLARE
    orphaned_episodes bigint;
    invalid_statuses bigint;
  BEGIN
    -- 孤立エピソードチェック
    SELECT COUNT(*) INTO orphaned_episodes
    FROM episodes e
    LEFT JOIN programs p ON e.program_id = p.program_id
    WHERE p.id IS NULL;
    
    -- 無効ステータスチェック
    SELECT COUNT(*) INTO invalid_statuses
    FROM episodes e
    LEFT JOIN episode_statuses es ON e.current_status = es.status_name
    WHERE e.current_status IS NOT NULL AND es.id IS NULL;
    
    IF orphaned_episodes > 0 THEN
      RAISE WARNING '孤立エピソード発見: % レコード', orphaned_episodes;
    END IF;
    
    IF invalid_statuses > 0 THEN
      RAISE WARNING '無効ステータス発見: % レコード', invalid_statuses;
    END IF;
  END;
  
  INSERT INTO rollback_metadata (
    rollback_phase, operation_type, record_count_after, execution_time, status, notes
  ) VALUES (
    'finalization', 'statistics_update', final_programs + final_episodes + final_statuses,
    now() - start_time, 'completed',
    format('統計更新完了 - programs:%s, episodes:%s, statuses:%s', final_programs, final_episodes, final_statuses)
  );
  
  RAISE NOTICE '統計更新・整合性確認完了';
END $$;

-- =============================================================================
-- Phase 8: 移行関連テーブルの削除
-- =============================================================================

DO $$
DECLARE
  start_time timestamptz := now();
  tables_dropped integer := 0;
BEGIN
  RAISE NOTICE '=== Phase 8: 移行関連テーブル削除開始 ===';
  
  -- 移行関連テーブル削除
  DROP TABLE IF EXISTS migration_metadata;
  DROP TABLE IF EXISTS temp_platto_import;
  DROP TABLE IF EXISTS backup_table_definitions;
  DROP TABLE IF EXISTS backup_index_definitions;
  
  tables_dropped := 4;
  
  INSERT INTO rollback_metadata (
    rollback_phase, operation_type, record_count_before, execution_time, status, notes
  ) VALUES (
    'cleanup', 'drop_migration_tables', tables_dropped, now() - start_time, 'completed',
    format('移行関連テーブル削除: %s テーブル', tables_dropped)
  );
  
  RAISE NOTICE '移行関連テーブル削除完了: % テーブル', tables_dropped;
END $$;

-- =============================================================================
-- ロールバック完了処理
-- =============================================================================

DO $$
DECLARE
  rollback_start_time timestamptz;
  total_duration interval;
  final_programs_count bigint;
  final_episodes_count bigint;
BEGIN
  RAISE NOTICE '=== ロールバック完了処理開始 ===';
  
  -- ロールバック開始時刻取得
  SELECT created_at INTO rollback_start_time 
  FROM rollback_metadata 
  WHERE rollback_phase = 'preparation' AND operation_type = 'rollback_start'
  ORDER BY created_at DESC 
  LIMIT 1;
  
  total_duration := now() - rollback_start_time;
  
  -- 最終レコード数取得
  SELECT COUNT(*) INTO final_programs_count FROM programs;
  SELECT COUNT(*) INTO final_episodes_count FROM episodes;
  
  -- ロールバック完了記録
  INSERT INTO rollback_metadata (
    rollback_phase, operation_type, record_count_after, execution_time, status, notes
  ) VALUES (
    'completion', 'rollback_complete', final_programs_count + final_episodes_count, 
    total_duration, 'completed',
    format('ロールバック完了 - programs:%s, episodes:%s, 実行時間:%s', 
           final_programs_count, final_episodes_count, total_duration)
  );
  
  RAISE NOTICE '=== ロールバック完了サマリー ===';
  RAISE NOTICE '最終programs数: %', final_programs_count;
  RAISE NOTICE '最終episodes数: %', final_episodes_count;
  RAISE NOTICE '総実行時間: %', total_duration;
  RAISE NOTICE '完了時刻: %', now();
END $$;

-- =============================================================================
-- ロールバック結果確認
-- =============================================================================

-- ロールバック結果サマリー
SELECT '=== ロールバック結果サマリー ===' as summary_header;

-- テーブル別レコード数
SELECT 
  'programs' as table_name,
  COUNT(*) as record_count,
  MIN(created_at) as oldest_record,
  MAX(updated_at) as newest_record
FROM programs
UNION ALL
SELECT 
  'episodes' as table_name,
  COUNT(*) as record_count,
  MIN(created_at) as oldest_record,
  MAX(updated_at) as newest_record
FROM episodes
UNION ALL
SELECT 
  'episode_statuses' as table_name,
  COUNT(*) as record_count,
  MIN(created_at) as oldest_record,
  NULL as newest_record
FROM episode_statuses
UNION ALL
SELECT 
  'status_history' as table_name,
  COUNT(*) as record_count,
  MIN(changed_at) as oldest_record,
  MAX(changed_at) as newest_record
FROM status_history
UNION ALL
SELECT 
  'team_events' as table_name,
  COUNT(*) as record_count,
  MIN(created_at) as oldest_record,
  MAX(updated_at) as newest_record
FROM team_events;

-- ロールバック処理ログ
SELECT '=== ロールバック処理ログ ===' as log_header;

SELECT 
  rollback_phase,
  operation_type,
  table_name,
  record_count_before,
  record_count_after,
  execution_time,
  status,
  notes,
  created_at
FROM rollback_metadata
ORDER BY created_at;

-- project_type列の存在確認（削除されているべき）
SELECT 
  '=== project_type列確認 ===' as column_check_header;

SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND column_name = 'project_type'
ORDER BY table_name;

-- ロールバック完了ログ
SELECT 'DELA×PM 緊急ロールバック完了: ' || now() as rollback_end;

/*
===============================================================================
ロールバック後の確認事項:

1. データ確認:
   SELECT COUNT(*) FROM programs;
   SELECT COUNT(*) FROM episodes;
   SELECT COUNT(*) FROM episode_statuses;

2. PMliberary固有データの確認:
   SELECT * FROM programs LIMIT 5;
   SELECT * FROM episodes LIMIT 5;

3. project_type列が削除されていることを確認:
   \d programs
   \d episodes

4. アプリケーション接続テスト:
   - 元のPMliberaryアプリケーションが正常動作することを確認
   - すべての機能が移行前の状態で動作することを確認

5. バックアップテーブルの整理:
   -- 必要に応じてバックアップテーブルを削除
   DROP TABLE backup_liberary_programs;
   DROP TABLE backup_liberary_episodes;
   -- 等

ロールバック後の対応:
1. PMliberaryの元アプリケーションに切り戻し
2. ユーザーへの状況説明
3. 移行失敗原因の調査・対策立案
4. 再移行計画の検討

===============================================================================
*/