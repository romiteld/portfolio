import { TEST_CONFIG, TEST_PROMPTS, PARAM_RANGES, ImageGenerationResponse } from './test-config';

const API_URL = `${TEST_CONFIG.API_URL}/api/generative-ai`;

interface TestResult {
  name: string;
  success: boolean;
  error?: string;
  responseTime: number;
  imageUrl?: string;
  imageValid?: boolean;
}

async function validateImageUrl(url: string): Promise<boolean> {
  try {
    // Check if URL is valid
    new URL(url);
    
    // Try to fetch image headers
    const response = await fetch(url, { method: 'HEAD' });
    const contentType = response.headers.get('content-type');
    
    return response.ok && contentType?.startsWith('image/') === true;
  } catch {
    return false;
  }
}

async function testImageGeneration(
  prompt: string,
  size: string = '1024x1024',
  negativePrompt: string = '',
  testName: string
): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        type: 'image',
        size,
        negativePrompt
      }),
      signal: AbortSignal.timeout(TEST_CONFIG.TIMEOUT)
    });
    
    const responseTime = Date.now() - startTime;
    const data: ImageGenerationResponse = await response.json();
    
    if (!response.ok) {
      return {
        name: testName,
        success: false,
        error: data.error || `HTTP ${response.status}`,
        responseTime
      };
    }
    
    if (data.error) {
      return {
        name: testName,
        success: false,
        error: data.error,
        responseTime
      };
    }
    
    if (!data.imageUrl || typeof data.imageUrl !== 'string') {
      return {
        name: testName,
        success: false,
        error: 'Invalid response: missing or invalid imageUrl field',
        responseTime
      };
    }
    
    // Validate the image URL
    const imageValid = await validateImageUrl(data.imageUrl);
    
    return {
      name: testName,
      success: true,
      responseTime,
      imageUrl: data.imageUrl,
      imageValid
    };
    
  } catch (error) {
    return {
      name: testName,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - startTime
    };
  }
}

async function runTests() {
  console.log('🎨 Testing Image Generation Functionality\n');
  
  const results: TestResult[] = [];
  
  // Test basic image generation
  console.log('🖼️ Testing basic prompts...');
  for (const [key, prompt] of Object.entries(TEST_PROMPTS.image)) {
    if (key === 'with_negative' || key === 'edge_cases') continue;
    
    const result = await testImageGeneration(
      prompt as string,
      '1024x1024',
      '',
      `Basic: ${key}`
    );
    
    results.push(result);
    console.log(`${result.success ? '✅' : '❌'} ${result.name} (${result.responseTime}ms)`);
    if (result.imageUrl) {
      console.log(`   Image URL: ${result.imageUrl.substring(0, 50)}...`);
      console.log(`   Image valid: ${result.imageValid ? 'Yes' : 'No'}`);
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  }
  
  // Test with negative prompts
  console.log('\n🚫 Testing negative prompts...');
  const negativeTest = TEST_PROMPTS.image.with_negative;
  const negativeResult = await testImageGeneration(
    negativeTest.prompt,
    '1024x1024',
    negativeTest.negative,
    'With negative prompt'
  );
  results.push(negativeResult);
  console.log(`${negativeResult.success ? '✅' : '❌'} ${negativeResult.name} (${negativeResult.responseTime}ms)`);
  if (negativeResult.error) {
    console.log(`   Error: ${negativeResult.error}`);
  }
  
  // Test different sizes
  console.log('\n📐 Testing different sizes...');
  for (const size of PARAM_RANGES.sizes) {
    const result = await testImageGeneration(
      TEST_PROMPTS.image.simple,
      size,
      '',
      `Size: ${size}`
    );
    
    results.push(result);
    console.log(`${result.success ? '✅' : '❌'} ${result.name} (${result.responseTime}ms)`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  }
  
  // Test edge cases
  console.log('\n⚠️ Testing edge cases...');
  
  // Minimal prompt
  const minimalResult = await testImageGeneration(
    TEST_PROMPTS.image.edge_cases.minimal,
    '1024x1024',
    '',
    'Edge case: minimal prompt'
  );
  results.push(minimalResult);
  console.log(`${minimalResult.success ? '✅' : '❌'} ${minimalResult.name}`);
  
  // Complex negative prompt
  const complexNegative = TEST_PROMPTS.image.edge_cases.complex_negative;
  const complexResult = await testImageGeneration(
    complexNegative.prompt,
    '1024x1024',
    complexNegative.negative,
    'Edge case: complex negative'
  );
  results.push(complexResult);
  console.log(`${complexResult.success ? '✅' : '❌'} ${complexResult.name}`);
  
  // Test invalid parameters
  console.log('\n🚫 Testing invalid parameters...');
  
  // Invalid size
  const invalidSizeResult = await testImageGeneration(
    TEST_PROMPTS.image.simple,
    'invalid-size',
    '',
    'Invalid size'
  );
  results.push(invalidSizeResult);
  console.log(`${invalidSizeResult.success ? '✅' : '❌'} ${invalidSizeResult.name}`);
  
  // Empty prompt
  const emptyPromptResult = await testImageGeneration(
    '',
    '1024x1024',
    '',
    'Empty prompt'
  );
  results.push(emptyPromptResult);
  console.log(`${emptyPromptResult.success ? '✅' : '❌'} ${emptyPromptResult.name}`);
  
  // Summary
  console.log('\n📊 Test Summary:');
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const avgResponseTime = results
    .filter(r => r.success)
    .reduce((sum, r) => sum + r.responseTime, 0) / passed || 0;
  
  console.log(`   Passed: ${passed}/${results.length}`);
  console.log(`   Failed: ${failed}/${results.length}`);
  console.log(`   Average response time: ${avgResponseTime.toFixed(0)}ms`);
  
  const validImages = results.filter(r => r.imageValid === true).length;
  console.log(`   Valid images: ${validImages}/${passed}`);
  
  // List failures
  if (failed > 0) {
    console.log('\n❌ Failed tests:');
    results
      .filter(r => !r.success)
      .forEach(r => console.log(`   - ${r.name}: ${r.error}`));
  }
  
  return results;
}

// Run tests if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

export { runTests, testImageGeneration };