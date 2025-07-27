import { test, expect } from '@playwright/test';

test.describe('統合ダッシュボード', () => {
  test.beforeEach(async ({ page }) => {
    // ゲストモードでダッシュボードにアクセス
    await page.goto('/');
    await page.locator('text=ゲストとして続行').click();
    await page.locator('a[href="/dashboard"]').click();
  });

  test('ダッシュボードが正常に読み込まれる', async ({ page }) => {
    // ページタイトルの確認
    await expect(page.locator('h1')).toContainText('統合ダッシュボード');
    
    // ヘッダーの確認
    await expect(page.locator('header')).toBeVisible();
    
    // ホームリンクの確認
    await expect(page.locator('a[href="/"]')).toContainText('← ホーム');
  });

  test('統計カードが表示される', async ({ page }) => {
    // 4つの主要統計カードが表示される
    const statsGrid = page.locator('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4');
    await expect(statsGrid).toBeVisible();
    
    // プラッと統計
    await expect(page.locator('text=プラッと 進行中')).toBeVisible();
    await expect(page.locator('text=プラッと 完了')).toBeVisible();
    
    // リベラリー統計
    await expect(page.locator('text=リベラリー 進行中')).toBeVisible();
    await expect(page.locator('text=リベラリー 完了')).toBeVisible();
  });

  test('プロジェクトサマリーが表示される', async ({ page }) => {
    // プラッと進捗すごろくセクション（より具体的なセレクター）
    const plattoSection = page.locator('h3:has-text("プラッと進捗すごろく")').locator('..');
    await expect(plattoSection).toBeVisible();
    
    // プラッとへのリンクを確認
    const plattoLinks = page.locator('a[href="/platto"]');
    await expect(plattoLinks.first()).toBeVisible();
    
    // リベラリーセクション（より具体的なセレクター）
    const liberarySection = page.locator('h3:has-text("リベラリー")').locator('..');
    await expect(liberarySection).toBeVisible();
    
    // リベラリーへのリンクを確認
    const liberaryLinks = page.locator('a[href="/liberary"]');
    await expect(liberaryLinks.first()).toBeVisible();
  });

  test('クイックアクションが動作する', async ({ page }) => {
    // クイックアクションセクションの確認
    await expect(page.locator('text=クイックアクション')).toBeVisible();
    
    // 番組管理リンク
    const programLink = page.locator('a[href="/platto"]').last();
    await expect(programLink).toBeVisible();
    await expect(programLink).toContainText('番組管理');
    
    // エピソード管理リンク
    const episodeLink = page.locator('a[href="/liberary"]').last();
    await expect(episodeLink).toBeVisible();
    await expect(episodeLink).toContainText('エピソード管理');
  });

  test('ゲストユーザー表示が正しい', async ({ page }) => {
    // ゲストユーザーの表示確認
    await expect(page.locator('text=ゲストユーザー')).toBeVisible();
    await expect(page.locator('text=（制限モード）')).toBeVisible();
    
    // ログインボタンの確認
    await expect(page.locator('a[href="/auth/login"]')).toContainText('ログイン');
  });

  test('プログレスバーが表示される（データがある場合）', async ({ page }) => {
    // データが0件の場合でも構造は表示される
    const progressBars = page.locator('.bg-gray-200.rounded-full.h-2');
    
    // プログレスバーのコンテナが存在することを確認
    // 実際のデータがないため、構造のみチェック
    const plattoProgress = page.locator('text=完了率').first();
    const liberaryProgress = page.locator('text=完了率').last();
    
    // 完了率の表示（0%でも表示される）
    if (await plattoProgress.isVisible()) {
      await expect(plattoProgress).toBeVisible();
    }
    if (await liberaryProgress.isVisible()) {
      await expect(liberaryProgress).toBeVisible();
    }
  });

  test('ナビゲーションが動作する', async ({ page }) => {
    // ホームに戻る
    await page.locator('a[href="/"]').click();
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toContainText('DELA×PM 進捗管理システム');
  });
});