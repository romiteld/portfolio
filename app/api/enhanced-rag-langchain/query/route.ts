import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { RetrievalQAChain } from 'langchain/chains';
import { searchDocuments, getAllDocuments } from '@/lib/supabaseVectorStorage';

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();
    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'Invalid question' }, { status: 400 });
    }

    // Search for relevant documents using Supabase vector search
    const searchResults = await searchDocuments(question, 5);
    
    if (searchResults.length === 0) {
      return NextResponse.json({
        answer: "I couldn't find any relevant information to answer your question. Please make sure documents have been uploaded to the knowledge base.",
        sources: [],
      });
    }

    // Prepare context from search results
    const context = searchResults
      .map((result) => result.chunk_text)
      .join('\n\n');

    // Initialize OpenAI model
    const model = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY || '',
      temperature: 0,
      modelName: 'gpt-3.5-turbo'
    });

    // Generate answer based on context
    const prompt = `Based on the following context, please answer the question. If the answer cannot be found in the context, say so.

Context:
${context}

Question: ${question}

Answer:`;

    const response = await model.call([
      {
        _getType() { return 'human' as const; },
        content: prompt
      }
    ]);

    return NextResponse.json({
      answer: response.content,
      sources: searchResults.map((result) => ({
        content: result.chunk_text,
        score: result.similarity,
        metadata: result.metadata
      })),
    });
  } catch (err) {
    console.error('RAG demo error:', err);
    return NextResponse.json({ error: 'Failed to generate answer' }, { status: 500 });
  }
}
