'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Sparkles, Zap, Bot, Camera, Palette, MessageSquare, ChartBar } from 'lucide-react';
import { UploadZone } from './UploadZone';
import { ProviderSelector } from './ProviderSelector';
import { DemoSelector } from './DemoSelector';
import { ResultsDisplay } from './ResultsDisplay';
import { SegmentationCanvas } from './SegmentationCanvas';
import { ImageComparison } from './ImageComparison';
import { VisionChat } from './VisionChat';
import { PerformanceMetrics } from './PerformanceMetrics';
import { CostTracker } from './CostTracker';
import { LoadingOverlay } from './LoadingOverlay';
import type { VisionProvider } from '@/lib/ai-providers';

export type DemoMode = 'analyze' | 'detect' | 'segment' | 'generate' | 'inpaint' | 'compare';

interface AIShowcaseProps {
  className?: string;
}

export function AIShowcase({ className = '' }: AIShowcaseProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<VisionProvider>('openai');
  const [demoMode, setDemoMode] = useState<DemoMode>('analyze');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCost, setTotalCost] = useState(0);
  const [performanceData, setPerformanceData] = useState<any[]>([]);

  const handleImageUpload = (base64: string) => {
    setSelectedImage(base64);
    setResults(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!selectedImage && demoMode !== 'generate') {
      setError('Please upload an image first');
      return;
    }

    setLoading(true);
    setError(null);
    const startTime = Date.now();

    try {
      let response;
      const baseUrl = '/api/vision';

      switch (demoMode) {
        case 'analyze':
          response = await fetch(`${baseUrl}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: selectedImage,
              provider: selectedProvider,
              prompt: 'Analyze this image in detail'
            })
          });
          break;

        case 'detect':
          response = await fetch(`${baseUrl}/detect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: selectedImage,
              prompt: 'all objects'
            })
          });
          break;

        case 'segment':
          response = await fetch(`${baseUrl}/segment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: selectedImage
            })
          });
          break;

        case 'generate':
          response = await fetch(`${baseUrl}/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: 'A futuristic cityscape with flying cars',
              aspectRatio: '16:9'
            })
          });
          break;

        case 'compare':
          response = await fetch(`${baseUrl}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: selectedImage,
              compareProviders: true
            })
          });
          break;

        default:
          throw new Error('Invalid demo mode');
      }

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      setResults(data);

      // Update cost
      if (data.cost) {
        setTotalCost(prev => prev + data.cost);
      }

      // Update performance metrics
      const endTime = Date.now();
      setPerformanceData(prev => [...prev, {
        mode: demoMode,
        provider: selectedProvider,
        time: endTime - startTime,
        timestamp: new Date()
      }]);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative min-h-screen ${className}`}>
      <AnimatePresence>
        {loading && <LoadingOverlay />}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center items-center gap-3 mb-4">
            <Brain className="w-10 h-10 text-purple-400" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
              AI Vision Showcase
            </h1>
            <Sparkles className="w-10 h-10 text-pink-400" />
          </div>
          <p className="text-xl text-gray-300">
            Experience the power of cutting-edge AI vision models
          </p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Upload and Controls */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <UploadZone 
                onImageSelect={(file, base64) => handleImageUpload(base64)} 
                isProcessing={loading}
                currentImage={selectedImage}
                onClear={() => setSelectedImage(null)}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <DemoSelector
                selectedMode={demoMode}
                onModeChange={setDemoMode}
              />
            </motion.div>

            {demoMode !== 'generate' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <ProviderSelector
                  selectedProvider={selectedProvider}
                  onProviderChange={setSelectedProvider}
                />
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <button
                onClick={handleAnalyze}
                disabled={loading || (!selectedImage && demoMode !== 'generate')}
                className="w-full relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 p-4 text-white font-semibold text-lg shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Zap className="w-5 h-5" />
                  {loading ? 'Processing...' : 'Run Analysis'}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </motion.div>

            {/* Cost Tracker */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <CostTracker totalCost={totalCost} />
            </motion.div>
          </div>

          {/* Right Panel - Results */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-red-900/20 border border-red-800 rounded-2xl p-6 backdrop-blur-xl"
                >
                  <p className="text-red-400">{error}</p>
                </motion.div>
              )}

              {results && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {demoMode === 'segment' && selectedImage && (
                    <SegmentationCanvas
                      image={selectedImage}
                      segments={results.segments}
                    />
                  )}

                  {demoMode === 'compare' && (
                    <ImageComparison results={results} />
                  )}

                  <ResultsDisplay
                    results={results}
                    mode={demoMode}
                    provider={selectedProvider}
                  />

                  {demoMode === 'analyze' && (
                    <VisionChat
                      image={selectedImage}
                      provider={selectedProvider}
                      initialAnalysis={results}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Performance Metrics */}
        {performanceData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12"
          >
            <PerformanceMetrics data={performanceData} />
          </motion.div>
        )}
      </div>
    </div>
  );
}