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
            className="fixed bottom-6 right-6 bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <MessageSquare size={24} />
          </motion.button>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={chatWidgetRef}
            className={`fixed ${
              isMaximized ? "inset-4" : "bottom-6 right-6 w-[320px]"
            } bg-white border border-neutral-300 rounded-lg shadow-lg flex flex-col z-50 overflow-hidden`}
            initial="closed"
            animate="open"
            exit="closed"
            variants={chatVariants}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="flex justify-between items-center p-4 border-b border-neutral-300">
              <h3 className="font-semibold text-primary-600">Chat Assistant</h3>
              <div className="flex space-x-2">
                <motion.button
                  onClick={toggleMaximize}
                  className="text-neutral-500 hover:text-neutral-700"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {isMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                </motion.button>
                <motion.button
                  onClick={toggleChat}
                  className="text-neutral-500 hover:text-neutral-700"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={20} />
                </motion.button>
              </div>
            </div>
            <div
              className={`flex-1 overflow-y-auto p-4 space-y-4 ${isMaximized ? "h-[calc(100vh-120px)]" : "max-h-64"}`}
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
                    className={`max-w-[75%] p-2 rounded-lg ${
                      message.role === "user" ? "bg-primary-500 text-white" : "bg-neutral-200"
                    }`}
                  >
                    {message.content}
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-neutral-300">
              <div className="flex items-center gap-2 w-full">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Type your message..."
                  className="flex-1 min-w-0 p-2 border border-neutral-300 bg-white text-neutral-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <div className="flex shrink-0 gap-2">
                  <motion.button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`p-2 rounded-lg ${
                      isRecording
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : "bg-neutral-100 hover:bg-neutral-200 text-neutral-800"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Mic size={20} />
                  </motion.button>
                  <motion.button
                    onClick={handleSend}
                    className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Send size={20} />
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

