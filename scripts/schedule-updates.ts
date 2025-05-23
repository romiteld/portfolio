import { createClient } from '@supabase/supabase-js'
import yahooFinance from 'yahoo-finance2'
import axios from 'axios'
import * as dotenv from 'dotenv'
import { storeFinancialKnowledge } from '../lib/supabaseFinancialStorage'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const newsApiKey = process.env.NEWS_API_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase credentials in environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function purgeOldDocuments() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { error } = await supabase
    .from('documents')
    .delete()
    .lt('created_at', sevenDaysAgo)
  if (error) {
    console.error('Error purging old documents:', error)
  } else {
    console.log('Old documents purged')
  }
}

async function fetchMarketUpdates() {
  try {
    const symbols = ['^GSPC', '^IXIC', '^DJI', 'AAPL', 'MSFT', 'GOOGL', 'BTC-USD', 'ETH-USD']
    const quotes = await yahooFinance.quote(symbols)

    const indices = quotes.filter((q: any) => q.symbol.startsWith('^'))
    const stocks = quotes.filter((q: any) => !q.symbol.startsWith('^') && !q.symbol.endsWith('-USD'))
    const crypto = quotes.filter((q: any) => q.symbol.endsWith('-USD'))

    const format = (items: any[]) =>
      items
        .map(q => `${q.symbol}: ${q.regularMarketPrice?.toFixed(2)} (${q.regularMarketChangePercent?.toFixed(2)}%)`)
        .join('\n')

    return [
      {
        title: `Major Indices Update`,
        content: format(indices),
        source: 'yahoo-finance',
        category: 'indices'
      },
      {
        title: `Stock Highlights`,
        content: format(stocks),
        source: 'yahoo-finance',
        category: 'stocks'
      },
      {
        title: `Crypto Snapshot`,
        content: format(crypto),
        source: 'yahoo-finance',
        category: 'crypto'
      }
    ]
  } catch (error) {
    console.error('Error fetching market updates:', error)
    return []
  }
}

function generateSectorPerformance() {
  const sectors = ['Technology', 'Financials', 'Healthcare', 'Consumer', 'Energy', 'Utilities']
  const content = sectors
    .map(s => `${s}: ${(Math.random() * 4 - 2).toFixed(2)}%`)
    .join('\n')
  return {
    title: 'Sector Performance',
    content,
    source: 'generated',
    category: 'sectors'
  }
}

function generateEconomicSnapshot() {
  const gdp = (Math.random() * 4 - 1).toFixed(2)
  const cpi = (Math.random() * 3 + 2).toFixed(2)
  const unemployment = (Math.random() * 2 + 3).toFixed(2)
  const content = `GDP Growth: ${gdp}%\nInflation (CPI): ${cpi}%\nUnemployment: ${unemployment}%`
  return {
    title: 'Economic Indicators',
    content,
    source: 'generated',
    category: 'economics'
  }
}

async function fetchNewsHeadlines() {
  if (!newsApiKey) return null
  try {
    const response = await axios.get('https://newsapi.org/v2/top-headlines', {
      params: { category: 'business', language: 'en', apiKey: newsApiKey }
    })
    const headlines = response.data.articles.slice(0, 5).map((a: any) => `- ${a.title}`).join('\n')
    return {
      title: 'Financial News',
      content: headlines,
      source: 'newsapi',
      category: 'news'
    }
  } catch (error) {
    console.error('Error fetching news headlines:', error)
    return null
  }
}

async function run() {
  await purgeOldDocuments()

  const updates = await fetchMarketUpdates()
  const sectors = generateSectorPerformance()
  const economics = generateEconomicSnapshot()
  const news = await fetchNewsHeadlines()

  const contents = [...updates, sectors, economics]
  if (news) contents.push(news)

  if (contents.length > 0) {
    const result = await storeFinancialKnowledge(contents)
    console.log('Stored records:', result)
  } else {
    console.log('No content to store')
  }
}

run().catch(err => console.error('Scheduled update failed:', err))
