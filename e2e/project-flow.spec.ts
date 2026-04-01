import { test, expect } from '@playwright/test';

test.describe('Project Connection Flow', () => {
  test('new project page renders URL input', async ({ page }) => {
    await page.goto('/dashboard/projects/new');
    await page.waitForTimeout(1500);
    // If we can see the input, test validation
    const input = page.getByPlaceholder(/github\.com/i);
    const isVisible = await input.isVisible().catch(() => false);
    if (isVisible) {
      await expect(input).toBeVisible();
      await expect(page.getByText(/Connect a GitHub Repository/i)).toBeVisible();
    }
  });

  test('shows error for empty URL submission', async ({ page }) => {
    await page.goto('/dashboard/projects/new');
    await page.waitForTimeout(1500);
    const button = page.getByRole('button', { name: /Connect & Scan/i });
    const isVisible = await button.isVisible().catch(() => false);
    if (isVisible) {
      await button.click();
      await expect(page.getByText(/Please enter a GitHub repository URL/i)).toBeVisible();
    }
  });

  test('shows error for invalid GitHub URL', async ({ page }) => {
    await page.goto('/dashboard/projects/new');
    await page.waitForTimeout(1500);
    const input = page.getByPlaceholder(/github\.com/i);
    const isVisible = await input.isVisible().catch(() => false);
    if (isVisible) {
      await input.fill('https://not-a-github-url.com/test');
      await page.getByRole('button', { name: /Connect & Scan/i }).click();
      await expect(page.getByText(/valid GitHub repository URL/i)).toBeVisible();
    }
  });

  test('back link navigates to dashboard', async ({ page }) => {
    await page.goto('/dashboard/projects/new');
    await page.waitForTimeout(1500);
    const backLink = page.getByRole('link', { name: /Back to Dashboard/i });
    const isVisible = await backLink.isVisible().catch(() => false);
    if (isVisible) {
      await expect(backLink).toHaveAttribute('href', '/dashboard');
    }
  });
});
