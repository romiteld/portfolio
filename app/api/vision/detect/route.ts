import { NextRequest, NextResponse } from 'next/server';
import { replicateService } from '@/lib/replicate-service';
import { ImageUtils } from '@/lib/image-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, prompt = "all objects" } = body;

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Clean base64 if needed
    const imageBase64 = image.startsWith('data:') ? image.split(',')[1] : image;

    // Get image dimensions for coordinate mapping
    const dimensions = await ImageUtils.getImageDimensions(imageBase64);

    // Detect objects using Grounding DINO
    const startTime = Date.now();
    const detections = await replicateService.detectObjects(imageBase64, prompt);
    const processingTime = Date.now() - startTime;

    // Format results with normalized coordinates
    const formattedDetections = detections.map(det => ({
      ...det,
      boxNormalized: [
        det.box[0] / dimensions.width,
        det.box[1] / dimensions.height,
        det.box[2] / dimensions.width,
        det.box[3] / dimensions.height
      ]
    }));

    return NextResponse.json({
      success: true,
      detections: formattedDetections,
      count: detections.length,
      processingTime,
      model: 'grounding-dino',
      imageInfo: {
        width: dimensions.width,
        height: dimensions.height
      }
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