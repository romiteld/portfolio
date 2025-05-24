-- Combined Supabase Migration Script
-- Run this entire script in your Supabase SQL Editor

-- =========================================
-- 1. Enable pgvector extension (if not already enabled)
-- =========================================
CREATE EXTENSION IF NOT EXISTS vector;

-- =========================================
-- 2. Ensure all tables exist with proper structure
-- =========================================

-- Chess Models Table (already exists, but ensure structure)
CREATE TABLE IF NOT EXISTS chess_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    model_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure only one model is active at a time
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_one_active_model') THEN
        CREATE UNIQUE INDEX idx_one_active_model ON chess_models (is_active) WHERE is_active = true;
    END IF;
END $$;

-- Documents table (already exists, but ensure structure)
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Embeddings table with vector column
CREATE TABLE IF NOT EXISTS embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    embedding vector(1536),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'embeddings_document_id_chunk_index_key'
    ) THEN
        ALTER TABLE embeddings ADD CONSTRAINT embeddings_document_id_chunk_index_key UNIQUE(document_id, chunk_index);
    END IF;
END $$;

-- Create indexes for embeddings
CREATE INDEX IF NOT EXISTS idx_embeddings_document_id ON embeddings(document_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_embedding ON embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Financial tables (ensure they exist)
CREATE TABLE IF NOT EXISTS financial_advice (
    id SERIAL PRIMARY KEY,
    category TEXT NOT NULL CHECK (category IN ('investing', 'crypto', 'index_funds', 'risk', 'general', 'research')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    keywords TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_data (
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

CREATE TABLE IF NOT EXISTS user_queries (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    query TEXT NOT NULL,
    detected_intent TEXT NOT NULL,
    detected_symbols TEXT[] NOT NULL DEFAULT '{}',
    response_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- 3. Create or replace the search function
-- =========================================
CREATE OR REPLACE FUNCTION search_embeddings(
    query_embedding vector(1536),
    match_count INT DEFAULT 5,
    filter JSONB DEFAULT '{}'
)
RETURNS TABLE (
    id UUID,
    document_id UUID,
    chunk_text TEXT,
    similarity FLOAT,
    metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.document_id,
        e.chunk_text,
        1 - (e.embedding <=> query_embedding) AS similarity,
        e.metadata
    FROM embeddings e
    WHERE 
        CASE 
            WHEN filter = '{}'::JSONB THEN TRUE
            ELSE e.metadata @> filter
        END
    ORDER BY e.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- =========================================
-- 4. Create storage bucket for chess models
-- =========================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'chess-models',
    'chess-models',
    false,
    52428800, -- 50MB limit
    ARRAY['application/octet-stream', 'application/x-binary']
)
ON CONFLICT (id) DO NOTHING;

-- =========================================
-- 5. Enable RLS and create policies
-- =========================================

-- Enable RLS on all tables
ALTER TABLE chess_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_advice ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_queries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DO $$ 
BEGIN
    -- Chess models policies
    DROP POLICY IF EXISTS "Allow public read access to active chess models" ON chess_models;
    DROP POLICY IF EXISTS "Allow service role full access to chess models" ON chess_models;
    
    CREATE POLICY "Allow public read access to active chess models" ON chess_models
        FOR SELECT USING (is_active = true);
    CREATE POLICY "Allow service role full access to chess models" ON chess_models
        FOR ALL USING (auth.role() = 'service_role');

    -- Documents policies
    DROP POLICY IF EXISTS "Allow authenticated read access to documents" ON documents;
    DROP POLICY IF EXISTS "Allow service role full access to documents" ON documents;
    
    CREATE POLICY "Allow authenticated read access to documents" ON documents
        FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
    CREATE POLICY "Allow service role full access to documents" ON documents
        FOR ALL USING (auth.role() = 'service_role');

    -- Embeddings policies
    DROP POLICY IF EXISTS "Allow authenticated read access to embeddings" ON embeddings;
    DROP POLICY IF EXISTS "Allow service role full access to embeddings" ON embeddings;
    
    CREATE POLICY "Allow authenticated read access to embeddings" ON embeddings
        FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
    CREATE POLICY "Allow service role full access to embeddings" ON embeddings
        FOR ALL USING (auth.role() = 'service_role');

    -- Financial advice policies
    DROP POLICY IF EXISTS "Allow public read access to financial advice" ON financial_advice;
    DROP POLICY IF EXISTS "Allow service role full access to financial advice" ON financial_advice;
    
    CREATE POLICY "Allow public read access to financial advice" ON financial_advice
        FOR SELECT USING (true);
    CREATE POLICY "Allow service role full access to financial advice" ON financial_advice
        FOR ALL USING (auth.role() = 'service_role');

    -- Market data policies
    DROP POLICY IF EXISTS "Allow public read access to market data" ON market_data;
    DROP POLICY IF EXISTS "Allow service role full access to market data" ON market_data;
    
    CREATE POLICY "Allow public read access to market data" ON market_data
        FOR SELECT USING (true);
    CREATE POLICY "Allow service role full access to market data" ON market_data
        FOR ALL USING (auth.role() = 'service_role');

    -- User queries policies
    DROP POLICY IF EXISTS "Allow service role full access to user queries" ON user_queries;
    
    CREATE POLICY "Allow service role full access to user queries" ON user_queries
        FOR ALL USING (auth.role() = 'service_role');
END $$;

-- =========================================
-- 6. Insert default financial advice if not exists
-- =========================================
INSERT INTO financial_advice (category, title, content, keywords) 
SELECT * FROM (VALUES
    ('research', 'Online Investment Research Resources', 
     'Reliable resources for investment research include: Financial News (Yahoo Finance, Bloomberg, CNBC, Financial Times), Market Data (TradingView, MarketWatch, Investing.com), Company Research (SEC EDGAR database, company investor relations pages), Analysis Tools (Stock screeners on Finviz or Yahoo Finance), Investment Education (Investopedia, Khan Academy Finance, broker educational resources). Always verify information from multiple sources.',
     ARRAY['research', 'resources', 'tools', 'websites', 'online', 'find', 'look']),
    
    ('index_funds', 'Index Fund Investment Guide',
     'Index funds and ETFs are passive investment vehicles that track market indices. Key considerations: Diversification (instant diversification across many securities), Expense Ratios (typically 0.03%-0.25%), Tax Efficiency (generally more tax-efficient than actively managed funds), Long-term Perspective (best for buy-and-hold strategies), Market Coverage (different indices cover different segments).',
     ARRAY['index', 'fund', 'etf', 'passive', 'investing']),
    
    ('crypto', 'Cryptocurrency Investment Basics',
     'Cryptocurrencies are highly volatile digital assets. Key points: Extreme Volatility (dramatic price swings), Diversification (consider as small part of portfolio), Security (hardware wallets, reputable exchanges), Research (understand technology and use cases), Regulatory Changes (can impact markets significantly). Only invest what you can afford to lose.',
     ARRAY['crypto', 'bitcoin', 'ethereum', 'cryptocurrency', 'digital', 'asset']),
    
    ('risk', 'Understanding Investment Risk',
     'Managing risk is fundamental to investing. Key aspects: Risk vs. Return (higher returns = higher risks), Diversification (spread across asset classes), Time Horizon (longer periods help weather volatility), Asset Allocation (should reflect risk tolerance), Dollar-Cost Averaging (reduces timing risk). Include emergency funds and insurance in comprehensive planning.',
     ARRAY['risk', 'safe', 'volatile', 'secure', 'protect', 'manage'])
) AS t(category, title, content, keywords)
WHERE NOT EXISTS (
    SELECT 1 FROM financial_advice WHERE title = t.title
);

-- =========================================
-- 7. Final verification
-- =========================================
SELECT 'Migration completed! Checking setup...' as status;

-- Show extension status
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') 
        THEN '✅ pgvector extension enabled' 
        ELSE '❌ pgvector extension NOT enabled' 
    END as pgvector_status;

-- Show table counts
SELECT 
    'Tables created:' as status,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('chess_models', 'documents', 'embeddings', 'financial_advice', 'market_data', 'user_queries')) as table_count;

SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.tables t WHERE t.table_name = tables.table_name) as exists
FROM (VALUES 
    ('chess_models'),
    ('documents'),
    ('embeddings'),
    ('financial_advice'),
    ('market_data'),
    ('user_queries')
) AS tables(table_name);