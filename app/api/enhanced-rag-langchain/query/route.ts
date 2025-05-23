import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { RetrievalQAChain } from 'langchain/chains';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { Document } from 'langchain/document';

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();
    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'Invalid question' }, { status: 400 });
    }

    // Sample knowledge base
    const docs = [
      new Document({ pageContent: 'LangChain is a framework for building applications with language models.' }),
      new Document({ pageContent: 'Retrieval-augmented generation (RAG) combines information retrieval with text generation.' }),
      new Document({ pageContent: 'This demo uses an in-memory vector store with OpenAI embeddings.' })
    ];

    const embeddings = new OpenAIEmbeddings({ apiKey: process.env.OPENAI_API_KEY || '' });
    const vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);
    const retriever = vectorStore.asRetriever();

    const model = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY || '',
      temperature: 0,
      modelName: 'gpt-3.5-turbo'
    });

    const chain = RetrievalQAChain.fromLLM(model, retriever);
    const response = await chain.call({ query: question });

    return NextResponse.json({ answer: response.text });
  } catch (err) {
    console.error('RAG demo error:', err);
    return NextResponse.json({ error: 'Failed to generate answer' }, { status: 500 });
  }
}
