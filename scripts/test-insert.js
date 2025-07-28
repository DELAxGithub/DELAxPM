#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pfrzcteapmwufnovmmfc.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcnpjdGVhcG13dWZub3ZtbWZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMDAwNTAsImV4cCI6MjA2ODU3NjA1MH0.We0I0UDqKfS9jPSzDvWtQmB7na8YvCld6_Kko4uBCdU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  try {
    console.log('🧪 テストデータ挿入を試行...\n');

    // 最小限のテストデータで挿入を試す
    const testData = {
      title: 'テスト番組',
      notes: '[PLATTO] テスト用データ'
    };

    const { data, error } = await supabase
      .from('programs')
      .insert([testData])
      .select();

    if (error) {
      console.error('❌ テスト挿入エラー:', error.message);
      console.error('詳細:', error);
      
      // より詳細なスキーマ情報を取得を試す
      const { data: schemaData, error: schemaError } = await supabase
        .from('programs')
        .select('*')
        .limit(0);
        
      if (schemaError) {
        console.log('\nスキーマ情報取得も失敗:', schemaError.message);
      }
    } else {
      console.log('✅ テストデータ挿入成功:');
      console.log(data);
      
      // 挿入したデータを削除
      if (data && data[0]) {
        await supabase
          .from('programs')
          .delete()
          .eq('id', data[0].id);
        console.log('🧹 テストデータを削除しました');
      }
    }

  } catch (error) {
    console.error('💥 テスト失敗:', error.message);
  }
}

testInsert();