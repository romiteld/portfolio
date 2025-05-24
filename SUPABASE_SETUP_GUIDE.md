# Supabase Setup Guide

## Overview

This portfolio uses Supabase for multiple features across different demos. This guide consolidates all the required database setup.

## Required Migrations

Run these migrations in order in your Supabase SQL Editor:

### 1. Chess AI Models (`001_chess_models.sql`)
- Stores ONNX chess model references
- Manages model versions and active status
- Creates storage bucket for model files

### 2. Vector Storage (`002_vector_storage.sql`)
- Enables pgvector extension
- Creates documents and embeddings tables
- Used by Enhanced RAG demo and AI Sales Agent

### 3. Financial Assistant (`003_financial_assistant.sql`)
- Creates financial advice content table
- Market data caching table
- User query history tracking

## Quick Setup Steps

1. **Run All Migrations**
   - Go to your [Supabase Dashboard](https://app.supabase.com)
   - Navigate to SQL Editor
   - Run each migration file in order:
     - `lib/supabase-migrations/001_chess_models.sql`
     - `lib/supabase-migrations/002_vector_storage.sql`
     - `lib/supabase-migrations/003_financial_assistant.sql`

2. **Verify Setup**
   ```sql
   -- Check all tables were created
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN (
     'chess_models', 
     'documents', 
     'embeddings', 
     'financial_advice',
     'market_data',
     'user_queries'
   );
   
   -- Check pgvector extension
   SELECT * FROM pg_extension WHERE extname = 'vector';
   ```

3. **Storage Buckets**
   - The migrations create a `chess-models` bucket
   - For photos/images, create buckets manually if needed

## Features Using Supabase

### 1. **Enhanced RAG Demo**
- Uses vector storage with pgvector
- Stores documents and embeddings
- Full-text search with similarity scoring

### 2. **Chess AI Demo**
- Stores ONNX model files
- Manages model versions
- Dynamic model loading from storage

### 3. **Financial Assistant**
- Caches market data
- Stores financial advice content
- Tracks user queries for analytics

### 4. **AI Sales Agent**
- Uses same vector storage as RAG
- Stores company information
- Semantic search for company data

## Environment Variables

Ensure these are in your root `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Common Issues

### "pgvector extension not found"
- Contact Supabase support to enable pgvector
- Available on all paid plans and most free plans

### "relation does not exist"
- Ensure you ran all migrations in order
- Check you're in the correct project

### Permission errors
- Verify your service role key is correct
- Check RLS policies are properly set

## Testing

After setup, test each feature:

1. **Vector Storage**: Visit `/demos/enhanced-rag-langchain`
2. **Chess AI**: Visit `/demos/chess-ai-magnus`
3. **Financial Assistant**: Visit `/demos/financial-assistant`
4. **Sales Agent**: Visit `/demos/ai-sales-agent`

Each demo should work without errors if properly configured.