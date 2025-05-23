'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'

interface Message {
  id: number
  role: 'user' | 'agent'
  text: string
}

const agentReplies = [
  "Hi there! I'm here to help you find the best solution for your business.",
  'Our product scales with your needs. What goals are you hoping to achieve?',
  "Great! I'll prepare a proposal and send it to your email shortly."
]

export default function SalesAgent() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: 'agent',
      text: 'Welcome to the AI Sales Agent demo. How can I assist you today?'
    }
  ])
  const [input, setInput] = useState('')
  const replyIndex = useRef(0)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = () => {
    if (!input.trim()) return

    const userMsg: Message = {
      id: Date.now(),
      role: 'user',
      text: input.trim()
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')

    const reply = agentReplies[replyIndex.current % agentReplies.length]
    replyIndex.current += 1
    const agentMsg: Message = {
      id: Date.now() + 1,
      role: 'agent',
      text: reply
    }
    setTimeout(() => {
      setMessages(prev => [...prev, agentMsg])
    }, 500)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
      <div className="h-80 overflow-y-auto space-y-4 mb-4" data-testid="messages">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`rounded-lg px-3 py-2 text-sm ${m.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'}`}>{m.text}</div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="flex">
        <input
          type="text"
          className="flex-grow border border-gray-300 dark:border-gray-600 rounded-l-md px-3 py-2 focus:outline-none"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
        />
        <button
          onClick={sendMessage}
          className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 transition-colors"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
