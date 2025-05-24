import { TEST_CONFIG, TEST_PROMPTS } from './test-config';

const API_URL = `${TEST_CONFIG.API_URL}/api/generative-ai`;

interface PerformanceMetrics {
  testName: string;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  successRate: number;
  totalRequests: number;
}

async function measurePerformance(
  payload: any,
  iterations: number = 5
): Promise<PerformanceMetrics> {
  const responseTimes: number[] = [];
  let successCount = 0;
  
  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(TEST_CONFIG.TIMEOUT)
      });
      
      const responseTime = Date.now() - startTime;
      responseTimes.push(responseTime);
      
      if (response.ok) {
        const data = await response.json();
        if ((payload.type === 'text' && data.text) || (payload.type === 'image' && data.imageUrl)) {
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
    testName: `${payload.type} generation`,
    avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
    minResponseTime: Math.min(...responseTimes),
    maxResponseTime: Math.max(...responseTimes),
    successRate: (successCount / iterations) * 100,
    totalRequests: iterations
  };
}

async function testConcurrentRequests() {
  console.log('\n🔄 Testing concurrent requests...');
  
  const concurrentPayloads = [
    { prompt: 'Write a haiku', type: 'text', maxTokens: 50 },
    { prompt: 'What is 2+2?', type: 'text', maxTokens: 50 },
    { prompt: 'Hello world', type: 'text', maxTokens: 50 }
  ];
  
  const startTime = Date.now();
  const promises = concurrentPayloads.map(payload => 
    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  );
  
  const responses = await Promise.all(promises);
  const totalTime = Date.now() - startTime;
  const successCount = responses.filter(r => r.ok).length;
  
  console.log(`   Concurrent requests: ${promises.length}`);
  console.log(`   Successful: ${successCount}/${promises.length}`);
  console.log(`   Total time: ${totalTime}ms`);
  console.log(`   Avg time per request: ${(totalTime / promises.length).toFixed(0)}ms`);
  
  return {
    concurrentRequests: promises.length,
    successCount,
    totalTime,
    avgTimePerRequest: totalTime / promises.length
  };
}

async function testCaching() {
  console.log('\n💾 Testing response caching...');
  
  const cacheTestPayload = {
    prompt: 'What is the capital of France?',
    type: 'text',
    temperature: 0, // Low temperature for consistent results
    maxTokens: 50
  };
  
  // First request
  const firstStart = Date.now();
  const firstResponse = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cacheTestPayload)
  });
  const firstTime = Date.now() - firstStart;
  const firstData = await firstResponse.json();
  
  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Second request (potentially cached)
  const secondStart = Date.now();
  const secondResponse = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cacheTestPayload)
  });
  const secondTime = Date.now() - secondStart;
  const secondData = await secondResponse.json();
  
  const improvement = ((firstTime - secondTime) / firstTime) * 100;
  const sameResponse = firstData.text === secondData.text;
  
  console.log(`   First request: ${firstTime}ms`);
  console.log(`   Second request: ${secondTime}ms`);
  console.log(`   Speed improvement: ${improvement.toFixed(1)}%`);
  console.log(`   Same response: ${sameResponse}`);
  
  return {
    firstTime,
    secondTime,
    improvement,
    sameResponse
  };
}

async function runTests() {
  console.log('⚡ Testing Performance Characteristics\n');
  
  const metrics: PerformanceMetrics[] = [];
  
  // Test text generation performance
  console.log('📝 Testing text generation performance...');
  const textMetrics = await measurePerformance({
    prompt: TEST_PROMPTS.text.simple,
    type: 'text',
    temperature: 0.7,
    maxTokens: 100
  }, 3);
  
  metrics.push(textMetrics);
  console.log(`   Average response time: ${textMetrics.avgResponseTime.toFixed(0)}ms`);
  console.log(`   Min/Max: ${textMetrics.minResponseTime}ms / ${textMetrics.maxResponseTime}ms`);
  console.log(`   Success rate: ${textMetrics.successRate}%`);
  
  // Test image generation performance
  console.log('\n🎨 Testing image generation performance...');
  const imageMetrics = await measurePerformance({
    prompt: TEST_PROMPTS.image.simple,
    type: 'image',
    size: '1024x1024'
  }, 3);
  
  metrics.push(imageMetrics);
  console.log(`   Average response time: ${imageMetrics.avgResponseTime.toFixed(0)}ms`);
  console.log(`   Min/Max: ${imageMetrics.minResponseTime}ms / ${imageMetrics.maxResponseTime}ms`);
  console.log(`   Success rate: ${imageMetrics.successRate}%`);
  
  // Test different text lengths
  console.log('\n📏 Testing response time vs output length...');
  const lengthTests = [50, 200, 400];
  
  for (const maxTokens of lengthTests) {
    const result = await measurePerformance({
      prompt: TEST_PROMPTS.text.complex,
      type: 'text',
      temperature: 0.7,
      maxTokens
    }, 2);
    
    console.log(`   Max tokens ${maxTokens}: ${result.avgResponseTime.toFixed(0)}ms avg`);
  }
  
  // Test concurrent requests
  const concurrentResults = await testConcurrentRequests();
  
  // Test caching behavior
  const cacheResults = await testCaching();
  
  // Summary
  console.log('\n📊 Performance Summary:');
  console.log(`   Text generation avg: ${textMetrics.avgResponseTime.toFixed(0)}ms`);
  console.log(`   Image generation avg: ${imageMetrics.avgResponseTime.toFixed(0)}ms`);
  console.log(`   Concurrent handling: ${concurrentResults.successCount}/${concurrentResults.concurrentRequests} successful`);
  console.log(`   Cache benefit: ${cacheResults.improvement > 0 ? `${cacheResults.improvement.toFixed(1)}% faster` : 'No caching detected'}`);
  
  // Performance recommendations
  console.log('\n💡 Performance Recommendations:');
  if (textMetrics.avgResponseTime > 5000) {
    console.log('   - Text generation is slow, consider reducing max tokens or optimizing prompts');
  }
  if (imageMetrics.avgResponseTime > 15000) {
    console.log('   - Image generation is slow, consider using smaller sizes for previews');
  }
  if (concurrentResults.successCount < concurrentResults.concurrentRequests) {
    console.log('   - Some concurrent requests failed, implement queuing or retry logic');
  }
  
  return {
    metrics,
    concurrentResults,
    cacheResults
  };
}

// Run tests if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

export { runTests, measurePerformance };