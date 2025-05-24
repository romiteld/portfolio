// Improvements to add to the financial assistant route

// 1. Add rate limiter for OpenAI calls
import { RateLimiter } from '@/app/utils/rateLimiter';
export const openAIRateLimiter = new RateLimiter(20); // 20 requests per minute for OpenAI

// 2. Enhanced symbol recognition for crypto and comparisons
export function enhancedSymbolExtraction(query: string): string[] {
  const upperQuery = query.toUpperCase();
  
  // Enhanced crypto symbol patterns
  const cryptoSymbols = [
    'BTC-USD', 'ETH-USD', 'BNB-USD', 'XRP-USD', 'ADA-USD', 
    'DOGE-USD', 'MATIC-USD', 'SOL-USD', 'DOT-USD', 'AVAX-USD',
    'LINK-USD', 'UNI-USD', 'ATOM-USD', 'LTC-USD', 'ETC-USD',
    'XLM-USD', 'ALGO-USD', 'VET-USD', 'FIL-USD', 'THETA-USD'
  ];
  
  // Common stock symbols that might be missed
  const commonStocks = [
    'TSLA', 'NVDA', 'AMD', 'INTC', 'META', 'SNAP', 'SQ', 'PYPL',
    'NFLX', 'DIS', 'COST', 'WMT', 'TGT', 'HD', 'LOW', 'NKE',
    'SBUX', 'MCD', 'BA', 'GE', 'F', 'GM', 'RIVN', 'LCID'
  ];
  
  const symbols: string[] = [];
  
  // Check for crypto symbols
  for (const crypto of cryptoSymbols) {
    if (upperQuery.includes(crypto.replace('-USD', '')) || upperQuery.includes(crypto)) {
      symbols.push(crypto);
    }
  }
  
  // Check for common stocks
  for (const stock of commonStocks) {
    if (upperQuery.includes(stock)) {
      symbols.push(stock);
    }
  }
  
  // Standard regex patterns
  const symbolRegex = /\b([A-Z]{1,5}(\.[A-Z])?|\b[A-Z]{1,5}-USD\b|\^[A-Z]+)\b/g;
  const matches = upperQuery.match(symbolRegex) || [];
  
  // Filter out common words and add to symbols
  const wordsToIgnore = ['AND', 'VS', 'VERSUS', 'OR', 'WITH', 'THE', 'FOR', 'TO', 'ON', 'IN', 'A', 'AN', 'IT', 'IS', 'USD', 'CRYPTO'];
  const regexSymbols = matches.filter(sym => !wordsToIgnore.includes(sym));
  
  // Combine and deduplicate
  return Array.from(new Set([...symbols, ...regexSymbols]));
}

// 3. Improved comparison detection
export function detectComparison(query: string): { isComparison: boolean; symbols: string[] } {
  const lowerQuery = query.toLowerCase();
  const compareKeywords = ['compare', 'vs', 'versus', 'against', 'or', 'and', 'between', 'difference'];
  
  const hasCompareKeyword = compareKeywords.some(kw => {
    // Check for exact word match to avoid false positives
    const regex = new RegExp(`\\b${kw}\\b`, 'i');
    return regex.test(query);
  });
  
  if (!hasCompareKeyword) {
    return { isComparison: false, symbols: [] };
  }
  
  const symbols = enhancedSymbolExtraction(query);
  return { isComparison: symbols.length >= 2, symbols: symbols.slice(0, 2) };
}

// 4. Add OpenAI rate limiting wrapper
export async function callOpenAIWithRateLimit(
  apiCall: () => Promise<any>,
  userId: string = 'default'
): Promise<any> {
  if (!openAIRateLimiter.canMakeRequest(userId)) {
    const waitTime = openAIRateLimiter.getTimeUntilNextSlot(userId);
    throw new Error(`Rate limit exceeded. Please wait ${waitTime} seconds before trying again.`);
  }
  
  openAIRateLimiter.trackRequest(userId);
  return await apiCall();
}

// 5. Enhanced historical data response type fix
export function formatHistoricalResponse(
  historicalData: any,
  symbol: string,
  date: Date
): { type: 'lookup'; summary: string; key_metrics: Record<string, string> } {
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  if (!historicalData) {
    return {
      type: 'lookup',
      summary: `I couldn't find historical market data for ${symbol} on ${formattedDate}. This might be because the market was closed on that date or the data is not available.`,
      key_metrics: {}
    };
  }
  
  const { open, high, low, close, volume } = historicalData;
  const change = close - open;
  const changePercent = (change / open) * 100;
  
  return {
    type: 'lookup',
    summary: `Historical data for ${symbol} on ${formattedDate}:\n\nThe stock opened at $${open.toFixed(2)} and closed at $${close.toFixed(2)}, ${change >= 0 ? 'up' : 'down'} ${Math.abs(change).toFixed(2)} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%) for the day.`,
    key_metrics: {
      'Date': formattedDate,
      'Open': `$${open.toFixed(2)}`,
      'Close': `$${close.toFixed(2)}`,
      'High': `$${high.toFixed(2)}`,
      'Low': `$${low.toFixed(2)}`,
      'Volume': formatLargeNumber(volume),
      'Change': `${change >= 0 ? '+' : ''}$${Math.abs(change).toFixed(2)} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)`
    }
  };
}

// Helper function for large numbers
function formatLargeNumber(num: number): string {
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toLocaleString();
}