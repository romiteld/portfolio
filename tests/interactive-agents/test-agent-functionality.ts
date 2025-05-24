import { TEST_CONFIG, AGENTS, TEST_GOALS, AGENT_COMBINATIONS, AgentResponse, VALIDATION } from './test-config';

const API_URL = `${TEST_CONFIG.API_URL}/api/interactive-agents`;

interface TestResult {
  name: string;
  success: boolean;
  error?: string;
  responseTime: number;
  agentCount?: number;
  responseCount?: number;
  details?: string;
}

async function testAgentFunctionality(
  goal: string,
  agents: string[],
  testName: string
): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal, agents }),
      signal: AbortSignal.timeout(TEST_CONFIG.TIMEOUT)
    });
    
    const responseTime = Date.now() - startTime;
    const data: AgentResponse = await response.json();
    
    if (!response.ok) {
      return {
        name: testName,
        success: false,
        error: data.error || `HTTP ${response.status}`,
        responseTime
      };
    }
    
    if (data.error) {
      return {
        name: testName,
        success: false,
        error: data.error,
        responseTime
      };
    }
    
    // Validate response structure
    if (!data.steps || !Array.isArray(data.steps)) {
      return {
        name: testName,
        success: false,
        error: 'Invalid response: missing or invalid steps array',
        responseTime
      };
    }
    
    // Validate each step
    const validationErrors: string[] = [];
    for (const step of data.steps) {
      if (!step.name || typeof step.name !== 'string') {
        validationErrors.push('Step missing agent name');
      }
      if (!step.text || typeof step.text !== 'string') {
        validationErrors.push('Step missing text response');
      }
      if (step.text && step.text.length < VALIDATION.minResponseLength) {
        validationErrors.push(`Response too short: ${step.text.length} chars`);
      }
      if (step.text && step.text.length > VALIDATION.maxResponseLength) {
        validationErrors.push(`Response too long: ${step.text.length} chars`);
      }
    }
    
    if (validationErrors.length > 0) {
      return {
        name: testName,
        success: false,
        error: validationErrors.join('; '),
        responseTime,
        responseCount: data.steps.length
      };
    }
    
    // Check if we got responses from all requested agents
    const expectedCount = agents.length;
    const actualCount = data.steps.length;
    
    return {
      name: testName,
      success: actualCount === expectedCount,
      responseTime,
      agentCount: expectedCount,
      responseCount: actualCount,
      details: actualCount !== expectedCount ? 
        `Expected ${expectedCount} responses, got ${actualCount}` : 
        'All agents responded correctly'
    };
    
  } catch (error) {
    return {
      name: testName,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - startTime
    };
  }
}

async function testSingleAgents() {
  console.log('\n👤 Testing single agent functionality...');
  const results: TestResult[] = [];
  
  for (const [agentId] of AGENT_COMBINATIONS.single) {
    const result = await testAgentFunctionality(
      TEST_GOALS.simple.website,
      [agentId],
      `Single agent: ${AGENTS[agentId as keyof typeof AGENTS].name}`
    );
    
    results.push(result);
    console.log(`${result.success ? '✅' : '❌'} ${result.name} (${result.responseTime}ms)`);
    if (result.details) {
      console.log(`   ${result.details}`);
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  }
  
  return results;
}

async function testAgentPairs() {
  console.log('\n👥 Testing agent pair collaboration...');
  const results: TestResult[] = [];
  
  for (const agentPair of AGENT_COMBINATIONS.pairs) {
    const result = await testAgentFunctionality(
      TEST_GOALS.simple.campaign,
      agentPair,
      `Agent pair: ${agentPair.join(' + ')}`
    );
    
    results.push(result);
    console.log(`${result.success ? '✅' : '❌'} ${result.name} (${result.responseTime}ms)`);
    if (!result.success && result.error) {
      console.log(`   Error: ${result.error}`);
    }
  }
  
  return results;
}

async function testFullTeam() {
  console.log('\n👥👥👥 Testing full team collaboration...');
  const results: TestResult[] = [];
  
  for (const team of AGENT_COMBINATIONS.teams) {
    const result = await testAgentFunctionality(
      TEST_GOALS.complex.startup,
      team,
      `Team of ${team.length}: ${team.slice(0, 3).join(', ')}...`
    );
    
    results.push(result);
    console.log(`${result.success ? '✅' : '❌'} ${result.name} (${result.responseTime}ms)`);
    console.log(`   Agents: ${result.agentCount}, Responses: ${result.responseCount}`);
    if (!result.success && result.error) {
      console.log(`   Error: ${result.error}`);
    }
  }
  
  return results;
}

async function testContextPassing() {
  console.log('\n🔄 Testing context passing between agents...');
  
  // Test if agents build on each other's responses
  const goal = 'Create a new social media platform';
  const agents = ['developer', 'designer', 'marketing'];
  
  const startTime = Date.now();
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ goal, agents })
  });
  
  const data: AgentResponse = await response.json();
  const responseTime = Date.now() - startTime;
  
  if (response.ok && data.steps) {
    // Check if later agents reference earlier responses
    let contextAware = false;
    for (let i = 1; i < data.steps.length; i++) {
      const currentResponse = data.steps[i].text.toLowerCase();
      const previousAgents = data.steps.slice(0, i);
      
      // Simple check: does the response mention previous agents or their ideas?
      for (const prev of previousAgents) {
        if (currentResponse.includes(prev.name.toLowerCase()) ||
            currentResponse.includes('previous') ||
            currentResponse.includes('mentioned') ||
            currentResponse.includes('above')) {
          contextAware = true;
          break;
        }
      }
    }
    
    console.log(`${contextAware ? '✅' : '⚠️'} Context awareness detected: ${contextAware}`);
    console.log(`   Response time: ${responseTime}ms`);
    
    return { contextAware, responseTime };
  }
  
  console.log('❌ Failed to test context passing');
  return { contextAware: false, responseTime };
}

async function runTests() {
  console.log('🤖 Testing Interactive Agents Functionality\n');
  
  const allResults: TestResult[] = [];
  
  // Test single agents
  const singleResults = await testSingleAgents();
  allResults.push(...singleResults);
  
  // Test agent pairs
  const pairResults = await testAgentPairs();
  allResults.push(...pairResults);
  
  // Test full teams
  const teamResults = await testFullTeam();
  allResults.push(...teamResults);
  
  // Test context passing
  const contextResult = await testContextPassing();
  
  // Summary
  console.log('\n📊 Agent Functionality Test Summary:');
  const passed = allResults.filter(r => r.success).length;
  const failed = allResults.filter(r => !r.success).length;
  const avgResponseTime = allResults
    .filter(r => r.success)
    .reduce((sum, r) => sum + r.responseTime, 0) / passed || 0;
  
  console.log(`   Passed: ${passed}/${allResults.length}`);
  console.log(`   Failed: ${failed}/${allResults.length}`);
  console.log(`   Average response time: ${avgResponseTime.toFixed(0)}ms`);
  console.log(`   Context passing: ${contextResult.contextAware ? 'Working' : 'Not detected'}`);
  
  // Performance analysis
  const singleAvg = singleResults
    .filter(r => r.success)
    .reduce((sum, r) => sum + r.responseTime, 0) / singleResults.filter(r => r.success).length || 0;
  
  const teamAvg = teamResults
    .filter(r => r.success)
    .reduce((sum, r) => sum + r.responseTime, 0) / teamResults.filter(r => r.success).length || 0;
  
  console.log(`\n⚡ Performance Analysis:`);
  console.log(`   Single agent avg: ${singleAvg.toFixed(0)}ms`);
  console.log(`   Full team avg: ${teamAvg.toFixed(0)}ms`);
  console.log(`   Slowdown factor: ${(teamAvg / singleAvg).toFixed(2)}x`);
  
  return allResults;
}

// Run tests if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

export { runTests, testAgentFunctionality };