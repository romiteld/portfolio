'use client';

import { motion } from 'framer-motion';
import { Brain, Sparkles, Zap } from 'lucide-react';
import type { VisionProvider } from '@/lib/ai-providers';

interface ProviderSelectorProps {
  selectedProvider: VisionProvider;
  onProviderChange: (provider: VisionProvider) => void;
}

const providers = [
  {
    id: 'openai' as VisionProvider,
    name: 'OpenAI',
    model: 'GPT-4o',
    icon: Brain,
    color: 'from-green-500 to-emerald-500',
    bgColor: 'from-green-500/20 to-emerald-500/20',
    description: 'Advanced reasoning & analysis'
  },
  {
    id: 'google' as VisionProvider,
    name: 'Google',
    model: 'Gemini 2.0',
    icon: Sparkles,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'from-blue-500/20 to-cyan-500/20',
    description: 'Multimodal understanding'
  },
  {
    id: 'anthropic' as VisionProvider,
    name: 'Anthropic',
    model: 'Claude 3.5',
    icon: Zap,
    color: 'from-purple-500 to-pink-500',
    bgColor: 'from-purple-500/20 to-pink-500/20',
    description: 'Detailed explanations'
  }
];

export function ProviderSelector({ selectedProvider, onProviderChange }: ProviderSelectorProps) {
  return (
    <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-800 p-6">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Brain className="w-5 h-5 text-purple-400" />
        Select AI Provider
      </h3>

      <div className="space-y-3">
        {providers.map((provider, index) => {
          const Icon = provider.icon;
          const isSelected = selectedProvider === provider.id;

          return (
            <motion.button
              key={provider.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onProviderChange(provider.id)}
              className={`
                relative w-full p-4 rounded-xl border transition-all
                ${isSelected 
                  ? 'border-white/20 shadow-lg' 
                  : 'border-gray-700 hover:border-gray-600'
                }
              `}
            >
              {/* Background gradient */}
              <div
                className={`
                  absolute inset-0 rounded-xl bg-gradient-to-r ${provider.bgColor}
                  transition-opacity duration-300
                  ${isSelected ? 'opacity-100' : 'opacity-0'}
                `}
              />

              {/* Content */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`
                    p-2 rounded-lg bg-gradient-to-r ${provider.color}
                    ${isSelected ? 'shadow-lg' : ''}
                  `}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-white flex items-center gap-2">
                      {provider.name}
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
                        {provider.model}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      {provider.description}
                    </div>
                  </div>
                </div>

                {/* Selection indicator */}
                <motion.div
                  initial={false}
                  animate={{
                    scale: isSelected ? 1 : 0,
                    opacity: isSelected ? 1 : 0
                  }}
                  className="w-6 h-6 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 flex items-center justify-center"
                >
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              </div>

              {/* Hover effect */}
              <motion.div
                initial={false}
                animate={{
                  opacity: isSelected ? 0.2 : 0
                }}
                whileHover={{ opacity: 0.1 }}
                className={`absolute inset-0 rounded-xl bg-gradient-to-r ${provider.color}`}
              />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}