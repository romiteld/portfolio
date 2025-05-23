import { NextRequest, NextResponse } from 'next/server';
import { marketDataCache } from '@/app/utils/rateLimiter'; // Assuming rate limiter is still needed
import yahooFinance from 'yahoo-finance2'; // Import the library
import { OpenAI } from 'openai'; // Import OpenAI client
import { generateFinancialAdviceWithRAG } from '@/lib/supOAIHelper';
import { loadInitialFinancialKnowledge } from '@/lib/supabaseFinancialStorage';

// --- Types ---
interface YahooFinanceData {
  symbol: string;
  name: string;
  price: number | null;
  previousClose: number | null;
  change: number | null;
  changePercent: number | null;
  currency: string | null;
  exchange: string | null;
  timestamp: string;
}

interface QuoteData {
  symbol: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketPreviousClose?: number;
  shortName?: string;
  longName?: string;
  currency?: string;
  fullExchangeName?: string;
  exchange?: string;
  quoteType?: string;
  marketCap?: number;
  regularMarketVolume?: number;
  trailingPE?: number;
  fiftyTwoWeekLow?: number;
  fiftyTwoWeekHigh?: number;
  [key: string]: unknown;
}

interface UserPreferences {
  investmentStyle?: string;
  portfolioFocus?: string[];
  riskTolerance?: string;
  timeHorizon?: string;
  favoriteSymbols?: string[];
}

type FinancialResponse =
  | { type: 'lookup'; data?: QuoteData; summary: string; key_metrics: Record<string, string> }
  | { type: 'summary'; summary: string; key_metrics: Record<string, string> }
  | { type: 'comparison'; summary: string; comparison_table?: string; key_metrics?: Record<string, string> }
  | { type: 'analysis'; summary: string; key_metrics: Record<string, string> }
  | { type: 'general_advice'; summary: string; key_metrics: Record<string, string> }
  | { type: 'error'; summary: string; error?: string; key_metrics?: Record<string, string> }
  | { type: 'help'; summary: string; key_metrics: Record<string, string> }
  | { type: 'ai_enhanced_response'; summary: string; key_metrics?: Record<string, string>; sources?: any };
// Uncomment the following line in production to use Supabase
// import { supabase } from '@/lib/supabaseClient'

// --- Utility Functions ---
const formatNumber = (num: number | null | undefined, decimals = 2): string => {
  if (num === null || num === undefined) return 'N/A';
  return num.toFixed(decimals);
};

const formatLargeNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return 'N/A';
  if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  return num.toLocaleString();
};

const getSign = (num: number | null | undefined) => {
  if (num === null || num === undefined || num === 0) return '';
  return num > 0 ? '+' : ''; // Minus sign is handled by default number formatting
};

// --- Simulated Market Status Check ---
// In a real implementation, replace this with a call to Alpaca /v1/clock or similar
async function getMarketStatus(): Promise<{ isOpen: boolean; message: string }> {
  console.log("Simulating market status check...");
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate brief network delay

  // Simple time-based simulation (Eastern Time)
  const now = new Date();
  const estOffset = -4 * 60; // EDT offset (adjust for EST if needed)
  const utcOffset = now.getTimezoneOffset();
  const estTime = new Date(now.getTime() + (estOffset - utcOffset) * 60000);

  const dayOfWeek = estTime.getDay(); // 0=Sun, 6=Sat
  const hour = estTime.getHours();
  const minute = estTime.getMinutes();

  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  // Market hours approx 9:30 AM to 4:00 PM ET
  const isMarketHours = hour > 9 || (hour === 9 && minute >= 30);
  const isBeforeClose = hour < 16;

  const isOpen = !isWeekend && isMarketHours && isBeforeClose;

  console.log(`Simulated market status: ${isOpen ? 'Open' : 'Closed'}`);
  return {
    isOpen: isOpen,
    message: isOpen ? "The market is currently open." : "The market is currently closed."
  };
}
// --- End Simulated Market Status Check ---

// Function to fetch data directly from Yahoo Finance
async function fetchYahooFinanceData(symbol: string): Promise<YahooFinanceData> {
  try {
    // Clean up symbol
    const cleanSymbol = symbol.trim().toUpperCase();
    const isIndex = cleanSymbol.startsWith('^');
    
    // Use Yahoo Finance API endpoint
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(cleanSymbol)}?interval=1d`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Yahoo Finance API responded with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Basic validation of response
    if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
      throw new Error('Invalid data received from Yahoo Finance');
    }
    
    const result = data.chart.result[0];
    const quote = result.indicators.quote[0];
    
    // Extract main quote data
    const meta = result.meta;
    const timestamp = result.timestamp || [];
    const lastIndex = timestamp.length - 1;
    
    // Format data
    const currentPrice = meta.regularMarketPrice || (quote.close ? quote.close[lastIndex] : null);
    const previousClose = meta.chartPreviousClose;
    const change = currentPrice - previousClose;
    const changePercent = (change / previousClose) * 100;
    
    // Get company name or symbol if name not available
    const companyName = meta.shortName || meta.symbol || cleanSymbol;
    
    return {
      symbol: cleanSymbol,
      name: companyName,
      price: currentPrice,
      previousClose,
      change,
      changePercent,
      currency: meta.currency,
      exchange: meta.exchangeName,
      timestamp: new Date(meta.regularMarketTime * 1000).toISOString()
    };
  } catch (error) {
    console.error('Error fetching Yahoo Finance data:', error);
    throw error;
  }
}

// Function to search for general financial information
async function searchFinancialInfo(query: string): Promise<{ type: 'stock'; data: YahooFinanceData; summary: string; key_metrics: Record<string, string> } | { type: 'general'; data: { query: string }; summary: string; key_metrics: Record<string, string>; recent_news_summary: string }> {
  try {
    // Try to get stock info first
    const potentialSymbol = query.trim().toUpperCase();
    
    try {
      // Check if this could be a stock symbol (simple check)
      if (/^[A-Z]{1,5}$/.test(potentialSymbol) || potentialSymbol === '^GSPC' || potentialSymbol === '^DJI' || potentialSymbol === '^IXIC') {
        const stockData = await fetchYahooFinanceData(potentialSymbol);
        return {
          type: 'stock',
          data: stockData,
          summary: `${stockData.name} (${stockData.symbol}) is currently trading at ${stockData.price || 'N/A'} ${stockData.currency || 'USD'}, ${(stockData.change || 0) >= 0 ? 'up' : 'down'} ${Math.abs(stockData.change || 0).toFixed(2)} (${Math.abs(stockData.changePercent || 0).toFixed(2)}%) on ${stockData.exchange || 'N/A'}.`,
          key_metrics: {
            price: `${stockData.price || 'N/A'} ${stockData.currency || 'USD'}`,
            change: `${(stockData.change || 0) >= 0 ? '+' : ''}${(stockData.change || 0).toFixed(2)} (${(stockData.change || 0) >= 0 ? '+' : ''}${(stockData.changePercent || 0).toFixed(2)}%)`,
            previous_close: `${stockData.previousClose || 'N/A'} ${stockData.currency || 'USD'}`,
            exchange: stockData.exchange || 'N/A'
          }
        };
      }
    } catch (error) {
      console.log(`Not a valid stock symbol or error fetching stock data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Continue to general search if stock data fails
    }
    
    // For generic queries, provide a response based on the query
    return {
      type: 'general',
      data: { query },
      summary: `To get detailed information about "${query}", I'd need to search financial news and analyze market data. Currently, I can provide detailed information for specific stock symbols (like AAPL, MSFT, GOOG, etc.) including major indices (^GSPC for S&P 500, ^DJI for Dow Jones, ^IXIC for NASDAQ).`,
      key_metrics: {},
      recent_news_summary: `For the latest news about "${query}", please try searching for a specific company stock symbol or index.`
    };
    
  } catch (error) {
    console.error('Error in searchFinancialInfo:', error);
    throw error;
  }
}

// --- Yahoo Finance Data Fetching (using yahoo-finance2) ---
// Fetches data for one or more symbols using the quote endpoint
async function fetchYahooQuoteData(symbols: string[]): Promise<QuoteData[]> {
  if (!symbols || symbols.length === 0) return [];
  const uniqueSymbols = Array.from(new Set(symbols.map(s => s.trim().toUpperCase()).filter(s => s)));
  if (uniqueSymbols.length === 0) return [];

  console.log(`Fetching quote data for: ${uniqueSymbols.join(',')} using yahoo-finance2`);

  try {
    // Use the library's quote method
    const results = await yahooFinance.quote(uniqueSymbols);
    // Ensure results is always an array
    return Array.isArray(results) ? results : [results]; 
  } catch (error) {
    console.error(`Error fetching yahoo-finance2 quote for symbols ${uniqueSymbols.join(',')}:`, error);
    // Consider checking error type, e.g., if (error instanceof yahooFinance.YahooFinanceError)
    return []; // Return empty on error
  }
}

// --- Intent Handlers (Modified to use library results) ---

// 1. Handle Single Symbol Lookup
async function handleLookup(symbol: string): Promise<FinancialResponse> {
  const results = await fetchYahooQuoteData([symbol]);
  if (!results || results.length === 0) {
    return { type: 'error', summary: `Could not find data for symbol "${symbol}". Please check the symbol.`, key_metrics: {} };
  }
  const quote = results[0]; // Result from yahoo-finance2
  
  // Extract data using library field names (may differ slightly from direct fetch)
  const price = quote.regularMarketPrice ?? 0;
  const change = quote.regularMarketChange ?? 0;
  const changePercent = quote.regularMarketChangePercent ?? 0;
  const prevClose = quote.regularMarketPreviousClose ?? (price - change);
  const name = quote.shortName || quote.longName || quote.symbol;
  const currency = quote.currency || 'USD';
  const exchange = quote.fullExchangeName || quote.exchange || 'N/A';
  const typeDisplay = quote.quoteType || 'N/A';
  const marketCap = quote.marketCap;
  const volume = quote.regularMarketVolume;
  const peRatio = quote.trailingPE; // Library might use different field names, adjust if needed
  const fiftyTwoWeekLow = quote.fiftyTwoWeekLow;
  const fiftyTwoWeekHigh = quote.fiftyTwoWeekHigh;

  let summary = `${name} (${quote.symbol}) is trading at ${formatNumber(price)} ${currency}. `;
  summary += `It changed ${getSign(change)}${formatNumber(change)} (${getSign(changePercent)}${formatNumber(changePercent)}%) today.`;

  const metrics: Record<string, string> = {
    Type: typeDisplay,
    Price: `${formatNumber(price)} ${currency}`,
    Change: `${getSign(change)}${formatNumber(change)} (${getSign(changePercent)}${formatNumber(changePercent)}%)`,
    Previous_Close: `${formatNumber(prevClose)} ${currency}`,
    Volume: formatLargeNumber(volume),
    Market_Cap: formatLargeNumber(marketCap),
    PE_Ratio: formatNumber(peRatio),
    '52_Week_Range': `${formatNumber(fiftyTwoWeekLow)} - ${formatNumber(fiftyTwoWeekHigh)}`,
    Exchange: exchange,
  };

  // Remove N/A or null metrics
  Object.keys(metrics).forEach(key => {
    if (metrics[key] === 'N/A' || metrics[key] === null || metrics[key] === undefined || metrics[key].toLowerCase().includes('null') || metrics[key].toLowerCase().includes('undefined')) { // More robust check
      delete metrics[key];
    }
  });

  return { type: 'lookup', data: quote, summary, key_metrics: metrics };
}

// 2. Handle Market Summary
async function handleMarketSummary(): Promise<FinancialResponse> {
  const keyIndices = ['^GSPC', '^IXIC', '^DJI', '^FTSE', '^N225', 'BTC-USD'];
  const results = await fetchYahooQuoteData(keyIndices);

  if (!results || results.length === 0) {
    return { type: 'error', summary: "Could not fetch market summary data currently.", key_metrics: {} };
  }

  let summary = "**Current Market Snapshot:**\n";
  const metrics: Record<string, string> = {};

  results.forEach((quote: QuoteData) => {
    const name = quote.shortName || quote.longName || quote.symbol;
    const value = quote.regularMarketPrice ?? 0;
    const changePercent = quote.regularMarketChangePercent ?? 0;
    const formattedValue = quote.symbol.includes('-USD') ? formatNumber(value) : formatLargeNumber(value);
    summary += `- **${name}:** ${formattedValue} (${getSign(changePercent)}${formatNumber(changePercent)}%)\n`;
    metrics[name] = `${formattedValue} (${getSign(changePercent)}${formatNumber(changePercent)}%)`;
  });

  return { type: 'summary', summary, key_metrics: metrics };
}

// 3. Handle Comparison
async function handleComparison(symbol1: string, symbol2: string): Promise<FinancialResponse> {
  const symbols = [symbol1, symbol2];
  const results = await fetchYahooQuoteData(symbols);

  if (!results || results.length < 2) {
    const foundSymbols = results.map((r: QuoteData) => r?.symbol).filter(Boolean).join(', ') || 'none';
    return { type: 'error', summary: `Could not find data for both symbols to compare. Found: ${foundSymbols}`, key_metrics: {} };
  }

  const quote1 = results.find((q: QuoteData) => q?.symbol?.toUpperCase() === symbol1.toUpperCase());
  const quote2 = results.find((q: QuoteData) => q?.symbol?.toUpperCase() === symbol2.toUpperCase());

  if (!quote1 || !quote2) {
     return { type: 'error', summary: `Could not retrieve full data for comparison. Make sure both symbols are valid.`, key_metrics: {} };
  }

  // Select comparable metrics (using library field names)
  const metricsToCompare = [
    { key: 'regularMarketPrice', label: 'Price', format: (val: number | null | undefined, q: QuoteData) => `${formatNumber(val)} ${q.currency || 'USD'}` },
    { key: 'regularMarketChangePercent', label: 'Change %', format: (val: number | null | undefined) => `${getSign(val)}${formatNumber((val ?? 0) * 100)}%` }, // Library often gives this as decimal
    { key: 'regularMarketChange', label: 'Change', format: (val: number | null | undefined, q: QuoteData) => `${getSign(val)}${formatNumber(val)} ${q.currency || 'USD'}` },
    { key: 'marketCap', label: 'Market Cap', format: formatLargeNumber },
    { key: 'regularMarketVolume', label: 'Volume', format: formatLargeNumber },
    { key: 'trailingPE', label: 'P/E Ratio', format: (val: number | null | undefined) => formatNumber(val) },
    { key: 'fiftyTwoWeekHigh', label: '52W High', format: (val: number | null | undefined, q: QuoteData) => `${formatNumber(val)} ${q.currency || 'USD'}` },
    { key: 'fiftyTwoWeekLow', label: '52W Low', format: (val: number | null | undefined, q: QuoteData) => `${formatNumber(val)} ${q.currency || 'USD'}` },
    { key: 'quoteType', label: 'Type', format: (val: unknown) => (val as string) || 'N/A' },
    { key: 'exchange', label: 'Exchange', format: (val: unknown) => (val as string) || 'N/A' },
  ];

  // Format table carefully for markdown
  let comparisonTable = `| Feature          | ${quote1.symbol.padEnd(8)} | ${quote2.symbol.padEnd(8)} |\n`;
  comparisonTable +=    `|------------------|------------|------------|\n`;

  metricsToCompare.forEach(metric => {
    const val1 = quote1[metric.key];
    const val2 = quote2[metric.key];

    if (val1 !== undefined || val2 !== undefined) {
      const formattedVal1 = metric.format(val1 as any, quote1).toString(); // Ensure string
      const formattedVal2 = metric.format(val2 as any, quote2).toString(); // Ensure string
      // Pad values within the table cell for better alignment
      comparisonTable += `| ${metric.label.padEnd(16)} | ${formattedVal1.padEnd(10)} | ${formattedVal2.padEnd(10)} |\n`;
    }
  });

  const summary = `Comparison between ${quote1.shortName || quote1.symbol} and ${quote2.shortName || quote2.symbol}:`;

  return { type: 'comparison', summary, comparison_table: comparisonTable };
}

// 4. Handle Basic Analysis / Advice Query
async function handleAnalysis(symbol: string): Promise<FinancialResponse> {
   const lookupResult = await handleLookup(symbol);
   if(lookupResult.type === 'error') return lookupResult;
   
   // Type guard to ensure we have lookup type with data
   if (lookupResult.type !== 'lookup') {
     return lookupResult; // This shouldn't happen but handles the type
   }

   let analysisSummary = `**Analysis for ${lookupResult.data?.shortName || symbol}:**\n`;
   analysisSummary += lookupResult.summary + `\n\n`;

   try {
      const sp500Results = await fetchYahooQuoteData(['^GSPC']);
      if (sp500Results && sp500Results.length > 0) {
         const sp500Quote = sp500Results[0];
         const spChange = sp500Quote.regularMarketChangePercent ?? 0;
         const assetChange = lookupResult.data?.regularMarketChangePercent ?? 0;
         // Note: Library provides change percent often as decimal (e.g., 0.01 for 1%), multiply by 100 for display
         analysisSummary += `Today\'s performance vs S&P 500 (${getSign(spChange)}${formatNumber(spChange * 100)}%): `;
         if (assetChange > spChange) analysisSummary += `Outperforming.`;
         else if (assetChange < spChange) analysisSummary += `Underperforming.`;
         else analysisSummary += `Performing in line.`;
         analysisSummary += `\n`;
      }
   } catch (e) { console.error("Failed to fetch S&P 500 for comparison", e); }

   const pe = lookupResult.data?.trailingPE;
   if (pe) {
      analysisSummary += `P/E Ratio (${formatNumber(pe)}): `;
      if (pe > 30) analysisSummary += `Suggests higher growth expectations or potentially overvalued.`;
      else if (pe < 15) analysisSummary += `May indicate lower growth expectations or potentially undervalued.`;
      else analysisSummary += `Within a typical range.`;
      analysisSummary += `\n`;
   }
   
   analysisSummary += `\n*Note: This is a basic automated analysis based on available data.*`;

   return {
       type: 'analysis',
       summary: analysisSummary,
       key_metrics: lookupResult.key_metrics,
   };
}

// 5. Handle General Advice Queries
async function handleGeneralAdvice(query: string, userPreferences: UserPreferences | undefined): Promise<FinancialResponse> {
  console.log("Handling general advice query:", query);
  try {
    // Get market summary for context
    const marketSummaryData = await handleMarketSummary();
    const marketContext: string = (marketSummaryData.type === 'summary' && marketSummaryData.summary) 
        ? String(marketSummaryData.summary) 
        : "Market summary data is currently unavailable.";

    // Create preference context if available
    let userPreferenceContext = "";
    if (userPreferences) {
      userPreferenceContext = `
User investment profile:
- Investment Style: ${userPreferences.investmentStyle || 'Not specified'}
- Portfolio Focus: ${userPreferences.portfolioFocus?.join(', ') || 'Not specified'}
- Risk Tolerance: ${userPreferences.riskTolerance || 'Not specified'}
- Time Horizon: ${userPreferences.timeHorizon || 'Not specified'}
- Favorite Symbols: ${userPreferences.favoriteSymbols?.join(', ') || 'None'}`; 
    }
    
    // Fetch real-time information if the query appears to need up-to-date info
    let realtimeContext = "";
    const needsRealTimeInfo = /current|latest|new|today|recent|update|news|now|happening|trend/i.test(query);
    
    if (needsRealTimeInfo) {
      try {
        // Call our realtime endpoint
        const realtimeResponse = await fetch(new URL('/api/financial-assistant/realtime', new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000')), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        });
        
        if (realtimeResponse.ok) {
          const realtimeData = await realtimeResponse.json();
          if (realtimeData.results && realtimeData.results.length > 0) {
            realtimeContext = "\n\n**Recent Financial Information:**\n\n";
            realtimeData.results.forEach((item: { content?: string; title?: string }, index: number) => {
              if (item.content && item.content.trim()) {
                // Limit each content to a reasonable summary length
                const contentSummary = item.content.substring(0, 300) + (item.content.length > 300 ? '...' : '');
                realtimeContext += `${index + 1}. ${item.title || 'Financial update'}: ${contentSummary}\n\n`;
              }
            });
            realtimeContext += `*Information retrieved at ${new Date().toLocaleString()}*\n`;
          }
        }
      } catch (error) {
        console.error("Error fetching real-time information:", error);
        // Continue without real-time info if it fails
      }
    }

    // Determine if this is a concept/educational query
    const lowerQuery = query.toLowerCase();
    const isConceptQuery = /what is|how does|explain|define|why|when should|difference between/i.test(lowerQuery) || 
      /volatility|inflation|recession|bull market|bear market|dividend|yield|ratio|analysis|diversification|risk/i.test(lowerQuery);
    
    // Create enhanced context for educational queries
    let enhancedContext = "";
    
    if (isConceptQuery) {
      // For concept queries, focus on educational content
      enhancedContext = `The user is asking for educational information about financial concepts. Provide clear, accurate explanations rather than investment advice.\n\n${marketContext}`;
      console.log("Detected concept query, using educational context");
    } else {
      // For advice queries, include user preferences
      enhancedContext = marketContext + 
        (userPreferenceContext ? "\n\n" + userPreferenceContext : "");
    }
    
    // Add real-time context if available
    if (realtimeContext) {
      enhancedContext += realtimeContext;
    }

    // Try to generate a response with RAG first - prioritize for concept queries
    try {
      const openAIResponse = await generateFinancialAdviceWithRAG(
        query, 
        enhancedContext,
        true
      );
      if (openAIResponse && openAIResponse.type === 'ai_enhanced_response') {
        console.log(`Generated response using RAG for ${isConceptQuery ? 'concept' : 'advice'} query`);
        return openAIResponse as FinancialResponse;
      }
    } catch (aiError) {
      console.error("Error using OpenAI+RAG, falling back to predefined responses:", aiError);
    }

    // If this is a concept query but RAG failed, provide a specific fallback
    if (isConceptQuery) {
      return {
        type: 'general_advice',
        summary: `I understand you're asking about ${query}. This is an important financial concept, but I'm currently unable to provide detailed information. For the most accurate and up-to-date information, I recommend consulting educational resources like Investopedia or financial advisors.\n\n${marketContext}\n\n**Disclaimer:** This information is for educational purposes only.`,
        key_metrics: {}
      };
    }

    // Enhanced pattern detection with more variations for non-concept queries
    const isAboutInvesting = /buy|invest|stock|portfolio|asset|fund|etf/i.test(lowerQuery);
    
    // Expanded pattern for "look online" queries to catch more variations
    const isLookingOnline = /look online|search|find|research|help me|resources|where can i|websites|tools/i.test(lowerQuery);
    
    // More specific patterns for targeted responses
    const isAboutIndexFunds = /index fund|etf|passive|mutual fund/i.test(lowerQuery);
    const isAboutCrypto = /crypto|bitcoin|ethereum|digital asset|blockchain/i.test(lowerQuery);
    const isAboutRisk = /risk|safe|volatile|secure|protect/i.test(lowerQuery);
    
    console.log("Query patterns:", {
      isLookingOnline,
      isAboutIndexFunds,
      isAboutCrypto,
      isAboutRisk
    });
    
    let adviceContent = "";
    
    // Priority order for response selection
    if (isLookingOnline) {
      adviceContent = `**Online Investment Research Resources:**

Based on current market conditions, here are some reliable resources for investment research:

• **Financial News**: Yahoo Finance, Bloomberg, CNBC, Financial Times
• **Market Data**: TradingView, MarketWatch, Investing.com
• **Company Research**: SEC EDGAR database for official filings, company investor relations pages
• **Analysis Tools**: Stock screeners on Finviz or Yahoo Finance
• **Investment Education**: Investopedia, Khan Academy Finance, broker educational resources

${marketContext}

**Remember:** Always verify information from multiple sources and consult a qualified financial advisor before making investment decisions.`;
    } else if (isAboutIndexFunds) {
      adviceContent = `**Index Fund Investment Considerations:**

Index funds and ETFs are popular passive investment vehicles that track market indices. Some points to consider:

• **Diversification**: Index funds provide instant diversification across many securities
• **Expense Ratios**: Lower costs than actively managed funds (typically 0.03%-0.25%)
• **Tax Efficiency**: Generally more tax-efficient than actively managed funds
• **Long-term Perspective**: Best suited for long-term, buy-and-hold strategies
• **Market Coverage**: Different indices cover different segments (total market, S&P 500, sectors)

${marketContext}

**Remember**: Past performance doesn't guarantee future results. Consider your financial goals, time horizon, and risk tolerance before investing.`;
    } else if (isAboutCrypto) {
      adviceContent = `**Cryptocurrency Investment Considerations:**

Cryptocurrencies are highly volatile digital assets. Key points to consider:

• **Extreme Volatility**: Price swings can be dramatic and unpredictable
• **Diversification**: Consider crypto as just one small part of a diversified portfolio
• **Security**: Learn about secure storage options (hardware wallets, reputable exchanges)
• **Research**: Understand the technology, use cases, and team behind any crypto project
• **Regulatory Changes**: Be aware that regulatory changes can impact markets significantly

${marketContext}

**Important**: Cryptocurrency investments carry substantial risk. Only invest funds you can afford to lose completely.`;
    } else if (isAboutRisk) {
      adviceContent = `**Understanding Investment Risk:**

Managing risk is fundamental to investing. Key considerations include:

• **Risk vs. Return**: Higher potential returns typically come with higher risks
• **Diversification**: Spread investments across different asset classes to reduce overall risk
• **Time Horizon**: Longer investment periods can help weather short-term market volatility
• **Asset Allocation**: The mix of stocks, bonds, cash and alternatives should reflect your risk tolerance
• **Dollar-Cost Averaging**: Investing regularly over time can help reduce the impact of market volatility

${marketContext}

**Protection Strategies**: Emergency funds, insurance, and regular portfolio reviews are important components of a comprehensive financial plan.`;
    } else {
      // Default general investment advice response
      adviceContent = `**Investment Principles to Consider:**

When deciding what to invest in, consider these fundamental principles:

1. **Diversification**: Spread investments across different asset classes and sectors
2. **Risk Tolerance**: Only invest what you can afford to lose, especially in volatile assets
3. **Time Horizon**: Longer investment periods can help weather market fluctuations
4. **Research**: Understand what you're investing in before committing funds
5. **Cost Awareness**: Pay attention to fees, expense ratios, and tax implications

${marketContext}

**Disclaimer:** This information is for educational purposes only. Every investment situation is unique, and you should consult with a qualified financial advisor before making investment decisions.`;
    }

    return {
      type: 'general_advice',
      summary: adviceContent,
      key_metrics: {} // No specific metrics for this type
    };

  } catch (error) {
    console.error("Error handling general advice query:", error);
    return {
      type: 'error',
      summary: `Sorry, I encountered an error while processing your request about: "${query}". It's always best to consult a financial advisor for investment decisions.`
    };
  }
}

// --- Intent Detection (Enhanced) ---
function detectIntent(query: string): { intent: string; symbols: string[]; date?: Date } {
  const lowerQuery = query.toLowerCase();
  const upperQuery = query.toUpperCase();

  // Check for historical price queries with dates
  const dateRegex = /(0?[1-9]|1[0-2])[\/-](0?[1-9]|[12][0-9]|3[01])[\/-](20\d{2}|\d{2})/g;
  const isoDateRegex = /(20\d{2})-(0?[1-9]|1[0-2])-(0?[1-9]|[12][0-9]|3[01])/g;
  const dateWithWords = /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})\s*,?\s*(20\d{2}|\d{4})/gi;
  const relativeTimeRegex = /(yesterday|today|last\s+(week|month|year)|(\d+)\s+(days?|weeks?|months?|years?)\s+ago)/gi;
  
  // Look for date patterns
  const dateMatches = query.match(dateRegex) || query.match(isoDateRegex) || query.match(dateWithWords);
  const relativeMatches = query.match(relativeTimeRegex);
  
  // Check for historical price request keywords
  const historicalPriceKeywords = ['close', 'price', 'at', 'on', 'was', 'traded', 'value', 'worth', 'closed', 'opened', 'high', 'low'];
  const hasHistoricalKeywords = historicalPriceKeywords.some(kw => lowerQuery.includes(kw));
  
  // Check for market explanation queries
  const marketExplanationKeywords = ['why', 'reason', 'because', 'caused', 'driving', 'behind', 'explain'];
  const marketMovementKeywords = ['down', 'up', 'drop', 'fell', 'rise', 'rose', 'crash', 'surge', 'volatile', 'movement'];
  const hasMarketExplanation = marketExplanationKeywords.some(kw => lowerQuery.includes(kw)) && 
                               marketMovementKeywords.some(kw => lowerQuery.includes(kw));
  
  // Check for market explanation queries first (before historical)
  if (hasMarketExplanation && (lowerQuery.includes('market') || lowerQuery.includes('stock') || lowerQuery.includes('nasdaq') || lowerQuery.includes('dow') || lowerQuery.includes('s&p'))) {
    console.log("Detected market explanation query");
    // Extract symbols for context
    const symbolRegex = /\b([A-Z]{1,5}-USD|[A-Z]{1,5}(\.[A-Z])?|\^[A-Z]+)\b/g;
    const symbolMatches = upperQuery.match(symbolRegex) || [];
    const wordsToIgnore = ['AND', 'VS', 'VERSUS', 'OR', 'WITH', 'THE', 'FOR', 'TO', 'ON', 'IN', 'A', 'AN', 'IT', 'IS', 'USD'];
    const symbols = symbolMatches.filter(sym => !wordsToIgnore.includes(sym));
    return { intent: 'market_explanation', symbols: symbols.length > 0 ? symbols : ['^GSPC'] };
  }
  
  if (dateMatches && hasHistoricalKeywords) {
    // Extract date from the match
    let dateValue: Date | null = null;
    const dateString = dateMatches[0];
    
    try {
      // Handle different date formats
      if (dateWithWords.test(dateString)) {
        // Convert month name to date
        const parts = dateString.match(/(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})\s*,?\s*(20\d{2})/i);
        if (parts) {
          const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
          const monthIndex = monthNames.findIndex(m => m === parts[1].toLowerCase());
          dateValue = new Date(parseInt(parts[3]), monthIndex, parseInt(parts[2]));
        }
      } else if (dateRegex.test(dateString)) {
        // Handle MM/DD/YYYY or MM/DD/YY format
        const parts = dateString.match(/(0?[1-9]|1[0-2])[\/-](0?[1-9]|[12][0-9]|3[01])[\/-](20\d{2}|\d{2})/);
        if (parts) {
          const month = parseInt(parts[1]) - 1; // JavaScript months are 0-indexed
          const day = parseInt(parts[2]);
          let year = parseInt(parts[3]);
          // Handle 2-digit years
          if (year < 100) {
            year = year < 50 ? 2000 + year : 1900 + year;
          }
          dateValue = new Date(year, month, day);
        }
      } else {
        dateValue = new Date(dateString);
      }
      
      if (dateValue && !isNaN(dateValue.getTime())) {
        console.log(`Detected historical price query for date: ${dateValue.toISOString()}`);
        
        // Extract any index/symbol mentioned
        const symbolRegex = /\b([A-Z]{1,5}-USD|[A-Z]{1,5}(\.[A-Z])?|\^[A-Z]+)\b/g;
        const symbolMatches = upperQuery.match(symbolRegex) || [];
        
        // Look for specific indices by name
        const indicesMap: {[key: string]: string} = {
          'S&P': '^GSPC',
          'S&P 500': '^GSPC',
          'S&P500': '^GSPC',
          'SP500': '^GSPC',
          'DOW': '^DJI',
          'DOW JONES': '^DJI',
          'NASDAQ': '^IXIC',
          'RUSSELL': '^RUT',
          'RUSSELL 2000': '^RUT'
        };
        
        let symbols = symbolMatches.filter(sym => !['AND', 'VS', 'VERSUS', 'OR', 'WITH', 'THE', 'FOR', 'TO', 'ON', 'IN', 'A', 'AN', 'IT', 'IS'].includes(sym));
        
        // Add crypto support for historical queries
        const CRYPTO_SYMBOLS = ['BTC', 'ETH', 'BNB', 'XRP', 'ADA', 'DOGE', 'MATIC', 'SOL', 'DOT', 'AVAX'];
        CRYPTO_SYMBOLS.forEach(crypto => {
          const cryptoRegex = new RegExp(`\\b${crypto}\\b`, 'i');
          if (cryptoRegex.test(query) && !upperQuery.includes(`${crypto}-USD`)) {
            symbols.push(`${crypto}-USD`);
          }
        });
        
        // Check for indices mentioned by name
        for (const [indexName, symbol] of Object.entries(indicesMap)) {
          if (upperQuery.includes(indexName)) {
            symbols.push(symbol);
          }
        }
        
        // If no specific symbol/index found, default to S&P 500 for general market queries
        if (symbols.length === 0 && (lowerQuery.includes('market') || lowerQuery.includes('index'))) {
          symbols.push('^GSPC'); // S&P 500
        }
        
        return { intent: 'historical', symbols: Array.from(new Set(symbols)), date: dateValue };
      }
    } catch (e) {
      console.error('Error parsing date:', e);
    }
  }
  
  // 1. Check for Concept or Educational Questions FIRST
  const conceptKeywords = [
    'what is', 'how does', 'explain', 'define', 'why does', 'when should',
    'volatility', 'inflation', 'recession', 'bull market', 'bear market',
    'dividend', 'yield', 'PE ratio', 'market cap', 'technical analysis',
    'fundamental analysis', 'diversification', 'portfolio', 'risk',
    'investing', 'trend', 'moving average', 'support', 'resistance'
  ];
  
  const isEducationalQuery = lowerQuery.includes('?') || 
    conceptKeywords.some(kw => lowerQuery.includes(kw)) || 
    /how|what|why|when|which|where|can you|could you tell/i.test(lowerQuery);
  
  // If it looks like an educational question without specific stocks, route to general advice
  if (isEducationalQuery && !/ vs | versus | compare /i.test(lowerQuery) && !dateMatches) {
    console.log("Detected educational or concept-based query: ", lowerQuery);
    return { intent: 'general_advice', symbols: [] };
  }
  
  // 2. Check for Vague Advice Queries
  const adviceKeywords = [
    'what should i buy', 'what to invest in', 'best investment', 
    'recommend a stock', 'good stock to buy', 'investment advice',
    'should i invest', 'buy now?', 'is it good to buy'
  ];
  
  // Check if any advice keyword is contained in the query
  if (adviceKeywords.some(kw => lowerQuery.includes(kw))) {
     console.log("Detected vague advice query: ", lowerQuery);
     return { intent: 'general_advice', symbols: [] }; 
  }
  
  // Improved symbol extraction - look for standalone stock symbols
  // This matches words that are 1-5 uppercase letters potentially followed by .X
  // Or matches BTC-USD format for crypto
  // Or matches ^GSPC format for indices
  // And ensures they're surrounded by spaces, punctuation or string boundaries
  const symbolRegex = /\b([A-Z]{1,5}-USD|[A-Z]{1,5}(\.[A-Z])?|\^[A-Z]+)\b/g;
  const symbolMatches = upperQuery.match(symbolRegex) || [];
  
  // Filter out common words that shouldn't be treated as symbols
  const wordsToIgnore = ['AND', 'VS', 'VERSUS', 'OR', 'WITH', 'THE', 'FOR', 'TO', 'ON', 'IN', 'A', 'AN', 'IT', 'IS', 'USD'];
  let symbolsInQuery = symbolMatches.filter(sym => !wordsToIgnore.includes(sym));
  
  // Enhanced crypto support
  const CRYPTO_SYMBOLS = ['BTC', 'ETH', 'BNB', 'XRP', 'ADA', 'DOGE', 'MATIC', 'SOL', 'DOT', 'AVAX', 'LINK', 'UNI', 'ATOM', 'LTC', 'ETC', 'XLM', 'ALGO', 'VET', 'FIL', 'THETA'];
  
  // Check for crypto mentions and add -USD suffix
  CRYPTO_SYMBOLS.forEach(crypto => {
    const cryptoRegex = new RegExp(`\\b${crypto}\\b`, 'i');
    if (cryptoRegex.test(query)) {
      // Check if -USD is already present
      if (!upperQuery.includes(`${crypto}-USD`)) {
        symbolsInQuery.push(`${crypto}-USD`);
        console.log(`Detected crypto symbol: ${crypto}, adding as ${crypto}-USD`);
      }
    }
  });
  
  // Also handle cases where user types "bitcoin" or "ethereum"
  const cryptoNameMap: {[key: string]: string} = {
    'BITCOIN': 'BTC-USD',
    'ETHEREUM': 'ETH-USD',
    'RIPPLE': 'XRP-USD',
    'CARDANO': 'ADA-USD',
    'DOGECOIN': 'DOGE-USD',
    'SOLANA': 'SOL-USD',
    'POLKADOT': 'DOT-USD',
    'LITECOIN': 'LTC-USD',
    'CHAINLINK': 'LINK-USD',
    'UNISWAP': 'UNI-USD'
  };
  
  Object.entries(cryptoNameMap).forEach(([name, symbol]) => {
    if (upperQuery.includes(name) && !symbolsInQuery.includes(symbol)) {
      symbolsInQuery.push(symbol);
      console.log(`Detected crypto name: ${name}, adding as ${symbol}`);
    }
  });
  
  // Remove duplicates
  symbolsInQuery = [...new Set(symbolsInQuery)];
  
  console.log("Raw symbol matches:", symbolMatches);
  console.log("Filtered symbols after removing common words:", symbolsInQuery);
  
  // For analysis of stock, make extra effort to find the symbol
  if (lowerQuery.includes('analyze') || lowerQuery.includes('analysis')) {
    const words = upperQuery.split(/\s+/);
    for (let i = 0; i < words.length; i++) {
      // Skip the word "ANALYZE" or "ANALYSIS" itself
      if (words[i] === 'ANALYZE' || words[i] === 'ANALYSIS') continue;
      // Skip filtered words
      if (wordsToIgnore.includes(words[i])) continue;
      
      // Check if any other word matches typical stock symbol pattern
      if (/^[A-Z]{1,5}$/.test(words[i]) && !symbolsInQuery.includes(words[i])) {
        symbolsInQuery.push(words[i]);
        console.log(`Found potential stock symbol in analysis query: ${words[i]}`);
      }
    }
  }
  
  // 3. Check for market summary
  const summaryKeywords = ['market', 'overview', 'summary', 'indices', 'how is the market', 'what happened today'];
  if (summaryKeywords.some(kw => lowerQuery.includes(kw)) && 
     !/(what is|explain|define|how does)/i.test(lowerQuery) && 
     !/on \d{1,2}[\/-]\d{1,2}[\/-]\d{4}|\d{4}-\d{1,2}-\d{1,2}/.test(lowerQuery)) { // Avoid matching educational questions about markets or historical queries
    console.log("Detected market summary query.");
    return { intent: 'summary', symbols: [] };
  }
  
  // 4. Special handling for comparison queries
  const compareKeywords = ['compare', 'vs', 'versus'];
  if (compareKeywords.some(kw => lowerQuery.includes(kw))) {
    if (symbolsInQuery && symbolsInQuery.length >= 2) {
      console.log("Detected comparison query with symbols:", symbolsInQuery[0], symbolsInQuery[1]);
      return { intent: 'compare', symbols: [symbolsInQuery[0], symbolsInQuery[1]] };
    } else if (symbolsInQuery && symbolsInQuery.length === 1) {
      // If only one symbol found in a comparison query, try to extract potential symbols from words
      const words = upperQuery.split(/\s+/);
      
      // Common company names to symbols mapping
      const companyNameMap: {[key: string]: string} = {
        'TESLA': 'TSLA',
        'FORD': 'F',
        'APPLE': 'AAPL',
        'MICROSOFT': 'MSFT',
        'GOOGLE': 'GOOGL',
        'AMAZON': 'AMZN',
        'META': 'META',
        'FACEBOOK': 'META',
        'NVIDIA': 'NVDA',
        'AMD': 'AMD',
        'INTEL': 'INTC',
        'NETFLIX': 'NFLX',
        'DISNEY': 'DIS',
        'WALMART': 'WMT',
        'TARGET': 'TGT',
        'NIKE': 'NKE',
        'STARBUCKS': 'SBUX'
      };
      
      // Check for company names
      Object.entries(companyNameMap).forEach(([name, symbol]) => {
        if (upperQuery.includes(name) && !symbolsInQuery.includes(symbol)) {
          symbolsInQuery.push(symbol);
          console.log(`Found company name ${name}, adding symbol ${symbol}`);
        }
      });
      
      // Skip common words and search for additional stock symbols
      for (let i = 0; i < words.length; i++) {
        if (wordsToIgnore.includes(words[i]) || symbolsInQuery.includes(words[i]) || 
            words[i] === 'COMPARE' || compareKeywords.some(kw => words[i].toLowerCase() === kw)) {
          continue;
        }
        
        if (/^[A-Z]{1,5}$/.test(words[i])) {
          symbolsInQuery.push(words[i]);
          console.log(`Found additional comparison symbol: ${words[i]}`);
          if (symbolsInQuery.length >= 2) {
            console.log("Found two symbols for comparison:", symbolsInQuery[0], symbolsInQuery[1]);
            return { intent: 'compare', symbols: [symbolsInQuery[0], symbolsInQuery[1]] };
          }
        }
      }
    }
  }

  console.log("Extracted symbols:", symbolsInQuery);

  // 5. Check for analysis of a SPECIFIC symbol
  const analysisKeywords = ['analyze', 'analysis', 'opinion on', 'forecast for', 'should i buy', 'advice on'];
  if (analysisKeywords.some(kw => lowerQuery.includes(kw)) && symbolsInQuery && symbolsInQuery.length > 0) {
     console.log("Detected analysis query.");
     return { intent: 'analysis', symbols: [symbolsInQuery[0] ?? ""] };
  }
  
  // 6. Check for single symbol lookup (lowest priority after specific intents)
  const potentialSymbolExact = upperQuery.match(/^([A-Z]{1,5}(\.[A-Z])?|[A-Z]{1,5}-USD|\^[A-Z]+)$/);
  if (potentialSymbolExact) {
     console.log("Detected exact symbol lookup.");
     return { intent: 'lookup', symbols: [potentialSymbolExact[0]] };
  }
  
  if (symbolsInQuery && symbolsInQuery.length === 1 && query.trim().split(' ').length <= 3) {
      console.log("Detected single symbol in short query lookup.");
      return { intent: 'lookup', symbols: [symbolsInQuery[0]] };
  }
  
  // 7. If query contains a question mark but no clear intent was found, treat as general advice
  if (lowerQuery.includes('?')) {
    console.log("Question detected without clear intent, routing to general advice");
    return { intent: 'general_advice', symbols: [] };
  }

  // Default or fallback intent
  console.log("Intent not clearly recognized, falling back to unknown/help.");
  return { intent: 'unknown', symbols: [] };
}

// --- Handle Market Explanation Queries ---
async function handleMarketExplanation(symbols: string[], query: string): Promise<FinancialResponse> {
  console.log(`Handling market explanation query for symbols ${symbols.join(', ')}`);
  
  try {
    // Get current market data for context
    const symbolsToQuery = symbols.length > 0 ? symbols : ['^GSPC', '^DJI', '^IXIC'];
    const currentData = await fetchYahooQuoteData(symbolsToQuery);
    
    let contextData = '';
    if (currentData && currentData.length > 0) {
      contextData = 'Current market status:\n';
      currentData.forEach((quote) => {
        const name = quote.shortName || quote.longName || quote.symbol;
        const change = quote.regularMarketChangePercent || 0;
        contextData += `${name}: ${change > 0 ? '+' : ''}${formatNumber(change)}%\n`;
      });
    }
    
    // Use the general advice handler with enhanced context for market explanations
    const enhancedQuery = `${query} ${contextData}`;
    const response = await handleGeneralAdvice(enhancedQuery, undefined);
    
    // Add current market metrics to the response
    if (currentData && currentData.length > 0) {
      const key_metrics: Record<string, string> = {};
      currentData.forEach((quote) => {
        const name = quote.shortName || quote.longName || quote.symbol;
        const price = quote.regularMarketPrice || 0;
        const change = quote.regularMarketChange || 0;
        const changePercent = quote.regularMarketChangePercent || 0;
        key_metrics[name] = `${formatNumber(price)} (${getSign(change)}${formatNumber(change)}, ${getSign(changePercent)}${formatNumber(changePercent)}%)`;
      });
      response.key_metrics = { ...key_metrics, ...response.key_metrics };
    }
    
    return response;
  } catch (error) {
    console.error('Error in handleMarketExplanation:', error);
    return {
      type: 'general_advice',
      summary: `Market movements can be influenced by various factors including economic data, geopolitical events, company earnings, and investor sentiment. For the most current analysis, I recommend checking financial news sources or consulting with a financial advisor.`,
      key_metrics: {}
    };
  }
}

// --- Main POST Handler --- (Updated switch statement)
// --- Handle Historical Data Queries ---
async function handleHistoricalQuery(symbols: string[], date: Date): Promise<FinancialResponse> {
  console.log(`Handling historical query for symbols ${symbols.join(', ')} on date ${date.toISOString()}`);
  
  try {
    // Format date for display
    const formattedDate = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Ensure we have at least one symbol to look up
    const symbolsToQuery = symbols.length > 0 ? symbols : ['^GSPC']; // Default to S&P 500
    
    // Set up parameters for historical query
    const historicalResults: Record<string, any> = {};
    const symbolNames: Record<string, string> = {};
    
    // Map for common index names
    const indexDisplayNames: Record<string, string> = {
      '^GSPC': 'S&P 500',
      '^DJI': 'Dow Jones Industrial Average',
      '^IXIC': 'NASDAQ Composite',
      '^RUT': 'Russell 2000'
    };
    
    // Handle date adjustments for weekends and holidays
    // If the requested date is a weekend or holiday, we need to get the closest previous trading day
    const dayOfWeek = date.getDay();
    let adjustedDate = new Date(date);
    let dateAdjustmentMessage = '';
    
    if (dayOfWeek === 0) { // Sunday
      adjustedDate.setDate(date.getDate() - 2); // Go back to Friday
      dateAdjustmentMessage = '(Note: Markets are closed on Sundays, showing Friday\'s closing price)';
    } else if (dayOfWeek === 6) { // Saturday
      adjustedDate.setDate(date.getDate() - 1); // Go back to Friday
      dateAdjustmentMessage = '(Note: Markets are closed on Saturdays, showing Friday\'s closing price)';
    }
    
    // We need to fetch data for a period around the date to ensure we get the actual trading day
    // Yahoo Finance needs dates in YYYY-MM-DD format
    // Set period to cover 5 days before the target date to account for holidays
    const startDate = new Date(adjustedDate);
    startDate.setDate(startDate.getDate() - 5);
    
    const endDate = new Date(adjustedDate);
    endDate.setDate(endDate.getDate() + 1); // Add 1 day to include the target date
    
    for (const symbol of symbolsToQuery) {
      try {
        // Get the historical data for the symbol
        const result = await yahooFinance.historical(symbol, {
          period1: startDate.toISOString().split('T')[0],
          period2: endDate.toISOString().split('T')[0],
          interval: '1d',
        });
        
        // Get symbol information for display
        try {
          const quote = await yahooFinance.quote(symbol);
          symbolNames[symbol] = quote.shortName || quote.longName || indexDisplayNames[symbol] || symbol;
        } catch (e) {
          console.error(`Error fetching quote for ${symbol}:`, e);
          symbolNames[symbol] = indexDisplayNames[symbol] || symbol;
        }
        
        // Find the closest date to the requested date
        // Sort the results by date
        const sortedResults = result.sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateB - dateA; // Sort descending (newest first)
        });
        
        // Get the closest date before or equal to the adjusted request date
        const targetTimestamp = adjustedDate.getTime();
        const closestResult = sortedResults.find(r => {
          const resultDate = new Date(r.date);
          return resultDate.getTime() <= targetTimestamp;
        });
        
        if (closestResult) {
          historicalResults[symbol] = closestResult;
          
          // Check if we need to add a message about using a different date
          const resultDate = new Date(closestResult.date);
          if (resultDate.getTime() !== adjustedDate.getTime()) {
            const resultFormatted = resultDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
            dateAdjustmentMessage = `(Note: No trading data available for the requested date. Showing closest available data from ${resultFormatted})`;
          }
        } else {
          throw new Error(`No historical data found for ${symbol} around ${formattedDate}`);
        }
      } catch (error) {
        console.error(`Error fetching historical data for ${symbol}:`, error);
      }
    }
    
    // Build the response
    let summary = '';
    let key_metrics: Record<string, string> = {};
    
    if (Object.keys(historicalResults).length === 0) {
      return {
        type: 'error',
        summary: `I couldn't find historical market data for ${formattedDate}. This could be because the markets were closed (weekend or holiday) or the data is not available in my system.`,
        key_metrics: {}
      };
    }
    
    // Format the response based on the number of symbols
    if (symbolsToQuery.length === 1) {
      // Single symbol response
      const symbol = symbolsToQuery[0];
      const data = historicalResults[symbol];
      const name = symbolNames[symbol];
      
      if (data) {
        const { open, high, low, close, volume } = data;
        
        summary = `On ${formattedDate}, the ${name} closed at ${close.toFixed(2)}. ${dateAdjustmentMessage}`;
        
        key_metrics = {
          'Symbol': symbol,
          'Open': `${open.toFixed(2)}`,
          'High': `${high.toFixed(2)}`,
          'Low': `${low.toFixed(2)}`,
          'Close': `${close.toFixed(2)}`,
          'Volume': volume.toLocaleString()
        };
      }
    } else {
      // Multiple symbols response
      summary = `Historical market data for ${formattedDate}:\n\n`;
      
      for (const symbol of symbolsToQuery) {
        const data = historicalResults[symbol];
        const name = symbolNames[symbol];
        
        if (data) {
          summary += `${name} (${symbol}): Closed at ${data.close.toFixed(2)}\n`;
          key_metrics[name] = `Open: ${data.open.toFixed(2)}, Close: ${data.close.toFixed(2)}`;
        }
      }
      
      if (dateAdjustmentMessage) {
        summary += `\n${dateAdjustmentMessage}`;
      }
    }
    
    return {
      type: 'lookup',
      summary,
      key_metrics
    };
  } catch (error) {
    console.error('Error in handleHistoricalQuery:', error);
    return {
      type: 'error',
      summary: `I couldn't retrieve the historical market data you requested. ${error instanceof Error ? error.message : 'An unknown error occurred.'}`,
      key_metrics: {}
    };
  }
}

export async function POST(req: NextRequest) {
  let marketStatusMessage = "";
  let responseData: FinancialResponse | undefined;

  try {
    // Initialize RAG data when needed, not at module load time
    try {
      const result = await loadInitialFinancialKnowledge();
      if (result.success) {
        console.log(`Loaded ${result.count} financial knowledge documents into RAG system`);
      } else {
        console.log("Note: Financial knowledge documents were not loaded");
      }
    } catch (err) {
      console.log("Note: Could not load financial knowledge:", err);
      // Continue with the request even if this fails
    }

    const marketStatus = await getMarketStatus();
    marketStatusMessage = marketStatus.message;

    const { query, userPreferences } = await req.json();
    if (!query || typeof query !== 'string') {
        return NextResponse.json({ error: 'Invalid query provided' }, { status: 400 });
    }

    console.log(`Processing query: "${query}"`);
    console.log(`User preferences:`, userPreferences ? 'Available' : 'Not provided');
    const intentResult = detectIntent(query);
    const { intent, symbols } = intentResult;
    console.log(`Detected Intent: ${intent}, Symbols: ${symbols.join(', ')}`);

    switch (intent) {
      case 'historical':
        // Handle historical price query
        if (intentResult.date) {
          responseData = await handleHistoricalQuery(symbols, intentResult.date);
        } else {
          responseData = {
            type: 'error',
            summary: 'I detected a historical price query but couldn\'t determine the specific date. Please specify the date in a format like MM/DD/YYYY or Month Day, Year.',
            key_metrics: {}
          };
        }
        break;
      case 'lookup':
        responseData = await handleLookup(symbols[0]);
        break;
      case 'compare':
        responseData = await handleComparison(symbols[0], symbols[1]);
        break;
      case 'summary':
        responseData = await handleMarketSummary();
        break;
      case 'analysis':
         responseData = await handleAnalysis(symbols[0]);
         break;
      case 'market_explanation':
         responseData = await handleMarketExplanation(symbols, query);
         break;
      case 'general_advice':
         responseData = await handleGeneralAdvice(query, userPreferences);
         break;
      case 'unknown':
      default:
        // ... (Fallback logic remains the same)
        const potentialSymbols = query.toUpperCase().match(/([A-Z]{1,5}(\.[A-Z])?|-USD|\^[A-Z]+)/g);
        if (potentialSymbols && potentialSymbols.length === 1) {
           console.log('Unknown intent, fallback to lookup for single detected symbol.');
           responseData = await handleLookup(potentialSymbols[0]);
        } else {
           responseData = { 
               type: 'help', 
               summary: `I can provide information on specific stocks (e.g., AAPL), crypto (BTC-USD), or indices (^GSPC). You can also ask me to 'compare AAPL and MSFT' or for a 'market summary'. How can I help?`,
               key_metrics: {}
           };
        }
        break;
    }

    // Add market status message (excluding general advice)
    if (responseData && responseData.summary && responseData.type !== 'general_advice' && !marketStatus.isOpen) {
      responseData.summary = `${marketStatusMessage}\n\n${responseData.summary}`;
    }
    
    // Add disclaimer for analysis type specifically
    if (responseData?.type === 'analysis') {
       responseData.summary += `\n\n**Disclaimer:** *This information is for educational purposes only and not financial advice. Consult a qualified professional before making investment decisions.*`;
    }
    // Disclaimer is already built into the general_advice response

    return NextResponse.json(responseData);

  } catch (error) {
      // ... (Error handling remains the same)
       console.error('Unhandled error in financial assistant query route:', error);
       const errorMessage = `${marketStatusMessage} Sorry, an internal error occurred while processing your request. ${error instanceof Error ? error.message : ''}`;
       return NextResponse.json({ 
           type: 'error',
           error: errorMessage,
           summary: errorMessage 
       }, { status: 500 });
  }
} 
