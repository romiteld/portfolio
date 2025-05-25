import Replicate from 'replicate';

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

export interface DetectionResult {
  label: string;
  confidence: number;
  box: [number, number, number, number]; // [x1, y1, x2, y2]
}

export interface SegmentationResult {
  mask: string; // Base64 encoded mask
  score: number;
  label?: string;
}

export interface GenerationResult {
  image: string; // URL or base64
  seed?: number;
}

export class ReplicateService {
  // Grounding DINO for object detection
  async detectObjects(
    imageBase64: string,
    prompt: string = "all objects"
  ): Promise<DetectionResult[]> {
    try {
      const output = await replicate.run(
        "adirik/grounding-dino:a2452488fba34818f45b29f4b3a1e7b3e6b1b8ad1046c0c79e08e8a8a611ba5a",
        {
          input: {
            image: `data:image/jpeg;base64,${imageBase64}`,
            prompt,
            box_threshold: 0.3,
            text_threshold: 0.25,
          }
        }
      ) as any;

      if (!output || !output.detections) {
        return [];
      }

      return output.detections.map((det: any) => ({
        label: det.label || det.class || 'object',
        confidence: det.confidence || det.score || 0,
        box: det.bbox || det.box || [0, 0, 0, 0]
      }));
    } catch (error) {
      console.error('Object detection error:', error);
      throw new Error('Failed to detect objects');
    }
  }

  // SAM 2 for image segmentation
  async segmentImage(
    imageBase64: string,
    points?: { x: number; y: number; label: number }[],
    boxes?: number[][]
  ): Promise<SegmentationResult[]> {
    try {
      const input: any = {
        image: `data:image/jpeg;base64,${imageBase64}`,
        mask_threshold: 0.0,
        pred_iou_thresh: 0.88,
        stability_score_thresh: 0.95,
      };

      // Add points if provided
      if (points && points.length > 0) {
        input.input_points = points.map(p => [p.x, p.y]);
        input.input_labels = points.map(p => p.label);
      }

      // Add boxes if provided
      if (boxes && boxes.length > 0) {
        input.input_boxes = boxes;
      }

      const output = await replicate.run(
        "meta/sam-2-base:c88537b89c75d17073e6ce5b04f57454de882ab0e2e4ce00d3615ca9b9515d1f",
        { input }
      ) as any;

      if (!output) {
        return [];
      }

      // Handle different output formats
      if (Array.isArray(output)) {
        return output.map((mask: any, idx: number) => ({
          mask: typeof mask === 'string' ? mask : '',
          score: 1.0,
          label: `segment_${idx}`
        }));
      } else if (output.masks) {
        return output.masks.map((mask: any, idx: number) => ({
          mask: mask,
          score: output.scores?.[idx] || 1.0,
          label: `segment_${idx}`
        }));
      }

      return [];
    } catch (error) {
      console.error('Segmentation error:', error);
      throw new Error('Failed to segment image');
    }
  }

  // Flux Pro for image generation
  async generateImage(
    prompt: string,
    aspectRatio: string = "1:1",
    numOutputs: number = 1,
    seed?: number
  ): Promise<GenerationResult[]> {
    try {
      const input: any = {
        prompt,
        aspect_ratio: aspectRatio,
        num_outputs: numOutputs,
        output_format: "webp",
        output_quality: 90,
      };

      if (seed !== undefined) {
        input.seed = seed;
      }

      const output = await replicate.run(
        "black-forest-labs/flux-pro",
        { input }
      ) as string | string[];

      const outputs = Array.isArray(output) ? output : [output];
      
      return outputs.map(url => ({
        image: url,
        seed: seed
      }));
    } catch (error) {
      console.error('Image generation error:', error);
      throw new Error('Failed to generate image');
    }
  }

  // Stable Diffusion XL for alternative generation
  async generateImageSDXL(
    prompt: string,
    negativePrompt?: string,
    width: number = 1024,
    height: number = 1024,
    numOutputs: number = 1,
    seed?: number
  ): Promise<GenerationResult[]> {
    try {
      const input: any = {
        prompt,
        negative_prompt: negativePrompt || "worst quality, low quality, blurry",
        width,
        height,
        num_outputs: numOutputs,
        scheduler: "DPMSolverMultistep",
        num_inference_steps: 25,
        guidance_scale: 7.5,
      };

      if (seed !== undefined) {
        input.seed = seed;
      }

      const output = await replicate.run(
        "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        { input }
      ) as string | string[];

      const outputs = Array.isArray(output) ? output : [output];
      
      return outputs.map(url => ({
        image: url,
        seed: seed
      }));
    } catch (error) {
      console.error('SDXL generation error:', error);
      throw new Error('Failed to generate image with SDXL');
    }
  }

  // Stable Diffusion Inpainting
  async inpaintImage(
    imageBase64: string,
    maskBase64: string,
    prompt: string,
    negativePrompt?: string,
    seed?: number
  ): Promise<GenerationResult> {
    try {
      const input: any = {
        image: `data:image/jpeg;base64,${imageBase64}`,
        mask: `data:image/jpeg;base64,${maskBase64}`,
        prompt,
        negative_prompt: negativePrompt || "worst quality, low quality",
        num_inference_steps: 25,
        guidance_scale: 7.5,
      };

      if (seed !== undefined) {
        input.seed = seed;
      }

      const output = await replicate.run(
        "stability-ai/stable-diffusion-inpainting:95b7223104132402a9ae91cc677285bc5eb997834bd2349fa486f53910fd68b3",
        { input }
      ) as string;

      return {
        image: output,
        seed: seed
      };
    } catch (error) {
      console.error('Inpainting error:', error);
      throw new Error('Failed to inpaint image');
    }
  }

  // Background removal using BRIA
  async removeBackground(imageBase64: string): Promise<string> {
    try {
      const output = await replicate.run(
        "bria-ai/rmbg-v1.4:b3d88e2bd7cf44a05b89d6db63f7c1e4b1e8b71f3ad81e61a4de937745db6c42",
        {
          input: {
            image: `data:image/jpeg;base64,${imageBase64}`,
          }
        }
      ) as string;

      return output;
    } catch (error) {
      console.error('Background removal error:', error);
      throw new Error('Failed to remove background');
    }
  }

  // Image upscaling using Real-ESRGAN
  async upscaleImage(imageBase64: string, scale: number = 2): Promise<string> {
    try {
      const output = await replicate.run(
        "nightmareai/real-esrgan:42fed1c4974146d4d2ff8b1a7e1f1b0a0db581e3e2c3214c1f2d1f1b0e7d51e7",
        {
          input: {
            image: `data:image/jpeg;base64,${imageBase64}`,
            scale,
            face_enhance: false,
          }
        }
      ) as string;

      return output;
    } catch (error) {
      console.error('Upscaling error:', error);
      throw new Error('Failed to upscale image');
    }
  }
}

// Export singleton instance
export const replicateService = new ReplicateService();