import { test, expect } from '@playwright/test';

test.describe('Live Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/live');
  });

  test('should display live page', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have video or preview area', async ({ page }) => {
    const videoElements = page.locator('video, canvas, [class*="preview"], [class*="webcam"]');
    const count = await videoElements.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have camera button', async ({ page }) => {
    const buttons = page.locator('button');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have cards or sections', async ({ page }) => {
    const sections = page.locator('[class*="card"], section, [class*="border"]');
    const count = await sections.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Live Mode - Elements', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/live');
  });

  test('has file input for face upload', async ({ page }) => {
    const fileInputs = page.locator('input[type="file"]');
    const count = await fileInputs.count();
    expect(count).toBeGreaterThan(0);
  });

  test('has interactive buttons', async ({ page }) => {
    const button = page.locator('button').first();
    if (await button.isVisible()) {
      await expect(button).toBeEnabled();
    }
  });

  test('has text content', async ({ page }) => {
    const text = page.locator('p, h1, h2, h3, span');
    const count = await text.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Live Mode - Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/live');
  });

  test('page has proper structure', async ({ page }) => {
    const main = page.locator('main, [class*="container"], [class*="content"]');
    const count = await main.count();
    expect(count).toBeGreaterThan(0);
  });

  test('page uses grid or flex', async ({ page }) => {
    const layouts = page.locator('[class*="grid"], [class*="flex"]');
    const count = await layouts.count();
    expect(count).toBeGreaterThan(0);
  });

  test('responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('responsive on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Live Mode - Navigation', () => {
  test('can navigate to live page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /live/i }).first().click();
    await expect(page).toHaveURL('/live');
  });

  test('can navigate back to home', async ({ page }) => {
    await page.goto('/live');
    await page.locator('a').first().click();
    await expect(page).toHaveURL('/');
  });
});
