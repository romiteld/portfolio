"use client"

import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, ChevronDown, Info, AlertTriangle, Check, Send, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export type ChatMessage = {
  id: string
  text: string
  type: 'info' | 'warning' | 'success' | 'error' | 'tip' | 'user' | 'response'
  timestamp: Date
}

interface ChatBoxProps {
  messages: ChatMessage[]
  className?: string
  maxHeight?: string
  title?: string
  onSendMessage?: (message: string) => void
  inputRef?: React.RefObject<HTMLInputElement>
  isLoading?: boolean
}

const ChatBox = ({ 
  messages, 
  className = '',
  maxHeight = '15rem',
  title = 'Chess Assistant',
  onSendMessage,
  inputRef,
  isLoading = false
}: ChatBoxProps) => {
  const [isOpen, setIsOpen] = useState(true)
  const [messageText, setMessageText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const localInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (messageText.trim() && onSendMessage) {
      onSendMessage(messageText.trim())
      setMessageText('')
      
      // Focus the input again after sending
      setTimeout(() => {
        (inputRef || localInputRef).current?.focus()
      }, 0)
    }
  }

  const getMessageIcon = (type: ChatMessage['type']) => {
    switch (type) {
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />
      case 'success':
        return <Check className="w-4 h-4 text-green-500" />
      case 'error':
        return <X className="w-4 h-4 text-red-500" />
      case 'tip':
        return <MessageCircle className="w-4 h-4 text-purple-500" />
      case 'user':
        return <User className="w-4 h-4 text-gray-500" />
      case 'response':
        return <MessageCircle className="w-4 h-4 text-blue-500" />
    }
  }

  return (
    <div className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div 
        className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-500" />
          <h3 className="font-medium text-gray-800 dark:text-white">{title}</h3>
          {!isOpen && messages.length > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900 dark:text-blue-300">
              {messages.length}
            </span>
          )}
        </div>
        <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      
      {/* Messages */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div 
              className={`p-3 overflow-y-auto chatbox-messages-container max-h-[${maxHeight}]`}
            >
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 p-4">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No messages yet. I&apos;ll provide tips and analysis as the game progresses.</p>
                  <p className="text-sm mt-2">You can also ask me questions about chess strategies, rules, or your current position!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-2.5 rounded-lg flex items-start gap-2 ${
                        message.type === 'info' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300' :
                        message.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300' :
                        message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' :
                        message.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300' :
                        message.type === 'user' ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200' :
                        message.type === 'response' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300' :
                        'bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300'
                      }`}
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        {getMessageIcon(message.type)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{message.text}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
            
            {/* Message Input */}
            {onSendMessage && (
              <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2">
                <input
                  ref={inputRef || localInputRef}
                  type="text"
                  placeholder="Ask a chess question..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="w-full rounded-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!messageText.trim()}
                  className={`rounded-full p-2 transition-colors ${
                    messageText.trim() 
                      ? 'bg-blue-500 hover:bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  }`}
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ChatBox 