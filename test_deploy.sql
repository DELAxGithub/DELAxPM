-- デプロイ確認用クエリ

-- テーブル別件数確認
SELECT 
    'Programs' as table_name, 
    COUNT(*) as count,
    string_agg(DISTINCT project_type, ', ') as project_types
FROM programs

UNION ALL

SELECT 
    'Series', 
    COUNT(*),
    string_agg(DISTINCT title, ', ')
FROM series

UNION ALL

SELECT 
    'Episodes', 
    COUNT(*),
    string_agg(DISTINCT LEFT(title, 20), ', ')
FROM episodes WHERE title IS NOT NULL

UNION ALL

SELECT 
    'Status Master', 
    COUNT(*),
    string_agg(DISTINCT project_type, ', ')
FROM status_master;

-- プロジェクト別統計
SELECT 
    'Project Summary' as section,
    p.project_type,
    COUNT(DISTINCT s.id) as series_count,
    COUNT(e.id) as episodes_count
FROM programs p
LEFT JOIN series s ON p.id = s.program_id
LEFT JOIN episodes e ON s.id = e.series_id
GROUP BY p.project_type;