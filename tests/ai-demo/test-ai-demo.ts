import { test, expect } from '@playwright/test';

test.describe('AI Demo Page', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('http://localhost:3000/ai-demo');
    
    // Check for the main heading
    await expect(page.locator('h1')).toContainText('AI Vision Studio');
    
    // Check for the particle background
    await expect(page.locator('canvas')).toBeVisible();
    
    // Check for the AI showcase component
    await expect(page.locator('text=Experience the power of cutting-edge AI models')).toBeVisible();
  });
  
  test('should display feature pills', async ({ page }) => {
    await page.goto('http://localhost:3000/ai-demo');
    
    // Check for feature pills
    await expect(page.locator('text=Lightning Fast')).toBeVisible();
    await expect(page.locator('text=Multi-Provider')).toBeVisible();
    await expect(page.locator('text=State-of-the-Art')).toBeVisible();
  });
  
  test('should show AI showcase components', async ({ page }) => {
    await page.goto('http://localhost:3000/ai-demo');
    
    // Wait for the showcase to load
    await page.waitForTimeout(1000);
    
    // Check for upload zone
    const uploadZone = page.locator('text=Drag & drop an image here');
    await expect(uploadZone).toBeVisible();
    
    // Check for demo selector
    await expect(page.locator('text=Select Demo')).toBeVisible();
    
    // Check for provider selector
    await expect(page.locator('text=Select AI Provider')).toBeVisible();
  });
});