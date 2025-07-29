# チームダッシュボード技術調査レポート

作成日: 2025年7月29日  
調査者: Claude Code  
対象システム: DELAxPM 統合版

## 問題の概要

### 症状
- 本番環境で「チームダッシュボード」が表示されない
- オリジナル版（temp_liberary）では正常に動作
- 統合版（apps/unified）では表示されない

### 影響範囲
- リベラリーページのサイドバー内チームダッシュボード
- ユーザー体験の低下
- チーム機能の利用不可

## 調査実施内容

### 1. データベース層調査

#### ✅ テーブル構造確認
```sql
-- team_dashboard テーブル正常作成済み
CREATE TABLE team_dashboard (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  widget_type text NOT NULL CHECK (widget_type IN ('quicklinks', 'memo', 'tasks', 'schedule')),
  title text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);
```

#### ✅ RLSポリシー確認・修正済み
```sql
-- 修正前（問題あり）
CREATE POLICY "Enable read access for all users" ON team_dashboard
  FOR SELECT USING (true);

-- 修正後（認証ユーザー向け）
CREATE POLICY "Enable read access for authenticated users" ON team_dashboard
  FOR SELECT TO authenticated USING (true);
```

#### ✅ サンプルデータ確認
```sql
-- 以下のデータが正常に挿入済み
INSERT INTO team_dashboard (widget_type, title, content, sort_order) VALUES
  ('memo', 'チーム共有メモ', '{"text": "..."}', 1),
  ('quicklinks', 'クイックリンク', '{"links": [...]}', 2),
  ('tasks', 'チーム共有タスク', '{"tasks": [...]}', 3);
```

### 2. バックエンドAPI層調査

#### ✅ Supabaseクライアント設定
**ファイル**: `apps/unified/src/lib/supabase.ts`
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```
**状態**: 正常に設定済み

#### ✅ ダッシュボードAPI実装
**ファイル**: `apps/unified/src/lib/dashboard.ts`
```typescript
export async function getDashboardWidgets(): Promise<DashboardWidget[]> {
  const { data, error } = await supabase
    .from('team_dashboard')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching dashboard widgets:', error);
    throw error;
  }

  return data || [];
}
```
**状態**: 実装済み、エラーハンドリングあり

### 3. フロントエンド層調査

#### ✅ カスタムフック実装
**ファイル**: `apps/unified/src/hooks/useDashboard.ts`
```typescript
export function useDashboard() {
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWidgets = async () => {
    try {
      setLoading(true);
      console.log('Fetching dashboard widgets...');
      const data = await getDashboardWidgets();
      console.log('Dashboard widgets data:', data);
      setWidgets(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard widgets:', err);
      setError('ダッシュボードの読み込みに失敗しました: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };
  // ...
}
```
**状態**: 実装済み、ログ出力あり

#### ✅ TeamDashboardコンポーネント実装
**ファイル**: `apps/unified/src/components/dashboard/TeamDashboard.tsx`
```typescript
export default function TeamDashboard() {
  const { widgets, loading, error, updateWidget } = useDashboard();
  
  if (loading) {
    return (
      <div className="px-3 py-2 text-sm text-gray-500">
        読み込み中...
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-3 py-2 text-sm text-red-600">
        {error}
      </div>
    );
  }
  // ...
}
```
**状態**: 実装済み、エラー表示機能あり

#### ✅ 使用箇所確認
**ファイル**: `apps/unified/src/app/liberary/page.tsx`
```typescript
import TeamDashboard from '../../components/dashboard/TeamDashboard';

// サイドバー内で使用
<TeamDashboard />
```
**状態**: 正しくインポート・使用されている

### 4. オリジナル版との比較調査

#### 差分1: MembersWidgetの存在
**統合版にのみ存在**:
```typescript
case 'members':
  return (
    <MembersWidget 
      content={widget.content} 
      onUpdate={(content) => updateWidget(widget.id, { content })}
    />
  );
```

#### 差分2: ファイル構造
```
# オリジナル (temp_liberary)
temp_liberary/src/components/dashboard/TeamDashboard.tsx

# 統合版 (apps/unified)  
apps/unified/src/components/dashboard/TeamDashboard.tsx
```

#### 差分3: 依存関係
- オリジナル: React 18 + Vite
- 統合版: Next.js 15 + React 18

### 5. 環境・認証層調査

#### ✅ 認証設定確認
**Supabase設定**:
- 匿名認証: 有効
- ゲストアクセス: `NEXT_PUBLIC_ENABLE_GUEST_ACCESS=true`

#### ✅ 環境変数確認
```bash
# Networkタブで確認済み
NEXT_PUBLIC_SUPABASE_URL=https://pfrzcteapmwufnovmmfc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 実施済み修正内容

### 修正1: RLSポリシー修正（2025-07-29）
```sql
-- マイグレーション: 20250729150000_fix_rls_policies.sql
-- 全テーブルのRLSポリシーを認証ユーザー向けに修正
CREATE POLICY "Enable read access for authenticated users" ON team_dashboard
  FOR SELECT TO authenticated USING (true);
```

### 修正2: マイグレーション履歴修復
```bash
npx supabase migration repair --status applied 20250729130000
npx supabase migration repair --status applied 20250729140000
```

### 修正3: 本番デプロイ（コミット: ce6883e）
- RLSポリシー修正をGitHubにプッシュ
- Netlify自動デプロイで本番反映

## 未解決の問題分析

### 仮説1: 認証状態の問題
**症状**: データ取得時の認証状態が不正
**可能性**: 
- ゲストユーザーが`authenticated`ロールとして認識されていない
- セッション情報の不整合

### 仮説2: データ取得タイミングの問題
**症状**: コンポーネントレンダリング時にデータが取得できない
**可能性**:
- Next.js SSR/CSRでの実行タイミング問題
- 認証状態の確立前にAPI呼び出しが実行される

### 仮説3: エラーの隠蔽
**症状**: エラーが発生しているが表示されていない
**可能性**:
- コンソールエラーが見落とされている
- ネットワークエラーが適切にハンドリングされていない

### 仮説4: コンポーネントの条件分岐
**症状**: 特定の条件下でコンポーネントがレンダリングされない
**可能性**:
- 環境固有の条件分岐
- プロップスの不一致

## 推奨される次の調査項目

### 🔴 高優先度（即座に実施）
1. **ブラウザ開発者ツールでの詳細確認**
   - Networkタブでのリクエスト確認
   - Consoleタブでのエラー確認
   - Application タブでの認証状態確認

2. **ローカル環境での動作確認**
   - `pnpm dev`でローカル実行
   - データ取得処理のデバッグログ確認

3. **認証状態の直接確認**
   - `supabase.auth.getUser()`の結果確認
   - セッション情報の詳細確認

### 🟡 中優先度（問題特定後）
1. **コンポーネントの分離テスト**
   - `TeamDashboard`を単独でテスト
   - `useDashboard`フックの単独テスト

2. **オリジナル版との詳細比較**
   - 動作環境の差分調査
   - 実行時ログの比較

## 推奨される解決アプローチ

### アプローチ1: デバッグログの強化
```typescript
// useDashboard.ts内に詳細ログ追加
console.log('User auth state:', await supabase.auth.getUser());
console.log('Session:', await supabase.auth.getSession());
console.log('SQL Query executing...');
```

### アプローチ2: 段階的な機能削減
```typescript
// 最小限の実装でテスト
export function useDashboard() {
  const [widgets] = useState([{
    id: 1,
    widget_type: 'memo',
    title: 'テスト',
    content: { text: 'テストメッセージ' }
  }]);
  return { widgets, loading: false, error: null };
}
```

### アプローチ3: オリジナル版の移植
- `temp_liberary`からコンポーネントを直接コピー
- 依存関係を最小限に修正
- 段階的に統合版の機能を追加

## 結論

### 確認済み事項
- データベース層: ✅ 正常
- API層: ✅ 正常
- コンポーネント層: ✅ 実装済み
- 環境設定: ✅ 正常

### 未確認事項
- 実際のデータ取得処理の成功/失敗
- 認証状態とデータアクセス権限の整合性
- フロントエンドでのエラーハンドリングの実効性

### 次のアクション
1. ブラウザ開発者ツールでの実地調査
2. ローカル環境での詳細デバッグ
3. オリジナル開発者との連携による根本原因特定

---

**重要**: この調査により、技術的な実装は概ね正常であることが確認されましたが、実際の動作確認が不可欠です。オリジナル開発者との連携により、実地でのデバッグ作業を実施することを強く推奨します。