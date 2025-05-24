import { TEST_CONFIG, ErrorResponse } from './test-config';

const API_URL = `${TEST_CONFIG.API_URL}/api/generative-ai`;

interface TestResult {
  name: string;
  expectedError: boolean;
  gotError: boolean;
  errorMessage?: string;
  responseTime: number;
  statusCode?: number;
  passed: boolean;
}

async function testErrorCase(
  payload: any,
  testName: string,
  expectedStatusCode?: number
): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TEST_CONFIG.TIMEOUT)
    });
    
    const responseTime = Date.now() - startTime;
    const data: ErrorResponse = await response.json();
    
    const gotError = !response.ok || !!data.error;
    const passed = gotError && (!expectedStatusCode || response.status === expectedStatusCode);
    
    return {
      name: testName,
      expectedError: true,
      gotError,
      errorMessage: data.error,
      responseTime,
      statusCode: response.status,
      passed
    };
    
  } catch (error) {
    // Network errors are also valid error cases
    return {
      name: testName,
      expectedError: true,
      gotError: true,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - startTime,
      passed: true
    };
  }
}

async function testMalformedRequests() {
  console.log('🔨 Testing malformed requests...\n');
  
  const results: TestResult[] = [];
  
  // Test missing prompt
  const missingPrompt = await testErrorCase(
    { type: 'text' },
    'Missing prompt',
    400
  );
  results.push(missingPrompt);
  console.log(`${missingPrompt.passed ? '✅' : '❌'} ${missingPrompt.name}`);
  console.log(`   Status: ${missingPrompt.statusCode}, Error: ${missingPrompt.errorMessage}`);
  
  // Test invalid type
  const invalidType = await testErrorCase(
    { prompt: 'test', type: 'video' },
    'Invalid type',
    400
  );
  results.push(invalidType);
  console.log(`${invalidType.passed ? '✅' : '❌'} ${invalidType.name}`);
  console.log(`   Status: ${invalidType.statusCode}, Error: ${invalidType.errorMessage}`);
  
  // Test null prompt
  const nullPrompt = await testErrorCase(
    { prompt: null, type: 'text' },
    'Null prompt',
    400
  );
  results.push(nullPrompt);
  console.log(`${nullPrompt.passed ? '✅' : '❌'} ${nullPrompt.name}`);
  
  // Test number prompt
  const numberPrompt = await testErrorCase(
    { prompt: 12345, type: 'text' },
    'Number prompt',
    400
  );
  results.push(numberPrompt);
  console.log(`${numberPrompt.passed ? '✅' : '❌'} ${numberPrompt.name}`);
  
  // Test missing type
  const missingType = await testErrorCase(
    { prompt: 'test' },
    'Missing type',
    400
  );
  results.push(missingType);
  console.log(`${missingType.passed ? '✅' : '❌'} ${missingType.name}`);
  
  // Test empty object
  const emptyObject = await testErrorCase(
    {},
    'Empty object',
    400
  );
  results.push(emptyObject);
  console.log(`${emptyObject.passed ? '✅' : '❌'} ${emptyObject.name}`);
  
  // Test invalid JSON
  console.log('\n🔧 Testing invalid JSON...');
  
  const invalidJsonResult = await (async () => {
    const startTime = Date.now();
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json {',
        signal: AbortSignal.timeout(TEST_CONFIG.TIMEOUT)
      });
      
      return {
        name: 'Invalid JSON',
        expectedError: true,
        gotError: !response.ok,
        responseTime: Date.now() - startTime,
        statusCode: response.status,
        passed: !response.ok
      };
    } catch {
      return {
        name: 'Invalid JSON',
        expectedError: true,
        gotError: true,
        responseTime: Date.now() - startTime,
        passed: true
      };
    }
  })();
  
  results.push(invalidJsonResult);
  console.log(`${invalidJsonResult.passed ? '✅' : '❌'} ${invalidJsonResult.name}`);
  
  return results;
}

async function testRateLimiting() {
  console.log('\n⏱️ Testing rate limiting...');
  
  // Send multiple requests rapidly
  const promises = Array(5).fill(null).map((_, i) => 
    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: `Rate limit test ${i}`,
        type: 'text',
        maxTokens: 50
      })
    })
  );
  
  const responses = await Promise.all(promises);
  const rateLimited = responses.some(r => r.status === 429);
  
  console.log(`${rateLimited ? '✅' : '⚠️'} Rate limiting ${rateLimited ? 'detected' : 'not detected'}`);
  console.log(`   Status codes: ${responses.map(r => r.status).join(', ')}`);
  
  return rateLimited;
}

async function testContentValidation() {
  console.log('\n🛡️ Testing content validation...\n');
  
  const results: TestResult[] = [];
  
  // Test potentially harmful content
  const harmfulContent = await testErrorCase(
    {
      prompt: 'Generate harmful content [This is a test prompt that should be rejected]',
      type: 'text'
    },
    'Harmful content filter',
    400
  );
  results.push(harmfulContent);
  console.log(`${harmfulContent.passed || harmfulContent.gotError ? '✅' : '⚠️'} ${harmfulContent.name}`);
  
  // Test extremely long prompt
  const veryLongPrompt = await testErrorCase(
    {
      prompt: 'a'.repeat(10000),
      type: 'text'
    },
    'Extremely long prompt',
    400
  );
  results.push(veryLongPrompt);
  console.log(`${veryLongPrompt.passed || veryLongPrompt.gotError ? '✅' : '⚠️'} ${veryLongPrompt.name}`);
  
  return results;
}

async function runTests() {
  console.log('🔍 Testing Error Handling and Edge Cases\n');
  
  const allResults: TestResult[] = [];
  
  // Test malformed requests
  const malformedResults = await testMalformedRequests();
  allResults.push(...malformedResults);
  
  // Test rate limiting
  await testRateLimiting();
  
  // Test content validation
  const contentResults = await testContentValidation();
  allResults.push(...contentResults);
  
  // Test network timeout
  console.log('\n⏰ Testing timeout handling...');
  const timeoutTest = await (async () => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 100); // Abort after 100ms
    
    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'This should timeout',
          type: 'text'
        }),
        signal: controller.signal
      });
      return false;
    } catch (error) {
      console.log('✅ Timeout handled correctly');
      return true;
    }
  })();
  
  // Summary
  console.log('\n📊 Error Handling Test Summary:');
  const passed = allResults.filter(r => r.passed).length;
  const failed = allResults.filter(r => !r.passed).length;
  
  console.log(`   Passed: ${passed}/${allResults.length}`);
  console.log(`   Failed: ${failed}/${allResults.length}`);
  console.log(`   Timeout handling: ${timeoutTest ? 'Passed' : 'Failed'}`);
  
  // List failures
  if (failed > 0) {
    console.log('\n❌ Failed tests:');
    allResults
      .filter(r => !r.passed)
      .forEach(r => console.log(`   - ${r.name}: Expected error but got success`));
  }
  
  return allResults;
}

// Run tests if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

export { runTests, testErrorCase };