#!/usr/bin/env node

/**
 * DELA×PM統合移行実行スクリプト
 * PMliberaryベースでPMplattoデータを統合
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
  if (!fs.existsSync(envPath)) {
    throw new Error(`Environment file not found: ${envPath}`);
  }
  
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
 * PMliberaryデータベースに接続
 */
function createUnifiedClient() {
  const envPath = path.join(__dirname, '..', 'temp_liberary', '.env.local');
  const env = loadEnvFile(envPath);
  
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    throw new Error('Missing Supabase URL or API key for PMliberary');
  }
  
  console.log(`Connecting to PMliberary (unified base): ${url}`);
  return createClient(url, key);
}

/**
 * PMplattoバックアップデータを読み込む
 */
function loadPMplattoBackup() {
  const programsFile = path.join(BACKUP_DIR, 'pmplatto_programs_2025-07-23T14-58-39.json');
  const calendarTasksFile = path.join(BACKUP_DIR, 'pmplatto_calendar_tasks_2025-07-23T14-58-39.json');
  
  if (!fs.existsSync(programsFile) || !fs.existsSync(calendarTasksFile)) {
    throw new Error('PMplatto backup files not found');
  }
  
  const programs = JSON.parse(fs.readFileSync(programsFile, 'utf8'));
  const calendarTasks = JSON.parse(fs.readFileSync(calendarTasksFile, 'utf8'));
  
  console.log(`Loaded PMplatto backup: ${programs.length} programs, ${calendarTasks.length} calendar tasks`);
  
  return { programs, calendarTasks };
}

/**
 * PMliberaryのスキーマを拡張してPMplattoデータに対応
 */
async function extendPMliberarySchema(supabase) {
  console.log('\n=== PMliberaryスキーマ拡張開始 ===');
  
  try {
    // project_type列の追加
    console.log('Adding project_type column to programs...');
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
          -- programs テーブルにproject_type列を追加
          IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'programs' AND column_name = 'project_type'
          ) THEN
            ALTER TABLE programs ADD COLUMN project_type text DEFAULT 'liberary';
            ALTER TABLE programs ALTER COLUMN project_type SET NOT NULL;
            ALTER TABLE programs ADD CONSTRAINT programs_project_type_check 
            CHECK (project_type IN ('platto', 'liberary', 'unified'));
          END IF;
          
          -- PMplatto用フィールドの追加
          IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'programs' AND column_name = 'pr_80text'
          ) THEN
            ALTER TABLE programs ADD COLUMN pr_80text text;
            ALTER TABLE programs ADD COLUMN pr_200text text;
            ALTER TABLE programs ADD COLUMN pr_completed boolean DEFAULT false;
            ALTER TABLE programs ADD COLUMN pr_due_date date;
            ALTER TABLE programs ADD COLUMN editing_date date;
            ALTER TABLE programs ADD COLUMN mixing_date date;
            ALTER TABLE programs ADD COLUMN first_preview_date date;
            ALTER TABLE programs ADD COLUMN station_preview_date date;
            ALTER TABLE programs ADD COLUMN final_package_date date;
            ALTER TABLE programs ADD COLUMN on_air_date date;
            ALTER TABLE programs ADD COLUMN billing_date date;
            ALTER TABLE programs ADD COLUMN source_system text;
            ALTER TABLE programs ADD COLUMN migrated_at timestamptz;
            ALTER TABLE programs ADD COLUMN legacy_id text;
          END IF;
          
          -- calendar_tasks テーブル作成（PMplatto専用）
          CREATE TABLE IF NOT EXISTS calendar_tasks (
            id bigserial PRIMARY KEY,
            program_id text NOT NULL,
            title text NOT NULL,
            task_type text,
            start_date date,
            end_date date,
            description text,
            project_type text DEFAULT 'platto' CHECK (project_type IN ('platto', 'liberary', 'unified')),
            source_system text DEFAULT 'pmplatto',
            migrated_at timestamptz DEFAULT now(),
            legacy_id text,
            created_at timestamptz DEFAULT now(),
            updated_at timestamptz DEFAULT now()
          );
          
          -- インデックス作成
          CREATE INDEX IF NOT EXISTS idx_programs_project_type ON programs(project_type);
          CREATE INDEX IF NOT EXISTS idx_calendar_tasks_project_type ON calendar_tasks(project_type);
          CREATE INDEX IF NOT EXISTS idx_programs_source_system ON programs(source_system);
          CREATE INDEX IF NOT EXISTS idx_calendar_tasks_program_id ON calendar_tasks(program_id);
          
        END $$;
      `
    });
    
    if (alterError) {
      // RPC関数が存在しない場合、直接SQLを実行
      console.log('RPC method not available, attempting direct schema modification...');
      console.log('Note: Schema modifications may require direct database access');
      
      // 警告を記録して続行
      console.warn('Warning: Could not execute schema modifications via API');
      console.log('Schema extension may need to be performed manually');
      
      return false;
    }
    
    console.log('✅ PMliberaryスキーマ拡張完了');
    return true;
    
  } catch (error) {
    console.error('Schema extension error:', error.message);
    return false;
  }
}

/**
 * PMplattoプログラムデータをPMliberaryに移行
 */
async function migratePMplattoPrograms(supabase, programs) {
  console.log('\n=== PMplattoプログラムデータ移行開始 ===');
  
  const migratedPrograms = programs.map(program => ({
    program_id: `platto_${program.program_id}`,
    title: program.title,
    subtitle: program.subtitle,
    current_status: program.status,
    project_type: 'platto',
    first_air_date: program.first_air_date,
    re_air_date: program.re_air_date,
    filming_date: program.filming_date,
    complete_date: program.complete_date,
    cast1: program.cast1,
    cast2: program.cast2,
    director: null,
    producer: null,
    script_url: program.script_url,
    pr_text: program.notes,
    notes: program.notes,
    client_name: null,
    budget: null,
    broadcast_time: null,
    pr_80text: program.pr_80text,
    pr_200text: program.pr_200text,
    pr_completed: program.pr_completed || false,
    pr_due_date: null,
    source_system: 'pmplatto',
    migrated_at: new Date().toISOString(),
    legacy_id: program.id.toString(),
    created_at: program.created_at || new Date().toISOString(),
    updated_at: program.updated_at || new Date().toISOString()
  }));
  
  try {
    const { data, error } = await supabase
      .from('programs')
      .insert(migratedPrograms)
      .select();
    
    if (error) {
      console.error('Programs migration error:', error);
      return false;
    }
    
    console.log(`✅ PMplattoプログラム移行完了: ${data.length}件`);
    return true;
    
  } catch (error) {
    console.error('Programs migration exception:', error);
    return false;
  }
}

/**
 * PMplattoカレンダータスクをPMliberaryに移行
 */
async function migratePMplattoCalendarTasks(supabase, calendarTasks) {
  console.log('\n=== PMplattoカレンダータスク移行開始 ===');
  
  const migratedTasks = calendarTasks.map(task => ({
    program_id: `platto_${task.program_id}`,
    title: task.title,
    task_type: task.task_type,
    start_date: task.start_date,
    end_date: task.end_date,
    description: task.description,
    project_type: 'platto',
    source_system: 'pmplatto',
    migrated_at: new Date().toISOString(),
    legacy_id: task.id.toString(),
    created_at: task.created_at || new Date().toISOString(),
    updated_at: task.updated_at || new Date().toISOString()
  }));
  
  try {
    const { data, error } = await supabase
      .from('calendar_tasks')
      .insert(migratedTasks)
      .select();
    
    if (error) {
      console.error('Calendar tasks migration error:', error);
      return false;
    }
    
    console.log(`✅ PMplattoカレンダータスク移行完了: ${data.length}件`);
    return true;
    
  } catch (error) {
    console.error('Calendar tasks migration exception:', error);
    return false;
  }
}

/**
 * 移行結果の検証
 */
async function verifyMigration(supabase) {
  console.log('\n=== 移行結果検証開始 ===');
  
  try {
    // プログラム数確認
    const { data: allPrograms, error: programsError } = await supabase
      .from('programs')
      .select('project_type')
      .limit(1000);
    
    if (programsError) {
      console.error('Programs verification error:', programsError);
      return false;
    }
    
    const plattoCount = allPrograms.filter(p => p.project_type === 'platto').length;
    const liberaryCount = allPrograms.filter(p => p.project_type === 'liberary').length;
    const totalCount = allPrograms.length;
    
    console.log(`Programs verification:`);
    console.log(`  - Platto programs: ${plattoCount}`);
    console.log(`  - Liberary programs: ${liberaryCount}`);
    console.log(`  - Total programs: ${totalCount}`);
    
    // カレンダータスク数確認
    const { data: allTasks, error: tasksError } = await supabase
      .from('calendar_tasks')
      .select('project_type')
      .limit(1000);
    
    if (tasksError) {
      console.log('Calendar tasks table may not exist yet (expected for schema issues)');
    } else {
      const taskCount = allTasks.length;
      console.log(`Calendar tasks: ${taskCount}`);
    }
    
    return plattoCount > 0;
    
  } catch (error) {
    console.error('Verification exception:', error);
    return false;
  }
}

/**
 * 移行結果レポート生成
 */
function generateMigrationReport(results) {
  const reportPath = path.join(BACKUP_DIR, `migration_report_${TIMESTAMP}.json`);
  
  const report = {
    timestamp: TIMESTAMP,
    migration_date: new Date().toISOString(),
    results: results,
    status: results.every(r => r.success) ? 'completed' : 'partial',
    summary: {
      total_steps: results.length,
      successful_steps: results.filter(r => r.success).length,
      failed_steps: results.filter(r => !r.success).length
    }
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\n📄 Migration report saved: ${reportPath}`);
  
  return report;
}

/**
 * メイン移行実行
 */
async function executeUnifiedMigration() {
  console.log('=== DELA×PM統合移行開始 ===');
  console.log(`実行時刻: ${new Date().toISOString()}`);
  console.log(`バックアップディレクトリ: ${BACKUP_DIR}`);
  
  const results = [];
  
  try {
    // 1. 統合データベース接続
    console.log('\n1. 統合データベース接続...');
    const supabase = createUnifiedClient();
    results.push({ step: 'database_connection', success: true });
    
    // 2. PMplattoバックアップデータ読み込み
    console.log('\n2. PMplattoバックアップデータ読み込み...');
    const { programs, calendarTasks } = loadPMplattoBackup();
    results.push({ step: 'backup_data_loading', success: true, programs: programs.length, calendarTasks: calendarTasks.length });
    
    // 3. PMliberaryスキーマ拡張
    console.log('\n3. PMliberaryスキーマ拡張...');
    const schemaSuccess = await extendPMliberarySchema(supabase);
    results.push({ step: 'schema_extension', success: schemaSuccess });
    
    // 4. PMplattoプログラムデータ移行
    console.log('\n4. PMplattoプログラムデータ移行...');
    const programsSuccess = await migratePMplattoPrograms(supabase, programs);
    results.push({ step: 'programs_migration', success: programsSuccess });
    
    // 5. PMplattoカレンダータスク移行
    console.log('\n5. PMplattoカレンダータスク移行...');
    const tasksSuccess = await migratePMplattoCalendarTasks(supabase, calendarTasks);
    results.push({ step: 'calendar_tasks_migration', success: tasksSuccess });
    
    // 6. 移行結果検証
    console.log('\n6. 移行結果検証...');
    const verificationSuccess = await verifyMigration(supabase);
    results.push({ step: 'migration_verification', success: verificationSuccess });
    
    // 7. レポート生成
    const report = generateMigrationReport(results);
    
    console.log('\n=== 統合移行完了 ===');
    console.log(`状態: ${report.status.toUpperCase()}`);
    console.log(`成功: ${report.summary.successful_steps}/${report.summary.total_steps}`);
    
    if (report.status === 'completed') {
      console.log('🎉 統合移行が正常に完了しました！');
    } else {
      console.log('⚠️ 統合移行が部分的に完了しました。詳細はレポートを確認してください。');
    }
    
    return report;
    
  } catch (error) {
    console.error('Migration execution error:', error);
    results.push({ step: 'migration_execution', success: false, error: error.message });
    
    const report = generateMigrationReport(results);
    console.log('\n❌ 統合移行でエラーが発生しました');
    
    return report;
  }
}

// スクリプト実行
if (require.main === module) {
  executeUnifiedMigration().catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
}

module.exports = { executeUnifiedMigration };