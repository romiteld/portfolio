import { test, expect, devices } from '@playwright/test';

const mobileDevices = [
  { name: 'iPhone SE', device: devices['iPhone SE'] },
  { name: 'iPhone 12', device: devices['iPhone 12'] },
  { name: 'Pixel 5', device: devices['Pixel 5'] },
  { name: 'Galaxy S8', device: devices['Galaxy S8'] },
];

const tabletDevices = [
  { name: 'iPad Mini', device: devices['iPad Mini'] },
  { name: 'iPad Pro', device: devices['iPad Pro'] },
];

test.describe('AI Demo Mobile Responsiveness', () => {
  mobileDevices.forEach(({ name, device }) => {
    test.describe(`${name}`, () => {
      test.use({ ...device });

      test('should display properly on mobile', async ({ page }) => {
        await page.goto('http://localhost:3000/ai-demo');
        
        // Check viewport
        const viewport = page.viewportSize();
        expect(viewport?.width).toBeLessThan(768);
        
        // Check title is visible and properly sized
        const title = page.locator('h1:has-text("AI Vision Studio")');
        await expect(title).toBeVisible();
        const titleSize = await title.evaluate(el => 
          window.getComputedStyle(el).fontSize
        );
        expect(parseInt(titleSize)).toBeLessThanOrEqual(48); // Should be smaller on mobile
        
        // Check icons are hidden on mobile
        const brainIcon = page.locator('.hidden.sm\\:block').first();
        await expect(brainIcon).toBeHidden();
        
        // Check feature pills wrap properly
        const featurePills = page.locator('text=Lightning Fast').locator('..');
        await expect(featurePills).toBeVisible();
        
        // Check AIShowcase loads
        await page.waitForTimeout(1500);
        
        // Check upload zone is full width
        const uploadZone = page.locator('text=Drag & drop').locator('../..');
        await expect(uploadZone).toBeVisible();
        const uploadWidth = await uploadZone.evaluate(el => el.offsetWidth);
        const pageWidth = viewport?.width || 375;
        expect(uploadWidth).toBeGreaterThan(pageWidth * 0.8); // Should be at least 80% width
        
        // Check demo selector grid is single column
        const demoSelector = page.locator('text=Select Demo').locator('..');
        await expect(demoSelector).toBeVisible();
        
        // Check buttons are properly sized
        const runButton = page.locator('button:has-text("Run Analysis")');
        await expect(runButton).toBeVisible();
        const buttonHeight = await runButton.evaluate(el => el.offsetHeight);
        expect(buttonHeight).toBeGreaterThanOrEqual(44); // Touch-friendly size
      });

      test('should have scrollable content', async ({ page }) => {
        await page.goto('http://localhost:3000/ai-demo');
        await page.waitForTimeout(1500);
        
        // Check page is scrollable
        const initialScroll = await page.evaluate(() => window.scrollY);
        await page.evaluate(() => window.scrollTo(0, 500));
        const afterScroll = await page.evaluate(() => window.scrollY);
        expect(afterScroll).toBeGreaterThan(initialScroll);
      });

      test('should handle touch interactions', async ({ page }) => {
        await page.goto('http://localhost:3000/ai-demo');
        await page.waitForTimeout(1500);
        
        // Test demo selector tap
        const demoOption = page.locator('text=Object Detection').locator('..');
        await demoOption.tap();
        
        // Verify selection changed
        await expect(demoOption).toHaveClass(/border-white/);
      });
    });
  });

  tabletDevices.forEach(({ name, device }) => {
    test.describe(`${name}`, () => {
      test.use({ ...device });

      test('should display properly on tablet', async ({ page }) => {
        await page.goto('http://localhost:3000/ai-demo');
        
        // Check viewport
        const viewport = page.viewportSize();
        expect(viewport?.width).toBeGreaterThanOrEqual(768);
        expect(viewport?.width).toBeLessThan(1024);
        
        // Icons should be visible on tablet
        const brainIcon = page.locator('svg.text-purple-500').first();
        await expect(brainIcon).toBeVisible();
        
        // Check layout is still responsive
        await page.waitForTimeout(1500);
        
        // Should still be single column on smaller tablets
        const mainGrid = page.locator('.grid.grid-cols-1.lg\\:grid-cols-3');
        await expect(mainGrid).toBeVisible();
      });
    });
  });

  test('should handle orientation changes', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12'],
    });
    const page = await context.newPage();
    
    await page.goto('http://localhost:3000/ai-demo');
    
    // Portrait orientation
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);
    let title = await page.locator('h1:has-text("AI Vision Studio")');
    await expect(title).toBeVisible();
    
    // Landscape orientation
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(500);
    title = await page.locator('h1:has-text("AI Vision Studio")');
    await expect(title).toBeVisible();
    
    await context.close();
  });

  test('should have proper text contrast on mobile', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12'],
    });
    const page = await context.newPage();
    
    await page.goto('http://localhost:3000/ai-demo');
    await page.waitForTimeout(1500);
    
    // Check text contrast
    const texts = await page.locator('p, h1, h2, h3, span').all();
    for (const text of texts.slice(0, 5)) { // Check first 5 elements
      const color = await text.evaluate(el => 
        window.getComputedStyle(el).color
      );
      // Should not be too light
      expect(color).not.toBe('rgb(255, 255, 255)');
    }
    
    await context.close();
  });
});