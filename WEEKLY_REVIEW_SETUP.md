# 週報機能セットアップ完了

## 🎉 実装完了

週次レビュー機能が正常に実装されました！以下の機能が利用可能です：

### ✅ 完了した機能

1. **Supabaseエッジファンクション**
   - `/supabase/functions/weekly-review/index.ts`
   - 週次レビューデータの自動生成
   - Slack通知機能
   - Email通知機能（設定時）

2. **統合アプリケーション内機能**
   - `/apps/unified/src/lib/weeklyReview.ts`
   - `/apps/unified/src/app/api/weekly-review/route.ts`
   - `/apps/unified/src/components/WeeklyReviewButton.tsx`
   - 管理者用の手動実行ボタン

3. **環境設定**
   - Slack Webhook URL設定済み
   - `.env.local`に環境変数追加

4. **スケジュール設定**
   - `/supabase/weekly-review-cron.sql`
   - 毎週月曜日9:00（JST）自動実行

## 📊 週報内容

### 自動収集データ
- **今週の活動**: 新規・完成・制作中エピソード数
- **エピソード進捗**: ステータス別・タイプ別集計
- **期限管理**: 超過エピソード・今後の期限
- **今週のタスク**: カレンダータスク一覧

### 通知先
- **Slack**: リッチフォーマットでのビジュアル通知
- **Email**: HTML形式の詳細レポート（設定時）

## 🚀 使用方法

### 1. 手動実行（統合アプリ）
1. 統合アプリにアクセス: http://localhost:3000
2. 管理者としてログイン（admin@example.com）
3. 「📊 週報送信」ボタンをクリック

### 2. API経由での実行
```bash
curl -X POST http://localhost:3000/api/weekly-review
```

### 3. エッジファンクション経由（本番環境）
```bash
# Supabaseにデプロイ後
supabase functions deploy weekly-review

# 手動実行
supabase functions invoke weekly-review
```

### 4. 自動スケジュール
```sql
-- Supabase SQLエディタで実行
\i /path/to/weekly-review-cron.sql
```

## ⚙️ 設定項目

### 必須設定
- ✅ `SLACK_WEBHOOK_URL`: 設定済み
- ✅ `SUPABASE_URL`: 設定済み
- ✅ `SUPABASE_ANON_KEY`: 設定済み

### オプション設定
- `REVIEW_EMAIL`: メール通知先
- `APP_BASE_URL`: アプリケーションURL
- `RESEND_API_KEY`: メール送信API
- `EMAIL_DOMAIN`: 送信元ドメイン

## 📝 次のステップ

### 1. 本番デプロイ
```bash
# エッジファンクションをデプロイ
supabase functions deploy weekly-review

# 環境変数を設定
supabase secrets set SLACK_WEBHOOK_URL=https://hooks.slack.com/...
```

### 2. スケジュール有効化
```sql
-- Supabase SQLエディタで実行
SELECT cron.schedule('weekly-review-job', '0 0 * * 1', '...');
```

### 3. 統合アプリのデプロイ
- Netlify/Vercelにデプロイ
- 環境変数を設定

## 🔧 トラブルシューティング

### よくある問題

1. **Slack通知が届かない**
   - Webhook URLの確認
   - Slack Appの権限確認

2. **データが取得できない**
   - Supabase接続設定の確認
   - テーブル権限の確認

3. **スケジュールが動かない**
   - pg_cron拡張の有効化
   - cron式の確認

### ログ確認
```bash
# エッジファンクションのログ
supabase functions logs weekly-review

# 統合アプリのログ
npm run dev
```

## 📧 Slack通知例

```
📊 週次エピソード進捗レビュー
期間: 1月27日〜2月2日

📈 今週の活動
• 新規エピソード: 2件
• 完成エピソード: 1件  
• 制作中エピソード: 8件

📊 エピソード進捗状況 (全15件)
• 企画内容確認中: 4件
• 台本作成中: 3件
• 撮影準備中: 2件
...

🚨 期限超過アラート
• EP001 - サンプルエピソード1 (3日遅れ)

⏰ 今後の期限 (2週間以内)
• EP002 - サンプルエピソード2 (あと5日)
```

## 🎯 成果

- ✅ 自動週報生成
- ✅ Slack統合
- ✅ 手動実行機能
- ✅ スケジュール機能
- ✅ 包括的な進捗データ

**週報機能が完全に実装されました！** 🎉