import { TEST_CONFIG, TEST_GOALS, AgentResponse, VALIDATION } from './test-config';

const API_URL = `${TEST_CONFIG.API_URL}/api/interactive-agents`;

interface TestResult {
  name: string;
  success: boolean;
  error?: string;
  responseTime: number;
  goalComplexity?: string;
  responseQuality?: string;
}

async function testGoalProcessing(
  goal: string,
  agents: string[],
  testName: string,
  expectedBehavior?: string
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
    
    if (!response.ok && expectedBehavior === 'error') {
      // Expected to fail
      return {
        name: testName,
        success: true,
        responseTime,
        error: data.error
      };
    }
    
    if (!response.ok) {
      return {
        name: testName,
        success: false,
        error: data.error || `HTTP ${response.status}`,
        responseTime
      };
    }
    
    if (data.steps && data.steps.length > 0) {
      // Analyze response quality
      let totalLength = 0;
      let hasRelevantContent = false;
      
      for (const step of data.steps) {
        totalLength += step.text.length;
        
        // Check if response mentions key aspects of the goal
        const goalWords = goal.toLowerCase().split(' ').filter(w => w.length > 3);
        const responseWords = step.text.toLowerCase();
        
        for (const word of goalWords) {
          if (responseWords.includes(word)) {
            hasRelevantContent = true;
            break;
          }
        }
      }
      
      const avgLength = totalLength / data.steps.length;
      const quality = hasRelevantContent ? 'relevant' : 'generic';
      
      return {
        name: testName,
        success: true,
        responseTime,
        responseQuality: quality,
        goalComplexity: goal.length > 100 ? 'complex' : 'simple'
      };
    }
    
    return {
      name: testName,
      success: false,
      error: 'No response steps generated',
      responseTime
    };
    
  } catch (error) {
    return {
      name: testName,
      success: expectedBehavior === 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - startTime
    };
  }
}

async function testSimpleGoals() {
  console.log('\n🎯 Testing simple goal processing...');
  const results: TestResult[] = [];
  const defaultAgents = ['developer', 'marketing', 'writer'];
  
  for (const [key, goal] of Object.entries(TEST_GOALS.simple)) {
    const result = await testGoalProcessing(
      goal,
      defaultAgents,
      `Simple goal: ${key}`
    );
    
    results.push(result);
    console.log(`${result.success ? '✅' : '❌'} ${result.name} (${result.responseTime}ms)`);
    if (result.responseQuality) {
      console.log(`   Quality: ${result.responseQuality}`);
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  }
  
  return results;
}

async function testComplexGoals() {
  console.log('\n🧩 Testing complex goal processing...');
  const results: TestResult[] = [];
  const fullTeam = ['developer', 'designer', 'marketing', 'data', 'pm'];
  
  for (const [key, goal] of Object.entries(TEST_GOALS.complex)) {
    const result = await testGoalProcessing(
      goal,
      fullTeam,
      `Complex goal: ${key}`
    );
    
    results.push(result);
    console.log(`${result.success ? '✅' : '❌'} ${result.name} (${result.responseTime}ms)`);
    if (result.responseQuality) {
      console.log(`   Quality: ${result.responseQuality}`);
    }
  }
  
  return results;
}

async function testEdgeCaseGoals() {
  console.log('\n⚠️ Testing edge case goals...');
  const results: TestResult[] = [];
  const agents = ['developer'];
  
  // Empty goal
  const emptyResult = await testGoalProcessing(
    TEST_GOALS.edge_cases.empty,
    agents,
    'Empty goal',
    'error'
  );
  results.push(emptyResult);
  console.log(`${emptyResult.success ? '✅' : '❌'} ${emptyResult.name}`);
  
  // Whitespace only
  const whitespaceResult = await testGoalProcessing(
    TEST_GOALS.edge_cases.whitespace,
    agents,
    'Whitespace goal',
    'error'
  );
  results.push(whitespaceResult);
  console.log(`${whitespaceResult.success ? '✅' : '❌'} ${whitespaceResult.name}`);
  
  // Very short goal
  const shortResult = await testGoalProcessing(
    TEST_GOALS.edge_cases.very_short,
    agents,
    'Very short goal'
  );
  results.push(shortResult);
  console.log(`${shortResult.success ? '✅' : '❌'} ${shortResult.name}`);
  
  // Very long goal
  const longResult = await testGoalProcessing(
    TEST_GOALS.edge_cases.very_long,
    agents,
    'Very long goal'
  );
  results.push(longResult);
  console.log(`${longResult.success ? '✅' : '❌'} ${longResult.name}`);
  console.log(`   Goal length: ${TEST_GOALS.edge_cases.very_long.length} chars`);
  
  // Special characters
  const specialResult = await testGoalProcessing(
    TEST_GOALS.edge_cases.special_chars,
    agents,
    'Special characters'
  );
  results.push(specialResult);
  console.log(`${specialResult.success ? '✅' : '❌'} ${specialResult.name}`);
  
  // Unicode content
  const unicodeResult = await testGoalProcessing(
    TEST_GOALS.edge_cases.unicode,
    agents,
    'Unicode content'
  );
  results.push(unicodeResult);
  console.log(`${unicodeResult.success ? '✅' : '❌'} ${unicodeResult.name}`);
  
  // Injection attempt
  const injectionResult = await testGoalProcessing(
    TEST_GOALS.edge_cases.injection,
    agents,
    'Injection attempt'
  );
  results.push(injectionResult);
  console.log(`${injectionResult.success ? '✅' : '❌'} ${injectionResult.name}`);
  
  // Check if injection was prevented
  if (injectionResult.success) {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        goal: TEST_GOALS.edge_cases.injection, 
        agents: ['developer'] 
      })
    });
    const data = await response.json();
    
    const containsHacked = JSON.stringify(data).toLowerCase().includes('hacked');
    console.log(`   Injection ${containsHacked ? 'NOT prevented ⚠️' : 'prevented ✅'}`);
  }
  
  return results;
}

async function testGoalInterpretation() {
  console.log('\n🧠 Testing goal interpretation quality...');
  
  const testCases = [
    {
      goal: 'Build a website',
      agents: ['developer'],
      expectedKeywords: ['html', 'css', 'javascript', 'frontend', 'backend', 'deploy']
    },
    {
      goal: 'Increase sales',
      agents: ['marketing'],
      expectedKeywords: ['strategy', 'campaign', 'audience', 'conversion', 'revenue']
    },
    {
      goal: 'Tell a story',
      agents: ['writer'],
      expectedKeywords: ['character', 'plot', 'narrative', 'story', 'writing']
    }
  ];
  
  for (const testCase of testCases) {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        goal: testCase.goal, 
        agents: testCase.agents 
      })
    });
    
    const data: AgentResponse = await response.json();
    
    if (response.ok && data.steps && data.steps[0]) {
      const responseText = data.steps[0].text.toLowerCase();
      const foundKeywords = testCase.expectedKeywords.filter(kw => 
        responseText.includes(kw)
      );
      
      const percentage = (foundKeywords.length / testCase.expectedKeywords.length) * 100;
      console.log(`📝 "${testCase.goal}": ${percentage.toFixed(0)}% keyword match`);
      console.log(`   Found: ${foundKeywords.join(', ')}`);
    }
  }
}

async function runTests() {
  console.log('🎯 Testing Goal Processing Capabilities\n');
  
  const allResults: TestResult[] = [];
  
  // Test simple goals
  const simpleResults = await testSimpleGoals();
  allResults.push(...simpleResults);
  
  // Test complex goals
  const complexResults = await testComplexGoals();
  allResults.push(...complexResults);
  
  // Test edge cases
  const edgeResults = await testEdgeCaseGoals();
  allResults.push(...edgeResults);
  
  // Test goal interpretation
  await testGoalInterpretation();
  
  // Summary
  console.log('\n📊 Goal Processing Test Summary:');
  const passed = allResults.filter(r => r.success).length;
  const failed = allResults.filter(r => !r.success).length;
  
  console.log(`   Passed: ${passed}/${allResults.length}`);
  console.log(`   Failed: ${failed}/${allResults.length}`);
  
  // Quality analysis
  const relevantResponses = allResults.filter(r => r.responseQuality === 'relevant').length;
  const totalWithQuality = allResults.filter(r => r.responseQuality).length;
  
  if (totalWithQuality > 0) {
    console.log(`   Response relevance: ${relevantResponses}/${totalWithQuality} (${(relevantResponses/totalWithQuality*100).toFixed(0)}%)`);
  }
  
  // Performance by complexity
  const simpleAvg = simpleResults
    .filter(r => r.success)
    .reduce((sum, r) => sum + r.responseTime, 0) / simpleResults.filter(r => r.success).length || 0;
  
  const complexAvg = complexResults
    .filter(r => r.success)
    .reduce((sum, r) => sum + r.responseTime, 0) / complexResults.filter(r => r.success).length || 0;
  
  console.log(`\n⚡ Performance by Complexity:`);
  console.log(`   Simple goals avg: ${simpleAvg.toFixed(0)}ms`);
  console.log(`   Complex goals avg: ${complexAvg.toFixed(0)}ms`);
  
  return allResults;
}

// Run tests if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

export { runTests, testGoalProcessing };