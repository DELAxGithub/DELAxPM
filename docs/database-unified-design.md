# DELAxPM 統合データベース設計

## 概要

プラッと進捗すごろく（9段階）とリベラリー（10段階）を統合した、統一的な進捗管理システムのデータベース設計。

## 設計方針

### 1. 階層構造
```
Programs (番組)
  └── Series (シリーズ/シーズン)  
      └── Episodes (エピソード/各回)
```

### 2. 統合のメリット
- 番組種別を問わない統一UI
- 共通の進捗管理機能
- 横断的なレポート・分析
- チーム横断の協業支援

### 3. データベース統合戦略
- **柔軟なメタデータ**: JSON型でシステム固有データを保存
- **段階設定**: 番組ごとに進捗段階を設定可能
- **チーム管理**: メンバー・権限の統合管理

## テーブル設計

### 1. programs (番組マスタ)

統合システムのトップレベル。プラット、リベラリーなど番組を統合管理。

```sql
CREATE TABLE programs (
    id SERIAL PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,                    -- URL用短縮名 (platto, liberary, etc)
    name TEXT NOT NULL,                           -- 番組名
    type TEXT NOT NULL,                           -- 番組種別 (radio, web, tv, etc)
    description TEXT,                             -- 番組説明
    
    -- 進捗設定
    progress_stages JSONB NOT NULL DEFAULT '[]', -- 進捗段階定義 [{id, name, color}, ...]
    default_stage TEXT,                           -- 新エピソードのデフォルト段階
    
    -- チーム管理
    team_slug TEXT NOT NULL,                      -- チーム識別子 (platto, liberary)
    team_members JSONB DEFAULT '[]',              -- チームメンバー [{email, role}, ...]
    
    -- システム設定
    features JSONB DEFAULT '{}',                  -- 有効機能 {calendar: true, reports: true}
    settings JSONB DEFAULT '{}',                  -- システム設定
    metadata JSONB DEFAULT '{}',                  -- 拡張メタデータ
    
    -- 監査
    status TEXT DEFAULT 'active',                 -- active, inactive, archived
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by TEXT,
    updated_by TEXT
);
```

### 2. series (シリーズ管理)

番組内のシーズンやシリーズを管理。必要に応じて使用。

```sql
CREATE TABLE series (
    id SERIAL PRIMARY KEY,
    program_id INTEGER REFERENCES programs(id) ON DELETE CASCADE,
    
    slug TEXT NOT NULL,                           -- URL用短縮名
    name TEXT NOT NULL,                           -- シリーズ名
    season_number INTEGER DEFAULT 1,             -- シーズン番号
    description TEXT,                             -- シリーズ説明
    
    -- 期間管理
    start_date DATE,                              -- 開始日
    end_date DATE,                                -- 終了日
    target_episode_count INTEGER,                -- 予定エピソード数
    
    -- 設定
    settings JSONB DEFAULT '{}',                  -- シリーズ固有設定
    metadata JSONB DEFAULT '{}',                  -- 拡張メタデータ
    
    -- 監査
    status TEXT DEFAULT 'active',                 -- active, completed, cancelled
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(program_id, slug)
);
```

### 3. episodes (エピソード管理)

実際の制作単位。プラット・リベラリーの全エピソードを統合管理。

```sql
CREATE TABLE episodes (
    id SERIAL PRIMARY KEY,
    program_id INTEGER REFERENCES programs(id) ON DELETE CASCADE,
    series_id INTEGER REFERENCES series(id) ON DELETE SET NULL,
    
    -- 基本情報
    episode_number INTEGER NOT NULL,             -- エピソード番号
    title TEXT NOT NULL,                         -- タイトル
    subtitle TEXT,                               -- サブタイトル
    description TEXT,                            -- 説明
    
    -- 進捗管理
    current_stage TEXT NOT NULL,                 -- 現在の段階
    stage_history JSONB DEFAULT '[]',            -- 段階履歴 [{stage, date, user}, ...]
    
    -- スケジュール
    planned_air_date DATE,                       -- 予定放送日
    actual_air_date DATE,                        -- 実際放送日
    deadline_date DATE,                          -- 締切日
    recording_date DATE,                         -- 収録日
    
    -- 制作情報
    director TEXT,                               -- ディレクター
    cast_info JSONB DEFAULT '[]',                -- キャスト情報 [{name, role}, ...]
    staff_info JSONB DEFAULT '[]',               -- スタッフ情報 [{name, role}, ...]
    
    -- コンテンツ
    script_url TEXT,                             -- 台本URL
    materials JSONB DEFAULT '[]',                -- 素材情報 [{type, url, description}, ...]
    
    -- システム固有データ
    platto_data JSONB DEFAULT '{}',              -- プラット固有データ
    liberary_data JSONB DEFAULT '{}',            -- リベラリー固有データ
    
    -- メタデータ
    tags JSONB DEFAULT '[]',                     -- タグ [{name, color}, ...]
    notes TEXT,                                  -- 備考
    metadata JSONB DEFAULT '{}',                 -- 拡張メタデータ
    
    -- 監査
    status TEXT DEFAULT 'active',                -- active, completed, cancelled
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by TEXT,
    updated_by TEXT,
    
    UNIQUE(program_id, episode_number)
);
```

### 4. stage_templates (段階テンプレート)

よく使われる進捗段階の定義を保存。

```sql
CREATE TABLE stage_templates (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,                          -- テンプレート名
    description TEXT,                            -- 説明
    stages JSONB NOT NULL,                       -- 段階定義 [{id, name, color, order}, ...]
    category TEXT,                               -- カテゴリ (radio, web, general)
    is_system BOOLEAN DEFAULT false,             -- システム標準テンプレート
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

### 5. activity_logs (活動ログ)

すべての変更を記録。監査とレポート用。

```sql
CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    program_id INTEGER REFERENCES programs(id) ON DELETE CASCADE,
    series_id INTEGER REFERENCES series(id) ON DELETE SET NULL,
    episode_id INTEGER REFERENCES episodes(id) ON DELETE CASCADE,
    
    -- アクション
    action_type TEXT NOT NULL,                   -- created, updated, stage_changed, etc
    action_details JSONB DEFAULT '{}',           -- アクション詳細
    
    -- 変更内容
    before_data JSONB,                           -- 変更前データ
    after_data JSONB,                            -- 変更後データ
    
    -- コンテキスト
    user_email TEXT,                             -- 実行ユーザー
    user_agent TEXT,                             -- ユーザーエージェント
    ip_address INET,                             -- IPアドレス
    
    -- 監査
    created_at TIMESTAMPTZ DEFAULT now()
);
```

## 初期データ設計

### プラッと進捗すごろく（9段階）

```json
{
  "slug": "platto",
  "name": "プラッと進捗すごろく",
  "type": "radio",
  "team_slug": "platto",
  "progress_stages": [
    {"id": "casting", "name": "キャスティング中", "color": "#ff6b6b", "order": 1},
    {"id": "scenario", "name": "シナリオ制作中", "color": "#4ecdc4", "order": 2},
    {"id": "recording", "name": "収録準備中", "color": "#45b7d1", "order": 3},
    {"id": "recorded", "name": "収録済", "color": "#96ceb4", "order": 4},
    {"id": "editing", "name": "編集中", "color": "#feca57", "order": 5},
    {"id": "review", "name": "確認中", "color": "#ff9ff3", "order": 6},
    {"id": "approved", "name": "承認済", "color": "#54a0ff", "order": 7},
    {"id": "delivered", "name": "納品済", "color": "#5f27cd", "order": 8},
    {"id": "billed", "name": "請求済", "color": "#00d2d3", "order": 9}
  ],
  "default_stage": "casting"
}
```

### リベラリー（10段階）

```json
{
  "slug": "liberary",
  "name": "リベラリー",
  "type": "web",
  "team_slug": "liberary",
  "progress_stages": [
    {"id": "planning", "name": "企画中", "color": "#ff6b6b", "order": 1},
    {"id": "script_writing", "name": "台本作成中", "color": "#4ecdc4", "order": 2},
    {"id": "casting", "name": "キャスティング中", "color": "#45b7d1", "order": 3},
    {"id": "location", "name": "ロケハン中", "color": "#96ceb4", "order": 4},
    {"id": "shooting", "name": "撮影中", "color": "#feca57", "order": 5},
    {"id": "editing", "name": "編集中", "color": "#ff9ff3", "order": 6},
    {"id": "review", "name": "確認中", "color": "#54a0ff", "order": 7},
    {"id": "approved", "name": "承認済", "color": "#5f27cd", "order": 8},
    {"id": "published", "name": "公開済", "color": "#00d2d3", "order": 9},
    {"id": "delivered", "name": "完パケ納品", "color": "#2d98da", "order": 10}
  ],
  "default_stage": "planning"
}
```

## インデックス設計

```sql
-- 基本検索
CREATE INDEX idx_programs_slug ON programs(slug);
CREATE INDEX idx_programs_type_status ON programs(type, status);
CREATE INDEX idx_programs_team_slug ON programs(team_slug);

CREATE INDEX idx_series_program_id ON series(program_id);
CREATE INDEX idx_series_program_slug ON series(program_id, slug);

CREATE INDEX idx_episodes_program_id ON episodes(program_id);
CREATE INDEX idx_episodes_series_id ON episodes(series_id);
CREATE INDEX idx_episodes_stage ON episodes(current_stage);
CREATE INDEX idx_episodes_dates ON episodes(planned_air_date, actual_air_date);
CREATE INDEX idx_episodes_number ON episodes(program_id, episode_number);

-- 全文検索
CREATE INDEX idx_episodes_search ON episodes USING gin(to_tsvector('simple', title || ' ' || COALESCE(description, '')));

-- 活動ログ
CREATE INDEX idx_activity_logs_program ON activity_logs(program_id, created_at DESC);
CREATE INDEX idx_activity_logs_episode ON activity_logs(episode_id, created_at DESC);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_email, created_at DESC);
```

## RLS（Row Level Security）設計

```sql
-- Programs: チームメンバーのみアクセス可能
CREATE POLICY "programs_team_access" ON programs
  FOR ALL USING (
    auth.email() = ANY(
      SELECT jsonb_array_elements_text(team_members->'$[*].email')
    )
  );

-- Episodes: 番組のチームメンバーのみアクセス可能
CREATE POLICY "episodes_team_access" ON episodes
  FOR ALL USING (
    program_id IN (
      SELECT id FROM programs 
      WHERE auth.email() = ANY(
        SELECT jsonb_array_elements_text(team_members->'$[*].email')
      )
    )
  );

-- ゲストアクセス用（必要に応じて）
CREATE POLICY "guest_read_access" ON programs
  FOR SELECT USING (
    status = 'active' AND 
    (settings->>'guest_access')::boolean = true
  );
```

この設計により、以下が実現されます：

1. **統一性**: プラット・リベラリーを同じ構造で管理
2. **柔軟性**: 番組ごとに異なる段階・設定を定義可能
3. **拡張性**: 新しい番組タイプの追加が容易
4. **追跡性**: 全ての変更履歴を記録
5. **セキュリティ**: チーム別のアクセス制御