// Test configuration for Generative AI demo
export const TEST_CONFIG = {
  API_URL: process.env.API_URL || 'http://localhost:3001',
  TIMEOUT: 30000, // 30 seconds for AI generation
  RETRY_ATTEMPTS: 2,
  RETRY_DELAY: 2000, // 2 seconds
};

// Test prompts for different scenarios
export const TEST_PROMPTS = {
  text: {
    simple: 'Write a haiku about coding',
    complex: 'Explain quantum computing in simple terms for a 10-year-old',
    creative: 'Write a short story about a robot learning to paint',
    technical: 'Generate a Python function that calculates fibonacci numbers',
    edge_cases: {
      empty: '',
      whitespace: '   ',
      special_chars: '!@#$%^&*()',
      very_long: 'a'.repeat(5000),
      unicode: '写一首关于春天的诗 🌸',
    }
  },
  image: {
    simple: 'A beautiful sunset over mountains',
    detailed: 'A futuristic cityscape with flying cars, neon lights, and towering skyscrapers at night',
    artistic: 'Abstract art in the style of Kandinsky with vibrant colors',
    with_negative: {
      prompt: 'A serene forest landscape',
      negative: 'people, buildings, cars'
    },
    edge_cases: {
      minimal: 'A dot',
      complex_negative: {
        prompt: 'A cat',
        negative: 'dog, mouse, bird, fish, reptile, insect'
      }
    }
  }
};

// Valid parameter ranges
export const PARAM_RANGES = {
  temperature: {
    min: 0,
    max: 1,
    default: 1,
    test_values: [0, 0.5, 0.7, 1]
  },
  maxTokens: {
    min: 50,
    max: 800,
    default: 200,
    test_values: [50, 200, 400, 800]
  },
  sizes: ['1024x1024', '1792x1024', '1024x1792']
};

// Expected response structure
export interface TextGenerationResponse {
  text: string;
  error?: string;
}

export interface ImageGenerationResponse {
  imageUrl: string;
  error?: string;
}

export interface ErrorResponse {
  error: string;
  type?: string;
}