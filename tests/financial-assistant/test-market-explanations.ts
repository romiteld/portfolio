/**
 * Test Script: Market Explanation Queries
 * Tests "why is the market down/up" type queries
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

interface TestResult {
  testName: string;
  passed: boolean;
  response?: any;
  error?: string;
  duration: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function testMarketExplanation(query: string, shouldHaveMetrics: boolean = true): Promise<TestResult> {
  const startTime = Date.now();
  const testName = `Market Explanation: "${query}"`;
  
  try {
    const response = await fetch(`${API_URL}/api/financial-assistant/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    
    const data = await response.json();
    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      return { testName, passed: false, error: `HTTP ${response.status}`, duration };
    }
    
    // Market explanations typically return general_advice or ai_enhanced_response type
    const validTypes = ['general_advice', 'ai_enhanced_response', 'market_explanation'];
    if (!validTypes.includes(data.type)) {
      return { testName, passed: false, error: `Expected explanation type, got '${data.type}'`, response: data, duration };
    }
    
    // Check if response contains explanation content
    if (!data.summary || data.summary.length < 50) {
      return { testName, passed: false, error: 'Summary too short or missing', response: data, duration };
    }
    
    // Check for market context if metrics expected
    if (shouldHaveMetrics && (!data.key_metrics || Object.keys(data.key_metrics).length === 0)) {
      console.warn(`   ⚠️  No market metrics provided for: "${query}"`);
    }
    
    // Verify the response addresses the query topic
    const keywords = ['market', 'stock', 'volatility', 'movement', 'factors', 'economic'];
    const hasRelevantContent = keywords.some(keyword => 
      data.summary.toLowerCase().includes(keyword)
    );
    
    if (!hasRelevantContent) {
      return { testName, passed: false, error: 'Response not relevant to market explanation', response: data, duration };
    }
    
    return { testName, passed: true, response: data, duration };
  } catch (error) {
    return { testName, passed: false, error: error instanceof Error ? error.message : 'Unknown error', duration: Date.now() - startTime };
  }
}

async function runTests() {
  console.log('🧪 Testing Market Explanation Queries\n');
  
  const testCases = [
    // Basic market movement queries
    { query: 'Why is the market down today?', expectMetrics: true },
    { query: 'Why are stocks falling?', expectMetrics: true },
    { query: 'Explain why the S&P 500 is up', expectMetrics: true },
    { query: 'What caused the market drop?', expectMetrics: true },
    { query: 'Why is AAPL stock down?', expectMetrics: true },
    { query: 'Reason for market volatility', expectMetrics: true },
    
    // Specific event queries
    { query: 'Why did the market crash?', expectMetrics: false },
    { query: 'What is driving tech stocks higher?', expectMetrics: true },
    { query: 'Explain the recent market surge', expectMetrics: true },
    { query: 'Why is crypto market volatile?', expectMetrics: false },
    
    // Complex explanation queries
    { query: 'What factors are behind the current market movement?', expectMetrics: true },
    { query: 'Explain why stocks are moving sideways', expectMetrics: false },
  ];
  
  const results: TestResult[] = [];
  
  for (const testCase of testCases) {
    console.log(`Testing: "${testCase.query}"`);
    const result = await testMarketExplanation(testCase.query, testCase.expectMetrics);
    results.push(result);
    
    if (result.passed) {
      console.log(`✅ ${result.testName} (${result.duration}ms)`);
      console.log(`   Type: ${result.response.type}`);
      console.log(`   Summary preview: ${result.response.summary.substring(0, 100)}...`);
      if (result.response.key_metrics && Object.keys(result.response.key_metrics).length > 0) {
        console.log(`   Metrics included: ${Object.keys(result.response.key_metrics).join(', ')}`);
      }
    } else {
      console.log(`❌ ${result.testName} - ${result.error} (${result.duration}ms)`);
    }
    
    // Rate limiting delay
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  // Test edge cases
  console.log('\n📋 Testing Edge Cases:');
  
  const edgeCases = [
    { query: 'Why?', expectMetrics: false }, // Too vague
    { query: 'Market explanation', expectMetrics: false }, // Not a proper question
    { query: 'Why is my portfolio down?', expectMetrics: false }, // Personal query
  ];
  
  for (const testCase of edgeCases) {
    const result = await testMarketExplanation(testCase.query, testCase.expectMetrics);
    results.push(result);
    console.log(`${result.passed ? '✅' : '⚠️'} Edge case: "${testCase.query}" - Type: ${result.response?.type}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n📊 Test Summary:');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`   Passed: ${passed}/${results.length}`);
  console.log(`   Failed: ${failed}/${results.length}`);
  console.log(`   Average response time: ${Math.round(results.reduce((sum, r) => sum + r.duration, 0) / results.length)}ms`);
  
  // Check response quality
  const withMetrics = results.filter(r => 
    r.response?.key_metrics && Object.keys(r.response.key_metrics).length > 0
  ).length;
  console.log(`   Responses with metrics: ${withMetrics}/${results.length}`);
  
  return results;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

export { runTests as testMarketExplanations };