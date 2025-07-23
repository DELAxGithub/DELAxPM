#!/usr/bin/env node

/**
 * 正確なスキーマに基づくPMplattoデータ移行
 * PMliberaryの実際のスキーマに合わせてデータ移行
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 設定
const BACKUP_DIR = path.join(__dirname, '..', 'backup');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

/**
 * PMliberaryデータベースに接続
 */
function createLiberaryClient() {
  const envPath = path.join(__dirname, '..', 'temp_liberary', '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  return createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
}

/**
 * PMplattoプログラムをPMliberaryのprogramsテーブル形式に変換
 */
function mapPMplattoPrograms(programs) {
  console.log('Mapping PMplatto programs to PMliberary schema...');
  
  return programs.map(program => {
    // PMliberaryのprogramsテーブルスキーマに合わせる
    const mapped = {
      program_id: `PLAT_${program.program_id}`, // ユニークにするためのプレフィックス
      title: program.title || 'Untitled Program',
      subtitle: program.subtitle,
      current_status: program.status,
      program_type: 'program', // PMliberaryのデフォルト値
      season_number: 1,
      first_air_date: program.first_air_date,
      re_air_date: program.re_air_date,
      filming_date: program.filming_date,
      complete_date: program.complete_date,
      cast1: program.cast1,
      cast2: program.cast2,
      director: null, // PMplattoには存在しない
      producer: null, // PMplattoには存在しない
      script_url: program.script_url,
      pr_text: program.notes,
      notes: `[Migrated from PMplatto ID: ${program.id}] ${program.notes || ''}`.trim(),
      client_name: null,
      budget: null,
      // PMliberaryの拡張フィールド（migration/20250323235457で追加）
      pr_completed: program.pr_completed || false,
      pr_due_date: null,
      // series情報（migration/20250120で追加）
      series_name: program.title,
      series_type: 'interview', // デフォルト
      season: 1,
      total_episodes: 1
    };
    
    // タイムスタンプの処理
    if (program.created_at) {
      mapped.created_at = program.created_at;
    }
    if (program.updated_at) {
      mapped.updated_at = program.updated_at;
    }
    
    return mapped;
  });
}

/**
 * PMplattoカレンダータスクをPMliberaryのepisodesテーブル形式に変換
 */
function mapPMplattoCalendarTasks(calendarTasks) {
  console.log('Mapping PMplatto calendar tasks to PMliberary episodes...');
  
  return calendarTasks.map((task, index) => {
    const mapped = {
      episode_id: `PLAT_TASK_${task.id}`,
      title: task.title || `Task ${task.id}`,
      episode_type: 'interview', // デフォルト値
      season: 1,
      episode_number: index + 1000, // PMplattoタスクは1000番台
      script_url: null,
      current_status: '台本作成中', // PMliberaryのデフォルトステータス
      director: null,
      due_date: task.end_date || task.start_date,
      // インタビュー番組用フィールド（PMliberary schema）
      guest_name: null,
      recording_date: task.start_date,
      recording_location: null,
      // VTR番組用フィールド
      material_status: null
    };
    
    // タイムスタンプの処理
    if (task.created_at) {
      mapped.created_at = task.created_at;
    }
    if (task.updated_at) {
      mapped.updated_at = task.updated_at;
    }
    
    return mapped;
  });
}

/**
 * データ移行実行
 */
async function executeMigration() {
  console.log('=== DELA×PM 正確スキーマ移行開始 ===');
  console.log(`実行時刻: ${new Date().toISOString()}`);
  
  try {
    // 1. PMliberaryに接続
    const supabase = createLiberaryClient();
    console.log('✅ PMliberaryデータベース接続完了');
    
    // 2. PMplattoバックアップデータ読み込み
    const programsFile = path.join(BACKUP_DIR, 'pmplatto_programs_2025-07-23T14-58-39.json');
    const calendarTasksFile = path.join(BACKUP_DIR, 'pmplatto_calendar_tasks_2025-07-23T14-58-39.json');
    
    const programs = JSON.parse(fs.readFileSync(programsFile, 'utf8'));
    const calendarTasks = JSON.parse(fs.readFileSync(calendarTasksFile, 'utf8'));
    
    console.log(`✅ バックアップデータ読み込み完了: programs=${programs.length}, tasks=${calendarTasks.length}`);
    
    // 3. データマッピング
    const mappedPrograms = mapPMplattoPrograms(programs);
    const mappedEpisodes = mapPMplattoCalendarTasks(calendarTasks);
    
    console.log(`✅ データマッピング完了: programs=${mappedPrograms.length}, episodes=${mappedEpisodes.length}`);
    
    const results = [];
    
    // 4. programsテーブルへの挿入
    console.log('\n=== Programs migration ===');
    
    let programsInserted = 0;
    const batchSize = 5;
    
    for (let i = 0; i < mappedPrograms.length; i += batchSize) {
      const batch = mappedPrograms.slice(i, i + batchSize);
      
      try {
        const { data, error } = await supabase
          .from('programs')
          .insert(batch)
          .select();
        
        if (error) {
          console.error(`Programs batch ${i}-${i+batch.length} error:`, error.message);
          results.push({ 
            type: 'programs', 
            batch: i, 
            success: false, 
            error: error.message 
          });
        } else {
          programsInserted += data.length;
          console.log(`  ✅ Programs batch ${i}-${i+batch.length}: ${data.length} inserted`);
          results.push({ 
            type: 'programs', 
            batch: i, 
            success: true, 
            inserted: data.length 
          });
        }
      } catch (err) {
        console.error(`Programs batch ${i} exception:`, err.message);
        results.push({ 
          type: 'programs', 
          batch: i, 
          success: false, 
          error: err.message 
        });
      }
    }
    
    // 5. episodesテーブルへの挿入
    console.log('\n=== Episodes migration ===');
    
    let episodesInserted = 0;
    
    for (let i = 0; i < mappedEpisodes.length; i += batchSize) {
      const batch = mappedEpisodes.slice(i, i + batchSize);
      
      try {
        const { data, error } = await supabase
          .from('episodes')
          .insert(batch)
          .select();
        
        if (error) {
          console.error(`Episodes batch ${i}-${i+batch.length} error:`, error.message);
          results.push({ 
            type: 'episodes', 
            batch: i, 
            success: false, 
            error: error.message 
          });
        } else {
          episodesInserted += data.length;
          console.log(`  ✅ Episodes batch ${i}-${i+batch.length}: ${data.length} inserted`);
          results.push({ 
            type: 'episodes', 
            batch: i, 
            success: true, 
            inserted: data.length 
          });
        }
      } catch (err) {
        console.error(`Episodes batch ${i} exception:`, err.message);
        results.push({ 
          type: 'episodes', 
          batch: i, 
          success: false, 
          error: err.message 
        });
      }
    }
    
    // 6. 結果検証
    console.log('\n=== Migration verification ===');
    
    const { data: verifyPrograms } = await supabase
      .from('programs')
      .select('program_id, title')
      .like('program_id', 'PLAT_%');
    
    const { data: verifyEpisodes } = await supabase
      .from('episodes')
      .select('episode_id, title')
      .like('episode_id', 'PLAT_%');
    
    console.log(`✅ Verification: ${verifyPrograms?.length || 0} programs, ${verifyEpisodes?.length || 0} episodes found`);
    
    // 7. 結果レポート
    const report = {
      timestamp: TIMESTAMP,
      migration_date: new Date().toISOString(),
      source_data: {
        programs: programs.length,
        calendar_tasks: calendarTasks.length
      },
      migration_results: {
        programs_attempted: mappedPrograms.length,
        programs_inserted: programsInserted,
        episodes_attempted: mappedEpisodes.length,
        episodes_inserted: episodesInserted,
        total_inserted: programsInserted + episodesInserted,
        total_attempted: mappedPrograms.length + mappedEpisodes.length
      },
      verification: {
        programs_verified: verifyPrograms?.length || 0,
        episodes_verified: verifyEpisodes?.length || 0
      },
      detailed_results: results,
      status: (programsInserted + episodesInserted) > 0 ? 'success' : 'failed'
    };
    
    const reportPath = path.join(BACKUP_DIR, `schema_migration_report_${TIMESTAMP}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    
    console.log('\n=== 移行完了サマリー ===');
    console.log(`Programs: ${programsInserted}/${mappedPrograms.length} inserted`);
    console.log(`Episodes: ${episodesInserted}/${mappedEpisodes.length} inserted`);
    console.log(`Total: ${programsInserted + episodesInserted}/${mappedPrograms.length + mappedEpisodes.length} migrated`);
    console.log(`Status: ${report.status.toUpperCase()}`);
    console.log(`Report: ${reportPath}`);
    
    if (report.status === 'success') {
      console.log('🎉 統合移行が正常に完了しました！');
    } else {
      console.log('⚠️ 移行でエラーが発生しました。詳細はレポートを確認してください。');
    }
    
    return report;
    
  } catch (error) {
    console.error('Migration failed:', error);
    
    const errorReport = {
      timestamp: TIMESTAMP,
      status: 'failed',
      error: error.message,
      stack: error.stack
    };
    
    const errorReportPath = path.join(BACKUP_DIR, `migration_error_${TIMESTAMP}.json`);
    fs.writeFileSync(errorReportPath, JSON.stringify(errorReport, null, 2), 'utf8');
    
    console.log(`Error report: ${errorReportPath}`);
    return errorReport;
  }
}

// スクリプト実行
if (require.main === module) {
  executeMigration();
}

module.exports = { executeMigration };