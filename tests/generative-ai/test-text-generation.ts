import { TEST_CONFIG, TEST_PROMPTS, PARAM_RANGES, TextGenerationResponse } from './test-config';

const API_URL = `${TEST_CONFIG.API_URL}/api/generative-ai`;

interface TestResult {
  name: string;
  success: boolean;
  error?: string;
  responseTime: number;
  responseLength?: number;
}

async function testTextGeneration(
  prompt: string,
  temperature: number = 1,
  maxTokens: number = 200,
  testName: string
): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        type: 'text',
        temperature,
        maxTokens
      }),
      signal: AbortSignal.timeout(TEST_CONFIG.TIMEOUT)
    });
    
    const responseTime = Date.now() - startTime;
    const data: TextGenerationResponse = await response.json();
    
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
    
    if (!data.text || typeof data.text !== 'string') {
      return {
        name: testName,
        success: false,
        error: 'Invalid response: missing or invalid text field',
        responseTime
      };
    }
    
    return {
      name: testName,
      success: true,
      responseTime,
      responseLength: data.text.length
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
  console.log('🧪 Testing Text Generation Functionality\n');
  
  const results: TestResult[] = [];
  
  // Test basic text generation
  console.log('📝 Testing basic prompts...');
  for (const [key, prompt] of Object.entries(TEST_PROMPTS.text)) {
    if (key === 'edge_cases') continue;
    
    const result = await testTextGeneration(
      prompt as string,
      0.7,
      200,
      `Basic: ${key}`
    );
    
    results.push(result);
    console.log(`${result.success ? '✅' : '❌'} ${result.name} (${result.responseTime}ms)`);
    if (result.responseLength) {
      console.log(`   Generated ${result.responseLength} characters`);
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  }
  
  // Test temperature variations
  console.log('\n🌡️ Testing temperature variations...');
  for (const temp of PARAM_RANGES.temperature.test_values) {
    const result = await testTextGeneration(
      TEST_PROMPTS.text.simple,
      temp,
      200,
      `Temperature: ${temp}`
    );
    
    results.push(result);
    console.log(`${result.success ? '✅' : '❌'} ${result.name} (${result.responseTime}ms)`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  }
  
  // Test max tokens variations
  console.log('\n📏 Testing max tokens variations...');
  for (const tokens of PARAM_RANGES.maxTokens.test_values) {
    const result = await testTextGeneration(
      TEST_PROMPTS.text.complex,
      0.7,
      tokens,
      `Max Tokens: ${tokens}`
    );
    
    results.push(result);
    console.log(`${result.success ? '✅' : '❌'} ${result.name} (${result.responseTime}ms)`);
    if (result.responseLength) {
      console.log(`   Generated ${result.responseLength} characters`);
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  }
  
  // Test edge cases
  console.log('\n⚠️ Testing edge cases...');
  for (const [key, prompt] of Object.entries(TEST_PROMPTS.text.edge_cases)) {
    const result = await testTextGeneration(
      prompt,
      0.7,
      200,
      `Edge case: ${key}`
    );
    
    results.push(result);
    console.log(`${result.success ? '✅' : '❌'} ${result.name} (${result.responseTime}ms)`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  }
  
  // Test invalid parameters
  console.log('\n🚫 Testing invalid parameters...');
  
  // Invalid temperature
  const invalidTempResult = await testTextGeneration(
    TEST_PROMPTS.text.simple,
    -1, // Invalid temperature
    200,
    'Invalid temperature (-1)'
  );
  results.push(invalidTempResult);
  console.log(`${invalidTempResult.success ? '✅' : '❌'} ${invalidTempResult.name}`);
  
  // Invalid max tokens
  const invalidTokensResult = await testTextGeneration(
    TEST_PROMPTS.text.simple,
    0.7,
    -50, // Invalid max tokens
    'Invalid max tokens (-50)'
  );
  results.push(invalidTokensResult);
  console.log(`${invalidTokensResult.success ? '✅' : '❌'} ${invalidTokensResult.name}`);
  
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

export { runTests, testTextGeneration };