# Supabase Vector Storage Migration Guide

## Quick Setup (3 Steps)

### Step 1: Run the Migration in Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **New query**
5. Copy ALL contents from: `lib/supabase-migrations/002_vector_storage.sql`
6. Paste into the SQL editor
7. Click **Run** button

You should see "Success. No rows returned" - this is normal!

### Step 2: Verify the Setup

In the SQL Editor, run this query to verify:

```sql
-- Check if pgvector is enabled
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check if tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('documents', 'embeddings');
```

You should see:
- 1 row for the vector extension
- 2 rows for the tables (documents, embeddings)

### Step 3: Test the Demo

1. Start your development server: `npm run dev`
2. Visit: http://localhost:3000/demos/enhanced-rag-langchain
3. The demo will automatically create sample documents on first load
4. Try asking questions like:
   - "What is LangChain?"
   - "How does RAG work?"
   - "Tell me about vector embeddings"

## Features Now Available

- ✅ Document upload with automatic chunking
- ✅ Vector similarity search using pgvector
- ✅ OpenAI embeddings (text-embedding-ada-002)
- ✅ Document management (view, search, delete)
- ✅ No more Pinecone dependency
- ✅ All data stored in your Supabase instance

## Troubleshooting

### "relation does not exist" error
- Make sure you ran the migration SQL completely
- Check that you're in the correct Supabase project

### "pgvector extension not found"
- Contact Supabase support to enable pgvector for your project
- It's available on all paid plans and most free plans

### OpenAI API errors
- Verify your `OPENAI_API_KEY` in `.env.local`
- Make sure you have credits in your OpenAI account

## What Changed?

- **Before**: Pinecone for vectors, Supabase for data
- **After**: Supabase for both vectors AND data
- **Cost**: Reduced (one service instead of two)
- **Performance**: Similar or better (data locality)
- **Complexity**: Simplified architecture