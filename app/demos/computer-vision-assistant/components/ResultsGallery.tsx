'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2, Download, Share2, Sparkles, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import { theme } from '@/lib/design-system/theme';
import { cn } from '@/lib/utils';

interface Result {
  id: string;
  type: 'analysis' | 'detection' | 'segmentation' | 'generation';
  input: string;
  output: any;
  timestamp: Date;
  provider?: string;
  processingTime?: number;
}

interface ResultsGalleryProps {
  results: Result[];
  onRemove?: (id: string) => void;
}

export function ResultsGallery({ results, onRemove }: ResultsGalleryProps) {
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: theme.animations.spring
    }
  };

  const getResultIcon = (type: Result['type']) => {
    const icons = {
      analysis: '🔍',
      detection: '📦',
      segmentation: '✂️',
      generation: '🎨'
    };
    return icons[type];
  };

  const getResultColor = (type: Result['type']) => {
    const colors = {
      analysis: 'from-blue-500 to-cyan-500',
      detection: 'from-green-500 to-emerald-500',
      segmentation: 'from-purple-500 to-pink-500',
      generation: 'from-orange-500 to-red-500'
    };
    return colors[type];
  };

  return (
    <>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {results.map((result) => (
          <motion.div
            key={result.id}
            variants={item}
            layoutId={`result-${result.id}`}
            className="group relative"
            onMouseEnter={() => setHoveredId(result.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {/* 3D Card Container */}
            <motion.div
              className={cn(
                "relative rounded-xl overflow-hidden cursor-pointer",
                "bg-white dark:bg-gray-800",
                "shadow-lg hover:shadow-2xl transition-shadow duration-300",
                theme.effects.tilt3d
              )}
              whileHover={{ 
                rotateY: 5,
                rotateX: -5,
                scale: 1.02,
                transition: theme.animations.spring
              }}
              onClick={() => setSelectedResult(result)}
            >
              {/* Gradient Border */}
              <div className={cn(
                "absolute inset-0 p-[2px] rounded-xl",
                `bg-gradient-to-br ${getResultColor(result.type)}`,
                "opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              )}>
                <div className="w-full h-full bg-white dark:bg-gray-800 rounded-xl" />
              </div>

              {/* Image Preview */}
              <div className="relative aspect-video">
                <Image
                  src={result.input}
                  alt="Input"
                  fill
                  className="object-cover"
                />
                
                {/* Overlay on hover */}
                <AnimatePresence>
                  {hoveredId === result.id && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center"
                    >
                      <div className="flex gap-3">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-3 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedResult(result);
                          }}
                        >
                          <Maximize2 className="w-5 h-5" />
                        </motion.button>
                        {onRemove && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-3 bg-red-500/20 rounded-full text-red-400 hover:bg-red-500/30 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemove(result.id);
                            }}
                          >
                            <X className="w-5 h-5" />
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Result Type Badge */}
                <div className="absolute top-3 left-3">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className={cn(
                      "px-3 py-1 rounded-full text-white text-xs font-medium",
                      "bg-gradient-to-r",
                      getResultColor(result.type),
                      "shadow-lg"
                    )}
                  >
                    <span className="mr-1">{getResultIcon(result.type)}</span>
                    {result.type}
                  </motion.div>
                </div>

                {/* Processing Time */}
                {result.processingTime && (
                  <div className="absolute top-3 right-3">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3 }}
                      className="px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full text-white text-xs"
                    >
                      {result.processingTime}ms
                    </motion.div>
                  </div>
                )}
              </div>

              {/* Info Section */}
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {result.provider || 'AI Analysis'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                
                {/* Quick Preview */}
                {result.type === 'analysis' && result.output && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                    {typeof result.output === 'string' ? result.output : result.output.text}
                  </p>
                )}
              </div>

              {/* Animated Glow Effect */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                animate={{
                  background: [
                    'radial-gradient(circle at 20% 80%, transparent 0%, transparent 100%)',
                    'radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
                    'radial-gradient(circle at 20% 80%, transparent 0%, transparent 100%)',
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </motion.div>
          </motion.div>
        ))}
      </motion.div>

      {/* Detailed View Modal */}
      <AnimatePresence>
        {selectedResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setSelectedResult(null)}
          >
            <motion.div
              layoutId={`result-${selectedResult.id}`}
              className="relative max-w-6xl w-full max-h-[90vh] overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    "bg-gradient-to-br",
                    getResultColor(selectedResult.type)
                  )}>
                    <span className="text-2xl">{getResultIcon(selectedResult.type)}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      {selectedResult.type.charAt(0).toUpperCase() + selectedResult.type.slice(1)} Result
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedResult.provider} • {selectedResult.processingTime}ms
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowComparison(!showComparison)}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    {showComparison ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Share2 className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedResult(null)}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className={cn(
                  "grid gap-6",
                  showComparison ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
                )}>
                  {/* Original Image */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Original Image
                    </h4>
                    <div className="relative aspect-video rounded-lg overflow-hidden">
                      <Image
                        src={selectedResult.input}
                        alt="Original"
                        fill
                        className="object-contain bg-gray-100 dark:bg-gray-800"
                      />
                    </div>
                  </div>

                  {/* Result Display */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {showComparison ? 'Result' : 'Analysis Result'}
                    </h4>
                    
                    {selectedResult.type === 'analysis' && (
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {typeof selectedResult.output === 'string' 
                            ? selectedResult.output 
                            : selectedResult.output.text}
                        </p>
                      </div>
                    )}
                    
                    {(selectedResult.type === 'detection' || selectedResult.type === 'segmentation') && (
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                        {/* Visualization would go here */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Sparkles className="w-8 h-8 text-gray-400 animate-pulse" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}