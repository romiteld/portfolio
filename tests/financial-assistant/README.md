# Financial Assistant Test Suite

Comprehensive test scripts for the Financial Assistant demo, covering all functionality including stock lookups, historical data, market analysis, and RAG-enhanced responses.

## Test Modules

### 1. **Stock Lookup Tests** (`test-stock-lookup.ts`)
- Tests individual stock symbol queries (AAPL, MSFT, etc.)
- Validates response structure and key metrics
- Tests indices (^GSPC) and crypto (BTC-USD)
- Handles invalid symbols

### 2. **Historical Data Tests** (`test-historical-data.ts`)
- Tests various date formats (MM/DD/YYYY, Month Day Year, ISO)
- Handles weekends and holidays
- Tests relative dates ("yesterday")
- Validates OHLC data in responses

### 3. **Market Explanation Tests** (`test-market-explanations.ts`)
- Tests "why is the market down/up" queries
- Validates explanation quality
- Checks for market context and metrics
- Tests various phrasings

### 4. **Stock Comparison Tests** (`test-stock-comparison.ts`)
- Tests comparing two stocks/indices
- Validates comparison table format
- Tests various comparison phrasings
- Handles edge cases (invalid symbols)

### 5. **Market Summary Tests** (`test-market-summary.ts`)
- Tests market overview queries
- Validates major indices inclusion
- Checks percentage changes
- Tests various summary requests

### 6. **Financial Advice & RAG Tests** (`test-financial-advice.ts`)
- Tests educational queries (concepts, definitions)
- Tests investment advice queries
- Validates RAG system usage
- Tests with user preferences
- Checks for appropriate disclaimers

### 7. **Comprehensive Test Runner** (`run-all-tests.ts`)
- Runs all test suites sequentially
- Generates detailed performance reports
- Saves results to JSON file
- Provides summary statistics

## Running Tests

### Prerequisites
```bash
# Install dependencies
npm install

# Ensure .env.local has required API keys
OPENAI_API_KEY=your_key
NEXT_PUBLIC_SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key
```

### Run Individual Test Suites
```bash
# Stock lookup tests
npx ts-node tests/financial-assistant/test-stock-lookup.ts

# Historical data tests
npx ts-node tests/financial-assistant/test-historical-data.ts

# Market explanation tests
npx ts-node tests/financial-assistant/test-market-explanations.ts

# Comparison tests
npx ts-node tests/financial-assistant/test-stock-comparison.ts

# Market summary tests
npx ts-node tests/financial-assistant/test-market-summary.ts

# Financial advice tests
npx ts-node tests/financial-assistant/test-financial-advice.ts
```

### Run All Tests
```bash
# Run complete test suite
npx ts-node tests/financial-assistant/run-all-tests.ts
```

## Test Configuration

Tests use the following environment variables:
- `NEXT_PUBLIC_API_URL`: API endpoint (defaults to http://localhost:3000)
- Rate limiting: Tests include delays between requests

## Understanding Results

### Success Criteria
- ✅ **Passed**: Request successful and response validated
- ❌ **Failed**: Request failed or response invalid
- ⚠️ **Warning**: Request successful but missing expected features

### Performance Metrics
- Average response time per endpoint
- Slowest tests identified
- RAG usage statistics
- Success rate percentages

### Test Reports
Detailed reports are saved to `./test-reports/` with:
- Complete test results
- Performance metrics
- Failed test details
- Timestamp and duration

## Common Issues

### Rate Limiting
Tests include delays to avoid rate limiting. If you encounter 429 errors:
- Increase delays between tests
- Run test suites individually
- Check middleware rate limits

### API Timeouts
For slow responses:
- Check network connectivity
- Verify API keys are valid
- Ensure Supabase is properly configured

### Missing Features
If tests fail due to missing features:
- Verify all migrations have been run
- Check that financial knowledge is loaded
- Ensure vector storage is configured

## Extending Tests

To add new test cases:

1. Add test case to relevant array in test file
2. Include expected behavior/validation
3. Update test runner if adding new suite
4. Document new test scenarios

Example:
```typescript
const testCases = [
  // Existing tests...
  { 
    query: 'Your new test query',
    expectedType: 'expected_response_type',
    validateFn: (response) => response.someField === expectedValue
  }
];
```