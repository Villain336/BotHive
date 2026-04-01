import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders hero section with ShipReady branding', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Ship Production-Ready Apps/i })).toBeVisible();
    await expect(page.getByText(/vibe coded the features/i)).toBeVisible();
  });

  test('has Start Free Trial CTA that links to sign-up', async ({ page }) => {
    const cta = page.getByRole('link', { name: /Start Free Trial/i }).first();
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', '/sign-up');
  });

  test('has See Pricing link', async ({ page }) => {
    const pricing = page.getByRole('link', { name: /See Pricing/i });
    await expect(pricing).toBeVisible();
    await expect(pricing).toHaveAttribute('href', '/pricing');
  });

  test('renders 4 compliance area cards', async ({ page }) => {
    await expect(page.getByText('Testing')).toBeVisible();
    await expect(page.getByText('Security')).toBeVisible();
    await expect(page.getByText(/Legal & Privacy/i)).toBeVisible();
    await expect(page.getByText(/Ops & Infra/i)).toBeVisible();
  });

  test('renders how-it-works section with 4 steps', async ({ page }) => {
    await expect(page.getByText('Connect Your Repo')).toBeVisible();
    await expect(page.getByText('Get Your Score')).toBeVisible();
    await expect(page.getByText('Fix with AI')).toBeVisible();
    await expect(page.getByText('Ship with Confidence')).toBeVisible();
  });

  test('renders footer with ShipReady branding', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer.getByText('ShipReady')).toBeVisible();
    await expect(footer.getByText(/All rights reserved/i)).toBeVisible();
  });

  test('navbar has Pricing and About links', async ({ page }) => {
    const nav = page.locator('header');
    await expect(nav.getByRole('link', { name: 'Pricing' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'About' })).toBeVisible();
  });

  test('CTA section at bottom has trial messaging', async ({ page }) => {
    await expect(page.getByText(/14-day free trial/i)).toBeVisible();
    await expect(page.getByText(/No credit card required/i)).toBeVisible();
  });
});
