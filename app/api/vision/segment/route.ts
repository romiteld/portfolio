import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai-service';

export async function POST(request: NextRequest) {
  try {
    const { image, points, labels } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Segment image using SAM 2 via Replicate
    const startTime = Date.now();
    const result = await aiService.segmentImage(image, points, labels);
    const endTime = Date.now();

    return NextResponse.json({
      success: true,
      masks: result.masks,
      scores: result.scores,
      processingTime: endTime - startTime,
      model: 'sam-2'
    });
  } catch (error) {
    console.error('Segmentation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to segment image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}