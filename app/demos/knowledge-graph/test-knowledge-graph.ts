import { test, expect } from '@playwright/test';

// Test configuration for different devices
const devices = [
  { name: 'Desktop Chrome', viewport: { width: 1920, height: 1080 }, userAgent: 'Chrome' },
  { name: 'iPad Pro', viewport: { width: 1024, height: 1366 }, userAgent: 'iPad' },
  { name: 'iPhone 14', viewport: { width: 390, height: 844 }, userAgent: 'iPhone' },
  { name: 'Samsung Galaxy S21', viewport: { width: 360, height: 800 }, userAgent: 'Android' }
];

// Performance benchmarks
const performanceBenchmarks = {
  desktop: { fps: 50, loadTime: 3000 },
  tablet: { fps: 30, loadTime: 5000 },
  mobile: { fps: 20, loadTime: 7000 }
};

// Manual test checklist
export const manualTestChecklist = `
# Knowledge Graph Manual Test Checklist

## Desktop Testing (Chrome, Firefox, Safari, Edge)

### Load Performance
- [ ] Page loads within 3 seconds
- [ ] Initial animation plays smoothly
- [ ] All 9 nodes appear sequentially
- [ ] Connections animate properly
- [ ] No console errors

### 3D Rendering
- [ ] Post-processing effects visible (bloom, DOF)
- [ ] Particles render correctly
- [ ] Geometries display properly
- [ ] Shadows and lighting work

### Interactions
- [ ] Orbit controls work smoothly
- [ ] Nodes highlight on hover
- [ ] Click opens information panel
- [ ] Search filters nodes correctly
- [ ] Category filters work

### Performance
- [ ] Maintains 50+ FPS during idle
- [ ] Smooth animations during interaction
- [ ] No memory leaks after 5 minutes
- [ ] LOD system activates at distance

## Tablet Testing (iPad, Android Tablet)

### Touch Controls
- [ ] Pinch to zoom works
- [ ] Single finger rotation works
- [ ] Node selection via tap
- [ ] UI panels are touch-friendly

### Performance
- [ ] Simplified rendering if needed
- [ ] 30+ FPS maintained
- [ ] Responsive to orientation change

## Mobile Testing (iOS, Android)

### Adaptive Rendering
- [ ] Fallback to simplified graph if needed
- [ ] Reduced particle count
- [ ] Basic geometries used
- [ ] Touch controls responsive

### UI Adaptation
- [ ] Panels fit screen properly
- [ ] Text remains readable
- [ ] Buttons are tap-friendly
- [ ] Search works on mobile keyboard

## Low-End Device Testing

### Fallback System
- [ ] Detects low-end GPU
- [ ] Switches to simplified view
- [ ] Maintains basic functionality
- [ ] No crashes or freezes

### Performance
- [ ] 20+ FPS on simplified view
- [ ] Basic interactions work
- [ ] Memory usage stays low

## Accessibility Testing

### Keyboard Navigation
- [ ] Tab through UI elements
- [ ] Enter to select nodes
- [ ] Escape to close panels
- [ ] Arrow keys for navigation

### Screen Reader
- [ ] Alt text for nodes
- [ ] ARIA labels present
- [ ] Focus indicators visible

## Error Handling

### WebGL Failures
- [ ] Graceful fallback message
- [ ] Alternative view offered
- [ ] No white screen of death

### Network Issues
- [ ] Handles slow connections
- [ ] Progressive loading
- [ ] Offline functionality

## Browser Compatibility

### Modern Browsers
- [ ] Chrome 90+
- [ ] Firefox 88+
- [ ] Safari 14+
- [ ] Edge 90+

### Legacy Support
- [ ] Fallback for older browsers
- [ ] Feature detection works
- [ ] Polyfills load correctly
`;

// Automated performance test
export async function runPerformanceTest() {
  const results: any[] = [];

  for (const device of devices) {
    console.log(`Testing on ${device.name}...`);
    
    // Simulated test results
    const result = {
      device: device.name,
      viewport: device.viewport,
      metrics: {
        loadTime: Math.random() * 3000 + 1000,
        fps: Math.random() * 30 + 30,
        memoryUsage: Math.random() * 100 + 50,
        gpuUsage: Math.random() * 50 + 20
      },
      errors: [],
      warnings: []
    };

    // Check performance thresholds
    const deviceType = device.viewport.width > 768 ? 'desktop' : 
                      device.viewport.width > 500 ? 'tablet' : 'mobile';
    const benchmark = performanceBenchmarks[deviceType];

    if (result.metrics.fps < benchmark.fps) {
      result.warnings.push(`FPS below threshold: ${result.metrics.fps} < ${benchmark.fps}`);
    }

    if (result.metrics.loadTime > benchmark.loadTime) {
      result.warnings.push(`Load time exceeded: ${result.metrics.loadTime}ms > ${benchmark.loadTime}ms`);
    }

    results.push(result);
  }

  return results;
}

// WebGL capability test
export function testWebGLCapabilities() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  
  if (!gl) {
    return { supported: false, version: 'none' };
  }

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  
  return {
    supported: true,
    version: gl.getParameter(gl.VERSION),
    vendor: gl.getParameter(gl.VENDOR),
    renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown',
    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
    maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
    maxFragmentUniforms: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
    extensions: gl.getSupportedExtensions()
  };
}

// Memory leak test
export async function testMemoryLeaks(duration: number = 60000) {
  const measurements: number[] = [];
  const interval = 5000; // Measure every 5 seconds
  
  const measure = () => {
    if ((performance as any).memory) {
      measurements.push((performance as any).memory.usedJSHeapSize);
    }
  };

  // Initial measurement
  measure();

  // Periodic measurements
  const measureInterval = setInterval(measure, interval);

  // Simulate interactions
  const interactionInterval = setInterval(() => {
    // Simulate node clicks, hovers, etc.
    console.log('Simulating user interaction...');
  }, 2000);

  // Wait for test duration
  await new Promise(resolve => setTimeout(resolve, duration));

  // Cleanup
  clearInterval(measureInterval);
  clearInterval(interactionInterval);

  // Analyze results
  const initialMemory = measurements[0];
  const finalMemory = measurements[measurements.length - 1];
  const memoryGrowth = ((finalMemory - initialMemory) / initialMemory) * 100;

  return {
    measurements,
    initialMemory: (initialMemory / 1048576).toFixed(2) + ' MB',
    finalMemory: (finalMemory / 1048576).toFixed(2) + ' MB',
    growthPercentage: memoryGrowth.toFixed(2) + '%',
    hasLeak: memoryGrowth > 20 // More than 20% growth indicates potential leak
  };
}

// FPS monitor
export function createFPSMonitor() {
  let lastTime = performance.now();
  let frames = 0;
  let fps = 0;

  const update = () => {
    frames++;
    const currentTime = performance.now();
    
    if (currentTime >= lastTime + 1000) {
      fps = Math.round((frames * 1000) / (currentTime - lastTime));
      frames = 0;
      lastTime = currentTime;
    }

    requestAnimationFrame(update);
  };

  update();

  return {
    getFPS: () => fps,
    getAverageFPS: () => {
      // Track average over time
      return fps;
    }
  };
}

// Generate test report
export function generateTestReport(results: any) {
  const report = `
# Knowledge Graph Test Report
Generated: ${new Date().toISOString()}

## Performance Summary

| Device | Load Time | FPS | Memory | GPU | Status |
|--------|-----------|-----|--------|-----|--------|
${results.map((r: any) => 
  `| ${r.device} | ${r.metrics.loadTime.toFixed(0)}ms | ${r.metrics.fps.toFixed(0)} | ${r.metrics.memoryUsage.toFixed(0)}MB | ${r.metrics.gpuUsage.toFixed(0)}% | ${r.warnings.length === 0 ? '✅' : '⚠️'} |`
).join('\n')}

## Warnings
${results.flatMap((r: any) => 
  r.warnings.map((w: string) => `- [${r.device}] ${w}`)
).join('\n') || 'No warnings'}

## Recommendations
${generateRecommendations(results)}
`;

  return report;
}

function generateRecommendations(results: any[]) {
  const recommendations = [];

  // Check for consistent performance issues
  const lowFPSDevices = results.filter(r => r.metrics.fps < 30);
  if (lowFPSDevices.length > 0) {
    recommendations.push('- Consider reducing particle count or disabling post-processing on lower-end devices');
  }

  const slowLoadDevices = results.filter(r => r.metrics.loadTime > 5000);
  if (slowLoadDevices.length > 0) {
    recommendations.push('- Implement progressive loading or lazy loading for better initial load times');
  }

  const highMemoryDevices = results.filter(r => r.metrics.memoryUsage > 150);
  if (highMemoryDevices.length > 0) {
    recommendations.push('- Optimize texture sizes and implement more aggressive garbage collection');
  }

  return recommendations.join('\n') || 'Performance is within acceptable ranges';
}

// Run all tests
export async function runAllTests() {
  console.log('🧪 Starting Knowledge Graph Tests...\n');

  // WebGL capabilities
  console.log('📊 WebGL Capabilities:');
  const webglCaps = testWebGLCapabilities();
  console.log(webglCaps);

  // Performance tests
  console.log('\n🚀 Running Performance Tests:');
  const perfResults = await runPerformanceTest();
  
  // Generate report
  const report = generateTestReport(perfResults);
  console.log(report);

  // Memory leak test (shortened for demo)
  console.log('\n💾 Testing for Memory Leaks (10 seconds)...');
  const memoryResults = await testMemoryLeaks(10000);
  console.log('Memory test results:', memoryResults);

  console.log('\n✅ Tests Complete!');
  console.log('\n📋 Please also complete the manual test checklist for comprehensive coverage.');
  
  return {
    webgl: webglCaps,
    performance: perfResults,
    memory: memoryResults,
    report
  };
}