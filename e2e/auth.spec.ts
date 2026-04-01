import { test, expect } from '@playwright/test';

test.describe('Authentication Pages', () => {
  test('sign-in page renders with GitHub OAuth button', async ({ page }) => {
    await page.goto('/sign-in');
    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign in with GitHub/i })).toBeVisible();
  });

  test('sign-in has link to sign-up', async ({ page }) => {
    await page.goto('/sign-in');
    const signUpLink = page.getByRole('link', { name: /Start free trial/i });
    await expect(signUpLink).toBeVisible();
    await expect(signUpLink).toHaveAttribute('href', '/sign-up');
  });

  test('sign-up page renders with trial benefits', async ({ page }) => {
    await page.goto('/sign-up');
    await expect(page.getByRole('heading', { name: /Start your free trial/i })).toBeVisible();
    await expect(page.getByText(/14 days free/i)).toBeVisible();
    await expect(page.getByText(/1 GitHub repository/i)).toBeVisible();
    await expect(page.getByText(/3 compliance scans/i)).toBeVisible();
    await expect(page.getByText(/AI expert chat/i)).toBeVisible();
  });

  test('sign-up has GitHub OAuth button', async ({ page }) => {
    await page.goto('/sign-up');
    await expect(page.getByRole('button', { name: /Sign up with GitHub/i })).toBeVisible();
  });

  test('sign-up has link to sign-in', async ({ page }) => {
    await page.goto('/sign-up');
    const signInLink = page.getByRole('link', { name: /Sign in/i });
    await expect(signInLink).toBeVisible();
    await expect(signInLink).toHaveAttribute('href', '/sign-in');
  });

  test('sign-in page has no navbar', async ({ page }) => {
    await page.goto('/sign-in');
    await expect(page.locator('header nav')).not.toBeVisible();
  });

  test('sign-up page has no navbar', async ({ page }) => {
    await page.goto('/sign-up');
    await expect(page.locator('header nav')).not.toBeVisible();
  });
});
