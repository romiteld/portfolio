'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Clock, DollarSign, Sparkles, Box, Eye, Layers } from 'lucide-react';
import Image from 'next/image';
import type { DemoMode } from './AIShowcase';
import type { VisionProvider } from '@/lib/ai-providers';

interface ResultsDisplayProps {
  results: any;
  mode: DemoMode;
  provider: VisionProvider;
}

export function ResultsDisplay({ results, mode, provider }: ResultsDisplayProps) {
  const renderAnalysisResults = () => {
    if (!results.analysis) return null;

    return (
      <motion.div
        initial={{ opacity: 0, rotateX: -15 }}
        animate={{ opacity: 1, rotateX: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl rounded-2xl border border-gray-700 p-6 shadow-2xl"
        style={{
          transformStyle: 'preserve-3d',
          perspective: '1000px'
        }}
      >
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
          <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
            <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white flex-1">Analysis Results</h3>
          <span className="text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30">
            {provider.toUpperCase()}
          </span>
        </div>

        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="prose prose-invert max-w-none"
          >
            <p className="text-gray-300 leading-relaxed">{results.analysis}</p>
          </motion.div>

          {results.details && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-4 p-4 bg-gray-800/50 rounded-xl"
            >
              <h4 className="text-sm font-semibold text-gray-400 mb-2">Additional Details</h4>
              <pre className="text-xs text-gray-300 overflow-x-auto">
                {JSON.stringify(results.details, null, 2)}
              </pre>
            </motion.div>
          )}
        </div>

        {/* Floating metrics */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 flex flex-wrap gap-3"
        >
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 rounded-lg border border-blue-500/30">
            <Clock className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-300">{results.processingTime || '0'}ms</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 rounded-lg border border-green-500/30">
            <DollarSign className="w-4 h-4 text-green-400" />
            <span className="text-sm text-green-300">${results.cost?.toFixed(4) || '0.0000'}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 rounded-lg border border-purple-500/30">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-300">{results.tokens || '0'} tokens</span>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  const renderDetectionResults = () => {
    if (!results.detections) return null;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl rounded-2xl border border-gray-700 p-6"
      >
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
          <Box className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
          <h3 className="text-lg sm:text-xl font-bold text-white flex-1">Detected Objects</h3>
          <span className="text-xs sm:text-sm text-gray-400">
            {results.detections.length} objects found
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {results.detections.map((detection: any, index: number) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05, rotate: 1 }}
              className="bg-gray-800/50 rounded-lg p-3 border border-gray-700 hover:border-green-500/50 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-white">{detection.label}</span>
                <span className="text-sm px-2 py-0.5 rounded-full bg-green-500/20 text-green-300">
                  {(detection.confidence * 100).toFixed(1)}%
                </span>
              </div>
              <div className="text-xs text-gray-400 break-all">
                Box: [{detection.box.join(', ')}]
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  };

  const renderGenerationResults = () => {
    if (!results.images) return null;

    return (
      <motion.div
        initial={{ opacity: 0, rotateY: -10 }}
        animate={{ opacity: 1, rotateY: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl rounded-2xl border border-gray-700 p-6"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="flex items-center gap-2 sm:gap-3 mb-4">
          <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
          <h3 className="text-lg sm:text-xl font-bold text-white">Generated Images</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {results.images.map((image: string, index: number) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, rotate: 1 }}
              className="relative rounded-xl overflow-hidden shadow-2xl"
            >
              <img
                src={image}
                alt={`Generated ${index + 1}`}
                className="w-full h-auto"
              />
              <motion.div
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-4"
              >
                <span className="text-white text-sm">Image {index + 1}</span>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  };

  const renderComparisonResults = () => {
    if (!results.providers) return null;

    return (
      <div className="space-y-4">
        {Object.entries(results.providers).map(([provider, data]: [string, any], index) => (
          <motion.div
            key={provider}
            initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl rounded-2xl border border-gray-700 p-6"
          >
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
              <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
              <h4 className="text-base sm:text-lg font-bold text-white capitalize flex-1">{provider}</h4>
              <div className="flex gap-2">
                <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-300">
                  {data.processingTime}ms
                </span>
                <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-300">
                  ${data.cost.toFixed(4)}
                </span>
              </div>
            </div>
            <p className="text-gray-300 text-sm">{data.analysis}</p>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <AnimatePresence mode="wait">
      {mode === 'analyze' && renderAnalysisResults()}
      {mode === 'detect' && renderDetectionResults()}
      {mode === 'generate' && renderGenerationResults()}
      {mode === 'compare' && renderComparisonResults()}
      {mode === 'segment' && results.segments && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-gray-400"
        >
          <p>Segmentation results displayed in canvas above</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}