import { test, expect } from '@playwright/test';

test.describe('DELAxPM Basic Tests', () => {
  test('ホームページが正常に読み込まれる', async ({ page }) => {
    await page.goto('/');
    
    // ページタイトルの確認
    await expect(page).toHaveTitle(/DELA×PM/);
    
    // 未認証時のメインヘッダーの確認
    await expect(page.locator('h1')).toContainText('DELA×PM ログイン');
    
    // ゲストモードに入る
    await page.locator('text=ゲストとして続行').click();
    
    // 認証後のメインヘッダーの確認
    await expect(page.locator('h1')).toContainText('DELA×PM 進捗管理システム');
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

  test('週報ボタンが表示され動作する', async ({ page }) => {
    await page.goto('/');
    
    // ゲストモードに入る
    await page.locator('text=ゲストとして続行').click();
    
    // 週報ボタンの確認
    const weeklyReviewButton = page.locator('text=📊 週報送信');
    await expect(weeklyReviewButton).toBeVisible();
    
    // ボタンをクリック
    await weeklyReviewButton.click();
    
    // 結果の確認（最大10秒待機）
    await expect(page.locator('text=✅ 週報送信完了')).toBeVisible({ timeout: 10000 });
  });
});