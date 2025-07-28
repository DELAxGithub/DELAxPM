#!/usr/bin/env node

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../apps/unified/.env.local') });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Supabase configuration - Service Role Key needed for RLS bypass
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pfrzcteapmwufnovmmfc.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Liberary team sample data (5 programs)
const liberaryPrograms = [
  {
    program_id: 'liberary_001',
    title: 'テレビ東京「WBS（ワールドビジネスサテライト）」',
    subtitle: '経済情報番組',
    status: 'ロケ済',
    cast1: '大江麻理子',
    first_air_date: '2025-02-01',
    notes: '[LIBERARY] レギュラー番組。毎週月曜日放送。'
  },
  {
    program_id: 'liberary_002',
    title: 'TBS「報道特集」',
    subtitle: 'ニュース・ドキュメンタリー',
    status: 'VE済',
    cast1: '金平茂紀',
    first_air_date: '2025-02-08',
    notes: '[LIBERARY] 土曜日の報道番組。社会問題を深く掘り下げる。'
  },
  {
    program_id: 'liberary_003',
    title: 'フジテレビ「めざましテレビ」',
    subtitle: '朝の情報番組',
    status: 'MA済',
    cast1: '三宅正治', 
    first_air_date: '2025-02-03',
    notes: '[LIBERARY] 平日朝の定番番組。芸能・スポーツ・天気など幅広い情報を提供。'
  },
  {
    program_id: 'liberary_004',
    title: 'NHK「クローズアップ現代」',
    subtitle: '報道・ドキュメンタリー',
    status: '初号試写済',
    cast1: '桑子真帆',
    first_air_date: '2025-02-05',
    notes: '[LIBERARY] 社会の課題を深く掘り下げる番組。毎週火曜日放送。'
  },
  {
    program_id: 'liberary_005',
    title: '日本テレビ「ZIP!」',
    subtitle: '朝の情報バラエティ',
    status: '局プレ済',
    cast1: '水卜麻美',
    first_air_date: '2025-02-04',
    notes: '[LIBERARY] 平日朝の人気番組。エンタメ情報満載。'
  }
];

// Additional Platto team sample data (8 programs)
const plattoNewPrograms = [
  {
    program_id: 'platto_033',
    title: 'テレビ朝日「サンデーLIVE!!」',
    subtitle: '日曜朝の報道番組',
    status: 'キャスティング中',
    cast1: '長野智子',
    first_air_date: '2025-02-09',
    notes: '[PLATTO] 日曜朝の報道・情報番組。政治・経済・社会問題を扱う。'
  },
  {
    program_id: 'platto_034',
    title: 'TBS「サンデーモーニング」',
    subtitle: '日曜朝の情報番組',
    status: 'ロケ済',
    cast1: '関口宏',
    first_air_date: '2025-02-02',
    notes: '[PLATTO] ご長寿番組。スポーツと時事問題を扱う。'
  },
  {
    program_id: 'platto_035',
    title: 'フジテレビ「ワイドナショー」',
    subtitle: '日曜朝のバラエティ',
    status: 'VE済',
    cast1: '東野幸治',
    first_air_date: '2025-02-09',
    notes: '[PLATTO] 時事ネタをバラエティ形式で扱う番組。'
  },
  {
    program_id: 'platto_036',
    title: 'NHK「NHKスペシャル」',
    subtitle: 'ドキュメンタリー',
    status: 'MA済',
    cast1: 'ナレーター：森田美由紀',
    first_air_date: '2025-02-15',
    notes: '[PLATTO] NHKの看板ドキュメンタリー番組。'
  },
  {
    program_id: 'platto_037',
    title: '日本テレビ「世界一受けたい授業」',
    subtitle: '教育バラエティ',
    status: '初号試写済',
    cast1: '堺正章',
    first_air_date: '2025-02-08',
    notes: '[PLATTO] 土曜夜の教育バラエティ番組。様々な分野の専門家が登場。'
  },
  {
    program_id: 'platto_038',
    title: 'テレビ東京「ガイアの夜明け」',
    subtitle: 'ドキュメンタリー',
    status: '局プレ済',
    cast1: 'ナレーター：蟹江敬三',
    first_air_date: '2025-02-04',
    notes: '[PLATTO] 経済ドキュメンタリー番組。企業の挑戦を追う。'
  },
  {
    program_id: 'platto_039',
    title: 'TBS「情熱大陸」',
    subtitle: 'ドキュメンタリー',
    status: '完パケ済',
    cast1: 'ナレーター：窪田等',
    first_air_date: '2025-02-02',
    notes: '[PLATTO] 人物ドキュメンタリー番組。毎週様々な分野の人物を追う。'
  },
  {
    program_id: 'platto_040',
    title: 'フジテレビ「ザ・ノンフィクション」',
    subtitle: 'ドキュメンタリー',
    status: 'OA済',
    cast1: 'ナレーター：中井貴一',
    first_air_date: '2025-01-26',
    notes: '[PLATTO] 日曜夕方の本格ドキュメンタリー番組。'
  }
];

async function restoreData() {
  try {
    console.log('🚀 DELA×PM データ復元開始\n');
    
    // Step 1: Check current data state
    const { data: currentData, error: currentError, count } = await supabase
      .from('programs')
      .select('id', { count: 'exact' });
      
    if (currentError) {
      console.error('❌ 現在のデータ確認エラー:', currentError.message);
      throw currentError;
    }
    
    console.log(`📊 現在のデータ件数: ${count} 件`);
    
    // Step 2: Load existing Platto backup data
    const backupPath = path.join(__dirname, '../backup/pmplatto_programs_2025-07-23T14-58-39.json');
    let existingPlattoData = [];
    
    if (fs.existsSync(backupPath)) {
      const backupJson = fs.readFileSync(backupPath, 'utf8');
      existingPlattoData = JSON.parse(backupJson);
      console.log(`💾 バックアップから ${existingPlattoData.length} 件の既存Plattoデータを読み込み`);
      
      // Add [PLATTO] tag to existing data
      const existingPlattoWithTag = existingPlattoData.map(program => ({
        ...program,
        notes: program.notes ? `${program.notes} [PLATTO]` : '[PLATTO]',
        // Remove id to allow auto-generation
        id: undefined
      }));
      
      // Insert existing Platto data
      console.log('📺 既存Plattoデータを復元中...');
      const { data: plattoRestoreData, error: plattoRestoreError } = await supabase
        .from('programs')
        .insert(existingPlattoWithTag)
        .select();
        
      if (plattoRestoreError) {
        console.error('❌ 既存Plattoデータ復元エラー:', plattoRestoreError.message);
        // Continue with other data even if this fails
      } else {
        console.log(`✅ 既存Plattoデータ復元完了: ${plattoRestoreData.length} 件`);
      }
    } else {
      console.log('⚠️  Plattoバックアップファイルが見つかりません');
    }
    
    // Step 3: Insert Liberary team programs
    console.log('📺 Liberaryチームの番組データを投入中...');
    const { data: liberaryData, error: liberaryError } = await supabase
      .from('programs')
      .insert(liberaryPrograms)
      .select();

    if (liberaryError) {
      console.error('❌ Liberaryデータ投入エラー:', liberaryError.message);
      throw liberaryError;
    }

    console.log(`✅ Liberaryチーム: ${liberaryData.length} 番組を投入完了`);

    // Step 4: Insert additional Platto team programs
    console.log('📺 Plattoチームの追加番組データを投入中...');
    const { data: plattoData, error: plattoError } = await supabase
      .from('programs')
      .insert(plattoNewPrograms)
      .select();

    if (plattoError) {
      console.error('❌ Platto追加データ投入エラー:', plattoError.message);
      throw plattoError;
    }

    console.log(`✅ Plattoチーム追加: ${plattoData.length} 番組を投入完了`);

    // Step 5: Verify final counts
    console.log('\n🔍 最終データ確認中...');
    
    const { data: liberaryCount, error: liberaryCountError } = await supabase
      .from('programs')
      .select('id', { count: 'exact' })
      .ilike('notes', '%[LIBERARY]%');

    const { data: plattoCount, error: plattoCountError } = await supabase
      .from('programs')
      .select('id', { count: 'exact' })
      .ilike('notes', '%[PLATTO]%');

    const { data: totalCount, error: totalCountError } = await supabase
      .from('programs')
      .select('id', { count: 'exact' });

    if (liberaryCountError || plattoCountError || totalCountError) {
      console.warn('⚠️  データ確認でエラーが発生しました');
    } else {
      console.log(`📊 データベース最終確認結果:`);
      console.log(`  - Liberaryチーム: ${liberaryCount?.length || 0} 番組`);
      console.log(`  - Plattoチーム: ${plattoCount?.length || 0} 番組`);
      console.log(`  - 合計: ${totalCount?.length || 0} 番組`);
    }

    console.log('\n🎉 データ復元完了！');
    console.log('\n📋 次のステップ:');
    console.log('  1. ブラウザで http://localhost:3000/pla を確認');
    console.log('  2. ブラウザで http://localhost:3000/lib を確認');
    console.log('  3. データ表示を確認');

  } catch (error) {
    console.error('💥 データ復元失敗:', error.message);
    process.exit(1);
  }
}

// Script execution
if (require.main === module) {
  restoreData();
}

module.exports = { restoreData };