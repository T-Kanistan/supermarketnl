import { test, expect } from '@playwright/test';

test('About page loads CMS content', async ({ page }) => {
  await page.goto('/about');
  await expect(page.locator('.about-hero h1')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('.about-offer-grid .offer-card').first()).toBeVisible();
});
