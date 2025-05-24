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

    const { 
      image, 
      message, 
      conversation = [],
      stream = true 
    } = await req.json();

    if (!image) {
      return NextResponse.json(
        { error: 'Image is required for visual chat' },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Format conversation for LLaVA
    let conversationText = '';
    if (conversation.length > 0) {
      conversationText = conversation
        .map((msg: any) => `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`)
        .join('\n') + '\n';
    }

    const prompt = conversationText + `Human: ${message}\nAssistant:`;

    // Make request to LLaVA
    const response = await hfRequest({
      task: 'chat',
      inputs: {
        image,
        text: prompt,
        max_new_tokens: 500,
        temperature: 0.7,
        do_sample: true
      },
      options: { stream }
    });

    if (stream) {
      // Return streaming response for real-time chat
      const textStream = streamHFResponse(response);
      
      return new StreamingTextResponse(
        (async function* () {
          for await (const chunk of textStream) {
            yield chunk;
          }
        })()
      );
    } else {
      // Return complete response
      const result = await response.json();
      
      // LLaVA returns generated text
      let responseText = '';
      if (Array.isArray(result)) {
        responseText = result[0]?.generated_text || result[0] || '';
      } else {
        responseText = result.generated_text || result.text || result.response || '';
      }

      // Extract only the assistant's response (after the last "Assistant:")
      const assistantIndex = responseText.lastIndexOf('Assistant:');
      if (assistantIndex !== -1) {
        responseText = responseText.substring(assistantIndex + 10).trim();
      }

      return NextResponse.json({
        response: responseText,
        model: 'llava-hf/llava-1.6-34b-hf',
        conversation: [
          ...conversation,
          { role: 'user', content: message },
          { role: 'assistant', content: responseText }
        ]
      });
    }

  } catch (error) {
    console.error('Chat API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process chat message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}