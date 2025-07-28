#!/usr/bin/env node

/**
 * データベース移行検証スクリプト
 * 移行後のデータ整合性をチェック
 */

const { execSync } = require('child_process');
// chalk library has issues - using plain console logging

console.log('🔍 DELA×PM データベース移行検証開始\n');

const queries = [
  {
    name: 'チーム別プログラム数（タグベース）',
    query: `
      SELECT 
        CASE 
          WHEN notes ILIKE '%[PLATTO]%' THEN 'platto'
          WHEN notes ILIKE '%[LIBERARY]%' THEN 'liberary'
          ELSE 'other'
        END as team,
        COUNT(*) as count
      FROM programs 
      GROUP BY 
        CASE 
          WHEN notes ILIKE '%[PLATTO]%' THEN 'platto'
          WHEN notes ILIKE '%[LIBERARY]%' THEN 'liberary'
          ELSE 'other'
        END
      ORDER BY team
    `,
    validator: (results) => {
      const teamCounts = {};
      results.forEach(row => {
        teamCounts[row.team] = parseInt(row.count);
      });
      return teamCounts.platto >= 5 && teamCounts.liberary >= 5;
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
    name: 'PLATTOタグデータの確認',
    query: "SELECT COUNT(*) as count FROM programs WHERE notes ILIKE '%[PLATTO]%'",
    validator: (results) => results[0].count >= 5
  },
  {
    name: 'LIBERARYタグデータの確認',
    query: "SELECT COUNT(*) as count FROM programs WHERE notes ILIKE '%[LIBERARY]%'",
    validator: (results) => results[0].count >= 5
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
    console.error(red(`❌ クエリ実行エラー: ${error.message}`));
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
          console.log(yellow(`  期待値: ${key}=${expectedValue}, 実際: ${key}=${row[key]}`));
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
    console.log(cyan(`📊 ${query.name}`));
    
    const results = await runQuery(query);
    const isValid = validateResults(query, results);
    
    if (isValid) {
      console.log(green('  ✅ 検証成功'));
      if (results && results.length > 0) {
        console.log('  ', JSON.stringify(results, null, 2));
      }
    } else {
      console.log(red('  ❌ 検証失敗'));
      if (results) {
        console.log('  実際の結果:', JSON.stringify(results, null, 2));
      }
      allTestsPassed = false;
    }
    console.log();
  }

  // 総合結果
  if (allTestsPassed) {
    console.log(green.bold('🎉 すべての検証に成功しました！'));
    console.log(green('データベース移行は正常に完了しています。\n'));
    process.exit(0);
  } else {
    console.log(red.bold('❌ 一部の検証に失敗しました'));
    console.log(red('データベースの状態を確認してください。\n'));
    process.exit(1);
  }
}

// エラーハンドリング
process.on('uncaughtException', (error) => {
  console.error(red('❌ 予期しないエラーが発生しました:'), error.message);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error(red('❌ 処理が失敗しました:'), error.message);
  process.exit(1);
});

main();