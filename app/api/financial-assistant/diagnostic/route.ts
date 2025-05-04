import { NextResponse } from 'next/server';

// Mark this route as always dynamic
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    // Check if we can access the market data API
    const marketDataResponse = await fetch('http://localhost:3002/api/market/data', { 
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    
    let marketData;
    let marketDataError = null;
    
    try {
      marketData = await marketDataResponse.json();
    } catch (error) {
      marketDataError = `Error parsing market data response: ${error instanceof Error ? error.message : String(error)}`;
      console.error(marketDataError);
    }
    
    // Return diagnostic information
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      marketDataStatus: marketDataResponse.status,
      marketDataOk: marketDataResponse.ok,
      marketDataParseable: !marketDataError,
      marketDataError,
      marketDataContentType: marketDataResponse.headers.get('content-type'),
      marketDataFirstBytes: marketDataError ? await marketDataResponse.text() : null,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        nextPublicUri: process.env.NEXT_PUBLIC_URI
      }
    });
  } catch (error) {
    console.error('Diagnostic endpoint error:', error);
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
} 