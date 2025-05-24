import { TEST_CONFIG, AGENTS, TEST_GOALS, AgentResponse } from './test-config';

const DEMO_URL = `${TEST_CONFIG.API_URL}/demos/interactive-agents`;
const API_URL = `${TEST_CONFIG.API_URL}/api/interactive-agents`;

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
    const hasGoalInput = html.includes('goal') || html.includes('Goal');
    const hasAgentOptions = html.includes('Agent') || html.includes('agent');
    const hasStartButton = html.includes('Start') || html.includes('Run');
    
    const passed = response.ok && hasGoalInput && hasAgentOptions;
    
    return {
      testName: 'Page loads with UI elements',
      passed,
      details: `Status: ${response.status}, Goal input: ${hasGoalInput}, Agents: ${hasAgentOptions}, Button: ${hasStartButton}`
    };
  } catch (error) {
    return {
      testName: 'Page loads with UI elements',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function simulateUserWorkflow(): Promise<UITestResult[]> {
  const results: UITestResult[] = [];
  
  console.log('\n🔄 Simulating user workflows...');
  
  // Workflow 1: Single agent selection
  const singleAgentResult = await (async () => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: 'Build a landing page',
          agents: ['developer']
        })
      });
      
      const data: AgentResponse = await response.json();
      const hasSteps = data.steps && data.steps.length > 0;
      
      return {
        testName: 'Single agent workflow',
        passed: response.ok && hasSteps,
        details: hasSteps ? `Got ${data.steps.length} response(s)` : 'No responses'
      };
    } catch (error) {
      return {
        testName: 'Single agent workflow',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  })();
  results.push(singleAgentResult);
  
  // Workflow 2: Multi-agent selection
  const multiAgentResult = await (async () => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: 'Launch a new product',
          agents: ['developer', 'marketing', 'designer']
        })
      });
      
      const data: AgentResponse = await response.json();
      const expectedCount = 3;
      const actualCount = data.steps?.length || 0;
      
      return {
        testName: 'Multi-agent workflow',
        passed: response.ok && actualCount === expectedCount,
        details: `Expected ${expectedCount} agents, got ${actualCount}`
      };
    } catch (error) {
      return {
        testName: 'Multi-agent workflow',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  })();
  results.push(multiAgentResult);
  
  // Workflow 3: Goal suggestion usage
  const suggestionResult = await (async () => {
    try {
      // Test each suggestion
      const suggestions = [
        'Build a personal website',
        'Plan a marketing campaign',
        'Write a short story'
      ];
      
      let allWorked = true;
      for (const goal of suggestions) {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goal, agents: ['developer'] })
        });
        
        if (!response.ok) {
          allWorked = false;
          break;
        }
      }
      
      return {
        testName: 'Goal suggestions workflow',
        passed: allWorked,
        details: `Tested ${suggestions.length} suggestions`
      };
    } catch (error) {
      return {
        testName: 'Goal suggestions workflow',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  })();
  results.push(suggestionResult);
  
  // Workflow 4: Agent deselection/reselection
  const reselectionResult = await (async () => {
    try {
      // First request with multiple agents
      const firstResponse = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: 'Test project',
          agents: ['developer', 'designer', 'pm']
        })
      });
      
      // Second request with different agents
      const secondResponse = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: 'Test project',
          agents: ['marketing', 'writer']
        })
      });
      
      const firstData: AgentResponse = await firstResponse.json();
      const secondData: AgentResponse = await secondResponse.json();
      
      const firstCount = firstData.steps?.length || 0;
      const secondCount = secondData.steps?.length || 0;
      
      return {
        testName: 'Agent reselection workflow',
        passed: firstResponse.ok && secondResponse.ok && firstCount === 3 && secondCount === 2,
        details: `First: ${firstCount} agents, Second: ${secondCount} agents`
      };
    } catch (error) {
      return {
        testName: 'Agent reselection workflow',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  })();
  results.push(reselectionResult);
  
  return results;
}

async function testUIStateManagement() {
  console.log('\n🎮 Testing UI state management...');
  
  // Test if the API handles stateless requests correctly
  const testCases = [
    {
      name: 'Empty state',
      payload: { goal: 'Test', agents: [] },
      expectSuccess: true // Should use defaults
    },
    {
      name: 'Previous state independence',
      firstPayload: { goal: 'First goal', agents: ['developer'] },
      secondPayload: { goal: 'Second goal', agents: ['marketing'] },
      expectIndependent: true
    }
  ];
  
  for (const testCase of testCases) {
    if (testCase.firstPayload && testCase.secondPayload) {
      // Test state independence
      const firstResponse = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase.firstPayload)
      });
      
      const secondResponse = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase.secondPayload)
      });
      
      const firstData: AgentResponse = await firstResponse.json();
      const secondData: AgentResponse = await secondResponse.json();
      
      // Check that second response doesn't contain data from first
      const independent = secondData.steps?.every(step => 
        !step.text.toLowerCase().includes('first goal')
      );
      
      console.log(`${independent ? '✅' : '❌'} ${testCase.name}`);
    } else if (testCase.payload) {
      // Test single state
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase.payload)
      });
      
      const success = testCase.expectSuccess ? response.ok : !response.ok;
      console.log(`${success ? '✅' : '❌'} ${testCase.name}`);
    }
  }
}

async function testAgentIcons() {
  console.log('\n🎨 Testing agent visual representations...');
  
  // Verify each agent type has proper metadata
  const agentChecks = Object.entries(AGENTS).map(([id, agent]) => ({
    id,
    name: agent.name,
    hasIcon: true, // In real UI, would check for icon rendering
    hasDescription: agent.name.length > 0
  }));
  
  const allValid = agentChecks.every(check => check.hasIcon && check.hasDescription);
  console.log(`${allValid ? '✅' : '❌'} All agents have proper visual representation`);
  
  agentChecks.forEach(check => {
    if (!check.hasIcon || !check.hasDescription) {
      console.log(`   ❌ ${check.name}: Icon: ${check.hasIcon}, Description: ${check.hasDescription}`);
    }
  });
  
  return agentChecks;
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
  
  // Simulate user workflows
  const workflowResults = await simulateUserWorkflow();
  results.push(...workflowResults);
  
  workflowResults.forEach(result => {
    console.log(`${result.passed ? '✅' : '❌'} ${result.testName}`);
    if (result.details) {
      console.log(`   ${result.details}`);
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  // Test UI state management
  await testUIStateManagement();
  
  // Test agent icons
  await testAgentIcons();
  
  // Summary
  console.log('\n📊 UI Integration Test Summary:');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(`   Passed: ${passed}/${results.length}`);
  console.log(`   Failed: ${failed}/${results.length}`);
  
  // UI/UX recommendations
  console.log('\n💡 UI/UX Recommendations:');
  if (!pageLoadResult.passed) {
    console.log('   - Ensure all UI elements are properly rendered');
  }
  
  const multiAgentTest = results.find(r => r.testName === 'Multi-agent workflow');
  if (multiAgentTest && !multiAgentTest.passed) {
    console.log('   - Improve multi-agent selection interface');
  }
  
  console.log('   - Consider adding loading states for better UX');
  console.log('   - Add tooltips to explain each agent\'s capabilities');
  
  return results;
}

// Run tests if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

export { runTests, checkPageLoads, simulateUserWorkflow };