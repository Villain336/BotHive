import { test, expect } from '@playwright/test';

test.describe('Pricing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pricing');
  });

  test('renders page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Simple, transparent pricing/i })).toBeVisible();
  });

  test('renders all 4 plan cards', async ({ page }) => {
    await expect(page.getByText('Trial')).toBeVisible();
    await expect(page.getByText('Starter')).toBeVisible();
    await expect(page.getByText('Pro')).toBeVisible();
    await expect(page.getByText('Team')).toBeVisible();
  });

  test('displays correct prices', async ({ page }) => {
    await expect(page.getByText('$0')).toBeVisible();
    await expect(page.getByText('$29')).toBeVisible();
    await expect(page.getByText('$79')).toBeVisible();
    await expect(page.getByText('$199')).toBeVisible();
  });

  test('Pro plan has Most Popular badge', async ({ page }) => {
    await expect(page.getByText('Most Popular')).toBeVisible();
  });

  test('each plan has features listed', async ({ page }) => {
    // Trial features
    await expect(page.getByText(/compliance scans/i)).toBeVisible();
    // Pro features
    await expect(page.getByText(/PR creation/i)).toBeVisible();
    // Team features
    await expect(page.getByText(/Team member management/i)).toBeVisible();
  });

  test('CTA buttons link to sign-up', async ({ page }) => {
    const ctaButtons = page.getByRole('link', { name: /Start Free Trial|Get Started|Go Pro|Contact Sales/i });
    const count = await ctaButtons.count();
    expect(count).toBeGreaterThanOrEqual(4);
    for (let i = 0; i < count; i++) {
      await expect(ctaButtons.nth(i)).toHaveAttribute('href', '/sign-up');
    }
  });

  test('subtitle mentions 14-day free trial', async ({ page }) => {
    await expect(page.getByText(/14-day free trial/i)).toBeVisible();
  });
});
