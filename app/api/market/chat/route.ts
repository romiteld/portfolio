import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { marketDataCache, chatRateLimiter } from '@/app/utils/rateLimiter'
import yahooFinance from 'yahoo-finance2'; // Import yahoo-finance2

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

// Simulate a database for chat history
// In a real app, this would be a real database
const chatHistory: Record<string, { role: string, content: string }[]> = {}
const MAX_CONTEXT = 10 // Max number of messages to keep in context

// Fetches the latest market data using yahoo-finance2
async function fetchLatestMarketData() {
  try {
    const cacheKey = 'market-data-expanded' // Use the same cache key as the main data route
    const cachedData = marketDataCache.get(cacheKey)
    if (cachedData) {
      console.log(`Using cached market data for chat context (expires in ${marketDataCache.getRemainingTtl(cacheKey)}s)`)
      // Ensure the cached data has the expected structure
      return {
          stocks: cachedData.stocks || [],
          indices: cachedData.indices || [],
          crypto: cachedData.crypto || [],
          sectors: cachedData.sectors || [],
          isSimulated: cachedData.isSimulated || false,
          lastUpdated: cachedData.lastUpdated || new Date().toISOString()
      };
    }
    
    // If not cached, fetch fresh (using a simplified list for context maybe?)
    console.log("Fetching fresh market data for chat context using yahoo-finance2...")
    
    // Define symbols relevant for context (can be a subset of the main list)
    const contextSymbols = [
        'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', // Key Tech
        '^GSPC', '^IXIC', '^DJI', // US Indices
        'BTC-USD', 'ETH-USD' // Key Crypto
    ]; 
    
    const results = await yahooFinance.quote(contextSymbols);
    if (!results || results.length === 0) {
        console.warn("yahoo-finance2 returned no results for context symbols.");
        return null;
    }

    // Process results into a simplified structure for context
    const stocks: any[] = [];
    const indices: any[] = [];
    const crypto: any[] = [];

    const indicesNameMap: Record<string, string> = {
      '^GSPC': 'S&P 500', '^IXIC': 'Nasdaq Comp.', '^DJI': 'Dow Jones'
    };

    results.forEach(quote => {
      if (!quote || !quote.symbol) return;

      const price = quote.regularMarketPrice ?? 0;
      const change = quote.regularMarketChange ?? 0;
      const changePercent = quote.regularMarketChangePercent ?? 0;
      const name = quote.shortName || quote.longName || quote.symbol;

      const commonData = {
        symbol: quote.symbol,
        name: name,
        price: parseFloat(price.toFixed(2)),
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(changePercent.toFixed(2)),
      };

      if (quote.symbol.startsWith('^')) {
        indices.push({
          name: indicesNameMap[quote.symbol] || name.replace('^', ''),
          value: commonData.price,
          change: commonData.changePercent
        });
      } else if (quote.symbol.includes('-USD')) {
         crypto.push(commonData);
      } else {
        stocks.push(commonData);
      }
    });

     const fetchedData = {
        stocks,
        indices,
        crypto,
        sectors: [], // Sector data less relevant for immediate context
        isSimulated: false, // Data is live from Yahoo
        lastUpdated: new Date().toISOString()
     };
     
     // Cache the newly fetched data
     marketDataCache.set(cacheKey, fetchedData); // Cache this simplified context data
     
     return fetchedData;

  } catch (error) {
    console.error('Error fetching market data for chat context:', error)
    return null // Return null on error, system prompt will indicate lack of data
  }
}

// Format market data into a context string for the AI
function formatMarketContext(data: any): string {
  if (!data) return 'Real-time market data is currently unavailable.';
  
  let context = `**Market Data (${data.isSimulated ? 'Simulated' : 'Live as of'} ${new Date(data.lastUpdated).toLocaleTimeString()}):**\n`;

  // Format stock data
  if (data.stocks && data.stocks.length > 0) {
    context += '\n*Selected Stocks:*\n'
    data.stocks.forEach((stock: any) => {
      context += `  - ${stock.symbol} (${stock.name}): ${stock.price.toFixed(2)} (${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}, ${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%)\n`
    })
  }
  
  // Format indices data
  if (data.indices && data.indices.length > 0) {
    context += '\n*Major Indices:*\n'
    data.indices.forEach((index: any) => {
      context += `  - ${index.name}: ${index.value.toFixed(2)} (${index.change >= 0 ? '+' : ''}${index.change.toFixed(2)}%)\n` // Indices change is % change
    })
  }
  
   // Format crypto data
  if (data.crypto && data.crypto.length > 0) {
    context += '\n*Selected Crypto:*\n'
    data.crypto.forEach((c: any) => {
      context += `  - ${c.symbol} (${c.name}): ${c.price.toFixed(2)} (${c.change >= 0 ? '+' : ''}${c.change.toFixed(2)}, ${c.changePercent >= 0 ? '+' : ''}${c.changePercent.toFixed(2)}%)\n`
    })
  }
  
  return context.trim();
}

// Generate dynamic suggestions based on market data
function generateSuggestions(marketData: any): string[] {
  // Base suggestions
  const suggestions = [
    "How is the market doing today?",
    "Compare AAPL and MSFT",
    "Analyze TSLA stock",
    "What is Bitcoin price?",
    "Explain market volatility",
    "Should I invest in index funds?",
  ]
  
  // Add market-specific suggestions if data is available
  if (marketData && marketData.stocks && marketData.stocks.length > 0) {
    suggestions.push(`Tell me about ${marketData.stocks[0].symbol}`);
  }
  if (marketData && marketData.indices && marketData.indices.length > 0) {
     suggestions.push(`What is the ${marketData.indices[0].name} value?`);
  }
   if (marketData && marketData.crypto && marketData.crypto.length > 0) {
     suggestions.push(`Latest ${marketData.crypto[0].name} price?`);
  }
  
  // Simple shuffle and limit suggestions
  return suggestions.sort(() => 0.5 - Math.random()).slice(0, 6);
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
        content: `You are a helpful AI financial assistant. Today is ${new Date().toLocaleDateString()}. Provide concise, factual answers. If asked about specific assets or market performance, use the data below. If asked about something not listed, state you lack real-time data for it.\n\n${marketContext}`
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
      temperature: 0.6, // Slightly lower temp for more factual finance answers
      max_tokens: 400,
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
    const marketDataForSuggestions = await fetchLatestMarketData()
    const suggestions = generateSuggestions(marketDataForSuggestions)
    
    return NextResponse.json({
      chatHistory: chatHistory[userId] || [],
      suggestions
    })
  } catch (error) {
    console.error('Error in GET chat API:', error)
    return NextResponse.json({ error: 'Failed to retrieve chat data' }, { status: 500 })
  }
} 