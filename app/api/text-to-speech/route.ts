import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';
export const maxDuration = 15; // Extend timeout to 15 seconds

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text } = body;
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: "Invalid text" },
        { status: 400 }
      );
    }
    
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY environment variable is not set");
    }

    // Default to 'Rachel' voice which is a premium female voice
    // For other voices, see: https://api.elevenlabs.io/v1/voices
    const VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel
    
    console.log(`Sending text to ElevenLabs: ${text.substring(0, 30)}${text.length > 30 ? '...' : ''}`);
    
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,         // Balance between stability and variability (0-1)
            similarity_boost: 0.75, // How much to prioritize voice similarity vs quality (0-1)
            style: 0.15,            // Add slight stylistic variations for more natural speech
            speaker_boost: true     // Enhance speaker clarity
          },
        }),
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("ElevenLabs API error:", {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      throw new Error(`ElevenLabs API error: ${response.statusText}`);
    }
    
    // Get the audio data
    const audioBuffer = await response.arrayBuffer();
    
    // Return the audio as a response with correct headers
    return new Response(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Text-to-speech error:", error);
    return NextResponse.json(
      { error: "Failed to generate speech" },
      { status: 500 }
    );
  }
}
