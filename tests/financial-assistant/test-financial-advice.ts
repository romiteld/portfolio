/**
 * Test Script: Financial Advice and RAG System
 * Tests general advice, educational queries, and RAG-enhanced responses
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

interface TestResult {
  testName: string;
  passed: boolean;
  response?: any;
  error?: string;
  duration: number;
  usedRAG?: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function testFinancialAdvice(query: string, expectedType: string, checkRAG: boolean = false): Promise<TestResult> {
  const startTime = Date.now();
  const testName = `Financial Advice: "${query}"`;
  
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
    
    // Check if response type matches expected
    const validTypes = ['general_advice', 'ai_enhanced_response', 'analysis'];
    if (!validTypes.includes(data.type)) {
      return { 
        testName, 
        passed: false, 
        error: `Expected advice-type response, got '${data.type}'`, 
        response: data, 
        duration 
      };
    }
    
    // Verify response has substantial content
    if (!data.summary || data.summary.length < 100) {
      return { testName, passed: false, error: 'Response too short or missing', response: data, duration };
    }
    
    // Check for disclaimer in financial advice
    const hasDisclaimer = data.summary.toLowerCase().includes('disclaimer') || 
                         data.summary.toLowerCase().includes('not financial advice') ||
                         data.summary.toLowerCase().includes('educational purposes');
    
    if (!hasDisclaimer && data.type === 'general_advice') {
      console.warn(`   ⚠️  No disclaimer found in advice for: "${query}"`);
    }
    
    // Check if RAG was used (for ai_enhanced_response type)
    const usedRAG = data.type === 'ai_enhanced_response' || 
                    (data.sources && data.sources.ragUsed);
    
    return { 
      testName, 
      passed: true, 
      response: data, 
      duration,
      usedRAG 
    };
  } catch (error) {
    return { 
      testName, 
      passed: false, 
      error: error instanceof Error ? error.message : 'Unknown error', 
      duration: Date.now() - startTime 
    };
  }
}

async function runTests() {
  console.log('🧪 Testing Financial Advice and RAG System\n');
  
  const testCases = [
    // Educational/Concept queries
    { query: 'What is volatility?', type: 'educational' },
    { query: 'Explain diversification', type: 'educational' },
    { query: 'How does inflation affect stocks?', type: 'educational' },
    { query: 'What is a P/E ratio?', type: 'educational' },
    { query: 'Define market capitalization', type: 'educational' },
    { query: 'What is a bull market?', type: 'educational' },
    
    // Investment advice queries
    { query: 'What should I invest in?', type: 'advice' },
    { query: 'Best stocks to buy now', type: 'advice' },
    { query: 'Is it good time to invest?', type: 'advice' },
    { query: 'Should I buy index funds?', type: 'advice' },
    { query: 'How to start investing?', type: 'advice' },
    
    // Specific strategy queries
    { query: 'Dollar cost averaging strategy', type: 'strategy' },
    { query: 'How to manage portfolio risk?', type: 'strategy' },
    { query: 'Cryptocurrency investment tips', type: 'strategy' },
    { query: 'Where can I research stocks online?', type: 'resources' },
    
    // Complex queries that should use RAG
    { query: 'Explain how market volatility affects long-term investment strategies', type: 'complex' },
    { query: 'What factors should I consider when building a diversified portfolio?', type: 'complex' },
    { query: 'How do economic indicators impact stock market performance?', type: 'complex' },
  ];
  
  const results: TestResult[] = [];
  
  for (const testCase of testCases) {
    console.log(`Testing: "${testCase.query}"`);
    const result = await testFinancialAdvice(testCase.query, testCase.type, true);
    results.push(result);
    
    if (result.passed) {
      console.log(`✅ ${result.testName} (${result.duration}ms)`);
      console.log(`   Type: ${result.response.type}`);
      console.log(`   RAG Used: ${result.usedRAG ? 'Yes' : 'No'}`);
      console.log(`   Summary length: ${result.response.summary.length} chars`);
      
      // Check for sources if RAG was used
      if (result.response.sources) {
        console.log(`   Sources: RAG=${result.response.sources.ragUsed}, Count=${result.response.sources.count || 0}`);
      }
    } else {
      console.log(`❌ ${result.testName} - ${result.error} (${result.duration}ms)`);
    }
    
    // Longer delay for AI responses
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Test user preferences integration
  console.log('\n📋 Testing with User Preferences:');
  
  const preferencesTestCases = [
    {
      query: 'Investment advice for my portfolio',
      preferences: {
        investmentStyle: 'conservative',
        riskTolerance: 'low',
        timeHorizon: 'long-term',
        portfolioFocus: ['dividend', 'bonds']
      }
    },
    {
      query: 'Should I invest in tech stocks?',
      preferences: {
        investmentStyle: 'aggressive',
        riskTolerance: 'high',
        favoriteSymbols: ['AAPL', 'GOOGL', 'NVDA']
      }
    }
  ];
  
  for (const testCase of preferencesTestCases) {
    const startTime = Date.now();
    try {
      const response = await fetch(`${API_URL}/api/financial-assistant/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: testCase.query,
          userPreferences: testCase.preferences 
        })
      });
      
      const data = await response.json();
      const duration = Date.now() - startTime;
      
      const result: TestResult = {
        testName: `With Preferences: "${testCase.query}"`,
        passed: response.ok && data.summary,
        response: data,
        duration
      };
      
      results.push(result);
      console.log(`${result.passed ? '✅' : '❌'} ${result.testName} (${duration}ms)`);
      
      if (result.passed) {
        // Check if preferences influenced the response
        const mentionsPreference = Object.values(testCase.preferences).some(pref => 
          data.summary.toLowerCase().includes(String(pref).toLowerCase())
        );
        console.log(`   Preferences reflected: ${mentionsPreference ? 'Yes' : 'No clear indication'}`);
      }
    } catch (error) {
      console.log(`❌ Error with preferences test: ${error}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Summary
  console.log('\n📊 Test Summary:');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`   Passed: ${passed}/${results.length}`);
  console.log(`   Failed: ${failed}/${results.length}`);
  console.log(`   Average response time: ${Math.round(results.reduce((sum, r) => sum + r.duration, 0) / results.length)}ms`);
  
  // RAG usage analysis
  const ragUsed = results.filter(r => r.usedRAG).length;
  console.log(`   RAG-enhanced responses: ${ragUsed}/${results.length}`);
  
  // Response type breakdown
  const typeBreakdown: Record<string, number> = {};
  results.forEach(r => {
    if (r.response?.type) {
      typeBreakdown[r.response.type] = (typeBreakdown[r.response.type] || 0) + 1;
    }
  });
  console.log(`   Response types:`, typeBreakdown);
  
  return results;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

export { runTests as testFinancialAdvice };