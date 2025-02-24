"use client"

import { useState, useRef, useEffect } from "react"
import { MessageSquare, Mic, Send, X, Minimize2, Maximize2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { gsap } from "gsap"

type Message = {
  role: "user" | "assistant"
  content: string
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
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
    if (isOpen && chatWidgetRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          chatWidgetRef.current!,
          { opacity: 0, scale: 0.8 },
          { opacity: 1, scale: 1, duration: 0.5, ease: "power3.out" },
        )
      }, chatWidgetRef)

      return () => ctx.revert()
    }
  }, [isOpen])

  useEffect(() => {
    if (glowButtonRef.current) {
      gsap.to(glowButtonRef.current, {
        boxShadow: "0 0 20px 2px rgba(147, 197, 253, 0.5), 0 0 40px 6px rgba(59, 130, 246, 0.3)",
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      })
    }
  }, [])

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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      setMediaRecorder(recorder)
      setIsRecording(true)

      const chunks: BlobPart[] = []
      recorder.ondataavailable = (e) => chunks.push(e.data)
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" })
        const formData = new FormData()
        formData.append("audio", blob, "recording.webm")

        const response = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        })
        const { text } = await response.json()
        setInput(text)
      }

      recorder.start()
    } catch (error) {
      console.error("Error accessing microphone:", error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop()
      setIsRecording(false)
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
            className="fixed bottom-6 right-6 bg-white/20 backdrop-blur-md text-white p-4 rounded-full shadow-lg hover:bg-white/30 transition-colors animate-glow"
            style={{
              boxShadow: "0 0 30px 6px rgba(147, 197, 253, 0.7), 0 0 60px 12px rgba(59, 130, 246, 0.5)"
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <MessageSquare size={24} className="text-blue-500" />
          </motion.button>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={chatWidgetRef}
            className={`fixed ${
              isMaximized ? "inset-4" : "bottom-6 right-6 w-[320px] h-[500px]"
            } bg-white/10 dark:bg-black/10 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-[2.5rem] rounded-br-xl shadow-2xl flex flex-col z-50 overflow-hidden animate-glow-chat`}
            initial="closed"
            animate="open"
            exit="closed"
            variants={chatVariants}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{
              boxShadow: "0 0 20px 2px rgba(147, 197, 253, 0.2), 0 0 40px 6px rgba(59, 130, 246, 0.15)"
            }}
          >
            <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 bg-white/5 dark:bg-white/5">
              <h3 className="font-semibold text-neutral-800 dark:text-white text-lg">AI Engineering Copilot</h3>
              <div className="flex space-x-3">
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
              className={`flex-1 overflow-y-auto px-5 py-4 space-y-4 ${isMaximized ? "h-[calc(100vh-120px)]" : ""}`}
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
                    className={`max-w-[75%] p-3 ${
                      message.role === "user" 
                        ? "bg-blue-500/80 backdrop-blur-sm text-white rounded-2xl rounded-tr-sm shadow-md" 
                        : "bg-white/20 dark:bg-white/10 backdrop-blur-sm text-neutral-800 dark:text-white rounded-2xl rounded-tl-sm shadow-sm"
                    }`}
                  >
                    {message.content}
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-5 border-t border-white/10 bg-white/5 dark:bg-white/5">
              <div className="flex items-center gap-2 w-full bg-white/20 dark:bg-white/10 backdrop-blur-sm p-2 rounded-xl shadow-inner">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Type your message..."
                  className="flex-1 min-w-0 p-2 bg-transparent border-none text-neutral-800 dark:text-white placeholder:text-neutral-500 dark:placeholder:text-neutral-400 focus:outline-none focus:ring-0"
                />
                <div className="flex shrink-0 gap-1.5">
                  <motion.button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`p-2 rounded-lg ${
                      isRecording
                        ? "bg-red-500/80 backdrop-blur-sm hover:bg-red-600/80 text-white shadow-md"
                        : "bg-white/20 dark:bg-white/10 backdrop-blur-sm hover:bg-white/30 dark:hover:bg-white/20 text-neutral-800 dark:text-white"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Mic size={18} />
                  </motion.button>
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

