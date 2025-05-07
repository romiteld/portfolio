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

  // Animation refs
  const sendButtonRef = useRef<HTMLButtonElement>(null)
  const stockItemsRef = useRef<HTMLDivElement[]>([])
  const marketDataContainerRef = useRef<HTMLDivElement>(null)
  const logoIconRef = useRef<SVGSVGElement>(null)
  const marketInsightsRef = useRef<HTMLDivElement>(null)
  const liveDataBadgeRefs = useRef<(HTMLSpanElement | null)[]>([])

  // Generate a unique session ID
  useEffect(() => {
    setSessionId(`user-${Math.random().toString(36).substring(2, 12)}`)
  }, [])

  // Auto-scroll new messages (after mount)
  useEffect(() => {
    if (autoScroll && messages.length > 1 && isMounted) {
      scrollToBottom()
    }
  }, [messages.length, autoScroll, isMounted])

  // Prevent page scroll on mount
  useEffect(() => {
    if (isMounted) {
      const timer = setTimeout(() => window.scrollTo(0, 0), 100)
      return () => clearTimeout(timer)
    }
  }, [isMounted])

  // Mark as mounted
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Initial refresh time
  useEffect(() => {
    setRefreshTime(new Date().toLocaleTimeString())
  }, [])

  // Detect user scrolling up in chat
  useEffect(() => {
    const container = chatContainerRef.current
    if (!container) return
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      setIsScrolledUp(scrollHeight - scrollTop - clientHeight > 100)
    }
    container.addEventListener("scroll", onScroll)
    return () => container.removeEventListener("scroll", onScroll)
  }, [])

  // Prevent parent page from scrolling when over chat
  useEffect(() => {
    const container = chatContainerRef.current
    if (!container) return
    const handler = (e: WheelEvent) => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const atTop = scrollTop === 0 && e.deltaY < 0
      const atBottom = Math.ceil(scrollHeight - scrollTop) <= clientHeight && e.deltaY > 0
      if (!atTop && !atBottom) e.preventDefault()
    }
    container.addEventListener("wheel", handler, { passive: false })
    return () => container.removeEventListener("wheel", handler)
  }, [])

  // Load chat suggestions
  useEffect(() => {
    if (!sessionId) return
    const load = async () => {
      try {
        const res = await fetch(`/api/market/chat?userId=${sessionId}`)
        if (!res.ok) throw new Error()
        const data = await res.json()
        setChatHistory(Array.isArray(data.suggestions)
          ? data.suggestions
          : [
              "What are the best tech stocks to invest in?",
              "How is the S&P 500 performing today?",
              "Explain market volatility"
            ])
      } catch {
        setChatHistory([
          "What are the best tech stocks to invest in?",
          "How is the S&P 500 performing today?",
          "Explain market volatility"
        ])
      }
    }
    load()
  }, [sessionId])

  // Fetch real‑time market data
  const refreshMarketData = async () => {
    setIsRefreshingData(true)
    setApiStatusMessage("")
    try {
      const res = await fetch("/api/market/data")
      const data = await res.json()
      if (res.status === 429 || data.rateLimited) {
        setApiStatusMessage(`Rate limit exceeded. Try again in ${data.waitTime || 60}s.`)
      } else if (Array.isArray(data.stocks)) {
        setMarketData(data.stocks)
        setRefreshTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))
        if (data.authError) {
          setApiStatusMessage("Authentication failed. Please check your API credentials.")
        } else if (data.apiError) {
          setApiStatusMessage(data.apiError)
        } else {
          setApiStatusMessage("")
        }
      } else {
        setApiStatusMessage("Invalid market data format.")
      }
    } catch (err: any) {
      setApiStatusMessage(err.message || "Unknown error")
    } finally {
      setIsRefreshingData(false)
    }
  }

  // Initial data load
  useEffect(() => {
    refreshMarketData()
  }, [])

  // Scroll helper
  const scrollToBottom = () => {
    if (!messagesEndRef.current || !chatContainerRef.current) return
    requestAnimationFrame(() => {
      messagesEndRef.current!.scrollIntoView({
        behavior: window.innerWidth < 768 ? "auto" : "smooth",
        block: "end"
      })
      if (window.innerWidth < 768) {
        setTimeout(() => {
          chatContainerRef.current!.scrollTo({
            top: chatContainerRef.current!.scrollHeight,
            behavior: "auto"
          })
          setIsScrolledUp(false)
        }, 100)
      }
    })
    setAutoScroll(true)
    setIsScrolledUp(false)
  }

  // Send a chat message
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!input.trim() || isLoading) return
    setError(null)
    const userMsg: Message = { role: "user", content: input, timestamp: new Date() }
    setMessages((m) => [...m, userMsg])
    setInput("")
    setIsLoading(true)
    setTypingIndicator(true)
    setTimeout(() => { if (autoScroll) scrollToBottom() }, 100)

    try {
      const res = await fetch("/api/market/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          userId: sessionId,
          marketData: {
            stocks: marketData,
            lastUpdated: new Date().toISOString()
          }
        })
      })
      const data = await res.json()
      setTypingIndicator(false)

      if (res.status === 429 || data.rateLimited) {
        const msg = data.error || `Rate limit: wait ${data.waitTime || 60}s.`
        setError(msg)
        setMessages((m) => [...m, { role: "assistant", content: `⚠️ ${msg}`, timestamp: new Date() }])
      } else if (res.ok && data.message) {
        const botMsg: Message = { role: "assistant", content: data.message, timestamp: new Date() }
        if (data.source === "index_api" && data.raw_data) {
          botMsg.isRealTimeData = true
          botMsg.marketData = data.raw_data
        }
        setMessages((m) => [...m, botMsg])
      } else {
        throw new Error(data.error || "Failed to get response")
      }
    } catch (err: any) {
      setTypingIndicator(false)
      setError(err.message || "Chat error")
    } finally {
      setIsLoading(false)
    }
  }

  // Keep input visible on mobile
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (window.innerWidth < 768) {
      setTimeout(() => e.currentTarget.scrollIntoView({ behavior: "smooth", block: "center" }), 100)
    }
    setAutoScroll(false)
  }

  // Quick suggestion click
  const handleSuggestionClick = (s: string) => {
    setInput(s)
  }

  // Format timestamps
  const formatTime = (d?: Date) => {
    if (!d || !isMounted) return ""
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // GSAP animations for the send button
  useEffect(() => {
    const btn = sendButtonRef.current
    if (!btn) return
    gsap.set(btn, { scale: 1, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" })
    const hover = () => {
      if (!isLoading && input.trim()) gsap.to(btn, { scale: 1.1, boxShadow: "0 4px 12px rgba(59,130,246,0.3)", duration: 0.3 })
    }
    const leave = () => gsap.to(btn, { scale: 1, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", duration: 0.3 })
    const click = () => {
      if (!isLoading && input.trim()) {
        gsap.timeline()
          .to(btn, { scale: 0.9, duration: 0.1 })
          .to(btn, { scale: 1, duration: 0.2, ease: "back.out(3)" })
      }
    }
    btn.addEventListener("mouseenter", hover)
    btn.addEventListener("mouseleave", leave)
    btn.addEventListener("mousedown", click)
    return () => {
      btn.removeEventListener("mouseenter", hover)
      btn.removeEventListener("mouseleave", leave)
      btn.removeEventListener("mousedown", click)
    }
  }, [isLoading, input])

  // Animate stock items on data change
  useEffect(() => {
    stockItemsRef.current = []
  }, [marketData])

  useEffect(() => {
    if (stockItemsRef.current.length) {
      gsap.set(stockItemsRef.current, { clearProps: "all" })
      gsap.fromTo(
        stockItemsRef.current,
        { y: 15, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.5, stagger: 0.1, ease: "power2.out" }
      )
    }
  }, [marketData, refreshTime])

  // Refresh animation
  useEffect(() => {
    if (isRefreshingData && marketDataContainerRef.current) {
      gsap.to(marketDataContainerRef.current, { opacity: 0.7, duration: 0.2, yoyo: true, repeat: 1 })
    }
  }, [isRefreshingData])

  // Animate insights
  useEffect(() => {
    if (marketInsightsRef.current) {
      gsap.fromTo(
        marketInsightsRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.6, delay: 0.3 }
      )
    }
  }, [refreshTime])

  // Animate live badge
  useEffect(() => {
    liveDataBadgeRefs.current.forEach((badge) => {
      if (!badge) return
      const dot = badge.querySelector("div")
      if (dot) {
        gsap.to(dot, { scale: 1.3, opacity: 1, duration: 0.8, repeat: -1, yoyo: true })
        gsap.to(badge, { boxShadow: "0 0 8px rgba(34,197,94,0.3)", duration: 1.5, repeat: -1, yoyo: true })
      }
    })
  }, [liveDataBadgeRefs.current.length])

  // Animate logo
  useEffect(() => {
    const icon = logoIconRef.current
    if (!icon) return
    gsap.set(icon, { scale: 1, rotation: 0 })
    gsap.to(icon, { rotation: 360, duration: 20, repeat: -1, ease: "linear" })
    const over = () => gsap.to(icon, { scale: 1.2, duration: 0.3, ease: "back.out(2)" })
    const out = () => gsap.to(icon, { scale: 1, duration: 0.3 })
    icon.addEventListener("mouseenter", over)
    icon.addEventListener("mouseleave", out)
    return () => {
      icon.removeEventListener("mouseenter", over)
      icon.removeEventListener("mouseleave", out)
    }
  }, [])

  return (
    <div className="flex flex-col md:grid md:grid-cols-4 gap-4 min-h-[100dvh] relative">
      {/* Main chat area */}
      <div className="md:col-span-3 flex flex-col flex-1 min-h-0 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-md overflow-hidden md:h-[600px]">
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

        {/* Chat messages */}
        <div
          className="flex-1 min-h-0 p-3 sm:p-4 overflow-y-auto bg-neutral-50 dark:bg-neutral-900 relative"
          ref={chatContainerRef}
        >
          {messages.map((message, idx) => (
            <motion.div
              key={idx}
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

          {typingIndicator && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start mb-4">
              <div className="bg-neutral-200 dark:bg-neutral-700 p-3 rounded-lg rounded-tl-none">
                <div className="flex items-center">
                  <span className="text-xs text-neutral-600 dark:text-neutral-400 mr-2">
                    AI Assistant is typing
                  </span>
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500 animate-bounce"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500 animate-bounce delay-150"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500 animate-bounce delay-300"></div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center mb-4">
              <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 p-2 rounded-lg text-xs flex items-center">
                <AlertCircle size={12} className="mr-1" />
                Error: {error}
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
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

        {/* Input */}
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
              disabled={isLoading || !input.trim()}
              className="bg-primary-500 hover:bg-primary-600 text-white p-2 rounded-r-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[45px] sm:min-h-[50px] min-w-[45px] sm:min-w-[50px] flex items-center justify-center"
              aria-label="Send message"
              ref={sendButtonRef}
            >
              <Send size={20} />
            </button>
          </div>

          {/* Suggestions */}
          <div className="mt-2 flex flex-wrap gap-1 sm:gap-2">
            {chatHistory.map((s, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation()
                  handleSuggestionClick(s)
                }}
                disabled={isLoading}
                className="text-sm sm:text-xs bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 py-1.5 sm:py-1 px-3 sm:px-2 rounded-full transition-colors flex items-center"
              >
                <Zap size={12} className="mr-1.5 sm:mr-1 text-primary-500" />
                {s}
              </button>
            ))}
          </div>

          {/* Status */}
          <div className="hidden sm:flex mt-1 sm:mt-2 justify-between items-center text-[10px] sm:text-xs text-neutral-500">
            <p className="truncate max-w-full">
              Connected to live market data.
              {apiStatusMessage && <span className="ml-1 text-amber-500">{apiStatusMessage}</span>}
            </p>
            <div className="flex items-center">
              <Clock size={10} className="mr-1" />
              <span>Updated: {refreshTime}</span>
            </div>
          </div>
        </form>
      </div>

      {/* Sidebar */}
      <div
        className="hidden md:flex md:col-span-1 flex-col rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-md overflow-hidden"
        ref={marketDataContainerRef}
      >
        <div className="bg-neutral-100 dark:bg-neutral-700 p-3 border-b border-neutral-200 dark:border-neutral-600">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm flex items-center">
              <BarChart3 size={16} className="mr-1" /> Market Data
            </h3>
            <span className="text-xs text-green-500">Live</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <div className="space-y-3">
            {marketData.map((stock, idx) => (
              <div
                key={stock.symbol}
                className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 transition-all duration-300"
                ref={(el) => {
                  if (el && !stockItemsRef.current.includes(el)) stockItemsRef.current.push(el)
                }}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold">{stock.symbol}</span>
                  <span className="font-mono">${stock.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">Change</span>
                  <span
                    className={`text-xs flex items-center ${
                      stock.change >= 0 ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {stock.change >= 0 ? (
                      <TrendingUp size={12} className="mr-1" />
                    ) : (
                      <TrendingUp size={12} className="mr-1 transform rotate-180" />
                    )}
                    {stock.change > 0 ? "+" : ""}
                    {stock.change.toFixed(2)} ({stock.changePercent > 0 ? "+" : ""}
                    {stock.changePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-lg bg-neutral-100 dark:bg-neutral-700" ref={marketInsightsRef}>
            <h4 className="text-xs font-medium mb-2 flex items-center">
              <BarChart3 size={12} className="mr-1" /> Market Insights
            </h4>
            <ul className="text-xs space-y-2">
              <li className="flex justify-between items-center transition-all duration-300 hover:translate-x-1">
                <span className="text-gray-500 dark:text-gray-400">• S&P 500:</span>
                <span className="text-green-500">+0.4%</span>
              </li>
              <li className="flex justify-between items-center transition-all duration-300 hover:translate-x-1">
                <span className="text-gray-500 dark:text-gray-400">• Nasdaq:</span>
                <span className="text-green-500">+0.7%</span>
              </li>
              <li className="flex justify-between items-center transition-all duration-300 hover:translate-x-1">
                <span className="text-gray-500 dark:text-gray-400">• Dow Jones:</span>
                <span className="text-red-500">-0.2%</span>
              </li>
              <li className="flex justify-between items-center transition-all duration-300 hover:translate-x-1">
                <span className="text-gray-500 dark:text-gray-400">• VIX Index:</span>
                <span className="text-red-500">-1.3%</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="p-3 border-t border-neutral-200 dark:border-neutral-700 text-xs text-center text-neutral-500">
          Data refreshed at {refreshTime}
        </div>
      </div>
    </div>
  )
}
