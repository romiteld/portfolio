import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';
export const maxDuration = 15; // Extend timeout to 15 seconds

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, imageAnalysisResult } = body;
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: "Invalid query" },
        { status: 400 }
      );
    }
    
    // Process the voice query with the Gemini API
    const responseText = await processVoiceQuery(query, imageAnalysisResult);
    
    return NextResponse.json({ text: responseText });
  } catch (error) {
    console.error("Error processing voice query:", error);
    let message = "Failed to process voice query";
    if (error instanceof Error) {
      message += `: ${error.message}`;
    }
    return NextResponse.json(
      { error: message, text: "I'm sorry, I couldn't process your request. Please try again." },
      { status: 500 }
    );
  }
}

async function processVoiceQuery(query: string, imageAnalysisResult: any) {
  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }
    
    // Using the Gemini 1.5 Flash model for text processing
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    // Create a system prompt that positions the assistant as a computer vision helper
    const systemContext = `You are a helpful computer vision assistant. 
    The user is showing you an image through their camera or has uploaded an image. 
    They might ask questions about what's visible in the image, or they might ask 
    for help identifying objects, reading text, or understanding the scene.
    
    Here is the latest analysis result from the camera:
    ${JSON.stringify(imageAnalysisResult || {})}
    
    When responding to queries about what you can see:
    1. Be conversational and helpful
    2. If the latest analysis includes a math solution, make sure to explain the calculation if asked
    3. If they're holding a product like a Red Bull can, acknowledge that specifically
    4. Keep responses concise and focused (no more than 3-4 sentences)
    5. If you can't determine something from the analysis, admit that politely
    6. If they ask about a math problem and the analysis has detected one, explain the solution
    7. Be confident and conversational, like you're having a friendly chat`;
    
    const requestData = {
      contents: [
        {
          parts: [
            {
              text: systemContext
            },
            {
              text: `User query about the camera view: "${query}"`
            }
          ]
        }
      ],
      safety_settings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ],
      generation_config: {
        temperature: 0.7,
        top_p: 0.95,
        top_k: 40,
        max_output_tokens: 1024
      }
    };
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestData)
    });
    
    const responseData = await response.json();
    
    if (!response.ok) {
      console.error("Gemini API error:", responseData);
      throw new Error(`Gemini API error: ${responseData.error?.message || "Unknown error"}`);
    }
    
    // Extract the response text
    const responseText = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!responseText) {
      throw new Error("Empty response from Gemini API");
    }
    
    return responseText;
  } catch (error) {
    console.error("Error in processVoiceQuery:", error);
    return "I'm sorry, I couldn't process your request. Please try again.";
  }
}