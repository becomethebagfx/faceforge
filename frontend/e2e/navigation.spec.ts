import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should load the landing page', async ({ page }) => {
    await page.goto('/');

    // Check page has content
    await expect(page.locator('body')).toBeVisible();

    // Check some visible element exists
    const visibleContent = page.locator('a, button, h1, h2, p').first();
    await expect(visibleContent).toBeVisible();
  });

  test('should navigate to Upload page via nav link', async ({ page }) => {
    await page.goto('/');

    // Click Upload link in nav
    await page.getByRole('link', { name: /upload/i }).first().click();

    // Should be on upload page
    await expect(page).toHaveURL('/upload');
  });

  test('should navigate to Live page via nav link', async ({ page }) => {
    await page.goto('/');

    // Click Live link in nav
    await page.getByRole('link', { name: /live/i }).first().click();

    // Should be on live page
    await expect(page).toHaveURL('/live');
  });

  test('should navigate back to home via logo', async ({ page }) => {
    await page.goto('/upload');

    // Click logo/brand link (first link in the page usually)
    await page.locator('a').first().click();

    // Should be back on home page
    await expect(page).toHaveURL('/');
  });

  test('should have working CTA buttons on landing page', async ({ page }) => {
    await page.goto('/');

    // Find and click upload-related link
    const uploadLink = page.getByRole('link', { name: /upload/i }).first();
    if (await uploadLink.isVisible()) {
      await uploadLink.click();
      await expect(page).toHaveURL('/upload');
    }
  });

  test('should display feature sections on landing page', async ({ page }) => {
    await page.goto('/');

    // Check page has main content
    await expect(page.locator('main, section, [class*="container"]').first()).toBeVisible();
  });

  test('should have responsive navigation', async ({ page }) => {
    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await expect(page.locator('nav, header').first()).toBeVisible();

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    // Navigation should still be accessible
    await expect(page.locator('nav, header').first()).toBeVisible();
  });
});

test.describe('Page Content', () => {
  test('landing page loads successfully', async ({ page }) => {
    await page.goto('/');

    // Page should load without errors
    await expect(page.locator('body')).toBeVisible();

    // Should have at least one visible element
    const content = page.locator('a, button, h1, h2, p').first();
    await expect(content).toBeVisible();
  });

  test('upload page loads successfully', async ({ page }) => {
    await page.goto('/upload');

    // Page should load
    await expect(page.locator('body')).toBeVisible();

    // Should have form elements or upload area
    const hasUploadElements = await page.locator('input, button, [class*="upload"], [class*="drop"]').count();
    expect(hasUploadElements).toBeGreaterThan(0);
  });

  test('live page loads successfully', async ({ page }) => {
    await page.goto('/live');

    // Page should load
    await expect(page.locator('body')).toBeVisible();

    // Should have video/camera elements or buttons
    const hasMediaElements = await page.locator('video, button, [class*="webcam"], [class*="camera"]').count();
    expect(hasMediaElements).toBeGreaterThan(0);
  });
});
