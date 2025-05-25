'use client';

import React, { useCallback, useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Image as ImageIcon, Sparkles, Zap } from 'lucide-react';
import { theme } from '@/lib/design-system/theme';
import { cn } from '@/lib/utils';

interface AnimatedUploadZoneProps {
  onImageSelect: (file: File) => void;
  isProcessing?: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export function AnimatedUploadZone({ onImageSelect, isProcessing }: AnimatedUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onImageSelect(acceptedFiles[0]);
      // Create celebration particles
      createBurstParticles();
    }
  }, [onImageSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: false,
    disabled: isProcessing,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
  });

  // Create burst of particles on successful upload
  const createBurstParticles = () => {
    const newParticles: Particle[] = [];
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];
    
    for (let i = 0; i < 50; i++) {
      const angle = (Math.PI * 2 * i) / 50;
      const velocity = 2 + Math.random() * 3;
      newParticles.push({
        id: Date.now() + i,
        x: 50,
        y: 50,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: 100,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    
    setParticles(prev => [...prev, ...newParticles]);
  };

  // Mouse move handler for interactive particles
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });

    // Create trailing particles
    if (isDragging && Math.random() > 0.7) {
      const colors = ['#3b82f6', '#8b5cf6', '#ec4899'];
      setParticles(prev => [...prev, {
        id: Date.now(),
        x,
        y,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5 - 1,
        life: 100,
        color: colors[Math.floor(Math.random() * colors.length)]
      }]);
    }
  };

  // Particle animation loop
  useEffect(() => {
    const animate = () => {
      setParticles(prev => prev
        .map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          vy: particle.vy + 0.1, // gravity
          life: particle.life - 2
        }))
        .filter(particle => particle.life > 0)
      );
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      {...getRootProps()}
      onMouseMove={handleMouseMove}
      className={cn(
        "relative overflow-hidden rounded-2xl transition-all duration-300",
        "border-2 border-dashed",
        isDragActive ? "border-blue-500 bg-blue-500/10" : "border-gray-300 dark:border-gray-700",
        isProcessing && "opacity-50 cursor-not-allowed",
        !isProcessing && "cursor-pointer hover:border-blue-400"
      )}
    >
      <input {...getInputProps()} />
      
      {/* Animated background gradient */}
      <div className="absolute inset-0 opacity-50">
        <div className={cn(
          "absolute inset-0",
          "bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20",
          "animate-gradient bg-[length:200%_200%]"
        )} />
      </div>

      {/* Particles */}
      <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
        {particles.map(particle => (
          <motion.circle
            key={particle.id}
            cx={`${particle.x}%`}
            cy={`${particle.y}%`}
            r="2"
            fill={particle.color}
            initial={{ opacity: 1, scale: 1 }}
            animate={{ opacity: 0, scale: 0 }}
            transition={{ duration: particle.life / 100, ease: "easeOut" }}
          />
        ))}
      </svg>

      {/* Main content */}
      <div className={cn(
        "relative z-20 p-12 text-center",
        theme.effects.glass,
        "backdrop-blur-md"
      )}>
        <AnimatePresence mode="wait">
          {isDragActive ? (
            <motion.div
              key="dragging"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={theme.animations.spring}
              className="space-y-4"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-16 h-16 mx-auto text-blue-500" />
              </motion.div>
              <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
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
              className="space-y-4"
            >
              <div className="relative">
                <motion.div
                  animate={theme.animations.float}
                  className="relative"
                >
                  <Upload className="w-16 h-16 mx-auto text-gray-400" />
                  <motion.div
                    className="absolute -top-2 -right-2"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Zap className="w-6 h-6 text-yellow-500" />
                  </motion.div>
                </motion.div>
              </div>
              
              <div className="space-y-2">
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                  Drop an image here or click to upload
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Supports JPEG, PNG, WebP, GIF
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 mt-4">
                <div className="flex -space-x-2">
                  {['🖼️', '📸', '🎨', '✨'].map((emoji, i) => (
                    <motion.div
                      key={emoji}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="w-8 h-8 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-md"
                    >
                      <span className="text-sm">{emoji}</span>
                    </motion.div>
                  ))}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  AI-powered analysis
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Processing overlay */}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-2xl flex items-center justify-center"
          >
            <div className="space-y-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-8 h-8 text-white" />
              </motion.div>
              <p className="text-white font-medium">Processing...</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Corner decorations */}
      <div className="absolute top-4 right-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-blue-500/30 rounded-full"
        />
      </div>
      <div className="absolute bottom-4 left-4">
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="w-6 h-6 border-2 border-purple-500/30 rounded-full"
        />
      </div>
    </div>
  );
}