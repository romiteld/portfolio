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
    
    // Generate speech using Gemini's text-to-speech API
    const audioData = await generateSpeechWithGemini(text);
    
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

async function generateSpeechWithGemini(text: string) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  // Gemini live streaming API endpoint for text-to-speech
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateSpeech?key=${GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini TTS API error: ${response.status} - ${errorText}`);
  }

  // Return the audio data
  const audioData = await response.arrayBuffer();
  return audioData;
}