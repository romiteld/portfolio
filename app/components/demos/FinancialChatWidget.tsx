"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import {
  BarChart3,
  TrendingUp,
  CircleDollarSign,
  Send,
  User,
  MessageSquare,
  RefreshCw,
  Clock,
  AlertCircle,
  Bot,
  Zap
} from "lucide-react"
import { gsap } from "gsap"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp?: Date
  isLoading?: boolean
  isRealTimeData?: boolean
  marketData?: {
    index: string
    value: string
    change: number
    direction: string
    updated: string
  }
}

interface MarketData {
  symbol: string
  price: number
  change: number
  changePercent: number
}

export default function FinancialChatWidget() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm your AI-powered Financial Market Assistant. I can help with market data, investment strategies, portfolio analysis, and financial news. How can I assist you today?",
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [chatHistory, setChatHistory] = useState<string[]>([])
  const [marketData, setMarketData] = useState<MarketData[]>([
    { symbol: "AAPL", price: 173.44, change: 1.23, changePercent: 0.71 },
    { symbol: "MSFT", price: 337.22, change: -2.15, changePercent: -0.63 },
    { symbol: "GOOGL", price: 142.56, change: 0.89, changePercent: 0.63 },
    { symbol: "AMZN", price: 178.35, change: 1.56, changePercent: 0.88 }
  ])
  const [isRefreshingData, setIsRefreshingData] = useState(false)
  const [isUsingSimulatedData, setIsUsingSimulatedData] = useState(true)
  const [apiStatusMessage, setApiStatusMessage] = useState<string>("")
  const [refreshTime, setRefreshTime] = useState<string>("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [typingIndicator, setTypingIndicator] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string>("")
  const [autoScroll, setAutoScroll] = useState(true)
  const [isScrolledUp, setIsScrolledUp] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Refs for GSAP animations
  const sendButtonRef = useRef<HTMLButtonElement>(null)
  const stockItemsRef = useRef<HTMLDivElement[]>([])
  const marketDataContainerRef = useRef<HTMLDivElement>(null)
  const logoIconRef = useRef<SVGSVGElement>(null)

  // Add new refs for market indices animations
  const marketInsightsRef = useRef<HTMLDivElement>(null)
  const liveDataBadgeRefs = useRef<(HTMLSpanElement | null)[]>([])

  // Generate a unique session ID for this chat
  useEffect(() => {
    setSessionId(`user-${Math.random().toString(36).substring(2, 12)}`)
  }, [])

  // Auto-scroll to the bottom when messages change, but only for new messages
  useEffect(() => {
    if (autoScroll && messages.length > 1 && isMounted) {
      scrollToBottom()
    }
  }, [messages.length, autoScroll, isMounted])

  // Prevent scrolling to the widget on initial load
  useEffect(() => {
    if (isMounted) {
      const timer = setTimeout(() => {
        window.scrollTo(0, 0)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isMounted])

  // Set initial refresh time after component mounts (client-side only)
  useEffect(() => {
    setRefreshTime(new Date().toLocaleTimeString())
  }, [])

  // Detect when user has scrolled up
  useEffect(() => {
    const chatContainer = chatContainerRef.current
    if (!chatContainer) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = chatContainer
      const isScrolled = scrollHeight - scrollTop - clientHeight > 100
      setIsScrolledUp(isScrolled)
    }

    chatContainer.addEventListener("scroll", handleScroll)
    return () => chatContainer.removeEventListener("scroll", handleScroll)
  }, [])

  // Load chat history and suggestions
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await fetch(`/api/market/chat?userId=${sessionId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.suggestions && Array.isArray(data.suggestions)) {
            setChatHistory(data.suggestions)
          } else {
            setChatHistory([
              "What are the best tech stocks to invest in?",
              "How is the S&P 500 performing today?",
              "Explain market volatility"
            ])
          }
        } else {
          throw new Error("Failed to load chat history")
        }
      } catch (error) {
        console.error("Error loading chat history:", error)
        setChatHistory([
          "What are the best tech stocks to invest in?",
          "How is the S&P 500 performing today?",
          "Explain market volatility"
        ])
      }
    }

    if (sessionId) {
      loadHistory()
    }
  }, [sessionId])

  // Refresh market data
  const refreshMarketData = async () => {
    setIsRefreshingData(true)
    setApiStatusMessage("")

    try {
      const response = await fetch("/api/market/data")
      console.log(`Market data response status: ${response.status}`)

      if (response.ok) {
        const data = await response.json()

        if (data.rateLimited) {
          const waitTime = data.rateLimitWaitTime || 60
          setApiStatusMessage(`Rate limit exceeded. Try again in ${waitTime} seconds.`)
          setIsRefreshingData(false)
          return
        }

        if (data.stocks && data.stocks.length > 0) {
          setMarketData(data.stocks)
          setIsUsingSimulatedData(data.isSimulated || false)
          setRefreshTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))

          if (data.authError) {
            setApiStatusMessage("Authentication failed. Please check your Alpaca API credentials.")
          } else if (data.apiError) {
            setApiStatusMessage(data.apiError)
          } else if (data.fromCache) {
            setApiStatusMessage("Using cached data (refreshes every 30 seconds).")
          }
        } else {
          setApiStatusMessage("Invalid market data format received")
        }
      } else {
        setApiStatusMessage(`API error: ${response.status}`)
        console.error(`Failed to fetch market data: ${response.status}`)
      }
    } catch (error) {
      console.error("Error refreshing market data:", error)
      setApiStatusMessage(error instanceof Error ? error.message : "Unknown error")
    } finally {
      setIsRefreshingData(false)
    }
  }

  // Load market data on initial load
  useEffect(() => {
    refreshMarketData()
  }, [])

  // Set isMounted to true after client-side hydration
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (!messagesEndRef.current || !chatContainerRef.current) return

    try {
      const messageEnd = messagesEndRef.current
      requestAnimationFrame(() => {
        messageEnd.scrollIntoView({
          behavior: window.innerWidth < 768 ? "auto" : "smooth",
          block: "end"
        })

        if (window.innerWidth < 768) {
          setTimeout(() => {
            chatContainerRef.current?.scrollTo({
              top: chatContainerRef.current.scrollHeight,
              behavior: "auto"
            })
            setIsScrolledUp(false)
          }, 100)
        }
      })

      setAutoScroll(true)
      setIsScrolledUp(false)
    } catch (err) {
      console.error("Error scrolling to bottom:", err)
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (input.trim() === "" || isLoading) return

    setError(null)

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date()
    }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setTypingIndicator(true)

    setTimeout(() => {
      if (autoScroll) {
        scrollToBottom()
      }
    }, 100)

    try {
      const response = await fetch("/api/market/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          userId: sessionId,
          marketData: {
            stocks: marketData,
            isSimulated: isUsingSimulatedData,
            lastUpdated: new Date().toISOString()
          }
        })
      })
      const data = await response.json()
      setTypingIndicator(false)

      if (response.status === 429 || data.rateLimited) {
        const waitTime = data.waitTime || 60
        const rateError = data.error || `Rate limit exceeded. Please wait ${waitTime} seconds before trying again.`
        setError(rateError)

        const rateMessage: Message = {
          role: "assistant",
          content: `⚠️ ${rateError} To prevent API abuse, we limit the number of requests. Please try again shortly.`,
          timestamp: new Date()
        }
        setMessages((prev) => [...prev, rateMessage])
        return
      }

      if (response.ok && data.message) {
        const botResponse: Message = {
          role: "assistant",
          content: data.message,
          timestamp: new Date()
        }

        if (data.source === "index_api" && data.raw_data) {
          botResponse.isRealTimeData = true
          botResponse.marketData = data.raw_data
        }

        setMessages((prev) => [...prev, botResponse])
      } else {
        throw new Error(data.error || "Failed to get response")
      }
    } catch (error) {
      console.error("Chat error:", error)
      setTypingIndicator(false)
      setError(error instanceof Error ? error.message : "Failed to send message")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle input focus without triggering scroll
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (window.innerWidth < 768) {
      setTimeout(() => {
        e.currentTarget.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 100)
    }
    setAutoScroll(false)
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
  }

  // Format timestamp
  const formatTime = (date?: Date) => {
    if (!date || !isMounted) return ""
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Prevent parent scroll when chat is scrolled
  useEffect(() => {
    const chatContainer = chatContainerRef.current
    if (!chatContainer) return

    const preventParentScroll = (e: WheelEvent) => {
      const { scrollTop, scrollHeight, clientHeight } = chatContainer
      const isScrolledToBottom = Math.ceil(scrollHeight - scrollTop) <= clientHeight
      const isScrolledToTop = scrollTop === 0

      if ((isScrolledToTop && e.deltaY < 0) || (isScrolledToBottom && e.deltaY > 0)) return
      e.preventDefault()
    }

    chatContainer.addEventListener("wheel", preventParentScroll, { passive: false })
    return () => chatContainer.removeEventListener("wheel", preventParentScroll)
  }, [])

  // Reset the stock items ref array when market data changes
  useEffect(() => {
    stockItemsRef.current = []
  }, [marketData])

  // GSAP animations…

  return (
    <div
      className="grid md:grid-cols-4 gap-4 h-auto md:h-[600px] relative"
      data-component-name="FinancialAssistantDemo"
    >
      {/* Main chat area */}
      <div className="md:col-span-3 flex flex-col rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-md overflow-hidden h-auto md:h-[600px]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 dark:bg-primary-700 text-white p-4 flex items-center justify-between shadow-sm relative">
          <div className="absolute inset-0 bg-repeat opacity-10 pattern-grid-lg dark:opacity-0"></div>
          <div className="absolute left-3 w-10 h-10 rounded-full bg-white/10 animate-pulse-slow"></div>
          <div className="flex items-center relative z-10">
            <CircleDollarSign className="mr-2 text-white/90" ref={logoIconRef} />
            <h2 className="font-bold tracking-wide">Financial Market Assistant</h2>
          </div>
          <div className="flex space-x-2">
            <button
              className={`text-xs ${
                autoScroll
                  ? "bg-primary-800/40 dark:bg-primary-900 backdrop-blur-sm"
                  : "bg-primary-700/40 dark:bg-primary-800 backdrop-blur-sm"
              } hover:bg-primary-800/60 dark:hover:bg-primary-900 py-1 px-2 rounded flex items-center`}
              onClick={(e) => {
                e.stopPropagation()
                setAutoScroll(!autoScroll)
              }}
              title={autoScroll ? "Disable auto-scroll" : "Enable auto-scroll"}
            >
              <MessageSquare size={14} className="mr-1" />
              {autoScroll ? "Auto-scroll On" : "Auto-scroll Off"}
            </button>
            <button
              className="text-xs bg-primary-700/40 hover:bg-primary-800/60 dark:bg-primary-800 dark:hover:bg-primary-900 backdrop-blur-sm py-1 px-2 rounded flex items-center"
              onClick={(e) => {
                e.stopPropagation()
                refreshMarketData()
              }}
              disabled={isRefreshingData}
            >
              <RefreshCw size={14} className={`${isRefreshingData ? "animate-spin" : ""} mr-1`} />
              Refresh Data
            </button>
          </div>
        </div>

        {/* Chat messages area */}
        <div
          className="flex-1 p-3 sm:p-4 overflow-y-auto bg-neutral-50 dark:bg-neutral-900 relative"
          ref={chatContainerRef}
          data-component-name="FinancialChatMessages"
        >
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} mb-4`}
            >
              <div
                className={`max-w-[90%] sm:max-w-[90%] md:max-w-[80%] p-3 sm:p-3.5 rounded-lg shadow-sm ${
                  message.role === "user"
                    ? "bg-primary-500 text-white rounded-tr-none"
                    : message.isRealTimeData
                    ? "bg-gradient-to-r from-primary-800/70 to-primary-600/70 text-white rounded-tl-none border border-primary-400/30"
                    : "bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-tl-none"
                }`}
              >
                <div className="flex items-center mb-2 justify-between">
                  <div className="flex items-center">
                    {message.role === "user" ? (
                      <>
                        <span className="font-medium text-sm mr-2">You</span>
                        <User size={14} />
                      </>
                    ) : (
                      <>
                        <span className="font-medium text-sm mr-2">Financial Assistant</span>
                        <Bot size={14} />
                        {message.isRealTimeData && (
                          <span
                            className="ml-2 text-xs py-0.5 px-1.5 bg-green-500/20 rounded-full text-green-200 border border-green-500/30 flex items-center"
                            ref={(el) => {
                              if (el && !liveDataBadgeRefs.current.includes(el)) {
                                liveDataBadgeRefs.current.push(el)
                              }
                            }}
                          >
                            <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1"></div>
                            Live Data
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  {message.timestamp && isMounted && (
                    <div className="text-xs opacity-70 flex items-center ml-2">
                      <Clock size={10} className="mr-1" />
                      {formatTime(message.timestamp)}
                    </div>
                  )}
                </div>
                <p className="text-[14px] sm:text-base whitespace-pre-wrap leading-relaxed">
                  {message.content}
                </p>

                {/* Real-time data block */}
                {message.isRealTimeData && message.marketData && (
                  <div className="mt-2 pt-2 border-t border-white/20 text-sm sm:text-xs">
                    <div className="flex justify-between items-center">
                      <span className="opacity-80">Index Value:</span>
                      <span className="font-mono font-medium">{message.marketData.value}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="opacity-80">Change:</span>
                      <span
                        className={`font-mono font-medium ${
                          message.marketData.change >= 0 ? "text-green-300" : "text-red-300"
                        }`}
                      >
                        {message.marketData.change >= 0 ? "+" : ""}
                        {message.marketData.change}%
                      </span>
                    </div>
                    <div className="text-right mt-1 opacity-70">
                      Updated: {new Date(message.marketData.updated).toLocaleTimeString()}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {/* Typing indicator */}
          {typingIndicator && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start mb-4">
              <div className="bg-neutral-200 dark:bg-neutral-700 p-3 rounded-lg rounded-tl-none">
                <div className="flex items-center">
                  <span className="text-xs text-neutral-600 dark:text-neutral-400 mr-2">
                    AI Assistant is typing
                  </span>
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500 animate-bounce" />
                    <div className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500 animate-bounce delay-150" />
                    <div className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500 animate-bounce delay-300" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Error display */}
          {error && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center mb-4">
              <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 p-2 rounded-lg text-xs flex items-center">
                <AlertCircle size={12} className="mr-1" />
                Error: {error}
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />

          {/* Scroll-to-bottom button */}
          {isScrolledUp && !autoScroll && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                scrollToBottom()
              }}
              className="absolute bottom-4 right-4 z-10 p-2 bg-primary-500 text-white rounded-full shadow-lg hover:bg-primary-600 transition-colors"
              aria-label="Scroll to bottom"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <polyline points="19 12 12 19 5 12"></polyline>
              </svg>
            </button>
          )}
        </div>

        {/* Input area */}
        <form
          onSubmit={handleSubmit}
          className="p-2 sm:p-4 border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 sticky bottom-0 z-30"
        >
          <div className="flex">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={handleInputFocus}
              placeholder="Ask about stocks or crypto..."
              disabled={isLoading}
              className="flex-1 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-l-md bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[45px] sm:min-h-[50px] text-base"
              style={{
                fontSize: "16px",
                lineHeight: 1.4,
                WebkitTextSizeAdjust: "100%",
                textSizeAdjust: "100%"
              }}
            />
            <button
              type="submit"
              disabled={isLoading || input.trim() === ""}
              className="bg-primary-500 hover:bg-primary-600 text-white p-2 rounded-r-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[45px] sm:min-h-[50px] min-w-[45px] sm:min-w-[50px] flex items-center justify-center"
              aria-label="Send message"
              ref={sendButtonRef}
            >
              <Send size={20} />
            </button>
          </div>

          {/* Smart Suggestions */}
          <div className="mt-2 flex flex-wrap gap-1 sm:gap-2">
            {chatHistory.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation()
                  handleSuggestionClick(suggestion)
                }}
                disabled={isLoading}
                className="text-sm sm:text-xs bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 py-1.5 sm:py-1 px-3 sm:px-2 rounded-full transition-colors flex items-center"
              >
                <Zap size={12} className="mr-1.5 sm:mr-1 text-primary-500" />
                {suggestion}
              </button>
            ))}
          </div>

          {/* Status Message (hidden on mobile) */}
          <div className="hidden sm:flex mt-1 sm:mt-2 justify-between items-center text-[10px] sm:text-xs text-neutral-500">
            <p className="truncate max-w-full">
              {isUsingSimulatedData
                ? "Demo mode: Using simulated data."
                : "Connected to live market data."}
              {apiStatusMessage && <span className="ml-1 text-amber-500">{apiStatusMessage}</span>}
            </p>
            <div className="flex items-center">
              <Clock size={10} className="mr-1" />
              <span>Updated: {refreshTime}</span>
            </div>
          </div>
        </form>
      </div>

      {/* Market data sidebar */}
      <div
        className="hidden md:flex md:col-span-1 flex-col rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-md overflow-hidden"
        ref={marketDataContainerRef}
      >
        {/* sidebar content unchanged… */}
      </div>
    </div>
  )
}
