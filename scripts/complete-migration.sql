-- ==============================================================================
-- DELA×PM 完全移行スクリプト
-- 実行順序: スキーマ拡張 → PMplattoデータ移行 → サンプルデータ投入
-- ==============================================================================

-- =========================================
-- STEP 1: スキーマ拡張（minimal-migration.sql）
-- =========================================

-- 1.1 project_typeカラムの安全な追加
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'programs' 
        AND column_name = 'project_type'
    ) THEN
        ALTER TABLE programs 
        ADD COLUMN project_type text DEFAULT 'liberary';
        
        RAISE NOTICE 'project_type column added successfully';
    ELSE
        RAISE NOTICE 'project_type column already exists';
    END IF;
END $$;

-- 1.2 既存データのproject_type設定
UPDATE programs 
SET project_type = 'liberary' 
WHERE project_type IS NULL;

-- 1.3 NOT NULL制約とCHECK制約の追加
ALTER TABLE programs 
ALTER COLUMN project_type SET NOT NULL;

DO $$
BEGIN
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

-- 1.4 PMplatto用追加フィールド
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

-- 1.5 インデックス追加
CREATE INDEX IF NOT EXISTS idx_programs_project_type ON programs(project_type);
CREATE INDEX IF NOT EXISTS idx_programs_source_system ON programs(source_system);
CREATE INDEX IF NOT EXISTS idx_programs_legacy_id ON programs(legacy_id);

-- =========================================
-- STEP 2: PMplattoデータ投入（主要番組のみ）
-- =========================================

-- 既存のPMplattoデータをクリア
DELETE FROM programs WHERE project_type = 'platto';

-- PMplatto主要番組データ（5件のサンプル）
INSERT INTO programs (
  program_id, title, subtitle, current_status, project_type,
  first_air_date, re_air_date, filming_date, complete_date,
  cast1, cast2, pr_text, notes,
  pr_completed, pr_80text, pr_200text,
  source_system, migrated_at, legacy_id,
  created_at, updated_at
) VALUES 
-- 1. つながる時代のわかりあえなさ
('PLAT_008', 'つながる時代のわかりあえなさ', '@国立競技場', '放送済み', 'platto',
 '2025-03-08', '2025-05-05', '2025-02-07', '2025-02-28',
 '九段 理江', 'ドミニク・チェン', NULL, '[Migrated from PMplatto ID: 8]',
 true, NULL, NULL, 'pmplatto', now(), '8',
 now(), '2025-05-09T09:23:27.613425+00:00'),

-- 2. 書くこと、編むこと
('PLAT_015', '書くこと、編むこと', '@羊毛倉庫', 'OA済', 'platto',
 '2025-04-26', '2025-06-23', '2025-03-26', '2025-04-19',
 '青山 七恵', '三國万里子', NULL, '[Migrated from PMplatto ID: 15]',
 true, NULL, NULL, 'pmplatto', now(), '15',
 now(), '2025-04-26T14:33:28.296589+00:00'),

-- 3. 人々が夢中になるハーブの世界
('PLAT_018', '人々が夢中になるハーブの世界', '@明石のハーブ園', 'OA済', 'platto',
 '2025-05-17', '2025-07-14', '2025-04-17', '2025-05-10',
 '井上 サラ', '神木隆之介', 'ハーブティーを飲みながら収録', '[Migrated from PMplatto ID: 18]',
 true, '明石の風土に育まれたハーブ園からお届けする、植物の力と人間の関係を探る番組', '私たちの暮らしに寄り添うハーブの世界。その奥深い魅力を、明石のハーブ園から井上サラと神木隆之介がお届けします。薬草の歴史から現代のアロマテラピーまで、ハーブがもたらす豊かな文化を探ります。', 'pmplatto', now(), '18',
 now(), '2025-05-28T10:28:51.406268+00:00'),

-- 4. 問いを立てることからはじめよう
('PLAT_017', '問いを立てることからはじめよう', '@横浜美術館ワークショップルーム', 'OA済', 'platto',
 '2025-05-10', '2025-07-07', '2025-04-10', '2025-05-03',
 '太田 佳代子', 'ドミニク・チェン', '横浜美術館の協力のもと実施', '[Migrated from PMplatto ID: 17]',
 true, NULL, '「問い」の力を探る対話型番組。横浜美術館から太田佳代子とドミニク・チェンが、アートを通じて「問いを立てる」ことの大切さを語ります。思考を深め、新たな視点を発見する方法を学びます。', 'pmplatto', now(), '17',
 now(), '2025-05-31T11:45:27.195641+00:00'),

-- 5. 文学を旅する
('PLAT_014', '文学を旅する', '@太宰治記念館', 'OA済', 'platto',
 '2025-04-19', '2025-06-16', '2025-03-19', '2025-04-12',
 '高橋 源一郎', '朝吹 真理子', NULL, '[Migrated from PMplatto ID: 14]',
 true, '太宰治の人生と作品から「人間」を考える文学紀行', '文学作品の舞台を訪ね、その土地と作品の関係を探る番組。高橋源一郎と朝吹真理子が、太宰治記念館から文学の新たな読み方を提案します。', 'pmplatto', now(), '14',
 now(), '2025-05-25T16:35:51.895623+00:00');

-- =========================================
-- STEP 3: リベラリー用サンプルデータ投入
-- =========================================

-- リベラリー番組データ（3件のサンプル）
INSERT INTO programs (
  program_id, title, subtitle, current_status, project_type,
  first_air_date, director, cast1, notes,
  created_at, updated_at
) VALUES 
('LIB_001', 'クリエイティブ対談シリーズ', '第1シーズン', '企画中', 'liberary',
 '2025-08-01', '田中 美和', '佐藤 健太', 'クリエイターとの対談番組',
 now(), now()),

('LIB_002', 'アートの現在地', 'ドキュメンタリー特集', '撮影中', 'liberary',
 '2025-08-15', '山田 裕子', '森 真由美', 'アートシーンの最前線',
 now(), now()),

('LIB_003', '未来への提言', 'トークシリーズ', '編集中', 'liberary',
 '2025-09-01', '鈴木 慎一', '高橋 なおみ', '未来社会について考える',
 now(), now());

-- =========================================
-- STEP 4: エピソードサンプルデータ投入
-- =========================================

-- まず、プログラムIDを取得して、episodesテーブルにサンプルデータを投入
INSERT INTO episodes (
  episode_id, program_id, episode_number, title, episode_type,
  current_status, due_date, director, notes,
  interview_guest, created_at, updated_at
)
SELECT 
  'EP_' || p.id || '_001',
  p.id,
  1,
  p.title || ' 第1回',
  'interview',
  '台本作成中',
  '2025-08-15',
  p.director,
  'シリーズ第1回エピソード',
  p.cast1,
  now(),
  now()
FROM programs p 
WHERE p.project_type = 'liberary'
LIMIT 3;

-- =========================================
-- STEP 5: 移行結果の確認
-- =========================================

-- プログラム数の確認
SELECT 
  'Programs by Type' as category,
  project_type,
  COUNT(*) as count
FROM programs 
GROUP BY project_type
ORDER BY project_type;

-- エピソード数の確認
SELECT 
  'Episodes by Program Type' as category,
  p.project_type,
  COUNT(e.id) as episode_count
FROM programs p
LEFT JOIN episodes e ON e.program_id = p.id
GROUP BY p.project_type
ORDER BY p.project_type;

-- 最終確認メッセージ
SELECT 'Migration completed successfully!' as status;