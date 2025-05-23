import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'

export const runtime = 'edge'
export const maxDuration = 15

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' })

export async function POST(req: NextRequest) {
  const { goal } = await req.json()

  if (!goal || typeof goal !== 'string') {
    return NextResponse.json({ error: 'Goal is required' }, { status: 400 })
  }

  try {
    const researchRes = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a helpful research agent.' },
        { role: 'user', content: `Gather key facts about ${goal}. Keep it concise.` }
      ]
    })
    const research = researchRes.choices[0]?.message?.content || ''

    const planRes = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a planning agent.' },
        { role: 'user', content: `Based on this research:\n${research}\nProvide a short plan to accomplish ${goal}.` }
      ]
    })
    const plan = planRes.choices[0]?.message?.content || ''

    const summaryRes = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a writing agent.' },
        { role: 'user', content: `Research:\n${research}\nPlan:\n${plan}\nWrite a short summary for the user.` }
      ]
    })
    const summary = summaryRes.choices[0]?.message?.content || ''

    return NextResponse.json({
      steps: [
        { name: 'Research Agent', text: research },
        { name: 'Planning Agent', text: plan },
        { name: 'Writing Agent', text: summary }
      ]
    })
  } catch (error) {
    console.error('Error generating agent responses:', error)
    return NextResponse.json(
      { error: 'Failed to generate agent responses' },
      { status: 500 }
    )
  }
}
