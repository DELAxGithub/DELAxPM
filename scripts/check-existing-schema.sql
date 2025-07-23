-- PMliberary既存スキーマ確認用SQL
-- Supabase管理画面のSQL Editorで実行してください

-- 1. programsテーブルの構造確認
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'programs'
ORDER BY ordinal_position;

-- 2. programsテーブルの制約確認
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'programs'
ORDER BY tc.constraint_type, tc.constraint_name;

-- 3. programsテーブルのインデックス確認
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'programs';

-- 4. 既存データ確認
SELECT COUNT(*) as existing_record_count FROM programs;

-- 5. 既存データのサンプル（最大5件）
SELECT * FROM programs LIMIT 5;