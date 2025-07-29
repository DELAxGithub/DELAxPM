-- 本番データベースのテーブル存在確認
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('programs', 'series', 'episodes', 'status_master')
ORDER BY table_name;

-- マイグレーション履歴確認
SELECT version, statements, name
FROM supabase_migrations.schema_migrations 
ORDER BY version;