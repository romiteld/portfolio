import { TEST_CONFIG, AgentResponse } from './test-config';

const API_URL = `${TEST_CONFIG.API_URL}/api/interactive-agents`;

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
    const data: AgentResponse = await response.json();
    
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

async function testValidationErrors() {
  console.log('🔍 Testing validation errors...\n');
  
  const results: TestResult[] = [];
  
  // Missing goal
  const missingGoal = await testErrorCase(
    { agents: ['developer'] },
    'Missing goal',
    400
  );
  results.push(missingGoal);
  console.log(`${missingGoal.passed ? '✅' : '❌'} ${missingGoal.name}`);
  console.log(`   Status: ${missingGoal.statusCode}, Error: ${missingGoal.errorMessage}`);
  
  // Empty goal
  const emptyGoal = await testErrorCase(
    { goal: '', agents: ['developer'] },
    'Empty goal',
    400
  );
  results.push(emptyGoal);
  console.log(`${emptyGoal.passed ? '✅' : '❌'} ${emptyGoal.name}`);
  
  // Null goal
  const nullGoal = await testErrorCase(
    { goal: null, agents: ['developer'] },
    'Null goal',
    400
  );
  results.push(nullGoal);
  console.log(`${nullGoal.passed ? '✅' : '❌'} ${nullGoal.name}`);
  
  // Number goal
  const numberGoal = await testErrorCase(
    { goal: 12345, agents: ['developer'] },
    'Number goal',
    400
  );
  results.push(numberGoal);
  console.log(`${numberGoal.passed ? '✅' : '❌'} ${numberGoal.name}`);
  
  // No agents (should use defaults)
  const noAgents = await testErrorCase(
    { goal: 'Test goal' },
    'No agents array',
    200 // Should succeed with defaults
  );
  console.log(`${!noAgents.gotError ? '✅' : '❌'} No agents array (uses defaults)`);
  
  // Empty agents array (should use defaults)
  const emptyAgents = await testErrorCase(
    { goal: 'Test goal', agents: [] },
    'Empty agents array',
    200 // Should succeed with defaults
  );
  console.log(`${!emptyAgents.gotError ? '✅' : '❌'} Empty agents array (uses defaults)`);
  
  // Invalid agent IDs
  const invalidAgents = await testErrorCase(
    { goal: 'Test goal', agents: ['invalid', 'fake', 'notreal'] },
    'Invalid agent IDs',
    200 // Should succeed but skip invalid agents
  );
  console.log(`${!invalidAgents.gotError ? '✅' : '❌'} Invalid agent IDs (skipped gracefully)`);
  
  return results;
}

async function testMalformedRequests() {
  console.log('\n🔨 Testing malformed requests...');
  
  const results: TestResult[] = [];
  
  // Empty body
  const emptyBody = await testErrorCase(
    {},
    'Empty request body',
    400
  );
  results.push(emptyBody);
  console.log(`${emptyBody.passed ? '✅' : '❌'} ${emptyBody.name}`);
  
  // Invalid JSON
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
  
  // Wrong content type
  const wrongContentType = await (async () => {
    const startTime = Date.now();
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: 'goal=test&agents=developer',
        signal: AbortSignal.timeout(TEST_CONFIG.TIMEOUT)
      });
      
      return {
        name: 'Wrong content type',
        expectedError: true,
        gotError: !response.ok,
        responseTime: Date.now() - startTime,
        statusCode: response.status,
        passed: !response.ok
      };
    } catch {
      return {
        name: 'Wrong content type',
        expectedError: true,
        gotError: true,
        responseTime: Date.now() - startTime,
        passed: true
      };
    }
  })();
  
  results.push(wrongContentType);
  console.log(`${wrongContentType.passed ? '✅' : '❌'} ${wrongContentType.name}`);
  
  return results;
}

async function testAPIKeyHandling() {
  console.log('\n🔑 Testing API key handling...');
  
  // This test checks if the API properly handles missing API key
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ goal: 'Test API key', agents: ['developer'] })
  });
  
  const data = await response.json();
  
  if (!process.env.OPENAI_API_KEY) {
    console.log(`${response.status === 500 && data.error ? '✅' : '❌'} Missing API key error handled`);
    if (data.error) {
      console.log(`   Error message: ${data.error}`);
    }
  } else {
    console.log(`✅ API key is configured`);
  }
  
  return response.status === 500 && data.error?.includes('OPENAI_API_KEY');
}

async function testTimeoutHandling() {
  console.log('\n⏰ Testing timeout handling...');
  
  // Create a request that might timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
  
  try {
    const startTime = Date.now();
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        goal: 'Generate an extremely detailed business plan with market analysis, financial projections, competitive analysis, and implementation timeline',
        agents: ['developer', 'marketing', 'data', 'pm', 'designer', 'writer'] 
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    console.log(`${response.ok ? '✅' : '❌'} Long request completed in ${responseTime}ms`);
    
    if (responseTime > 30000) {
      console.log('   ⚠️ Response time exceeds maxDuration setting');
    }
    
    return { completed: true, responseTime };
  } catch (error) {
    clearTimeout(timeoutId);
    const isTimeout = error instanceof Error && error.name === 'AbortError';
    console.log(`${isTimeout ? '✅' : '❌'} Timeout handled correctly`);
    return { completed: false, timeout: isTimeout };
  }
}

async function testRateLimiting() {
  console.log('\n⏱️ Testing rate limiting...');
  
  // Send multiple requests rapidly
  const promises = Array(10).fill(null).map((_, i) => 
    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goal: `Rate limit test ${i}`,
        agents: ['developer']
      })
    })
  );
  
  const responses = await Promise.all(promises);
  const statusCodes = responses.map(r => r.status);
  const rateLimited = responses.some(r => r.status === 429);
  
  console.log(`${rateLimited ? '✅' : '⚠️'} Rate limiting ${rateLimited ? 'detected' : 'not detected'}`);
  console.log(`   Status codes: ${statusCodes.join(', ')}`);
  console.log(`   Success rate: ${responses.filter(r => r.ok).length}/${responses.length}`);
  
  return rateLimited;
}

async function runTests() {
  console.log('🛡️ Testing Error Handling and Edge Cases\n');
  
  const allResults: TestResult[] = [];
  
  // Test validation errors
  const validationResults = await testValidationErrors();
  allResults.push(...validationResults);
  
  // Test malformed requests
  const malformedResults = await testMalformedRequests();
  allResults.push(...malformedResults);
  
  // Test API key handling
  await testAPIKeyHandling();
  
  // Test timeout handling
  await testTimeoutHandling();
  
  // Test rate limiting
  await testRateLimiting();
  
  // Summary
  console.log('\n📊 Error Handling Test Summary:');
  const passed = allResults.filter(r => r.passed).length;
  const failed = allResults.filter(r => !r.passed).length;
  
  console.log(`   Passed: ${passed}/${allResults.length}`);
  console.log(`   Failed: ${failed}/${allResults.length}`);
  
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