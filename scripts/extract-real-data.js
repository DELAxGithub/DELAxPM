#!/usr/bin/env node

/**
 * PMplatto・PMliberary実データ抽出スクリプト
 * 使用方法: node extract-real-data.js [pmplatto|pmliberary]
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 設定
const BACKUP_DIR = path.join(__dirname, '..', 'backup');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

// プロジェクト設定
const PROJECTS = {
  pmplatto: {
    envPath: path.join(__dirname, '..', 'temp_platto', '.env.local'),
    tables: ['programs', 'calendar_tasks', 'users'],
    name: 'PMplatto'
  },
  pmliberary: {
    envPath: path.join(__dirname, '..', 'temp_liberary', '.env.local'),
    tables: ['programs', 'episodes', 'episode_statuses', 'status_history', 'team_events'],
    name: 'PMliberary'
  }
};

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
 * Supabaseクライアントを作成
 */
function createSupabaseClient(env) {
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    throw new Error('Missing Supabase URL or API key in environment file');
  }
  
  return createClient(url, key);
}

/**
 * テーブルデータを取得
 */
async function fetchTableData(supabase, tableName) {
  try {
    console.log(`  Fetching ${tableName}...`);
    
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact' });
    
    if (error) {
      console.error(`    Error fetching ${tableName}:`, error.message);
      return { data: [], count: 0, error: error.message };
    }
    
    console.log(`    Found ${count} records in ${tableName}`);
    return { data: data || [], count: count || 0, error: null };
  } catch (err) {
    console.error(`    Exception fetching ${tableName}:`, err.message);
    return { data: [], count: 0, error: err.message };
  }
}

/**
 * データをファイルに保存
 */
function saveData(projectKey, tableName, data, format = 'json') {
  const filename = `${projectKey}_${tableName}_${TIMESTAMP}.${format}`;
  const filepath = path.join(BACKUP_DIR, filename);
  
  try {
    if (format === 'json') {
      fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
    } else if (format === 'csv') {
      if (data.length === 0) {
        fs.writeFileSync(filepath, '', 'utf8');
        return filepath;
      }
      
      // CSV形式で保存
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header];
            if (value === null || value === undefined) return '';
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');
      
      fs.writeFileSync(filepath, csvContent, 'utf8');
    }
    
    console.log(`    Saved: ${filename}`);
    return filepath;
  } catch (err) {
    console.error(`    Error saving ${filename}:`, err.message);
    return null;
  }
}

/**
 * プロジェクトデータを抽出
 */
async function extractProjectData(projectKey) {
  console.log(`\n=== ${PROJECTS[projectKey].name} データ抽出開始 ===`);
  
  try {
    // 環境変数読み込み
    const env = loadEnvFile(PROJECTS[projectKey].envPath);
    console.log(`Environment loaded from: ${PROJECTS[projectKey].envPath}`);
    console.log(`Supabase URL: ${env.VITE_SUPABASE_URL}`);
    
    // Supabaseクライアント作成
    const supabase = createSupabaseClient(env);
    
    // データ抽出結果
    const extractionResult = {
      project: projectKey,
      projectName: PROJECTS[projectKey].name,
      timestamp: TIMESTAMP,
      supabaseUrl: env.VITE_SUPABASE_URL,
      tables: {},
      totalRecords: 0,
      files: [],
      errors: []
    };
    
    // 各テーブルからデータ取得
    for (const tableName of PROJECTS[projectKey].tables) {
      console.log(`\nProcessing table: ${tableName}`);
      
      const result = await fetchTableData(supabase, tableName);
      
      extractionResult.tables[tableName] = {
        recordCount: result.count,
        hasError: !!result.error,
        errorMessage: result.error
      };
      
      if (result.error) {
        extractionResult.errors.push(`${tableName}: ${result.error}`);
        continue;
      }
      
      extractionResult.totalRecords += result.count;
      
      // JSONファイル保存
      const jsonFile = saveData(projectKey, tableName, result.data, 'json');
      if (jsonFile) {
        extractionResult.files.push(path.basename(jsonFile));
      }
      
      // CSVファイル保存
      const csvFile = saveData(projectKey, tableName, result.data, 'csv');
      if (csvFile) {
        extractionResult.files.push(path.basename(csvFile));
      }
    }
    
    // 抽出結果メタデータ保存
    const metadataFile = `${projectKey}_extraction_result_${TIMESTAMP}.json`;
    const metadataPath = path.join(BACKUP_DIR, metadataFile);
    fs.writeFileSync(metadataPath, JSON.stringify(extractionResult, null, 2), 'utf8');
    extractionResult.files.push(metadataFile);
    
    console.log(`\n=== ${PROJECTS[projectKey].name} データ抽出完了 ===`);
    console.log(`総レコード数: ${extractionResult.totalRecords}`);
    console.log(`生成ファイル数: ${extractionResult.files.length}`);
    
    if (extractionResult.errors.length > 0) {
      console.log(`エラー数: ${extractionResult.errors.length}`);
      extractionResult.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    return extractionResult;
    
  } catch (err) {
    console.error(`Error extracting ${projectKey} data:`, err.message);
    return {
      project: projectKey,
      error: err.message,
      success: false
    };
  }
}

/**
 * メイン実行関数
 */
async function main() {
  const projectKey = process.argv[2];
  
  if (!projectKey || !PROJECTS[projectKey]) {
    console.log('Usage: node extract-real-data.js [pmplatto|pmliberary]');
    console.log('Available projects:', Object.keys(PROJECTS).join(', '));
    process.exit(1);
  }
  
  // バックアップディレクトリ作成
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  console.log(`Data extraction started: ${new Date().toISOString()}`);
  console.log(`Target project: ${PROJECTS[projectKey].name}`);
  console.log(`Backup directory: ${BACKUP_DIR}`);
  
  const result = await extractProjectData(projectKey);
  
  console.log('\n=== 抽出作業完了 ===');
  
  if (result.success === false) {
    process.exit(1);
  } else {
    console.log('Success: データ抽出が正常に完了しました');
  }
}

// スクリプト実行
if (require.main === module) {
  main().catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
}

module.exports = { extractProjectData, PROJECTS };