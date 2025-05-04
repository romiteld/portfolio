/**
 * Supabase Database Schema for Financial Assistant
 * 
 * This file contains type definitions and schema information for
 * the Supabase tables used by the financial assistant.
 */

// Financial advice content stored in Supabase
export interface FinancialAdvice {
  id: number;
  category: 'investing' | 'crypto' | 'index_funds' | 'risk' | 'general' | 'research';
  title: string;
  content: string;
  keywords: string[]; // For keyword matching
  created_at: string;
  updated_at: string;
}

// Market data history
export interface MarketData {
  id: number;
  date: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  change_percent: number;
  volume?: number;
  market_cap?: number;
  type: 'stock' | 'index' | 'crypto';
  created_at: string;
}

// User query history
export interface UserQuery {
  id: number;
  user_id: string;
  query: string;
  detected_intent: string;
  detected_symbols: string[];
  response_type: string;
  created_at: string;
}

/**
 * SQL Creation Scripts for Supabase Setup
 * 
 * The following SQL should be run in the Supabase SQL editor to set up the tables.
 * You can copy and paste these into the SQL editor in the Supabase dashboard.
 */

/*
-- Financial Advice Table
CREATE TABLE financial_advice (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('investing', 'crypto', 'index_funds', 'risk', 'general', 'research')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_financial_advice_category ON financial_advice(category);
CREATE INDEX idx_financial_advice_keywords ON financial_advice USING GIN(keywords);

-- Market Data Table
CREATE TABLE market_data (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  price DECIMAL(18, 6) NOT NULL,
  change DECIMAL(18, 6) NOT NULL,
  change_percent DECIMAL(10, 4) NOT NULL,
  volume BIGINT,
  market_cap BIGINT,
  type TEXT NOT NULL CHECK (type IN ('stock', 'index', 'crypto')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_market_data_symbol ON market_data(symbol);
CREATE INDEX idx_market_data_date ON market_data(date);
CREATE INDEX idx_market_data_type ON market_data(type);

-- User Query History
CREATE TABLE user_queries (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  query TEXT NOT NULL,
  detected_intent TEXT NOT NULL,
  detected_symbols TEXT[] NOT NULL DEFAULT '{}',
  response_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_user_queries_user_id ON user_queries(user_id);
*/

/**
 * Example Functions for Interacting with Supabase
 * These would be implemented in the actual API route file
 */

/**
 * Gets relevant financial advice from Supabase based on category and keywords
 * 
 * @param category - The advice category to query
 * @param keywords - Keywords to match against
 * @returns Promise containing matching advice objects
 */
export async function getFinancialAdvice(
  supabase: any, 
  category: string, 
  keywords: string[]
): Promise<FinancialAdvice[]> {
  // In a real implementation, this would filter by category and use
  // a text search for keywords with proper ranking
  const { data, error } = await supabase
    .from('financial_advice')
    .select('*')
    .eq('category', category)
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (error) {
    console.error('Error fetching financial advice:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Log a user query to Supabase for analytics and training
 * 
 * @param userQuery - The user query object to log
 */
export async function logUserQuery(
  supabase: any,
  userQuery: Omit<UserQuery, 'id' | 'created_at'>
): Promise<void> {
  const { error } = await supabase
    .from('user_queries')
    .insert([userQuery]);
  
  if (error) {
    console.error('Error logging user query:', error);
  }
}

/**
 * Gets the latest market data for a symbol
 * 
 * @param symbol - The symbol to query
 * @returns Promise containing the latest market data
 */
export async function getLatestMarketData(
  supabase: any,
  symbol: string
): Promise<MarketData | null> {
  const { data, error } = await supabase
    .from('market_data')
    .select('*')
    .eq('symbol', symbol)
    .order('date', { ascending: false })
    .limit(1)
    .single();
  
  if (error) {
    console.error(`Error fetching market data for ${symbol}:`, error);
    return null;
  }
  
  return data;
} 