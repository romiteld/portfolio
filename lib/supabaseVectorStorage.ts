import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface Document {
  id?: string;
  title: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface DocumentChunk {
  id?: string;
  document_id: string;
  chunk_index: number;
  chunk_text: string;
  embedding?: number[];
  metadata?: Record<string, any>;
}

export interface SearchResult {
  id: string;
  document_id: string;
  chunk_text: string;
  similarity: number;
  metadata: Record<string, any>;
}

/**
 * Split text into chunks for embedding
 */
export function splitTextIntoChunks(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = start + chunkSize;
    const chunk = text.slice(start, end);
    chunks.push(chunk);
    start = end - overlap;
  }

  return chunks;
}

/**
 * Generate embedding for a given text using OpenAI
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Store a document and its embeddings in Supabase
 */
export async function storeDocument(document: Document): Promise<string> {
  try {
    // Insert the document
    const { data: docData, error: docError } = await supabase
      .from('documents')
      .insert({
        title: document.title,
        content: document.content,
        metadata: document.metadata || {},
      })
      .select()
      .single();

    if (docError) throw docError;

    const documentId = docData.id;

    // Split content into chunks
    const chunks = splitTextIntoChunks(document.content);

    // Generate embeddings for each chunk
    const chunkPromises = chunks.map(async (chunkText, index) => {
      const embedding = await generateEmbedding(chunkText);
      
      return {
        document_id: documentId,
        chunk_index: index,
        chunk_text: chunkText,
        embedding: `[${embedding.join(',')}]`, // Format as PostgreSQL array
        metadata: {
          title: document.title,
          chunk_index: index,
          total_chunks: chunks.length,
        },
      };
    });

    const chunksWithEmbeddings = await Promise.all(chunkPromises);

    // Insert chunks with embeddings
    const { error: embError } = await supabase
      .from('embeddings')
      .insert(chunksWithEmbeddings);

    if (embError) throw embError;

    return documentId;
  } catch (error) {
    console.error('Error storing document:', error);
    throw error;
  }
}

/**
 * Search for similar documents based on a query
 */
export async function searchDocuments(
  query: string,
  matchCount: number = 5,
  filter?: Record<string, any>
): Promise<SearchResult[]> {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // Call the search function
    const { data, error } = await supabase.rpc('search_embeddings', {
      query_embedding: `[${queryEmbedding.join(',')}]`,
      match_count: matchCount,
      filter: filter || {},
    });

    if (error) throw error;

    return data as SearchResult[];
  } catch (error) {
    console.error('Error searching documents:', error);
    throw error;
  }
}

/**
 * Delete a document and its embeddings
 */
export async function deleteDocument(documentId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
}

/**
 * Get all documents
 */
export async function getAllDocuments(): Promise<Document[]> {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw error;
  }
}

/**
 * Get a specific document by ID
 */
export async function getDocument(documentId: string): Promise<Document | null> {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error fetching document:', error);
    throw error;
  }
}

/**
 * Update a document and regenerate its embeddings
 */
export async function updateDocument(documentId: string, updates: Partial<Document>): Promise<void> {
  try {
    // Update the document
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    if (updateError) throw updateError;

    // If content was updated, regenerate embeddings
    if (updates.content) {
      // Delete old embeddings
      const { error: deleteError } = await supabase
        .from('embeddings')
        .delete()
        .eq('document_id', documentId);

      if (deleteError) throw deleteError;

      // Get the updated document
      const document = await getDocument(documentId);
      if (!document) throw new Error('Document not found');

      // Split content into chunks and regenerate embeddings
      const chunks = splitTextIntoChunks(updates.content);
      const chunkPromises = chunks.map(async (chunkText, index) => {
        const embedding = await generateEmbedding(chunkText);
        
        return {
          document_id: documentId,
          chunk_index: index,
          chunk_text: chunkText,
          embedding: `[${embedding.join(',')}]`,
          metadata: {
            title: document.title,
            chunk_index: index,
            total_chunks: chunks.length,
          },
        };
      });

      const chunksWithEmbeddings = await Promise.all(chunkPromises);

      // Insert new chunks with embeddings
      const { error: embError } = await supabase
        .from('embeddings')
        .insert(chunksWithEmbeddings);

      if (embError) throw embError;
    }
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
}