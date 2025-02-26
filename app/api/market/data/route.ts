import { NextResponse } from 'next/server'

// Simulate market data
// In a real application, this would come from a financial data API
const generateMarketData = () => {
  const stocks = [
    { 
      symbol: 'AAPL', 
      name: 'Apple Inc.',
      price: 173.5 + (Math.random() * 2 - 1), 
      change: (Math.random() * 4 - 2).toFixed(2),
      sector: 'Technology'
    },
    { 
      symbol: 'MSFT', 
      name: 'Microsoft Corporation',
      price: 337.0 + (Math.random() * 3 - 1.5), 
      change: (Math.random() * 5 - 2.5).toFixed(2),
      sector: 'Technology'
    },
    { 
      symbol: 'GOOGL', 
      name: 'Alphabet Inc.',
      price: 142.5 + (Math.random() * 1.5 - 0.75), 
      change: (Math.random() * 3 - 1.5).toFixed(2),
      sector: 'Technology'
    },
    { 
      symbol: 'AMZN', 
      name: 'Amazon.com Inc.',
      price: 178.3 + (Math.random() * 2.5 - 1.25), 
      change: (Math.random() * 4 - 2).toFixed(2),
      sector: 'Consumer Cyclical'
    },
    { 
      symbol: 'META', 
      name: 'Meta Platforms Inc.',
      price: 464.8 + (Math.random() * 4 - 2), 
      change: (Math.random() * 5 - 2.5).toFixed(2),
      sector: 'Technology'
    },
    { 
      symbol: 'TSLA', 
      name: 'Tesla Inc.',
      price: 177.7 + (Math.random() * 5 - 2.5), 
      change: (Math.random() * 8 - 4).toFixed(2),
      sector: 'Consumer Cyclical'
    },
    { 
      symbol: 'NVDA', 
      name: 'NVIDIA Corporation',
      price: 920.3 + (Math.random() * 15 - 7.5), 
      change: (Math.random() * 7 - 3.5).toFixed(2),
      sector: 'Technology'
    },
    { 
      symbol: 'BRK.B', 
      name: 'Berkshire Hathaway Inc.',
      price: 408.2 + (Math.random() * 3 - 1.5), 
      change: (Math.random() * 3 - 1.5).toFixed(2),
      sector: 'Financial Services'
    }
  ]

  // Calculate change percentage
  return stocks.map(stock => {
    const changeNum = parseFloat(stock.change as string)
    const changePercent = (changeNum / (stock.price - changeNum) * 100)
    return {
      ...stock,
      changePercent: parseFloat(changePercent.toFixed(2)),
      change: parseFloat(changeNum.toFixed(2)),
      price: parseFloat(stock.price.toFixed(2))
    }
  })
}

// Generate market indices data
const generateIndicesData = () => {
  return [
    { 
      name: 'S&P 500', 
      value: 5021 + (Math.random() * 25 - 12.5), 
      change: (Math.random() * 0.8 - 0.4).toFixed(2) 
    },
    { 
      name: 'Nasdaq', 
      value: 16573 + (Math.random() * 80 - 40), 
      change: (Math.random() * 1 - 0.5).toFixed(2) 
    },
    { 
      name: 'Dow Jones', 
      value: 38671 + (Math.random() * 150 - 75), 
      change: (Math.random() * 0.7 - 0.35).toFixed(2) 
    },
    { 
      name: 'Russell 2000', 
      value: 1994 + (Math.random() * 15 - 7.5), 
      change: (Math.random() * 1.2 - 0.6).toFixed(2) 
    },
    { 
      name: 'VIX', 
      value: 14.5 + (Math.random() * 2 - 1), 
      change: (Math.random() * 5 - 2.5).toFixed(2) 
    }
  ]
}

// Generate sector performance data
const generateSectorData = () => {
  return [
    { name: 'Technology', performance: (Math.random() * 2 - 0.5).toFixed(2) },
    { name: 'Healthcare', performance: (Math.random() * 1.8 - 0.9).toFixed(2) },
    { name: 'Financial Services', performance: (Math.random() * 1.6 - 0.8).toFixed(2) },
    { name: 'Consumer Cyclical', performance: (Math.random() * 1.4 - 0.7).toFixed(2) },
    { name: 'Communication Services', performance: (Math.random() * 1.7 - 0.85).toFixed(2) },
    { name: 'Industrial', performance: (Math.random() * 1.5 - 0.75).toFixed(2) },
    { name: 'Energy', performance: (Math.random() * 2.2 - 1.1).toFixed(2) },
    { name: 'Utilities', performance: (Math.random() * 1.2 - 0.6).toFixed(2) },
    { name: 'Real Estate', performance: (Math.random() * 1.8 - 0.9).toFixed(2) },
    { name: 'Basic Materials', performance: (Math.random() * 1.6 - 0.8).toFixed(2) }
  ]
}

// Fetch real market data from Alpaca if credentials are available
const fetchAlpacaMarketData = async () => {
  try {
    const apiKey = process.env.ALPACA_API_KEY
    const apiSecret = process.env.ALPACA_API_SECRET
    
    // Default to paper trading API if not specified
    const apiEndpoint = process.env.ALPACA_API_ENDPOINT || 'https://paper-api.alpaca.markets'
    const dataEndpoint = process.env.ALPACA_DATA_ENDPOINT || 'https://data.alpaca.markets'

    // Check if credentials are available
    if (!apiKey || !apiSecret) {
      console.log(`Alpaca API credentials incomplete: ${!apiKey ? 'Missing API key' : 'Missing API secret'}`)
      return null
    }

    console.log(`Connecting to Alpaca API at ${apiEndpoint} for account and ${dataEndpoint} for data`)
    console.log(`Using API key: ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`)
    
    // Define symbols to fetch
    const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'BRK.B']
    
    // Define indices symbols to fetch
    const indicesSymbols = ['SPY', 'QQQ', 'DIA', 'IWM', 'VIX']
    
    // First check if the API is accessible by getting account info
    console.log(`Verifying account access: ${apiEndpoint}/v2/account`)
    const accountResponse = await fetch(`${apiEndpoint}/v2/account`, {
      headers: {
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': apiSecret
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })

    if (!accountResponse.ok) {
      const errorText = await accountResponse.text()
      console.error(`Account verification failed: ${accountResponse.status} ${accountResponse.statusText}`)
      console.error(`Error details: ${errorText}`)
      throw new Error(`Alpaca API account error: ${accountResponse.status} ${accountResponse.statusText} - ${errorText}`)
    }

    const accountData = await accountResponse.json()
    console.log('Account verification successful:', accountData.account_number ? `Account #${accountData.account_number}` : 'Valid account')
    
    // Make a request to Alpaca bars endpoint for latest stock data
    // Using the v2 bars API to get latest data for our symbols
    console.log(`Fetching stock data: ${dataEndpoint}/v2/stocks/bars/latest?symbols=${symbols.join(',')}`)
    const response = await fetch(`${dataEndpoint}/v2/stocks/bars/latest?symbols=${symbols.join(',')}`, {
      headers: {
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': apiSecret
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Data API error: ${response.status} ${response.statusText}`)
      console.error(`Error details: ${errorText}`)
      throw new Error(`Alpaca API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    console.log('Successfully fetched stock market data from Alpaca')
    const data = await response.json()
    
    // Debug the structure of the response
    console.log('Alpaca data structure:', JSON.stringify(data).slice(0, 200) + '...')
    
    // Process the real data to match our expected format
    const stocks = Object.entries(data.bars || {}).map(([symbol, bar]: [string, any]) => {
      // Ensure all values are numeric before calculations
      const closePrice = parseFloat(bar.c)
      
      // Calculate change and percent based on available data
      let change = 0
      let changePercent = 0
      
      // If percentage is directly available in the API response
      if (bar.p !== undefined) {
        changePercent = parseFloat(bar.p.toFixed(2))
        change = parseFloat((closePrice * changePercent / 100).toFixed(2))
      } else {
        // Calculate based on previous close if available
        // This is a fallback calculation since Alpaca doesn't directly provide this
        const prevClose = bar.pc !== undefined ? parseFloat(bar.pc) : closePrice * 0.99
        change = parseFloat((closePrice - prevClose).toFixed(2))
        changePercent = parseFloat(((change / prevClose) * 100).toFixed(2))
      }
      
      return {
        symbol,
        name: symbol, // In a real app, would map symbol to company name
        price: closePrice,
        change,
        changePercent
      }
    })

    // If we didn't get any stocks data, log but continue to fetch indices
    if (stocks.length === 0) {
      console.log('Alpaca returned empty stock data')
    }
    
    // Fetch indices data
    const indicesResponse = await fetch(`${dataEndpoint}/v2/stocks/bars/latest?symbols=${indicesSymbols.join(',')}`, {
      headers: {
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': apiSecret
      }
    })
    
    let indices = []
    
    if (indicesResponse.ok) {
      console.log('Successfully fetched indices data from Alpaca')
      const indicesData = await indicesResponse.json()
      
      // Map the ETF symbols to market indices names
      const symbolToIndexMap: Record<string, string> = {
        'SPY': 'S&P 500',
        'QQQ': 'Nasdaq',
        'DIA': 'Dow Jones',
        'IWM': 'Russell 2000',
        'VIX': 'VIX'
      }
      
      indices = Object.entries(indicesData.bars || {}).map(([symbol, bar]: [string, any]) => {
        const closePrice = parseFloat(bar.c)
        
        let change = 0
        let changePercent = 0
        
        if (bar.p !== undefined) {
          changePercent = parseFloat(bar.p.toFixed(2))
          change = parseFloat((closePrice * changePercent / 100).toFixed(2))
        } else {
          const prevClose = bar.pc !== undefined ? parseFloat(bar.pc) : closePrice * 0.99
          change = parseFloat((closePrice - prevClose).toFixed(2))
          changePercent = parseFloat(((change / prevClose) * 100).toFixed(2))
        }
        
        return {
          name: symbolToIndexMap[symbol] || symbol,
          value: closePrice,
          change: changePercent
        }
      })
      
      console.log('Processed indices data:', indices)
    } else {
      console.log('Failed to fetch indices data from Alpaca, falling back to simulated data')
      indices = generateIndicesData()
    }
    
    return {
      stocks,
      indices: indices.length > 0 ? indices : generateIndicesData(), // Fallback to simulated data if no indices fetched
      sectors: generateSectorData()
    }
  } catch (error) {
    console.error('Error fetching data from Alpaca:', error)
    return null
  }
}

export async function GET() {
  try {
    // Try to fetch real data from Alpaca first
    let alpacaData = null
    let authError = false
    let apiError = null
    
    try {
      console.log('Attempting to fetch data from Alpaca...')
      alpacaData = await fetchAlpacaMarketData()
      console.log('Alpaca data fetch complete:', alpacaData ? 'successful' : 'failed')
    } catch (error: any) {
      console.error('Error fetching data from Alpaca:', error)
      
      // Check if it's an auth error (401/403)
      if (error.message && (
          error.message.includes('401') || 
          error.message.includes('403') ||
          error.message.includes('Unauthorized') || 
          error.message.includes('Forbidden'))
      ) {
        authError = true
        apiError = "Authentication failed. Check Alpaca API credentials."
      } else {
        apiError = "API error: " + (error.message || "Unknown error")
      }
    }
    
    // If Alpaca data is available, use it; otherwise, use simulated data
    const marketData = alpacaData || {
      stocks: generateMarketData(),
      indices: generateIndicesData(),
      sectors: generateSectorData()
    }
    
    // Add simulation flag for client to know data source
    const isSimulated = !alpacaData
    
    return NextResponse.json({
      ...marketData,
      isSimulated,
      authError,
      apiError,
      lastUpdated: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error in market data route:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch market data', 
        isSimulated: true,
        stocks: generateMarketData(),
        indices: generateIndicesData(),
        sectors: generateSectorData(),
        lastUpdated: new Date().toISOString()
      },
      { status: 200 } // Return 200 even on error, so we show fallback data
    )
  }
} 