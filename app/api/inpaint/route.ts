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

    const { 
      image, 
      mask, 
      prompt = '', 
      strength = 0.8,
      guidance_scale = 7.5 
    } = await req.json();

    if (!image) {
      return NextResponse.json(
        { error: 'Original image is required' },
        { status: 400 }
      );
    }

    if (!mask) {
      return NextResponse.json(
        { error: 'Mask image is required' },
        { status: 400 }
      );
    }

    // Make request to SDXL-Turbo for inpainting
    const response = await hfRequest({
      task: 'inpaint',
      inputs: {
        image,
        mask_image: mask,
        prompt: prompt || 'high quality, detailed',
        negative_prompt: 'blurry, low quality, distorted',
        num_inference_steps: 4, // Fast for Turbo
        strength,
        guidance_scale
      }
    });

    // Handle different response formats
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('image/')) {
      // Response is an image
      const imageBuffer = await response.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');
      const imageDataUrl = `data:${contentType};base64,${base64Image}`;
      
      return NextResponse.json({
        inpainted_image: imageDataUrl,
        model: 'stabilityai/sdxl-turbo',
        prompt,
        parameters: {
          strength,
          guidance_scale,
          inference_steps: 4
        }
      });
    } else {
      // Response is JSON with image URL or base64
      const result = await response.json();
      
      let inpaintedImage = '';
      if (result.images && result.images[0]) {
        inpaintedImage = result.images[0];
      } else if (result.image) {
        inpaintedImage = result.image;
      } else if (result.generated_images && result.generated_images[0]) {
        inpaintedImage = result.generated_images[0];
      } else {
        throw new Error('No inpainted image in response');
      }

      // Ensure proper data URL format
      if (inpaintedImage && !inpaintedImage.startsWith('data:')) {
        inpaintedImage = `data:image/png;base64,${inpaintedImage}`;
      }

      return NextResponse.json({
        inpainted_image: inpaintedImage,
        model: 'stabilityai/sdxl-turbo',
        prompt,
        parameters: {
          strength,
          guidance_scale,
          inference_steps: 4
        }
      });
    }

  } catch (error) {
    console.error('Inpainting API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to inpaint image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}