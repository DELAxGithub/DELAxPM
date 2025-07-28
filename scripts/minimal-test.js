#!/usr/bin/env node

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../apps/unified/.env.local') });

const { createClient } = require('@supabase/supabase-js');

// Test with anon key first
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Supabase接続テスト...');
console.log('URL:', supabaseUrl);
console.log('Key (first 20 chars):', supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'missing');

const supabase = createClient(supabaseUrl, supabaseKey);

async function minimalTest() {
  try {
    // Test 1: Table existence check
    console.log('\n1️⃣ テーブル存在確認...');
    const { data, error, count } = await supabase
      .from('programs')
      .select('id', { count: 'exact' });
    
    if (error) {
      console.error('❌ テーブルアクセスエラー:', error.message);
      return;
    }
    
    console.log('✅ programsテーブルにアクセス可能');
    
    // Test 2: Insert test with minimal data
    console.log('\n2️⃣ 最小データ挿入テスト...');
    const testData = {
      title: 'テスト番組_' + Date.now(),
      notes: '[PLATTO] テスト用データ'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('programs')
      .insert([testData])
      .select();
      
    if (insertError) {
      console.error('❌ データ挿入エラー:', insertError.message);
      console.log('詳細:', insertError);
      
      // If RLS error, suggest solutions
      if (insertError.message.includes('row-level security')) {
        console.log('\n💡 解決策:');
        console.log('  1. SupabaseダッシュボードでprogramsテーブルのRLSを一時的に無効化');
        console.log('  2. SUPABASE_SERVICE_ROLE_KEYを環境変数に設定');
        console.log('  3. 匿名アクセス用のRLSポリシーを設定');
      }
      return;
    }
    
    console.log('✅ データ挿入成功:', insertData);
    
    // Test 3: Tag-based filtering
    console.log('\n3️⃣ タグベースフィルタリングテスト...');
    const { data: filteredData, error: filterError } = await supabase
      .from('programs')
      .select('*')
      .ilike('notes', '%[PLATTO]%');
      
    if (filterError) {
      console.error('❌ フィルタリングエラー:', filterError.message);
    } else {
      console.log('✅ PLATTOタグフィルタリング成功:', filteredData.length, '件');
    }
    
    // Clean up test data
    if (insertData && insertData[0]) {
      await supabase
        .from('programs')
        .delete()
        .eq('id', insertData[0].id);
      console.log('🧹 テストデータを削除しました');
    }
    
  } catch (error) {
    console.error('💥 テスト失敗:', error.message);
  }
}

minimalTest();