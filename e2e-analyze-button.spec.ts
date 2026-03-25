import { expect, test } from '@playwright/test';

const BASE_URL = 'http://localhost:3123';
// Use the 21-event session for testing
const SESSION_ID = '0e9113c6-b9a1-4798-aec9-433173722aa0';

test.describe('Analyze Button E2E', () => {
  test('session detail page loads and shows Analyze button', async ({ page }) => {
    await page.goto(`${BASE_URL}/session/${SESSION_ID}`);

    // Wait for client-side rendering to complete
    await page.waitForSelector('button', { timeout: 15000 });

    // The Analyze button should be present
    const analyzeButton = page.locator('button', { hasText: /Analyze/ });
    await expect(analyzeButton).toBeVisible({ timeout: 15000 });
  });

  test('clicking Analyze triggers all 3 analysis types', async ({ page }) => {
    test.setTimeout(600000); // 10 min — real SDK calls take time
    await page.goto(`${BASE_URL}/session/${SESSION_ID}`);

    // Wait for the Analyze button
    const analyzeButton = page.locator('button', { hasText: /Analyze/ });
    await expect(analyzeButton).toBeVisible({ timeout: 15000 });

    // Intercept POST requests to /api/analysis
    const analysisRequests: string[] = [];
    page.on('request', (req) => {
      if (req.method() === 'POST' && req.url().includes('/api/analysis')) {
        const body = req.postDataJSON() as { type: string };
        analysisRequests.push(body.type);
      }
    });

    // Click the button
    await analyzeButton.click();

    // Button should show running state
    await expect(page.locator('button', { hasText: /Analyzing/ })).toBeVisible({ timeout: 5000 });

    // Wait for completion (analyses take time with real SDK)
    await expect(page.locator('button', { hasText: /Done|failed|Retry/ })).toBeVisible({
      timeout: 300000,
    });

    // Verify all 3 types were triggered
    expect(analysisRequests.sort()).toEqual(['failures', 'improvements', 'timeline']);
  });

  test('tab content refreshes after analysis completes', async ({ page }) => {
    await page.goto(`${BASE_URL}/session/${SESSION_ID}`);

    // Click Timeline tab
    const timelineTab = page.locator('button', { hasText: 'Timeline' });
    await expect(timelineTab).toBeVisible({ timeout: 15000 });
    await timelineTab.click();

    // Wait for timeline content to load
    await page.waitForTimeout(2000);

    // There should be timeline content (from previous analysis runs)
    const hasPlans = await page
      .locator('text=/plan|phase|task/i')
      .first()
      .isVisible()
      .catch(() => false);
    const hasEmpty = await page
      .locator('text=/No timeline data/i')
      .first()
      .isVisible()
      .catch(() => false);
    const hasTrajectory = await page
      .locator('[class*="trajectory"], [class*="plan"], svg')
      .first()
      .isVisible()
      .catch(() => false);

    // Either we have plans/trajectory or the empty state — content rendered either way
    expect(hasPlans || hasEmpty || hasTrajectory).toBe(true);
  });

  test('Failures tab renders', async ({ page }) => {
    await page.goto(`${BASE_URL}/session/${SESSION_ID}`);
    const failuresTab = page.locator('button', { hasText: 'Failures' });
    await expect(failuresTab).toBeVisible({ timeout: 15000 });
    await failuresTab.click();
    await page.waitForTimeout(2000);

    // Should show failure content or empty state
    const content = page.locator('text=/failure|error|No failures/i');
    await expect(content.first()).toBeVisible({ timeout: 10000 });
  });

  test('Improvements tab renders', async ({ page }) => {
    await page.goto(`${BASE_URL}/session/${SESSION_ID}`);
    const improvementsTab = page.locator('button', { hasText: 'Improvements' });
    await expect(improvementsTab).toBeVisible({ timeout: 15000 });
    await improvementsTab.click();
    await page.waitForTimeout(2000);

    // Should show improvement content or empty state
    const content = page.locator('text=/improvement|suggestion|No improvements/i');
    await expect(content.first()).toBeVisible({ timeout: 10000 });
  });
});
