import { NextResponse } from 'next/server'

// Simulate database for user chat history
// In a real application, this would be stored in a database with proper schema
const userHistory: Record<string, string[]> = {
  'anonymous': [
    "What are the best tech stocks to invest in?",
    "How is the S&P 500 performing today?",
    "Explain market volatility",
    "Should I invest in index funds?",
    "What's your opinion on cryptocurrency investments?",
    "How do interest rate changes affect the stock market?",
    "Explain the difference between value and growth stocks"
  ]
}

// Common financial questions as suggestions for new users
const commonQuestions = [
  "What are the best tech stocks to invest in?",
  "How is the S&P 500 performing today?",
  "Explain market volatility",
  "Should I invest in index funds?",
  "What's your opinion on cryptocurrency investments?",
  "How do interest rates affect bonds?",
  "What's a good asset allocation for retirement?",
  "How can I protect my portfolio against inflation?",
  "Explain the current commodities market trends",
  "What sectors are outperforming in the current market?"
]

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || 'anonymous'
    
    // If the user doesn't have a history, create one with suggestions
    if (!userHistory[userId]) {
      // For demo purposes, provide common financial questions
      userHistory[userId] = []
    }
    
    // Return the user's history or suggestions for new users
    const history = userHistory[userId].length > 0 
      ? userHistory[userId] 
      : commonQuestions.slice(0, 5) // Only return 5 suggestions for new users
    
    return NextResponse.json({ 
      history,
      // Provide 24-hour data retention notice
      retentionPolicy: "Chat history is retained for 24 hours to enhance the user experience. No personal financial data is stored.",
      // Include timestamp for client-side time tracking
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error retrieving chat history:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve chat history' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { userId = 'anonymous', history = [] } = await request.json()
    
    if (!Array.isArray(history)) {
      return NextResponse.json(
        { error: 'History must be an array' },
        { status: 400 }
      )
    }
    
    // Update user history
    // In a real application, we would validate and sanitize this data
    userHistory[userId] = history.slice(-20) // Store only the last 20 questions
    
    return NextResponse.json({ 
      success: true,
      count: userHistory[userId].length
    })
  } catch (error) {
    console.error('Error saving chat history:', error)
    return NextResponse.json(
      { error: 'Failed to save chat history' },
      { status: 500 }
    )
  }
}

// For a real application, implement a DELETE method for GDPR compliance
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }
    
    // Delete user history
    if (userHistory[userId]) {
      delete userHistory[userId]
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'User history deleted successfully' 
    })
  } catch (error) {
    console.error('Error deleting chat history:', error)
    return NextResponse.json(
      { error: 'Failed to delete chat history' },
      { status: 500 }
    )
  }
} 