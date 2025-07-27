// Supabase接続とデータベーステスト
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pfrzcteapmwufnovmmfc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcnpjdGVhcG13dWZub3ZtbWZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMDAwNTAsImV4cCI6MjA2ODU3NjA1MH0.We0I0UDqKfS9jPSzDvWtQmB7na8YvCld6_Kko4uBCdU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseConnection() {
  console.log('=== Supabase接続テスト開始 ===');
  
  try {
    // 1. テーブル一覧を取得
    console.log('\n1. データベース接続テスト...');
    const { data: tables, error: tablesError } = await supabase
      .from('programs')
      .select('count')
      .limit(1);
    
    if (tablesError) {
      console.error('❌ データベース接続エラー:', tablesError.message);
      return;
    }
    
    console.log('✅ データベース接続成功');
    
    // 2. programsテーブルのデータ確認
    console.log('\n2. programsテーブルの確認...');
    const { data: programs, error: programsError } = await supabase
      .from('programs')
      .select('*')
      .limit(5);
    
    if (programsError) {
      console.error('❌ programsテーブルエラー:', programsError.message);
    } else {
      console.log(`✅ programsテーブル: ${programs.length}件のデータ`);
      if (programs.length > 0) {
        console.log('サンプルデータ:', programs[0]);
      }
    }
    
    // 3. episodesテーブルのデータ確認
    console.log('\n3. episodesテーブルの確認...');
    const { data: episodes, error: episodesError } = await supabase
      .from('episodes')
      .select('*')
      .limit(5);
    
    if (episodesError) {
      console.error('❌ episodesテーブルエラー:', episodesError.message);
    } else {
      console.log(`✅ episodesテーブル: ${episodes.length}件のデータ`);
      if (episodes.length > 0) {
        console.log('サンプルデータ:', episodes[0]);
      }
    }
    
    // 4. calendar_tasksテーブルのデータ確認
    console.log('\n4. calendar_tasksテーブルの確認...');
    const { data: tasks, error: tasksError } = await supabase
      .from('calendar_tasks')
      .select('*')
      .limit(5);
    
    if (tasksError) {
      console.error('❌ calendar_tasksテーブルエラー:', tasksError.message);
    } else {
      console.log(`✅ calendar_tasksテーブル: ${tasks.length}件のデータ`);
      if (tasks.length > 0) {
        console.log('サンプルデータ:', tasks[0]);
      }
    }
    
  } catch (error) {
    console.error('❌ 接続テスト失敗:', error.message);
  }
  
  console.log('\n=== Supabase接続テスト終了 ===');
}

testSupabaseConnection();