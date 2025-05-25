import { NextRequest, NextResponse } from 'next/server';
import { aiProviders } from '@/lib/ai-providers';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { image, provider, message, history } = await request.json();

    if (!image || !provider || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Construct context from history
    const context = history
      .map((msg: any) => `${msg.role}: ${msg.content}`)
      .join('\n');

    const prompt = `Previous conversation about this image:
${context}

User's new question: ${message}

Please provide a detailed and helpful response based on the image and conversation history.`;

    const result = await aiProviders.analyzeImage(image, provider, prompt);

    return NextResponse.json({
      response: result.text,
      cost: 0.001, // Estimate
      processingTime: result.processingTime
    });

  } catch (error) {
    console.error('Vision chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}