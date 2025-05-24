import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import { queryCompanyInfo } from '@/lib/supabaseCompanyStorage'

export async function POST(req: NextRequest) {
  try {
    const { message, company } = await req.json()
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    let context = ''
    if (company && typeof company === 'string') {
      const result = await queryCompanyInfo(company)
      if (result.success && result.results && result.results.length > 0) {
        context = result.results
          .map((r: any) => `${r.metadata.title}:\n${r.content}`)
          .join('\n\n')
      }
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' })
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: `You are Alex, a friendly sales assistant.${context ? `\n\nCompany info:\n${context}` : ''}` },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 200
    })

    const reply = completion.choices[0]?.message?.content?.trim() || 'Sorry, I had trouble generating a response.'
    return NextResponse.json({ reply })
  } catch (err) {
    console.error('Sales Agent chat error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
