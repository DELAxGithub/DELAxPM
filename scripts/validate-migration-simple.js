#!/usr/bin/env node

/**
 * データベース移行検証スクリプト（シンプル版）
 */

const { execSync } = require('child_process');

console.log('🔍 DELA×PM データベース移行検証開始\n');

async function runQuery(query) {
  try {
    const command = `cd supabase && supabase db execute "${query.replace(/"/g, '\\"')}" --json`;
    const output = execSync(command, { encoding: 'utf8' });
    return JSON.parse(output);
  } catch (error) {
    console.error('❌ クエリ実行エラー:', error.message);
    return null;
  }
}

async function main() {
  console.log('📊 チーム別プログラム数確認');
  
  const teamQuery = `
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
  `;
  
  const results = await runQuery(teamQuery);
  
  if (results) {
    console.log('チーム別データ:');
    results.forEach(row => {
      console.log(`  ${row.team}: ${row.count} 番組`);
    });
    
    const teamCounts = {};
    results.forEach(row => {
      teamCounts[row.team] = parseInt(row.count);
    });
    
    if (teamCounts.platto >= 5 && teamCounts.liberary >= 5) {
      console.log('\n✅ 検証成功！両チームとも5番組以上あります');
      console.log(`PLATTOチーム: ${teamCounts.platto} 番組`);
      console.log(`LIBERARYチーム: ${teamCounts.liberary} 番組`);
      process.exit(0);
    } else {
      console.log('\n❌ 検証失敗！データが不足しています');
      process.exit(1);
    }
  } else {
    console.log('❌ データ取得に失敗しました');
    process.exit(1);
  }
}

main();