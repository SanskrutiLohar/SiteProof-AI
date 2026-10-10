import { test, expect } from '@playwright/test';

test.describe('SiteProof AI Initial End-to-End Suite', () => {

  test.beforeEach(async ({ page, context }) => {
    // Clear any local storage session before each test to ensure a clean unauthenticated state
    await context.clearCookies();
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('1. The application loads successfully', async ({ page }) => {
    await page.goto('/');

    // Verify page title and primary branding heading
    await expect(page).toHaveTitle(/SiteProof AI/i);
    const mainHeading = page.getByRole('heading', { name: /SiteProof/i });
    await expect(mainHeading).toBeVisible();

    // Verify platform description/tagline is present
    await expect(page.getByText(/Construction Milestone Verification/i)).toBeVisible();
  });

  test('2. An unauthenticated visitor can reach the login page', async ({ page }) => {
    await page.goto('/login');

    // Verify URL resolves to login or root auth
    await expect(page).toHaveURL(/\/login|\/$/);

    // Verify key auth UI containers are rendered
    await expect(page.getByRole('heading', { name: /Select Workspace Role/i })).toBeVisible();
  });

  test('3. Protected routes redirect unauthenticated visitors appropriately', async ({ page }) => {
    // 3a. Admin Dashboard route protection
    await page.goto('/admin/dashboard');
    // Should be redirected away from protected admin dashboard to login or root
    await expect(page).not.toHaveURL(/\/admin\/dashboard/);
    await expect(page.getByRole('heading', { name: /Select Workspace Role/i })).toBeVisible();

    // 3b. Contractor Dashboard route protection
    await page.goto('/contractor/dashboard');
    await expect(page).not.toHaveURL(/\/contractor\/dashboard/);
    await expect(page.getByRole('heading', { name: /Select Workspace Role/i })).toBeVisible();

    // 3c. Deep protected verification route
    await page.goto('/admin/verify/m-nsk-01');
    await expect(page).not.toHaveURL(/\/admin\/verify/);
  });

  test('4. The login page displays the expected demo persona options', async ({ page }) => {
    await page.goto('/login');

    // Inspector persona button & details
    const inspectorButton = page.getByRole('button', { name: /David Vance/i });
    await expect(inspectorButton).toBeVisible();
    await expect(page.getByText(/David Vance/i)).toBeVisible();

    // Contractor persona button & details
    const contractorButton = page.getByRole('button', { name: /Rajesh Kumar/i });
    await expect(contractorButton).toBeVisible();
    await expect(page.getByText(/Rajesh Kumar/i)).toBeVisible();
  });

  test('5. Basic navigation works where it can be tested without real credentials', async ({ page }) => {
    await page.goto('/login');

    // Test expanding/collapsing the credentials form without submitting real data
    const toggleCredentialsButton = page.getByRole('button', { name: /sign in with email & password|credentials form/i });
    await expect(toggleCredentialsButton).toBeVisible();

    // Click to reveal email/password form
    await toggleCredentialsButton.click();
    const registerTab = page.getByRole('button', { name: /Register/i });
    await expect(registerTab).toBeVisible();

    // Switch to Register tab
    await registerTab.click();
    await expect(page.getByPlaceholder(/Your full name/i)).toBeVisible();
    await expect(page.getByPlaceholder(/Organization name/i)).toBeVisible();

    // Switch back to Sign In tab (using first matching button for tab)
    await page.getByRole('button', { name: 'Sign In' }).first().click();
    await expect(page.getByPlaceholder(/Your full name/i)).not.toBeVisible();

    // Click to collapse
    await toggleCredentialsButton.click();
  });

});
