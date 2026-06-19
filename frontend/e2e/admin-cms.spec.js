import { test, expect } from '@playwright/test';

test('Admin can update homepage store name', async ({ page }) => {
  await page.goto('/admin/login');
  await page.fill('input[type="email"]', 'admin@store.com');
  await page.fill('input[type="password"]', 'Admin@123');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/admin/dashboard**', { timeout: 15000 });

  await page.goto('/admin/dashboard/site-settings');
  await expect(page.getByText('Site Settings')).toBeVisible({ timeout: 15000 });

  const storeInput = page.locator('input').filter({ has: page.locator('xpath=..//label[contains(text(),"Store Name")]') }).first();
  const nameField = page.locator('label:has-text("Store Name")').locator('..').locator('input');
  await nameField.fill('Wins Wereld Winkel E2E');
  await page.getByRole('button', { name: /save/i }).click();
  await expect(page.getByText(/updated successfully/i)).toBeVisible({ timeout: 10000 });

  await page.goto('/');
  await expect(page.getByText('Wins Wereld Winkel E2E').first()).toBeVisible({ timeout: 15000 });
});
