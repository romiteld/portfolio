import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'

export const runtime = 'edge'
export const maxDuration = 15

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' })

export async function POST(req: NextRequest) {
  const { goal, agents } = await req.json()

  if (!goal || typeof goal !== 'string') {
    return NextResponse.json({ error: 'Goal is required' }, { status: 400 })
  }
  const agentIds = Array.isArray(agents) && agents.length > 0 ? agents : []

  try {
    const configs: Record<string, { name: string; system: string; prompt: (goal: string, context: string) => string }> = {
      developer: {
        name: 'Developer Agent',
        system: 'You are a senior software developer.',
        prompt: (g, ctx) => `${ctx}\nProvide a short development plan for ${g}.`
      },
      marketing: {
        name: 'Marketing Agent',
        system: 'You are a savvy marketing expert.',
        prompt: (g, ctx) => `${ctx}\nOutline a brief marketing strategy for ${g}.`
      },
      writer: {
        name: 'Creative Writer',
        system: 'You craft engaging copy.',
        prompt: (g, ctx) => `${ctx}\nWrite a concise summary for ${g}.`
      },
      data: {
        name: 'Data Analyst',
        system: 'You analyze data trends.',
        prompt: (g, ctx) => `${ctx}\nList key metrics we should track for ${g}.`
      },
      designer: {
        name: 'Designer Agent',
        system: 'You create visual designs.',
        prompt: (g, ctx) => `${ctx}\nSuggest a design direction for ${g}.`
      },
      pm: {
        name: 'Project Manager',
        system: 'You manage projects efficiently.',
        prompt: (g, ctx) => `${ctx}\nBreak down the major milestones for ${g}.`
      }
    }

    const ids = agentIds.length > 0 ? agentIds : ['developer', 'marketing', 'writer']
    let context = ''
    const steps: { name: string; text: string }[] = []

    for (const id of ids) {
      const cfg = configs[id as keyof typeof configs]
      if (!cfg) continue

      const res = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: cfg.system },
          { role: 'user', content: cfg.prompt(goal, context) }
        ]
      })

      const text = res.choices[0]?.message?.content || ''
      steps.push({ name: cfg.name, text })
      context += `\n${cfg.name}: ${text}`
    }

    return NextResponse.json({ steps })
  } catch (error) {
    console.error('Error generating agent responses:', error)
    return NextResponse.json(
      { error: 'Failed to generate agent responses' },
      { status: 500 }
    )
  }
}
