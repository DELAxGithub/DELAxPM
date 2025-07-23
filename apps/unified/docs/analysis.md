# PMplattoとPMliberaryの詳細比較分析

## 1. 機能比較表

### 共通機能
| 機能 | PMplatto | PMliberary | 統合版での実装方針 |
|------|----------|-----------|-------------------|
| 認証システム | ✅ | ✅ | Supabase Auth継続使用 |
| プログラム管理 | ✅ | ✅ | 両方の機能を統合 |
| カレンダータスク | ✅ | ✅ | PMliberaryの拡張版を採用 |
| Kanbanボード | ✅ | ✅ | 両形式をサポート |
| 週次レビュー機能 | ✅ | ✅ | 共通機能として維持 |

### PMplatto固有機能
| 機能 | 概要 | 統合版での扱い |
|------|------|---------------|
| 9段階ステータス管理 | キャスティング中 → 放送済み | オプションとして提供 |
| PR管理機能 | pr_completed, pr_due_date | 統合版に追加 |
| プログラム詳細モーダル | 番組詳細表示・編集 | 機能統合 |

### PMliberary固有機能
| 機能 | 概要 | 統合版での扱い |
|------|------|---------------|
| **10段階エピソード管理** | 台本作成中 → 完パケ納品 | **メイン機能として採用** |
| **ダッシュボード機能** | チーム共有情報表示 | **新機能として追加** |
| エピソードKanbanボード | エピソード専用ボード | 統合Kanbanに組み込み |
| チームイベント管理 | 会議・収録スケジュール | カレンダー機能を拡張 |
| ステータス履歴追跡 | 変更履歴の記録 | 監査機能として採用 |

## 2. データベーススキーマの差分

### 共通テーブル
- **programs**: 基本構造は同一、PMliberaryで拡張
- **calendar_tasks**: PMliberaryでチームイベント機能追加

### PMliberary追加テーブル
| テーブル名 | 用途 | 重要度 |
|-----------|------|-------|
| **episodes** | エピソード管理のメインテーブル | 高 |
| **episode_statuses** | 10段階ステータスマスター | 高 |
| **status_history** | ステータス変更履歴 | 中 |
| **team_dashboard** | チーム共有ダッシュボード | 中 |

### スキーマ変更点

#### programsテーブル拡張（PMliberary）
```sql
-- PMliberaryで追加されたカラム
ALTER TABLE programs ADD COLUMN series_name text;
ALTER TABLE programs ADD COLUMN series_type text;
ALTER TABLE programs ADD COLUMN season integer;
ALTER TABLE programs ADD COLUMN total_episodes integer;

-- PMplattoで追加されたカラム
ALTER TABLE programs ADD COLUMN pr_completed boolean;
ALTER TABLE programs ADD COLUMN pr_due_date date;
```

#### calendar_tasksテーブル拡張（PMliberary）
```sql
-- チームイベント対応
ALTER TABLE calendar_tasks ADD COLUMN meeting_url text;
ALTER TABLE calendar_tasks ADD COLUMN description text;
ALTER TABLE calendar_tasks ADD COLUMN is_team_event boolean;
```

## 3. 共通化可能なコンポーネント一覧

### UI コンポーネント
| コンポーネント | PMplatto | PMliberary | 統合方針 |
|---------------|----------|-----------|----------|
| **Layout.tsx** | ✅ | ✅ | PMliberaryベースで統合 |
| **Header.tsx** | ✅ | ✅ | デザイン統一 |
| **Sidebar.tsx** | ✅ | ✅ | ナビゲーション統合 |
| **LoginPage.tsx** | ✅ | ✅ | 共通化 |
| **Calendar.tsx** | ✅ | ✅ | PMlibrary版採用 |

### ビジネスロジック
| コンポーネント | 特徴 | 統合方針 |
|---------------|------|----------|
| **ProgramContext** | プログラム状態管理 | 両方の機能をマージ |
| **AuthContext** | 認証状態管理 | 完全に共通化 |
| **CalendarTaskContext** | カレンダー管理 | PMliberary版を基準 |

### 新規追加が必要なコンポーネント
- **EpisodeContext**: エピソード管理（PMliberaryから）
- **DashboardWidgets**: ダッシュボード機能群（PMliberaryから）
- **StatusBadge**: ステータス表示（PMliberaryから）

## 4. 各プロジェクト固有機能の詳細

### PMplatto固有機能

#### 9段階ステータス管理システム
```typescript
export type ProgramStatus =
  | 'キャスティング中'    // 1
  | '日程調整中'         // 2
  | 'ロケハン前'         // 3
  | '収録準備中'         // 4
  | '編集中'            // 5
  | '試写中'            // 6
  | 'MA中'             // 7
  | '完パケ納品'         // 8
  | '放送済み';          // 9
```

#### PR管理機能
- `pr_completed`: PR完了フラグ
- `pr_due_date`: PR締切日
- `pr_80text`, `pr_200text`: PR文章管理

### PMliberary固有機能

#### 10段階エピソード管理システム
```typescript
export type EpisodeStatus = 
  | '台本作成中'     // 1
  | '素材準備'       // 2
  | '素材確定'       // 3
  | '編集中'         // 4
  | '試写1'          // 5
  | '修正1'          // 6
  | 'MA中'          // 7
  | '初稿完成'       // 8
  | '修正中'         // 9
  | '完パケ納品';     // 10
```

#### ダッシュボード機能
- **MemoWidget**: チーム共有メモ
- **QuickLinksWidget**: クイックリンク集
- **TasksWidget**: 共有タスクリスト
- **ScheduleWidget**: スケジュール概要

#### チームイベント管理
- **全体会議**: meeting_url付きイベント
- **制作会議**: meeting_url付きイベント
- **スタジオ収録**: 物理的な収録イベント

## 5. Supabase機能利用比較

### 共通利用機能
| 機能 | PMplatto | PMliberary | 活用レベル |
|------|----------|-----------|-----------|
| **Auth** | ✅ | ✅ | 基本認証 |
| **Database** | ✅ | ✅ | フル活用 |
| **RLS (Row Level Security)** | ✅ | ✅ | 完全実装 |

### PMliberary新規活用機能
| 機能 | 用途 | 実装詳細 |
|------|------|----------|
| **Database Triggers** | ステータス変更履歴自動記録 | `record_status_change()` |
| **Database Views** | エピソード詳細表示最適化 | `episode_details` view |
| **Complex Constraints** | データ整合性保証 | CHECK制約、外部キー |
| **JSON型活用** | ダッシュボードコンテンツ格納 | `team_dashboard.content` |

### 新規検討機能
- **Edge Functions**: 週次レビュー自動化
- **Realtime**: リアルタイム状態同期
- **Storage**: ファイル管理（台本、資料）

## 6. 統合版機能セット提案

### 統合アーキテクチャ

#### コアシステム
```
統合PM システム
├── 認証・ユーザー管理 (Supabase Auth)
├── プログラム管理
│   ├── 9段階ステータス (PMplatto)
│   └── PR管理機能 (PMplatto)
├── エピソード管理 ⭐ NEW MAIN FEATURE
│   ├── 10段階ステータス (PMliberary)
│   ├── ステータス履歴追跡 (PMliberary)
│   └── エピソード専用Kanban (PMliberary)
├── カレンダー・スケジュール管理
│   ├── プログラムタスク管理
│   └── チームイベント管理 (PMliberary拡張)
└── ダッシュボード ⭐ NEW FEATURE
    ├── チーム共有メモ
    ├── クイックリンク
    ├── 共有タスクリスト
    └── スケジュール概要
```

#### 推奨実装フェーズ

**Phase 1: 基盤統合**
- 共通認証システム
- 統合データベーススキーマ
- 基本UI共通化

**Phase 2: 機能統合**
- エピソード管理システム統合
- Kanbanボード統合（プログラム・エピソード両対応）
- カレンダー機能拡張

**Phase 3: 新機能追加**
- チームダッシュボード実装
- ステータス履歴・監査機能
- 高度な検索・フィルタリング

### 統合後の主要機能

#### 1. 統合Kanbanボード
```typescript
interface UnifiedKanbanProps {
  mode: 'programs' | 'episodes';
  statusType: '9stage' | '10stage';
  filters: FilterOptions;
}
```

#### 2. 統合カレンダーシステム
```typescript
interface UnifiedCalendarEvent {
  type: 'program_task' | 'team_event';
  programId?: number;
  episodeId?: number;
  meetingUrl?: string;
  isTeamEvent: boolean;
}
```

#### 3. 統合ダッシュボード
```typescript
interface DashboardWidget {
  type: 'memo' | 'quicklinks' | 'tasks' | 'schedule' | 'analytics';
  content: Record<string, any>;
  permissions: 'team' | 'personal';
}
```

### 統合版のメリット

#### 運用効率の向上
- **単一システム**による管理コスト削減
- **統一UI/UX**による学習コスト削減
- **データ一元化**による情報共有促進

#### 機能面での強化
- **詳細なエピソード管理**（10段階ステータス）
- **チーム連携機能**（ダッシュボード・共有機能）
- **包括的な進捗管理**（プログラム・エピソード両対応）

#### 技術的な利点
- **Supabaseフル活用**（Triggers, Views, RLS）
- **スケーラブルなアーキテクチャ**
- **監査・履歴機能**による品質向上

## 7. 実装優先度と推奨事項

### 高優先度（必須機能）
1. **エピソード管理システム**: PMliberaryの10段階管理システム
2. **統合Kanbanボード**: 両形式をサポート
3. **拡張カレンダー**: チームイベント対応

### 中優先度（価値の高い機能）
1. **チームダッシュボード**: 情報共有とコラボレーション向上
2. **ステータス履歴機能**: 変更追跡と監査
3. **PR管理機能**: PMplattoの機能を継承

### 低優先度（将来的な拡張機能）
1. **リアルタイム同期**: Supabase Realtime活用
2. **ファイル管理**: Supabase Storage活用
3. **自動化機能**: Edge Functions活用

### 技術的推奨事項

#### フロントエンド
- **React + TypeScript**: 現行継続
- **Tailwind CSS**: デザインシステム統一
- **React Router**: SPA構成維持

#### バックエンド
- **Supabase**: フルマネージドBaaS活用
- **PostgreSQL**: リレーショナルデータ設計
- **Row Level Security**: セキュリティファースト

#### 開発・運用
- **マイグレーション戦略**: 段階的移行
- **データバックアップ**: 移行前の完全バックアップ
- **ユーザートレーニング**: 新機能の操作説明

---

**結論**: PMliberaryで実現された10段階エピソード管理システムとダッシュボード機能を中核とし、PMplattoのPR管理機能を統合した包括的なプロダクション管理システムを構築することを強く推奨します。これにより、現在の両システムの利点を活かしつつ、チーム連携とプロジェクト可視性を大幅に向上させることができます。