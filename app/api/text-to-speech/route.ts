import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';
export const maxDuration = 10; // Extend timeout to 10 seconds

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text } = body;
    
    if (!text) {
      return NextResponse.json(
        { error: "No text provided" },
        { status: 400 }
      );
    }
    
    // Generate speech using Eleven Labs API
    const audioData = await generateSpeechWithElevenLabs(text);
    
    // Return audio data as a blob
    return new NextResponse(audioData, {
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });
  } catch (error) {
    console.error("Error generating speech:", error);
    return NextResponse.json(
      { error: "Failed to generate speech" },
      { status: 500 }
    );
  }
}

async function generateSpeechWithElevenLabs(text: string) {
  const ELEVEN_LABS_API_KEY = process.env.ELEVEN_LABS_API_KEY;
  const VOICE_ID = process.env.ELEVEN_LABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB'; // Adam voice as default
  
  if (!ELEVEN_LABS_API_KEY) {
    throw new Error("ELEVEN_LABS_API_KEY environment variable is not set");
  }
  
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': ELEVEN_LABS_API_KEY
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true
      }
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Eleven Labs API error: ${response.status} - ${errorText}`);
  }
  
  // Return the audio data
  const audioData = await response.arrayBuffer();
  return audioData;
}