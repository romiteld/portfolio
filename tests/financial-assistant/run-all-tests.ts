/**
 * Comprehensive Test Runner for Financial Assistant Demo
 * Runs all test suites and generates a complete report
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

// Import all test modules
import { testStockLookup } from './test-stock-lookup';
import { testHistoricalData } from './test-historical-data';
import { testMarketExplanations } from './test-market-explanations';
import { testStockComparison } from './test-stock-comparison';
import { testMarketSummary } from './test-market-summary';
import { testFinancialAdvice } from './test-financial-advice';

interface TestSuiteResult {
  name: string;
  totalTests: number;
  passed: number;
  failed: number;
  duration: number;
  details?: any[];
}

interface TestReport {
  startTime: string;
  endTime: string;
  totalDuration: number;
  suites: TestSuiteResult[];
  summary: {
    totalTests: number;
    totalPassed: number;
    totalFailed: number;
    successRate: number;
  };
}

async function runTestSuite(
  name: string, 
  testFunction: () => Promise<any[]>
): Promise<TestSuiteResult> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔬 Running ${name}`);
  console.log(`${'='.repeat(60)}\n`);
  
  const startTime = Date.now();
  
  try {
    const results = await testFunction();
    const duration = Date.now() - startTime;
    
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    
    return {
      name,
      totalTests: results.length,
      passed,
      failed,
      duration,
      details: results
    };
  } catch (error) {
    console.error(`❌ Error running ${name}:`, error);
    return {
      name,
      totalTests: 0,
      passed: 0,
      failed: 1,
      duration: Date.now() - startTime
    };
  }
}

async function generateReport(suites: TestSuiteResult[]): Promise<TestReport> {
  const totalTests = suites.reduce((sum, suite) => sum + suite.totalTests, 0);
  const totalPassed = suites.reduce((sum, suite) => sum + suite.passed, 0);
  const totalFailed = suites.reduce((sum, suite) => sum + suite.failed, 0);
  const totalDuration = suites.reduce((sum, suite) => sum + suite.duration, 0);
  
  return {
    startTime: new Date(Date.now() - totalDuration).toISOString(),
    endTime: new Date().toISOString(),
    totalDuration,
    suites,
    summary: {
      totalTests,
      totalPassed,
      totalFailed,
      successRate: totalTests > 0 ? (totalPassed / totalTests) * 100 : 0
    }
  };
}

async function runAllTests() {
  console.log('🚀 Financial Assistant Comprehensive Test Suite');
  console.log(`📅 Started at: ${new Date().toLocaleString()}`);
  console.log(`🌐 API URL: ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}`);
  
  const testSuites = [
    { name: 'Stock Lookup Tests', fn: testStockLookup },
    { name: 'Historical Data Tests', fn: testHistoricalData },
    { name: 'Market Explanation Tests', fn: testMarketExplanations },
    { name: 'Stock Comparison Tests', fn: testStockComparison },
    { name: 'Market Summary Tests', fn: testMarketSummary },
    { name: 'Financial Advice & RAG Tests', fn: testFinancialAdvice }
  ];
  
  const results: TestSuiteResult[] = [];
  
  // Run each test suite sequentially
  for (const suite of testSuites) {
    const result = await runTestSuite(suite.name, suite.fn);
    results.push(result);
    
    // Brief pause between suites
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Generate and display report
  const report = await generateReport(results);
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 FINAL TEST REPORT');
  console.log(`${'='.repeat(60)}\n`);
  
  // Suite-by-suite results
  console.log('📋 Test Suite Results:\n');
  report.suites.forEach(suite => {
    const status = suite.failed === 0 ? '✅' : '❌';
    const percentage = suite.totalTests > 0 
      ? ((suite.passed / suite.totalTests) * 100).toFixed(1)
      : '0';
    
    console.log(`${status} ${suite.name.padEnd(30)} ${suite.passed}/${suite.totalTests} passed (${percentage}%) - ${(suite.duration / 1000).toFixed(1)}s`);
  });
  
  // Overall summary
  console.log(`\n${'─'.repeat(60)}`);
  console.log('📈 Overall Summary:\n');
  console.log(`   Total Tests Run: ${report.summary.totalTests}`);
  console.log(`   Tests Passed: ${report.summary.totalPassed} (${report.summary.successRate.toFixed(1)}%)`);
  console.log(`   Tests Failed: ${report.summary.totalFailed}`);
  console.log(`   Total Duration: ${(report.totalDuration / 1000).toFixed(1)} seconds`);
  console.log(`   Average Test Time: ${report.summary.totalTests > 0 ? ((report.totalDuration / report.summary.totalTests) / 1000).toFixed(2) : 0} seconds`);
  
  // Failed tests details
  if (report.summary.totalFailed > 0) {
    console.log(`\n❌ Failed Tests:\n`);
    report.suites.forEach(suite => {
      if (suite.details) {
        const failedTests = suite.details.filter(test => !test.passed);
        failedTests.forEach(test => {
          console.log(`   - ${test.testName}: ${test.error || 'Unknown error'}`);
        });
      }
    });
  }
  
  // Performance analysis
  console.log(`\n⚡ Performance Analysis:\n`);
  const slowTests = report.suites
    .flatMap(suite => suite.details || [])
    .filter(test => test.duration > 3000)
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 5);
  
  if (slowTests.length > 0) {
    console.log('   Slowest Tests:');
    slowTests.forEach(test => {
      console.log(`   - ${test.testName}: ${(test.duration / 1000).toFixed(2)}s`);
    });
  }
  
  // Save report to file
  const reportPath = `./test-reports/financial-assistant-${Date.now()}.json`;
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    const dir = path.dirname(reportPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Detailed report saved to: ${reportPath}`);
  } catch (error) {
    console.log('\n⚠️  Could not save report to file:', error);
  }
  
  // Exit code based on results
  const exitCode = report.summary.totalFailed > 0 ? 1 : 0;
  console.log(`\n🏁 Test suite completed with exit code: ${exitCode}`);
  
  return report;
}

// Run all tests if this file is executed directly
if (require.main === module) {
  runAllTests()
    .then(report => {
      process.exit(report.summary.totalFailed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Fatal error running tests:', error);
      process.exit(1);
    });
}

export { runAllTests };