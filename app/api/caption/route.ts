import { NextRequest, NextResponse } from 'next/server';
import { StreamingTextResponse } from 'ai';
import { hfRequest, streamHFResponse, validateHFConfig } from '@/lib/hf';

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

    const { image, stream = false } = await req.json();

    if (!image) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    // Make request to Hugging Face
    const response = await hfRequest({
      task: 'caption',
      inputs: { image },
      options: { stream }
    });

    if (stream) {
      // Return streaming response for real-time captioning
      const textStream = streamHFResponse(response);
      
      return new StreamingTextResponse(
        (async function* () {
          for await (const chunk of textStream) {
            yield chunk;
          }
        })()
      );
    } else {
      // Return complete caption
      const result = await response.json();
      
      // BLIP-2 returns array of generated text
      const caption = Array.isArray(result) 
        ? result[0]?.generated_text || result[0]
        : result.generated_text || result;

      return NextResponse.json({
        caption: typeof caption === 'string' ? caption : 'No caption generated',
        model: 'Salesforce/blip2-flan-t5-xl'
      });
    }

  } catch (error) {
    console.error('Caption API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate caption',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}