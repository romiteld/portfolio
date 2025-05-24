import { NextRequest, NextResponse } from 'next/server'
import { storeCompanyInfo } from '@/lib/supabaseCompanyStorage'

export async function POST(req: NextRequest) {
  try {
    const { company } = await req.json()
    if (!company || typeof company !== 'string') {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
    }

    let articles: { title: string; content: string; source: string }[] = []
    let fromFallback = false

    try {
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

      if (response.ok) {
        const data = await response.json()
        articles = Array.isArray(data.results)
          ? data.results.map((r: any) => ({
              title: r.title || company,
              content: r.content || r.markdown || r.snippet || '',
              source: r.url || 'firecrawl',
            }))
          : []
      } else {
        console.warn(`Firecrawl request failed with status ${response.status}`)
      }
    } catch (fetchError) {
      console.error('Error contacting Firecrawl:', fetchError)
    }

    if (articles.length === 0) {
      fromFallback = true
      articles = generatePlaceholderArticles(company)
    }

    try {
      if (!fromFallback) {
        await storeCompanyInfo(company, articles)
      }
    } catch (storeError) {
      console.error('Error storing company info:', storeError)
    }

    return NextResponse.json({ success: true, articlesCount: articles.length, fromFallback })
  } catch (error) {
    console.error('Error processing company info request:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

function generatePlaceholderArticles(company: string) {
  return [
    {
      title: `${company} Company Overview`,
      content: `${company} is a well known organization with a variety of products and services.`,
      source: 'generated',
    },
    {
      title: `${company} Recent Developments`,
      content: `This is sample information about recent developments at ${company}.`,
      source: 'generated',
    },
  ]
}
