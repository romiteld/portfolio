/**
 * Test Script: Market Summary Functionality
 * Tests market overview and indices summary
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

async function testMarketSummary(query: string, expectedIndices: string[]): Promise<TestResult> {
  const startTime = Date.now();
  const testName = `Market Summary: "${query}"`;
  
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
    
    // Check if response is summary type
    if (data.type !== 'summary') {
      return { testName, passed: false, error: `Expected type 'summary', got '${data.type}'`, response: data, duration };
    }
    
    // Verify summary content
    if (!data.summary || !data.summary.includes('Market')) {
      return { testName, passed: false, error: 'Invalid or missing market summary', response: data, duration };
    }
    
    // Check for key metrics
    if (!data.key_metrics || Object.keys(data.key_metrics).length < 3) {
      return { testName, passed: false, error: 'Insufficient market metrics', response: data, duration };
    }
    
    // Verify expected indices are included
    const summaryAndMetrics = JSON.stringify(data).toUpperCase();
    const indicesFound = expectedIndices.filter(index => {
      // Check for index symbol or common names
      const indexNames = {
        '^GSPC': ['S&P 500', 'S&P500', 'SPX'],
        '^DJI': ['DOW JONES', 'DOW', 'DJIA'],
        '^IXIC': ['NASDAQ', 'COMP'],
        'BTC-USD': ['BITCOIN', 'BTC']
      };
      
      const found = summaryAndMetrics.includes(index.toUpperCase());
      const nameFound = indexNames[index]?.some(name => summaryAndMetrics.includes(name)) || false;
      
      return found || nameFound;
    });
    
    if (indicesFound.length < expectedIndices.length / 2) {
      return { 
        testName, 
        passed: false, 
        error: `Missing key indices. Expected ${expectedIndices.join(', ')}, found ${indicesFound.join(', ')}`, 
        response: data, 
        duration 
      };
    }
    
    // Verify metrics have percentage changes
    const hasPercentages = Object.values(data.key_metrics).some(value => 
      String(value).includes('%')
    );
    
    if (!hasPercentages) {
      return { testName, passed: false, error: 'No percentage changes in metrics', response: data, duration };
    }
    
    return { testName, passed: true, response: data, duration };
  } catch (error) {
    return { testName, passed: false, error: error instanceof Error ? error.message : 'Unknown error', duration: Date.now() - startTime };
  }
}

async function runTests() {
  console.log('🧪 Testing Market Summary Functionality\n');
  
  const mainIndices = ['^GSPC', '^DJI', '^IXIC'];
  const allIndices = ['^GSPC', '^DJI', '^IXIC', 'BTC-USD'];
  
  const testCases = [
    // Direct market summary requests
    { query: 'market summary', indices: mainIndices },
    { query: 'Market overview', indices: mainIndices },
    { query: 'How is the market doing?', indices: mainIndices },
    { query: 'Show me market indices', indices: mainIndices },
    { query: 'What happened in the markets today?', indices: mainIndices },
    
    // Different phrasings
    { query: 'market', indices: mainIndices },
    { query: 'indices', indices: mainIndices },
    { query: 'stock market summary', indices: mainIndices },
    { query: 'Give me a market update', indices: mainIndices },
    { query: 'Current market status', indices: mainIndices },
    
    // Specific requests
    { query: 'How are the major indices performing?', indices: mainIndices },
    { query: 'Show me S&P, Dow, and Nasdaq', indices: mainIndices },
  ];
  
  const results: TestResult[] = [];
  
  for (const testCase of testCases) {
    console.log(`Testing: "${testCase.query}"`);
    const result = await testMarketSummary(testCase.query, testCase.indices);
    results.push(result);
    
    if (result.passed) {
      console.log(`✅ ${result.testName} (${result.duration}ms)`);
      console.log(`   Metrics found: ${Object.keys(result.response.key_metrics).length}`);
      
      // Show first few metrics
      const metricsPreview = Object.entries(result.response.key_metrics)
        .slice(0, 3)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      console.log(`   Preview: ${metricsPreview}`);
    } else {
      console.log(`❌ ${result.testName} - ${result.error} (${result.duration}ms)`);
    }
    
    // Rate limiting delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Test variations
  console.log('\n📋 Testing Variations:');
  
  const variations = [
    { query: 'markets', indices: mainIndices },
    { query: 'summary', indices: [] }, // Might not trigger market summary
    { query: 'How did markets close?', indices: mainIndices },
    { query: 'Market performance', indices: mainIndices },
  ];
  
  for (const testCase of variations) {
    const result = await testMarketSummary(testCase.query, testCase.indices);
    results.push(result);
    console.log(`${result.passed ? '✅' : '⚠️'} Variation: "${testCase.query}" - Type: ${result.response?.type}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n📊 Test Summary:');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`   Passed: ${passed}/${results.length}`);
  console.log(`   Failed: ${failed}/${results.length}`);
  console.log(`   Average response time: ${Math.round(results.reduce((sum, r) => sum + r.duration, 0) / results.length)}ms`);
  
  // Analyze content quality
  const validSummaries = results.filter(r => r.passed);
  if (validSummaries.length > 0) {
    const avgMetrics = validSummaries.reduce((sum, r) => 
      sum + Object.keys(r.response.key_metrics).length, 0
    ) / validSummaries.length;
    console.log(`   Average metrics per summary: ${Math.round(avgMetrics)}`);
    
    // Check which indices appear most frequently
    const indexFrequency: Record<string, number> = {};
    validSummaries.forEach(r => {
      const content = JSON.stringify(r.response).toUpperCase();
      ['S&P', 'DOW', 'NASDAQ', 'BITCOIN'].forEach(index => {
        if (content.includes(index)) {
          indexFrequency[index] = (indexFrequency[index] || 0) + 1;
        }
      });
    });
    console.log(`   Index frequency:`, indexFrequency);
  }
  
  return results;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

export { runTests as testMarketSummary };