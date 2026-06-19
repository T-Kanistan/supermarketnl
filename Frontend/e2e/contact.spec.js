import { test, expect } from '@playwright/test';

test('Contact form submits successfully', async ({ page }) => {
  await page.goto('/contact');
  await expect(page.locator('.contact-page')).toBeVisible({ timeout: 15000 });

  await page.fill('input[name="name"]', 'E2E Test User');
  await page.fill('input[name="email"]', 'e2e@test.com');
  await page.fill('input[name="phone"]', '+31600000001');
  await page.fill('input[name="subject"]', 'E2E enquiry');
  await page.fill('textarea[name="message"]', 'Automated test message from Playwright.');

  await page.locator('button[type="submit"]').click();
  await expect(page.getByText(/message has been sent/i)).toBeVisible({ timeout: 10000 });
});
