# DELA×PM統合システム - デプロイメントガイド

## 概要
このガイドでは、DELA×PM統合システムを本番環境にデプロイする方法を説明します。

## 前提条件

### 必須要件
- Node.js 18以上
- pnpm パッケージマネージャー
- Supabase プロジェクト（PMliberaryベース）
- 手動移行が完了済み

### 環境変数
```bash
NEXT_PUBLIC_SUPABASE_URL=https://pfrzcteapmwufnovmmfc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_NAME=DELA×PM統合システム
NEXT_PUBLIC_ENABLE_PLATTO=true
NEXT_PUBLIC_ENABLE_LIBERARY=true
```

## デプロイメント方法

### 1. Vercelでのデプロイ

1. **リポジトリ接続**
   ```bash
   # Vercel CLIをインストール
   npm i -g vercel
   
   # プロジェクトをVercelに接続
   vercel link
   ```

2. **環境変数設定**
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

3. **デプロイ実行**
   ```bash
   vercel --prod
   ```

### 2. Netlifyでのデプロイ

1. **Netlify CLIでデプロイ**
   ```bash
   # Netlify CLIをインストール
   npm install -g netlify-cli
   
   # ログイン
   netlify login
   
   # デプロイ
   netlify deploy --prod --dir=apps/unified/.next
   ```

2. **環境変数設定**
   - Netlify管理画面 > Site settings > Environment variables で設定

### 3. Dockerでのデプロイ

1. **イメージビルド**
   ```bash
   docker build -t delaxpm-unified .
   ```

2. **コンテナ実行**
   ```bash
   docker run -p 3000:3000 \
     -e NEXT_PUBLIC_SUPABASE_URL=your_url \
     -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key \
     delaxpm-unified
   ```

## デプロイ前チェックリスト

### データベース移行確認
- [ ] PMliberaryデータベースでスキーマ拡張が完了
- [ ] PMplattoデータ32件の移行が完了
- [ ] データ整合性チェックが通過

### アプリケーション確認
- [ ] ローカルでビルドが成功
- [ ] 認証機能が正常動作
- [ ] ダッシュボードが表示される
- [ ] プロジェクト切り替えが機能

### 環境設定確認
- [ ] 環境変数が正しく設定されている
- [ ] Supabase接続が確認済み
- [ ] RLSポリシーが適切に設定済み

## 本番運用時の注意事項

### セキュリティ
- 環境変数は必ず暗号化されたストレージに保存
- Supabase RLSが適切に設定されていることを確認
- HTTPS接続のみを許可

### モニタリング
- Next.js Analytics の設定
- Supabase Dashboard でのクエリ監視
- エラーログの定期確認

### バックアップ
- Supabaseの自動バックアップ機能を有効化
- 定期的なデータエクスポート実行

## トラブルシューティング

### ビルドエラー
```bash
# 依存関係の再インストール
pnpm install

# キャッシュクリア
pnpm clean && pnpm build
```

### データベース接続エラー
- Supabase URLとキーを確認
- RLSポリシーの設定を確認
- ネットワーク接続を確認

### 表示エラー
- Next.js の静的生成設定を確認
- CSS/Tailwindの設定を確認
- ブラウザのキャッシュをクリア

## ロールバック手順

緊急時のロールバック：
1. 前バージョンへの切り戻し
2. データベースのスナップショット復元
3. 環境変数の復元

---

**サポート**: 技術的な問題が発生した場合は、プロジェクト管理者にお問い合わせください。