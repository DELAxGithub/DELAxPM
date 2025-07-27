// 週報機能のテストスクリプト
const fetch = require('cross-fetch');

async function testWeeklyReview() {
  console.log('=== 週報機能テスト開始 ===');
  
  try {
    const response = await fetch('http://localhost:3000/api/weekly-review', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    
    console.log('レスポンスステータス:', response.status);
    console.log('結果:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ 週報機能テスト成功！');
      console.log('統計:', result.stats);
    } else {
      console.log('❌ 週報機能テスト失敗:', result.message);
    }
    
  } catch (error) {
    console.error('❌ テスト実行エラー:', error.message);
  }
  
  console.log('=== 週報機能テスト終了 ===');
}

testWeeklyReview();