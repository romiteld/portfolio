import { NextResponse } from 'next/server'
import { OpenAI } from 'openai'

// Initialize OpenAI client (only used for adding context)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Map of index names to their common variations
const indexNameVariations = {
  "S&P 500": ["s&p", "s&p 500", "s&p500", "sp500", "standard and poor", "standard & poor"],
  "Dow Jones": ["dow", "dow jones", "djia", "industrial average"],
  "Nasdaq": ["nasdaq", "nasdaq composite", "ndx"],
  "Russell 2000": ["russell", "russell 2000", "rut"],
  "VIX": ["vix", "volatility index", "fear index"]
};

// Context descriptions for different indices
const indexContexts = {
  'S&P 500': "The S&P 500 is a stock market index tracking the performance of 500 of the largest companies listed on U.S. exchanges and is considered a bellwether for the U.S. economy.",
  'Nasdaq': "The Nasdaq Composite is heavily weighted towards technology companies and growth stocks.",
  'Dow Jones': "The Dow Jones Industrial Average tracks 30 large, publicly-owned blue-chip companies trading on the New York Stock Exchange and the Nasdaq.",
  'Russell 2000': "The Russell 2000 Index measures the performance of approximately 2,000 small-cap companies in the U.S. equity market.",
  'VIX': "The VIX, or Volatility Index, measures market expectation of near-term volatility conveyed by S&P 500 stock index option prices."
};

// Helper to determine which index the query is about
function detectRequestedIndex(query: string): string | null {
  query = query.toLowerCase();
  
  for (const [indexName, variations] of Object.entries(indexNameVariations)) {
    if (variations.some(variation => query.includes(variation))) {
      return indexName;
    }
  }
  
  return null;
}

// Helper to get performance description based on change percentage
function getPerformanceDescription(change: number): string {
  if (change > 1.5) return "showing strong gains";
  if (change > 0.8) return "performing well";
  if (change > 0.3) return "modestly higher";
  if (change > -0.3 && change < 0.3) return "relatively flat";
  if (change < -1.5) return "showing significant losses";
  if (change < -0.8) return "performing poorly";
  if (change < -0.3) return "modestly lower";
  return "fluctuating";
}

export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }
    
    // Detect which index the user is asking about
    const requestedIndex = detectRequestedIndex(query);
    
    if (!requestedIndex) {
      return NextResponse.json(
        { error: 'No specific market index detected in query' },
        { status: 400 }
      );
    }
    
    console.log(`Processing market index query for ${requestedIndex}`);
    
    // Fetch market data directly from our API
    const marketResponse = await fetch(new URL('/api/market/data', request.url).toString());
    
    if (!marketResponse.ok) {
      console.error('Error fetching market data:', marketResponse.status, marketResponse.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch market data', status: marketResponse.status },
        { status: 502 }
      );
    }
    
    const marketData = await marketResponse.json();
    
    if (!marketData.indices || !marketData.indices.length) {
      console.error('No indices data available');
      return NextResponse.json(
        { error: 'No market indices data available' },
        { status: 404 }
      );
    }
    
    // Find the requested index in the data
    const indexData = marketData.indices.find((idx: any) => idx.name === requestedIndex);
    
    if (!indexData) {
      console.error(`Index data for ${requestedIndex} not found`);
      return NextResponse.json(
        { error: `Data for ${requestedIndex} not available` },
        { status: 404 }
      );
    }
    
    // Create the market data response
    const value = indexData.value.toFixed(2);
    const change = indexData.change;
    const isPositive = change >= 0;
    const absChange = Math.abs(change);
    const direction = isPositive ? 'up' : 'down';
    const performanceDesc = getPerformanceDescription(change);
    
    // Create a basic response with the exact data
    const basicResponse = {
      index: requestedIndex,
      value: value,
      change: change,
      direction: direction,
      message: `The ${requestedIndex} is currently at ${value} and is ${direction} ${absChange}% today. It is ${performanceDesc}.`,
      context: indexContexts[requestedIndex as keyof typeof indexContexts] || '',
      updated: new Date(marketData.lastUpdated).toLocaleString(),
      simulated: marketData.isSimulated
    };
    
    // For a more natural sounding response, we can use OpenAI to enhance 
    // but the actual data values will still come directly from our function
    try {
      // We'll provide the raw data and let GPT just make it sound more natural
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: 'system',
            content: `You are a financial data assistant that provides EXACT market data with natural language embellishment. 
ALWAYS use the EXACT values provided in the data. NEVER change or round the market values or percentages.
Data source: ${marketData.isSimulated ? 'simulated market data' : 'real-time Alpaca API'}`
          },
          {
            role: 'user',
            content: `Rephrase this market update in a natural, professional tone: "${basicResponse.message} ${basicResponse.context}"`
          }
        ],
        temperature: 0.7,
        max_tokens: 150,
      });
      
      // Get the enhanced response
      const enhancedResponse = completion.choices[0].message.content;
      
      // Return both the raw data and the enhanced response
      return NextResponse.json({
        ...basicResponse,
        enhancedResponse
      });
      
    } catch (error) {
      console.error('Error generating enhanced response:', error);
      // If OpenAI fails, still return the basic response
      return NextResponse.json(basicResponse);
    }
  } catch (error) {
    console.error('Error in market index function:', error);
    return NextResponse.json(
      { error: 'Failed to process market index query' },
      { status: 500 }
    );
  }
} 