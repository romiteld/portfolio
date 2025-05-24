import { TEST_CONFIG, AGENTS, TEST_GOALS, AgentResponse } from './test-config';

const API_URL = `${TEST_CONFIG.API_URL}/api/interactive-agents`;

interface PerformanceMetrics {
  testName: string;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  successRate: number;
  totalRequests: number;
  agentCount: number;
}

async function measurePerformance(
  goal: string,
  agents: string[],
  iterations: number = 3
): Promise<PerformanceMetrics> {
  const responseTimes: number[] = [];
  let successCount = 0;
  
  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, agents }),
        signal: AbortSignal.timeout(TEST_CONFIG.TIMEOUT)
      });
      
      const responseTime = Date.now() - startTime;
      responseTimes.push(responseTime);
      
      if (response.ok) {
        const data: AgentResponse = await response.json();
        if (data.steps && data.steps.length === agents.length) {
          successCount++;
        }
      }
      
      // Add delay between requests to avoid rate limiting
      if (i < iterations - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      responseTimes.push(Date.now() - startTime);
    }
  }
  
  return {
    testName: `${agents.length} agent(s)`,
    avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
    minResponseTime: Math.min(...responseTimes),
    maxResponseTime: Math.max(...responseTimes),
    successRate: (successCount / iterations) * 100,
    totalRequests: iterations,
    agentCount: agents.length
  };
}

async function testScalability() {
  console.log('\n📈 Testing scalability with increasing agents...');
  
  const goal = TEST_GOALS.simple.website;
  const metrics: PerformanceMetrics[] = [];
  
  // Test with 1, 3, and 6 agents
  const agentCounts = [
    ['developer'],
    ['developer', 'designer', 'pm'],
    ['developer', 'designer', 'marketing', 'data', 'writer', 'pm']
  ];
  
  for (const agents of agentCounts) {
    console.log(`\nTesting with ${agents.length} agent(s)...`);
    const metric = await measurePerformance(goal, agents, 2);
    metrics.push(metric);
    
    console.log(`   Average response time: ${metric.avgResponseTime.toFixed(0)}ms`);
    console.log(`   Min/Max: ${metric.minResponseTime}ms / ${metric.maxResponseTime}ms`);
    console.log(`   Success rate: ${metric.successRate}%`);
  }
  
  // Analyze scaling
  console.log('\n📊 Scalability Analysis:');
  const baseTime = metrics[0].avgResponseTime;
  metrics.forEach(m => {
    const factor = m.avgResponseTime / baseTime;
    console.log(`   ${m.agentCount} agents: ${factor.toFixed(2)}x baseline`);
  });
  
  return metrics;
}

async function testConcurrentRequests() {
  console.log('\n🔄 Testing concurrent request handling...');
  
  const concurrentGoals = [
    { goal: 'Build a website', agents: ['developer'] },
    { goal: 'Write a blog post', agents: ['writer'] },
    { goal: 'Analyze data', agents: ['data'] }
  ];
  
  const startTime = Date.now();
  const promises = concurrentGoals.map(({ goal, agents }) => 
    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal, agents })
    })
  );
  
  const responses = await Promise.all(promises);
  const totalTime = Date.now() - startTime;
  const successCount = responses.filter(r => r.ok).length;
  
  console.log(`   Concurrent requests: ${promises.length}`);
  console.log(`   Successful: ${successCount}/${promises.length}`);
  console.log(`   Total time: ${totalTime}ms`);
  console.log(`   Avg time per request: ${(totalTime / promises.length).toFixed(0)}ms`);
  
  // Compare with sequential
  console.log('\n   Running same requests sequentially...');
  const seqStartTime = Date.now();
  for (const { goal, agents } of concurrentGoals) {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal, agents })
    });
  }
  const seqTotalTime = Date.now() - seqStartTime;
  
  console.log(`   Sequential total time: ${seqTotalTime}ms`);
  console.log(`   Speedup factor: ${(seqTotalTime / totalTime).toFixed(2)}x`);
  
  return {
    concurrentTime: totalTime,
    sequentialTime: seqTotalTime,
    speedup: seqTotalTime / totalTime
  };
}

async function testResponseConsistency() {
  console.log('\n🎯 Testing response consistency...');
  
  const goal = 'Create a simple landing page';
  const agents = ['developer'];
  const iterations = 3;
  const responses: string[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal, agents })
    });
    
    if (response.ok) {
      const data: AgentResponse = await response.json();
      if (data.steps && data.steps[0]) {
        responses.push(data.steps[0].text);
      }
    }
    
    // Wait between requests
    if (i < iterations - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Analyze consistency
  if (responses.length >= 2) {
    // Simple similarity check: count common words
    const words1 = responses[0].toLowerCase().split(/\s+/);
    const words2 = responses[1].toLowerCase().split(/\s+/);
    const commonWords = words1.filter(w => words2.includes(w) && w.length > 3);
    const similarity = (commonWords.length / Math.min(words1.length, words2.length)) * 100;
    
    console.log(`   Response consistency: ${similarity.toFixed(0)}% similarity`);
    console.log(`   Common keywords: ${commonWords.slice(0, 5).join(', ')}...`);
  }
  
  return responses;
}

async function testMemoryUsage() {
  console.log('\n💾 Testing memory and context handling...');
  
  // Test if agents maintain context across responses
  const agents = ['developer', 'designer', 'marketing'];
  const goal = 'Build an e-commerce platform';
  
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ goal, agents })
  });
  
  if (response.ok) {
    const data: AgentResponse = await response.json();
    
    // Check if later agents reference earlier ones
    let contextReferences = 0;
    for (let i = 1; i < data.steps.length; i++) {
      const currentText = data.steps[i].text.toLowerCase();
      
      // Check for references to previous agents
      for (let j = 0; j < i; j++) {
        const previousAgent = data.steps[j].name.toLowerCase();
        if (currentText.includes(previousAgent) || 
            currentText.includes('previous') || 
            currentText.includes('mentioned')) {
          contextReferences++;
          break;
        }
      }
    }
    
    const contextAware = contextReferences > 0;
    console.log(`   Context awareness: ${contextAware ? 'Yes' : 'No'}`);
    console.log(`   Context references found: ${contextReferences}`);
    
    // Check response sizes
    const responseSizes = data.steps.map(s => s.text.length);
    const avgSize = responseSizes.reduce((a, b) => a + b, 0) / responseSizes.length;
    console.log(`   Average response size: ${avgSize.toFixed(0)} characters`);
    console.log(`   Total response size: ${responseSizes.reduce((a, b) => a + b, 0)} characters`);
  }
}

async function runTests() {
  console.log('⚡ Testing Performance Characteristics\n');
  
  // Test scalability
  const scalabilityMetrics = await testScalability();
  
  // Test concurrent requests
  const concurrencyResults = await testConcurrentRequests();
  
  // Test response consistency
  await testResponseConsistency();
  
  // Test memory usage
  await testMemoryUsage();
  
  // Summary
  console.log('\n📊 Performance Summary:');
  
  // Calculate performance degradation
  const singleAgent = scalabilityMetrics.find(m => m.agentCount === 1);
  const sixAgents = scalabilityMetrics.find(m => m.agentCount === 6);
  
  if (singleAgent && sixAgents) {
    const degradation = ((sixAgents.avgResponseTime - singleAgent.avgResponseTime) / singleAgent.avgResponseTime) * 100;
    console.log(`   Performance degradation (1→6 agents): +${degradation.toFixed(0)}%`);
  }
  
  console.log(`   Concurrent speedup: ${concurrencyResults.speedup.toFixed(2)}x`);
  
  // Recommendations
  console.log('\n💡 Performance Recommendations:');
  
  if (sixAgents && sixAgents.avgResponseTime > 10000) {
    console.log('   - Consider limiting maximum agents to improve response time');
  }
  
  if (concurrencyResults.speedup < 1.5) {
    console.log('   - Concurrent processing benefit is limited');
  }
  
  const avgSuccessRate = scalabilityMetrics.reduce((sum, m) => sum + m.successRate, 0) / scalabilityMetrics.length;
  if (avgSuccessRate < 90) {
    console.log(`   - Success rate is ${avgSuccessRate.toFixed(0)}%, consider retry logic`);
  }
  
  return {
    scalabilityMetrics,
    concurrencyResults
  };
}

// Run tests if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

export { runTests, measurePerformance };