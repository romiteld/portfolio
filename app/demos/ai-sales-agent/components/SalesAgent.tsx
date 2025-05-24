'use client'

import React, { useRef, useEffect, useState } from 'react'
import {
  Send,
  Trash2,
  Info,
  Calendar,
  DollarSign,
  Mail
} from 'lucide-react'
import { useChatHistory, ChatMessage } from '@/hooks/use-chat-history'
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from '@/components/ui/card'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

const initialMessage: ChatMessage = {
  id: 0,
  role: 'agent',
  text: 'Welcome to the AI Sales Agent demo. How can I assist you today?'
}

const companySuggestions = [
  { name: 'OpenAI', logo: 'https://logo.clearbit.com/openai.com' },
  { name: 'Google', logo: 'https://logo.clearbit.com/google.com' },
  { name: 'Microsoft', logo: 'https://logo.clearbit.com/microsoft.com' },
  { name: 'Amazon', logo: 'https://logo.clearbit.com/amazon.com' },
  { name: 'Meta', logo: 'https://logo.clearbit.com/meta.com' },
]

const RECENT_KEY = 'salesAgentRecentCompanies'

export default function SalesAgent() {
  const { messages, setMessages, clearMessages } = useChatHistory([initialMessage])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [company, setCompany] = useState('')
  const [loadingInfo, setLoadingInfo] = useState(false)
  const [infoMessage, setInfoMessage] = useState('')
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem(RECENT_KEY)
      return stored ? (JSON.parse(stored) as string[]) : []
    } catch {
      return []
    }
  })
  const [showUndo, setShowUndo] = useState(false)
  const [lastMessages, setLastMessages] = useState<ChatMessage[]>([])
  const [companyInfo, setCompanyInfo] = useState<{name:string;articles:number;logo?:string}|null>(null)
  const [suggestions, setSuggestions] = useState<typeof companySuggestions>([])
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!company) {
      setSuggestions(companySuggestions)
      return
    }
    const filtered = companySuggestions.filter(c =>
      c.name.toLowerCase().includes(company.toLowerCase())
    )
    setSuggestions(filtered)
  }, [company])

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMsg: ChatMessage = {
      id: Date.now(),
      role: 'user',
      text: input.trim()
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')

    setIsTyping(true)
    try {
      const res = await fetch('/api/sales-agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.text, company: companyInfo?.name })
      })
      const data = await res.json()
      const agentMsg: ChatMessage = {
        id: Date.now() + 1,
        role: 'agent',
        text: data.reply || 'Sorry, something went wrong.'
      }
      setMessages(prev => [...prev, agentMsg])
    } catch (err) {
      console.error(err)
      const agentMsg: ChatMessage = {
        id: Date.now() + 1,
        role: 'agent',
        text: 'Error generating response.'
      }
      setMessages(prev => [...prev, agentMsg])
    } finally {
      setIsTyping(false)
    }
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
        setCompanyInfo({ name: company.trim(), articles: data.articlesCount, logo: data.logo || undefined })
        const updated = [company.trim(), ...recentSearches.filter(c => c !== company.trim())].slice(0,5)
        setRecentSearches(updated)
        localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
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

  const handleQuickAction = (text: string) => {
    setInput(text)
    setTimeout(sendMessage, 0)
  }

  const handleClear = () => {
    setLastMessages(messages)
    clearMessages()
    setShowUndo(true)
    setTimeout(() => setShowUndo(false), 10000)
  }

  const undoClear = () => {
    if (lastMessages.length) {
      setMessages(lastMessages)
    }
    setShowUndo(false)
  }

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
      <div className="mb-4 space-y-2">
        <div className="flex relative">
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
            className="px-4 py-2 bg-green-600 text-white rounded-r-md hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
          >
            {loadingInfo && <LoadingSpinner size="small" className="mr-2" />} 
            {loadingInfo ? 'Analyzing...' : 'Fetch Info'}
          </button>
          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow z-10">
              {suggestions.map(s => (
                <button key={s.name} onClick={() => setCompany(s.name)} className="flex items-center w-full px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">
                  <img src={s.logo} alt="logo" className="w-4 h-4 mr-2" /> {s.name}
                </button>
              ))}
              {recentSearches.map(r => (
                <button key={r} onClick={() => setCompany(r)} className="flex items-center w-full px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">
                  <img src="/placeholder-logo.png" alt="recent" className="w-4 h-4 mr-2" /> {r}
                </button>
              ))}
            </div>
          )}
        </div>
        {infoMessage && <p className="text-xs text-gray-600 dark:text-gray-300">{infoMessage}</p>}
        {companyInfo && (
          <Card className="mt-2 text-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <img src={companyInfo.logo || '/placeholder-logo.png'} alt="logo" className="w-6 h-6" />
                <span>{companyInfo.name}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Articles found: {companyInfo.articles}</p>
            </CardContent>
          </Card>
        )}
      </div>
      <div className="flex justify-end mb-2 space-x-2">
        {showUndo && (
          <Button variant="secondary" size="sm" onClick={undoClear}
            className="text-xs">
            Undo Clear
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="text-xs flex items-center">
          <Trash2 className="w-4 h-4 mr-1" /> Clear Chat
        </Button>
      </div>
      <div className="h-80 overflow-y-auto space-y-4 mb-4" data-testid="messages">
        {messages.map((m, idx) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} items-end`}>
            {m.role === 'agent' && (
              <Avatar className="mr-2 w-8 h-8">
                <AvatarImage src="/placeholder-user.jpg" alt="Alex" />
                <AvatarFallback>A</AvatarFallback>
              </Avatar>
            )}
            <div className={`rounded-lg px-3 py-2 text-sm ${m.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'}`}>{m.text}</div>
            {m.role === 'user' && <div className="ml-2 w-8" />}
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start items-end">
            <Avatar className="mr-2 w-8 h-8">
              <AvatarImage src="/placeholder-user.jpg" alt="Alex" />
              <AvatarFallback>A</AvatarFallback>
            </Avatar>
            <div className="rounded-lg px-3 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 flex items-center">
              Alex is typing...
              <LoadingSpinner size="small" className="ml-2" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      {messages.length > 0 && messages[messages.length - 1].role === 'agent' && (
        <div className="flex flex-wrap gap-2 mb-4">
          <Button size="sm" variant="secondary" onClick={() => handleQuickAction('Tell me more')}> <Info className="w-4 h-4" /> Tell me more</Button>
          <Button size="sm" variant="secondary" onClick={() => handleQuickAction('Schedule a demo')}> <Calendar className="w-4 h-4" /> Schedule a demo</Button>
          <Button size="sm" variant="secondary" onClick={() => handleQuickAction('Get pricing')}> <DollarSign className="w-4 h-4" /> Get pricing</Button>
          <Button size="sm" variant="secondary" onClick={() => handleQuickAction('Contact sales team')}> <Mail className="w-4 h-4" /> Contact sales team</Button>
        </div>
      )}
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
