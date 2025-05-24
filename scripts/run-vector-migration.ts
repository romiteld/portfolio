import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Please ensure you have:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL=your_url');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=your_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Starting Supabase vector storage migration...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../lib/supabase-migrations/002_vector_storage.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Split the SQL into individual statements (by semicolon)
    const statements = migrationSQL
      .split(';')
      .filter(stmt => stmt.trim().length > 0)
      .map(stmt => stmt.trim() + ';');

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement.substring(0, 50).replace(/\n/g, ' ');
      
      console.log(`Executing statement ${i + 1}/${statements.length}: ${preview}...`);
      
      const { error } = await supabase.rpc('exec_sql', {
        sql: statement
      }).single();

      if (error) {
        // Try direct execution as fallback
        const { error: directError } = await supabase
          .from('_migrations')
          .select('*')
          .limit(1)
          .then(() => supabase.rpc('query', { query: statement }));

        if (directError) {
          console.error(`❌ Error executing statement ${i + 1}:`, error.message);
          console.error('Statement:', preview);
          
          // If it's just a "already exists" error, we can continue
          if (error.message.includes('already exists')) {
            console.log('⚠️  Continuing (already exists)...\n');
            continue;
          }
          
          throw error;
        }
      }
      
      console.log(`✅ Statement ${i + 1} executed successfully\n`);
    }

    console.log('🎉 Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Visit your Enhanced RAG demo at /demos/enhanced-rag-langchain');
    console.log('2. The demo will automatically populate with sample documents');
    console.log('3. You can now upload and search documents using Supabase vectors!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('\nAlternative approach:');
    console.error('1. Go to your Supabase dashboard');
    console.error('2. Navigate to SQL Editor');
    console.error('3. Copy and paste the contents of lib/supabase-migrations/002_vector_storage.sql');
    console.error('4. Run the SQL manually');
  }
}

// Run the migration
runMigration();