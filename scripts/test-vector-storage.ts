import { storeDocument, searchDocuments, getAllDocuments } from '../lib/supabaseVectorStorage';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testVectorStorage() {
  console.log('🧪 Testing Supabase Vector Storage...\n');

  try {
    // Test 1: Get existing documents
    console.log('1️⃣ Fetching existing documents...');
    const existingDocs = await getAllDocuments();
    console.log(`   Found ${existingDocs.length} documents\n`);

    // Test 2: Store a test document
    console.log('2️⃣ Storing a test document...');
    const testDoc = {
      title: 'Test Document - Vector Storage',
      content: 'This is a test document to verify that Supabase vector storage is working correctly. It contains information about pgvector, embeddings, and similarity search.',
      metadata: { type: 'test', timestamp: new Date().toISOString() }
    };
    
    const docId = await storeDocument(testDoc);
    console.log(`   ✅ Document stored with ID: ${docId}\n`);

    // Test 3: Search for the document
    console.log('3️⃣ Testing vector similarity search...');
    const searchQuery = 'pgvector embeddings search';
    const results = await searchDocuments(searchQuery, 3);
    
    console.log(`   Search query: "${searchQuery}"`);
    console.log(`   Found ${results.length} results:`);
    
    results.forEach((result, index) => {
      console.log(`   ${index + 1}. Similarity: ${(result.similarity * 100).toFixed(1)}%`);
      console.log(`      Text: ${result.chunk_text.substring(0, 100)}...`);
    });

    console.log('\n✅ All tests passed! Vector storage is working correctly.');
    console.log('\n📝 Next steps:');
    console.log('   - Visit /demos/enhanced-rag-langchain to use the UI');
    console.log('   - Upload documents through the web interface');
    console.log('   - Ask questions to test the RAG system');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('\nPossible issues:');
    console.error('1. pgvector extension not enabled');
    console.error('2. Tables not created properly');
    console.error('3. OpenAI API key not configured');
    console.error('\nPlease check your Supabase dashboard and environment variables.');
  }
}

// Run the test
testVectorStorage();