import { NextRequest, NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const symbols = searchParams.get('symbols');
    const timeframe = searchParams.get('timeframe') || '1mo';

    if (!symbols) {
      return NextResponse.json(
        { error: 'Missing required parameter: symbols' },
        { status: 400 }
      );
    }

    // Parse symbols
    const symbolsArray = symbols.split(',').map(symbol => symbol.trim());
    
    // Validate timeframe
    const validTimeframes = ['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', 'max'];
    if (!validTimeframes.includes(timeframe)) {
      return NextResponse.json(
        { error: `Invalid timeframe: ${timeframe}. Valid options are: ${validTimeframes.join(', ')}` },
        { status: 400 }
      );
    }

    // Convert timeframe to interval and period
    const { interval, period1 } = convertTimeframeToParams(timeframe);

    // Fetch historical data for each symbol
    const historicalDataPromises = symbolsArray.map(async (symbol) => {
      try {
        const result = await yahooFinance.historical(symbol, {
          period1,
          interval: interval as any,
        });
        return { symbol, data: result };
      } catch (err) {
        console.error(`Error fetching historical data for ${symbol}:`, err);
        return { symbol, error: `Failed to fetch data for ${symbol}` };
      }
    });

    const historicalResults = await Promise.all(historicalDataPromises);

    // Find the common dates across all successful results
    const successfulResults = historicalResults.filter(result => !result.error);
    
    if (successfulResults.length === 0) {
      return NextResponse.json(
        { error: 'Failed to fetch data for all requested symbols' },
        { status: 500 }
      );
    }

    // Combine data from all symbols
    const combinedData = combineHistoricalData(successfulResults);

    return NextResponse.json({
      symbols: symbolsArray,
      timeframe,
      data: combinedData,
    });
  } catch (error) {
    console.error('Error processing historical data request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function convertTimeframeToParams(timeframe: string): { interval: string; period1: Date } {
  const now = new Date();
  let period1: Date;
  let interval = '1d'; // Default interval

  switch (timeframe) {
    case '1d':
      period1 = new Date(now);
      period1.setDate(now.getDate() - 1);
      interval = '15m';
      break;
    case '5d':
      period1 = new Date(now);
      period1.setDate(now.getDate() - 5);
      interval = '30m';
      break;
    case '1mo':
      period1 = new Date(now);
      period1.setMonth(now.getMonth() - 1);
      break;
    case '3mo':
      period1 = new Date(now);
      period1.setMonth(now.getMonth() - 3);
      break;
    case '6mo':
      period1 = new Date(now);
      period1.setMonth(now.getMonth() - 6);
      break;
    case '1y':
      period1 = new Date(now);
      period1.setFullYear(now.getFullYear() - 1);
      break;
    case '2y':
      period1 = new Date(now);
      period1.setFullYear(now.getFullYear() - 2);
      break;
    case '5y':
      period1 = new Date(now);
      period1.setFullYear(now.getFullYear() - 5);
      break;
    case 'max':
      period1 = new Date(1970, 0, 1); // Start from 1970
      break;
    default:
      period1 = new Date(now);
      period1.setMonth(now.getMonth() - 1); // Default to 1 month
  }

  return { interval, period1 };
}

function combineHistoricalData(results: any[]): any[] {
  // Create a map of date -> data for each symbol
  const dateMap: Record<string, any> = {};

  results.forEach((result) => {
    const { symbol, data } = result;
    
    if (!data || !Array.isArray(data)) return;
    
    data.forEach((item: any) => {
      const date = item.date.toISOString().split('T')[0];
      
      if (!dateMap[date]) {
        dateMap[date] = { date };
      }
      
      // Add this symbol's closing price to the date entry
      dateMap[date][symbol] = item.close;
    });
  });

  // Convert the map to an array and sort by date
  return Object.values(dateMap)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
} 