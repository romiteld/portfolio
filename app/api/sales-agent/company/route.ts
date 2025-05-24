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

    let logo: string | null = null
    if (Array.isArray(data.results) && data.results.length > 0) {
      const firstUrl = data.results[0].url
      try {
        const domain = new URL(firstUrl).hostname
        logo = `https://logo.clearbit.com/${domain}`
      } catch {
        // ignore URL parsing errors
      }
    }

    if (!logo) {
      const fallbackDomain = `${company.toLowerCase().replace(/\s+/g, '')}.com`
      logo = `https://logo.clearbit.com/${fallbackDomain}`
    }

    if (articles.length > 0) {
      try {
        await storeCompanyInfo(company, articles)
      } catch (storeError) {
        console.error('Error storing company info:', storeError)
      }
    }

    return NextResponse.json({ success: true, articlesCount: articles.length, logo })
  } catch (error) {
    console.error('Error fetching company info:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
