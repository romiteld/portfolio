'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, User, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

interface Message {
  sender: 'user' | 'agent'
  name: string
  text: string
}

export default function InteractiveAgentsDemo() {
  const [goal, setGoal] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [running, setRunning] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  // Sample goal suggestions
  const suggestions = [
    'Build a personal website',
    'Plan a marketing campaign',
    'Write a short story',
  ]

  const timeouts = useRef<NodeJS.Timeout[]>([])

  useEffect(() => {
    return () => {
      timeouts.current.forEach(clearTimeout)
    }
  }, [])

  const startSimulation = async () => {
    if (!goal.trim()) return
    setRunning(true)
    setCurrentStep(0)
    setMessages([{ sender: 'user', name: 'You', text: goal }])

    try {
      const res = await fetch('/api/interactive-agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal })
      })

      if (!res.ok) {
        throw new Error('API request failed')
      }

      const data = await res.json()
      const steps = (data.steps || []) as { name: string; text: string }[]

      steps.forEach((step, idx) => {
        const timer = setTimeout(() => {
          setMessages((prev) => [...prev, { sender: 'agent', ...step }])
          setCurrentStep(idx + 1)
          if (idx === steps.length - 1) setRunning(false)
        }, 1000 * (idx + 1))
        timeouts.current.push(timer)
      })
    } catch (err) {
      console.error('Simulation error:', err)
      setMessages((prev) => [
        ...prev,
        { sender: 'agent', name: 'System', text: 'Failed to run simulation.' }
      ])
      setRunning(false)
    }
  }

  const reset = () => {
    setGoal('')
    setMessages([])
    setRunning(false)
    setCurrentStep(0)
    timeouts.current.forEach(clearTimeout)
    timeouts.current = []
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Enter a project or goal..."
          className="flex-1 border border-neutral-300 dark:border-neutral-600 rounded px-3 py-2 bg-white dark:bg-neutral-800"
        />
        <button
          onClick={startSimulation}
          disabled={running || !goal.trim()}
          className="bg-primary-500 text-white px-4 py-2 rounded flex items-center gap-1 disabled:opacity-50"
        >
          Start <ArrowRight size={16} />
        </button>
      </div>

      {/* Quick goal suggestions */}
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => setGoal(s)}
            className="text-xs bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 px-3 py-1 rounded-full"
          >
            {s}
          </button>
        ))}
      </div>

      {running && (
        <div>
          <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded">
            <div
              className="h-2 bg-primary-500 rounded transition-all"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 text-right">
            Step {currentStep} / 3
          </p>
        </div>
      )}

      <div className="space-y-3">
        {messages.map((msg, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-start gap-2">
              {msg.sender === 'user' ? <User size={20} /> : <Bot size={20} />}
              <div className="bg-neutral-100 dark:bg-neutral-700 rounded-md p-3 flex-1">
                <p className="text-sm font-medium mb-1">{msg.name}</p>
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {messages.length > 0 && !running && (
        <button onClick={reset} className="text-sm text-blue-500 underline">
          Reset
        </button>
      )}

      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        <strong>About this demo:</strong> This uses a Vercel Edge Function to generate
        CrewAI-style agent responses with OpenAI.
      </p>
    </div>
  )
}
