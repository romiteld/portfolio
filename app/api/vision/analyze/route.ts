import { NextRequest, NextResponse } from 'next/server';
import { aiService, AIProvider } from '@/lib/ai-service';

export async function POST(request: NextRequest) {
  try {
    const { image, provider = 'openai', prompt } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Validate provider
    const validProviders: AIProvider[] = ['openai', 'google', 'anthropic'];
    const selectedProvider = validProviders.includes(provider) ? provider : 'openai';

    // Analyze image with selected provider
    const startTime = Date.now();
    const result = await aiService.analyzeImage(image, selectedProvider, prompt);
    const endTime = Date.now();

    return NextResponse.json({
      success: true,
      analysis: result.text,
      provider: result.provider,
      model: result.model,
      processingTime: endTime - startTime,
      usage: result.usage,
    });
  } catch (error) {
    console.error('Vision analysis error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export const runtime = 'edge';