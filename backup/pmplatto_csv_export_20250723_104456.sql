-- PMplatto CSV Export Script
-- PMplattoプロジェクトのpsqlで実行してください

\echo 'PMplatto programs data export...'
\copy programs TO '/tmp/pmplatto_programs.csv' CSV HEADER;

\echo 'PMplatto calendar_tasks data export...'
\copy calendar_tasks TO '/tmp/pmplatto_calendar_tasks.csv' CSV HEADER;

\echo 'PMplatto users data export...'
\copy users TO '/tmp/pmplatto_users.csv' CSV HEADER;

\echo 'Export completed. Files saved to /tmp/'
\echo 'Copy files: scp user@host:/tmp/pmplatto_*.csv ./backup/'
