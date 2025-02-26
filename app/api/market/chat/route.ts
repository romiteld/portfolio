import { NextResponse } from 'next/server'
import { OpenAI } from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Simulate database for chat history (in a real app, use a database)
const chatHistory: { userId: string; messages: any[] }[] = []

// Maximum number of messages to keep in context
const MAX_CONTEXT_MESSAGES = 10

export async function POST(request: Request) {
  try {
    const { message, userId = 'anonymous', marketData } = await request.json()
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Find or create user chat history
    let userChat = chatHistory.find(chat => chat.userId === userId)
    if (!userChat) {
      userChat = { userId, messages: [] }
      chatHistory.push(userChat)
    }
    
    // Add user message to history
    userChat.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    })
    
    // Fetch latest market data to provide context
    let latestMarketData = marketData
    if (!latestMarketData) {
      try {
        const marketResponse = await fetch(new URL('/api/market/data', request.url).toString())
        if (marketResponse.ok) {
          latestMarketData = await marketResponse.json()
        }
      } catch (error) {
        console.error('Error fetching market data for context:', error)
      }
    }
    
    // Create market data context string
    let marketContext = ''
    if (latestMarketData) {
      try {
        // Format top stocks
        if (latestMarketData.stocks && latestMarketData.stocks.length > 0) {
          marketContext += 'Current stock prices:\n'
          latestMarketData.stocks.slice(0, 5).forEach((stock: any) => {
            marketContext += `${stock.symbol}: $${stock.price.toFixed(2)} (${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}, ${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%)\n`
          })
        }
        
        // Format indices with extra emphasis
        if (latestMarketData.indices && latestMarketData.indices.length > 0) {
          marketContext += '\n=== MARKET INDICES (USE THIS DATA FOR INDEX QUESTIONS) ===\n'
          latestMarketData.indices.forEach((index: any) => {
            // Add special emphasis to S&P 500
            if (index.name === 'S&P 500') {
              marketContext += `>> ${index.name}: ${index.value.toFixed(2)} (${index.change >= 0 ? '+' : ''}${index.change}%) <<\n`
            } else {
              marketContext += `${index.name}: ${index.value.toFixed(2)} (${index.change >= 0 ? '+' : ''}${index.change}%)\n`
            }
          })
          marketContext += '=== END OF MARKET INDICES ===\n'
        }
        
        marketContext += `\nData ${latestMarketData.isSimulated ? 'is simulated' : 'from Alpaca API'}, as of ${new Date(latestMarketData.lastUpdated).toLocaleString()}`
      } catch (error) {
        console.error('Error formatting market data for context:', error)
        marketContext = 'Error retrieving current market data details.'
      }
    }
    
    // Prepare messages for OpenAI - include limited context to stay within token limits
    const contextMessages = userChat.messages.slice(-MAX_CONTEXT_MESSAGES).map((msg) => ({
      role: msg.role,
      content: msg.content
    }))
    
    // Create system message with financial expertise instructions and market data
    const systemMessage = {
      role: 'system',
      content: `You are a professional Financial Market Assistant with expertise in stocks, investing, market trends, and financial analysis. 
You provide helpful, accurate financial advice and market insights based on real market data.

${marketContext ? `Here is the latest market data to reference in your response:\n${marketContext}\n\n` : ''}

CRITICAL INSTRUCTIONS FOR MARKET INDEX QUESTIONS:
1. When users ask about ANY market index (S&P 500, Dow Jones, Nasdaq, Russell 2000), you MUST use the EXACT values shown in the MARKET INDICES section above.
2. For example, if asked "How is the S&P 500 performing today?", respond with the EXACT value and percentage from the data, such as: "The S&P 500 is currently at 593.83, up +1.01% today."
3. NEVER state that you don't have market data when the data appears in the context above.
4. If the data shows real market information, ALWAYS use it to provide specific numeric answers.

Answer questions concisely and accurately. Do not make up specific stock prices or movements unless they are provided in the market data context. 
If you don't know specific data points not included above, acknowledge this and provide general guidance instead.
Always consider risk disclosures when giving any investment-related information.`
    }
    
    // Call OpenAI API
    const openAIMessages = [systemMessage, ...contextMessages]
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Using GPT-4o for better financial understanding
      messages: openAIMessages,
      temperature: 0.7,
      max_tokens: 500,
    })
    
    const responseContent = completion.choices[0].message.content || "I apologize, I couldn't generate a response for that query."
    
    // Add assistant response to history
    const response = {
      role: 'assistant',
      content: responseContent,
      timestamp: new Date().toISOString()
    }
    userChat.messages.push(response)
    
    // Limit history size (keep last 50 messages)
    if (userChat.messages.length > 50) {
      userChat.messages = userChat.messages.slice(-50)
    }
    
    return NextResponse.json({ message: responseContent })
  } catch (error) {
    console.error('Error in financial chat API:', error)
    
    // Fallback responses for when OpenAI API fails
    const fallbackResponses = [
      "I'm having trouble connecting to my financial data sources right now. Please try again in a moment.",
      "My market data connection is temporarily unavailable. Would you like to ask something else?",
      "I apologize, but I'm currently unable to process financial queries. Please try again shortly."
    ]
    
    const fallbackResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]
    
    return NextResponse.json({ 
      message: fallbackResponse,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Get chat history for a user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || 'anonymous'
    
    const userChat = chatHistory.find(chat => chat.userId === userId)
    
    // Dynamic suggestions based on market conditions and popular queries
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
    
    return NextResponse.json({
      history: userChat?.messages || [],
      suggestions: suggestions
    })
  } catch (error) {
    console.error('Error retrieving chat history:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve chat history' },
      { status: 500 }
    )
  }
} 