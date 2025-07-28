#!/usr/bin/env node

/**
 * クイックデータチェックスクリプト
 */

const { execSync } = require('child_process');

console.log('🔍 DELA×PM データクイックチェック\n');

try {
  // psqlを使用して直接データベースに接続
  const result = execSync(`
    docker exec supabase_db_delaxpm-unified_1 psql -U postgres -d postgres -c "
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
    ORDER BY team;
    "
  `, { encoding: 'utf8' });
  
  console.log('データベース結果:');
  console.log(result);
  
  // 総数もチェック
  const totalResult = execSync(`
    docker exec supabase_db_delaxpm-unified_1 psql -U postgres -d postgres -c "
    SELECT COUNT(*) as total_programs FROM programs;
    "
  `, { encoding: 'utf8' });
  
  console.log('\n総プログラム数:');
  console.log(totalResult);
  
  console.log('✅ データチェック完了！');
  
} catch (error) {
  console.error('❌ チェック失敗:', error.message);
  
  // fallback: ブラウザ確認を推奨
  console.log('\n💡 手動確認手順:');
  console.log('1. ブラウザで http://localhost:3000/pla を確認');
  console.log('2. ブラウザで http://localhost:3000/lib を確認');
  console.log('3. データが表示されるか確認');
}