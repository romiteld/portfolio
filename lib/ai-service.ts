import { generateText, generateObject, streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';
import Replicate from 'replicate';
import { z } from 'zod';

export type AIProvider = 'openai' | 'google' | 'anthropic';
export type ImageModel = 'flux-pro' | 'stable-diffusion-3.5' | 'dalle-3';

interface DetectionResult {
  labels: Array<{
    name: string;
    confidence: number;
    box: [number, number, number, number]; // x1, y1, x2, y2
  }>;
}

interface SegmentationResult {
  masks: string[]; // Base64 encoded masks
  scores: number[];
}

export class AIService {
  private replicate: Replicate | null = null;

  constructor() {
    if (process.env.REPLICATE_API_TOKEN) {
      this.replicate = new Replicate({
        auth: process.env.REPLICATE_API_TOKEN,
      });
    }
  }

  // Vision analysis with multiple providers
  async analyzeImage(
    image: string, 
    provider: AIProvider = 'openai',
    prompt?: string
  ) {
    const defaultPrompt = prompt || 'Analyze this image in detail. Describe what you see, including objects, people, colors, composition, and any notable features.';
    
    const modelMap = {
      openai: openai('gpt-4o-mini'),
      google: google('gemini-2.0-flash-exp'),
      anthropic: anthropic('claude-3-5-sonnet-20241022')
    };

    try {
      const result = await generateText({
        model: modelMap[provider],
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: defaultPrompt },
            { type: 'image', image }
          ]
        }],
        maxTokens: 500,
      });

      return {
        text: result.text,
        provider,
        model: modelMap[provider].modelId,
        usage: result.usage,
      };
    } catch (error) {
      console.error(`Error with ${provider}:`, error);
      throw error;
    }
  }

  // Stream vision analysis for chat
  async streamVisionChat(
    image: string,
    message: string,
    provider: AIProvider = 'openai'
  ) {
    const modelMap = {
      openai: openai('gpt-4o'),
      google: google('gemini-2.0-flash-exp'),
      anthropic: anthropic('claude-3-5-sonnet-20241022')
    };

    return streamText({
      model: modelMap[provider],
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: message },
          { type: 'image', image }
        ]
      }],
      maxTokens: 1000,
    });
  }

  // Object detection via Replicate
  async detectObjects(image: string, labels?: string[]): Promise<DetectionResult> {
    if (!this.replicate) {
      throw new Error('Replicate API token not configured');
    }

    try {
      const input = {
        image,
        prompt: labels ? labels.join(', ') : 'all objects',
        box_threshold: 0.3,
        text_threshold: 0.25,
      };

      const output = await this.replicate.run(
        "adirik/grounding-dino:efd10a8ddc57ea28773327e881ce95e20cc1d734c589f7dd01d2036921ed78aa",
        { input }
      ) as any;

      return {
        labels: output.detections || []
      };
    } catch (error) {
      console.error('Object detection error:', error);
      throw error;
    }
  }

  // Segmentation via Replicate
  async segmentImage(
    image: string, 
    points?: number[][],
    labels?: number[]
  ): Promise<SegmentationResult> {
    if (!this.replicate) {
      throw new Error('Replicate API token not configured');
    }

    try {
      const input: any = {
        image,
        mask_threshold: 0.0,
        pred_iou_thresh: 0.88,
        stability_score_thresh: 0.95,
      };

      if (points && points.length > 0) {
        input.input_points = points;
        input.input_labels = labels || points.map(() => 1);
      }

      const output = await this.replicate.run(
        "meta/sam-2:c88537b89c75d17073e6ce5b04f57454de882ab0e2e4ce00d3615ca9b9515d1f",
        { input }
      ) as any;

      return {
        masks: output.masks || [],
        scores: output.scores || []
      };
    } catch (error) {
      console.error('Segmentation error:', error);
      throw error;
    }
  }

  // Image generation
  async generateImage(
    prompt: string, 
    model: ImageModel = 'flux-pro',
    options?: {
      negativePrompt?: string;
      aspectRatio?: string;
      steps?: number;
      guidance?: number;
    }
  ) {
    if (!this.replicate) {
      throw new Error('Replicate API token not configured');
    }

    const modelMap = {
      'flux-pro': "black-forest-labs/flux-pro",
      'stable-diffusion-3.5': "stability-ai/stable-diffusion-3.5-large-turbo",
      'dalle-3': "openai/dalle-3" // Would use OpenAI SDK directly
    };

    try {
      if (model === 'dalle-3') {
        // Use OpenAI directly for DALL-E 3
        const response = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt,
            n: 1,
            size: "1024x1024",
            quality: "hd",
            style: "vivid"
          }),
        });

        const data = await response.json();
        return {
          url: data.data[0].url,
          model: 'dalle-3'
        };
      } else {
        // Use Replicate for other models
        const input: any = {
          prompt,
          ...options
        };

        const output = await this.replicate.run(
          modelMap[model] as any,
          { input }
        );

        return {
          url: Array.isArray(output) ? output[0] : output,
          model
        };
      }
    } catch (error) {
      console.error('Image generation error:', error);
      throw error;
    }
  }

  // Inpainting
  async inpaintImage(
    image: string,
    mask: string,
    prompt: string,
    model: 'flux' | 'sd3' = 'flux'
  ) {
    if (!this.replicate) {
      throw new Error('Replicate API token not configured');
    }

    try {
      const modelId = model === 'flux' 
        ? "black-forest-labs/flux-fill-pro"
        : "stability-ai/stable-diffusion-inpainting";

      const output = await this.replicate.run(
        modelId as any,
        {
          input: {
            image,
            mask,
            prompt,
            guidance_scale: 7.5,
            num_inference_steps: 50,
          }
        }
      );

      return {
        url: Array.isArray(output) ? output[0] : output,
        model: modelId
      };
    } catch (error) {
      console.error('Inpainting error:', error);
      throw error;
    }
  }

  // Get provider info for UI
  getProviderInfo(provider: AIProvider) {
    const info = {
      openai: {
        name: 'OpenAI',
        model: 'GPT-4 Vision',
        speed: 'Fast',
        cost: '$$',
        color: 'from-green-500 to-emerald-600',
        icon: '🤖'
      },
      google: {
        name: 'Google',
        model: 'Gemini 2.0 Flash',
        speed: 'Very Fast',
        cost: '$',
        color: 'from-blue-500 to-indigo-600',
        icon: '✨'
      },
      anthropic: {
        name: 'Anthropic',
        model: 'Claude 3.5 Sonnet',
        speed: 'Fast',
        cost: '$$$',
        color: 'from-orange-500 to-red-600',
        icon: '🧠'
      }
    };
    return info[provider];
  }
}

// Export singleton instance
export const aiService = new AIService();