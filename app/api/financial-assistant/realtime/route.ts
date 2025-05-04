import { NextResponse } from 'next/server';

/**
 * API endpoint to fetch real-time financial information using Firecrawl
 */
export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }
    
    // Add financial context to the search query to improve results
    const enhancedQuery = `${query} latest financial information market data`;
    
    // Fetch real-time data using Firecrawl
    const searchResponse = await fetch('https://api.firecrawl.dev/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY || ''}`,
      },
      body: JSON.stringify({
        query: enhancedQuery,
        limit: 3,
        scrapeOptions: {
          formats: ['markdown'],
          onlyMainContent: true
        }
      }),
    });
    
    if (!searchResponse.ok) {
      // Fallback to empty results if Firecrawl fails
      return NextResponse.json({ results: [], query: enhancedQuery });
    }
    
    const searchData = await searchResponse.json();
    
    // Process and extract the most relevant information
    const results = searchData.results.map((result: any) => ({
      title: result.title || 'Financial Information',
      content: result.content || result.markdown || result.snippet || '',
      url: result.url,
      date: new Date().toISOString()
    }));
    
    return NextResponse.json({ 
      results, 
      query: enhancedQuery,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching real-time financial data:', error);
    return NextResponse.json({ error: 'Failed to fetch real-time data' }, { status: 500 });
  }
} 