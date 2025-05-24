/**
 * Test Script: Stock Comparison Functionality
 * Tests comparing two stocks/indices
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

async function testStockComparison(query: string, expectedSymbols: string[]): Promise<TestResult> {
  const startTime = Date.now();
  const testName = `Stock Comparison: "${query}"`;
  
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
    
    // Check if response is comparison type
    if (data.type !== 'comparison') {
      return { testName, passed: false, error: `Expected type 'comparison', got '${data.type}'`, response: data, duration };
    }
    
    // Verify comparison table exists
    if (!data.comparison_table) {
      return { testName, passed: false, error: 'Missing comparison_table', response: data, duration };
    }
    
    // Check if both symbols are mentioned in the response
    const tableAndSummary = (data.comparison_table + data.summary).toUpperCase();
    const symbolsFound = expectedSymbols.filter(symbol => 
      tableAndSummary.includes(symbol.toUpperCase())
    );
    
    if (symbolsFound.length !== expectedSymbols.length) {
      return { 
        testName, 
        passed: false, 
        error: `Expected symbols ${expectedSymbols.join(', ')}, found ${symbolsFound.join(', ')}`, 
        response: data, 
        duration 
      };
    }
    
    // Verify table structure (should have headers and data rows)
    const tableLines = data.comparison_table.split('\n').filter(line => line.trim());
    if (tableLines.length < 3) { // At least header, separator, and one data row
      return { testName, passed: false, error: 'Comparison table too short', response: data, duration };
    }
    
    // Check for key comparison metrics
    const expectedMetrics = ['Price', 'Change', 'Volume', 'Market Cap'];
    const hasMetrics = expectedMetrics.some(metric => 
      data.comparison_table.includes(metric)
    );
    
    if (!hasMetrics) {
      return { testName, passed: false, error: 'Missing key comparison metrics', response: data, duration };
    }
    
    return { testName, passed: true, response: data, duration };
  } catch (error) {
    return { testName, passed: false, error: error instanceof Error ? error.message : 'Unknown error', duration: Date.now() - startTime };
  }
}

async function runTests() {
  console.log('🧪 Testing Stock Comparison Functionality\n');
  
  const testCases = [
    // Basic comparisons
    { query: 'Compare AAPL and MSFT', symbols: ['AAPL', 'MSFT'] },
    { query: 'GOOGL vs AMZN', symbols: ['GOOGL', 'AMZN'] },
    { query: 'Compare Tesla versus Ford', symbols: ['TSLA', 'F'] },
    
    // Index comparisons
    { query: 'Compare S&P 500 and NASDAQ', symbols: ['^GSPC', '^IXIC'] },
    { query: '^DJI vs ^GSPC', symbols: ['^DJI', '^GSPC'] },
    
    // Mixed comparisons
    { query: 'Compare AAPL to S&P 500', symbols: ['AAPL', '^GSPC'] },
    { query: 'BTC-USD versus ETH-USD', symbols: ['BTC-USD', 'ETH-USD'] },
    
    // Different formats
    { query: 'Show me NVDA compared to AMD', symbols: ['NVDA', 'AMD'] },
    { query: 'What is the difference between META and SNAP?', symbols: ['META', 'SNAP'] },
    { query: 'JPM and BAC comparison', symbols: ['JPM', 'BAC'] },
  ];
  
  const results: TestResult[] = [];
  
  for (const testCase of testCases) {
    console.log(`Testing: "${testCase.query}"`);
    const result = await testStockComparison(testCase.query, testCase.symbols);
    results.push(result);
    
    if (result.passed) {
      console.log(`✅ ${result.testName} (${result.duration}ms)`);
      console.log(`   Summary: ${result.response.summary}`);
      
      // Show first few lines of comparison table
      const tablePreview = result.response.comparison_table
        .split('\n')
        .slice(0, 4)
        .join('\n');
      console.log(`   Table preview:\n${tablePreview.split('\n').map(line => '     ' + line).join('\n')}`);
    } else {
      console.log(`❌ ${result.testName} - ${result.error} (${result.duration}ms)`);
    }
    
    // Rate limiting delay
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  // Test edge cases
  console.log('\n📋 Testing Edge Cases:');
  
  const edgeCases = [
    { query: 'Compare AAPL', symbols: ['AAPL'] }, // Only one symbol
    { query: 'Compare INVALID1 and INVALID2', symbols: ['INVALID1', 'INVALID2'] }, // Invalid symbols
    { query: 'AAPL MSFT GOOGL comparison', symbols: ['AAPL', 'MSFT', 'GOOGL'] }, // Three symbols
    { query: 'Compare', symbols: [] }, // No symbols
  ];
  
  for (const testCase of edgeCases) {
    const result = await testStockComparison(testCase.query, testCase.symbols);
    results.push(result);
    console.log(`${result.passed ? '✅' : '❌'} Edge case: "${testCase.query}" - ${result.passed ? 'Handled correctly' : result.error}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n📊 Test Summary:');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`   Passed: ${passed}/${results.length}`);
  console.log(`   Failed: ${failed}/${results.length}`);
  console.log(`   Average response time: ${Math.round(results.reduce((sum, r) => sum + r.duration, 0) / results.length)}ms`);
  
  // Analyze table quality
  const validComparisons = results.filter(r => r.response?.comparison_table);
  if (validComparisons.length > 0) {
    const avgTableSize = validComparisons.reduce((sum, r) => 
      sum + r.response.comparison_table.split('\n').length, 0
    ) / validComparisons.length;
    console.log(`   Average table size: ${Math.round(avgTableSize)} lines`);
  }
  
  return results;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

export { runTests as testStockComparison };