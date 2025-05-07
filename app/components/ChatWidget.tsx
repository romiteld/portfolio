"use client"

import { useState, useRef, useEffect } from "react"
import { MessageSquare, Send, X, Minimize2, Maximize2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { gsap } from "gsap"
import { TextPlugin } from "gsap/TextPlugin"

// Register GSAP plugins
gsap.registerPlugin(TextPlugin)

type Message = {
  role: "user" | "assistant"
  content: string
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isMaximized, setIsMaximized] = useState(false)
  const chatWidgetRef = useRef<HTMLDivElement>(null)
  const glowButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  useEffect(() => {
    if (glowButtonRef.current) {
      gsap.set(glowButtonRef.current, {
        boxShadow: "0 0 20px 4px rgba(147, 197, 253, 0.2), 0 0 40px 8px rgba(59, 130, 246, 0.15)",
        scale: 0.95,
        opacity: 0
      });

      // Enhanced glow animation
      const glowTl = gsap.timeline({ repeat: -1 });
      
      glowTl.to(glowButtonRef.current, {
        boxShadow: "0 0 30px 8px rgba(147, 197, 253, 0.4), 0 0 60px 12px rgba(59, 130, 246, 0.3)",
        scale: 1.02,
        duration: 1.2,
        ease: "sine.inOut"
      })
      .to(glowButtonRef.current, {
        boxShadow: "0 0 20px 4px rgba(147, 197, 253, 0.2), 0 0 40px 8px rgba(59, 130, 246, 0.15)",
        scale: 0.98,
        duration: 1.2,
        ease: "sine.inOut"
      });

      // Fade in animation
      gsap.to(glowButtonRef.current, {
        opacity: 1,
        duration: 0.8,
        ease: "power2.out"
      });
    }
  }, []);

  useEffect(() => {
    if (isOpen && chatWidgetRef.current) {
      const ctx = gsap.context(() => {
        const tl = gsap.timeline();

        // Enhanced opening animation
        tl.fromTo(
          chatWidgetRef.current,
          { 
            opacity: 0,
            scale: 0.8,
            clipPath: "circle(0% at bottom right)",
            boxShadow: "0 0 0 0 rgba(147, 197, 253, 0)"
          },
          { 
            opacity: 1,
            scale: 1,
            clipPath: "circle(150% at bottom right)",
            boxShadow: "0 0 40px 10px rgba(147, 197, 253, 0.3), 0 0 80px 20px rgba(59, 130, 246, 0.2)",
            duration: 0.8,
            ease: "power3.out"
          }
        ).fromTo(
          chatWidgetRef.current?.querySelectorAll('.animate-in') ?? [],
          { 
            opacity: 0,
            y: 20,
            scale: 0.9
          },
          { 
            opacity: 1,
            y: 0,
            scale: 1,
            stagger: 0.08,
            duration: 0.6,
            ease: "back.out(1.7)"
          },
          "-=0.4"
        );

        // Continuous ambient glow
        gsap.to(chatWidgetRef.current, {
          boxShadow: "0 0 50px 15px rgba(147, 197, 253, 0.35), 0 0 100px 30px rgba(59, 130, 246, 0.25)",
          duration: 2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });

        // Subtle hover effect for messages
        chatWidgetRef.current?.querySelectorAll('.message-bubble')?.forEach(bubble => {
          gsap.to(bubble, {
            scale: 1.02,
            boxShadow: "0 8px 20px rgba(0, 0, 0, 0.2)",
            duration: 0.3,
            paused: true,
          });
        });
      }, chatWidgetRef);

      return () => ctx.revert();
    }
  }, [isOpen]);

  const toggleChat = () => {
    if (isOpen && isMaximized) {
      setIsMaximized(false)
    } else {
      setIsOpen(!isOpen)
    }
  }

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized)
  }

  const handleSend = async () => {
    if (input.trim()) {
      setMessages([...messages, { role: "user", content: input }])
      setInput("")
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      })
      const data = await response.json()
      setMessages((prev) => [...prev, { role: "assistant", content: data.message }])
    }
  }

  const chatVariants = {
    open: { opacity: 1, y: 0, scale: 1 },
    closed: { opacity: 0, y: 20, scale: 0.8 },
  }

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            ref={glowButtonRef}
            onClick={toggleChat}
            className="fixed bottom-6 right-6 bg-white/15 dark:bg-black/15 backdrop-blur-md text-white p-4 rounded-full shadow-lg hover:bg-white/20 dark:hover:bg-white/10 transition-colors"
            style={{
              boxShadow: "0 0 30px 8px rgba(147, 197, 253, 0.3), 0 0 60px 12px rgba(59, 130, 246, 0.2)"
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <MessageSquare size={24} className="text-blue-400 dark:text-blue-300" />
          </motion.button>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={chatWidgetRef}
            className={`fixed ${
              isMaximized ? "inset-4" : "bottom-6 right-6 w-[95%] sm:w-[350px] h-[70vh] sm:h-[550px] max-h-[90vh]"
            } bg-white/15 dark:bg-black/15 backdrop-blur-xl border border-white/30 dark:border-white/20 rounded-[2.5rem] rounded-br-xl shadow-2xl flex flex-col z-50 overflow-hidden chat-widget-container`}
            initial={false}
            animate="open"
            exit="closed"
            variants={chatVariants}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 bg-white/5 dark:bg-white/5 animate-in">
              <div className="flex flex-col items-center flex-grow">
                <h3 className="font-semibold text-black dark:text-white text-lg animate-in text-center">AI Assistant</h3>
              </div>
              <div className="flex space-x-3 animate-in">
                <motion.button
                  onClick={toggleMaximize}
                  className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {isMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                </motion.button>
                <motion.button
                  onClick={toggleChat}
                  className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={20} />
                </motion.button>
              </div>
            </div>
            <div
              className={`flex-1 overflow-y-auto px-3 sm:px-5 py-4 space-y-4 animate-in ${isMaximized ? "h-[calc(100vh-120px)]" : "h-[calc(100%-116px)]"}`}
            >
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div
                    className={`message-bubble max-w-[90%] p-3 text-sm sm:text-base ${
                      message.role === "user" 
                        ? "bg-blue-500/90 backdrop-blur-sm text-white rounded-2xl rounded-tr-sm shadow-lg" 
                        : "bg-white/30 dark:bg-white/20 backdrop-blur-sm text-neutral-800 dark:text-white rounded-2xl rounded-tl-sm shadow-lg"
                    }`}
                  >
                    {message.content}
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-2 sm:p-4 border-t border-white/10 bg-white/5 dark:bg-white/5 animate-in">
              <div className="flex items-center gap-2 w-full bg-white/20 dark:bg-white/10 backdrop-blur-sm p-2 rounded-xl shadow-inner">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Type your message..."
                  className="flex-1 min-w-0 p-2 bg-transparent border-none text-neutral-800 dark:text-white placeholder:text-neutral-500 dark:placeholder:text-neutral-400 focus:outline-none focus:ring-0"
                />
                <motion.button
                  onClick={handleSend}
                  className="p-2 bg-blue-500/80 backdrop-blur-sm hover:bg-blue-600/80 text-white rounded-lg shadow-md"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Send size={18} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
