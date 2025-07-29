const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://pfrzcteapmwufnovmmfc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcnpjdGVhcG13dWZub3ZtbWZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMDAwNTAsImV4cCI6MjA2ODU3NjA1MH0.We0I0UDqKfS9jPSzDvWtQmB7na8YvCld6_Kko4uBCdU'
);

async function testProductionQuery() {
  console.log('=== useEpisodesフック相当のクエリテスト ===');
  
  try {
    // プラットチーム用のクエリ
    console.log('\n--- プラットチーム用クエリ ---');
    const plattoQuery = supabase
      .from('episodes')
      .select(`
        *,
        series!inner(
          id,
          title,
          programs!inner(
            id,
            title,
            project_type
          )
        )
      `, { count: 'exact' })
      .eq('series.programs.project_type', 'platto')
      .order('episode_number', { ascending: true });

    const { data: plattoData, error: plattoError, count: plattoCount } = await plattoQuery;
    
    if (plattoError) {
      console.log('プラットクエリエラー:', plattoError);
    } else {
      console.log('プラットエピソード数:', plattoCount);
      plattoData?.slice(0, 3).forEach(ep => {
        console.log(' -', ep.title || `エピソード${ep.episode_number}`, '(status:', ep.status + ')');
        console.log('   Program:', ep.series?.programs?.title);
      });
    }
    
    // リベラリーチーム用のクエリ
    console.log('\n--- リベラリーチーム用クエリ ---');
    const liberaryQuery = supabase
      .from('episodes')
      .select(`
        *,
        series!inner(
          id,
          title,
          programs!inner(
            id,
            title,
            project_type
          )
        )
      `, { count: 'exact' })
      .eq('series.programs.project_type', 'liberary')
      .order('episode_number', { ascending: true });

    const { data: liberaryData, error: liberaryError, count: liberaryCount } = await liberaryQuery;
    
    if (liberaryError) {
      console.log('リベラリークエリエラー:', liberaryError);
    } else {
      console.log('リベラリーエピソード数:', liberaryCount);
      liberaryData?.slice(0, 3).forEach(ep => {
        console.log(' -', ep.title || `エピソード${ep.episode_number}`, '(status:', ep.status + ')');
        console.log('   Program:', ep.series?.programs?.title);
      });
    }
    
    // 全エピソード確認
    console.log('\n--- 全エピソード確認 ---');
    const allQuery = supabase
      .from('episodes')
      .select(`
        id,
        title,
        episode_number,
        status,
        series(
          id,
          title,
          programs(
            id,
            title,
            project_type
          )
        )
      `)
      .limit(5);

    const { data: allData, error: allError } = await allQuery;
    
    if (allError) {
      console.log('全エピソードクエリエラー:', allError);
    } else {
      console.log('全エピソード (first 5):');
      allData?.forEach(ep => {
        console.log(' -', ep.title || `エピソード${ep.episode_number}`);
        console.log('   Series:', ep.series?.title, '| Program:', ep.series?.programs?.title, '(' + ep.series?.programs?.project_type + ')');
      });
    }
    
  } catch (error) {
    console.log('エラー:', error.message);
  }
}

testProductionQuery().catch(console.error);