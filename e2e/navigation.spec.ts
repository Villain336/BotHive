import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('landing page is accessible', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
  });

  test('pricing page is accessible', async ({ page }) => {
    const response = await page.goto('/pricing');
    expect(response?.status()).toBe(200);
  });

  test('sign-in page is accessible', async ({ page }) => {
    const response = await page.goto('/sign-in');
    expect(response?.status()).toBe(200);
  });

  test('sign-up page is accessible', async ({ page }) => {
    const response = await page.goto('/sign-up');
    expect(response?.status()).toBe(200);
  });

  test('navbar is visible on landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header').getByText('ShipReady')).toBeVisible();
  });

  test('navbar is hidden on sign-in page', async ({ page }) => {
    await page.goto('/sign-in');
    // The navbar component returns null for sign-in/sign-up
    const header = page.locator('header');
    const navVisible = await header.getByText('ShipReady').isVisible().catch(() => false);
    expect(navVisible).toBeFalsy();
  });

  test('clicking Pricing in nav goes to pricing page', async ({ page }) => {
    await page.goto('/');
    await page.locator('header').getByRole('link', { name: 'Pricing' }).click();
    await expect(page).toHaveURL('/pricing');
  });

  test('clicking logo in nav goes to homepage', async ({ page }) => {
    await page.goto('/pricing');
    await page.locator('header').getByRole('link', { name: /ShipReady/i }).click();
    await expect(page).toHaveURL('/');
  });

  test('non-existent route returns 404', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist');
    expect(response?.status()).toBe(404);
  });
});
