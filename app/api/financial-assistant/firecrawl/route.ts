import { NextRequest, NextResponse } from 'next/server';

// Removed the MCP tool declaration
// declare const mcp_firecrawl_mcp_firecrawl_scrape: (args: any) => Promise<any>;

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const FIRECRAWL_API_URL = "https://api.firecrawl.dev/v1/scrape";

// --- Simulated Market Status Check ---
// In a real implementation, replace this with a call to Alpaca /v1/clock or similar
async function getMarketStatus(): Promise<{ isOpen: boolean; message: string }> {
  console.log("Simulating market status check...");
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate brief network delay

  // Simple time-based simulation (Eastern Time)
  const now = new Date();
  const estOffset = -4 * 60; // EDT offset (adjust for EST if needed)
  const utcOffset = now.getTimezoneOffset();
  const estTime = new Date(now.getTime() + (estOffset - utcOffset) * 60000);

  const dayOfWeek = estTime.getDay(); // 0=Sun, 6=Sat
  const hour = estTime.getHours();
  const minute = estTime.getMinutes();

  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  // Market hours approx 9:30 AM to 4:00 PM ET
  const isMarketHours = hour > 9 || (hour === 9 && minute >= 30);
  const isBeforeClose = hour < 16;

  const isOpen = !isWeekend && isMarketHours && isBeforeClose;

  console.log(`Simulated market status: ${isOpen ? 'Open' : 'Closed'}`);
  return {
    isOpen: isOpen,
    message: isOpen ? "The market is currently open." : "The market is currently closed."
  };
}
// --- End Simulated Market Status Check ---

export async function POST(req: NextRequest) {
  let marketStatusMessage = "";
  try {
    // 1. Check Market Status
    const marketStatus = await getMarketStatus();
    marketStatusMessage = marketStatus.message; // Store for potential inclusion in response

    // Check if the API key is configured
    if (!FIRECRAWL_API_KEY) {
      console.error('Firecrawl API key is not configured in environment variables.');
      return NextResponse.json({ error: 'Internal Server Configuration Error' }, { status: 500 });
    }

    const { query } = await req.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Invalid query provided' }, { status: 400 });
    }

    // --- URL Determination Logic ---
    let targetUrl: string;
    const potentialSymbol = query.trim().toUpperCase();
    // Added check for S&P 500 explicitly
    if (/^\^GSPC$/.test(potentialSymbol) || query.toLowerCase().includes('s&p 500')) {
        targetUrl = `https://finance.yahoo.com/quote/%5EGSPC`;
    } else if (/^[A-Z]{1,5}$/.test(potentialSymbol)) {
      targetUrl = `https://finance.yahoo.com/quote/${potentialSymbol}`;
    } else {
      targetUrl = `https://www.google.com/search?q=latest+financial+news+for+${encodeURIComponent(query)}`;
    }
    // --- End URL Determination ---

    const extractPrompt = `Extract key financial data (like price, change, volume if available) and briefly summarize the recent news or sentiment regarding "${query}" from this page. Present the result clearly. If the page mentions market status (open/closed), include that too.`;

    const firecrawlPayload = {
      url: targetUrl,
      extract: {
        prompt: extractPrompt
      },
      formats: ['extract']
    };

    console.log("Attempting direct Firecrawl API call with payload:", firecrawlPayload);

    // 2. Call Firecrawl API
    let apiResponse: Response;
    try {
      apiResponse = await fetch(FIRECRAWL_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`
        },
        body: JSON.stringify(firecrawlPayload)
      });

    } catch (fetchError) {
      console.error("Error fetching from Firecrawl API:", fetchError);
      // Prepend market status to the error message if available
      const errorMessage = `${marketStatusMessage} Failed to communicate with the financial data service.`;
      return NextResponse.json({ error: errorMessage }, { status: 502 });
    }

    console.log("Firecrawl API response status:", apiResponse.status);

    if (!apiResponse.ok) {
      let errorBody = 'Unknown error from Firecrawl API';
      try {
        errorBody = await apiResponse.text();
      } catch { /* Ignore parsing error */ }
      console.error(`Firecrawl API responded with status ${apiResponse.status}:`, errorBody);
       const errorMessage = `${marketStatusMessage} Financial data service returned an error (Status: ${apiResponse.status})`;
      return NextResponse.json({ error: errorMessage }, { status: apiResponse.status });
    }

    let firecrawlResult: any;
    try {
        firecrawlResult = await apiResponse.json();
    } catch (parseError) {
        console.error("Error parsing JSON response from Firecrawl API:", parseError);
         const errorMessage = `${marketStatusMessage} Received invalid response from financial data service.`;
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    console.log("Firecrawl API call successful, result:", firecrawlResult);

    // Check the structure of the successful response
    if (!firecrawlResult || !firecrawlResult.data?.extract) {
       console.error("Firecrawl API response format unexpected:", firecrawlResult);
       const apiError = firecrawlResult?.error || 'Received unexpected data format from financial service';
       const errorMessage = `${marketStatusMessage} ${apiError}`;
       return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    // 3. Combine Market Status with Extracted Data
    let finalExtractedData = firecrawlResult.data.extract;
    // Add the market status message to the extracted data if the market is closed
    if (!marketStatus.isOpen && finalExtractedData.summary) {
         finalExtractedData.summary = `${marketStatusMessage}\n\n${finalExtractedData.summary}`;
    } else if (!marketStatus.isOpen) {
         finalExtractedData.summary = marketStatusMessage;
    }

    // Return the potentially modified extracted data
    return NextResponse.json(finalExtractedData);

  } catch (error) {
    console.error('Unhandled error in /api/financial-assistant/firecrawl:', error);
    // Include market status in the final generic error message
    const errorMessage = `${marketStatusMessage} Internal Server Error`;
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 