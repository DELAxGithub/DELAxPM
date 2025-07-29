-- 統合スキーマのテスト確認用クエリ

-- テーブル一覧確認
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 作成されたプログラム確認
SELECT id, slug, name, type FROM programs;

-- 作成されたシリーズ確認
SELECT id, program_id, slug, name FROM series;

-- 作成されたエピソード確認
SELECT id, program_id, episode_number, title, current_stage FROM episodes;

-- 段階テンプレート確認
SELECT id, name, category FROM stage_templates;