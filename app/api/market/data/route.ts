import { NextResponse } from 'next/server'
import { marketDataCache } from '@/app/utils/rateLimiter'
import yahooFinance from 'yahoo-finance2'; // Import the library

// Mark this route as always dynamic to avoid static optimization issues
export const dynamic = 'force-dynamic'
export const revalidate = 0 // Do not cache this route

// Function to handle CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// OPTIONS handler for CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// --- Define Symbol Lists ---
const STOCK_SYMBOLS = [
  // Major US Tech
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA',
  // Major US Financials
  'JPM', 'BAC', 'WFC',
  // Major US Healthcare
  'JNJ', 'UNH', 'PFE',
  // Major US Consumer
  'WMT', 'COST', 'PG',
  // Other Key US
  'BRK-B', 'XOM',
  // Popular ETFs
  'SPY', 'QQQ', 'DIA', 'IWM',
]

const INDICES_SYMBOLS = [
  // US Indices
  '^GSPC', // S&P 500
  '^IXIC', // Nasdaq Composite
  '^DJI', // Dow Jones Industrial Average
  '^RUT', // Russell 2000
  '^VIX', // CBOE Volatility Index
  // Global Indices (Example - Add more as needed)
  '^FTSE', // FTSE 100 (UK)
  '^N225', // Nikkei 225 (Japan)
  '^HSI', // Hang Seng (Hong Kong)
]

const CRYPTO_SYMBOLS = [
  'BTC-USD', // Bitcoin
  'ETH-USD', // Ethereum
  'USDT-USD', // Tether
  'BNB-USD', // Binance Coin
  'SOL-USD', // Solana
  'USDC-USD', // USD Coin
  'XRP-USD', // XRP
  'ADA-USD', // Cardano
  'DOGE-USD', // Dogecoin
]

// Combined list for fetching
const ALL_SYMBOLS_FOR_FETCH = [...STOCK_SYMBOLS, ...INDICES_SYMBOLS, ...CRYPTO_SYMBOLS];

// --- Fallback Data Generation (if API fails) ---
const generateSimulatedStock = (symbol: string, name: string, sector: string) => ({
  symbol, name, sector,
  price: (Math.random() * 500 + 50), // Wider price range
  change: (Math.random() * 10 - 5),
  changePercent: (Math.random() * 5 - 2.5),
});

const generateSimulatedIndex = (symbol: string, name: string) => ({
  symbol, name, type: 'index',
  price: (Math.random() * 10000 + 1000),
  change: (Math.random() * 100 - 50),
  changePercent: (Math.random() * 2 - 1),
});

const generateSimulatedCrypto = (symbol: string, name: string) => ({
  symbol, name, type: 'crypto',
  price: (Math.random() * 50000 + 100),
  change: (Math.random() * 1000 - 500),
  changePercent: (Math.random() * 10 - 5),
});

const generateMarketData = () => {
  console.warn("Falling back to simulated market data generation.");
  const stocks = STOCK_SYMBOLS.map(s => generateSimulatedStock(s, `${s} Name`, 'Simulated Sector'));
  const indices = INDICES_SYMBOLS.map(s => generateSimulatedIndex(s, s.replace('^', '') + ' Index'));
  const crypto = CRYPTO_SYMBOLS.map(s => generateSimulatedCrypto(s, s.replace('-USD', '')));
  
  return {
    stocks: stocks.map(stock => ({
      ...stock,
      price: parseFloat(stock.price.toFixed(2)),
      change: parseFloat(stock.change.toFixed(2)),
      changePercent: parseFloat(stock.changePercent.toFixed(2)),
    })),
    indices: indices.map(index => ({
      name: index.name,
      value: parseFloat(index.price.toFixed(2)),
      change: parseFloat(index.changePercent.toFixed(2)), // Simulate based on % for indices
    })),
    crypto: crypto.map(c => ({
       symbol: c.symbol,
       name: c.name,
       price: parseFloat(c.price.toFixed(2)),
       change: parseFloat(c.change.toFixed(2)),
       changePercent: parseFloat(c.changePercent.toFixed(2)),
    })),
    sectors: generateSectorData() // Keep sectors simple for fallback
  };
};

const generateSectorData = () => {
  // Simplified sector generation for fallback
  const sectors = ['Technology', 'Financials', 'Healthcare', 'Consumer', 'Energy', 'Crypto'];
  return sectors.map(name => ({ name, performance: (Math.random() * 4 - 2).toFixed(2) }));
};

// --- Yahoo Finance Data Fetching using yahoo-finance2 ---
const fetchYahooFinanceData = async () => {
  try {
    console.log(`Fetching real market data for ${ALL_SYMBOLS_FOR_FETCH.length} symbols using yahoo-finance2...`);
    
    // Fetch all symbols in one go using the library
    // The library handles batching/requests internally if needed
    const results = await yahooFinance.quote(ALL_SYMBOLS_FOR_FETCH);
    
    console.log(`Successfully fetched ${results.length} results using yahoo-finance2.`);

    // Process the results
    const stocks: any[] = [];
    const indices: any[] = [];
    const crypto: any[] = [];

    const indicesNameMap: Record<string, string> = {
      '^GSPC': 'S&P 500', '^IXIC': 'Nasdaq Comp.', '^DJI': 'Dow Jones',
      '^RUT': 'Russell 2000', '^VIX': 'VIX', '^FTSE': 'FTSE 100',
      '^N225': 'Nikkei 225', '^HSI': 'Hang Seng'
    };

    results.forEach(quote => {
      if (!quote || !quote.symbol) {
        console.warn("Skipping invalid quote entry from yahoo-finance2:", quote);
        return; // Skip malformed entries
      }

      // Use values provided by the library, handle potential undefined
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

      if (INDICES_SYMBOLS.includes(quote.symbol)) {
        indices.push({
          name: indicesNameMap[quote.symbol] || name.replace('^', ''),
          value: commonData.price,
          change: commonData.changePercent // Use percentage change for indices display
        });
      } else if (CRYPTO_SYMBOLS.includes(quote.symbol)) {
         // Safely access potential crypto-specific fields
         const volume24h = (quote as any).volume24Hr ?? quote.regularMarketVolume ?? null; 
         crypto.push({
           ...commonData,
           marketCap: quote.marketCap ?? null,
           volume24h: volume24h
         });
      } else { // Assume stock or ETF otherwise
        // Safely access potential stock/ETF specific fields
        const sector = (quote as any).sector || (quote.quoteType === 'ETF' ? 'ETF' : 'N/A'); 
        stocks.push({
          ...commonData,
          sector: sector,
          marketCap: quote.marketCap ?? null,
          volume: quote.regularMarketVolume ?? null,
          peRatio: quote.trailingPE ?? quote.forwardPE ?? null,
        });
      }
    });
    
    console.log(`Processed data: ${stocks.length} stocks/ETFs, ${indices.length} indices, ${crypto.length} crypto.`);
    
    // Generate simple sector performance based on fetched stock data
    const sectorPerformance: Record<string, { totalChange: number, count: number }> = {};
    stocks.forEach(stock => {
       if(stock.sector && stock.sector !== 'N/A' && stock.sector !== 'ETF') { // Exclude ETF from sector perf
           if (!sectorPerformance[stock.sector]) {
               sectorPerformance[stock.sector] = { totalChange: 0, count: 0 };
           }
           sectorPerformance[stock.sector].totalChange += stock.changePercent;
           sectorPerformance[stock.sector].count++;
       }
    });
    const calculatedSectors = Object.entries(sectorPerformance).map(([name, data]) => ({
        name,
        performance: (data.totalChange / data.count).toFixed(2)
    }));
    
    return {
      stocks,
      indices,
      crypto,
      sectors: calculatedSectors.length > 0 ? calculatedSectors : generateSectorData() // Use calculated or fallback
    };
  } catch (error) {
    console.error('Error fetching or processing data using yahoo-finance2:', error);
    // Check if the error is a known type from the library if needed
    // Example: if (error instanceof yahooFinance.YahooFinanceError) { ... }
    return null; // Return null on critical failure
  }
};

// --- API Route Handler ---
export async function GET(request: Request) {
  try {
    const cacheKey = 'market-data-expanded'; // New cache key for the expanded data
    
    // Try to get data from cache
    const cachedData = marketDataCache.get(cacheKey);
    if (cachedData) {
      console.log(`Using cached market data (expires in ${marketDataCache.getRemainingTtl(cacheKey)}s)`);
      return NextResponse.json({ ...cachedData, fromCache: true }, { headers: corsHeaders });
    }
    
    // If no cache, fetch fresh data
    console.log('Cache miss, attempting to fetch fresh data from Yahoo Finance...');
    let marketData = await fetchYahooFinanceData();
    let isSimulated = false;
    let apiError = null;

    // If Yahoo Finance fetch fails, generate simulated data
    if (!marketData) {
      console.warn('Yahoo Finance fetch failed, using simulated data as fallback.');
      marketData = generateMarketData();
      isSimulated = true;
      apiError = "Failed to fetch live data from Yahoo Finance, showing simulated data.";
    }
    
    // Prepare the response data with proper formatting
    const responseData = {
      stocks: Array.isArray(marketData.stocks) ? marketData.stocks : [],
      indices: Array.isArray(marketData.indices) ? marketData.indices : [],
      crypto: Array.isArray(marketData.crypto) ? marketData.crypto : [],
      sectors: Array.isArray(marketData.sectors) ? marketData.sectors : [],
      isSimulated: Boolean(isSimulated),
      apiError: apiError,
      lastUpdated: new Date().toISOString()
    };
    
    // Cache the result
    marketDataCache.set(cacheKey, responseData);
    console.log(`Data fetched. Stocks: ${responseData.stocks.length}, Indices: ${responseData.indices.length}, Crypto: ${responseData.crypto.length}, Simulated: ${isSimulated}`);
    
    // Return properly formatted JSON response with CORS headers
    return NextResponse.json(responseData, { headers: corsHeaders });
  } catch (error) {
    console.error('Unhandled error in market data route:', error);
    
    // Return simulated data on errors with proper error status and CORS headers
    const fallbackData = generateMarketData();
    return NextResponse.json({
      error: 'Failed to process market data request.',
      stocks: fallbackData.stocks || [],
      indices: fallbackData.indices || [],
      crypto: fallbackData.crypto || [],
      sectors: fallbackData.sectors || [],
      isSimulated: true,
      lastUpdated: new Date().toISOString()
    }, { headers: corsHeaders });
  }
} 