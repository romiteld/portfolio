"use client"

import { useEffect, useState } from "react"

export interface ChatMessage {
  id: number
  role: "user" | "agent"
  text: string
}

const STORAGE_KEY = "salesAgentMessages"

export function useChatHistory(initial: ChatMessage[]) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === "undefined") return initial
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored) as ChatMessage[]
      }
    } catch {
      // ignore JSON errors
    }
    return initial
  })

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    } catch {
      // ignore write errors
    }
  }, [messages])

  const clearMessages = () => setMessages(initial)

  return { messages, setMessages, clearMessages }
}
