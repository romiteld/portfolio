import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { marketDataCache, chatRateLimiter } from '@/app/utils/rateLimiter'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

// Simulate a database for chat history
// In a real app, this would be a real database
const chatHistory: Record<string, { role: string, content: string }[]> = {}
const MAX_CONTEXT = 10 // Max number of messages to keep in context

// Fetches the latest market data from our internal API
async function fetchLatestMarketData() {
  try {
    // Check if we have cached data first
    const cachedData = marketDataCache.get('market-data')
    if (cachedData) {
      console.log(`Using cached market data for chat context (expires in ${marketDataCache.getRemainingTtl('market-data')}s)`)
      return cachedData
    }
    
    const response = await fetch('http://localhost:3000/api/market/data')
    if (!response.ok) {
      throw new Error(`Failed to fetch market data: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching market data:', error)
    return null
  }
}

// Format market data into a context string for the AI
function formatMarketContext(data: any): string {
  let context = ''
  
  // Format stock data
  if (data.stocks && data.stocks.length > 0) {
    context += 'Current stock prices:\n'
    data.stocks.slice(0, 5).forEach((stock: any) => {
      context += `${stock.symbol}: $${stock.price.toFixed(2)} (${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}, ${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%)\n`
    })
  }
  
  // Format indices data
  if (data.indices && data.indices.length > 0) {
    context += '\nCurrent market indices:\n'
    data.indices.forEach((index: any) => {
      context += `${index.name}: ${index.value.toFixed(2)} (${index.change >= 0 ? '+' : ''}${index.change}%)\n`
    })
  }
  
  context += `\nData ${data.isSimulated ? 'is simulated' : 'from Alpaca API'}, as of ${new Date(data.lastUpdated).toLocaleString()}`
  
  return context
}

// Generate dynamic suggestions based on market data
function generateSuggestions(marketData: any): string[] {
  // Base suggestions
  const suggestions = [
    "What are the best tech stocks to invest in?",
    "How is the S&P 500 performing today?",
    "Explain market volatility",
    "Should I invest in index funds?",
    "How do rising interest rates affect the stock market?",
    "What's a good portfolio allocation for a 30-year-old?",
    "Compare AAPL and MSFT stocks",
    "What are the risks of cryptocurrency investments?"
  ]
  
  // Add market-specific suggestions if data is available
  if (marketData.stocks && marketData.stocks.length > 0) {
    // Add some stock-specific questions
    const topStocks = marketData.stocks.slice(0, 3)
    topStocks.forEach((stock: any) => {
      suggestions.push(`Tell me about ${stock.symbol} stock`)
    })
  }
  
  return suggestions
}

// POST handler for chat messages
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { message, userId, marketData: clientMarketData } = body
    
    // Validate required fields
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    // Apply rate limiting based on user ID
    if (!chatRateLimiter.canMakeRequest(userId)) {
      const waitTime = chatRateLimiter.getTimeUntilNextSlot(userId)
      return NextResponse.json({ 
        error: `Rate limit exceeded. Please wait ${waitTime} seconds before sending another message.`,
        rateLimited: true,
        waitTime 
      }, { status: 429 })
    }
    
    // Initialize chat history for this user if it doesn't exist
    if (!chatHistory[userId]) {
      chatHistory[userId] = []
    }
    
    // Fetch the latest market data if not provided
    const marketData = clientMarketData || await fetchLatestMarketData()
    
    // Format market data for context
    const marketContext = marketData ? formatMarketContext(marketData) : ''
    
    // Add user message to history
    chatHistory[userId].push({ role: 'user', content: message })
    
    // Keep only the last MAX_CONTEXT messages
    if (chatHistory[userId].length > MAX_CONTEXT) {
      chatHistory[userId] = chatHistory[userId].slice(-MAX_CONTEXT)
    }
    
    // Prepare messages for OpenAI API
    const messages = [
      {
        role: 'system' as const,
        content: `You are a helpful AI financial assistant with expertise in stock markets, investing, and financial planning. Today is ${new Date().toLocaleDateString()}.
        
        ${marketContext}
        
        Provide concise and accurate responses to user inquiries. If asked about specific stocks or market performance, reference the market data provided above.
        If the user asks about a stock or market not in the data, explain that you don't have real-time data for that specific entity.`
      },
      ...chatHistory[userId].map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))
    ]
    
    // Track this chat request for rate limiting
    chatRateLimiter.trackRequest(userId)
    
    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.7,
      max_tokens: 500,
    })
    
    const reply = completion.choices[0].message.content
    
    if (reply) {
      // Add AI response to history
      chatHistory[userId].push({ role: 'assistant', content: reply })
      
      // Return the response
      return NextResponse.json({ message: reply })
    } else {
      throw new Error('Empty response from OpenAI')
    }
  } catch (error: any) {
    console.error('Error in chat API:', error)
    
    // Handle rate limiting errors specifically
    if (error.message && error.message.includes('rate limit')) {
      return NextResponse.json({ 
        error: 'OpenAI rate limit exceeded. Please try again later.',
        rateLimited: true
      }, { status: 429 })
    }
    
    return NextResponse.json({ 
      error: 'Failed to generate response',
      details: error.message || 'Unknown error'
    }, { status: 500 })
  }
}

// GET handler for retrieving chat history and suggestions
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    // Apply rate limiting for suggestions (more lenient than chat)
    const rateLimitKey = `suggestions-${userId}`
    if (!chatRateLimiter.canMakeRequest(rateLimitKey)) {
      return NextResponse.json({ 
        error: 'Rate limit exceeded for suggestions',
        chatHistory: chatHistory[userId] || [],
        suggestions: [] 
      })
    }
    
    // Track this request
    chatRateLimiter.trackRequest(rateLimitKey)
    
    // Fetch market data for generating suggestions
    const marketData = await fetchLatestMarketData()
    const suggestions = marketData ? generateSuggestions(marketData) : []
    
    return NextResponse.json({
      chatHistory: chatHistory[userId] || [],
      suggestions
    })
  } catch (error) {
    console.error('Error in GET chat API:', error)
    return NextResponse.json({ error: 'Failed to retrieve chat data' }, { status: 500 })
  }
} 