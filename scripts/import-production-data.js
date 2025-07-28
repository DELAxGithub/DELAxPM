#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pfrzcteapmwufnovmmfc.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcnpjdGVhcG13dWZub3ZtbWZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMDAwNTAsImV4cCI6MjA2ODU3NjA1MH0.We0I0UDqKfS9jPSzDvWtQmB7na8YvCld6_Kko4uBCdU';

const supabase = createClient(supabaseUrl, supabaseKey);

// Sample production data for Liberary team
// Note: Since schema doesn't have project_type, we'll use tags in notes field
const liberaryPrograms = [
  {
    program_id: 'liberary_001',
    title: 'テレビ東京「WBS（ワールドビジネスサテライト）」',
    subtitle: '経済情報番組',
    program_type: 'series',
    current_status: 'ロケ済',
    director: '田中太郎',
    cast1: '大江麻理子',
    first_air_date: '2025-02-01',
    notes: '[LIBERARY] レギュラー番組。毎週月曜日放送。'
  },
  {
    program_id: 'liberary_002',
    title: 'TBS「報道特集」',
    subtitle: 'ニュース・ドキュメンタリー',
    program_type: 'series',
    current_status: 'VE済',
    director: '佐藤花子',
    cast1: '金平茂紀',
    first_air_date: '2025-02-08',
    notes: '[LIBERARY] 土曜日の報道番組。社会問題を深く掘り下げる。'
  },
  {
    program_id: 'liberary_003',
    title: 'フジテレビ「めざましテレビ」',
    subtitle: '朝の情報番組',
    program_type: 'series',
    current_status: 'MA済',
    director: '鈴木三郎',
    cast1: '三宅正治',
    first_air_date: '2025-02-03',
    notes: '[LIBERARY] 平日朝の定番番組。芸能・スポーツ・天気など幅広い情報を提供。'
  },
  {
    program_id: 'liberary_004',
    title: 'NHK「クローズアップ現代」',
    subtitle: '報道・ドキュメンタリー',
    program_type: 'series',
    current_status: '初号試写済',
    director: '山田一郎',
    cast1: '桑子真帆',
    first_air_date: '2025-02-05',
    notes: '[LIBERARY] 社会の課題を深く掘り下げる番組。毎週火曜日放送。'
  },
  {
    program_id: 'liberary_005',
    title: '日本テレビ「ZIP!」',
    subtitle: '朝の情報バラエティ',
    program_type: 'series',
    current_status: '局プレ済',
    director: '高橋五郎',
    cast1: '水卜麻美',
    first_air_date: '2025-02-04',
    notes: '[LIBERARY] 平日朝の人気番組。エンタメ情報満載。'
  }
];

// Additional production data for Platto team (to add to existing 32 programs)
const plattoPrograms = [
  {
    program_id: 'platto_033',
    title: 'テレビ朝日「サンデーLIVE!!」',
    subtitle: '日曜朝の報道番組',
    program_type: 'series',
    current_status: 'キャスティング中',
    director: '伊藤智子',
    cast1: '長野智子',
    first_air_date: '2025-02-09',
    notes: '[PLATTO] 日曜朝の報道・情報番組。政治・経済・社会問題を扱う。'
  },
  {
    program_id: 'platto_034',
    title: 'TBS「サンデーモーニング」',
    subtitle: '日曜朝の情報番組',
    program_type: 'series',
    current_status: 'ロケ済',
    director: '小林浩二',
    cast1: '関口宏',
    first_air_date: '2025-02-02',
    notes: '[PLATTO] ご長寿番組。スポーツと時事問題を扱う。'
  },
  {
    program_id: 'platto_035',
    title: 'フジテレビ「ワイドナショー」',
    subtitle: '日曜朝のバラエティ',
    program_type: 'series',
    current_status: 'VE済',
    director: '松本恵美',
    cast1: '東野幸治',
    first_air_date: '2025-02-09',
    notes: '[PLATTO] 時事ネタをバラエティ形式で扱う番組。'
  },
  {
    program_id: 'platto_036',
    title: 'NHK「NHKスペシャル」',
    subtitle: 'ドキュメンタリー',
    program_type: 'single',
    current_status: 'MA済',
    director: '森田裕司',
    cast1: 'ナレーター：森田美由紀',
    first_air_date: '2025-02-15',
    notes: '[PLATTO] NHKの看板ドキュメンタリー番組。'
  },
  {
    program_id: 'platto_037',
    title: '日本テレビ「世界一受けたい授業」',
    subtitle: '教育バラエティ',
    program_type: 'series',
    current_status: '初号試写済',
    director: '中村健一',
    cast1: '堺正章',
    first_air_date: '2025-02-08',
    notes: '[PLATTO] 土曜夜の教育バラエティ番組。様々な分野の専門家が登場。'
  },
  {
    program_id: 'platto_038',
    title: 'テレビ東京「ガイアの夜明け」',
    subtitle: 'ドキュメンタリー',
    program_type: 'series',
    current_status: '局プレ済',
    director: '青木七海',
    cast1: 'ナレーター：蟹江敬三',
    first_air_date: '2025-02-04',
    notes: '[PLATTO] 経済ドキュメンタリー番組。企業の挑戦を追う。'
  },
  {
    program_id: 'platto_039',
    title: 'TBS「情熱大陸」',
    subtitle: 'ドキュメンタリー',
    program_type: 'series',
    current_status: '完パケ済',
    director: '西田敏行',
    cast1: 'ナレーター：窪田等',
    first_air_date: '2025-02-02',
    notes: '[PLATTO] 人物ドキュメンタリー番組。毎週様々な分野の人物を追う。'
  },
  {
    program_id: 'platto_040',
    title: 'フジテレビ「ザ・ノンフィクション」',
    subtitle: 'ドキュメンタリー',
    program_type: 'series',
    current_status: 'OA済',
    director: '坂本龍一',
    cast1: 'ナレーター：中井貴一',
    first_air_date: '2025-01-26',
    notes: '[PLATTO] 日曜夕方の本格ドキュメンタリー番組。'
  }
];

async function importProductionData() {
  try {
    console.log('🚀 DELA×PM 本番データ投入開始\n');

    // Import Liberary team programs
    console.log('📺 リベラリーチームの番組データを投入中...');
    const { data: liberaryData, error: liberaryError } = await supabase
      .from('programs')
      .insert(liberaryPrograms)
      .select();

    if (liberaryError) {
      console.error('❌ リベラリーデータ投入エラー:', liberaryError.message);
      throw liberaryError;
    }

    console.log(`✅ リベラリーチーム: ${liberaryData.length} 番組を投入完了`);

    // Import additional Platto team programs
    console.log('📺 プラットチームの追加番組データを投入中...');
    const { data: plattoData, error: plattoError } = await supabase
      .from('programs')
      .insert(plattoPrograms)
      .select();

    if (plattoError) {
      console.error('❌ プラットデータ投入エラー:', plattoError.message);
      throw plattoError;
    }

    console.log(`✅ プラットチーム: ${plattoData.length} 番組を追加完了`);

    // Verify total counts
    console.log('\n🔍 データ確認中...');
    
    const { data: liberaryCount, error: liberaryCountError } = await supabase
      .from('programs')
      .select('id', { count: 'exact' })
      .ilike('notes', '%[LIBERARY]%');

    const { data: plattoCount, error: plattoCountError } = await supabase
      .from('programs')
      .select('id', { count: 'exact' })
      .ilike('notes', '%[PLATTO]%');

    if (liberaryCountError || plattoCountError) {
      console.warn('⚠️  データ確認でエラーが発生しました');
    } else {
      console.log(`📊 データベース確認結果:`);
      console.log(`  - リベラリーチーム: ${liberaryCount?.length || 0} 番組`);
      console.log(`  - プラットチーム: ${plattoCount?.length || 0} 番組`);
      console.log(`  - 合計: ${(liberaryCount?.length || 0) + (plattoCount?.length || 0)} 番組`);
    }

    console.log('\n🎉 本番データ投入完了！');
    console.log('\n📋 次のステップ:');
    console.log('  1. チーム専用URL動作確認: /team/liberary と /team/platto');
    console.log('  2. 週次レビュー機能のメール設定');
    console.log('  3. Netlifyデプロイ設定');

  } catch (error) {
    console.error('💥 データ投入失敗:', error.message);
    process.exit(1);
  }
}

// スクリプト実行
if (require.main === module) {
  importProductionData();
}

module.exports = { importProductionData };