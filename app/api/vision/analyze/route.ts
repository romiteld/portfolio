import { NextRequest, NextResponse } from 'next/server';
import { aiProviders, VisionProvider } from '@/lib/ai-providers';
import { ImageUtils } from '@/lib/image-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, provider = 'openai', prompt, systemPrompt, compareAll = false } = body;

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Clean base64 if needed
    const imageBase64 = image.startsWith('data:') ? image.split(',')[1] : image;

    // Get image info
    const imageSize = ImageUtils.calculateBase64Size(imageBase64);
    const dimensions = await ImageUtils.getImageDimensions(imageBase64);

    // If compareAll is true, analyze with all providers
    if (compareAll) {
      const results = await aiProviders.compareProviders(imageBase64, prompt);
      return NextResponse.json({
        success: true,
        comparison: results,
        imageInfo: {
          size: imageSize,
          sizeFormatted: ImageUtils.formatFileSize(imageSize),
          dimensions
        }
      });
    }

    // Single provider analysis
    const validProviders: VisionProvider[] = ['openai', 'google', 'anthropic'];
    const selectedProvider = validProviders.includes(provider) ? provider : 'openai';

    const result = await aiProviders.analyzeImage(
      imageBase64,
      selectedProvider,
      prompt,
      systemPrompt
    );

    // Calculate estimated cost
    const estimatedCost = aiProviders.estimateCost(selectedProvider, imageSize);

    return NextResponse.json({
      success: true,
      analysis: result.text,
      provider: result.provider,
      model: result.model,
      processingTime: result.processingTime,
      usage: result.usage,
      estimatedCost,
      imageInfo: {
        size: imageSize,
        sizeFormatted: ImageUtils.formatFileSize(imageSize),
        dimensions
      }
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