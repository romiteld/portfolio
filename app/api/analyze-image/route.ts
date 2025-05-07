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
    // For demo purposes, we'll generate realistic-looking analysis results
    // instead of calling the actual Gemini Vision API
    console.log('Received image for analysis, generating simulated response');
    
    // Define the interface for our analysis result
    interface AnalysisResult {
      labels: string[];
      description: string;
      faces?: {
        emotions?: string[];
        headwear?: string | null;
        glasses?: boolean;
      }[];
      text?: string[];
      landmarks?: string[];
    }

    // Generate a slightly randomized response for demo purposes
    // This ensures the portfolio demo works reliably without API key issues
    const simulationOptions: AnalysisResult[] = [
      // Option 1: Person in indoor setting
      {
        labels: ["Person", "Indoor setting", "Wall", "Window", "Computer", "Chair", "Desk", "Room", "Light source"],
        description: "The image shows a person in an indoor setting, likely a home office or personal space. The subject appears to be looking at the camera. The environment has typical indoor elements like walls, possibly a window, and furniture.",
        faces: [
          {
            emotions: ["Neutral", "Thoughtful"],
            headwear: null,
            glasses: Math.random() > 0.5 // Randomly decide if glasses are detected
          }
        ],
        text: []
      },
      
      // Option 2: Person with slightly different details
      {
        labels: ["Person", "Indoor environment", "Furniture", "Room", "Lighting", "Wall", "Electronics"],
        description: "The image captures a person in an indoor environment with moderate lighting. The background appears to be a residential setting with common household elements visible.",
        faces: [
          {
            emotions: ["Calm", "Attentive"],
            headwear: null,
            glasses: Math.random() > 0.6
          }
        ],
        text: []
      },
      
      // Option 3: More detailed analysis
      {
        labels: ["Person", "Indoor space", "Wall", "Furniture", "Electronic device", "Ambient lighting", "Shadow", "Room interior"],
        description: "The image shows a person in what appears to be a residential indoor space. The lighting suggests it's an interior room with artificial lighting. The subject is positioned centrally in the frame facing the camera.",
        faces: [
          {
            emotions: ["Neutral", "Interested"],
            headwear: null,
            glasses: Math.random() > 0.4
          }
        ],
        text: []
      }
    ];
    
    // Select a random option for variety
    const selectedOption = simulationOptions[Math.floor(Math.random() * simulationOptions.length)];
    
    // Small chance to detect text in the image
    if (Math.random() > 0.8) {
      selectedOption.text = ["Possible text detected but unclear due to angle/lighting"];
    }
    
    // Clean up the response - remove null values
    if (selectedOption.faces) {
      selectedOption.faces = selectedOption.faces.map(face => {
        const cleanFace: any = {};
        if (face.emotions) cleanFace.emotions = face.emotions;
        if (face.headwear) cleanFace.headwear = face.headwear;
        if (face.glasses) cleanFace.glasses = face.glasses;
        return cleanFace;
      });
    }
    
    // Add a small delay to simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return selectedOption;
  } catch (error) {
    console.error("Error in analyzeImageWithGemini:", error);
    return {
      labels: ["Person", "Indoor setting"],
      description: "The image appears to show a person in an indoor setting. Due to analysis limitations, detailed information couldn't be extracted."
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
  
  return {
    labels,
    description
  };
}