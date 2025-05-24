import { TEST_CONFIG } from './test-config';

const DEMO_URL = `${TEST_CONFIG.API_URL}/demos/generative-ai`;

interface UITestResult {
  testName: string;
  passed: boolean;
  error?: string;
  details?: string;
}

async function checkPageLoads(): Promise<UITestResult> {
  try {
    const response = await fetch(DEMO_URL);
    const html = await response.text();
    
    // Check for key UI elements
    const hasTextTab = html.includes('Text Generation') || html.includes('text');
    const hasImageTab = html.includes('Image Generation') || html.includes('image');
    const hasGenerateButton = html.includes('Generate') || html.includes('generate');
    
    const passed = response.ok && hasTextTab && hasImageTab && hasGenerateButton;
    
    return {
      testName: 'Page loads with UI elements',
      passed,
      details: `Status: ${response.status}, Text tab: ${hasTextTab}, Image tab: ${hasImageTab}, Button: ${hasGenerateButton}`
    };
  } catch (error) {
    return {
      testName: 'Page loads with UI elements',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function checkAPIEndpoint(): Promise<UITestResult> {
  try {
    const response = await fetch(`${TEST_CONFIG.API_URL}/api/generative-ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'UI test',
        type: 'text',
        maxTokens: 10
      })
    });
    
    const data = await response.json();
    
    // API should respond (even with error for missing API key)
    const passed = response.status === 200 || response.status === 400 || response.status === 401;
    
    return {
      testName: 'API endpoint accessible',
      passed,
      details: `Status: ${response.status}, Has response: ${!!data}`
    };
  } catch (error) {
    return {
      testName: 'API endpoint accessible',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function simulateUserFlow(): Promise<UITestResult[]> {
  const results: UITestResult[] = [];
  
  console.log('\n🔄 Simulating user flow...');
  
  // Test 1: Text generation flow
  const textGenResult = await (async () => {
    try {
      const response = await fetch(`${TEST_CONFIG.API_URL}/api/generative-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Write a test haiku',
          type: 'text',
          temperature: 0.7,
          maxTokens: 50
        })
      });
      
      const data = await response.json();
      const hasText = data.text && typeof data.text === 'string';
      
      return {
        testName: 'Text generation user flow',
        passed: response.ok && hasText,
        details: hasText ? 'Text generated successfully' : 'No text in response'
      };
    } catch (error) {
      return {
        testName: 'Text generation user flow',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  })();
  
  results.push(textGenResult);
  
  // Test 2: Image generation flow
  const imageGenResult = await (async () => {
    try {
      const response = await fetch(`${TEST_CONFIG.API_URL}/api/generative-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'A simple test image',
          type: 'image',
          size: '1024x1024',
          negativePrompt: ''
        })
      });
      
      const data = await response.json();
      const hasImage = data.imageUrl && typeof data.imageUrl === 'string';
      
      return {
        testName: 'Image generation user flow',
        passed: response.ok && hasImage,
        details: hasImage ? 'Image URL generated' : 'No image URL in response'
      };
    } catch (error) {
      return {
        testName: 'Image generation user flow',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  })();
  
  results.push(imageGenResult);
  
  // Test 3: Parameter validation flow
  const paramValidationResult = await (async () => {
    try {
      // Test with invalid parameters
      const response = await fetch(`${TEST_CONFIG.API_URL}/api/generative-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: '',
          type: 'text'
        })
      });
      
      const data = await response.json();
      
      // Should reject empty prompt
      return {
        testName: 'Parameter validation',
        passed: !response.ok && data.error,
        details: data.error || 'No error message'
      };
    } catch (error) {
      return {
        testName: 'Parameter validation',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  })();
  
  results.push(paramValidationResult);
  
  return results;
}

async function runTests() {
  console.log('🖥️ Testing UI Integration\n');
  
  const results: UITestResult[] = [];
  
  // Check if demo page loads
  console.log('📄 Checking demo page...');
  const pageLoadResult = await checkPageLoads();
  results.push(pageLoadResult);
  console.log(`${pageLoadResult.passed ? '✅' : '❌'} ${pageLoadResult.testName}`);
  if (pageLoadResult.details) {
    console.log(`   ${pageLoadResult.details}`);
  }
  
  // Check API endpoint
  console.log('\n🔌 Checking API endpoint...');
  const apiResult = await checkAPIEndpoint();
  results.push(apiResult);
  console.log(`${apiResult.passed ? '✅' : '❌'} ${apiResult.testName}`);
  if (apiResult.details) {
    console.log(`   ${apiResult.details}`);
  }
  
  // Simulate user flows
  const userFlowResults = await simulateUserFlow();
  results.push(...userFlowResults);
  
  userFlowResults.forEach(result => {
    console.log(`${result.passed ? '✅' : '❌'} ${result.testName}`);
    if (result.details) {
      console.log(`   ${result.details}`);
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  // Summary
  console.log('\n📊 UI Integration Test Summary:');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(`   Passed: ${passed}/${results.length}`);
  console.log(`   Failed: ${failed}/${results.length}`);
  
  // Recommendations
  if (failed > 0) {
    console.log('\n💡 Recommendations:');
    if (!pageLoadResult.passed) {
      console.log('   - Ensure the demo page is accessible at /demos/generative-ai');
    }
    if (!apiResult.passed) {
      console.log('   - Check that the API route is properly configured');
    }
    
    const failedFlows = userFlowResults.filter(r => !r.passed);
    if (failedFlows.length > 0) {
      console.log('   - Review API implementation for proper request handling');
    }
  }
  
  return results;
}

// Run tests if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

export { runTests, checkPageLoads, checkAPIEndpoint };