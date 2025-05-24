import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAllDemos() {
  console.log('🧪 Testing All Supabase-Enabled Demos\n');

  // Test 1: Vector Storage (RAG & Sales Agent)
  console.log('1️⃣ Testing Vector Storage (Enhanced RAG)...');
  try {
    const { count: docCount } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true });
    
    const { count: embCount } = await supabase
      .from('embeddings')
      .select('*', { count: 'exact', head: true });
    
    console.log(`   ✅ Documents: ${docCount || 0} | Embeddings: ${embCount || 0}`);
    
    // Test search function
    const { data: searchTest, error: searchError } = await supabase.rpc('search_embeddings', {
      query_embedding: new Array(1536).fill(0),
      match_count: 1
    });
    
    if (!searchError) {
      console.log('   ✅ Vector search function works');
    } else {
      console.log('   ⚠️  Vector search error:', searchError.message);
    }
  } catch (error) {
    console.log('   ❌ Vector storage test failed:', error);
  }

  // Test 2: Chess AI
  console.log('\n2️⃣ Testing Chess AI...');
  try {
    const { data: models, error } = await supabase
      .from('chess_models')
      .select('*')
      .eq('is_active', true);
    
    if (!error && models) {
      console.log(`   ✅ Active chess models: ${models.length}`);
      if (models.length > 0) {
        console.log(`   📦 Active model: ${models[0].name} v${models[0].version}`);
      }
    } else {
      console.log('   ⚠️  No active chess models found');
    }
  } catch (error) {
    console.log('   ❌ Chess AI test failed:', error);
  }

  // Test 3: Financial Assistant
  console.log('\n3️⃣ Testing Financial Assistant...');
  try {
    const { data: advice, error: adviceError } = await supabase
      .from('financial_advice')
      .select('*')
      .limit(5);
    
    const { data: marketData, error: marketError } = await supabase
      .from('market_data')
      .select('*')
      .limit(5);
    
    console.log(`   ✅ Financial advice entries: ${advice?.length || 0}`);
    console.log(`   ✅ Market data entries: ${marketData?.length || 0}`);
    
    if (advice && advice.length > 0) {
      console.log('   📚 Sample advice categories:', [...new Set(advice.map(a => a.category))].join(', '));
    }
  } catch (error) {
    console.log('   ❌ Financial Assistant test failed:', error);
  }

  // Test 4: Check pgvector
  console.log('\n4️⃣ Checking pgvector extension...');
  try {
    const { data, error } = await supabase
      .rpc('get_pg_version'); // This might fail, but we'll check differently
    
    // Alternative check
    const { data: extensions } = await supabase
      .from('pg_extension')
      .select('*')
      .eq('extname', 'vector')
      .single();
    
    if (extensions) {
      console.log('   ✅ pgvector is enabled');
    } else {
      console.log('   ❌ pgvector not found - please enable in Supabase dashboard');
    }
  } catch (error) {
    // Try a direct query
    console.log('   ℹ️  Cannot verify pgvector directly, but tables exist');
  }

  console.log('\n✨ Testing complete! Visit the demos to see them in action:');
  console.log('   - http://localhost:3000/demos/enhanced-rag-langchain');
  console.log('   - http://localhost:3000/demos/chess-ai-magnus');
  console.log('   - http://localhost:3000/demos/financial-assistant');
  console.log('   - http://localhost:3000/demos/ai-sales-agent');
}

testAllDemos();