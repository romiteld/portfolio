import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'
export const maxDuration = 10

async function fetchVideoInfo(videoUrl: string): Promise<any> {
  const res = await fetch(
    `https://noembed.com/embed?url=${encodeURIComponent(videoUrl)}`
  )
  if (!res.ok) throw new Error('Failed to fetch video info')
  return res.json()
}

export async function GET(req: NextRequest) {
  const videoUrl = req.nextUrl.searchParams.get('videoUrl')
  if (!videoUrl) {
    return NextResponse.json({ error: 'videoUrl is required' }, { status: 400 })
  }
  try {
    const info = await fetchVideoInfo(videoUrl)
    return NextResponse.json(info)
  } catch (err) {
    console.error('YouTube info error', err)
    return NextResponse.json(
      { error: 'Failed to fetch video info' },
      { status: 500 }
    )
  }
}
