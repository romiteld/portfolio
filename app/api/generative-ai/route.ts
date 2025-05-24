import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'

export const runtime = 'edge'
export const maxDuration = 15

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
})

export async function POST(req: NextRequest) {
  try {
    const {
      prompt,
      type,
      temperature,
      size,
      negativePrompt,
      maxTokens
    } = await req.json()

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    if (type !== 'text' && type !== 'image') {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    const temp =
      typeof temperature === 'number' && !Number.isNaN(temperature)
        ? temperature
        : 1

    const imgSize = typeof size === 'string' ? size : '1024x1024'

    if (type === 'text') {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: temp,
        max_tokens:
          typeof maxTokens === 'number' && !Number.isNaN(maxTokens)
            ? maxTokens
            : undefined
      })
      const text = completion.choices[0]?.message?.content || ''
      return NextResponse.json({ text })
    }

    const imagePrompt =
      typeof negativePrompt === 'string' && negativePrompt.trim()
        ? `${prompt}. Avoid: ${negativePrompt}`
        : prompt

    const image = await openai.images.generate({
      model: 'dall-e-3',
      prompt: imagePrompt,
      n: 1,
      size: imgSize
    })

    const imageUrl = image.data[0]?.url
    return NextResponse.json({ imageUrl })
  } catch (error) {
    console.error('Error generating content:', error)
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    )
  }
}
