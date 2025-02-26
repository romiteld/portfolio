"use client"

import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { ImageIcon, SendIcon, CameraIcon, MicIcon, LoaderIcon, XIcon, PlusCircleIcon } from "lucide-react"

// Define message types
type MessageRole = "user" | "assistant"

interface Message {
  id: string
  role: MessageRole
  content: string
  timestamp: Date
  hasImage?: boolean
  imageSrc?: string
}

export default function MultimodalAiAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm a multimodal AI assistant. I can understand both text and images. Try sending me a message or uploading an image!",
      timestamp: new Date(),
    },
  ])
  
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if ((!inputValue.trim() && !selectedImage) || isLoading) return
    
    // Generate a unique ID for the message
    const messageId = `msg-${Date.now()}`
    
    // Add user message
    const userMessage: Message = {
      id: messageId,
      role: "user",
      content: inputValue,
      timestamp: new Date(),
      hasImage: !!selectedImage,
      imageSrc: selectedImage || undefined,
    }
    
    setMessages(prev => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)
    
    // Clear selected image
    setSelectedImage(null)
    
    // Simulate AI response with a delay
    setTimeout(() => {
      const aiResponse = generateAiResponse(inputValue, selectedImage)
      
      setMessages(prev => [...prev, {
        id: `response-${messageId}`,
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      }])
      
      setIsLoading(false)
      scrollToBottom()
    }, 1500)
    
    // Scroll to see the user message immediately
    setTimeout(scrollToBottom, 100)
  }

  // Generate fake AI responses based on input
  const generateAiResponse = (text: string, image: string | null): string => {
    if (image) {
      // Image-specific responses
      if (text.toLowerCase().includes("what") || text.toLowerCase().includes("describe")) {
        return "I can see the image you've uploaded. It appears to be a photograph showing a scene. I can identify objects, people, and settings in images like this. In a real implementation, I would give you detailed information about what's in this specific image."
      }
      
      return "Thanks for sharing this image with me! I can analyze the visual content and respond based on what I see. For a real implementation, I would use computer vision models to understand the image contents and provide relevant insights."
    }
    
    // Text-only responses
    if (text.toLowerCase().includes("hello") || text.toLowerCase().includes("hi")) {
      return "Hello there! How can I assist you today? Feel free to ask me questions or share images for analysis."
    }
    
    if (text.toLowerCase().includes("help") || text.toLowerCase().includes("can you")) {
      return "I'm a multimodal AI assistant capable of understanding both text and images. You can ask me questions, share photos for analysis, or have me explain concepts. I can generate text responses based on both textual and visual inputs."
    }
    
    if (text.toLowerCase().includes("image") || text.toLowerCase().includes("photo") || text.toLowerCase().includes("picture")) {
      return "I'd be happy to analyze an image for you! Just upload a photo using the image button in the input field, and optionally add a question about the image."
    }
    
    return "I understand your message. In a fully implemented version, I would generate a contextually relevant response based on your input. I can process both text and images to provide helpful, accurate information tailored to your needs."
  }

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      if (typeof e.target?.result === "string") {
        setSelectedImage(e.target.result)
      }
    }
    reader.readAsDataURL(file)
  }

  // Handle drag events for image upload
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }
  
  const handleDragLeave = () => {
    setIsDragging(false)
  }
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      if (typeof e.target?.result === "string") {
        setSelectedImage(e.target.result)
      }
    }
    reader.readAsDataURL(file)
  }
  
  // Clear selected image
  const handleClearImage = () => {
    setSelectedImage(null)
  }
  
  // Trigger file input click
  const handleImageButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div 
      className="flex flex-col h-[600px] bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-md overflow-hidden"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900">
        <h3 className="text-lg font-semibold text-primary-600 dark:text-primary-400 flex items-center">
          <PlusCircleIcon className="mr-2" size={20} />
          Multimodal AI Assistant
        </h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Ask questions and share images for analysis
        </p>
      </div>
      
      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div 
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === "user" 
                  ? "bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100" 
                  : "bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
              }`}
            >
              {message.hasImage && message.imageSrc && (
                <div className="mb-3">
                  <img 
                    src={message.imageSrc} 
                    alt="User uploaded" 
                    className="rounded-md max-h-[200px] object-contain border border-neutral-200 dark:border-neutral-600"
                  />
                </div>
              )}
              <p>{message.content}</p>
              <div className="mt-1 text-xs opacity-60 text-right">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </motion.div>
        ))}
        
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-neutral-100 dark:bg-neutral-700 rounded-lg p-3 flex items-center space-x-2">
              <LoaderIcon className="animate-spin text-primary-500" size={16} />
              <span className="text-neutral-600 dark:text-neutral-300">AI is thinking...</span>
            </div>
          </motion.div>
        )}
        
        {/* Invisible element for scrolling to bottom */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Image preview if selected */}
      {selectedImage && (
        <div className="p-2 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900">
          <div className="relative inline-block">
            <img 
              src={selectedImage} 
              alt="Preview" 
              className="h-16 rounded-md border border-neutral-300 dark:border-neutral-600"
            />
            <button
              onClick={handleClearImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
              aria-label="Remove image"
            >
              <XIcon size={14} />
            </button>
          </div>
        </div>
      )}
      
      {/* Input area */}
      <form 
        onSubmit={handleSubmit} 
        className="p-4 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900"
      >
        <div className="flex items-center space-x-2">
          <div className={`flex-1 flex items-center bg-white dark:bg-neutral-800 rounded-full border ${
            isDragging ? "border-primary-500 border-dashed" : "border-neutral-300 dark:border-neutral-600"
          } px-4 py-2`}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask something or upload an image..."
              className="flex-1 bg-transparent focus:outline-none text-neutral-900 dark:text-neutral-100"
            />
            
            <div className="flex items-center space-x-2 ml-2">
              <button
                type="button"
                onClick={handleImageButtonClick}
                className="text-neutral-500 hover:text-primary-500 transition-colors"
                aria-label="Upload image"
              >
                <ImageIcon size={20} />
              </button>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
                aria-label="Upload image file"
                title="Upload image file"
              />
              
              <button
                type="button"
                className="text-neutral-500 hover:text-primary-500 transition-colors"
                aria-label="Take photo"
              >
                <CameraIcon size={20} />
              </button>
              
              <button
                type="button"
                className="text-neutral-500 hover:text-primary-500 transition-colors"
                aria-label="Voice input"
              >
                <MicIcon size={20} />
              </button>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isLoading || (!inputValue.trim() && !selectedImage)}
            className="bg-primary-500 text-white p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <SendIcon size={20} />
          </button>
        </div>
        
        <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400 text-center">
          <p>This is a demo interface. Messages are not sent to a real AI model.</p>
        </div>
      </form>
      
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-primary-500 bg-opacity-10 flex items-center justify-center border-2 border-dashed border-primary-500 rounded-xl z-10">
          <div className="text-primary-500 font-medium">Drop image here</div>
        </div>
      )}
    </div>
  )
} 