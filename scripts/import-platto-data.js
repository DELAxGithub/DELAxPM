#!/usr/bin/env node

/**
 * プラット実データ投入スクリプト
 * 
 * 旧スキーマのプラットデータを統合スキーマのepisodesテーブルに変換・投入
 */

const fs = require('fs');
const path = require('path');

class PlattoDataImporter {
  constructor() {
    this.plattoDataFile = '/Users/hiroshikodera/Downloads/programs_rows.sql';
    this.outputFile = path.join(process.cwd(), 'supabase', 'migrations', '20250728160000_import_platto_data.sql');
    
    // 状態マッピング（旧 → 新）
    this.statusMapping = {
      'キャスティング中': 'casting',
      'シナリオ制作中': 'scenario',
      '収録準備中': 'recording_prep',
      'ロケハン前': 'recording_prep',
      '収録済み': 'recorded',
      '編集中': 'editing',
      'MA中': 'editing',
      '確認中': 'review',
      '承認済み': 'approved',
      '放送済み': 'delivered',
      '完パケ納品': 'delivered',
      '請求済み': 'billed'
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const colors = {
      info: '\x1b[34m',      // blue
      success: '\x1b[32m',   // green  
      warning: '\x1b[33m',   // yellow
      error: '\x1b[31m',     // red
      header: '\x1b[36m\x1b[1m' // cyan bold
    };
    const reset = '\x1b[0m';
    const gray = '\x1b[90m';
    
    console.log(`${gray}${timestamp}${reset} 📥 Import: ${colors[type]}${message}${reset}`);
  }

  parseInsertStatement(sqlContent) {
    this.log('プラットデータの解析開始...', 'header');
    
    // INSERT文から値を抽出（エスケープ処理を修正）
    const insertMatch = sqlContent.match(/INSERT INTO "public"\."programs" \(.*?\) VALUES (.*)/s);
    if (!insertMatch) {
      throw new Error('INSERT文が見つかりません');
    }

    const valuesSection = insertMatch[1];
    const records = [];
    
    // VALUES部分を解析して各レコードを抽出
    let currentRecord = '';
    let inQuotes = false;
    let parenDepth = 0;
    
    for (let i = 0; i < valuesSection.length; i++) {
      const char = valuesSection[i];
      
      if (char === '\'' && valuesSection[i-1] !== '\\\\') {
        inQuotes = !inQuotes;
      }
      
      if (!inQuotes) {
        if (char === '(') parenDepth++;
        if (char === ')') parenDepth--;
      }
      
      currentRecord += char;
      
      // レコードが完了した場合
      if (!inQuotes && parenDepth === 0 && (char === ')' || char === ',')) {
        if (currentRecord.trim().startsWith('(')) {
          records.push(this.parseRecord(currentRecord.trim()));
          currentRecord = '';
        }
      }
    }
    
    this.log(`${records.length}件のレコードを解析完了`, 'success');
    return records;
  }

  parseRecord(recordString) {
    // レコード文字列から個々の値を抽出
    const values = [];
    let current = '';
    let inQuotes = false;
    let i = 1; // 最初の '(' をスキップ
    
    while (i < recordString.length - 1) { // 最後の ')' もスキップ
      const char = recordString[i];
      
      if (char === '\'' && recordString[i-1] !== '\\\\') {
        inQuotes = !inQuotes;
        if (!inQuotes) {
          // クォート終了
          values.push(current);
          current = '';
          // 次のカンマまでスキップ
          while (i < recordString.length && recordString[i] !== ',') i++;
          i++; // カンマもスキップ
          continue;
        }
      } else if (!inQuotes && char === ',') {
        // カンマ区切り
        values.push(current.trim() === 'null' ? null : current);
        current = '';
        i++;
        continue;
      } else if (!inQuotes && (char === ' ' || char === '\t' || char === '\n')) {
        // 空白は無視
        i++;
        continue;
      }
      
      if (inQuotes || char !== ' ') {
        current += char;
      }
      i++;
    }
    
    // 最後の値を追加
    if (current) {
      values.push(current.trim() === 'null' ? null : current);
    }

    return {
      id: values[0],
      program_id: values[1],
      first_air_date: values[2],
      filming_date: values[3],
      complete_date: values[4],
      title: values[5],
      subtitle: values[6],
      status: values[7],
      cast1: values[8],
      cast2: values[9],
      notes: values[10],
      script_url: values[11],
      pr_80text: values[12],
      pr_200text: values[13],
      re_air_date: values[14],
      created_at: values[15],
      updated_at: values[16],
      pr_completed: values[17],
      pr_due_date: values[18]
    };
  }

  convertToEpisodeData(plattoRecord) {
    const newStage = this.statusMapping[plattoRecord.status] || 'casting';
    
    return {
      program_id: 1, // プラットのprogram_id
      episode_number: parseInt(plattoRecord.program_id),
      title: plattoRecord.title || `エピソード ${plattoRecord.program_id}`,
      subtitle: plattoRecord.subtitle,
      description: plattoRecord.notes,
      current_stage: newStage,
      stage_history: JSON.stringify([{
        stage: newStage,
        date: new Date().toISOString().split('T')[0],
        user: 'platto_import',
        notes: '実データインポート'
      }]),
      planned_air_date: plattoRecord.first_air_date,
      actual_air_date: plattoRecord.re_air_date,
      recording_date: plattoRecord.filming_date,
      director: null, // 旧データにはディレクター情報なし
      script_url: plattoRecord.script_url,
      notes: plattoRecord.notes,
      platto_data: JSON.stringify({
        cast1: plattoRecord.cast1,
        cast2: plattoRecord.cast2,
        pr_text: plattoRecord.pr_80text,
        pr_200text: plattoRecord.pr_200text,
        pr_completed: plattoRecord.pr_completed === 'true',
        pr_due_date: plattoRecord.pr_due_date,
        legacy_id: plattoRecord.id,
        legacy_program_id: plattoRecord.program_id
      }),
      metadata: JSON.stringify({
        imported_from: 'platto_legacy',
        import_date: new Date().toISOString(),
        legacy_created_at: plattoRecord.created_at,
        legacy_updated_at: plattoRecord.updated_at
      }),
      created_by: 'platto_import',
      status: 'active'
    };
  }

  generateMigrationSQL(episodes) {
    this.log('マイグレーションSQL生成中...', 'info');
    
    let sql = `-- ============================================================================
-- プラット実データ投入マイグレーション
-- 作成日: ${new Date().toISOString().split('T')[0]}
-- 目的: 旧プラットシステムの実データを統合スキーマに投入
-- ============================================================================

-- 既存のサンプルプラットエピソードを削除
DELETE FROM episodes WHERE program_id = 1 AND created_by = 'system_setup';

-- プラット実データを投入
INSERT INTO episodes (
    program_id,
    episode_number,
    title,
    subtitle,
    description,
    current_stage,
    stage_history,
    planned_air_date,
    actual_air_date,
    recording_date,
    director,
    script_url,
    notes,
    platto_data,
    metadata,
    created_by,
    status
) VALUES\\n`;

    const values = episodes.map(ep => {
      const escapedData = {
        title: this.escapeSQL(ep.title),
        subtitle: this.escapeSQL(ep.subtitle),
        description: this.escapeSQL(ep.description),
        script_url: this.escapeSQL(ep.script_url),
        notes: this.escapeSQL(ep.notes),
        platto_data: this.escapeSQL(ep.platto_data),
        metadata: this.escapeSQL(ep.metadata)
      };

      return `(
    ${ep.program_id},
    ${ep.episode_number},
    ${escapedData.title},
    ${escapedData.subtitle},
    ${escapedData.description},
    '${ep.current_stage}',
    '${ep.stage_history}'::jsonb,
    ${ep.planned_air_date ? `'${ep.planned_air_date}'` : 'NULL'},
    ${ep.actual_air_date ? `'${ep.actual_air_date}'` : 'NULL'},
    ${ep.recording_date ? `'${ep.recording_date}'` : 'NULL'},
    ${ep.director ? `'${ep.director}'` : 'NULL'},
    ${escapedData.script_url},
    ${escapedData.notes},
    '${escapedData.platto_data}'::jsonb,
    '${escapedData.metadata}'::jsonb,
    '${ep.created_by}',
    '${ep.status}'
)`;
    });

    sql += values.join(',\\n');
    sql += ';\\n\\n-- 投入確認\\n';
    sql += `SELECT 
    COUNT(*) as imported_episodes,
    current_stage,
    COUNT(*) as stage_count
FROM episodes 
WHERE program_id = 1 AND created_by = 'platto_import'
GROUP BY current_stage
ORDER BY stage_count DESC;`;

    return sql;
  }

  escapeSQL(value) {
    if (value === null || value === undefined) {
      return 'NULL';
    }
    return `'${value.toString().replace(/'/g, "''")}'`;
  }

  async run() {
    try {
      this.log('プラット実データ投入スクリプト開始...', 'header');
      
      // SQLファイルを読み込み
      if (!fs.existsSync(this.plattoDataFile)) {
        throw new Error(`データファイルが見つかりません: ${this.plattoDataFile}`);
      }
      
      const sqlContent = fs.readFileSync(this.plattoDataFile, 'utf8');
      
      // データを解析
      const plattoRecords = this.parseInsertStatement(sqlContent);
      
      // 統合スキーマ形式に変換
      const episodes = plattoRecords.map(record => this.convertToEpisodeData(record));
      
      // マイグレーションSQL生成
      const migrationSQL = this.generateMigrationSQL(episodes);
      
      // ファイルに出力
      fs.writeFileSync(this.outputFile, migrationSQL, 'utf8');
      
      this.log(`✅ マイグレーションファイル作成完了: ${this.outputFile}`, 'success');
      this.log(`📊 変換されたエピソード数: ${episodes.length}`, 'info');
      
      // 状態別統計
      const stageStats = episodes.reduce((acc, ep) => {
        acc[ep.current_stage] = (acc[ep.current_stage] || 0) + 1;
        return acc;
      }, {});
      
      this.log('📈 段階別統計:', 'info');
      Object.entries(stageStats).forEach(([stage, count]) => {
        this.log(`   ${stage}: ${count}件`, 'info');
      });
      
    } catch (error) {
      this.log(`❌ 変換失敗: ${error.message}`, 'error');
      console.error('詳細エラー:', error);
      process.exit(1);
    }
  }
}

// CLI実行
if (require.main === module) {
  const importer = new PlattoDataImporter();
  importer.run().catch(error => {
    console.error('インポートスクリプトエラー:', error);
    process.exit(1);
  });
}

module.exports = PlattoDataImporter;