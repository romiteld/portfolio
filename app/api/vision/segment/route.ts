import { NextRequest, NextResponse } from 'next/server';
import { replicateService } from '@/lib/replicate-service';
import { ImageUtils } from '@/lib/image-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, points, boxes } = body;

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Clean base64 if needed
    const imageBase64 = image.startsWith('data:') ? image.split(',')[1] : image;

    // Get image dimensions
    const dimensions = await ImageUtils.getImageDimensions(imageBase64);

    // Segment image using SAM 2
    const startTime = Date.now();
    const segments = await replicateService.segmentImage(imageBase64, points, boxes);
    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      segments,
      count: segments.length,
      processingTime,
      model: 'sam-2',
      imageInfo: {
        width: dimensions.width,
        height: dimensions.height
      }
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