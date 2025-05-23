'use client'

import React, { useRef, useEffect, useState } from 'react'
import { Send, Trash2 } from 'lucide-react'
import { useChatHistory, ChatMessage } from '@/hooks/use-chat-history'


const agentReplies = [
  "Hi there! I'm here to help you find the best solution for your business.",
  'Our product scales with your needs. What goals are you hoping to achieve?',
  "Great! I'll prepare a proposal and send it to your email shortly."
]

const initialMessage: ChatMessage = {
  id: 0,
  role: 'agent',
  text: 'Welcome to the AI Sales Agent demo. How can I assist you today?'
}

export default function SalesAgent() {
  const { messages, setMessages, clearMessages } = useChatHistory([initialMessage])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [company, setCompany] = useState('')
  const [loadingInfo, setLoadingInfo] = useState(false)
  const [infoMessage, setInfoMessage] = useState('')
  const replyIndex = useRef(0)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = () => {
    if (!input.trim()) return

    const userMsg: ChatMessage = {
      id: Date.now(),
      role: 'user',
      text: input.trim()
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')

    const reply = agentReplies[replyIndex.current % agentReplies.length]
    replyIndex.current += 1
    setIsTyping(true)
    setTimeout(() => {
      const agentMsg: ChatMessage = {
        id: Date.now() + 1,
        role: 'agent',
        text: reply
      }
      setMessages(prev => [...prev, agentMsg])
      setIsTyping(false)
    }, 500)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      sendMessage()
    }
  }

  const fetchCompanyInfo = async () => {
    if (!company.trim()) return
    setLoadingInfo(true)
    setInfoMessage('')
    try {
      const res = await fetch('/api/sales-agent/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: company.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setInfoMessage(`Loaded info for ${company.trim()} (${data.articlesCount} articles)`) 
      } else {
        setInfoMessage(data.error || 'Failed to fetch info')
      }
    } catch (err) {
      console.error(err)
      setInfoMessage('Error fetching info')
    } finally {
      setLoadingInfo(false)
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
      <div className="mb-4 space-y-2">
        <div className="flex">
          <input
            type="text"
            className="flex-grow border border-gray-300 dark:border-gray-600 rounded-l-md px-3 py-2 focus:outline-none"
            value={company}
            onChange={e => setCompany(e.target.value)}
            placeholder="Enter company name"
          />
          <button
            onClick={fetchCompanyInfo}
            disabled={loadingInfo}
            className="px-4 py-2 bg-green-600 text-white rounded-r-md hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loadingInfo ? 'Loading...' : 'Fetch Info'}
          </button>
        </div>
        {infoMessage && <p className="text-xs text-gray-600 dark:text-gray-300">{infoMessage}</p>}
      </div>
      <div className="flex justify-end mb-2">
        <button
          onClick={clearMessages}
          className="flex items-center text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <Trash2 className="w-4 h-4 mr-1" /> Clear Chat
        </button>
      </div>
      <div className="h-80 overflow-y-auto space-y-4 mb-4" data-testid="messages">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`rounded-lg px-3 py-2 text-sm ${m.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'}`}>{m.text}</div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="rounded-lg px-3 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100">Agent is typing...</div>
          </div>
        )}
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
