import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'

export const runtime = 'edge'
export const maxDuration = 20

async function fetchVideoInfo(videoUrl: string): Promise<any> {
  const res = await fetch(
    `https://noembed.com/embed?url=${encodeURIComponent(videoUrl)}`
  )
  if (!res.ok) throw new Error('Failed to fetch video info')
  return res.json()
}

function extractVideoId(url: string): string | null {
  const regExp = /(?:v=|youtu\.be\/|\/embed\/)([\w-]{11})/
  const match = url.match(regExp)
  return match ? match[1] : null
}

async function fetchTranscript(videoId: string): Promise<string> {
  const res = await fetch(`https://youtubetranscript.pages.dev/?id=${videoId}`)
  if (!res.ok) throw new Error('Failed to fetch transcript')
  const data = await res.json()
  if (Array.isArray(data.transcript)) {
    return data.transcript.map((t: any) => t.text).join(' ')
  }
  return ''
}

export async function POST(req: NextRequest) {
  try {
    const { videoUrl } = await req.json()
    if (!videoUrl) {
      return NextResponse.json({ error: 'videoUrl is required' }, { status: 400 })
    }
    const videoId = extractVideoId(videoUrl)
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 })
    }

    const info = await fetchVideoInfo(videoUrl)

    const transcript = await fetchTranscript(videoId)
    if (!transcript) {
      return NextResponse.json({ error: 'Transcript not found' }, { status: 404 })
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' })
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content:
            'Summarize the following YouTube transcript in 3 sentences and list key insights. ' +
            'Respond in JSON with keys "summary" and "insights" (array of strings).'
        },
        { role: 'user', content: transcript.slice(0, 12000) }
      ],
      temperature: 0.5,
      max_tokens: 500
    })

    const text = completion.choices[0]?.message?.content || ''
    let summary = text
    let insights: string[] = []
    try {
      const parsed = JSON.parse(text)
      summary = parsed.summary || summary
      insights = Array.isArray(parsed.insights) ? parsed.insights : []
    } catch {
      // If parsing fails, treat the whole text as summary
    }

    return NextResponse.json({ summary, insights, info })
  } catch (err: any) {
    console.error('YouTube summarization error', err)
    return NextResponse.json({ error: 'Failed to summarize video' }, { status: 500 })
  }
}
