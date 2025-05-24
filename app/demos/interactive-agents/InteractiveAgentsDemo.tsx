'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Bot,
  User,
  ArrowRight,
  Code2,
  Megaphone,
  Feather,
  BarChart2,
  Palette,
  ClipboardList
} from 'lucide-react'
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
  const [multiMode, setMultiMode] = useState(false)
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const toggleAgent = (id: string) => {
    setSelectedAgents((prev) => {
      if (multiMode) {
        return prev.includes(id)
          ? prev.filter((a) => a !== id)
          : [...prev, id]
      }
      return prev.includes(id) ? [] : [id]
    })
  }

  // Sample goal suggestions
  const suggestions = [
    'Build a personal website',
    'Plan a marketing campaign',
    'Write a short story',
  ]

  const agentOptions = [
    { id: 'developer', name: 'Developer Agent', icon: Code2 },
    { id: 'marketing', name: 'Marketing Agent', icon: Megaphone },
    { id: 'writer', name: 'Creative Writer', icon: Feather },
    { id: 'data', name: 'Data Analyst', icon: BarChart2 },
    { id: 'designer', name: 'Designer Agent', icon: Palette },
    { id: 'pm', name: 'Project Manager', icon: ClipboardList }
  ]

  const timeouts = useRef<NodeJS.Timeout[]>([])

  useEffect(() => {
    return () => {
      timeouts.current.forEach(clearTimeout)
    }
  }, [])

  const startSimulation = async () => {
    if (!goal.trim() || selectedAgents.length === 0) return
    setRunning(true)
    setCurrentStep(0)
    setMessages([{ sender: 'user', name: 'You', text: goal }])

    try {
      const res = await fetch('/api/interactive-agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, agents: selectedAgents })
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
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={multiMode}
            onChange={(e) => setMultiMode(e.target.checked)}
          />
          Multi-agent mode
        </label>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {agentOptions.map((a) => {
          const Icon = a.icon
          const selected = selectedAgents.includes(a.id)
          return (
            <button
              key={a.id}
              onClick={() => toggleAgent(a.id)}
              className={`border rounded p-3 flex flex-col items-center gap-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 ${selected ? 'border-primary-500' : 'border-neutral-300 dark:border-neutral-600'}`}
            >
              <Icon />
              <span className="text-xs text-center">{a.name}</span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {selectedAgents.map((id) => {
          const a = agentOptions.find((x) => x.id === id)
          if (!a) return null
          return (
            <span
              key={id}
              className="text-xs bg-primary-500 text-white px-2 py-1 rounded-full"
            >
              {a.name}
            </span>
          )
        })}
      </div>

      <div className="flex gap-2">
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Enter a project or goal..."
          rows={1}
          className="flex-1 resize-y border border-neutral-300 dark:border-neutral-600 rounded px-3 py-2 bg-white dark:bg-neutral-800"
        />
        <button
          onClick={startSimulation}
          disabled={running || !goal.trim() || selectedAgents.length === 0}
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
              style={{ width: `${(currentStep / selectedAgents.length) * 100}%` }}
            />
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 text-right">
            Step {currentStep} / {selectedAgents.length}
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
        OpenAI agent responses.
      </p>
    </div>
  )
}
