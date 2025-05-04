import { createClient } from '@supabase/supabase-js';
import { OpenAIEmbeddings } from '@langchain/openai';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { supabase } from './supabaseClient';

// Define Document interface
interface DocumentInput {
  pageContent: string;
  metadata: Record<string, any>;
}

// Initialize OpenAI embeddings
const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
});

// Define collection name for financial data
const COLLECTION_NAME = 'financial_knowledge';

/**
 * Store financial knowledge in the vector database
 */
export async function storeFinancialKnowledge(
  contents: { title: string; content: string; source: string; category: string }[]
) {
  try {
    // Create documents for vector storage
    const documents = contents.map(
      (item) => ({
        pageContent: item.content,
        metadata: {
          title: item.title,
          source: item.source,
          category: item.category,
          created_at: new Date().toISOString(),
        },
      } as DocumentInput)
    );

    // Store documents in Supabase vector store
    const vectorStore = await SupabaseVectorStore.fromDocuments(
      documents,
      embeddings,
      {
        client: supabase,
        tableName: 'documents',
        queryName: 'match_documents',
      }
    );

    return { success: true, count: documents.length };
  } catch (error) {
    console.error('Error storing financial knowledge:', error);
    return { success: false, error };
  }
}

/**
 * Search for relevant financial knowledge based on query
 */
export async function queryFinancialKnowledge(query: string, limit = 5) {
  try {
    // Initialize vector store
    const vectorStore = new SupabaseVectorStore(embeddings, {
      client: supabase,
      tableName: 'documents',
      queryName: 'match_documents',
    });

    // Search for similar documents
    const results = await vectorStore.similaritySearch(query, limit);
    
    return {
      success: true,
      results: results.map((doc: DocumentInput) => ({
        content: doc.pageContent,
        metadata: doc.metadata,
      })),
    };
  } catch (error) {
    console.error('Error querying financial knowledge:', error);
    return { success: false, error };
  }
}

/**
 * Load initial financial knowledge into the vector database
 */
export async function loadInitialFinancialKnowledge() {
  // Basic financial concepts and terminology
  const basicFinancialKnowledge = [
    {
      title: 'Stock Market Basics',
      content: 'The stock market is a collection of exchanges where companies list their shares for public trading. Investors buy and sell these shares, with prices determined by supply and demand. Major indices like the S&P 500, Dow Jones, and NASDAQ track overall market performance.',
      source: 'financial_education',
      category: 'basics',
    },
    {
      title: 'Technical Analysis',
      content: 'Technical analysis studies past market data, primarily price and volume, to forecast future price movements. Common indicators include Moving Averages (SMA/EMA), Relative Strength Index (RSI), MACD, and Bollinger Bands. These tools help identify trends and potential reversal points.',
      source: 'financial_education',
      category: 'analysis',
    },
    {
      title: 'Fundamental Analysis',
      content: 'Fundamental analysis evaluates a security\'s intrinsic value by examining related economic, financial, and other qualitative and quantitative factors. For stocks, this includes reviewing financial statements, analyzing industry trends, and assessing management quality.',
      source: 'financial_education',
      category: 'analysis',
    },
    {
      title: 'Stock Market Indices',
      content: 'Major stock indices include: S&P 500 (^GSPC) - tracks 500 large US companies, Dow Jones Industrial Average (^DJI) - tracks 30 large US companies, NASDAQ Composite (^IXIC) - technology-heavy index, Russell 2000 (^RUT) - small-cap index, FTSE 100 (^FTSE) - tracks 100 companies on London Stock Exchange.',
      source: 'financial_education',
      category: 'indices',
    },
    {
      title: 'Investment Strategies',
      content: 'Common investment strategies include: Value Investing - buying undervalued stocks, Growth Investing - focusing on companies with high growth potential, Dollar-Cost Averaging - regularly investing a fixed amount regardless of price, Dividend Investing - focusing on dividend-paying stocks, Index Investing - tracking market indices through ETFs or index funds.',
      source: 'financial_education',
      category: 'strategies',
    },
    {
      title: 'Risk Management',
      content: 'Effective risk management involves diversification across different asset classes, sectors, and geographies. Position sizing limits exposure to any single investment. Stop-loss orders help limit potential losses. Understanding correlation between investments helps build a resilient portfolio.',
      source: 'financial_education',
      category: 'risk',
    },
    {
      title: 'Cryptocurrency Basics',
      content: 'Cryptocurrencies are digital or virtual currencies that use cryptography for security and operate on decentralized networks called blockchains. Bitcoin (BTC-USD) was the first cryptocurrency, created in 2009. Other major cryptocurrencies include Ethereum (ETH-USD), Binance Coin (BNB-USD), and Solana (SOL-USD).',
      source: 'financial_education',
      category: 'crypto',
    },
    {
      title: 'Market Capitalization',
      content: 'Market capitalization (market cap) is the total value of a company\'s outstanding shares, calculated by multiplying the current share price by the number of shares outstanding. Companies are typically categorized as: Large-cap (>$10 billion), Mid-cap ($2-10 billion), Small-cap ($300 million-$2 billion), and Micro-cap (<$300 million).',
      source: 'financial_education',
      category: 'metrics',
    },
    {
      title: 'Financial Ratios',
      content: 'Key financial ratios include: Price-to-Earnings (P/E) - stock price divided by earnings per share, Price-to-Book (P/B) - price relative to book value, Debt-to-Equity - measure of leverage, Return on Equity (ROE) - profitability relative to equity, Dividend Yield - annual dividends relative to share price.',
      source: 'financial_education',
      category: 'metrics',
    },
    {
      title: 'Economic Indicators',
      content: 'Important economic indicators include: GDP (Gross Domestic Product) - measure of economic output, CPI (Consumer Price Index) - measure of inflation, Unemployment Rate - percentage of labor force without jobs, Interest Rates - set by central banks like the Federal Reserve, PMI (Purchasing Managers\' Index) - indicator of economic activity in manufacturing and services sectors.',
      source: 'financial_education',
      category: 'economics',
    },
    // New entries about volatility and market concepts
    {
      title: 'Market Volatility',
      content: 'Market volatility refers to the rate at which the price of securities increases or decreases. High volatility is characterized by sharp price fluctuations and indicates uncertainty in the markets. Volatility is often measured using the VIX index (^VIX), also known as the "fear index." Volatile markets can present both risks and opportunities, with larger potential gains or losses. Volatility tends to increase during economic uncertainty, major geopolitical events, or when unexpected news impacts markets.',
      source: 'financial_education',
      category: 'risk',
    },
    {
      title: 'Types of Market Volatility',
      content: 'Market volatility can be categorized as: 1) Historical Volatility - measures past price movements, 2) Implied Volatility - reflects market expectations for future volatility (derived from options prices), 3) Idiosyncratic Volatility - specific to individual securities, and 4) Systematic Volatility - affects the entire market. Volatility clustering is a phenomenon where high volatility periods tend to be followed by more high volatility, while low volatility periods tend to persist as well.',
      source: 'financial_education',
      category: 'risk',
    },
    {
      title: 'Measuring Volatility',
      content: 'Common volatility measurements include: 1) Standard Deviation - statistical measure of price dispersion, 2) Beta - measures a stock\'s volatility relative to the overall market, 3) VIX Index - measures expected S&P 500 volatility based on options prices, 4) Average True Range (ATR) - technical indicator measuring market volatility, 5) Bollinger Bands - indicates volatility by widening or narrowing bands around a moving average.',
      source: 'financial_education',
      category: 'metrics',
    },
    {
      title: 'Managing Volatility Risk',
      content: 'Strategies to manage volatility in investment portfolios include: 1) Diversification across asset classes, sectors, and geographies, 2) Using stop-loss orders to limit potential losses, 3) Dollar-cost averaging to reduce timing risk, 4) Holding uncorrelated assets that don\'t move in the same direction, 5) Using options strategies for hedging, 6) Investing in low-volatility stocks or ETFs, 7) Maintaining a long-term perspective rather than reacting to short-term fluctuations.',
      source: 'financial_education',
      category: 'strategies',
    },
    {
      title: 'Bear Markets',
      content: 'A bear market is defined as a prolonged period of falling stock prices, typically a 20% or greater decline from recent highs. Bear markets are characterized by negative investor sentiment, declining economic indicators, and often higher volatility. They can last from several months to years. Defensive investing strategies during bear markets include increasing cash positions, focusing on value stocks, utilities, consumer staples, and dividend-paying stocks that tend to be more resilient during downturns.',
      source: 'financial_education',
      category: 'markets',
    },
    {
      title: 'Bull Markets',
      content: 'A bull market represents a period of rising stock prices, typically characterized by a 20% or greater increase from recent lows. Bull markets are associated with optimistic investor sentiment, strong economic growth, and often lower volatility (except during the late stages). These markets can last for years, with occasional corrections (temporary declines of 10-20%). Growth stocks and cyclical sectors like technology, consumer discretionary, and industrials typically outperform during bull markets.',
      source: 'financial_education',
      category: 'markets',
    },
    {
      title: 'Market Corrections',
      content: 'A market correction is a temporary decline of 10-20% from recent market highs. Corrections are normal occurrences in financial markets, happening on average about once per year. They serve to adjust overvalued prices and create potential buying opportunities. Unlike bear markets, corrections generally resolve more quickly (typically weeks to months) and don\'t necessarily indicate a shift in the long-term market trend. Corrections can be triggered by economic data, policy changes, geopolitical events, or simply investor sentiment shifts.',
      source: 'financial_education',
      category: 'markets',
    },
    {
      title: 'Volatility and Asset Allocation',
      content: 'Asset allocation decisions should consider volatility based on an investor\'s risk tolerance and time horizon. Generally, younger investors with longer time horizons can tolerate more volatility, justifying higher equity allocations, while investors nearing or in retirement might reduce portfolio volatility by increasing allocations to bonds and cash equivalents. During high volatility periods, maintaining the discipline to stick with a strategic asset allocation plan is crucial, potentially rebalancing to take advantage of price fluctuations rather than allowing emotions to drive decisions.',
      source: 'financial_education',
      category: 'strategies',
    },
  ];
  
  return await storeFinancialKnowledge(basicFinancialKnowledge);
} 