'use client';

import { motion } from 'framer-motion';
import { Brain, Sparkles } from 'lucide-react';

export function LoadingOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
    >
      <div className="relative">
        {/* Central brain icon */}
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1]
          }}
          transition={{
            rotate: { duration: 3, repeat: Infinity, ease: "linear" },
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }}
          className="relative z-10"
        >
          <div className="p-6 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 shadow-2xl">
            <Brain className="w-16 h-16 text-white" />
          </div>
        </motion.div>

        {/* Orbiting sparkles */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              rotate: 360
            }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              ease: "linear",
              delay: i * 0.5
            }}
            className="absolute inset-0"
          >
            <motion.div
              animate={{
                scale: [0.8, 1.2, 0.8],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.3
              }}
              className="absolute"
              style={{
                top: '-40px',
                left: '50%',
                transform: 'translateX(-50%)'
              }}
            >
              <Sparkles className={`w-6 h-6 ${
                i === 0 ? 'text-blue-400' :
                i === 1 ? 'text-purple-400' :
                'text-pink-400'
              }`} />
            </motion.div>
          </motion.div>
        ))}

        {/* Pulsing rings */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{
              scale: [0.8, 2, 2.5],
              opacity: [0, 0.5, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 1,
              ease: "easeOut"
            }}
            className="absolute inset-0 rounded-full border-2 border-purple-500"
            style={{
              width: '120px',
              height: '120px',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          />
        ))}

        {/* Loading text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center"
        >
          <p className="text-white text-lg font-semibold mb-2">Processing with AI</p>
          <motion.div
            animate={{ width: ['0%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
            style={{ width: '200px' }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}