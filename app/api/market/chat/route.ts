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
    
    // Make a direct API call to the Alpaca API using the same credentials
    // This avoids URL construction issues in different environments
    console.log("Fetching market data directly for chat context")
    
    const apiKey = process.env.ALPACA_API_KEY
    const apiSecret = process.env.ALPACA_API_SECRET
    const apiEndpoint = process.env.ALPACA_API_ENDPOINT || 'https://paper-api.alpaca.markets'
    const dataEndpoint = process.env.ALPACA_DATA_ENDPOINT || 'https://data.alpaca.markets'
    
    if (!apiKey || !apiSecret) {
      console.log("Missing Alpaca API credentials, falling back to simulated data")
      return null 
    }
    
    // Define symbols to fetch - keep this in sync with the data API
    const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'BRK.B']
    const indicesSymbols = ['SPY', 'QQQ', 'DIA', 'IWM', 'VIX']
    
    try {
      // Verify account access first 
      const accountResponse = await fetch(`${apiEndpoint}/v2/account`, {
        headers: {
          'APCA-API-KEY-ID': apiKey,
          'APCA-API-SECRET-KEY': apiSecret
        }
      })
      
      if (!accountResponse.ok) {
        console.log(`Account verification failed: ${accountResponse.status}`)
        return null
      }
      
      // Now fetch the actual market data - similar to what the market data API does
      const quotesUrl = `${dataEndpoint}/v2/stocks/bars/latest?symbols=${symbols.join(',')}`
      const quotesResponse = await fetch(quotesUrl, {
        headers: {
          'APCA-API-KEY-ID': apiKey,
          'APCA-API-SECRET-KEY': apiSecret
        }
      })
      
      if (!quotesResponse.ok) {
        console.log(`Quotes fetch failed: ${quotesResponse.status}`)
        return null
      }
      
      const quotesData = await quotesResponse.json()
      
      // Transform the data to match the expected format
      // The Alpaca API returns data in a "bars" format
      if (!quotesData.bars) {
        console.log('Unexpected Alpaca data format:', JSON.stringify(quotesData).substring(0, 200) + '...')
        return null
      }
      
      const stocks = Object.entries(quotesData.bars).map(([symbol, data]: [string, any]) => {
        // In bars format, 'c' is closing price, 'o' is opening price
        const price = data.c || 0
        const previousPrice = data.o || price
        const change = price - previousPrice
        const changePercent = previousPrice > 0 ? (change / previousPrice) * 100 : 0
        
        return {
          symbol,
          price,
          change,
          changePercent,
          name: symbol
        }
      })
      
      // Fetch market indices
      const indicesUrl = `${dataEndpoint}/v2/stocks/bars/latest?symbols=${indicesSymbols.join(',')}`
      const indicesResponse = await fetch(indicesUrl, {
        headers: {
          'APCA-API-KEY-ID': apiKey,
          'APCA-API-SECRET-KEY': apiSecret
        }
      })
      
      let indices = [
        { name: 'S&P 500', value: 0, change: 0 },
        { name: 'Nasdaq', value: 0, change: 0 },
        { name: 'Dow Jones', value: 0, change: 0 },
        { name: 'Russell 2000', value: 0, change: 0 }
      ]
      
      if (indicesResponse.ok) {
        const indicesData = await indicesResponse.json()
        
        if (indicesData.bars) {
          // Map indices symbols to their display names
          const indexMap: Record<string, string> = {
            'SPY': 'S&P 500',
            'QQQ': 'Nasdaq',
            'DIA': 'Dow Jones',
            'IWM': 'Russell 2000',
            'VIX': 'VIX Index'
          }
          
          indices = Object.entries(indicesData.bars)
            .filter(([symbol]) => indexMap[symbol])
            .map(([symbol, data]: [string, any]) => {
              const value = data.c || 0
              const previousValue = data.o || value
              const percentChange = previousValue > 0 ? ((value - previousValue) / previousValue) * 100 : 0
              
              return {
                name: indexMap[symbol],
                value,
                change: parseFloat(percentChange.toFixed(2))
              }
            })
        }
      }
      
      return {
        stocks,
        indices,
        lastUpdated: new Date().toISOString(),
        isSimulated: false
      }
    } catch (error) {
      console.error('Error directly fetching from Alpaca:', error)
      return null
    }
  } catch (error) {
    console.error('Error in fetchLatestMarketData:', error)
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