/**
 * Test Script: Stock Lookup Functionality
 * Tests individual stock symbol lookups and data retrieval
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

async function testStockLookup(symbol: string, expectedFields: string[]): Promise<TestResult> {
  const startTime = Date.now();
  const testName = `Stock Lookup: ${symbol}`;
  
  try {
    const response = await fetch(`${API_URL}/api/financial-assistant/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: symbol })
    });
    
    const data = await response.json();
    const duration = Date.now() - startTime;
    
    // Verify response structure
    if (!response.ok) {
      return { testName, passed: false, error: `HTTP ${response.status}`, duration };
    }
    
    if (data.type !== 'lookup') {
      return { testName, passed: false, error: `Expected type 'lookup', got '${data.type}'`, response: data, duration };
    }
    
    // Check for required fields in key_metrics
    const missingFields = expectedFields.filter(field => !data.key_metrics[field]);
    if (missingFields.length > 0) {
      return { testName, passed: false, error: `Missing fields: ${missingFields.join(', ')}`, response: data, duration };
    }
    
    // Verify data integrity
    if (!data.summary || !data.summary.includes(symbol)) {
      return { testName, passed: false, error: 'Summary missing or invalid', response: data, duration };
    }
    
    return { testName, passed: true, response: data, duration };
  } catch (error) {
    return { testName, passed: false, error: error instanceof Error ? error.message : 'Unknown error', duration: Date.now() - startTime };
  }
}

async function runTests() {
  console.log('🧪 Testing Stock Lookup Functionality\n');
  
  const testCases = [
    { symbol: 'AAPL', expectedFields: ['Price', 'Change', 'Volume'] },
    { symbol: 'MSFT', expectedFields: ['Price', 'Change', 'Market_Cap'] },
    { symbol: 'GOOGL', expectedFields: ['Price', 'Change', 'PE_Ratio'] },
    { symbol: '^GSPC', expectedFields: ['Price', 'Change', 'Volume'] }, // S&P 500 Index
    { symbol: 'BTC-USD', expectedFields: ['Price', 'Change', 'Volume'] }, // Crypto
    { symbol: 'INVALID123', expectedFields: [] }, // Should return error
  ];
  
  const results: TestResult[] = [];
  
  for (const testCase of testCases) {
    console.log(`Testing ${testCase.symbol}...`);
    const result = await testStockLookup(testCase.symbol, testCase.expectedFields);
    results.push(result);
    
    if (result.passed) {
      console.log(`✅ ${result.testName} (${result.duration}ms)`);
      if (result.response?.key_metrics?.Price) {
        console.log(`   Price: ${result.response.key_metrics.Price}`);
      }
    } else {
      console.log(`❌ ${result.testName} - ${result.error} (${result.duration}ms)`);
    }
    
    // Rate limiting delay
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

export { runTests as testStockLookup };