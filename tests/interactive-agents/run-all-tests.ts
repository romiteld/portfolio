import { runTests as runAgentTests } from './test-agent-functionality';
import { runTests as runGoalTests } from './test-goal-processing';
import { runTests as runErrorTests } from './test-error-handling';
import { runTests as runPerformanceTests } from './test-performance';
import { runTests as runUITests } from './test-ui-integration';
import { TEST_CONFIG } from './test-config';

interface TestSuite {
  name: string;
  runTest: () => Promise<any>;
  critical: boolean;
}

async function runAllTests() {
  console.log('🚀 Interactive Agents Comprehensive Test Suite');
  console.log(`📅 Started at: ${new Date().toLocaleString()}`);
  console.log(`🌐 API URL: ${TEST_CONFIG.API_URL}`);
  console.log('');
  
  const testSuites: TestSuite[] = [
    {
      name: 'Agent Functionality',
      runTest: runAgentTests,
      critical: true
    },
    {
      name: 'Goal Processing',
      runTest: runGoalTests,
      critical: true
    },
    {
      name: 'Error Handling',
      runTest: runErrorTests,
      critical: false
    },
    {
      name: 'Performance',
      runTest: runPerformanceTests,
      critical: false
    },
    {
      name: 'UI Integration',
      runTest: runUITests,
      critical: false
    }
  ];
  
  const results: { suite: string; success: boolean; error?: string; critical: boolean }[] = [];
  
  for (const suite of testSuites) {
    console.log('='.repeat(60));
    console.log(`🔬 Running ${suite.name} Tests`);
    console.log('='.repeat(60));
    
    try {
      await suite.runTest();
      results.push({ suite: suite.name, success: true, critical: suite.critical });
    } catch (error) {
      console.error(`\n❌ ${suite.name} tests failed:`, error);
      results.push({
        suite: suite.name,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        critical: suite.critical
      });
      
      // If critical test fails, stop execution
      if (suite.critical) {
        console.error('\n⚠️ Critical test failed, stopping execution');
        break;
      }
    }
    
    console.log('\n');
    
    // Add delay between test suites
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Final summary
  console.log('='.repeat(60));
  console.log('📊 FINAL TEST SUMMARY');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const criticalFailed = results.filter(r => !r.success && r.critical).length;
  
  console.log(`\n✅ Passed: ${passed}/${results.length} test suites`);
  console.log(`❌ Failed: ${failed}/${results.length} test suites`);
  if (criticalFailed > 0) {
    console.log(`🚨 Critical failures: ${criticalFailed}`);
  }
  
  if (failed > 0) {
    console.log('\nFailed suites:');
    results
      .filter(r => !r.success)
      .forEach(r => console.log(`  - ${r.suite}: ${r.error} ${r.critical ? '(CRITICAL)' : ''}`));
  }
  
  // Feature readiness assessment
  console.log('\n🎯 Feature Readiness Assessment:');
  const readinessChecks = {
    'Basic agent responses': results.some(r => r.suite === 'Agent Functionality' && r.success),
    'Goal understanding': results.some(r => r.suite === 'Goal Processing' && r.success),
    'Error resilience': results.some(r => r.suite === 'Error Handling' && r.success),
    'Performance acceptable': results.some(r => r.suite === 'Performance' && r.success),
    'UI functional': results.some(r => r.suite === 'UI Integration' && r.success)
  };
  
  Object.entries(readinessChecks).forEach(([feature, ready]) => {
    console.log(`  ${ready ? '✅' : '❌'} ${feature}`);
  });
  
  const overallReady = Object.values(readinessChecks).filter(v => v).length >= 3;
  console.log(`\n📋 Overall Status: ${overallReady ? '✅ Ready for use' : '⚠️ Needs improvements'}`);
  
  console.log(`\n🏁 Testing completed at: ${new Date().toLocaleString()}`);
  
  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Helper function to check if API is accessible
async function checkAPIHealth(): Promise<boolean> {
  try {
    const response = await fetch(TEST_CONFIG.API_URL + '/api/interactive-agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goal: 'Health check',
        agents: ['developer']
      })
    });
    
    // 400 or 500 are fine - means API is responding
    return response.status !== 404;
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
    console.warn('   Tests will fail without a valid API key\n');
  }
  
  await runAllTests();
})().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});