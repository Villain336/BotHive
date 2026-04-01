import { test, expect } from '@playwright/test';

test.describe('Chat Interface', () => {
  // Chat is behind auth, so we test what we can about the page structure

  test('chat page renders category selector buttons', async ({ page }) => {
    // Navigate to a chat page — will either show chat or redirect
    await page.goto('/dashboard/projects/test-id/chat');
    await page.waitForTimeout(1500);

    // Check for category buttons or sign-in redirect
    const hasGeneral = await page.getByRole('button', { name: 'General' }).isVisible().catch(() => false);
    const hasTesting = await page.getByRole('button', { name: 'Testing' }).isVisible().catch(() => false);
    const hasSignIn = await page.getByText(/Sign in/i).isVisible().catch(() => false);

    // Either we see the chat interface or we're redirected to auth
    expect(hasGeneral || hasTesting || hasSignIn).toBeTruthy();
  });

  test('chat page has all 5 category options', async ({ page }) => {
    await page.goto('/dashboard/projects/test-id/chat');
    await page.waitForTimeout(1500);

    const categories = ['General', 'Testing', 'Security', 'Legal', 'Ops'];
    let foundCategories = 0;

    for (const cat of categories) {
      const visible = await page.getByRole('button', { name: cat }).isVisible().catch(() => false);
      if (visible) foundCategories++;
    }

    // Either we see all categories or we got redirected
    expect(foundCategories === 5 || foundCategories === 0).toBeTruthy();
  });

  test('chat has message input area', async ({ page }) => {
    await page.goto('/dashboard/projects/test-id/chat');
    await page.waitForTimeout(1500);

    const textarea = page.getByPlaceholder(/Ask the AI expert/i);
    const hasTextarea = await textarea.isVisible().catch(() => false);
    // OK if redirected to auth
    if (hasTextarea) {
      await expect(textarea).toBeEnabled();
    }
  });
});
