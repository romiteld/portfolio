import { NextRequest, NextResponse } from 'next/server';
import { replicateService } from '@/lib/replicate-service';
import { ImageUtils } from '@/lib/image-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      prompt, 
      model = 'flux', 
      aspectRatio = '1:1',
      negativePrompt,
      width,
      height,
      numOutputs = 1,
      seed
    } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'No prompt provided' },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    let results;

    if (model === 'flux') {
      results = await replicateService.generateImage(
        prompt,
        aspectRatio,
        numOutputs,
        seed
      );
    } else if (model === 'sdxl') {
      results = await replicateService.generateImageSDXL(
        prompt,
        negativePrompt,
        width || 1024,
        height || 1024,
        numOutputs,
        seed
      );
    } else {
      return NextResponse.json(
        { error: 'Invalid model specified' },
        { status: 400 }
      );
    }

    const processingTime = Date.now() - startTime;

    // Convert URLs to base64 for each result
    const resultsWithBase64 = await Promise.all(
      results.map(async (result) => {
        try {
          const base64 = await ImageUtils.urlToBase64(result.image);
          return {
            ...result,
            base64,
            url: result.image
          };
        } catch {
          return {
            ...result,
            base64: null,
            url: result.image
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      results: resultsWithBase64,
      count: results.length,
      processingTime,
      model,
      parameters: {
        prompt,
        aspectRatio,
        negativePrompt,
        width,
        height,
        seed
      }
    });
  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}