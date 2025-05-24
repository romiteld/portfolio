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

console.log('🚀 Supabase Vector Storage Setup\n');
console.log('Since direct SQL execution requires admin access, please follow these steps:\n');
console.log('1. Go to your Supabase Dashboard: https://app.supabase.com');
console.log('2. Select your project');
console.log('3. Navigate to SQL Editor (left sidebar)');
console.log('4. Create a new query');
console.log('5. Copy and paste the contents from:');
console.log('   lib/supabase-migrations/002_vector_storage.sql\n');
console.log('6. Click "Run" to execute the migration\n');
console.log('The migration will:');
console.log('✓ Enable pgvector extension');
console.log('✓ Create documents and embeddings tables');
console.log('✓ Set up vector similarity search functions');
console.log('✓ Configure proper indexes and RLS policies\n');
console.log('After running the migration:');
console.log('- Visit /demos/enhanced-rag-langchain');
console.log('- The demo will auto-populate with sample documents');
console.log('- You can upload and search documents immediately!\n');

// Test connection
async function testConnection() {
  const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
  
  try {
    // Try to check if tables exist
    const { data, error } = await supabase
      .from('documents')
      .select('count')
      .limit(1);
    
    if (error) {
      if (error.message.includes('relation "public.documents" does not exist')) {
        console.log('ℹ️  Tables not yet created. Please run the migration first.\n');
      } else {
        console.log('⚠️  Connection test error:', error.message);
      }
    } else {
      console.log('✅ Tables already exist! Your migration may already be complete.\n');
    }
  } catch (e) {
    console.log('Connection test failed:', e);
  }
}

testConnection();