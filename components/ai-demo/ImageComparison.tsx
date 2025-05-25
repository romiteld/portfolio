'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { GitCompare, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageComparisonProps {
  results: {
    providers: Record<string, any>;
  };
}

export function ImageComparison({ results }: ImageComparisonProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const providers = Object.entries(results.providers);
  const [leftProvider, rightProvider] = providers.slice(0, 2);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.min(Math.max(percentage, 0), 100));
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl rounded-2xl border border-gray-700 p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <GitCompare className="w-5 h-5 text-yellow-400" />
        <h3 className="text-xl font-bold text-white">Model Comparison</h3>
      </div>

      {/* Comparison Slider */}
      <div 
        className="relative rounded-xl overflow-hidden shadow-2xl cursor-ew-resize h-96"
        onMouseMove={handleMouseMove}
      >
        {/* Left side */}
        <div className="absolute inset-0 bg-gray-800">
          <div className="h-full p-6 overflow-y-auto">
            <h4 className="text-lg font-bold text-white mb-2 capitalize">{leftProvider[0]}</h4>
            <p className="text-gray-300 text-sm">{leftProvider[1].analysis}</p>
          </div>
        </div>

        {/* Right side */}
        <div 
          className="absolute inset-0 bg-gray-900"
          style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
        >
          <div className="h-full p-6 overflow-y-auto">
            <h4 className="text-lg font-bold text-white mb-2 capitalize">{rightProvider[0]}</h4>
            <p className="text-gray-300 text-sm">{rightProvider[1].analysis}</p>
          </div>
        </div>

        {/* Slider handle */}
        <motion.div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-xl"
          style={{ left: `${sliderPosition}%` }}
          animate={{ x: '-50%' }}
        >
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <motion.div
              whileHover={{ scale: 1.2 }}
              className="bg-white rounded-full p-2 shadow-lg"
            >
              <ChevronLeft className="w-4 h-4 text-gray-900 inline" />
              <ChevronRight className="w-4 h-4 text-gray-900 inline" />
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Metrics Comparison */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        {providers.map(([provider, data]) => (
          <motion.div
            key={provider}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/50 rounded-lg p-4"
          >
            <h5 className="font-semibold text-white mb-3 capitalize">{provider}</h5>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Processing Time</span>
                <span className="text-blue-300">{data.processingTime}ms</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Cost</span>
                <span className="text-green-300">${data.cost.toFixed(4)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Tokens</span>
                <span className="text-purple-300">{data.tokens}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}