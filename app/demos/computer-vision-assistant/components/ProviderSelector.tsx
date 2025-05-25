'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Zap, DollarSign, Brain, Sparkles, Bot } from 'lucide-react';
import { aiService, AIProvider } from '@/lib/ai-service';
import { theme } from '@/lib/design-system/theme';
import { cn } from '@/lib/utils';

interface ProviderSelectorProps {
  selectedProvider: AIProvider;
  onProviderChange: (provider: AIProvider) => void;
}

const providers: AIProvider[] = ['openai', 'google', 'anthropic'];

export function ProviderSelector({ selectedProvider, onProviderChange }: ProviderSelectorProps) {
  const getProviderIcon = (provider: AIProvider) => {
    const icons = {
      openai: <Bot className="w-6 h-6" />,
      google: <Sparkles className="w-6 h-6" />,
      anthropic: <Brain className="w-6 h-6" />
    };
    return icons[provider];
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
        Choose AI Provider
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {providers.map((provider) => {
          const info = aiService.getProviderInfo(provider);
          const isSelected = selectedProvider === provider;
          
          return (
            <motion.button
              key={provider}
              onClick={() => onProviderChange(provider)}
              className={cn(
                "relative overflow-hidden rounded-xl p-6 text-left transition-all",
                "border-2",
                isSelected 
                  ? "border-blue-500 bg-blue-500/10" 
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
                "group"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={theme.animations.spring}
            >
              {/* Gradient background */}
              <div className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                `bg-gradient-to-br ${info.color}`
              )} style={{ opacity: isSelected ? 0.1 : undefined }} />
              
              {/* Glow effect */}
              {isSelected && (
                <motion.div
                  layoutId="providerGlow"
                  className="absolute inset-0 -z-10"
                  initial={false}
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(59, 130, 246, 0.2)',
                      '0 0 40px rgba(59, 130, 246, 0.4)',
                      '0 0 20px rgba(59, 130, 246, 0.2)',
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
              
              {/* Content */}
              <div className="relative z-10 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      `bg-gradient-to-br ${info.color}`,
                      "text-white"
                    )}>
                      {getProviderIcon(provider)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                        {info.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {info.model}
                      </p>
                    </div>
                  </div>
                  
                  {/* Selection indicator */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={theme.animations.spring}
                        className="p-1 bg-blue-500 rounded-full text-white"
                      >
                        <Check className="w-4 h-4" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {info.speed}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {info.cost}
                    </span>
                  </div>
                </div>
                
                {/* Features */}
                <div className="space-y-1">
                  {provider === 'openai' && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-xs text-gray-500 dark:text-gray-400"
                    >
                      • Best overall accuracy
                    </motion.div>
                  )}
                  {provider === 'google' && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-xs text-gray-500 dark:text-gray-400"
                    >
                      • Fastest response time
                    </motion.div>
                  )}
                  {provider === 'anthropic' && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-xs text-gray-500 dark:text-gray-400"
                    >
                      • Most detailed analysis
                    </motion.div>
                  )}
                </div>
              </div>
              
              {/* Animated border gradient */}
              {isSelected && (
                <motion.div
                  className="absolute inset-0 rounded-xl pointer-events-none"
                  style={{
                    background: `linear-gradient(45deg, transparent 30%, rgba(59, 130, 246, 0.1) 50%, transparent 70%)`,
                    backgroundSize: '200% 200%',
                  }}
                  animate={{
                    backgroundPosition: ['0% 0%', '100% 100%', '0% 0%']
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
      
      {/* Comparison hint */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center"
      >
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Hover over providers to see comparison • All support vision analysis
        </p>
      </motion.div>
    </div>
  );
}