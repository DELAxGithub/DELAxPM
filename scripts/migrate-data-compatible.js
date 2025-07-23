#!/usr/bin/env node

/**
 * DELA×PM互換データ移行スクリプト
 * 既存PMliberaryスキーマに合わせてPMplattoデータを移行
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 設定
const BACKUP_DIR = path.join(__dirname, '..', 'backup');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

/**
 * 環境変数を読み込む
 */
function loadEnvFile(envPath) {
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
  
  return env;
}

/**
 * PMliberaryデータベースのスキーマを確認
 */
async function checkDatabaseSchema(supabase) {
  console.log('Checking PMliberary database schema...');
  
  try {
    // programsテーブルの構造確認
    const { data: programs, error: programsError } = await supabase
      .from('programs')
      .select('*')
      .limit(1);
    
    if (programsError) {
      console.error('Programs table check error:', programsError);
      return null;
    }
    
    // episodesテーブルの構造確認
    const { data: episodes, error: episodesError } = await supabase
      .from('episodes')
      .select('*')
      .limit(1);
    
    if (episodesError) {
      console.error('Episodes table check error:', episodesError);
      return null;
    }
    
    const schema = {
      programs: programs.length > 0 ? Object.keys(programs[0]) : [],
      episodes: episodes.length > 0 ? Object.keys(episodes[0]) : []
    };
    
    console.log('Available programs columns:', schema.programs);
    console.log('Available episodes columns:', schema.episodes);
    
    return schema;
    
  } catch (error) {
    console.error('Schema check exception:', error);
    return null;
  }
}

/**
 * PMplattoデータをPMliberaryスキーマにマッピング
 */
function mapPMplattoToLiberarySchema(programs, calendarTasks) {
  console.log('Mapping PMplatto data to PMliberary schema...');
  
  // PMplattoプログラムをPMliberaryのprogramsテーブル形式に変換
  const mappedPrograms = programs.map((program, index) => {
    const mapped = {
      program_id: `PLATTO_${program.program_id}`,
      title: program.title || 'Unknown Program',
      subtitle: program.subtitle || null,
      current_status: program.status || 'planning',
      program_type: 'program', // PMliberaryのdefault
      season_number: 1,
      first_air_date: program.first_air_date || null,
      re_air_date: program.re_air_date || null,
      filming_date: program.filming_date || null,
      complete_date: program.complete_date || null,
      cast1: program.cast1 || null,
      cast2: program.cast2 || null,
      director: null, // PMplattoにはdirectorフィールドがない
      producer: null, // PMplattoにはproducerフィールドがない
      script_url: program.script_url || null,
      pr_text: program.notes || null,
      notes: `[Migrated from PMplatto] Original ID: ${program.id}. ${program.notes || ''}`.trim(),
      client_name: null,
      budget: null,
      broadcast_time: null
    };
    
    // created_atとupdated_atの処理
    if (program.created_at) {
      mapped.created_at = program.created_at;
    }
    if (program.updated_at) {
      mapped.updated_at = program.updated_at;
    }
    
    return mapped;
  });
  
  // PMplattoカレンダータスクをPMliberaryのepisodesテーブル形式に変換
  const mappedEpisodes = calendarTasks.map((task, index) => {
    const mapped = {
      episode_id: `PLATTO_TASK_${task.id}`,
      program_id: `PLATTO_${task.program_id}`,
      title: task.title || 'Calendar Task',
      episode_type: 'interview', // デフォルト値
      season: 1,
      episode_number: index + 1,
      script_url: null,
      current_status: 'planning',
      director: null,
      due_date: task.end_date || task.start_date || null,
      interview_guest: null,
      interview_date: task.start_date || null,
      interview_location: null,
      vtr_location: null,
      vtr_theme: task.task_type || null,
      notes: `[Migrated from PMplatto Calendar] ${task.description || ''}`.trim(),
      estimated_duration: null
    };
    
    if (task.created_at) {
      mapped.created_at = task.created_at;
    }
    if (task.updated_at) {
      mapped.updated_at = task.updated_at;
    }
    
    return mapped;
  });
  
  console.log(`Mapped ${mappedPrograms.length} programs and ${mappedEpisodes.length} episodes`);
  
  return { mappedPrograms, mappedEpisodes };
}

/**
 * データ移行実行
 */
async function executeMigration(supabase, mappedPrograms, mappedEpisodes) {
  console.log('\n=== データ移行実行開始 ===');
  
  const results = [];
  
  try {
    // プログラムデータ移行
    console.log('Migrating programs...');
    
    // バッチサイズで分割して挿入
    const batchSize = 10;
    let programsInserted = 0;
    
    for (let i = 0; i < mappedPrograms.length; i += batchSize) {
      const batch = mappedPrograms.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('programs')
        .insert(batch)
        .select();
      
      if (error) {
        console.error(`Programs batch ${i}-${i+batch.length} error:`, error.message);
        results.push({ 
          step: `programs_batch_${i}`, 
          success: false, 
          error: error.message,
          attempted: batch.length
        });
      } else {
        programsInserted += data.length;
        results.push({ 
          step: `programs_batch_${i}`, 
          success: true, 
          inserted: data.length
        });
        console.log(`  Inserted programs batch ${i}-${i+batch.length}: ${data.length} records`);
      }
    }
    
    // エピソードデータ移行
    console.log('Migrating episodes (calendar tasks as episodes)...');
    
    let episodesInserted = 0;
    
    for (let i = 0; i < mappedEpisodes.length; i += batchSize) {
      const batch = mappedEpisodes.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('episodes')
        .insert(batch)
        .select();
      
      if (error) {
        console.error(`Episodes batch ${i}-${i+batch.length} error:`, error.message);
        results.push({ 
          step: `episodes_batch_${i}`, 
          success: false, 
          error: error.message,
          attempted: batch.length
        });
      } else {
        episodesInserted += data.length;
        results.push({ 
          step: `episodes_batch_${i}`, 
          success: true, 
          inserted: data.length
        });
        console.log(`  Inserted episodes batch ${i}-${i+batch.length}: ${data.length} records`);
      }
    }
    
    console.log(`\n移行完了サマリー:`);
    console.log(`  Programs inserted: ${programsInserted}/${mappedPrograms.length}`);
    console.log(`  Episodes inserted: ${episodesInserted}/${mappedEpisodes.length}`);
    
    return {
      programsInserted,
      episodesInserted,
      totalAttempted: mappedPrograms.length + mappedEpisodes.length,
      totalInserted: programsInserted + episodesInserted,
      results
    };
    
  } catch (error) {
    console.error('Migration execution error:', error);
    return { error: error.message, results };
  }
}

/**
 * 移行結果検証
 */
async function verifyMigration(supabase) {
  console.log('\n=== 移行結果検証 ===');
  
  try {
    // プログラム数確認
    const { data: programs, error: programsError } = await supabase
      .from('programs')
      .select('program_id, title')
      .like('program_id', 'PLATTO_%');
    
    if (programsError) {
      console.error('Programs verification error:', programsError);
      return false;
    }
    
    // エピソード数確認
    const { data: episodes, error: episodesError } = await supabase
      .from('episodes')
      .select('episode_id, title')
      .like('episode_id', 'PLATTO_%');
    
    if (episodesError) {
      console.error('Episodes verification error:', episodesError);
      return false;
    }
    
    console.log(`検証結果:`);
    console.log(`  PMplatto programs found: ${programs.length}`);
    console.log(`  PMplatto episodes found: ${episodes.length}`);
    
    // サンプルデータ表示
    if (programs.length > 0) {
      console.log('  Sample program:', programs[0]);
    }
    if (episodes.length > 0) {
      console.log('  Sample episode:', episodes[0]);
    }
    
    return programs.length > 0;
    
  } catch (error) {
    console.error('Verification exception:', error);
    return false;
  }
}

/**
 * メイン実行
 */
async function main() {
  console.log('=== DELA×PM互換データ移行開始 ===');
  console.log(`実行時刻: ${new Date().toISOString()}`);
  
  try {
    // 1. PMliberaryデータベース接続
    const envPath = path.join(__dirname, '..', 'temp_liberary', '.env.local');
    const env = loadEnvFile(envPath);
    const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
    
    console.log(`Connected to PMliberary: ${env.VITE_SUPABASE_URL}`);
    
    // 2. スキーマ確認
    const schema = await checkDatabaseSchema(supabase);
    if (!schema) {
      throw new Error('Could not determine database schema');
    }
    
    // 3. PMplattoバックアップデータ読み込み
    const programsFile = path.join(BACKUP_DIR, 'pmplatto_programs_2025-07-23T14-58-39.json');
    const calendarTasksFile = path.join(BACKUP_DIR, 'pmplatto_calendar_tasks_2025-07-23T14-58-39.json');
    
    const programs = JSON.parse(fs.readFileSync(programsFile, 'utf8'));
    const calendarTasks = JSON.parse(fs.readFileSync(calendarTasksFile, 'utf8'));
    
    console.log(`Loaded backup: ${programs.length} programs, ${calendarTasks.length} calendar tasks`);
    
    // 4. データマッピング
    const { mappedPrograms, mappedEpisodes } = mapPMplattoToLiberarySchema(programs, calendarTasks);
    
    // 5. データ移行実行
    const migrationResult = await executeMigration(supabase, mappedPrograms, mappedEpisodes);
    
    // 6. 結果検証
    const verificationSuccess = await verifyMigration(supabase);
    
    // 7. レポート生成
    const report = {
      timestamp: TIMESTAMP,
      migration_date: new Date().toISOString(),
      source_data: {
        programs: programs.length,
        calendar_tasks: calendarTasks.length
      },
      migration_result: migrationResult,
      verification_success: verificationSuccess,
      status: migrationResult.error ? 'failed' : 
              (migrationResult.totalInserted > 0 ? 'completed' : 'no_data')
    };
    
    const reportPath = path.join(BACKUP_DIR, `compatible_migration_report_${TIMESTAMP}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    
    console.log('\n=== 移行完了 ===');
    console.log(`ステータス: ${report.status.toUpperCase()}`);
    console.log(`移行されたレコード: ${migrationResult.totalInserted}/${migrationResult.totalAttempted}`);
    console.log(`レポート保存: ${reportPath}`);
    
    if (report.status === 'completed') {
      console.log('🎉 互換データ移行が正常に完了しました！');
    }
    
    return report;
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// スクリプト実行
if (require.main === module) {
  main();
}

module.exports = { main };