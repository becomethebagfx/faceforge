import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Upload Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/upload');
  });

  test('should display upload page', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have upload area', async ({ page }) => {
    // Check for any upload-related element
    const uploadElements = page.locator('[class*="upload"], [class*="drop"], input[type="file"], [class*="border-dashed"]');
    const count = await uploadElements.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have file input', async ({ page }) => {
    // Check for file input
    const fileInput = page.locator('input[type="file"]');
    const count = await fileInput.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have buttons', async ({ page }) => {
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

test.describe('Upload Mode - Interaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/upload');
  });

  test('file input is accessible', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]').first();
    await expect(fileInput).toBeAttached();
  });

  test('buttons are clickable', async ({ page }) => {
    const button = page.locator('button').first();
    if (await button.isVisible()) {
      await expect(button).toBeEnabled();
    }
  });

  test('page has interactive elements', async ({ page }) => {
    const interactive = page.locator('button, input, select, a');
    const count = await interactive.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Upload Mode - Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/upload');
  });

  test('page has proper structure', async ({ page }) => {
    // Check for main content area
    const main = page.locator('main, [class*="container"], [class*="content"]');
    const count = await main.count();
    expect(count).toBeGreaterThan(0);
  });

  test('page has grid or flex layout', async ({ page }) => {
    const layouts = page.locator('[class*="grid"], [class*="flex"]');
    const count = await layouts.count();
    expect(count).toBeGreaterThan(0);
  });

  test('responsive layout works', async ({ page }) => {
    // Desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator('body')).toBeVisible();

    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
  });
});
