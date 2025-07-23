#!/bin/bash

# PMplatto データベースバックアップスクリプト
# 使用方法: ./backup-pmplatto.sh

set -e

# 設定
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/Users/hiroshikodera/repos/_active/apps/DELAxPM/backup"
PROJECT_NAME="pmplatto"

# バックアップディレクトリ作成
mkdir -p "$BACKUP_DIR"

echo "=== PMplatto データベースバックアップ開始 ==="
echo "タイムスタンプ: $TIMESTAMP"
echo "バックアップディレクトリ: $BACKUP_DIR"

# PMplattoプロジェクトに移動
cd /Users/hiroshikodera/repos/_active/apps/DELAxPM/temp_platto

# Supabaseプロジェクト情報確認
echo "Supabaseプロジェクト情報確認中..."
if supabase projects list > /dev/null 2>&1; then
    echo "Supabase CLI認証済み"
else
    echo "Error: Supabase CLIにログインしてください"
    echo "実行: supabase login"
    exit 1
fi

# バックアップ実行（SQLダンプ）
echo "SQLダンプ作成中..."
BACKUP_FILE="$BACKUP_DIR/${PROJECT_NAME}_backup_${TIMESTAMP}.sql"

# Supabase CLIでデータベースダンプを作成
# 注意: 実際のプロジェクトIDが必要です
echo "-- PMplatto Database Backup" > "$BACKUP_FILE"
echo "-- Created: $(date)" >> "$BACKUP_FILE"
echo "-- Project: $PROJECT_NAME" >> "$BACKUP_FILE"
echo "" >> "$BACKUP_FILE"

# データベーススキーマとデータのダンプ
# まず、リンクされたプロジェクトを確認
if [ -f ".supabase/config.toml" ]; then
    PROJECT_ID=$(grep 'project_id' .supabase/config.toml | cut -d '"' -f 2)
    echo "リンクされたプロジェクトID: $PROJECT_ID"
    
    # データベース接続情報を取得してpg_dumpを実行
    echo "データベースダンプ実行中..."
    
    # Supabase CLIからDB URLを取得
    DB_URL=$(supabase status --output json 2>/dev/null | grep -o '"DB URL":"[^"]*' | cut -d'"' -f4)
    
    if [ -n "$DB_URL" ]; then
        # ローカルのSupabaseが起動している場合
        echo "ローカルSupabaseからバックアップ中..."
        pg_dump "$DB_URL" >> "$BACKUP_FILE"
    else
        echo "リモートプロジェクトから直接バックアップを取得します..."
        # リモートプロジェクトの場合、手動でダンプを作成
        supabase db dump --local --file "$BACKUP_FILE.tmp" 2>/dev/null && mv "$BACKUP_FILE.tmp" "$BACKUP_FILE" || {
            echo "Warning: 自動ダンプに失敗。手動バックアップスクリプトを実行します..."
            
            # 代替方法：バックアップ用SQLスクリプトを実行
            if [ -f "../scripts/backup-data.sql" ]; then
                echo "バックアップ用SQLスクリプトをコピー中..."
                cat ../scripts/backup-data.sql >> "$BACKUP_FILE"
                echo "" >> "$BACKUP_FILE"
                echo "-- 注意: このファイルは実行用スクリプトです。" >> "$BACKUP_FILE"
                echo "-- 実際のデータを含むには、PMplattoプロジェクトで実行してください。" >> "$BACKUP_FILE"
            fi
        }
    fi
else
    echo "Warning: Supabaseプロジェクトがリンクされていません"
    echo "手動バックアップスクリプトを作成します..."
    
    # バックアップ用SQLスクリプトをコピー
    if [ -f "../scripts/backup-data.sql" ]; then
        cat ../scripts/backup-data.sql >> "$BACKUP_FILE"
        echo "" >> "$BACKUP_FILE"
        echo "-- 注意: このファイルは実行用スクリプトです。" >> "$BACKUP_FILE"
        echo "-- 実際のデータを含むには、PMplattoプロジェクトで以下を実行してください：" >> "$BACKUP_FILE"
        echo "-- psql -h [host] -U [user] -d [database] -f backup-data.sql" >> "$BACKUP_FILE"
    fi
fi

# CSVエクスポート用スクリプト作成
CSV_EXPORT_SCRIPT="$BACKUP_DIR/${PROJECT_NAME}_csv_export_${TIMESTAMP}.sql"
cat > "$CSV_EXPORT_SCRIPT" << 'EOF'
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
EOF

# メタデータファイル作成
METADATA_FILE="$BACKUP_DIR/${PROJECT_NAME}_metadata_${TIMESTAMP}.json"
cat > "$METADATA_FILE" << EOF
{
  "project": "$PROJECT_NAME",
  "backup_type": "sql_dump",
  "timestamp": "$TIMESTAMP",
  "created_at": "$(date -Iseconds)",
  "backup_file": "$(basename "$BACKUP_FILE")",
  "csv_export_script": "$(basename "$CSV_EXPORT_SCRIPT")",
  "source_directory": "$(pwd)",
  "backup_method": "supabase_cli",
  "notes": "PMplatto project backup - may require manual execution for remote data"
}
EOF

echo "=== PMplatto バックアップ完了 ==="
echo "SQLファイル: $BACKUP_FILE"
echo "CSVエクスポートスクリプト: $CSV_EXPORT_SCRIPT"
echo "メタデータ: $METADATA_FILE"
echo ""
echo "次のステップ:"
echo "1. PMplattoプロジェクトにログイン"
echo "2. 以下を実行してCSVデータをエクスポート:"
echo "   psql -h [host] -U [user] -d [database] -f $CSV_EXPORT_SCRIPT"
echo "3. エクスポートされたCSVファイルをbackup/ディレクトリにコピー"

# ファイルサイズを表示
if [ -f "$BACKUP_FILE" ]; then
    FILE_SIZE=$(wc -c < "$BACKUP_FILE")
    echo "バックアップファイルサイズ: $FILE_SIZE bytes"
fi