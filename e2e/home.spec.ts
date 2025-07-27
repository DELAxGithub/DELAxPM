import { test, expect } from '@playwright/test';

test.describe('ホームページ', () => {
  test('ページが正常に読み込まれる', async ({ page }) => {
    await page.goto('/');
    
    // ページタイトルの確認
    await expect(page).toHaveTitle(/DELA×PM/);
    
    // 未認証時のメインヘッダーの確認
    await expect(page.locator('h1')).toContainText('DELA×PM ログイン');
    
    // ゲストモードに入る
    await page.locator('text=ゲストとして続行').click();
    
    // 認証後のメインヘッダーの確認
    await expect(page.locator('h1')).toContainText('DELA×PM 進捗管理システム');
    
    // サブタイトルの確認
    await expect(page.locator('text=プラッと進捗すごろく & リベラリー統合版')).toBeVisible();
  });

  test('ゲストモードでアクセスできる', async ({ page }) => {
    await page.goto('/');
    
    // ゲストボタンが表示されている
    const guestButton = page.locator('text=ゲストとして続行');
    await expect(guestButton).toBeVisible();
    
    // ゲストボタンをクリック
    await guestButton.click();
    
    // ゲストユーザーとして認識される
    await expect(page.locator('text=ゲストユーザーとしてアクセス中')).toBeVisible();
  });

  test('プラッととリベラリーのリンクが動作する', async ({ page }) => {
    await page.goto('/');
    
    // ゲストモードに入る
    await page.locator('text=ゲストとして続行').click();
    
    // プラッとリンクの確認
    const plattoLink = page.locator('a[href="/platto"]');
    await expect(plattoLink).toBeVisible();
    await expect(plattoLink.locator('h2')).toContainText('プラッと進捗すごろく');
    
    // リベラリーリンクの確認
    const liberaryLink = page.locator('a[href="/liberary"]');
    await expect(liberaryLink).toBeVisible();
    await expect(liberaryLink.locator('h2')).toContainText('リベラリー');
  });

  test('統合ダッシュボードにアクセスできる', async ({ page }) => {
    await page.goto('/');
    
    // ゲストモードに入る
    await page.locator('text=ゲストとして続行').click();
    
    // 統合ダッシュボードリンクの確認
    const dashboardLink = page.locator('a[href="/dashboard"]');
    await expect(dashboardLink).toBeVisible();
    await expect(dashboardLink).toContainText('統合ダッシュボード');
    
    // ダッシュボードページに移動
    await dashboardLink.click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('レスポンシブデザインが動作する', async ({ page }) => {
    // デスクトップサイズ
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/');
    
    // ゲストモードに入る
    await page.locator('text=ゲストとして続行').click();
    
    // カードが横並びになっている（グリッド）
    const cardContainer = page.locator('.grid.md\\:grid-cols-2');
    await expect(cardContainer).toBeVisible();
    
    // モバイルサイズ
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    
    // ゲストモードに再度入る（リロード後）
    await page.locator('text=ゲストとして続行').click();
    
    // カードが縦並びになっている
    await expect(cardContainer).toBeVisible();
  });
});