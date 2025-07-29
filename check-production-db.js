const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://pfrzcteapmwufnovmmfc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcnpjdGVhcG13dWZub3ZtbWZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMDAwNTAsImV4cCI6MjA2ODU3NjA1MH0.We0I0UDqKfS9jPSzDvWtQmB7na8YvCld6_Kko4uBCdU'
);

async function checkProductionDB() {
  console.log('=== 本番データベースの状態確認 ===');
  
  try {
    // 直接SQLでテーブル存在確認
    const { data: tablesData, error: tablesError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name IN ('programs', 'series', 'episodes', 'status_master')
        ORDER BY table_name;
      `
    });
    
    if (tablesError) {
      console.log('テーブル確認エラー:', tablesError);
      
      // RPCが使えない場合の従来方式
      let tables = [];
      
      const { error: episodesError } = await supabase.from('episodes').select('count').single();
      if (!episodesError) tables.push('episodes');
      
      const { error: programsError } = await supabase.from('programs').select('count').single();
      if (!programsError) tables.push('programs');
      
      const { error: seriesError } = await supabase.from('series').select('count').single();
      if (!seriesError) tables.push('series');
      
      const { error: statusError } = await supabase.from('status_master').select('count').single();
      if (!statusError) tables.push('status_master');
      
      console.log('存在するテーブル:', tables.join(', ') || 'なし');
      
      // データ件数確認
      if (tables.includes('programs')) {
        const { data: programsData } = await supabase.from('programs').select('id, title, project_type');
        console.log('Programs:', programsData?.length || 0, 'rows');
        programsData?.forEach(p => console.log(' -', p.title, '(' + p.project_type + ')'));
      }
      
      if (tables.includes('episodes')) {
        const { data: episodesData } = await supabase.from('episodes').select('id, title, status').limit(5);
        console.log('Episodes:', episodesData?.length || 0, 'rows (first 5)');
        episodesData?.forEach(e => console.log(' -', e.title || 'タイトルなし', '(status:', e.status + ')'));
      }
      
      if (tables.includes('status_master')) {
        const { data: statusData } = await supabase.from('status_master').select('project_type, status_name').limit(5);
        console.log('Status Master:', statusData?.length || 0, 'rows (first 5)');
        statusData?.forEach(s => console.log(' -', s.project_type, ':', s.status_name));
      }
    } else {
      console.log('テーブル一覧:', tablesData);
    }
    
  } catch (error) {
    console.log('エラー:', error.message);
  }
}

checkProductionDB().catch(console.error);