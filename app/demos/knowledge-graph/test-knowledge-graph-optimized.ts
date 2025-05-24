import { test, expect, chromium } from '@playwright/test';

test.describe('Optimized Knowledge Graph Demo', () => {
  test('should load and display the knowledge graph', async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    // Navigate to the knowledge graph page
    await page.goto('http://localhost:3000/demos/knowledge-graph');

    // Wait for the 3D scene to load
    await page.waitForTimeout(3000);

    // Check if the main title is visible
    await expect(page.locator('h1:has-text("AI Portfolio Knowledge Graph")')).toBeVisible();

    // Check if the canvas element exists (Three.js renders to canvas)
    const canvas = await page.locator('canvas');
    await expect(canvas).toBeVisible();

    // Test performance toggle button
    const perfToggle = await page.locator('button:has-text("Effects:")');
    await expect(perfToggle).toBeVisible();
    
    // Click to toggle effects off
    await perfToggle.click();
    await expect(perfToggle).toContainText('Effects: Off');

    // Click to toggle effects back on
    await perfToggle.click();
    await expect(perfToggle).toContainText('Effects: On');

    // Test performance monitor toggle
    const perfMonitor = await page.locator('button[aria-label*="Activity"]').first();
    if (await perfMonitor.isVisible()) {
      await perfMonitor.click();
      // Should show performance stats
      await expect(page.locator('text=Performance Monitor')).toBeVisible();
    }

    await browser.close();
  });

  test('should handle device capabilities gracefully', async () => {
    // Test with mobile viewport
    const browser = await chromium.launch();
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
    });
    const page = await context.newPage();

    await page.goto('http://localhost:3000/demos/knowledge-graph');
    await page.waitForTimeout(2000);

    // Should show simplified graph or performance mode indicator
    const perfIndicator = await page.locator('text=Performance Mode');
    const simplifiedTitle = await page.locator('text=Simplified view');
    
    // Either performance mode or simplified view should be visible
    const hasOptimization = await perfIndicator.isVisible() || await simplifiedTitle.isVisible();
    expect(hasOptimization).toBeTruthy();

    await browser.close();
  });
});

console.log('Knowledge Graph optimization tests created successfully!');