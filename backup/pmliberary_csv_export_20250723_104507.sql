-- PMliberary CSV Export Script
-- PMliberaryプロジェクトのpsqlで実行してください

\echo 'PMliberary programs data export...'
\copy programs TO '/tmp/pmliberary_programs.csv' CSV HEADER;

\echo 'PMliberary episodes data export...'
\copy episodes TO '/tmp/pmliberary_episodes.csv' CSV HEADER;

\echo 'PMliberary episode_statuses data export...'
\copy episode_statuses TO '/tmp/pmliberary_episode_statuses.csv' CSV HEADER;

\echo 'PMliberary status_history data export...'
\copy status_history TO '/tmp/pmliberary_status_history.csv' CSV HEADER;

\echo 'PMliberary team_events data export...'
\copy team_events TO '/tmp/pmliberary_team_events.csv' CSV HEADER;

\echo 'Export completed. Files saved to /tmp/'
\echo 'Copy files: scp user@host:/tmp/pmliberary_*.csv ./backup/'
