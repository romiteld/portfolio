'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnimatedUploadZone } from './components/AnimatedUploadZone';
import { ProviderSelector } from './components/ProviderSelector';
import { ResultsGallery } from './components/ResultsGallery';
import { AIProvider } from '@/lib/ai-service';
import { theme } from '@/lib/design-system/theme';
import { cn } from '@/lib/utils';
import { Sparkles, Brain, Eye, Palette, MessageSquare } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Result {
  id: string;
  type: 'analysis' | 'detection' | 'segmentation' | 'generation';
  input: string;
  output: any;
  timestamp: Date;
  provider?: string;
  processingTime?: number;
}

export default function ComputerVisionAssistant() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('openai');
  const [results, setResults] = useState<Result[]>([]);
  const [activeTab, setActiveTab] = useState('analyze');
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle image selection
  const handleImageSelect = useCallback(async (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  // Process image based on active tab
  const processImage = useCallback(async () => {
    if (!selectedImage) return;

    setIsProcessing(true);
    
    try {
      let response;
      const base64Image = selectedImage.split(',')[1];

      switch (activeTab) {
        case 'analyze':
          response = await fetch('/api/vision/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: base64Image,
              provider: selectedProvider
            })
          });
          break;
        
        case 'detect':
          response = await fetch('/api/vision/detect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: base64Image
            })
          });
          break;
        
        case 'segment':
          response = await fetch('/api/vision/segment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: base64Image
            })
          });
          break;
        
        default:
          throw new Error('Invalid operation');
      }

      const data = await response.json();
      
      if (data.success) {
        const newResult: Result = {
          id: Date.now().toString(),
          type: activeTab as any,
          input: selectedImage,
          output: data,
          timestamp: new Date(),
          provider: selectedProvider,
          processingTime: data.processingTime
        };
        
        setResults(prev => [newResult, ...prev]);
        
        // Celebrate with confetti!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (error) {
      console.error('Processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedImage, activeTab, selectedProvider]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 animate-gradient blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-green-500/10 via-cyan-500/10 to-blue-500/10 animate-gradient blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Eye className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            </motion.div>
            <h1 className={cn(
              "text-5xl font-bold",
              theme.effects.textGradient
            )}>
              AI Vision Studio
            </h1>
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-12 h-12 text-purple-600 dark:text-purple-400" />
            </motion.div>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Next-generation computer vision powered by Vercel AI SDK
          </p>
        </motion.div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Left Column - Upload & Controls */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {/* Upload Zone */}
            <div className={cn(
              "p-6 rounded-2xl",
              theme.effects.glass,
              theme.effects.shadowElevated
            )}>
              <AnimatedUploadZone 
                onImageSelect={handleImageSelect}
                isProcessing={isProcessing}
              />
            </div>

            {/* Provider Selector */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className={cn(
                "p-6 rounded-2xl",
                theme.effects.glass,
                theme.effects.shadowElevated
              )}
            >
              <ProviderSelector
                selectedProvider={selectedProvider}
                onProviderChange={setSelectedProvider}
              />
            </motion.div>

            {/* Action Tabs */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className={cn(
                "p-6 rounded-2xl",
                theme.effects.glass,
                theme.effects.shadowElevated
              )}
            >
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="analyze" className="flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    Analyze
                  </TabsTrigger>
                  <TabsTrigger value="detect" className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Detect
                  </TabsTrigger>
                  <TabsTrigger value="segment" className="flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Segment
                  </TabsTrigger>
                  <TabsTrigger value="chat" className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Chat
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="analyze" className="mt-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                      Image Analysis
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Get detailed descriptions and insights about your images using advanced vision AI.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={processImage}
                      disabled={!selectedImage || isProcessing}
                      className={cn(
                        "w-full py-3 px-6 rounded-xl font-medium transition-all",
                        "bg-gradient-to-r from-blue-600 to-purple-600",
                        "text-white shadow-lg",
                        "hover:shadow-xl hover:shadow-blue-500/25",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      {isProcessing ? 'Processing...' : 'Analyze Image'}
                    </motion.button>
                  </div>
                </TabsContent>

                <TabsContent value="detect" className="mt-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                      Object Detection
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Identify and locate objects in your images with Grounding DINO.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={processImage}
                      disabled={!selectedImage || isProcessing}
                      className={cn(
                        "w-full py-3 px-6 rounded-xl font-medium transition-all",
                        "bg-gradient-to-r from-green-600 to-emerald-600",
                        "text-white shadow-lg",
                        "hover:shadow-xl hover:shadow-green-500/25",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      {isProcessing ? 'Detecting...' : 'Detect Objects'}
                    </motion.button>
                  </div>
                </TabsContent>

                <TabsContent value="segment" className="mt-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                      Image Segmentation
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Segment your images with SAM 2 for precise object isolation.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={processImage}
                      disabled={!selectedImage || isProcessing}
                      className={cn(
                        "w-full py-3 px-6 rounded-xl font-medium transition-all",
                        "bg-gradient-to-r from-purple-600 to-pink-600",
                        "text-white shadow-lg",
                        "hover:shadow-xl hover:shadow-purple-500/25",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      {isProcessing ? 'Segmenting...' : 'Segment Image'}
                    </motion.button>
                  </div>
                </TabsContent>

                <TabsContent value="chat" className="mt-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                      Vision Chat
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Have a conversation about your image with AI.
                    </p>
                    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                      Coming soon...
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          </motion.div>

          {/* Right Column - Results */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className={cn(
              "p-6 rounded-2xl min-h-[600px]",
              theme.effects.glass,
              theme.effects.shadowElevated
            )}>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-6">
                Results Gallery
              </h3>
              
              {results.length === 0 ? (
                <div className="flex items-center justify-center h-[500px] text-gray-400">
                  <div className="text-center space-y-3">
                    <Sparkles className="w-12 h-12 mx-auto opacity-50" />
                    <p>Your results will appear here</p>
                  </div>
                </div>
              ) : (
                <ResultsGallery 
                  results={results}
                  onRemove={(id) => setResults(prev => prev.filter(r => r.id !== id))}
                />
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}