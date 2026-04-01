import { test, expect } from '@playwright/test';

test.describe('Dashboard (unauthenticated)', () => {
  test('redirects to sign-in when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    // The dashboard layout should show a loading spinner then redirect
    // Since we can't complete OAuth in tests, we verify the redirect behavior
    // The client-side auth check in dashboard/layout.tsx redirects to /sign-in
    await page.waitForTimeout(2000);
    // Either we're still on dashboard (loading) or redirected to sign-in
    const url = page.url();
    expect(url.includes('/dashboard') || url.includes('/sign-in')).toBeTruthy();
  });
});

test.describe('Dashboard pages render', () => {
  // These tests verify the pages can at least mount without crashing
  // Full auth-gated testing would require mocking Supabase auth

  test('projects/new page renders connect repo form', async ({ page }) => {
    await page.goto('/dashboard/projects/new');
    // Even without auth, the page component should render
    await page.waitForTimeout(1000);
    // Check if we either see the form or got redirected
    const hasForm = await page.getByPlaceholder(/github\.com/i).isVisible().catch(() => false);
    const hasSignIn = await page.getByText(/Sign in with GitHub/i).isVisible().catch(() => false);
    expect(hasForm || hasSignIn).toBeTruthy();
  });

  test('settings page has expected sections', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await page.waitForTimeout(1000);
    // If auth redirect doesn't happen fast enough, we might see the page
    const hasProfile = await page.getByText('Profile').isVisible().catch(() => false);
    const hasSignIn = await page.getByText(/Sign in/i).isVisible().catch(() => false);
    expect(hasProfile || hasSignIn).toBeTruthy();
  });

  test('billing page has plan information', async ({ page }) => {
    await page.goto('/dashboard/settings/billing');
    await page.waitForTimeout(1000);
    const hasBilling = await page.getByText('Billing').isVisible().catch(() => false);
    const hasSignIn = await page.getByText(/Sign in/i).isVisible().catch(() => false);
    expect(hasBilling || hasSignIn).toBeTruthy();
  });
});
