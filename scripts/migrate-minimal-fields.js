#!/usr/bin/env node

/**
 * 最小限フィールドでのPMplattoデータ移行
 * 必須フィールドのみを使用してデータ移行を実行
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 設定
const BACKUP_DIR = path.join(__dirname, '..', 'backup');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

/**
 * PMliberaryデータベースに接続（サービスロール使用）
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
  
  // RLS回避のためサービスロールを使用（存在する場合）
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;
  
  return createClient(env.VITE_SUPABASE_URL, serviceRoleKey);
}

/**
 * 実際のスキーマを調査
 */
async function inspectSchema(supabase) {
  console.log('Inspecting actual database schema...');
  
  try {
    // 空のレコードを挿入してみてフィールドを確認
    const testProgram = {
      program_id: 'TEST_SCHEMA_001',
      title: 'Test Program'
    };
    
    const { data, error } = await supabase
      .from('programs')
      .insert([testProgram])
      .select();
    
    if (error) {
      console.log('Schema test error:', error.message);
      return null;
    }
    
    // テストレコードを削除
    await supabase
      .from('programs')
      .delete()
      .eq('program_id', 'TEST_SCHEMA_001');
    
    if (data && data.length > 0) {
      const fields = Object.keys(data[0]);
      console.log('Available program fields:', fields);
      return { programs: fields };
    }
    
    return null;
    
  } catch (error) {
    console.error('Schema inspection error:', error);
    return null;
  }
}

/**
 * 最小限のフィールドでプログラムをマッピング
 */
function mapMinimalPrograms(programs) {
  console.log('Mapping with minimal fields...');
  
  return programs.map(program => ({
    program_id: `PLAT_${program.program_id}`,
    title: program.title || 'Untitled Program',
    subtitle: program.subtitle,
    current_status: program.status,
    first_air_date: program.first_air_date,
    re_air_date: program.re_air_date,
    filming_date: program.filming_date,
    complete_date: program.complete_date,
    cast1: program.cast1,
    cast2: program.cast2,
    script_url: program.script_url,
    pr_text: program.notes,
    notes: `[PMplatto migration] Original ID: ${program.id}`,
    // PMliberary特有フィールド（存在する場合のみ）
    program_type: 'program',
    season_number: 1
  }));
}

/**
 * 段階的データ移行
 */
async function executeStagedMigration() {
  console.log('=== DELA×PM 段階的統合移行開始 ===');
  console.log(`実行時刻: ${new Date().toISOString()}`);
  
  try {
    // 1. データベース接続
    const supabase = createLiberaryClient();
    console.log('✅ PMliberaryデータベース接続完了');
    
    // 2. スキーマ調査
    const schema = await inspectSchema(supabase);
    
    // 3. バックアップデータ読み込み
    const programsFile = path.join(BACKUP_DIR, 'pmplatto_programs_2025-07-23T14-58-39.json');
    const programs = JSON.parse(fs.readFileSync(programsFile, 'utf8'));
    console.log(`✅ PMplattoプログラムデータ読み込み: ${programs.length}件`);
    
    // 4. 最小限フィールドマッピング
    const mappedPrograms = mapMinimalPrograms(programs);
    console.log(`✅ データマッピング完了: ${mappedPrograms.length}件`);
    
    const results = [];
    let successCount = 0;
    
    // 5. 1件ずつ慎重に挿入
    console.log('\n=== Individual program insertion ===');
    
    for (let i = 0; i < mappedPrograms.length; i++) {
      const program = mappedPrograms[i];
      
      try {
        // 重複チェック
        const { data: existing } = await supabase
          .from('programs')
          .select('program_id')
          .eq('program_id', program.program_id)
          .single();
        
        if (existing) {
          console.log(`  ⚠️ ${i+1}/${mappedPrograms.length}: Already exists - ${program.program_id}`);
          results.push({ 
            index: i, 
            program_id: program.program_id, 
            success: false, 
            reason: 'already_exists' 
          });
          continue;
        }
        
        // 挿入実行
        const { data, error } = await supabase
          .from('programs')
          .insert([program])
          .select();
        
        if (error) {
          console.log(`  ❌ ${i+1}/${mappedPrograms.length}: Error - ${program.program_id}: ${error.message}`);
          results.push({ 
            index: i, 
            program_id: program.program_id, 
            success: false, 
            error: error.message 
          });
        } else {
          successCount++;
          console.log(`  ✅ ${i+1}/${mappedPrograms.length}: Success - ${program.program_id}`);
          results.push({ 
            index: i, 
            program_id: program.program_id, 
            success: true, 
            inserted_id: data[0]?.id 
          });
        }
        
        // 進行状況表示
        if ((i + 1) % 5 === 0) {
          console.log(`    Progress: ${i + 1}/${mappedPrograms.length} (${successCount} successful)`);
        }
        
      } catch (err) {
        console.log(`  💥 ${i+1}/${mappedPrograms.length}: Exception - ${program.program_id}: ${err.message}`);
        results.push({ 
          index: i, 
          program_id: program.program_id, 
          success: false, 
          exception: err.message 
        });
      }
    }
    
    // 6. 結果検証
    console.log('\n=== Migration verification ===');
    
    const { data: verifyPrograms, error: verifyError } = await supabase
      .from('programs')
      .select('program_id, title, current_status')
      .like('program_id', 'PLAT_%');
    
    if (verifyError) {
      console.error('Verification error:', verifyError);
    } else {
      console.log(`✅ Verification: ${verifyPrograms.length} PMplatto programs found in database`);
      
      // サンプル表示
      if (verifyPrograms.length > 0) {
        console.log('Sample migrated program:', verifyPrograms[0]);
      }
    }
    
    // 7. 最終レポート
    const report = {
      timestamp: TIMESTAMP,
      migration_date: new Date().toISOString(),
      source_data: {
        programs: programs.length
      },
      migration_results: {
        attempted: mappedPrograms.length,
        successful: successCount,
        failed: mappedPrograms.length - successCount,
        success_rate: ((successCount / mappedPrograms.length) * 100).toFixed(2) + '%'
      },
      verification: {
        programs_found: verifyPrograms?.length || 0
      },
      detailed_results: results,
      status: successCount > 0 ? 'success' : 'failed'
    };
    
    const reportPath = path.join(BACKUP_DIR, `minimal_migration_report_${TIMESTAMP}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    
    console.log('\n=== 統合移行完了サマリー ===');
    console.log(`Attempted: ${mappedPrograms.length} programs`);
    console.log(`Successful: ${successCount} programs`);
    console.log(`Failed: ${mappedPrograms.length - successCount} programs`);
    console.log(`Success rate: ${report.migration_results.success_rate}`);
    console.log(`Verified: ${verifyPrograms?.length || 0} programs in database`);
    console.log(`Status: ${report.status.toUpperCase()}`);
    console.log(`Report: ${reportPath}`);
    
    if (successCount > 0) {
      console.log(`🎉 統合移行が完了しました！${successCount}件のPMplattoプログラムがPMliberaryに統合されました。`);
      
      if (successCount < mappedPrograms.length) {
        console.log(`⚠️ ${mappedPrograms.length - successCount}件のプログラムで問題が発生しました。詳細はレポートを確認してください。`);
      }
    } else {
      console.log('❌ 統合移行でエラーが発生しました。詳細はレポートを確認してください。');
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
    
    console.log(`❌ Critical error report: ${errorReportPath}`);
    return errorReport;
  }
}

// スクリプト実行
if (require.main === module) {
  executeStagedMigration();
}

module.exports = { executeStagedMigration };