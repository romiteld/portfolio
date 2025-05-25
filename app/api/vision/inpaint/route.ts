import { NextRequest, NextResponse } from 'next/server';
import { replicateService } from '@/lib/replicate-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      image, 
      mask, 
      prompt, 
      negativePrompt,
      seed
    } = body;

    if (!image || !mask || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: image, mask, and prompt' },
        { status: 400 }
      );
    }

    // Clean base64 if needed
    const imageBase64 = image.startsWith('data:') ? image.split(',')[1] : image;
    const maskBase64 = mask.startsWith('data:') ? mask.split(',')[1] : mask;

    const startTime = Date.now();
    const result = await replicateService.inpaintImage(
      imageBase64,
      maskBase64,
      prompt,
      negativePrompt,
      seed
    );
    const processingTime = Date.now() - startTime;

    // Convert result URL to base64
    let resultBase64 = null;
    try {
      const { ImageUtils } = await import('@/lib/image-utils');
      resultBase64 = await ImageUtils.urlToBase64(result.image);
    } catch (error) {
      console.error('Failed to convert result to base64:', error);
    }

    return NextResponse.json({
      success: true,
      result: {
        ...result,
        base64: resultBase64,
        url: result.image
      },
      processingTime,
      model: 'stable-diffusion-inpainting',
      parameters: {
        prompt,
        negativePrompt,
        seed
      }
    });
  } catch (error) {
    console.error('Inpainting error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to inpaint image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}