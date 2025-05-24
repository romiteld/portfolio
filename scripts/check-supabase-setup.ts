import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSupabaseSetup() {
  console.log('🔍 Checking Supabase Setup...\n');

  const checks: Record<string, boolean> = {
    pgvector: false,
    chess_models: false,
    documents: false,
    embeddings: false,
    financial_advice: false,
    market_data: false,
    user_queries: false,
  };

  try {
    // Check pgvector extension
    const { data: pgvectorData, error: pgvectorError } = await supabase
      .from('pg_extension')
      .select('*')
      .eq('extname', 'vector')
      .single();

    if (!pgvectorError && pgvectorData) {
      checks.pgvector = true;
      console.log('✅ pgvector extension is enabled');
    } else {
      console.log('❌ pgvector extension NOT found - Run migration 002');
    }

    // Check each table
    const tables = [
      'chess_models',
      'documents', 
      'embeddings',
      'financial_advice',
      'market_data',
      'user_queries'
    ];

    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (!error) {
        checks[table] = true;
        console.log(`✅ Table '${table}' exists (${count || 0} rows)`);
      } else {
        console.log(`❌ Table '${table}' NOT found - ${error.message}`);
      }
    }

    // Summary
    console.log('\n📊 Summary:');
    const allChecked = Object.values(checks).every(v => v);
    
    if (allChecked) {
      console.log('🎉 All Supabase tables and extensions are properly set up!');
      console.log('\nYou can now test the demos:');
      console.log('1. Enhanced RAG: http://localhost:3000/demos/enhanced-rag-langchain');
      console.log('2. Chess AI: http://localhost:3000/demos/chess-ai-magnus');
      console.log('3. Financial Assistant: http://localhost:3000/demos/financial-assistant');
      console.log('4. AI Sales Agent: http://localhost:3000/demos/ai-sales-agent');
    } else {
      console.log('\n⚠️  Some components are missing. Please run the migrations:');
      if (!checks.chess_models) console.log('- Run 001_chess_models.sql');
      if (!checks.pgvector || !checks.documents || !checks.embeddings) console.log('- Run 002_vector_storage.sql');
      if (!checks.financial_advice || !checks.market_data || !checks.user_queries) console.log('- Run 003_financial_assistant.sql');
    }

  } catch (error) {
    console.error('Error checking setup:', error);
  }
}

checkSupabaseSetup();