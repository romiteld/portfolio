'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Bot, User, Sparkles } from 'lucide-react';
import type { VisionProvider } from '@/lib/ai-providers';

interface VisionChatProps {
  image: string | null;
  provider: VisionProvider;
  initialAnalysis: any;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function VisionChat({ image, provider, initialAnalysis }: VisionChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: initialAnalysis.analysis,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || !image) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/vision/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image,
          provider,
          message: input,
          history: messages
        })
      });

      if (!response.ok) throw new Error('Chat failed');

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl rounded-2xl border border-gray-700 p-6"
    >
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
        <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
        <h3 className="text-lg sm:text-xl font-bold text-white flex-1">Vision Chat</h3>
        <span className="text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-indigo-500/20 text-indigo-300">
          {provider.toUpperCase()}
        </span>
      </div>

      {/* Chat messages */}
      <div className="h-64 sm:h-96 overflow-y-auto mb-4 space-y-3 sm:space-y-4 pr-1 sm:pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex gap-2 sm:gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                </div>
              )}
              
              <div className={`max-w-[85%] sm:max-w-[80%] ${message.role === 'user' ? 'order-1' : ''}`}>
                <div className={`
                  rounded-2xl px-3 sm:px-4 py-2 sm:py-3 
                  ${message.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-800 text-gray-100'
                  }
                `}>
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>
                <div className={`text-xs text-gray-500 mt-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
              
              {message.role === 'user' && (
                <div className="flex-shrink-0 order-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-2 sm:gap-3"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="bg-gray-800 rounded-2xl px-3 sm:px-4 py-2 sm:py-3">
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, delay: i * 0.2, repeat: Infinity }}
                    className="w-2 h-2 bg-gray-500 rounded-full"
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input area */}
      <div className="flex gap-2 sm:gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask about the image..."
          className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition-colors"
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
          ) : (
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}