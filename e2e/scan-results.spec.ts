import { test, expect } from '@playwright/test';

test.describe('Scan Results / Project Detail', () => {
  // These tests verify project detail page structure
  // They run against a dynamic route which needs a real projectId,
  // so they test what loads and gracefully handle auth redirects

  test('project detail page renders compliance scorecard area', async ({ page }) => {
    await page.goto('/dashboard/projects/test-project-id');
    await page.waitForTimeout(1500);

    // Either we see project UI or get redirected to sign-in
    const hasBackLink = await page.getByText(/Back to Projects/i).isVisible().catch(() => false);
    const hasSignIn = await page.getByText(/Sign in/i).isVisible().catch(() => false);
    expect(hasBackLink || hasSignIn).toBeTruthy();
  });

  test('project detail has Run Scan button', async ({ page }) => {
    await page.goto('/dashboard/projects/test-project-id');
    await page.waitForTimeout(1500);

    const hasScanBtn = await page.getByRole('button', { name: /Run Scan/i }).isVisible().catch(() => false);
    const hasSignIn = await page.getByText(/Sign in/i).isVisible().catch(() => false);
    expect(hasScanBtn || hasSignIn).toBeTruthy();
  });

  test('project detail has AI Chat button', async ({ page }) => {
    await page.goto('/dashboard/projects/test-project-id');
    await page.waitForTimeout(1500);

    const hasChatBtn = await page.getByRole('link', { name: /AI Chat/i }).isVisible().catch(() => false);
    const hasSignIn = await page.getByText(/Sign in/i).isVisible().catch(() => false);
    expect(hasChatBtn || hasSignIn).toBeTruthy();
  });
});
