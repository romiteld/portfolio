/**
 * OpenAI + Supabase Integration Helper for Financial Assistant
 * 
 * This file provides utility functions to use OpenAI with Supabase database content
 * for generating enhanced financial assistant responses.
 */

import { OpenAI } from 'openai';
import { queryFinancialKnowledge } from './supabaseFinancialStorage';
import { FinancialAdvice, MarketData } from './supabaseFinancialSchema';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

/**
 * Generate a financial advice response using OpenAI with Supabase content
 * 
 * @param query - The user's query
 * @param marketContext - Current market data context
 * @param adviceContent - Advice content retrieved from Supabase
 * @param marketData - Market data retrieved from Supabase
 * @returns A formatted response for the financial assistant
 */
export async function generateFinancialAdviceWithRAG(
  query: string,
  marketContext?: string,
  useRAG: boolean = true
) {
  try {
    // Retrieve relevant financial knowledge if RAG is enabled
    let ragContext = '';
    if (useRAG) {
      const knowledgeResult = await queryFinancialKnowledge(query);
      if (knowledgeResult.success && knowledgeResult.results && knowledgeResult.results.length > 0) {
        ragContext = knowledgeResult.results
          .map(doc => `${doc.metadata.title}:\n${doc.content}`)
          .join('\n\n');
      }
    }

    // Check if market context contains real-time information
    const hasRealtimeInfo = marketContext?.includes('Recent Financial Information');

    // Prepare the system message with context - prioritize real-time information when available
    const systemMessage = `You are a helpful financial assistant providing accurate and educational information about the stock market, investment strategies, and financial concepts.
    
${hasRealtimeInfo ? `Important: This request includes recent financial information that should be prioritized in your response.\n\n` : ''}
${marketContext ? `${marketContext}\n\n` : ''}
${ragContext ? `Relevant Financial Knowledge:\n${ragContext}\n\n` : ''}

Important guidelines:
1. Use factual, educational information to answer financial questions
2. When discussing stock prices or market trends, reference the most recent data when available
3. If recent financial information is provided, incorporate it prominently in your response
4. If a specific stock symbol is mentioned, provide specific details about that company or asset
5. Always include appropriate disclaimers for financial advice
6. Format responses clearly with headings, bullet points, and tables when appropriate`;

    // Generate response with OpenAI
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: query }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    // Extract and return the generated response
    const response = chatCompletion.choices[0]?.message?.content || "I couldn't generate a response at this time.";
    return {
      type: 'ai_enhanced_response',
      summary: response,
      sources: {
        ragUsed: useRAG && ragContext ? true : false,
        recentInfoUsed: hasRealtimeInfo,
        count: (ragContext.match(/\n\n/g) || []).length + 1
      }
    };
  } catch (error) {
    console.error("Error generating financial advice with OpenAI:", error);
    return {
      type: 'error',
      summary: `Sorry, I encountered an error while processing your request. Please try again later. ${error instanceof Error ? error.message : ''}`,
    };
  }
}

/**
 * Generate a fallback response when OpenAI is unavailable
 * 
 * @param query - The user's query 
 * @param marketContext - Current market data context
 * @param adviceContent - Advice content retrieved from Supabase
 * @returns A formatted fallback response
 */
function generateFallbackResponse(
  query: string,
  marketContext: string,
  adviceContent: FinancialAdvice[] = []
): { summary: string; key_metrics: Record<string, string> } {
  // If we have advice content from Supabase, use the most relevant one
  if (adviceContent && adviceContent.length > 0) {
    const mostRelevant = adviceContent[0]; // First result is assumed to be most relevant
    
    return {
      summary: `**${mostRelevant.title}**\n\n${mostRelevant.content}\n\n${marketContext}\n\n**Disclaimer:** This information is for educational purposes only. Every investment situation is unique, and you should consult with a qualified financial advisor before making investment decisions.`,
      key_metrics: {}
    };
  }
  
  // Last resort fallback if no content is available
  return {
    summary: `I processed your query about "${query}", but I'm unable to provide detailed financial advice at this time. Please consider consulting reliable financial news sources and a qualified financial advisor.\n\n${marketContext}\n\n**Disclaimer:** Always research thoroughly and consult with a professional before making investment decisions.`,
    key_metrics: {}
  };
}

/**
 * Function to determine what Supabase data to fetch based on the query intent
 * 
 * @param intent - The detected intent from the query
 * @param query - The original query text
 * @returns Categories and keywords to use for Supabase queries
 */
export function getQueryParameters(
  intent: string,
  query: string
): { categories: string[]; keywords: string[] } {
  const lowerQuery = query.toLowerCase();
  
  // Extract meaningful keywords from the query
  // This is a simple implementation - in production you might use NLP techniques
  const keywords = lowerQuery
    .replace(/[^\w\s]/gi, '')
    .split(/\s+/)
    .filter(word => word.length > 3) // Only words longer than 3 characters
    .filter(word => !['what', 'should', 'could', 'would', 'about', 'tell', 'know'].includes(word));
  
  // Map intent to categories
  const intentCategoryMap: Record<string, string[]> = {
    'general_advice': ['general', 'investing'],
    'lookup': ['general'],
    'compare': ['investing'],
    'summary': ['general', 'investing'],
    'analysis': ['investing', 'risk'],
    'unknown': ['general'],
  };
  
  // Add specific categories based on keywords
  const categoryKeywords: Record<string, string[]> = {
    'crypto': ['crypto', 'bitcoin', 'ethereum', 'blockchain', 'token', 'defi'],
    'index_funds': ['index', 'etf', 'fund', 'passive', 'mutual'],
    'risk': ['risk', 'volatility', 'safe', 'secure', 'protect', 'downside'],
    'research': ['research', 'information', 'learn', 'study', 'resources', 'tools'],
  };
  
  // Detect additional categories from keywords
  const additionalCategories = Object.entries(categoryKeywords)
    .filter(([_, words]) => words.some(word => lowerQuery.includes(word)))
    .map(([category, _]) => category);
  
  // Combine base categories from intent with additional categories from keywords
  const categories = [...(intentCategoryMap[intent] || ['general']), ...additionalCategories];
  
  return { 
    categories: [...new Set(categories)], // Remove duplicates
    keywords 
  };
} 