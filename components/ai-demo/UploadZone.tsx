'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Image as ImageIcon, Sparkles, X, Loader2 } from 'lucide-react';
import { theme } from '@/components/ui/theme';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import { ImageUtils } from '@/lib/image-utils';

interface UploadZoneProps {
  onImageSelect: (file: File, base64: string) => void;
  isProcessing?: boolean;
  currentImage?: string | null;
  onClear?: () => void;
}

export function UploadZone({ 
  onImageSelect, 
  isProcessing, 
  currentImage,
  onClear 
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  const handleDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setIsConverting(true);
      try {
        const file = acceptedFiles[0];
        const base64 = await ImageUtils.fileToBase64(file);
        
        // Celebrate with confetti!
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
        
        onImageSelect(file, base64);
      } catch (error) {
        console.error('Error converting file:', error);
      } finally {
        setIsConverting(false);
      }
    }
  }, [onImageSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.bmp']
    },
    multiple: false,
    disabled: isProcessing || isConverting,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
  });

  const isLoading = isProcessing || isConverting;

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {currentImage ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={theme.animations.smooth}
            className="relative"
          >
            <div className={cn(
              "relative rounded-2xl overflow-hidden",
              theme.effects.glass,
              theme.effects.border,
              theme.effects.shadowElevated
            )}>
              <img
                src={currentImage}
                alt="Uploaded"
                className="w-full h-auto max-h-[400px] object-contain"
              />
              
              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-4 right-4 flex gap-2">
                  {onClear && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={onClear}
                      className={cn(
                        "p-3 rounded-xl",
                        theme.effects.glass,
                        "hover:bg-red-500/20 transition-colors"
                      )}
                    >
                      <X className="w-5 h-5 text-white" />
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Processing overlay */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center"
                >
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-2" />
                    <p className="text-white text-sm">Processing...</p>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="upload"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={theme.animations.smooth}
          >
            <div
              {...getRootProps()}
              className={cn(
                "relative p-12 rounded-2xl transition-all duration-300 cursor-pointer group",
                theme.effects.glass,
                isDragActive || isDragging
                  ? "border-2 border-blue-500 bg-blue-500/10"
                  : "border-2 border-dashed border-white/20 hover:border-white/40",
                theme.effects.shadowElevated,
                isLoading && "pointer-events-none opacity-50"
              )}
            >
              <input {...getInputProps()} />
              
              {/* Animated background pattern */}
              <div className="absolute inset-0 rounded-2xl overflow-hidden">
                <motion.div
                  className="absolute inset-0 opacity-30"
                  style={{
                    backgroundImage: `linear-gradient(45deg, ${theme.colors.primary} 25%, transparent 25%, transparent 75%, ${theme.colors.primary} 75%, ${theme.colors.primary}), linear-gradient(45deg, ${theme.colors.primary} 25%, transparent 25%, transparent 75%, ${theme.colors.primary} 75%, ${theme.colors.primary})`,
                    backgroundSize: '30px 30px',
                    backgroundPosition: '0 0, 15px 15px',
                  }}
                  animate={{
                    backgroundPosition: ['0 0, 15px 15px', '30px 30px, 45px 45px'],
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              </div>

              {/* Content */}
              <div className="relative z-10 text-center">
                <AnimatePresence mode="wait">
                  {isDragActive ? (
                    <motion.div
                      key="dragging"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={theme.animations.spring}
                    >
                      <Sparkles className="w-16 h-16 mx-auto mb-4 text-blue-400" />
                      <p className="text-xl font-semibold text-blue-400">
                        Drop your image here!
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="idle"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={theme.animations.spring}
                    >
                      <motion.div
                        animate={theme.animations.float}
                        className="relative inline-block"
                      >
                        <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400 group-hover:text-white transition-colors" />
                        <motion.div
                          className="absolute -top-2 -right-2"
                          animate={{ rotate: [0, 360] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        >
                          <Sparkles className="w-6 h-6 text-purple-400" />
                        </motion.div>
                      </motion.div>
                      
                      <p className="text-xl font-semibold mb-2">
                        Drop an image or click to upload
                      </p>
                      <p className="text-sm text-gray-400">
                        JPG, PNG, WebP, GIF up to 10MB
                      </p>

                      {/* Feature badges */}
                      <div className="flex items-center justify-center gap-2 mt-6">
                        {['AI-Powered', 'Multi-Model', 'Instant'].map((badge, i) => (
                          <motion.span
                            key={badge}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + i * 0.1 }}
                            className={cn(
                              "px-3 py-1 rounded-full text-xs",
                              theme.effects.glass,
                              theme.effects.border
                            )}
                          >
                            {badge}
                          </motion.span>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Corner decorations */}
              <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-white/20 rounded-tl-lg" />
              <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-white/20 rounded-tr-lg" />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-white/20 rounded-bl-lg" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-white/20 rounded-br-lg" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}