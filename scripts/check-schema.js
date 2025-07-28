#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pfrzcteapmwufnovmmfc.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcnpjdGVhcG13dWZub3ZtbWZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMDAwNTAsImV4cCI6MjA2ODU3NjA1MH0.We0I0UDqKfS9jPSzDvWtQmB7na8YvCld6_Kko4uBCdU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  try {
    console.log('🔍 Supabase programs テーブルのスキーマを確認中...\n');

    // 1. まず現在のデータを1件取得してカラム構造を確認
    const { data: sampleData, error: sampleError } = await supabase
      .from('programs')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.error('❌ データ取得エラー:', sampleError.message);
      return;
    }

    if (sampleData && sampleData.length > 0) {
      console.log('📊 利用可能なカラム:');
      Object.keys(sampleData[0]).forEach(key => {
        console.log(`  - ${key}: ${typeof sampleData[0][key]} (${sampleData[0][key]})`);
      });
    }

    // 2. データ件数を確認
    const { data: countData, error: countError, count } = await supabase
      .from('programs')
      .select('id', { count: 'exact' });

    if (!countError) {
      console.log(`\n📈 総データ件数: ${count} 件`);
    }

    // 3. notesフィールドの内容を確認
    const { data: notesData, error: notesError } = await supabase
      .from('programs')
      .select('program_id, title, notes')
      .not('notes', 'is', null)
      .limit(3);

    if (!notesError && notesData) {
      console.log('\n📝 notesフィールドのサンプル:');
      notesData.forEach(item => {
        console.log(`  - ${item.program_id}: "${item.notes}"`);
      });
    }

  } catch (error) {
    console.error('💥 スキーマチェック失敗:', error.message);
  }
}

checkSchema();