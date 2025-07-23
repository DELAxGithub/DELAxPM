-- ==============================================================================
-- PMliberary既存構造を維持したproject_type追加移行スクリプト
-- ==============================================================================
-- 
-- 前提: PMliberaryの既存テーブル構造を完全に維持
-- 目的: project_typeカラムのみを安全に追加
--
-- 実行前に check-existing-schema.sql で構造を確認してください
-- ==============================================================================

-- ステップ1: project_typeカラムの安全な追加
-- ==============================================================================

-- 1.1 project_type列が存在しない場合のみ追加
DO $$ 
BEGIN
    -- project_typeカラムの存在確認
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'programs' 
        AND column_name = 'project_type'
    ) THEN
        -- カラム追加（既存データはliberaryとして設定）
        ALTER TABLE programs 
        ADD COLUMN project_type text DEFAULT 'liberary';
        
        RAISE NOTICE 'project_type column added successfully';
    ELSE
        RAISE NOTICE 'project_type column already exists';
    END IF;
END $$;

-- 1.2 既存データのproject_type設定（NULL値をliberaryに更新）
UPDATE programs 
SET project_type = 'liberary' 
WHERE project_type IS NULL;

-- 1.3 NOT NULL制約の追加
ALTER TABLE programs 
ALTER COLUMN project_type SET NOT NULL;

-- 1.4 CHECK制約の追加（既存データに影響しない）
DO $$
BEGIN
    -- 制約が存在しない場合のみ追加
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'programs' 
        AND constraint_name = 'programs_project_type_check'
    ) THEN
        ALTER TABLE programs 
        ADD CONSTRAINT programs_project_type_check 
        CHECK (project_type IN ('platto', 'liberary', 'unified'));
        
        RAISE NOTICE 'CHECK constraint added successfully';
    ELSE
        RAISE NOTICE 'CHECK constraint already exists';
    END IF;
END $$;

-- ステップ2: PMplatto用追加フィールド（必要最小限）
-- ==============================================================================

-- 2.1 PMplatto用フィールドの安全な追加
DO $$ 
DECLARE
    columns_to_add text[] := ARRAY['pr_80text', 'pr_200text', 'source_system', 'migrated_at', 'legacy_id'];
    col text;
BEGIN
    FOREACH col IN ARRAY columns_to_add
    LOOP
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'programs' 
            AND column_name = col
        ) THEN
            CASE col
                WHEN 'pr_80text' THEN
                    ALTER TABLE programs ADD COLUMN pr_80text text;
                WHEN 'pr_200text' THEN 
                    ALTER TABLE programs ADD COLUMN pr_200text text;
                WHEN 'source_system' THEN
                    ALTER TABLE programs ADD COLUMN source_system text;
                WHEN 'migrated_at' THEN
                    ALTER TABLE programs ADD COLUMN migrated_at timestamptz;
                WHEN 'legacy_id' THEN
                    ALTER TABLE programs ADD COLUMN legacy_id text;
            END CASE;
            
            RAISE NOTICE 'Column % added successfully', col;
        ELSE
            RAISE NOTICE 'Column % already exists', col;
        END IF;
    END LOOP;
END $$;

-- ステップ3: インデックスの安全な追加
-- ==============================================================================

-- 3.1 project_typeインデックス
CREATE INDEX IF NOT EXISTS idx_programs_project_type ON programs(project_type);

-- 3.2 source_systemインデックス
CREATE INDEX IF NOT EXISTS idx_programs_source_system ON programs(source_system);

-- 3.3 legacy_idインデックス  
CREATE INDEX IF NOT EXISTS idx_programs_legacy_id ON programs(legacy_id);

-- ステップ4: 移行準備確認
-- ==============================================================================

-- 4.1 スキーマ拡張結果の確認
SELECT 
    'Schema Extension Complete' as status,
    (
        SELECT COUNT(*) 
        FROM information_schema.columns 
        WHERE table_name = 'programs' 
        AND column_name IN ('project_type', 'pr_80text', 'pr_200text', 'source_system', 'migrated_at', 'legacy_id')
    ) as added_columns,
    (
        SELECT COUNT(*) 
        FROM information_schema.table_constraints 
        WHERE table_name = 'programs' 
        AND constraint_name = 'programs_project_type_check'
    ) as check_constraints;

-- 4.2 既存データの確認
SELECT 
    'Existing Data Status' as status,
    COUNT(*) as total_records,
    COUNT(CASE WHEN project_type = 'liberary' THEN 1 END) as liberary_records,
    COUNT(CASE WHEN project_type = 'platto' THEN 1 END) as platto_records
FROM programs;

-- ステップ5: PMplattoデータ移行の準備完了メッセージ
-- ==============================================================================

SELECT 'PMliberary schema extension completed. Ready for PMplatto data migration.' as migration_status;

-- ==============================================================================
-- 次のステップ: PMplattoデータの挿入
-- ==============================================================================
-- 
-- このスクリプト実行後、以下のファイルを実行してください:
-- scripts/pmplatto-programs-insert.sql
-- 
-- 既存のPMliberaryデータは完全に保持されます
-- ==============================================================================