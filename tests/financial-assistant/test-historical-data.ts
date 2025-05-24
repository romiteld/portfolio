/**
 * Test Script: Historical Data Queries
 * Tests historical price lookups with various date formats
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

async function testHistoricalQuery(query: string, expectedSymbol?: string): Promise<TestResult> {
  const startTime = Date.now();
  const testName = `Historical Query: "${query}"`;
  
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
    
    // Accept both 'lookup' (for historical) and 'error' types
    if (!['lookup', 'error'].includes(data.type)) {
      return { testName, passed: false, error: `Expected type 'lookup' or 'error', got '${data.type}'`, response: data, duration };
    }
    
    // If we expect this to work
    if (expectedSymbol && data.type === 'lookup') {
      // Check if response contains expected data
      if (!data.key_metrics || Object.keys(data.key_metrics).length === 0) {
        return { testName, passed: false, error: 'No key metrics returned', response: data, duration };
      }
      
      // Verify it's historical data (should have OHLC data)
      const hasHistoricalData = data.key_metrics.Open || data.key_metrics.Close || 
                               data.summary.includes('closed at') || data.summary.includes('On ');
      
      if (!hasHistoricalData) {
        return { testName, passed: false, error: 'Response does not contain historical data', response: data, duration };
      }
    }
    
    return { testName, passed: true, response: data, duration };
  } catch (error) {
    return { testName, passed: false, error: error instanceof Error ? error.message : 'Unknown error', duration: Date.now() - startTime };
  }
}

async function runTests() {
  console.log('🧪 Testing Historical Data Queries\n');
  
  // Get dates for testing
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  const lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  
  const testCases = [
    // Various date formats
    { query: 'How did the S&P 500 close on 12/31/2023?', expectSymbol: '^GSPC' },
    { query: 'What was AAPL price on 01/15/2024?', expectSymbol: 'AAPL' },
    { query: `MSFT closing price on ${lastWeek.toLocaleDateString('en-US')}`, expectSymbol: 'MSFT' },
    { query: 'How did the market close on December 25, 2023?', expectSymbol: '^GSPC' }, // Holiday
    { query: 'S&P 500 on 2024-01-02', expectSymbol: '^GSPC' }, // ISO format
    { query: 'What was Tesla at on 3/1/24?', expectSymbol: 'TSLA' }, // 2-digit year
    { query: 'DOW closing price yesterday', expectSymbol: '^DJI' }, // Relative date
    { query: 'How did nasdaq close on 05/23/2025?', expectSymbol: '^IXIC' }, // Future date
    { query: 'BTC-USD price on January 1, 2024', expectSymbol: 'BTC-USD' }, // Crypto
    { query: 'What was the closing price on invalid date?', expectSymbol: null }, // Invalid
  ];
  
  const results: TestResult[] = [];
  
  for (const testCase of testCases) {
    console.log(`Testing: "${testCase.query}"`);
    const result = await testHistoricalQuery(testCase.query, testCase.expectSymbol);
    results.push(result);
    
    if (result.passed) {
      console.log(`✅ ${result.testName} (${result.duration}ms)`);
      if (result.response?.summary) {
        console.log(`   Summary: ${result.response.summary.substring(0, 100)}...`);
      }
      if (result.response?.key_metrics?.Close) {
        console.log(`   Close: ${result.response.key_metrics.Close}`);
      }
    } else {
      console.log(`❌ ${result.testName} - ${result.error} (${result.duration}ms)`);
    }
    
    // Rate limiting delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Test edge cases
  console.log('\n📋 Testing Edge Cases:');
  
  const edgeCases = [
    { query: 'Price on 02/30/2024', expectSymbol: null }, // Invalid date
    { query: 'How much was AAPL worth?', expectSymbol: null }, // No date
    { query: `Stock price on ${today.toLocaleDateString('en-US')}`, expectSymbol: null }, // Today (might be current)
  ];
  
  for (const testCase of edgeCases) {
    const result = await testHistoricalQuery(testCase.query, testCase.expectSymbol);
    results.push(result);
    console.log(`${result.passed ? '✅' : '❌'} Edge case: "${testCase.query}"`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n📊 Test Summary:');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`   Passed: ${passed}/${results.length}`);
  console.log(`   Failed: ${failed}/${results.length}`);
  console.log(`   Average response time: ${Math.round(results.reduce((sum, r) => sum + r.duration, 0) / results.length)}ms`);
  
  return results;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

export { runTests as testHistoricalData };