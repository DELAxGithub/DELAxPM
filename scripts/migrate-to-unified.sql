/*
===============================================================================
DELA×PM統合システム - 統合移行スクリプト
===============================================================================

目的: PMliberaryをベースとしてPMplattoデータを安全に統合
戦略: PMliberaryの拡張スキーマにPMplattoデータを移行
実行: PMliberaryプロジェクトで実行

使用方法:
1. 事前にbackup-data.sqlで両システムのバックアップを実行
2. PMliberaryプロジェクトで実行: psql -h [host] -U [user] -d [db] -f migrate-to-unified.sql
3. 移行完了後、統合版アプリケーションをデプロイ

===============================================================================
*/

-- 移行実行開始ログ
SELECT 'DELA×PM 統合移行開始: ' || now() as migration_start;

-- =============================================================================
-- Phase 1: 移行準備とスキーマ拡張
-- =============================================================================

-- 移行メタデータテーブル作成
CREATE TABLE IF NOT EXISTS migration_metadata (
  id bigserial PRIMARY KEY,
  migration_phase text NOT NULL,
  operation_type text NOT NULL,
  table_name text,
  record_count bigint,
  execution_time interval,
  status text CHECK (status IN ('started', 'completed', 'failed', 'rolled_back')),
  error_message text,
  created_at timestamptz DEFAULT now(),
  notes text
);

-- 移行開始記録
INSERT INTO migration_metadata (migration_phase, operation_type, status, notes) 
VALUES ('preparation', 'migration_start', 'started', 'PMliberaryベース統合移行開始');

-- PMliberary既存データにproject_type追加
DO $$
DECLARE
  column_exists boolean;
  programs_count bigint;
  episodes_count bigint;
BEGIN
  RAISE NOTICE 'Phase 1: PMliberaryスキーマ拡張開始';
  
  -- programs テーブルにproject_type列を追加（存在しない場合のみ）
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'programs' AND column_name = 'project_type'
  ) INTO column_exists;
  
  IF NOT column_exists THEN
    ALTER TABLE programs ADD COLUMN project_type text DEFAULT 'liberary';
    
    -- 既存データの project_type を設定
    UPDATE programs SET project_type = 'liberary' WHERE project_type IS NULL;
    
    -- NOT NULL制約追加
    ALTER TABLE programs ALTER COLUMN project_type SET NOT NULL;
    
    -- CHECKconstraint追加
    ALTER TABLE programs ADD CONSTRAINT programs_project_type_check 
    CHECK (project_type IN ('platto', 'liberary', 'unified'));
    
    RAISE NOTICE 'programs テーブルにproject_type列を追加しました';
  END IF;
  
  -- episodes テーブルにproject_type列を追加
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'episodes' AND column_name = 'project_type'
  ) INTO column_exists;
  
  IF NOT column_exists THEN
    ALTER TABLE episodes ADD COLUMN project_type text DEFAULT 'liberary';
    UPDATE episodes SET project_type = 'liberary' WHERE project_type IS NULL;
    ALTER TABLE episodes ALTER COLUMN project_type SET NOT NULL;
    ALTER TABLE episodes ADD CONSTRAINT episodes_project_type_check 
    CHECK (project_type IN ('platto', 'liberary', 'unified'));
    
    RAISE NOTICE 'episodes テーブルにproject_type列を追加しました';
  END IF;
  
  -- 移行用フィールドの追加（PMplatto固有）
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'programs' AND column_name = 'pr_80text'
  ) INTO column_exists;
  
  IF NOT column_exists THEN
    -- PMplattoのPR管理フィールド
    ALTER TABLE programs ADD COLUMN pr_80text text;
    ALTER TABLE programs ADD COLUMN pr_200text text;
    ALTER TABLE programs ADD COLUMN pr_completed boolean DEFAULT false;
    ALTER TABLE programs ADD COLUMN pr_due_date date;
    
    -- PMplatto進捗日付フィールド
    ALTER TABLE programs ADD COLUMN editing_date date;
    ALTER TABLE programs ADD COLUMN mixing_date date;
    ALTER TABLE programs ADD COLUMN first_preview_date date;
    ALTER TABLE programs ADD COLUMN station_preview_date date;
    ALTER TABLE programs ADD COLUMN final_package_date date;
    ALTER TABLE programs ADD COLUMN on_air_date date;
    ALTER TABLE programs ADD COLUMN billing_date date;
    
    -- 移行トレーサビリティフィールド
    ALTER TABLE programs ADD COLUMN source_system text;
    ALTER TABLE programs ADD COLUMN migrated_at timestamptz;
    ALTER TABLE programs ADD COLUMN legacy_id text;
    
    RAISE NOTICE 'PMplatto統合用フィールドを追加しました';
  END IF;
  
  -- 現在のレコード数取得
  SELECT COUNT(*) INTO programs_count FROM programs;
  SELECT COUNT(*) INTO episodes_count FROM episodes;
  
  INSERT INTO migration_metadata (
    migration_phase, operation_type, table_name, record_count, status, notes
  ) VALUES 
    ('schema_extension', 'alter_table', 'programs', programs_count, 'completed', 'project_type列とPMplatto用フィールド追加'),
    ('schema_extension', 'alter_table', 'episodes', episodes_count, 'completed', 'project_type列追加');
    
  RAISE NOTICE 'Phase 1完了: programs=% episodes=%', programs_count, episodes_count;
END $$;

-- =============================================================================
-- Phase 2: PMplattoデータ移行準備
-- =============================================================================

-- PMplattoデータを受け入れるための一時テーブル作成
DO $$
BEGIN
  RAISE NOTICE 'Phase 2: PMplattoデータ移行準備開始';
  
  -- PMplattoデータ受け入れ用一時テーブル
  DROP TABLE IF EXISTS temp_platto_import;
  CREATE TABLE temp_platto_import (
    -- PMplatto基本フィールド
    legacy_id bigint,
    program_id text,
    title text NOT NULL,
    subtitle text,
    status text,
    first_air_date date,
    re_air_date date,
    filming_date date,
    complete_date date,
    cast1 text,
    cast2 text,
    director text,
    script_url text,
    pr_text text,
    notes text,
    
    -- PMplatto進捗フィールド
    editing_date date,
    mixing_date date,
    first_preview_date date,
    station_preview_date date,
    final_package_date date,
    on_air_date date,
    billing_date date,
    
    -- PMplatto PR管理フィールド
    pr_80text text,
    pr_200text text,
    pr_completed boolean DEFAULT false,
    pr_due_date date,
    
    -- メタデータ
    original_created_at timestamptz,
    original_updated_at timestamptz,
    
    -- 移行用
    import_timestamp timestamptz DEFAULT now(),
    validation_status text DEFAULT 'pending'
  );
  
  RAISE NOTICE 'PMplattoデータ受け入れ用テーブル作成完了';
  
  INSERT INTO migration_metadata (
    migration_phase, operation_type, table_name, status, notes
  ) VALUES (
    'import_preparation', 'create_temp_table', 'temp_platto_import', 'completed', 
    'PMplattoデータ受け入れ用一時テーブル作成'
  );
END $$;

-- =============================================================================
-- Phase 3: PMplattoデータインポート
-- =============================================================================

/*
重要: この段階で外部からPMplattoデータをインポートする必要があります

以下のいずれかの方法でPMplattoデータをtemp_platto_importに投入してください:

方法1: バックアップテーブルからの直接移行（PMplattoとPMliberaryが同一DB内の場合）
INSERT INTO temp_platto_import (
  legacy_id, program_id, title, subtitle, status,
  first_air_date, re_air_date, filming_date, complete_date,
  cast1, cast2, director, script_url, pr_text, notes,
  editing_date, mixing_date, first_preview_date, station_preview_date,
  final_package_date, on_air_date, billing_date,
  pr_80text, pr_200text, pr_completed, pr_due_date,
  original_created_at, original_updated_at
) SELECT 
  id, program_id, title, subtitle, status,
  first_air_date, re_air_date, filming_date, complete_date,
  cast1, cast2, director, script_url, pr_text, notes,
  editing_date, mixing_date, first_preview_date, station_preview_date,
  final_package_date, on_air_date, billing_date,
  pr_80text, pr_200text, pr_completed, pr_due_date,
  created_at, updated_at
FROM backup_platto_programs;

方法2: CSVインポート
\copy temp_platto_import(legacy_id,program_id,title,subtitle,status,...) FROM 'platto_export.csv' CSV HEADER;

方法3: 外部DB接続（postgres_fdw等）
-- 事前に外部サーバー設定が必要

インポート完了後、以下を実行してください:
*/

-- PMplattoデータインポート検証
DO $$
DECLARE
  import_count bigint;
  validation_errors integer := 0;
BEGIN
  RAISE NOTICE 'Phase 3: PMplattoデータインポート検証開始';
  
  -- インポートされたレコード数確認
  SELECT COUNT(*) INTO import_count FROM temp_platto_import;
  
  IF import_count = 0 THEN
    RAISE WARNING 'PMplattoデータがインポートされていません。上記の手順に従ってデータをインポートしてください。';
    
    INSERT INTO migration_metadata (
      migration_phase, operation_type, record_count, status, error_message
    ) VALUES (
      'data_import', 'validate_import', 0, 'failed', 
      'PMplattoデータがインポートされていません'
    );
    
    RETURN;
  END IF;
  
  -- データ検証
  -- 必須フィールドチェック
  UPDATE temp_platto_import 
  SET validation_status = 'title_missing' 
  WHERE title IS NULL OR title = '';
  
  UPDATE temp_platto_import 
  SET validation_status = 'valid' 
  WHERE validation_status = 'pending' AND title IS NOT NULL AND title != '';
  
  -- 検証エラー数取得
  SELECT COUNT(*) INTO validation_errors 
  FROM temp_platto_import 
  WHERE validation_status != 'valid';
  
  IF validation_errors > 0 THEN
    RAISE WARNING 'データ検証エラー: % レコードに問題があります', validation_errors;
    
    -- エラー詳細表示
    RAISE NOTICE '検証エラー詳細:';
    PERFORM 
      RAISE NOTICE '  %: % レコード', validation_status, COUNT(*)
    FROM temp_platto_import 
    WHERE validation_status != 'valid'
    GROUP BY validation_status;
  END IF;
  
  INSERT INTO migration_metadata (
    migration_phase, operation_type, record_count, status, notes
  ) VALUES (
    'data_import', 'validate_import', import_count, 'completed',
    format('インポート完了: %s レコード、検証エラー: %s', import_count, validation_errors)
  );
  
  RAISE NOTICE 'Phase 3完了: インポート=% エラー=%', import_count, validation_errors;
END $$;

-- =============================================================================
-- Phase 4: データ統合実行
-- =============================================================================

DO $$
DECLARE
  valid_count bigint;
  migrated_count bigint;
  start_time timestamptz := now();
BEGIN
  RAISE NOTICE 'Phase 4: データ統合実行開始';
  
  -- 有効なデータ数確認
  SELECT COUNT(*) INTO valid_count 
  FROM temp_platto_import 
  WHERE validation_status = 'valid';
  
  IF valid_count = 0 THEN
    RAISE EXCEPTION 'インポートする有効なPMplattoデータがありません';
  END IF;
  
  -- PMplattoデータをprogramsテーブルに統合
  INSERT INTO programs (
    program_id,
    title,
    subtitle,
    current_status,
    project_type,
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
    source_system,
    migrated_at,
    legacy_id,
    created_at,
    updated_at
  )
  SELECT 
    program_id,
    title,
    subtitle,
    status, -- current_statusにマッピング
    'platto', -- project_type
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
    'pmplatto', -- source_system
    now(), -- migrated_at
    legacy_id::text, -- legacy_id
    original_created_at,
    original_updated_at
  FROM temp_platto_import
  WHERE validation_status = 'valid';
  
  GET DIAGNOSTICS migrated_count = ROW_COUNT;
  
  INSERT INTO migration_metadata (
    migration_phase, operation_type, table_name, record_count, 
    execution_time, status, notes
  ) VALUES (
    'data_migration', 'insert_programs', 'programs', migrated_count,
    now() - start_time, 'completed',
    format('PMplattoプログラム統合完了: %s レコード', migrated_count)
  );
  
  RAISE NOTICE 'Phase 4完了: 統合=%', migrated_count;
END $$;

-- =============================================================================
-- Phase 5: インデックス最適化
-- =============================================================================

DO $$
DECLARE
  start_time timestamptz := now();
BEGIN
  RAISE NOTICE 'Phase 5: インデックス最適化開始';
  
  -- project_type用インデックス作成
  CREATE INDEX IF NOT EXISTS idx_programs_project_type ON programs(project_type);
  CREATE INDEX IF NOT EXISTS idx_episodes_project_type ON episodes(project_type);
  
  -- PMplatto用複合インデックス
  CREATE INDEX IF NOT EXISTS idx_programs_platto_status 
  ON programs(project_type, current_status) 
  WHERE project_type = 'platto';
  
  -- 移行データ検索用インデックス
  CREATE INDEX IF NOT EXISTS idx_programs_source_system ON programs(source_system);
  CREATE INDEX IF NOT EXISTS idx_programs_legacy_id ON programs(legacy_id);
  
  -- 統計情報更新
  ANALYZE programs;
  ANALYZE episodes;
  
  INSERT INTO migration_metadata (
    migration_phase, operation_type, execution_time, status, notes
  ) VALUES (
    'optimization', 'create_indexes', now() - start_time, 'completed',
    'project_type関連インデックス作成・統計更新完了'
  );
  
  RAISE NOTICE 'Phase 5完了: インデックス最適化';
END $$;

-- =============================================================================
-- Phase 6: データ整合性チェック
-- =============================================================================

DO $$
DECLARE
  total_programs bigint;
  platto_programs bigint;
  liberary_programs bigint;
  total_episodes bigint;
  liberary_episodes bigint;
  integrity_issues integer := 0;
BEGIN
  RAISE NOTICE 'Phase 6: データ整合性チェック開始';
  
  -- レコード数確認
  SELECT COUNT(*) INTO total_programs FROM programs;
  SELECT COUNT(*) INTO platto_programs FROM programs WHERE project_type = 'platto';
  SELECT COUNT(*) INTO liberary_programs FROM programs WHERE project_type = 'liberary';
  SELECT COUNT(*) INTO total_episodes FROM episodes;
  SELECT COUNT(*) INTO liberary_episodes FROM episodes WHERE project_type = 'liberary';
  
  -- 整合性チェック
  -- 1. project_type値の検証
  SELECT COUNT(*) INTO integrity_issues 
  FROM programs 
  WHERE project_type NOT IN ('platto', 'liberary', 'unified');
  
  IF integrity_issues > 0 THEN
    RAISE WARNING 'programs.project_type不正値: % レコード', integrity_issues;
  END IF;
  
  -- 2. 必須フィールドチェック
  SELECT COUNT(*) INTO integrity_issues 
  FROM programs 
  WHERE title IS NULL OR title = '';
  
  IF integrity_issues > 0 THEN
    RAISE WARNING 'programs.title欠損: % レコード', integrity_issues;
  END IF;
  
  -- 3. PMplattoデータの移行確認
  SELECT COUNT(*) INTO integrity_issues 
  FROM programs 
  WHERE project_type = 'platto' AND source_system IS NULL;
  
  IF integrity_issues > 0 THEN
    RAISE WARNING 'PMplattoデータのsource_system未設定: % レコード', integrity_issues;
  END IF;
  
  INSERT INTO migration_metadata (
    migration_phase, operation_type, record_count, status, notes
  ) VALUES (
    'integrity_check', 'data_validation', total_programs, 'completed',
    format('整合性チェック完了: programs=%s(platto=%s,liberary=%s), episodes=%s', 
           total_programs, platto_programs, liberary_programs, total_episodes)
  );
  
  RAISE NOTICE 'Phase 6完了: programs=%(platto=%, liberary=%), episodes=%', 
               total_programs, platto_programs, liberary_programs, total_episodes;
END $$;

-- =============================================================================
-- Phase 7: 統合完了処理
-- =============================================================================

DO $$
DECLARE
  migration_start_time timestamptz;
  total_duration interval;
  final_programs_count bigint;
  final_episodes_count bigint;
BEGIN
  RAISE NOTICE 'Phase 7: 統合完了処理開始';
  
  -- 移行開始時刻取得
  SELECT created_at INTO migration_start_time 
  FROM migration_metadata 
  WHERE migration_phase = 'preparation' AND operation_type = 'migration_start'
  ORDER BY created_at DESC 
  LIMIT 1;
  
  total_duration := now() - migration_start_time;
  
  -- 最終レコード数取得
  SELECT COUNT(*) INTO final_programs_count FROM programs;
  SELECT COUNT(*) INTO final_episodes_count FROM episodes;
  
  -- 一時テーブル削除
  DROP TABLE IF EXISTS temp_platto_import;
  
  -- 移行完了記録
  INSERT INTO migration_metadata (
    migration_phase, operation_type, record_count, execution_time, status, notes
  ) VALUES (
    'completion', 'migration_complete', final_programs_count, total_duration, 'completed',
    format('統合移行完了: programs=%s, episodes=%s, 実行時間=%s', 
           final_programs_count, final_episodes_count, total_duration)
  );
  
  RAISE NOTICE '=== 統合移行完了サマリー ===';
  RAISE NOTICE '最終programs数: %', final_programs_count;
  RAISE NOTICE '最終episodes数: %', final_episodes_count;
  RAISE NOTICE '総実行時間: %', total_duration;
  RAISE NOTICE '完了時刻: %', now();
END $$;

-- =============================================================================
-- 移行結果確認クエリ
-- =============================================================================

-- 移行結果サマリー
SELECT '=== 統合移行結果サマリー ===' as summary_header;

SELECT 
  project_type,
  COUNT(*) as program_count,
  COUNT(CASE WHEN source_system = 'pmplatto' THEN 1 END) as migrated_from_platto,
  COUNT(CASE WHEN current_status IS NOT NULL THEN 1 END) as with_status
FROM programs 
GROUP BY project_type
UNION ALL
SELECT 
  'TOTAL' as project_type,
  COUNT(*) as program_count,
  COUNT(CASE WHEN source_system = 'pmplatto' THEN 1 END) as migrated_from_platto,
  COUNT(CASE WHEN current_status IS NOT NULL THEN 1 END) as with_status
FROM programs;

-- エピソード数確認
SELECT 
  project_type,
  COUNT(*) as episode_count
FROM episodes 
GROUP BY project_type
UNION ALL
SELECT 
  'TOTAL' as project_type,
  COUNT(*) as episode_count
FROM episodes;

-- 移行処理ログ
SELECT 
  '=== 移行処理ログ ===' as log_header;

SELECT 
  migration_phase,
  operation_type,
  table_name,
  record_count,
  execution_time,
  status,
  notes,
  created_at
FROM migration_metadata
ORDER BY created_at;

-- 移行完了ログ
SELECT 'DELA×PM 統合移行完了: ' || now() as migration_end;

/*
===============================================================================
移行後の確認事項:

1. データ確認:
   SELECT project_type, COUNT(*) FROM programs GROUP BY project_type;
   SELECT project_type, COUNT(*) FROM episodes GROUP BY project_type;

2. PMplattoデータ確認:
   SELECT * FROM programs WHERE project_type = 'platto' LIMIT 5;

3. インデックス確認:
   \d programs
   \d episodes

4. アプリケーション接続テスト:
   - 統合版Next.jsアプリから両プロジェクトのデータが表示されることを確認
   - ダッシュボードでplatto/liberaryの統計が正しく表示されることを確認

5. パフォーマンステスト:
   EXPLAIN ANALYZE SELECT * FROM programs WHERE project_type = 'platto';
   EXPLAIN ANALYZE SELECT * FROM episodes WHERE project_type = 'liberary';

===============================================================================
*/