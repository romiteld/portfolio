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

// Add this configuration to disable validation for problematic crypto symbols
// Use the options format expected by yahoo-finance2 
const yahooOptions = {
  // Options for the quote module
};

// Configure the yahoo-finance2 library globally to disable validation errors
yahooFinance.setGlobalConfig({
  validation: {
    logErrors: false,  // Don't log schema errors in production
    logOptionsErrors: false,  // Don't log options errors
    _internalThrowOnAdditionalProperties: false  // Be lenient with extra properties
  }
});

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
  'MATIC-USD', // Polygon
  'DOT-USD', // Polkadot
  'SHIB-USD', // Shiba Inu
  'LTC-USD', // Litecoin
  'LINK-USD', // Chainlink
  'AVAX-USD', // Avalanche
  'UNI-USD', // Uniswap
  'XLM-USD', // Stellar
  'XMR-USD', // Monero
  'ATOM-USD', // Cosmos
  'ALGO-USD', // Algorand
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
    
    // Instead of fetching all symbols at once, batch them by type to isolate failures
    // Fetch stocks first
    const stockResults = await fetchSymbolsWithRetry(STOCK_SYMBOLS);
    console.log(`Successfully fetched ${stockResults.length}/${STOCK_SYMBOLS.length} stock results`);
    
    // Fetch indices
    const indicesResults = await fetchSymbolsWithRetry(INDICES_SYMBOLS);
    console.log(`Successfully fetched ${indicesResults.length}/${INDICES_SYMBOLS.length} indices results`);
    
    // Fetch cryptocurrencies with special handling
    const cryptoResults = await fetchSymbolsWithRetry(CRYPTO_SYMBOLS);
    console.log(`Successfully fetched ${cryptoResults.length}/${CRYPTO_SYMBOLS.length} crypto results`);
    
    // Combine results
    const results = [...stockResults, ...indicesResults, ...cryptoResults];
    console.log(`Combined ${results.length} total results`);
    
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
    return null; // Return null on critical failure
  }
};

// Helper function to safely fetch symbols with retry logic
async function fetchSymbolsWithRetry(symbols: string[], maxRetries = 2) {
  const results: any[] = [];
  const failedSymbols: string[] = [];
  
  // Try fetching all symbols as a batch first
  try {
    // Use standard options, validation is disabled globally
    const response = await yahooFinance.quote(symbols);
    // Handle both array and single result cases
    const responseArray = Array.isArray(response) ? response : [response];
    results.push(...responseArray);
  } catch (error: any) {
    console.warn(`Error fetching batch of symbols, will try individually: ${error.message}`);
    
    // If batch fails, try each symbol individually with validation disabled
    for (const symbol of symbols) {
      let success = false;
      
      for (let attempt = 1; attempt <= maxRetries && !success; attempt++) {
        try {
          // Standard call, validation already disabled globally
          const result = await yahooFinance.quote(symbol);
          
          // Add to results, handling both single and array responses
          if (Array.isArray(result)) {
            results.push(...result);
          } else if (result) {
            results.push(result);
          }
          success = true;
        } catch (error: any) {
          console.warn(`Attempt ${attempt}/${maxRetries} failed for ${symbol}: ${error.message}`);
          
          // Use a more adaptive approach for crypto
          if (attempt === maxRetries && symbol.includes('-USD')) {
            try {
              // Create a minimal mock result for crypto that failed validation
              // This ensures we at least have basic data to show
              console.log(`Creating fallback data for crypto symbol: ${symbol}`);
              const mockCrypto = generateMinimalCryptoData(symbol);
              results.push(mockCrypto);
              success = true;
            } catch (fallbackError) {
              console.error(`Failed to create fallback for ${symbol}:`, fallbackError);
            }
          }
          
          // Small delay before retry
          await new Promise(resolve => setTimeout(resolve, 100 * attempt));  // Increasing backoff
          
          // If we've exhausted all retries, add to failed symbols list
          if (attempt === maxRetries && !success) {
            failedSymbols.push(symbol);
          }
        }
      }
    }
  }
  
  if (failedSymbols.length > 0) {
    console.warn(`Unable to fetch data for these symbols: ${failedSymbols.join(', ')}`);
  }
  
  return results;
}

// Function to generate minimal cryptocurrency data when validation fails
function generateMinimalCryptoData(symbol: string) {
  // Extract the base currency name from the symbol (e.g., "BTC" from "BTC-USD")
  const baseCurrency = symbol.split('-')[0];
  
  // Create a minimal valid structure that meets our needs
  return {
    symbol: symbol,
    shortName: `${baseCurrency} USD`,
    longName: `${baseCurrency} USD`,
    quoteType: "CRYPTOCURRENCY",
    regularMarketPrice: Math.random() * 100, // Random placeholder price
    regularMarketChange: 0,
    regularMarketChangePercent: 0,
    regularMarketTime: Date.now() / 1000,
    marketState: "REGULAR",
    exchange: "CCC",
    fromCurrency: baseCurrency,
    toCurrency: "USD",
    fullExchangeName: "CCC",
    // Add minimal data to avoid processing errors
    _isMockData: true  // Flag to identify generated data
  };
}

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