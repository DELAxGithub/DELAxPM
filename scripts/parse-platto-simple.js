#!/usr/bin/env node

/**
 * プラット実データ簡易パーサー
 * SQLの各レコードを手動で解析し、統合スキーマ用のSQLを生成
 */

const fs = require('fs');
const path = require('path');

// プラットの実データ（手動で抽出）
const plattoData = [
  { id: '1', program_id: '001', first_air_date: '2024-07-09', filming_date: null, complete_date: null, title: '後から変更', subtitle: '@日比谷公園', status: '放送済み', cast1: 'チュ・ヒチョル', cast2: '三牧 聖子', notes: null, script_url: null, pr_80text: null, pr_200text: null, re_air_date: null, pr_completed: 'true', pr_due_date: null },
  
  { id: '2', program_id: '002', first_air_date: '2024-07-23', filming_date: null, complete_date: null, title: '後から変更', subtitle: '@大手町', status: '放送済み', cast1: '岩尾 俊兵', cast2: '大澤 聡', notes: null, script_url: null, pr_80text: null, pr_200text: null, re_air_date: null, pr_completed: 'true', pr_due_date: null },
  
  { id: '3', program_id: '003', first_air_date: '2024-10-15', filming_date: null, complete_date: null, title: 'Z世代を知れば日本が見える?', subtitle: '@宮下公園', status: '放送済み', cast1: '舟津 昌平', cast2: '谷川 嘉浩', notes: null, script_url: null, pr_80text: null, pr_200text: null, re_air_date: null, pr_completed: 'true', pr_due_date: null },
  
  { id: '4', program_id: '004', first_air_date: '2024-11-05', filming_date: null, complete_date: null, title: '本を読めない？時代の読書論', subtitle: '＠丸の内', status: '放送済み', cast1: '三宅 香帆', cast2: '阿部 公彦', notes: null, script_url: null, pr_80text: null, pr_200text: null, re_air_date: null, pr_completed: 'true', pr_due_date: null },
  
  { id: '5', program_id: '005', first_air_date: '2024-12-17', filming_date: null, complete_date: null, title: '胃袋の記憶を辿る旅', subtitle: '@日比谷公園', status: '放送済み', cast1: '稲田 俊輔', cast2: '湯澤 規子', notes: null, script_url: null, pr_80text: null, pr_200text: null, re_air_date: null, pr_completed: 'true', pr_due_date: null },
  
  { id: '6', program_id: '006', first_air_date: '2025-01-14', filming_date: null, complete_date: null, title: '近くて遠い？大国のリアル', subtitle: '@明治神宮外苑', status: '放送済み', cast1: '小泉 悠', cast2: '岡本 隆司', notes: null, script_url: null, pr_80text: null, pr_200text: null, re_air_date: null, pr_completed: 'true', pr_due_date: null },
  
  { id: '7', program_id: '007', first_air_date: '2025-02-16', filming_date: null, complete_date: null, title: 'シン・アメリカ時代の虚構とリアル', subtitle: '@代々木公園', status: '放送済み', cast1: '三牧 聖子', cast2: '小川 哲', notes: null, script_url: null, pr_80text: null, pr_200text: null, re_air_date: null, pr_completed: 'true', pr_due_date: null },
  
  { id: '8', program_id: '008', first_air_date: '2025-03-08', filming_date: '2025-02-07', complete_date: '2025-02-28', title: 'つながる時代のわかりあえなさ', subtitle: '@国立競技場', status: '放送済み', cast1: '九段 理江', cast2: 'ドミニク・チェン', notes: null, script_url: null, pr_80text: null, pr_200text: null, re_air_date: '2025-05-05', pr_completed: 'true', pr_due_date: null },
  
  { id: '9', program_id: '009', first_air_date: '2025-04-02', filming_date: '2025-03-07', complete_date: '2025-03-25', title: '資本主義の余白は今どこに？', subtitle: '@日本橋兜町', status: '放送済み', cast1: '大川内 直子', cast2: '星野 太', notes: null, script_url: 'https://docs.google.com/document/d/1dkQ3hbptrPxD6GL0c9ufz0apviw18lyz3sDIT2uwy8I/edit?usp=sharing', pr_80text: '数字に追われる現代人…。金融の街・兜町で文化人類学者と美学者が、その閉塞感からの出口を考えた。異ジャンルの知が街角で出会い、プラッと始める新感覚教養トーク。', pr_200text: '3月初旬昼下がりの日本橋兜町。文化人類学者で起業家の大川内直子さんと美学者の星野太さんが、日々数字をめぐる攻防が続く街で資本主義社会の「余白」を探す旅に出た。場によって異なる時間感覚、成長を強迫観念にしない術、アートの商品化をどう考える？数字にならない価値を求めてフィールドワークの視点と美学の理論が交わる50分。時代の風を感じてプラッと始まる二人の対話に聞き耳たててください。あなたもプラッと。', re_air_date: null, pr_completed: 'true', pr_due_date: null },
  
  { id: '10', program_id: '010', first_air_date: '2025-04-09', filming_date: '2025-03-21', complete_date: '2025-04-01', title: 'ファッションは個性？同調？', subtitle: '＠原宿', status: '放送済み', cast1: '平芳 裕子', cast2: 'トミヤマ ユキコ', notes: 'マンガに描かれる装いと、ファッションが生み出す物語。記号論や身体文化論を通じて、衣替えの季節に"着替える"行為の社会的意味を問い直す。マンガ研究とファッション文化論が交差し、装いと自己表現の新たな関係が浮かび上がる。', script_url: 'https://docs.google.com/document/d/1HWlJtA7RzpdtJ3WNc36_jSOCe5aZ_AMN-oYiZE7B-Ic/edit?usp=sharing', pr_80text: '装うことの意味とは？原宿・キャットストリートでファッション研究者とマンガ研究者が「個性」と「同調」の狭間を語る。異ジャンルの知が街角で出会う、新感覚教養トーク。', pr_200text: '3月下旬の陽光まぶしい原宿。ファッション研究者の平芳裕子さんとマンガ研究者のトミヤマユキコさんが流行の最前線キャットストリートで服装と自己表現の関係を考える。特別から日常へと変わる装いの価値、古着の魅力、SNS時代の個性とは？時代の変化の中、装うことの意味を問い直す二人の対話。異なる視点が交差する50分。街の風を感じて、プラッと始まる対話に耳を傾けてください。何かが見つかります。あなたもプラッと。', re_air_date: null, pr_completed: 'true', pr_due_date: '2025-03-25' },
  
  // 追加のサンプルデータ（代表的なもの）
  { id: '11', program_id: '011', first_air_date: '2025-05-07', filming_date: '2025-03-29', complete_date: '2025-04-28', title: '古くて新しい巡礼の話', subtitle: '@秋葉原', status: '放送済み', cast1: '岡本 亮輔', cast2: 'サンキュータツオ', notes: '「巡礼の新しいカタチ@秋葉原　宗教社会学者 岡本亮輔×アニメ・文学芸人 サンキュータツオ」', script_url: 'https://docs.google.com/document/d/1SiJav6pvD8M1mqvjMc0GfPuRzxhufgM_GyqF8_U_NLo/edit?usp=sharing', pr_80text: '宗教の聖地からアニメの舞台まで、「巡礼」の本質って何？秋葉原を歩きながら見えてくるのは？聖なるものを求める旅と現代の信仰の形、変わりゆく街の記憶を紐解く対話。', pr_200text: '3月下旬の冷たい雨の秋葉原。宗教学者・岡本亮輔と芸人・言語学者のサンキュータツオが「聖地巡礼」の意味を探る散策へ。', re_air_date: null, pr_completed: 'true', pr_due_date: null },
  
  { id: '12', program_id: '012', first_air_date: '2025-05-14', filming_date: '2025-04-18', complete_date: '2025-05-07', title: '冷笑から哄笑へ　明るい自分探しの旅', subtitle: '＠哲学堂公園', status: '完パケ納品', cast1: 'しんめいP', cast2: '納富 信留', notes: '東洋哲学の読書本でベストセラーを記録した東大卒ニートと、現代にも通底する形而上学を探究する西洋哲学研究者。', script_url: 'https://docs.google.com/document/d/1ALvFqJW39AbqBcOroQinR5Q1Q8jKBDQsjCnmH9z-k-0/edit?usp=sharing', pr_80text: '「本物」と「偽物」の境界線って？心地よい日差しの中、哲学堂公園で交わされる緩やかな対話から自分自身と向き合う知恵が見えてくる？笑いと共感が生む新たな思考の冒険。', pr_200text: '初夏を思わせる陽気の４月半ばのお昼時の中野哲学堂公園。東洋哲学の愛好家でありタレントでもあるしんめいPと西洋古代哲学研究者・納富信留による哲学対話。', re_air_date: null, pr_completed: 'true', pr_due_date: null },
  
  // 未来のエピソード（キャスティング中）
  { id: '21', program_id: '021', first_air_date: '2025-10-01', filming_date: null, complete_date: null, title: null, subtitle: null, status: 'キャスティング中', cast1: null, cast2: null, notes: null, script_url: null, pr_80text: null, pr_200text: null, re_air_date: null, pr_completed: 'false', pr_due_date: null },
  
  { id: '22', program_id: '022', first_air_date: '2025-10-08', filming_date: null, complete_date: null, title: null, subtitle: null, status: 'キャスティング中', cast1: null, cast2: null, notes: null, script_url: null, pr_80text: null, pr_200text: null, re_air_date: null, pr_completed: 'false', pr_due_date: null }
];

// 状態マッピング（旧 → 新）
const statusMapping = {
  'キャスティング中': 'casting',
  'シナリオ制作中': 'scenario',
  '収録準備中': 'recording_prep',
  'ロケハン前': 'recording_prep',
  '収録済み': 'recorded',
  '編集中': 'editing',
  'MA中': 'editing',
  '確認中': 'review',
  '承認済み': 'approved',
  '放送済み': 'delivered',
  '完パケ納品': 'delivered',
  '請求済み': 'billed'
};

function escapeSQL(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  return `'${value.toString().replace(/'/g, "''")}'`;
}

function convertToEpisodeData(plattoRecord) {
  const newStage = statusMapping[plattoRecord.status] || 'casting';
  
  return {
    program_id: 1, // プラットのprogram_id
    episode_number: parseInt(plattoRecord.program_id),
    title: plattoRecord.title || `エピソード ${plattoRecord.program_id}`,
    subtitle: plattoRecord.subtitle,
    description: plattoRecord.notes,
    current_stage: newStage,
    stage_history: JSON.stringify([{
      stage: newStage,
      date: new Date().toISOString().split('T')[0],
      user: 'platto_import',
      notes: '実データインポート'
    }]),
    planned_air_date: plattoRecord.first_air_date,
    actual_air_date: plattoRecord.re_air_date,
    recording_date: plattoRecord.filming_date,
    director: null,
    script_url: plattoRecord.script_url,
    notes: plattoRecord.notes,
    platto_data: JSON.stringify({
      cast1: plattoRecord.cast1,
      cast2: plattoRecord.cast2,
      pr_text: plattoRecord.pr_80text,
      pr_200text: plattoRecord.pr_200text,
      pr_completed: plattoRecord.pr_completed === 'true',
      pr_due_date: plattoRecord.pr_due_date,
      legacy_id: plattoRecord.id,
      legacy_program_id: plattoRecord.program_id
    }),
    metadata: JSON.stringify({
      imported_from: 'platto_legacy',
      import_date: new Date().toISOString()
    }),
    created_by: 'platto_import',
    status: 'active'
  };
}

function generateMigrationSQL(episodes) {
  let sql = `-- ============================================================================
-- プラット実データ投入マイグレーション
-- 作成日: ${new Date().toISOString().split('T')[0]}
-- 目的: 旧プラットシステムの実データを統合スキーマに投入
-- ============================================================================

-- 既存のサンプルプラットエピソードを削除
DELETE FROM episodes WHERE program_id = 1 AND created_by = 'system_setup';

-- プラット実データを投入
INSERT INTO episodes (
    program_id,
    episode_number,
    title,
    subtitle,
    description,
    current_stage,
    stage_history,
    planned_air_date,
    actual_air_date,
    recording_date,
    director,
    script_url,
    notes,
    platto_data,
    metadata,
    created_by,
    status
) VALUES
`;

  const values = episodes.map(ep => {
    return `(
    ${ep.program_id},
    ${ep.episode_number},
    ${escapeSQL(ep.title)},
    ${escapeSQL(ep.subtitle)},
    ${escapeSQL(ep.description)},
    '${ep.current_stage}',
    '${ep.stage_history}'::jsonb,
    ${ep.planned_air_date ? `'${ep.planned_air_date}'` : 'NULL'},
    ${ep.actual_air_date ? `'${ep.actual_air_date}'` : 'NULL'},
    ${ep.recording_date ? `'${ep.recording_date}'` : 'NULL'},
    ${ep.director ? `'${ep.director}'` : 'NULL'},
    ${escapeSQL(ep.script_url)},
    ${escapeSQL(ep.notes)},
    '${ep.platto_data.replace(/'/g, "''")}'::jsonb,
    '${ep.metadata.replace(/'/g, "''")}'::jsonb,
    '${ep.created_by}',
    '${ep.status}'
)`;
  });

  sql += values.join(',\n');
  sql += ';\n\n-- 投入確認\n';
  sql += `SELECT 
    COUNT(*) as imported_episodes,
    current_stage,
    COUNT(*) as stage_count
FROM episodes 
WHERE program_id = 1 AND created_by = 'platto_import'
GROUP BY current_stage
ORDER BY stage_count DESC;`;

  return sql;
}

// 変換実行
const episodes = plattoData.map(record => convertToEpisodeData(record));

// マイグレーションSQL生成
const migrationSQL = generateMigrationSQL(episodes);

// ファイルに出力
const outputFile = path.join(process.cwd(), 'supabase', 'migrations', '20250728160000_import_platto_data.sql');
fs.writeFileSync(outputFile, migrationSQL, 'utf8');

console.log(`✅ プラット実データマイグレーション作成完了: ${outputFile}`);
console.log(`📊 変換されたエピソード数: ${episodes.length}`);

// 状態別統計
const stageStats = episodes.reduce((acc, ep) => {
  acc[ep.current_stage] = (acc[ep.current_stage] || 0) + 1;
  return acc;
}, {});

console.log('📈 段階別統計:');
Object.entries(stageStats).forEach(([stage, count]) => {
  console.log(`   ${stage}: ${count}件`);
});