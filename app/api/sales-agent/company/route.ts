import { NextRequest, NextResponse } from 'next/server'
import { storeCompanyInfo } from '@/lib/supabaseCompanyStorage'

export async function POST(req: NextRequest) {
  try {
    const { company } = await req.json()
    if (!company || typeof company !== 'string') {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
    }

    const response = await fetch('https://api.firecrawl.dev/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY || ''}`,
      },
      body: JSON.stringify({
        query: company,
        limit: 3,
        scrapeOptions: {
          formats: ['markdown'],
          onlyMainContent: true,
        },
      }),
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch company info' }, { status: response.status })
    }

    const data = await response.json()

    const articles = Array.isArray(data.results)
      ? data.results.map((r: any) => ({
          title: r.title || company,
          content: r.content || r.markdown || r.snippet || '',
          source: r.url || 'firecrawl',
        }))
      : []

    if (articles.length > 0) {
      await storeCompanyInfo(company, articles)
    }

    return NextResponse.json({ success: true, articlesCount: articles.length })
  } catch (error) {
    console.error('Error fetching company info:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
