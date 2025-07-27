#!/usr/bin/env node

/**
 * データベース移行検証スクリプト
 * 移行後のデータ整合性をチェック
 */

const { execSync } = require('child_process');
const chalk = require('chalk');

console.log(chalk.blue('🔍 DELA×PM データベース移行検証開始\n'));

const queries = [
  {
    name: 'プロジェクトタイプ別プログラム数',
    query: "SELECT project_type, COUNT(*) as count FROM programs GROUP BY project_type ORDER BY project_type",
    expectedResults: {
      'liberary': 3,
      'platto': 5
    }
  },
  {
    name: 'プロジェクトタイプ別エピソード数',
    query: `
      SELECT p.project_type, COUNT(e.id) as episode_count 
      FROM programs p 
      LEFT JOIN episodes e ON e.program_id = p.id 
      GROUP BY p.project_type 
      ORDER BY p.project_type
    `,
    expectedResults: {
      'liberary': 3,
      'platto': 0
    }
  },
  {
    name: 'PMplattoデータの移行確認',
    query: "SELECT COUNT(*) as count FROM programs WHERE source_system = 'pmplatto'",
    expectedResults: {
      'count': 5
    }
  },
  {
    name: 'プログラムIDの重複チェック',
    query: `
      SELECT program_id, COUNT(*) as count 
      FROM programs 
      WHERE program_id IS NOT NULL 
      GROUP BY program_id 
      HAVING COUNT(*) > 1
    `,
    shouldBeEmpty: true
  },
  {
    name: 'エピソードIDの重複チェック',
    query: `
      SELECT episode_id, COUNT(*) as count 
      FROM episodes 
      GROUP BY episode_id 
      HAVING COUNT(*) > 1
    `,
    shouldBeEmpty: true
  },
  {
    name: 'データ整合性チェック',
    query: `
      SELECT 
        (SELECT COUNT(*) FROM programs) as total_programs,
        (SELECT COUNT(*) FROM episodes) as total_episodes,
        (SELECT COUNT(*) FROM programs WHERE project_type IS NULL) as null_project_types,
        (SELECT COUNT(*) FROM programs WHERE created_at IS NULL) as null_created_dates
    `,
    validator: (result) => {
      const row = result[0];
      return row.total_programs >= 8 && 
             row.null_project_types === 0 && 
             row.null_created_dates === 0;
    }
  }
];

async function runQuery(query) {
  try {
    const command = `cd supabase && supabase db execute "${query.replace(/"/g, '\\"')}" --json`;
    const output = execSync(command, { encoding: 'utf8' });
    return JSON.parse(output);
  } catch (error) {
    console.error(chalk.red(`❌ クエリ実行エラー: ${error.message}`));
    return null;
  }
}

function validateResults(query, results) {
  if (!results) {
    return false;
  }

  // 空であることを期待するクエリ
  if (query.shouldBeEmpty) {
    return results.length === 0;
  }

  // カスタムバリデーター
  if (query.validator) {
    return query.validator(results);
  }

  // 期待値との比較
  if (query.expectedResults) {
    for (const row of results) {
      for (const [key, expectedValue] of Object.entries(query.expectedResults)) {
        if (row[key] != expectedValue) {
          console.log(chalk.yellow(`  期待値: ${key}=${expectedValue}, 実際: ${key}=${row[key]}`));
          return false;
        }
      }
    }
    return true;
  }

  return true;
}

async function main() {
  let allTestsPassed = true;
  
  for (const query of queries) {
    console.log(chalk.cyan(`📊 ${query.name}`));
    
    const results = await runQuery(query);
    const isValid = validateResults(query, results);
    
    if (isValid) {
      console.log(chalk.green('  ✅ 検証成功'));
      if (results && results.length > 0) {
        console.log('  ', JSON.stringify(results, null, 2));
      }
    } else {
      console.log(chalk.red('  ❌ 検証失敗'));
      if (results) {
        console.log('  実際の結果:', JSON.stringify(results, null, 2));
      }
      allTestsPassed = false;
    }
    console.log();
  }

  // 総合結果
  if (allTestsPassed) {
    console.log(chalk.green.bold('🎉 すべての検証に成功しました！'));
    console.log(chalk.green('データベース移行は正常に完了しています。\n'));
    process.exit(0);
  } else {
    console.log(chalk.red.bold('❌ 一部の検証に失敗しました'));
    console.log(chalk.red('データベースの状態を確認してください。\n'));
    process.exit(1);
  }
}

// エラーハンドリング
process.on('uncaughtException', (error) => {
  console.error(chalk.red('❌ 予期しないエラーが発生しました:'), error.message);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error(chalk.red('❌ 処理が失敗しました:'), error.message);
  process.exit(1);
});

main();