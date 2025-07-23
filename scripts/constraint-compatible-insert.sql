-- ==============================================================================
-- PMliberary制約対応版 - PMplattoデータ挿入スクリプト
-- ERROR対応: null value in column "title" violates not-null constraint
-- ==============================================================================
-- 
-- 前提: minimal-migration.sql でスキーマ拡張が完了済み
-- 対応: PMliberaryの既存制約（title NOT NULL等）に準拠
--
-- ==============================================================================

-- ステップ1: 移行前の安全チェック
-- ==============================================================================

-- 1.1 必須カラムの存在確認
DO $$ 
DECLARE
    required_columns text[] := ARRAY['project_type', 'source_system', 'migrated_at', 'legacy_id'];
    col text;
    column_exists boolean;
BEGIN
    FOREACH col IN ARRAY required_columns
    LOOP
        SELECT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'programs' 
            AND column_name = col
        ) INTO column_exists;
        
        IF NOT column_exists THEN
            RAISE EXCEPTION 'Required column % does not exist. Please run minimal-migration.sql first.', col;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'All required columns exist. Safe to proceed with data insertion.';
END $$;

-- 1.2 制約確認
SELECT 
    'Constraint Check' as check_phase,
    column_name,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'programs' 
AND column_name IN ('title', 'program_id', 'status')
ORDER BY column_name;

-- ステップ2: PMplattoデータの制約準拠挿入
-- ==============================================================================

-- 2.1 既存のPMplattoデータをクリア（重複防止）
DELETE FROM programs WHERE project_type = 'platto';

-- 2.2 PMplatto全32番組の制約準拠挿入
-- 注意: titleがNULLの場合は「未定」として挿入

INSERT INTO programs (
  program_id, title, subtitle, status, project_type,
  first_air_date, re_air_date, filming_date, complete_date,
  cast1, cast2, script_url, pr_text, notes,
  pr_completed, pr_80text, pr_200text,
  source_system, migrated_at, legacy_id,
  created_at, updated_at
) VALUES 
-- 1. つながる時代のわかりあえなさ (ID: 8)
('PLAT_008', 'つながる時代のわかりあえなさ', '@国立競技場', '放送済み', 'platto',
 '2025-03-08', '2025-05-05', '2025-02-07', '2025-02-28',
 '九段 理江', 'ドミニク・チェン', NULL, NULL, NULL,
 true, NULL, NULL, 'pmplatto', now(), '8',
 now(), '2025-05-09T09:23:27.613425+00:00'),

-- 2. スマホ越しの熱気、変容するアジア文化 (ID: 15)
('PLAT_015', 'スマホ越しの熱気、変容するアジア文化', '@上野アメ横', '完パケ納品', 'platto',
 '2025-07-02', NULL, '2025-06-09', '2025-06-27',
 '伊藤亜聖', 'もてスリム', 'https://docs.google.com/document/d/1ANIQyGg7oZKUkcrBCkXVgFXZtCwFHsWxQaz2KN-JzDo/edit?usp=sharing', NULL, 
 '中国・新興国のデジタル経済を分析する伊藤氏と、アジアのユースカルチャー現場を編むもてスリム氏。スマホ決済から最新音楽まで、日常の話題を入口に、データとリアルな声でアジアの「今」を読み解く。急成長の裏にある社会の変化、文化の変容とは？夏の最新トレンドも交え、未来の潮流を探る知的対話。',
 false, NULL, NULL, 'pmplatto', now(), '15',
 now(), '2025-06-27T05:40:09.85673+00:00'),

-- 3. 戦争と創造 (ID: 18)
('PLAT_018', '戦争と創造', '@上野公園', '編集中', 'platto',
 '2025-08-13', NULL, '2025-07-14', '2025-08-05',
 '岡本 裕一朗', '今日 マチ子', 'https://docs.google.com/document/d/13QGR0foGNiYtZtqjz370AHAw0fuwFeXTI-MHGS4_4Ss/edit?usp=sharing', NULL,
 '戦争を語ることは可能か？表現することで何が救われるのか？美術館カフェで、戦争と哲学の関係を探究する哲学者と、戦争や喪失を描く漫画家が対話。アートによる「証言」と記憶の継承、戦争を経験しない世代が表現することの倫理、そして未来への希望を静かに、力強く語り合う。',
 false, NULL, NULL, 'pmplatto', now(), '18',
 now(), '2025-07-14T20:26:00.966803+00:00'),

-- 4. 信じる者は"創造"する？ (ID: 17)
('PLAT_017', '信じる者は"創造"する？ ', '@麻布', 'MA中', 'platto',
 '2025-08-06', NULL, '2025-07-05', '2025-07-29',
 '柳澤田実', '関美和', 'https://docs.google.com/document/d/12OYfm6knU_azRGqcsQ-fnrj_iWad1TMTR54aq_tX30E/edit?usp=sharing', NULL,
 'なぜアメリカは世界を「創造」しようとするのか？『ゼロ・トゥ・ワン』翻訳者の関氏と、信念の心理を探る柳澤氏が、米国の成功哲学や価値観を解剖。その「信じる力」は世界平和に貢献するのか、新たな火種を生むのか？国際色豊かな麻布で語る、現代アメリカ思想と戦争/平和のリアル。',
 false, NULL, NULL, 'pmplatto', now(), '17',
 now(), '2025-07-18T17:09:41.352313+00:00'),

-- 5. 消費される教養の正体 (ID: 14)
('PLAT_014', '消費される教養の正体', '＠神保町', '放送済み', 'platto',
 '2025-06-11', NULL, '2025-05-21', '2025-06-03',
 '勅使川原真衣', 'レジー', 'https://docs.google.com/document/d/1z5VONnaiHAkbIYV5cyQFRZ2O7ZRx2S0uyAPBLoRhg8w/edit?usp=sharing', NULL,
 '学歴社会」の構造を解き明かす研究者と「ファスト教養」現象を分析する文化評論家が、現代社会における「価値」と「評価」の本質に迫る。企業の求める「能力」と教育の役割、SNS時代に広がる新たな教養観まで。6月の就活最盛期に考える、本当の「学び」とは何か。古典的教養から「10分で答えが欲しい」時代まで、社会の変遷を気さくに読み解く対話。',
 false, NULL, NULL, 'pmplatto', now(), '14',
 now(), '2025-06-12T02:37:48.330395+00:00'),

-- 6. 無限の可能性は実在する？ (ID: 16)
('PLAT_016', '無限の可能性は実在する？', '@池袋', '完パケ納品', 'platto',
 '2025-07-09', NULL, '2025-06-23', '2025-07-07',
 '今井翔太', '野村泰紀', 'https://docs.google.com/document/d/179UYsKGQtN1djWt6DAp9DLt8UJuOKqTqPMptmaueIJU/edit?usp=sharing', NULL,
 '私たちの宇宙は無数に存在する「多元宇宙」の一つなのか？AIが生み出す無限の可能性空間と宇宙物理学が示唆する「マルチバース」の驚くべき共通点を探ります。生成AIが作り出す「別の現実」と物理学が示唆する「並行宇宙」。SF映画のような壮大なテーマを、最先端研究者二人が身近な例を交えて語り合います。研究の最前線で見えてきた「可能性」と「実在」の境界線、そしてそれが私たちの日常に投げかける意外な問いかけとは。',
 false, NULL, NULL, 'pmplatto', now(), '16',
 now(), '2025-07-05T19:23:08.34844+00:00'),

-- 7. 世代を超える"つながり"の育て方 (ID: 20)
('PLAT_020', '世代を超える"つながり"の育て方', '@古民家カフェ', 'ロケハン前', 'platto',
 '2025-09-10', NULL, '2025-08-19', '2025-09-02',
 '飯島勝矢', '山本ふみこ', NULL, NULL,
 '人生100年"を豊かにする暮らしと「街」とは？ 古民家での新たな生活を実践する山本氏と、世代を超えたコミュニティデザインを研究する飯島氏が、古民家カフェの軒先で語り合う。伝統と革新が交差する新しい"つながりの形"、そして誰もが主役になれる地域づくりのヒントを探る。',
 false, NULL, NULL, 'pmplatto', now(), '20',
 now(), '2025-07-18T17:10:01.702792+00:00'),

-- 8-19. キャスティング中番組 (ID: 21-32) - titleを「番組企画中」として設定
('PLAT_021', '番組企画中', NULL, 'キャスティング中', 'platto',
 '2025-10-01', NULL, NULL, NULL,
 NULL, NULL, NULL, NULL, '[キャスティング中 - 詳細未定]',
 false, NULL, NULL, 'pmplatto', now(), '21',
 now(), '2025-03-23T23:59:53.67792+00:00'),

('PLAT_022', '番組企画中', NULL, 'キャスティング中', 'platto',
 '2025-10-08', NULL, NULL, NULL,
 NULL, NULL, NULL, NULL, '[キャスティング中 - 詳細未定]',
 false, NULL, NULL, 'pmplatto', now(), '22',
 now(), '2025-03-23T23:59:53.67792+00:00'),

('PLAT_023', '番組企画中', NULL, 'キャスティング中', 'platto',
 '2025-11-05', NULL, NULL, NULL,
 NULL, NULL, NULL, NULL, '[キャスティング中 - 詳細未定]',
 false, NULL, NULL, 'pmplatto', now(), '23',
 now(), '2025-03-23T23:59:53.67792+00:00'),

('PLAT_024', '番組企画中', NULL, 'キャスティング中', 'platto',
 '2025-11-12', NULL, NULL, NULL,
 NULL, NULL, NULL, NULL, '[キャスティング中 - 詳細未定]',
 false, NULL, NULL, 'pmplatto', now(), '24',
 now(), '2025-03-23T23:59:53.67792+00:00'),

('PLAT_025', '番組企画中', NULL, 'キャスティング中', 'platto',
 '2025-12-03', NULL, NULL, NULL,
 NULL, NULL, NULL, NULL, '[キャスティング中 - 詳細未定]',
 false, NULL, NULL, 'pmplatto', now(), '25',
 now(), '2025-03-23T23:59:53.67792+00:00'),

('PLAT_026', '番組企画中', NULL, 'キャスティング中', 'platto',
 '2025-12-10', NULL, NULL, NULL,
 NULL, NULL, NULL, NULL, '[キャスティング中 - 詳細未定]',
 false, NULL, NULL, 'pmplatto', now(), '26',
 now(), '2025-03-23T23:59:53.67792+00:00'),

('PLAT_027', '番組企画中', NULL, 'キャスティング中', 'platto',
 '2026-01-07', NULL, NULL, NULL,
 NULL, NULL, NULL, NULL, '[キャスティング中 - 詳細未定]',
 false, NULL, NULL, 'pmplatto', now(), '27',
 now(), '2025-03-23T23:59:53.67792+00:00'),

('PLAT_028', '番組企画中', NULL, 'キャスティング中', 'platto',
 '2026-01-14', NULL, NULL, NULL,
 NULL, NULL, NULL, NULL, '[キャスティング中 - 詳細未定]',
 false, NULL, NULL, 'pmplatto', now(), '28',
 now(), '2025-03-23T23:59:53.67792+00:00'),

('PLAT_029', '番組企画中', NULL, 'キャスティング中', 'platto',
 '2026-02-04', NULL, NULL, NULL,
 NULL, NULL, NULL, NULL, '[キャスティング中 - 詳細未定]',
 false, NULL, NULL, 'pmplatto', now(), '29',
 now(), '2025-03-23T23:59:53.67792+00:00'),

('PLAT_030', '番組企画中', NULL, 'キャスティング中', 'platto',
 '2026-02-11', NULL, NULL, NULL,
 NULL, NULL, NULL, NULL, '[キャスティング中 - 詳細未定]',
 false, NULL, NULL, 'pmplatto', now(), '30',
 now(), '2025-03-23T23:59:53.67792+00:00'),

('PLAT_031', '番組企画中', NULL, 'キャスティング中', 'platto',
 '2026-03-04', NULL, NULL, NULL,
 NULL, NULL, NULL, NULL, '[キャスティング中 - 詳細未定]',
 false, NULL, NULL, 'pmplatto', now(), '31',
 now(), '2025-03-23T23:59:53.67792+00:00'),

('PLAT_032', '番組企画中', NULL, 'キャスティング中', 'platto',
 '2026-03-11', NULL, NULL, NULL,
 NULL, NULL, NULL, NULL, '[キャスティング中 - 詳細未定]',
 false, NULL, NULL, 'pmplatto', now(), '32',
 now(), '2025-03-23T23:59:53.67792+00:00'),

-- 20. Z世代を知れば日本が見える? (ID: 3)
('PLAT_003', 'Z世代を知れば日本が見える?', '@宮下公園', '放送済み', 'platto',
 '2024-10-15', NULL, NULL, NULL,
 '舟津 昌平', '谷川 嘉浩', NULL, NULL, NULL,
 true, NULL, NULL, 'pmplatto', now(), '3',
 now(), '2025-03-29T21:54:18.587472+00:00'),

-- 21. 本を読めない？時代の読書論 (ID: 4)
('PLAT_004', '本を読めない？時代の読書論', '＠丸の内', '放送済み', 'platto',
 '2024-11-05', NULL, NULL, NULL,
 '三宅 香帆', '阿部 公彦', NULL, NULL, NULL,
 true, NULL, NULL, 'pmplatto', now(), '4',
 now(), '2025-03-29T21:54:24.63419+00:00'),

-- 22. 後から変更 (ID: 1)
('PLAT_001', '後から変更', '@日比谷公園', '放送済み', 'platto',
 '2024-07-09', NULL, NULL, NULL,
 'チュ・ヒチョル', '三牧 聖子', NULL, NULL, NULL,
 true, NULL, NULL, 'pmplatto', now(), '1',
 now(), '2025-03-29T21:54:36.964864+00:00'),

-- 23. 胃袋の記憶を辿る旅 (ID: 5)
('PLAT_005', '胃袋の記憶を辿る旅', '@日比谷公園', '放送済み', 'platto',
 '2024-12-17', NULL, NULL, NULL,
 '稲田 俊輔', '湯澤 規子', NULL, NULL, NULL,
 true, NULL, NULL, 'pmplatto', now(), '5',
 now(), '2025-03-29T21:54:39.703303+00:00'),

-- 24. 近くて遠い？大国のリアル (ID: 6)
('PLAT_006', '近くて遠い？大国のリアル', '@明治神宮外苑', '放送済み', 'platto',
 '2025-01-14', NULL, NULL, NULL,
 '小泉 悠', '岡本 隆司', NULL, NULL, NULL,
 true, NULL, NULL, 'pmplatto', now(), '6',
 now(), '2025-03-29T21:54:42.714626+00:00'),

-- 25. 後から変更 (ID: 2)
('PLAT_002', '後から変更', '@大手町', '放送済み', 'platto',
 '2024-07-23', NULL, NULL, NULL,
 '岩尾 俊兵', '大澤 聡', NULL, NULL, NULL,
 true, NULL, NULL, 'pmplatto', now(), '2',
 now(), '2025-03-29T22:24:07.241232+00:00'),

-- 26. シン・アメリカ時代の虚構とリアル (ID: 7)
('PLAT_007', 'シン・アメリカ時代の虚構とリアル', '@代々木公園', '放送済み', 'platto',
 '2025-02-16', NULL, NULL, NULL,
 '三牧 聖子', '小川 哲', NULL, NULL, NULL,
 true, NULL, NULL, 'pmplatto', now(), '7',
 now(), '2025-03-29T22:24:09.54044+00:00'),

-- 27. 人生を変える為にルールを変える？ (ID: 13)
('PLAT_013', '人生を変える為にルールを変える？', '@新宿中央公園', '完パケ納品', 'platto',
 '2025-06-04', NULL, '2025-04-22', '2025-05-27',
 '米光 一成', '水野 祐', NULL, NULL,
 'ゲームと法律。一見かけ離れた世界をつなぐのは、ゲーミフィケーションというルール設計の妙。『ぷよぷよ』を生んだゲームクリエイターと、パブリック法のイノベーターが、遊びと規範の交点を探る。人々が自発的に従う仕組みをヒントに、これからの社会が求める新たな"ルール"を考察する',
 false, '初夏の新宿公園の昼下がり、ゲーム作家と法律家による異色のルール談義が始まる。そもそもルールとは？遊びの精神と秩序を守る規律…、その狭間に何がある？人生もゲーム？',
 '様々なルールの看板が立ち並ぶ公園という公共空間で、ゲーム作家・米光一成と法律家・水野祐が語り合う。テーマはルール。秩序を守る為の決まりは時に人々の心まで縛る。「してはいけない」より「できること」を増やす、そんなルール作りは可能か?ゲームが持つ「遊び心」と法律の「枠組み」が交わる時、硬直化した思考が溶け出す。ルールを守るだけでなく楽しむものにする秘訣は？新しい民主主義にまで及ぶ、知的冒険の50分。',
 'pmplatto', now(), '13',
 now(), '2025-05-30T14:11:15.020373+00:00'),

-- 28. 資本主義の余白は今どこに？ (ID: 9)
('PLAT_009', '資本主義の余白は今どこに？', '@日本橋兜町', '放送済み', 'platto',
 '2025-04-02', NULL, '2025-03-07', '2025-03-25',
 '大川内 直子', '星野 太', 'https://docs.google.com/document/d/1dkQ3hbptrPxD6GL0c9ufz0apviw18lyz3sDIT2uwy8I/edit?usp=sharing', NULL, NULL,
 true, '数字に追われる現代人…。金融の街・兜町で文化人類学者と美学者が、その閉塞感からの出口を考えた。異ジャンルの知が街角で出会い、プラッと始める新感覚教養トーク。',
 '3月初旬昼下がりの日本橋兜町。文化人類学者で起業家の大川内直子さんと美学者の星野太さんが、日々数字をめぐる攻防が続く街で資本主義社会の「余白」を探す旅に出た。場によって異なる時間感覚、成長を強迫観念にしない術、アートの商品化をどう考える？数字にならない価値を求めてフィールドワークの視点と美学の理論が交わる50分。時代の風を感じてプラッと始まる二人の対話に聞き耳たててください。あなたもプラッと。',
 'pmplatto', now(), '9',
 now(), '2025-04-02T17:04:16.617033+00:00'),

-- 29. 冷笑から哄笑へ　明るい自分探しの旅 (ID: 12)
('PLAT_012', '冷笑から哄笑へ　明るい自分探しの旅', '＠哲学堂公園', '完パケ納品', 'platto',
 '2025-05-14', NULL, '2025-04-18', '2025-05-07',
 'しんめいP', '納富 信留', 'https://docs.google.com/document/d/1ALvFqJW39AbqBcOroQinR5Q1Q8jKBDQsjCnmH9z-k-0/edit?usp=sharing', NULL,
 '東洋哲学の読書本でベストセラーを記録した東大卒ニートと、現代にも通底する形而上学を探究する西洋哲学研究者。東西の思索を横断する二人が、古代の叡智（老荘やストア哲学など*を頼りに、新生活の季節に自分の居場所探しの一助となる？しんめいPが大阪から新幹線',
 true, '「本物」と「偽物」の境界線って？心地よい日差しの中、哲学堂公園で交わされる緩やかな対話から自分自身と向き合う知恵が見えてくる？笑いと共感が生む新たな思考の冒険。',
 '初夏を思わせる陽気の４月半ばのお昼時の中野哲学堂公園。東洋哲学の愛好家でありタレントでもあるしんめいPと西洋古代哲学研究者・納富信留による哲学対話。本物と偽物という古代ギリシアの二分法が現代の「自分探し」にまで影響を与えている？境界線が溶ける中見えてくる真理から「知らんけど」の効用まで、「わからない」ことを認めることから始まる思索の旅。対話から生まれる「いい感じ」の可能性とは？あなたもプラッと。',
 'pmplatto', now(), '12',
 now(), '2025-05-12T12:39:24.062677+00:00'),

-- 30. ファッションは個性？同調？ (ID: 10)
('PLAT_010', 'ファッションは個性？同調？', '＠原宿', '放送済み', 'platto',
 '2025-04-09', NULL, '2025-03-21', '2025-04-01',
 '平芳 裕子', 'トミヤマ ユキコ', 'https://docs.google.com/document/d/1HWlJtA7RzpdtJ3WNc36_jSOCe5aZ_AMN-oYiZE7B-Ic/edit?usp=sharing', NULL,
 'マンガに描かれる装いと、ファッションが生み出す物語。記号論や身体文化論を通じて、衣替えの季節に"着替える"行為の社会的意味を問い直す。マンガ研究とファッション文化論が交差し、装いと自己表現の新たな関係が浮かび上がる。',
 true, '装うことの意味とは？原宿・キャットストリートでファッション研究者とマンガ研究者が「個性」と「同調」の狭間を語る。異ジャンルの知が街角で出会う、新感覚教養トーク。',
 '3月下旬の陽光まぶしい原宿。ファッション研究者の平芳裕子さんとマンガ研究者のトミヤマユキコさんが流行の最前線キャットストリートで服装と自己表現の関係を考える。特別から日常へと変わる装いの価値、古着の魅力、SNS時代の個性とは？時代の変化の中、装うことの意味を問い直す二人の対話。異なる視点が交差する50分。街の風を感じて、プラッと始まる対話に耳を傾けてください。何かが見つかります。あなたもプラッと。',
 'pmplatto', now(), '10',
 now(), '2025-05-09T09:23:23.856496+00:00'),

-- 31. 古くて新しい巡礼の話 (ID: 11)
('PLAT_011', '古くて新しい巡礼の話', '@秋葉原', '放送済み', 'platto',
 '2025-05-07', NULL, '2025-03-29', '2025-04-28',
 '岡本 亮輔', 'サンキュータツオ', 'https://docs.google.com/document/d/1SiJav6pvD8M1mqvjMc0GfPuRzxhufgM_GyqF8_U_NLo/edit?usp=sharing', NULL,
 '「巡礼の新しいカタチ@秋葉原　宗教社会学者 岡本亮輔×アニメ・文学芸人 サンキュータツオ」 伝統的な聖地からアニメの舞台まで、人はなぜ「巡礼」に惹かれるのか？宗教社会学のコンヴァージョン理論とサブカル文脈が交差する先に、コンテンツツーリズムとしての現代巡礼の姿が浮かび上がる。GWの人流に映る日本人と「聖なるもの」の関係とは？',
 true, '宗教の聖地からアニメの舞台まで、「巡礼」の本質って何？秋葉原を歩きながら見えてくるのは？聖なるものを求める旅と現代の信仰の形、変わりゆく街の記憶を紐解く対話。',
 '3月下旬の冷たい雨の秋葉原。宗教学者・岡本亮輔と芸人・言語学者のサンキュータツオが「聖地巡礼」の意味を探る散策へ。闇市から電気街、オタクの聖地へと変貌した街を歩きながら、宗教と言語の視点から日本人と「信仰」の関係を語り合う。人はなぜ特別な場所に惹かれる？パワースポットブームの本質、「好き」が「信仰」に変わる瞬間とは？言葉の変化に映る現代社会の断面異なる視点が交差する50分へ、あなたもプラッと。',
 'pmplatto', now(), '11',
 now(), '2025-05-09T09:24:21.446357+00:00'),

-- 32. デジタルで変容する存在の境界 (ID: 19)
('PLAT_019', 'デジタルで変容する存在の境界', '@六本木とか上野', '収録準備中', 'platto',
 '2025-09-03', NULL, '2025-07-24', '2025-08-26',
 '市原えつこ', 'comugi', NULL, NULL,
 '「死後も存在し続ける」とはどういうことか。気鋭の美術家・市原えつこは「デジタル・シャーマン」プロジェクトで故人の記憶をAIロボットに宿す作品を発表し国際的注目を集める。対するcomugiはVTuberやNFTなどWeb3技術を駆使し、現実を超えてアバターとして「生きる」活動を展開中。テクノロジー最前線の六本木で、現代人のデジタルアイデンティティから「魂のバックアップ」まで、物理と仮想の境界線上で揺れ動く「存在」の概念を掘り下げる。SNSで複数の人格を持つ若者や、デジタル遺品に悩む家族など、身近な例から人間存在の本質と未来を考える知的冒険。',
 false, NULL, NULL, 'pmplatto', now(), '19',
 now(), '2025-07-17T11:45:17.269479+00:00');

-- ステップ3: 移行結果の確認
-- ==============================================================================

-- 3.1 移行完了確認
SELECT 
  'PMplatto Data Migration Complete' as status,
  COUNT(*) as inserted_records
FROM programs 
WHERE project_type = 'platto';

-- 3.2 全体データ状況確認  
SELECT 
  project_type,
  COUNT(*) as record_count,
  MIN(created_at) as oldest_record,
  MAX(updated_at) as latest_update
FROM programs 
GROUP BY project_type
ORDER BY project_type;

-- 3.3 番組ステータス別集計
SELECT 
  status,
  COUNT(*) as count
FROM programs 
WHERE project_type = 'platto'
GROUP BY status
ORDER BY count DESC;

-- 3.4 title制約対応確認
SELECT 
  'Title Constraint Check' as check_name,
  COUNT(CASE WHEN title IS NULL THEN 1 END) as null_titles,
  COUNT(CASE WHEN title = '番組企画中' THEN 1 END) as planning_titles,
  COUNT(CASE WHEN title IS NOT NULL AND title != '番組企画中' THEN 1 END) as named_titles
FROM programs 
WHERE project_type = 'platto';

-- 3.5 サンプルデータ確認
SELECT 
  program_id,
  title,
  status,
  first_air_date,
  cast1,
  cast2
FROM programs 
WHERE project_type = 'platto'
ORDER BY 
  CASE 
    WHEN title = '番組企画中' THEN 2 
    ELSE 1 
  END,
  first_air_date
LIMIT 10;

-- ==============================================================================
-- 移行完了
-- ==============================================================================

SELECT 'DELA×PM統合システム - NOT NULL制約対応版移行が完了しました！' as final_status;