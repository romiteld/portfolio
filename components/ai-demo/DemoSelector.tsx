'use client';

import { motion } from 'framer-motion';
import { Eye, Box, Scissors, Image, Paintbrush, GitCompare } from 'lucide-react';
import type { DemoMode } from './AIShowcase';

interface DemoSelectorProps {
  selectedMode: DemoMode;
  onModeChange: (mode: DemoMode) => void;
}

const demos = [
  {
    id: 'analyze' as DemoMode,
    name: 'Vision Analysis',
    icon: Eye,
    color: 'from-blue-500 to-cyan-500',
    description: 'Detailed image understanding'
  },
  {
    id: 'detect' as DemoMode,
    name: 'Object Detection',
    icon: Box,
    color: 'from-green-500 to-emerald-500',
    description: 'Identify and locate objects'
  },
  {
    id: 'segment' as DemoMode,
    name: 'Segmentation',
    icon: Scissors,
    color: 'from-orange-500 to-red-500',
    description: 'Interactive image segmentation'
  },
  {
    id: 'generate' as DemoMode,
    name: 'AI Generation',
    icon: Image,
    color: 'from-purple-500 to-pink-500',
    description: 'Create images from text'
  },
  {
    id: 'inpaint' as DemoMode,
    name: 'Inpainting',
    icon: Paintbrush,
    color: 'from-indigo-500 to-purple-500',
    description: 'Smart image editing'
  },
  {
    id: 'compare' as DemoMode,
    name: 'Compare Models',
    icon: GitCompare,
    color: 'from-yellow-500 to-orange-500',
    description: 'Side-by-side comparison'
  }
];

export function DemoSelector({ selectedMode, onModeChange }: DemoSelectorProps) {
  return (
    <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-800 p-6">
      <h3 className="text-lg sm:text-xl font-bold text-white mb-4">Select Demo</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {demos.map((demo, index) => {
          const Icon = demo.icon;
          const isSelected = selectedMode === demo.id;

          return (
            <motion.button
              key={demo.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onModeChange(demo.id)}
              className={`
                relative p-4 rounded-xl border transition-all overflow-hidden
                ${isSelected 
                  ? 'border-white/20 shadow-lg' 
                  : 'border-gray-700 hover:border-gray-600'
                }
              `}
            >
              {/* Background effect */}
              <motion.div
                initial={false}
                animate={{
                  opacity: isSelected ? 1 : 0,
                  scale: isSelected ? 1 : 0.8
                }}
                transition={{ duration: 0.3 }}
                className={`absolute inset-0 bg-gradient-to-br ${demo.color} opacity-20`}
              />

              {/* Animated particles for selected item */}
              {isSelected && (
                <div className="absolute inset-0">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: [0, 1, 0],
                        scale: [0.5, 1.5, 0.5],
                        x: [0, Math.random() * 40 - 20, 0],
                        y: [0, Math.random() * 40 - 20, 0]
                      }}
                      transition={{
                        duration: 3,
                        delay: i * 0.5,
                        repeat: Infinity,
                        repeatType: 'loop'
                      }}
                      className={`absolute w-20 h-20 rounded-full bg-gradient-to-br ${demo.color} opacity-10 blur-xl`}
                      style={{
                        left: `${20 + i * 30}%`,
                        top: `${20 + i * 20}%`
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Content */}
              <div className="relative z-10 flex sm:flex-col items-center sm:text-center gap-3 sm:gap-0">
                <div className={`
                  flex-shrink-0 sm:mx-auto sm:mb-3 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${demo.color}
                  flex items-center justify-center shadow-lg
                  ${isSelected ? 'scale-110' : ''}
                  transition-transform
                `}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex-1 sm:flex-none">
                  <div className="font-semibold text-white text-sm sm:text-sm">
                    {demo.name}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5 sm:mt-1">
                    {demo.description}
                  </div>
                </div>
              </div>

              {/* Selection ring */}
              <motion.div
                initial={false}
                animate={{
                  opacity: isSelected ? 1 : 0,
                  scale: isSelected ? 1 : 0.95
                }}
                className={`absolute inset-0 rounded-xl ring-2 ring-white/30 ring-offset-2 ring-offset-gray-900`}
              />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}