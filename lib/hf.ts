/**
 * Hugging Face Pro integration with Vercel AI SDK
 * Supports custom endpoints, streaming, and Pro-tier features
 */

// Default model configurations
export const HF_MODELS = {
  caption: 'Salesforce/blip2-flan-t5-xl',
  detect: 'IDEA-Research/grounding-dino-1.5', 
  segment: 'facebook/sam2.1-hiera-large',
  inpaint: 'stabilityai/sdxl-turbo',
  chat: 'llava-hf/llava-1.6-34b-hf'
} as const;

// Segment model variants
export const SEGMENT_MODELS = {
  default: 'facebook/sam2.1-hiera-large',
  hq: 'ChaoningZhang/HQ-SAM', 
  fast: 'ultralytics/fastsam-s'
} as const;

export type TaskType = keyof typeof HF_MODELS;
export type SegmentMode = keyof typeof SEGMENT_MODELS;

interface HFRequestParams {
  task: TaskType;
  inputs: Record<string, any>;
  options?: {
    stream?: boolean;
    segmentMode?: SegmentMode;
    useCustomEndpoint?: boolean;
  };
}

/**
 * Make a request to Hugging Face Pro endpoints
 */
export async function hfRequest({
  task,
  inputs,
  options = {}
}: HFRequestParams) {
  const { stream = false, segmentMode = 'default', useCustomEndpoint = true } = options;
  
  // Get custom endpoint or fall back to default
  const customEndpoint = useCustomEndpoint 
    ? process.env[`HF_ENDPOINT_${task.toUpperCase()}`] 
    : null;
  
  // Select model based on task and mode
  let model = HF_MODELS[task];
  if (task === 'segment' && segmentMode !== 'default') {
    model = SEGMENT_MODELS[segmentMode];
  }
  
  const baseUrl = customEndpoint || 'https://api-inference.huggingface.co';
  const url = customEndpoint ? customEndpoint : `${baseUrl}/models/${model}`;
  
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${process.env.HF_PRO_TOKEN}`,
    'Content-Type': 'application/json',
    'X-Wait-For-Model': 'true', // Handle cold starts
  };
  
  // Add streaming headers for supported tasks
  if (stream && (task === 'caption' || task === 'chat')) {
    headers['Accept'] = 'text/event-stream';
  }
  
  const body = JSON.stringify({
    inputs,
    parameters: getTaskParameters(task, options),
    options: {
      wait_for_model: true,
      use_cache: false // Pro tier - fresh results
    }
  });
  
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HF API Error (${response.status}): ${errorText}`);
  }
  
  return response;
}

/**
 * Get task-specific parameters
 */
function getTaskParameters(task: TaskType, options: any = {}) {
  switch (task) {
    case 'caption':
      return {
        max_new_tokens: 100,
        temperature: 0.7,
        do_sample: true
      };
      
    case 'detect':
      return {
        threshold: options.confidence || 0.3,
        max_objects: 20
      };
      
    case 'segment':
      return {
        threshold: options.threshold || 0.5,
        mask_threshold: 0.5,
        overlap_mask_area_threshold: 0.8
      };
      
    case 'inpaint':
      return {
        num_inference_steps: 10, // Fast for Turbo
        strength: 0.8,
        guidance_scale: 7.5
      };
      
    case 'chat':
      return {
        max_new_tokens: 500,
        temperature: 0.7,
        do_sample: true,
        top_p: 0.9
      };
      
    default:
      return {};
  }
}

/**
 * Convert base64 image to blob for HF API
 */
export function base64ToBlob(base64: string): Blob {
  const byteString = atob(base64.split(',')[1]);
  const mimeString = base64.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  
  return new Blob([ab], { type: mimeString });
}

/**
 * Handle streaming responses
 */
export async function* streamHFResponse(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');
  
  const decoder = new TextDecoder();
  let buffer = '';
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;
          
          try {
            const parsed = JSON.parse(data);
            if (parsed.token?.text) {
              yield parsed.token.text;
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Validate environment configuration
 */
export function validateHFConfig(): { valid: boolean; missing: string[] } {
  const required = ['HF_PRO_TOKEN'];
  const missing = required.filter(key => !process.env[key]);
  
  return {
    valid: missing.length === 0,
    missing
  };
}