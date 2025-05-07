"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { BarChart3, TrendingUp, CircleDollarSign, Send, User, MessageSquare, RefreshCw, Clock, AlertCircle, Bot, Zap } from "lucide-react"
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
      content: "Hello! I'm your AI-powered Financial Market Assistant. I can help with market data, investment strategies, portfolio analysis, and financial news. How can I assist you today?",
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
  // not when the component mounts initially
  useEffect(() => {
    // Only auto-scroll if auto-scroll is enabled and there are messages
    // and it's not the initial render (to prevent page scroll on load)
    if (autoScroll && messages.length > 1 && isMounted) {
      scrollToBottom()
    }
  }, [messages.length, autoScroll, isMounted])

  // Prevent scrolling to the widget on initial load
  useEffect(() => {
    // After component mounts, set timeout to scroll back to top 
    // in case the page auto-scrolled to the widget
    if (isMounted) {
      const timer = setTimeout(() => {
        // Ensure we're at the top of the page
        window.scrollTo(0, 0);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isMounted]);

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
      // Check if scrolled up more than 100px from bottom
      const isScrolled = scrollHeight - scrollTop - clientHeight > 100
      setIsScrolledUp(isScrolled)
    }

    chatContainer.addEventListener('scroll', handleScroll)
    return () => chatContainer.removeEventListener('scroll', handleScroll)
  }, [])

  // Load chat history and suggestions
  useEffect(() => {
    const loadHistory = async () => {
      try {
        // Attempt to fetch history and suggestions from API
        const response = await fetch(`/api/market/chat?userId=${sessionId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.suggestions && Array.isArray(data.suggestions)) {
            setChatHistory(data.suggestions)
          } else {
            // Fallback suggestions
            setChatHistory([
              "What are the best tech stocks to invest in?",
              "How is the S&P 500 performing today?",
              "Explain market volatility"
            ])
          }
        } else {
          throw new Error('Failed to load chat history')
        }
      } catch (error) {
        console.error("Error loading chat history:", error)
        // Fallback suggestions if API fails
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
      const response = await fetch('/api/market/data')
      console.log(`Market data response status: ${response.status}`)
      
      if (response.ok) {
        const data = await response.json()
        
        // Check for rate limiting
        if (data.rateLimited) {
          const waitTime = data.rateLimitWaitTime || 60;
          setApiStatusMessage(`Rate limit exceeded. Try again in ${waitTime} seconds.`);
          setIsRefreshingData(false);
          return;
        }
        
        if (data.stocks && data.stocks.length > 0) {
          setMarketData(data.stocks)
          setIsUsingSimulatedData(data.isSimulated || false)
          
          // Update time display
          setRefreshTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
          
          // Show authentication error message if needed
          if (data.authError) {
            setApiStatusMessage("Authentication failed. Please check your Alpaca API credentials.")
          } else if (data.apiError) {
            setApiStatusMessage(data.apiError)
          } else if (data.fromCache) {
            setApiStatusMessage("Using cached data (refreshes every 30 seconds).")
          } else {
            setApiStatusMessage("")
          }
        } else {
          setApiStatusMessage("Invalid market data format received")
        }
      } else {
        setApiStatusMessage(`API error: ${response.status}`)
        console.error(`Failed to fetch market data: ${response.status}`)
      }
    } catch (error) {
      console.error('Error refreshing market data:', error)
      setApiStatusMessage(error instanceof Error ? error.message : 'Unknown error')
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

  // Scroll to bottom function with modified behavior
  const scrollToBottom = () => {
    if (!messagesEndRef.current || !chatContainerRef.current) return

    try {
      // Add a small visual effect to indicate scrolling
      const messageEnd = messagesEndRef.current
      
      // Use requestAnimationFrame for smoother scrolling
      requestAnimationFrame(() => {
        // Use smoother scrolling on desktop
        messageEnd.scrollIntoView({ 
          behavior: window.innerWidth < 768 ? 'auto' : 'smooth', 
          block: 'end' 
        })
        
        // For mobile specifically, double-check scrolling after a small delay
        if (window.innerWidth < 768) {
          setTimeout(() => {
            chatContainerRef.current?.scrollTo({
              top: chatContainerRef.current.scrollHeight,
              behavior: 'auto'
            });
            setIsScrolledUp(false);
          }, 100);
        }
      })
      
      setAutoScroll(true)
      setIsScrolledUp(false)
    } catch (err) {
      console.error('Error scrolling to bottom:', err)
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Prevent page from scrolling
    e.stopPropagation()
    
    if (input.trim() === "" || isLoading) return

    // Reset error state
    setError(null)
    
    // Add user message to chat
    const userMessage: Message = { 
      role: "user", 
      content: input,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    
    // Clear input and set loading
    setInput("")
    setIsLoading(true)
    
    // Add temporary loading message
    setTypingIndicator(true)
    
    // Force scroll to bottom when sending a message, but contained within the chat area
    setTimeout(() => {
      if (autoScroll) {
        scrollToBottom()
      }
    }, 100)
    
    try {
      // Call our enhanced API with market data context
      const response = await fetch('/api/market/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input, 
          userId: sessionId,
          marketData: {
            stocks: marketData,
            isSimulated: isUsingSimulatedData,
            lastUpdated: new Date().toISOString()
          }
        }),
      })
      
      const data = await response.json()
      
      // Remove typing indicator
      setTypingIndicator(false)
      
      // Check for rate limiting errors first
      if (response.status === 429 || data.rateLimited) {
        const waitTime = data.waitTime || 60;
        const rateError = data.error || `Rate limit exceeded. Please wait ${waitTime} seconds before trying again.`;
        setError(rateError);
        
        // Add system message about rate limiting
        const rateMessage: Message = {
          role: "assistant",
          content: `⚠️ ${rateError} To prevent API abuse, we limit the number of requests. Please try again shortly.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, rateMessage]);
        return;
      }
      
      if (response.ok && data.message) {
        const botResponse: Message = { 
          role: "assistant", 
          content: data.message,
          timestamp: new Date()
        }
        
        // Check if this is a response from our specialized market index API
        if (data.source === 'index_api' && data.raw_data) {
          // Add a special class to highlight that this is real-time data
          botResponse.isRealTimeData = true
          botResponse.marketData = data.raw_data
        }
        
        setMessages(prev => [...prev, botResponse])
      } else {
        throw new Error(data.error || 'Failed to get response')
      }
    } catch (error) {
      console.error('Chat error:', error)
      setTypingIndicator(false)
      
      // Display error message to user
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('Failed to send message')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Handle input focus without triggering scroll
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.preventDefault()
    // On mobile, we need to ensure the input is visible when focused
    if (window.innerWidth < 768) {
      // Adjust scroll position to ensure input is visible
      setTimeout(() => {
        e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
    
    // Prevent the auto-scroll behavior during this focus
    setAutoScroll(false)
  }

  // Handle clicking a suggestion
  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
  }

  // Format timestamp - only run on client side after hydration
  const formatTime = (date?: Date) => {
    if (!date || !isMounted) return '' // Return empty string during server-side rendering
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Prevent main page from scrolling when mouse is over chat
  useEffect(() => {
    const chatContainer = chatContainerRef.current
    if (!chatContainer) return

    // Function to prevent parent scroll when chat container is scrolled
    const preventParentScroll = (e: WheelEvent) => {
      // Determine if we should prevent the default scroll behavior
      const { scrollTop, scrollHeight, clientHeight } = chatContainer
      const isScrolledToBottom = Math.ceil(scrollHeight - scrollTop) <= clientHeight
      const isScrolledToTop = scrollTop === 0

      // If we're at the top and scrolling up, or at the bottom and scrolling down,
      // let the parent scroll. Otherwise, prevent it.
      if ((isScrolledToTop && e.deltaY < 0) || (isScrolledToBottom && e.deltaY > 0)) {
        return // Allow parent to scroll
      }
      
      // Otherwise prevent the default (parent scrolling)
      e.preventDefault()
    }

    // Add the wheel event listener to prevent parent scrolling
    chatContainer.addEventListener('wheel', preventParentScroll, { passive: false })
    
    return () => {
      // Clean up the event listener
      chatContainer.removeEventListener('wheel', preventParentScroll)
    }
  }, [])

  // Reset the stock items ref array when market data changes
  useEffect(() => {
    stockItemsRef.current = []
  }, [marketData])
  
  // Add hover animation for send button
  useEffect(() => {
    if (sendButtonRef.current) {
      // Initial state
      gsap.set(sendButtonRef.current, {
        scale: 1,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
      })
      
      // Hover animation
      const hoverAnimation = (e: MouseEvent) => {
        if (!isLoading && input.trim() !== "") {
          gsap.to(sendButtonRef.current, {
            scale: 1.1,
            boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
            duration: 0.3,
            ease: "power2.out"
          })
        }
      }
      
      // Leave animation
      const leaveAnimation = (e: MouseEvent) => {
        gsap.to(sendButtonRef.current, {
          scale: 1,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          duration: 0.3,
          ease: "power2.in"
        })
      }
      
      // Click animation
      const clickAnimation = (e: MouseEvent) => {
        if (!isLoading && input.trim() !== "") {
          gsap.timeline()
            .to(sendButtonRef.current, {
              scale: 0.9,
              duration: 0.1,
              ease: "power2.in"
            })
            .to(sendButtonRef.current, {
              scale: 1,
              duration: 0.2,
              ease: "back.out(3)"
            })
        }
      }
      
      // Add event listeners
      const button = sendButtonRef.current
      button.addEventListener('mouseenter', hoverAnimation)
      button.addEventListener('mouseleave', leaveAnimation)
      button.addEventListener('mousedown', clickAnimation)
      
      // Cleanup
      return () => {
        button.removeEventListener('mouseenter', hoverAnimation)
        button.removeEventListener('mouseleave', leaveAnimation)
        button.removeEventListener('mousedown', clickAnimation)
      }
    }
  }, [isLoading, input])
  
  // Animate stock items when market data changes or is refreshed
  useEffect(() => {
    if (stockItemsRef.current.length > 0) {
      // Reset any existing animations
      gsap.set(stockItemsRef.current, { clearProps: "all" })
      
      // Create staggered entrance animation
      gsap.fromTo(
        stockItemsRef.current,
        { 
          y: 15, 
          opacity: 0, 
          scale: 0.95,
          boxShadow: "0 0 0 rgba(0,0,0,0)"
        },
        { 
          y: 0, 
          opacity: 1, 
          scale: 1,
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
          duration: 0.5, 
          stagger: 0.1,
          ease: "power2.out" 
        }
      )
    }
  }, [marketData, refreshTime])
  
  // Function to add a stock item element to the ref array
  const addToStockRefs = (el: HTMLDivElement) => {
    if (el && !stockItemsRef.current.includes(el)) {
      stockItemsRef.current.push(el)
    }
  }
  
  // Animate refreshing effect
  useEffect(() => {
    if (isRefreshingData && marketDataContainerRef.current) {
      // Create refreshing animation
      gsap.to(marketDataContainerRef.current, {
        opacity: 0.7,
        duration: 0.2,
        yoyo: true,
        repeat: 1,
        ease: "power1.inOut"
      })
    }
  }, [isRefreshingData])

  // Reset the badge refs array whenever messages change
  useEffect(() => {
    liveDataBadgeRefs.current = []
  }, [messages])
  
  // Function to add a live data badge element to the ref array
  const addToLiveBadgeRefs = (el: HTMLSpanElement | null) => {
    if (el && !liveDataBadgeRefs.current.includes(el)) {
      liveDataBadgeRefs.current.push(el)
    }
  }
  
  // Add animation for market insights
  useEffect(() => {
    if (marketInsightsRef.current) {
      // Create an animation for the market insights section
      gsap.fromTo(
        marketInsightsRef.current,
        { 
          opacity: 0,
          y: 10
        },
        { 
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
          delay: 0.3
        }
      )
      
      // Add a subtle hover effect to the entire section
      marketInsightsRef.current.addEventListener('mouseenter', () => {
        gsap.to(marketInsightsRef.current, {
          backgroundColor: 'rgba(59, 130, 246, 0.03)', // Very subtle highlight
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          duration: 0.3
        })
      })
      
      marketInsightsRef.current.addEventListener('mouseleave', () => {
        gsap.to(marketInsightsRef.current, {
          backgroundColor: 'rgba(0, 0, 0, 0)',
          boxShadow: '0 0 0 rgba(0, 0, 0, 0)',
          duration: 0.3
        })
      })
    }
  }, [refreshTime]) // Rerun when data is refreshed
  
  // Add animation for live data badges
  useEffect(() => {
    if (liveDataBadgeRefs.current.length > 0) {
      // Animate the dot inside the badge
      liveDataBadgeRefs.current.forEach(badge => {
        if (badge) {
          const dot = badge.querySelector('div')
          if (dot) {
            // Create a pulsing animation for the dot
            gsap.to(dot, {
              scale: 1.3,
              opacity: 1,
              duration: 0.8,
              repeat: -1,
              yoyo: true,
              ease: "sine.inOut"
            })
          }
          
          // Also add a subtle glow to the badge
          gsap.to(badge, {
            boxShadow: '0 0 8px rgba(34, 197, 94, 0.3)',
            duration: 1.5,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
          })
        }
      })
    }
  }, [liveDataBadgeRefs.current.length])

  // Add animation for the logo icon
  useEffect(() => {
    if (logoIconRef.current) {
      // Initial state
      gsap.set(logoIconRef.current, {
        scale: 1,
        rotation: 0
      })
      
      // Create a subtle animation for the icon
      gsap.to(logoIconRef.current, {
        rotation: 360,
        duration: 20,
        repeat: -1,
        ease: "linear"
      })
      
      // Add hover effect
      const hoverAnimation = () => {
        gsap.to(logoIconRef.current, {
          scale: 1.2,
          duration: 0.3,
          ease: "back.out(2)"
        })
      }
      
      const leaveAnimation = () => {
        gsap.to(logoIconRef.current, {
          scale: 1,
          duration: 0.3,
          ease: "power1.out"
        })
      }
      
      // Add event listeners
      const icon = logoIconRef.current
      icon.addEventListener('mouseenter', hoverAnimation)
      icon.addEventListener('mouseleave', leaveAnimation)
      
      // Cleanup
      return () => {
        icon.removeEventListener('mouseenter', hoverAnimation)
        icon.removeEventListener('mouseleave', leaveAnimation)
      }
    }
  }, [])

  // Add scroll to bottom effect when new messages are added
  useEffect(() => {
    // Create a small visual indicator when a new message arrives
    if (messages.length > 1 && messagesEndRef.current) {
      const pulse = document.createElement('div');
      pulse.className = 'w-6 h-6 rounded-full bg-primary-500/50 absolute bottom-16 right-4 animate-ping';
      pulse.style.zIndex = '15';
      
      // Add and then remove the pulse
      if (chatContainerRef.current) {
        chatContainerRef.current.appendChild(pulse);
        setTimeout(() => {
          if (chatContainerRef.current && chatContainerRef.current.contains(pulse)) {
            chatContainerRef.current.removeChild(pulse);
          }
        }, 1000);
      }
    }
  }, [messages.length]);

  // Initial message demo effect - only show after component mounts
  useEffect(() => {
    if (isMounted && window.innerWidth > 768) {
      // Only auto-run demo on larger screens
      const timer = setTimeout(() => {
        // No demo auto-start on mobile to avoid issues with chat visibility
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isMounted]);

  return (
    <div className="grid md:grid-cols-4 gap-4 h-auto min-h-[550px] md:h-[600px] relative overflow-hidden" data-component-name="FinancialAssistantDemo">
      {/* Main chat area */}
      <div className="md:col-span-3 flex flex-col rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-md overflow-hidden h-[550px] sm:h-[600px] md:h-auto">
        {/* Header - Update the light mode styling */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 dark:bg-primary-700 text-white p-4 flex items-center justify-between shadow-sm relative overflow-hidden">
          {/* Add subtle background pattern for light mode only */}
          <div className="absolute inset-0 bg-repeat opacity-10 pattern-grid-lg dark:opacity-0"></div>
          
          {/* Add animated circle behind the icon */}
          <div className="absolute left-3 w-10 h-10 rounded-full bg-white/10 animate-pulse-slow"></div>
          
          <div className="flex items-center relative z-10">
            <CircleDollarSign className="mr-2 text-white/90" ref={logoIconRef} />
            <h2 className="font-bold tracking-wide">Financial Market Assistant</h2>
          </div>
          <div className="flex space-x-2">
            <button 
              className={`text-xs ${autoScroll ? 'bg-primary-800/40 dark:bg-primary-900 backdrop-blur-sm' : 'bg-primary-700/40 dark:bg-primary-800 backdrop-blur-sm'} hover:bg-primary-800/60 dark:hover:bg-primary-900 py-1 px-2 rounded flex items-center`} 
              onClick={(e) => { e.stopPropagation(); setAutoScroll(!autoScroll) }}
              title={autoScroll ? "Disable auto-scroll" : "Enable auto-scroll"}
            >
              <MessageSquare size={14} className="mr-1" />
              {autoScroll ? "Auto-scroll On" : "Auto-scroll Off"}
            </button>
            <button 
              className="text-xs bg-primary-700/40 hover:bg-primary-800/60 dark:bg-primary-800 dark:hover:bg-primary-900 backdrop-blur-sm py-1 px-2 rounded flex items-center" 
              onClick={(e) => { e.stopPropagation(); refreshMarketData() }}
              disabled={isRefreshingData}
            >
              <RefreshCw size={14} className={`mr-1 ${isRefreshingData ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>
          </div>
        </div>

        {/* Chat messages area */}
        <div 
          className="flex-1 p-3 sm:p-4 overflow-y-auto bg-neutral-50 dark:bg-neutral-900 relative min-h-[320px] sm:min-h-[350px]"
          ref={chatContainerRef}
          data-component-name="FinancialChatMessages"
          style={{ maxHeight: '100%', height: 'calc(100% - 140px)' }}
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
                            ref={addToLiveBadgeRefs}
                          >
                            <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1"></div>
                            Live Data
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  {message.timestamp ? (
                    isMounted ? (
                      <div className="text-xs opacity-70 flex items-center ml-2">
                        <Clock size={10} className="mr-1" />
                        {formatTime(message.timestamp)}
                      </div>
                    ) : (
                      // Empty placeholder with same height during server render
                      <div className="text-xs opacity-0 flex items-center ml-2 h-4">
                        <span className="mr-1"></span>
                        <span>00:00</span>
                      </div>
                    )
                  ) : null}
                </div>
                <p className="text-[14px] sm:text-base whitespace-pre-wrap leading-relaxed">{message.content}</p>
                
                {/* Display market data details for real-time data */}
                {message.isRealTimeData && message.marketData && (
                  <div className="mt-2 pt-2 border-t border-white/20 text-sm sm:text-xs">
                    <div className="flex justify-between items-center">
                      <span className="opacity-80">Index Value:</span>
                      <span className="font-mono font-medium">{message.marketData.value}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="opacity-80">Change:</span>
                      <span className={`font-mono font-medium ${message.marketData.change >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                        {message.marketData.change >= 0 ? '+' : ''}{message.marketData.change}%
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start mb-4"
            >
              <div className="bg-neutral-200 dark:bg-neutral-700 p-3 rounded-lg rounded-tl-none">
                <div className="flex items-center">
                  <span className="text-xs text-neutral-600 dark:text-neutral-400 mr-2">AI Assistant is typing</span>
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Error display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center mb-4"
            >
              <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 p-2 rounded-lg text-xs flex items-center">
                <AlertCircle size={12} className="mr-1" />
                Error: {error}
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
          
          {/* Scroll to bottom button - positioned relative to the chat container */}
          {isScrolledUp && !autoScroll && (
            <button
              onClick={(e) => { e.stopPropagation(); scrollToBottom() }}
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
        <form onSubmit={handleSubmit} className="p-2 sm:p-4 border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 sticky bottom-0 z-30 w-full">
          <div className="flex">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={handleInputFocus}
              placeholder="Ask about stocks or crypto..."
              className="flex-1 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-l-md bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[45px] sm:min-h-[50px] text-base"
              disabled={isLoading}
              data-component-name="FinancialChatInput"
              style={{ 
                fontSize: '16px', 
                lineHeight: '1.4',
                WebkitTextSizeAdjust: '100%',
                textSizeAdjust: '100%'
              }} /* Prevent zoom and text size adjustments on mobile */
            />
            <button
              type="submit"
              disabled={isLoading || input.trim() === ""}
              className="bg-primary-500 hover:bg-primary-600 text-white p-2 rounded-r-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[45px] sm:min-h-[50px] min-w-[45px] sm:min-w-[50px] flex items-center justify-center"
              aria-label="Send message"
              ref={sendButtonRef}
              data-component-name="FinancialChatSendButton"
            >
              <Send size={20} className="sm:size-20" />
            </button>
          </div>
          
          {/* Smart Suggestions */}
          <div className="mt-2 flex flex-wrap gap-1 sm:gap-2">
            {chatHistory.map((suggestion, index) => (
              <button
                key={index}
                onClick={(e) => { e.stopPropagation(); handleSuggestionClick(suggestion) }}
                className="text-sm sm:text-xs bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 py-1.5 sm:py-1 px-3 sm:px-2 rounded-full transition-colors flex items-center"
                disabled={isLoading}
              >
                <Zap size={12} className="mr-1.5 sm:mr-1 sm:size-10 text-primary-500" />
                {suggestion}
              </button>
            ))}
          </div>
          
          {/* Status Message - Hide on mobile to save space */}
          <div className="hidden sm:flex mt-1 sm:mt-2 flex-col sm:flex-row justify-between items-start sm:items-center text-[10px] sm:text-xs text-neutral-500">
            <p className="truncate max-w-full">
              {isUsingSimulatedData ? "Demo mode: Using simulated data." : "Connected to live market data."}
              {apiStatusMessage && (
                <span className="ml-1 text-amber-500">{apiStatusMessage}</span>
              )}
            </p>
            <div className="flex items-center mt-1 sm:mt-0">
              <Clock size={10} className="mr-1" />
              <span className="ml-1">Updated: {refreshTime}</span>
            </div>
          </div>
        </form>
      </div>

      {/* Market data sidebar - hidden on mobile, only visible on md and up */}
      <div className="hidden md:flex md:col-span-1 flex-col rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-md overflow-hidden" ref={marketDataContainerRef}>
        <div className="bg-neutral-100 dark:bg-neutral-700 p-3 border-b border-neutral-200 dark:border-neutral-600">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm flex items-center">
              <BarChart3 size={16} className="mr-1" /> Market Data
            </h3>
            <span className={`text-xs ${isUsingSimulatedData ? 'text-amber-500' : 'text-green-500'}`}>
              {isUsingSimulatedData ? 'Simulated' : 'Live'}
            </span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3">
          <div className="space-y-3">
            {marketData.map((stock, index) => (
              <div 
                key={stock.symbol} 
                className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 transition-all duration-300"
                ref={addToStockRefs}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold">{stock.symbol}</span>
                  <span className="font-mono">${stock.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">Change</span>
                  <span className={`text-xs flex items-center ${stock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {stock.change >= 0 ? 
                      <TrendingUp size={12} className="mr-1" /> : 
                      <TrendingUp size={12} className="mr-1 transform rotate-180" />
                    }
                    {stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent > 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 rounded-lg bg-neutral-100 dark:bg-neutral-700" ref={marketInsightsRef}>
            <h4 className="text-xs font-medium mb-2 flex items-center">
              <BarChart3 size={12} className="mr-1" /> 
              Market Insights
            </h4>
            <ul className="text-xs space-y-2">
              <li className="flex justify-between items-center transition-all duration-300 hover:translate-x-1">
                <span className="text-gray-500 dark:text-gray-400">• S&P 500:</span>
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
          {isUsingSimulatedData 
            ? "Using simulated market data. Add Alpaca API keys for live data." 
            : "Using live market data."
          }
          {apiStatusMessage && (
            <>
              <br />
              <span className="text-amber-500">{apiStatusMessage}</span>
            </>
          )}
          <br />
          Data refreshed at {refreshTime}
          
          {isUsingSimulatedData && (
            <div className="mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-600 text-xs text-left">
              <p className="font-medium mb-1">To use real market data:</p>
              <ol className="list-decimal pl-4 space-y-1">
                <li>Sign up at <a href="https://app.alpaca.markets/signup" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">alpaca.markets</a></li>
                <li>Create <strong>Paper Trading</strong> API keys in your dashboard</li>
                <li>Add to <code className="bg-neutral-100 dark:bg-neutral-800 px-1 rounded">.env.local</code> in project root:</li>
              </ol>
              <pre className="mt-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded text-[10px] overflow-x-auto">
ALPACA_API_KEY=your_key_here<br/>
ALPACA_API_SECRET=your_secret_here<br/>
ALPACA_API_ENDPOINT=https://paper-api.alpaca.markets<br/>
ALPACA_DATA_ENDPOINT=https://data.alpaca.markets
              </pre>
              <p className="mt-1 text-amber-600 dark:text-amber-400">
                <strong>Note:</strong> Restart the dev server after adding credentials
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
