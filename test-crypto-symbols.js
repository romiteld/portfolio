// Test crypto symbol detection logic
function testCryptoSymbolDetection(query) {
  const upperQuery = query.toUpperCase();
  const lowerQuery = query.toLowerCase();
  
  // Enhanced regex with crypto support first
  const symbolRegex = /\b([A-Z]{1,5}-USD|[A-Z]{1,5}(\.[A-Z])?|\^[A-Z]+)\b/g;
  const symbolMatches = upperQuery.match(symbolRegex) || [];
  
  // Filter out common words
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
  
  // Remove duplicates
  symbolsInQuery = [...new Set(symbolsInQuery)];
  
  // Check for exact match
  const potentialSymbolExact = upperQuery.match(/^([A-Z]{1,5}(\.[A-Z])?|[A-Z]{1,5}-USD|\^[A-Z]+)$/);
  
  return {
    query,
    upperQuery,
    symbolMatches,
    filteredSymbols: symbolsInQuery,
    isExactMatch: !!potentialSymbolExact,
    exactMatch: potentialSymbolExact ? potentialSymbolExact[0] : null
  };
}

// Test cases
const testCases = [
  'BTC-USD',
  'BTC',
  'ETH-USD',
  'bitcoin',
  'Compare BTC and ETH',
  'AAPL',
  'How is BTC doing?'
];

console.log('Testing crypto symbol detection:\n');
testCases.forEach(test => {
  const result = testCryptoSymbolDetection(test);
  console.log(`Query: "${test}"`);
  console.log(`Symbols found: ${JSON.stringify(result.filteredSymbols)}`);
  console.log(`Is exact match: ${result.isExactMatch}`);
  console.log(`Exact match: ${result.exactMatch}`);
  console.log('---');
});