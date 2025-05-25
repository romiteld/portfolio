'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AIShowcase } from '@/components/ai-demo/AIShowcase';
import { ParticleBackground } from '@/components/ai-demo/ParticleBackground';
import { theme, keyframes } from '@/components/ui/theme';
import { Sparkles, Brain, Zap } from 'lucide-react';

export default function AIDemoPage() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    
    // Inject keyframe animations
    const style = document.createElement('style');
    style.textContent = keyframes;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background */}
      <ParticleBackground />
      
      {/* Gradient Overlays */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-gradient-to-tl from-pink-500/10 via-transparent to-transparent" />
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center py-12 px-4"
        >
          <div className="max-w-4xl mx-auto">
            {/* Animated Logo */}
            <motion.div
              className="flex items-center justify-center gap-4 mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Brain className="w-12 h-12 text-purple-500" />
              </motion.div>
              
              <motion.h1
                className={`text-5xl sm:text-6xl md:text-7xl font-bold ${theme.effects.textGradient}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                AI Vision Studio
              </motion.h1>
              
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-12 h-12 text-blue-500" />
              </motion.div>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              className="text-xl sm:text-2xl text-gray-400 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              Experience the power of cutting-edge AI models
            </motion.p>

            {/* Feature Pills */}
            <motion.div
              className="flex flex-wrap justify-center gap-3 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              {[
                { icon: <Zap className="w-4 h-4" />, text: "Lightning Fast" },
                { icon: <Brain className="w-4 h-4" />, text: "Multi-Provider" },
                { icon: <Sparkles className="w-4 h-4" />, text: "State-of-the-Art" },
              ].map((feature, index) => (
                <motion.div
                  key={feature.text}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.9 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-full
                    ${theme.effects.glass} ${theme.effects.border}
                    hover:border-blue-500/50 transition-all duration-300
                  `}
                >
                  <span className="text-blue-400">{feature.icon}</span>
                  <span className="text-sm font-medium">{feature.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Main Showcase */}
        <AnimatePresence mode="wait">
          {isLoaded && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <AIShowcase />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-64 h-64 rounded-full"
            style={{
              background: `radial-gradient(circle, ${
                i % 2 === 0 ? 'rgba(59, 130, 246, 0.1)' : 'rgba(168, 85, 247, 0.1)'
              } 0%, transparent 70%)`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, 100, 0],
              y: [0, -100, 0],
            }}
            transition={{
              duration: 20 + i * 5,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>
    </div>
  );
}