import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai-service';

export async function POST(request: NextRequest) {
  try {
    const { image, labels } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Detect objects using Grounding DINO via Replicate
    const startTime = Date.now();
    const result = await aiService.detectObjects(image, labels);
    const endTime = Date.now();

    return NextResponse.json({
      success: true,
      detections: result.labels,
      processingTime: endTime - startTime,
      model: 'grounding-dino'
    });
  } catch (error) {
    console.error('Object detection error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to detect objects',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}