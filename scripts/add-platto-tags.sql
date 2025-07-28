-- 既存のプラットデータにタグを追加
-- 既にタグが付与されていないデータのみ対象とする

-- まず現在のデータ状況を確認
SELECT 
  COUNT(*) as total_programs,
  COUNT(CASE WHEN notes ILIKE '%[PLATTO]%' THEN 1 END) as platto_tagged,
  COUNT(CASE WHEN notes ILIKE '%[LIBERARY]%' THEN 1 END) as liberary_tagged,
  COUNT(CASE WHEN notes NOT ILIKE '%[PLATTO]%' AND notes NOT ILIKE '%[LIBERARY]%' THEN 1 END) as untagged
FROM programs;

-- 既存の未タグデータ（主にPMplattoから移行した32番組）に[PLATTO]タグを追加
UPDATE programs 
SET notes = CASE 
  WHEN notes IS NULL OR notes = '' THEN '[PLATTO]'
  ELSE notes || ' [PLATTO]'
END
WHERE (notes IS NULL OR notes = '' OR (notes NOT ILIKE '%[PLATTO]%' AND notes NOT ILIKE '%[LIBERARY]%'))
  AND program_id NOT LIKE 'liberary_%';

-- 更新後の状況を確認
SELECT 
  COUNT(*) as total_programs,
  COUNT(CASE WHEN notes ILIKE '%[PLATTO]%' THEN 1 END) as platto_tagged,
  COUNT(CASE WHEN notes ILIKE '%[LIBERARY]%' THEN 1 END) as liberary_tagged,
  COUNT(CASE WHEN notes NOT ILIKE '%[PLATTO]%' AND notes NOT ILIKE '%[LIBERARY]%' THEN 1 END) as untagged
FROM programs;

-- プラットタグが付与されたデータのサンプルを確認
SELECT program_id, title, notes 
FROM programs 
WHERE notes ILIKE '%[PLATTO]%' 
ORDER BY created_at DESC 
LIMIT 5;