import { type Page, expect } from '@playwright/test';

const TEST_EMAIL = process.env.TEST_USER_EMAIL ?? 'demo@horus.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD ?? 'demo1234';

export async function loginAsTestUser(page: Page): Promise<void> {
  await page.goto('/');
  await page.fill('[name="email"]', TEST_EMAIL);
  await page.fill('[name="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });
}
