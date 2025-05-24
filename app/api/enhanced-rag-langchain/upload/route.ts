import { NextRequest, NextResponse } from 'next/server';
import { storeDocument } from '@/lib/supabaseVectorStorage';

export async function POST(req: NextRequest) {
  try {
    const { title, content, metadata } = await req.json();
    
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Store document with embeddings in Supabase
    const documentId = await storeDocument({
      title,
      content,
      metadata: metadata || {}
    });

    return NextResponse.json({
      success: true,
      documentId,
      message: 'Document uploaded and indexed successfully'
    });
  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      message: 'Use POST to upload documents',
      example: {
        title: 'Document Title',
        content: 'Document content to be indexed...',
        metadata: { category: 'example', tags: ['tag1', 'tag2'] }
      }
    },
    { status: 200 }
  );
}