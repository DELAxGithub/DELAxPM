# 🚀 DELA×PM データベース移行実行ガイド

## 📋 移行実行手順

### 1. Supabase管理画面にアクセス

1. **PMliberary プロジェクトにアクセス**:
   ```
   URL: https://supabase.com/dashboard/project/pfrzcteapmwufnovmmfc
   ```

2. **SQL Editorを開く**:
   - 左サイドバーの「SQL Editor」をクリック

### 2. 移行スクリプト実行

**実行するファイル**: `scripts/complete-migration.sql`

1. **ファイル内容をコピー**:
   ```bash
   cat scripts/complete-migration.sql
   ```

2. **SQL Editorに貼り付けて実行**:
   - 「Run」ボタンをクリック
   - エラーがないことを確認

### 3. 実行結果の確認

実行後、以下の結果が表示されるはずです：

```
Programs by Type:
- liberary: 3
- platto: 5

Episodes by Program Type:
- liberary: 3
- platto: 0

Status: Migration completed successfully!
```

### 4. アプリケーションでの動作確認

1. **ローカル開発サーバー起動**:
   ```bash
   cd apps/unified
   pnpm dev
   ```

2. **ページ確認**:
   - **ホーム**: http://localhost:3000
   - **プラット**: http://localhost:3000/platto (5件の番組が表示)
   - **リベラリー**: http://localhost:3000/liberary (3件のエピソードが表示)

## 🔍 期待される結果

### プラットページ
- 5件の番組データが表示される
- アイコンサイズが正常
- 「番組がありません」エラーが解消

### リベラリーページ  
- 3件のエピソードデータが表示される
- アイコンサイズが正常
- 「エピソード取得エラー」が解消

### ホームページ
- アイコンサイズが正常
- ゲストログインが正常動作

## ⚠️ トラブルシューティング

### エラー1: 「column "project_type" does not exist」
**原因**: スキーマ拡張部分が実行されていない
**解決**: `complete-migration.sql`の STEP 1 部分を再実行

### エラー2: 「duplicate key value violates unique constraint」
**原因**: データが既に存在している
**解決**: DELETE文を実行してから再度INSERT

### エラー3: アプリでまだエラーが表示される
**原因**: ブラウザキャッシュ
**解決**: ブラウザのハードリフレッシュ (Ctrl+Shift+R)

## 📊 移行データ内容

### PMplattoデータ (5件)
1. つながる時代のわかりあえなさ (@国立競技場)
2. 書くこと、編むこと (@羊毛倉庫)  
3. 人々が夢中になるハーブの世界 (@明石のハーブ園)
4. 問いを立てることからはじめよう (@横浜美術館)
5. 文学を旅する (@太宰治記念館)

### PMliberaryデータ (3件)
1. クリエイティブ対談シリーズ (第1シーズン)
2. アートの現在地 (ドキュメンタリー特集)
3. 未来への提言 (トークシリーズ)

### エピソードデータ (3件)
- 各リベラリー番組に対応するエピソード1話ずつ

## 📞 サポート

移行に問題が発生した場合は、以下の情報を含めて報告してください：

1. 実行したSQL文
2. エラーメッセージの全文
3. 実行時のスクリーンショット
4. ブラウザの開発者ツールのエラーログ

---
**作成日**: 2025-07-27  
**対象環境**: PMliberary Supabase プロジェクト  
**実行予想時間**: 5-10分