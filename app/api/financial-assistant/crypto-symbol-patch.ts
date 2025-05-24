// Crypto symbol enhancement for detectIntent function
// Add this code block after line 760 (after symbolRegex definition)

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