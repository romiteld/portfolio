import { NextRequest, NextResponse } from 'next/server';
import { hfRequest, validateHFConfig } from '@/lib/hf';

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

    const { image, prompt, confidence = 0.3 } = await req.json();

    if (!image) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    if (!prompt) {
      return NextResponse.json(
        { error: 'Detection prompt is required' },
        { status: 400 }
      );
    }

    // Make request to Grounding DINO
    const response = await hfRequest({
      task: 'detect',
      inputs: {
        image,
        text: prompt
      },
      options: { confidence }
    });

    const result = await response.json();

    // Process detection results
    let detections = [];
    
    if (Array.isArray(result)) {
      detections = result.map((detection, index) => ({
        id: index,
        label: detection.label || prompt,
        confidence: detection.score || detection.confidence || 0,
        bbox: {
          x: detection.box?.xmin || detection.bbox?.[0] || 0,
          y: detection.box?.ymin || detection.bbox?.[1] || 0,
          width: (detection.box?.xmax - detection.box?.xmin) || 
                 (detection.bbox?.[2] - detection.bbox?.[0]) || 0,
          height: (detection.box?.ymax - detection.box?.ymin) || 
                  (detection.bbox?.[3] - detection.bbox?.[1]) || 0
        }
      })).filter(det => det.confidence >= confidence);
    } else if (result.predictions) {
      detections = result.predictions.map((detection: any, index: number) => ({
        id: index,
        label: detection.label || prompt,
        confidence: detection.confidence || detection.score || 0,
        bbox: {
          x: detection.x || detection.bbox?.[0] || 0,
          y: detection.y || detection.bbox?.[1] || 0,
          width: detection.width || detection.bbox?.[2] || 0,
          height: detection.height || detection.bbox?.[3] || 0
        }
      })).filter((det: any) => det.confidence >= confidence);
    }

    return NextResponse.json({
      detections,
      prompt,
      confidence,
      model: 'IDEA-Research/grounding-dino-1.5',
      count: detections.length
    });

  } catch (error) {
    console.error('Detection API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to detect objects',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}