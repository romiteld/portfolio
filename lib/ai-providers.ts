import { generateText, streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';

export type VisionProvider = 'openai' | 'google' | 'anthropic';

export interface VisionAnalysisResult {
  text: string;
  provider: VisionProvider;
  model: string;
  processingTime: number;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ProviderInfo {
  name: string;
  displayName: string;
  model: string;
  description: string;
  speed: 'Very Fast' | 'Fast' | 'Medium';
  cost: '$' | '$$' | '$$$';
  strengths: string[];
  color: string;
  gradient: string;
  icon: string;
}

export const providerInfo: Record<VisionProvider, ProviderInfo> = {
  openai: {
    name: 'openai',
    displayName: 'OpenAI',
    model: 'GPT-4 Vision',
    description: 'Industry-leading vision model with excellent accuracy',
    speed: 'Fast',
    cost: '$$',
    strengths: ['Best overall accuracy', 'Detailed descriptions', 'Complex reasoning'],
    color: '#10A37F',
    gradient: 'from-green-500 to-emerald-600',
    icon: '🤖'
  },
  google: {
    name: 'google',
    displayName: 'Google',
    model: 'Gemini 2.0 Flash',
    description: 'Lightning-fast vision model optimized for speed',
    speed: 'Very Fast',
    cost: '$',
    strengths: ['Fastest response time', 'Great for real-time', 'Cost effective'],
    color: '#4285F4',
    gradient: 'from-blue-500 to-indigo-600',
    icon: '✨'
  },
  anthropic: {
    name: 'anthropic',
    displayName: 'Anthropic',
    model: 'Claude 3.5 Sonnet',
    description: 'Advanced vision model with nuanced understanding',
    speed: 'Medium',
    cost: '$$$',
    strengths: ['Most detailed analysis', 'Excellent reasoning', 'Safety focused'],
    color: '#D97757',
    gradient: 'from-orange-500 to-red-600',
    icon: '🧠'
  }
};

export class AIProviders {
  private modelMap = {
    openai: openai('gpt-4o'),
    google: google('gemini-2.0-flash-exp'),
    anthropic: anthropic('claude-3-5-sonnet-20241022')
  };

  // Analyze image with specified provider
  async analyzeImage(
    imageBase64: string,
    provider: VisionProvider,
    prompt?: string,
    systemPrompt?: string
  ): Promise<VisionAnalysisResult> {
    const startTime = Date.now();
    
    const defaultPrompt = prompt || `Analyze this image in detail. Describe:
1. What you see in the image
2. Key objects and their positions
3. Colors, lighting, and composition
4. Any text or notable features
5. The overall mood or context`;

    try {
      const messages: any[] = [
        {
          role: 'user',
          content: [
            { type: 'text', text: defaultPrompt },
            { 
              type: 'image', 
              image: imageBase64.startsWith('data:') 
                ? imageBase64 
                : `data:image/jpeg;base64,${imageBase64}`
            }
          ]
        }
      ];

      if (systemPrompt) {
        messages.unshift({
          role: 'system',
          content: systemPrompt
        });
      }

      const result = await generateText({
        model: this.modelMap[provider],
        messages,
        maxTokens: 1000,
        temperature: 0.7,
      });

      const processingTime = Date.now() - startTime;

      return {
        text: result.text,
        provider,
        model: providerInfo[provider].model,
        processingTime,
        usage: result.usage ? {
          promptTokens: result.usage.promptTokens || 0,
          completionTokens: result.usage.completionTokens || 0,
          totalTokens: result.usage.totalTokens || 0
        } : undefined
      };
    } catch (error) {
      console.error(`Error with ${provider}:`, error);
      throw new Error(`Vision analysis failed with ${provider}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Stream vision analysis for chat interface
  async streamVisionChat(
    imageBase64: string,
    message: string,
    provider: VisionProvider,
    systemPrompt?: string,
    previousMessages?: any[]
  ) {
    const messages: any[] = [
      ...(previousMessages || []),
      {
        role: 'user',
        content: [
          { type: 'text', text: message },
          { 
            type: 'image', 
            image: imageBase64.startsWith('data:') 
              ? imageBase64 
              : `data:image/jpeg;base64,${imageBase64}`
          }
        ]
      }
    ];

    if (systemPrompt && messages.length === 1) {
      messages.unshift({
        role: 'system',
        content: systemPrompt
      });
    }

    return streamText({
      model: this.modelMap[provider],
      messages,
      maxTokens: 2000,
      temperature: 0.7,
    });
  }

  // Compare image across all providers
  async compareProviders(
    imageBase64: string,
    prompt?: string
  ): Promise<Record<VisionProvider, VisionAnalysisResult | { error: string }>> {
    const providers: VisionProvider[] = ['openai', 'google', 'anthropic'];
    const results: Record<string, any> = {};

    await Promise.all(
      providers.map(async (provider) => {
        try {
          results[provider] = await this.analyzeImage(imageBase64, provider, prompt);
        } catch (error) {
          results[provider] = {
            error: error instanceof Error ? error.message : 'Analysis failed'
          };
        }
      })
    );

    return results;
  }

  // Get best provider based on requirements
  getBestProvider(requirements: {
    speed?: boolean;
    cost?: boolean;
    accuracy?: boolean;
  }): VisionProvider {
    if (requirements.speed && requirements.cost) {
      return 'google';
    }
    if (requirements.accuracy) {
      return 'openai';
    }
    if (requirements.cost) {
      return 'google';
    }
    return 'openai'; // Default
  }

  // Estimate cost for analysis
  estimateCost(provider: VisionProvider, imageSize: number): number {
    // Rough estimates based on provider pricing
    const costPerMB = {
      openai: 0.01,
      google: 0.002,
      anthropic: 0.015
    };

    const sizeMB = imageSize / (1024 * 1024);
    return costPerMB[provider] * sizeMB;
  }
}

// Export singleton instance
export const aiProviders = new AIProviders();

// Alias for backward compatibility
export const AIProviderService = AIProviders;