'use client'

import { useState } from 'react'
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

  const startSimulation = () => {
    if (!goal.trim()) return
    setRunning(true)
    setMessages([{ sender: 'user', name: 'You', text: goal }])

    const steps = [
      { name: 'Research Agent', text: `I'll gather key facts about ${goal}.` },
      { name: 'Planning Agent', text: `Here is a short plan to accomplish ${goal}.` },
      { name: 'Writing Agent', text: `Based on the research and plan, here is a brief summary.` },
    ]

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setMessages((prev) => [...prev, { sender: 'agent', ...step }])
        if (idx === steps.length - 1) setRunning(false)
      }, 1000 * (idx + 1))
    })
  }

  const reset = () => {
    setGoal('')
    setMessages([])
    setRunning(false)
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
        <strong>About this demo:</strong> This simulates a simple multi-agent collaboration inspired by CrewAI. The responses are pre-defined for demonstration purposes.
      </p>
    </div>
  )
}
