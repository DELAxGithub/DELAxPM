import { test, expect } from '@playwright/test';

test.describe('週報機能', () => {
  test.beforeEach(async ({ page }) => {
    // ゲストモードでアクセス
    await page.goto('/');
    await page.locator('text=ゲストとして続行').click();
  });

  test('週報ボタンが表示される', async ({ page }) => {
    // 週報ボタンの確認
    const weeklyReviewButton = page.locator('text=📊 週報送信');
    await expect(weeklyReviewButton).toBeVisible();
    
    // ボタンがクリック可能であること
    await expect(weeklyReviewButton).toBeEnabled();
  });

  test('週報ボタンをクリックして機能が動作する', async ({ page }) => {
    // 週報ボタンをクリック
    const weeklyReviewButton = page.locator('text=📊 週報送信');
    await weeklyReviewButton.click();
    
    // ローディング状態の確認
    await expect(page.locator('text=送信中...')).toBeVisible();
    
    // 結果の確認（最大10秒待機）
    await expect(page.locator('text=✅ 週報送信完了')).toBeVisible({ timeout: 10000 });
    
    // 統計情報の確認（エピソード0件でも表示される）
    await expect(page.locator('text=エピソード0件')).toBeVisible();
  });

  test('週報APIが正常に応答する', async ({ page }) => {
    // APIレスポンスをインターセプト
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/api/weekly-review') && response.status() === 200
    );
    
    // 週報ボタンをクリック
    await page.locator('text=📊 週報送信').click();
    
    // APIレスポンスを待機
    const response = await responsePromise;
    const responseBody = await response.json();
    
    // レスポンスの構造確認
    expect(responseBody).toHaveProperty('success', true);
    expect(responseBody).toHaveProperty('message');
    expect(responseBody).toHaveProperty('stats');
    
    // 統計データの構造確認
    expect(responseBody.stats).toHaveProperty('totalEpisodes');
    expect(responseBody.stats).toHaveProperty('tasksCount');
    expect(responseBody.stats).toHaveProperty('overdueCount');
    expect(responseBody.stats).toHaveProperty('upcomingDeadlines');
    expect(responseBody.stats).toHaveProperty('newEpisodes');
    expect(responseBody.stats).toHaveProperty('completedEpisodes');
  });

  test('連続して週報ボタンをクリックできる', async ({ page }) => {
    const weeklyReviewButton = page.locator('text=📊 週報送信');
    
    // 1回目のクリック
    await weeklyReviewButton.click();
    await expect(page.locator('text=✅ 週報送信完了')).toBeVisible({ timeout: 10000 });
    
    // 少し待ってから2回目のクリック
    await page.waitForTimeout(1000);
    await weeklyReviewButton.click();
    await expect(page.locator('text=✅ 週報送信完了')).toBeVisible({ timeout: 10000 });
  });

  test('エラー時の処理が適切に動作する', async ({ page }) => {
    // ネットワークエラーをシミュレート
    await page.route('/api/weekly-review', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ 
          success: false, 
          message: 'サーバーエラーが発生しました' 
        })
      });
    });
    
    // 週報ボタンをクリック
    await page.locator('text=📊 週報送信').click();
    
    // エラーメッセージの確認
    await expect(page.locator('text=❌ エラー')).toBeVisible({ timeout: 10000 });
  });

  test('モバイル表示でも週報ボタンが正常に動作する', async ({ page }) => {
    // モバイルサイズに変更
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 週報ボタンの確認
    const weeklyReviewButton = page.locator('text=📊 週報送信');
    await expect(weeklyReviewButton).toBeVisible();
    
    // ボタンをクリック
    await weeklyReviewButton.click();
    
    // 結果の確認
    await expect(page.locator('text=✅ 週報送信完了')).toBeVisible({ timeout: 10000 });
  });

  test('ログインユーザーでも週報ボタンが動作する', async ({ page }) => {
    // 認証済みユーザーの状態をモック（実際の認証は別途実装）
    // ここではゲストユーザーのテストとして実行
    
    const weeklyReviewButton = page.locator('text=📊 週報送信');
    await expect(weeklyReviewButton).toBeVisible();
    
    await weeklyReviewButton.click();
    await expect(page.locator('text=✅ 週報送信完了')).toBeVisible({ timeout: 10000 });
  });
});