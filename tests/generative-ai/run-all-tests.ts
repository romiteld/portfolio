import { runTests as runTextTests } from './test-text-generation';
import { runTests as runImageTests } from './test-image-generation';
import { runTests as runErrorTests } from './test-error-handling';
import { runTests as runPerformanceTests } from './test-performance';
import { TEST_CONFIG } from './test-config';

interface TestSuite {
  name: string;
  runTest: () => Promise<any>;
}

async function runAllTests() {
  console.log('🚀 Generative AI Comprehensive Test Suite');
  console.log(`📅 Started at: ${new Date().toLocaleString()}`);
  console.log(`🌐 API URL: ${TEST_CONFIG.API_URL}`);
  console.log('');
  
  const testSuites: TestSuite[] = [
    {
      name: 'Text Generation',
      runTest: runTextTests
    },
    {
      name: 'Image Generation',
      runTest: runImageTests
    },
    {
      name: 'Error Handling',
      runTest: runErrorTests
    },
    {
      name: 'Performance',
      runTest: runPerformanceTests
    }
  ];
  
  const results: { suite: string; success: boolean; error?: string }[] = [];
  
  for (const suite of testSuites) {
    console.log('='.repeat(60));
    console.log(`🔬 Running ${suite.name} Tests`);
    console.log('='.repeat(60));
    
    try {
      await suite.runTest();
      results.push({ suite: suite.name, success: true });
    } catch (error) {
      console.error(`\n❌ ${suite.name} tests failed:`, error);
      results.push({
        suite: suite.name,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
    console.log('\n');
  }
  
  // Final summary
  console.log('='.repeat(60));
  console.log('📊 FINAL TEST SUMMARY');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`\n✅ Passed: ${passed}/${results.length} test suites`);
  console.log(`❌ Failed: ${failed}/${results.length} test suites`);
  
  if (failed > 0) {
    console.log('\nFailed suites:');
    results
      .filter(r => !r.success)
      .forEach(r => console.log(`  - ${r.suite}: ${r.error}`));
  }
  
  console.log(`\n🏁 Testing completed at: ${new Date().toLocaleString()}`);
  
  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Helper function to check if API is accessible
async function checkAPIHealth(): Promise<boolean> {
  try {
    const response = await fetch(TEST_CONFIG.API_URL + '/api/generative-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Health check',
        type: 'text',
        maxTokens: 10
      })
    });
    
    return response.ok || response.status === 400; // 400 is fine, means API is responding
  } catch (error) {
    return false;
  }
}

// Main execution
(async () => {
  console.log('🔍 Checking API availability...');
  const apiHealthy = await checkAPIHealth();
  
  if (!apiHealthy) {
    console.error('❌ API is not accessible at', TEST_CONFIG.API_URL);
    console.error('Please ensure the development server is running on the correct port.');
    process.exit(1);
  }
  
  console.log('✅ API is accessible\n');
  
  // Check for required environment variables
  if (!process.env.OPENAI_API_KEY && process.env.NODE_ENV !== 'test') {
    console.warn('⚠️  Warning: OPENAI_API_KEY environment variable not set');
    console.warn('   Some tests may fail without a valid API key\n');
  }
  
  await runAllTests();
})().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});