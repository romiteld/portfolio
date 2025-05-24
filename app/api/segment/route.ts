import { NextRequest, NextResponse } from 'next/server';
import { hfRequest, validateHFConfig, SEGMENT_MODELS } from '@/lib/hf';

export const runtime = 'edge';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    // Validate HF configuration
    const config = validateHFConfig();
    if (!config.valid) {
      return NextResponse.json(
        { error: `Missing environment variables: ${config.missing.join(', ')}` },
        { status: 500 }
      );
    }

    const { 
      image, 
      mode = 'default',
      points = [],
      boxes = [],
      threshold = 0.5 
    } = await req.json();

    if (!image) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    // Validate mode
    if (!Object.keys(SEGMENT_MODELS).includes(mode)) {
      return NextResponse.json(
        { error: `Invalid mode. Must be one of: ${Object.keys(SEGMENT_MODELS).join(', ')}` },
        { status: 400 }
      );
    }

    // Prepare inputs based on segmentation mode
    let inputs: any = { image };
    
    if (mode === 'fast') {
      // FastSAM - segment everything or with prompts
      if (points.length > 0 || boxes.length > 0) {
        inputs.prompt = { points, boxes };
      }
    } else {
      // SAM 2.1 or HQ-SAM - need points or boxes for interaction
      if (points.length > 0) {
        inputs.input_points = points;
      }
      if (boxes.length > 0) {
        inputs.input_boxes = boxes;
      }
      
      // If no prompts provided, try automatic segmentation
      if (points.length === 0 && boxes.length === 0) {
        inputs.task = 'automatic';
      }
    }

    // Make request to segmentation model
    const response = await hfRequest({
      task: 'segment',
      inputs,
      options: { 
        segmentMode: mode as any,
        threshold 
      }
    });

    const result = await response.json();

    // Process segmentation results
    let masks = [];
    let segments = [];

    if (result.masks) {
      masks = result.masks;
      segments = result.masks.map((mask: any, index: number) => ({
        id: index,
        mask: mask.mask || mask,
        score: mask.score || mask.confidence || 1.0,
        bbox: mask.bbox || null,
        area: mask.area || null
      }));
    } else if (Array.isArray(result)) {
      segments = result.map((segment: any, index: number) => ({
        id: index,
        mask: segment.mask || segment,
        score: segment.score || segment.confidence || 1.0,
        bbox: segment.bbox || null,
        area: segment.area || null
      }));
    } else if (result.segmentation || result.mask) {
      segments = [{
        id: 0,
        mask: result.segmentation || result.mask,
        score: result.score || 1.0,
        bbox: result.bbox || null,
        area: result.area || null
      }];
    }

    return NextResponse.json({
      segments,
      mode,
      model: SEGMENT_MODELS[mode as keyof typeof SEGMENT_MODELS],
      count: segments.length,
      threshold,
      inputs: {
        pointsCount: points.length,
        boxesCount: boxes.length
      }
    });

  } catch (error) {
    console.error('Segmentation API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to segment image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}