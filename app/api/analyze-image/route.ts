import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';
export const maxDuration = 15; // Extend timeout to 15 seconds

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image } = body;
    
    if (!image) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }
    
    // Ensure the image is a base64 string
    if (!image.startsWith('data:image/')) {
      return NextResponse.json(
        { error: "Invalid image format" },
        { status: 400 }
      );
    }
    
    // Remove the data:image/jpeg;base64, part
    const base64Image = image.split(',')[1];
    
    // Call the Gemini Vision API
    const analysisResult = await analyzeImageWithGemini(base64Image);
    
    return NextResponse.json(analysisResult);
  } catch (error) {
    console.error("Error analyzing image:", error);
    return NextResponse.json(
      { error: "Failed to analyze image" },
      { status: 500 }
    );
  }
}

async function analyzeImageWithGemini(base64Image: string) {
  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }
    
    // Using the correct endpoint for the Gemini 2.0 Flash 001 model
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=${GEMINI_API_KEY}`;
    
    const requestData = {
      contents: [
        {
          parts: [
            {
              text: "Analyze this image and provide detailed information in JSON format with the following fields:\n\n1. 'labels': Array of objects and elements in the image\n2. 'description': Detailed description of the scene\n3. 'text': Array of any visible text (empty array if none)\n4. 'math_solution': If a math problem is visible, provide the solution (null if no math problem)\n5. 'objects': Array of objects with 'name' and 'confidence' fields\n6. 'faces': Array of face details with emotions, headwear, glasses (empty if no faces)\n7. 'landmarks': Array of any recognizable landmarks (empty if none)\n\nIf you see a math problem written down (like '2×2' or '5+3'), solve it and put the answer in the math_solution field. If someone is holding a product (like a can of Red Bull), identify it specifically in the objects array."
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: base64Image
              }
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
        temperature: 0.2,
        top_p: 1,
        top_k: 32,
        max_output_tokens: 2048
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
    
    // Parse the JSON from the response
    let parsedResult;
    try {
      // Find JSON in the response (it might be wrapped in ```json ... ``` code blocks)
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || 
                        responseText.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, responseText];
                        
      const jsonString = jsonMatch[1] || responseText;
      parsedResult = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Error parsing JSON from Gemini response:", parseError);
      console.log("Raw Gemini response:", responseText);
      
      // Create a fallback analysis result
      parsedResult = createFallbackAnalysis(responseText);
    }
    
    return parsedResult;
  } catch (error) {
    console.error("Error in analyzeImageWithGemini:", error);
    return {
      labels: ["Error occurred during analysis"],
      description: "Failed to analyze the image. Please try again.",
      text: [],
      math_solution: null,
      objects: [],
      faces: [],
      landmarks: []
    };
  }
}

function createFallbackAnalysis(text: string) {
  // Extract what looks like labels from the text
  const labelsMatch = text.match(/objects|elements|items:?\s*([\s\S]*?)(?:\n\n|\n\d|$)/i);
  const labels = labelsMatch 
    ? labelsMatch[1]
        .split(/\n|-|,|\d+\./)
        .map(item => item.trim())
        .filter(item => item.length > 0)
    : ["Analysis failed"];
  
  // Extract what looks like a description
  const descriptionMatch = text.match(/description:?\s*([\s\S]*?)(?:\n\n|\n[A-Za-z]+:|\n\d|$)/i);
  const description = descriptionMatch 
    ? descriptionMatch[1].trim()
    : "Could not extract a proper description from the analysis.";
  
  // Look for a math problem solution
  const mathMatch = text.match(/math[_\s]solution:?\s*([0-9+\-*/=]+)/i);
  const mathSolution = mathMatch ? mathMatch[1].trim() : null;
  
  return {
    labels,
    description,
    text: [],
    math_solution: mathSolution,
    objects: [],
    faces: [],
    landmarks: []
  };
}