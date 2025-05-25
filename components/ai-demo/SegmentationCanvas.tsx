'use client';

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Crosshair, Download, RefreshCw, Palette } from 'lucide-react';

interface SegmentationCanvasProps {
  image: string;
  segments: any[];
}

const colors = [
  'rgba(255, 99, 132, 0.5)',
  'rgba(54, 162, 235, 0.5)',
  'rgba(255, 206, 86, 0.5)',
  'rgba(75, 192, 192, 0.5)',
  'rgba(153, 102, 255, 0.5)',
  'rgba(255, 159, 64, 0.5)'
];

export function SegmentationCanvas({ image, segments }: SegmentationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = image;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      if (showOverlay && segments) {
        segments.forEach((segment, index) => {
          if (selectedSegment !== null && selectedSegment !== index) {
            ctx.globalAlpha = 0.2;
          } else {
            ctx.globalAlpha = hoveredSegment === index ? 0.8 : 0.5;
          }
          
          ctx.fillStyle = colors[index % colors.length];
          
          // Draw segment mask
          if (segment.mask) {
            // Assuming mask is a 2D array or similar format
            // This is a simplified version - actual implementation depends on mask format
            ctx.fillRect(segment.bbox[0], segment.bbox[1], segment.bbox[2] - segment.bbox[0], segment.bbox[3] - segment.bbox[1]);
          }
        });

        ctx.globalAlpha = 1;
      }
    };
  }, [image, segments, showOverlay, selectedSegment, hoveredSegment]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find clicked segment
    segments.forEach((segment, index) => {
      if (
        x >= segment.bbox[0] &&
        x <= segment.bbox[2] &&
        y >= segment.bbox[1] &&
        y <= segment.bbox[3]
      ) {
        setSelectedSegment(index);
      }
    });
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'segmentation.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl rounded-2xl border border-gray-700 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Crosshair className="w-5 h-5 text-orange-400" />
          <h3 className="text-xl font-bold text-white">Interactive Segmentation</h3>
        </div>
        
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowOverlay(!showOverlay)}
            className={`p-2 rounded-lg transition-all ${
              showOverlay 
                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' 
                : 'bg-gray-700 text-gray-400 border border-gray-600'
            }`}
          >
            <Palette className="w-4 h-4" />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedSegment(null)}
            className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDownload}
            className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition-all"
          >
            <Download className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      <div className="relative rounded-xl overflow-hidden shadow-2xl">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseMove={(e) => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            let hoveredIndex: number | null = null;
            segments.forEach((segment, index) => {
              if (
                x >= segment.bbox[0] &&
                x <= segment.bbox[2] &&
                y >= segment.bbox[1] &&
                y <= segment.bbox[3]
              ) {
                hoveredIndex = index;
              }
            });
            setHoveredSegment(hoveredIndex);
          }}
          onMouseLeave={() => setHoveredSegment(null)}
          className="w-full h-auto cursor-crosshair"
        />
        
        {/* Floating labels */}
        {showOverlay && segments.map((segment, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: selectedSegment === null || selectedSegment === index ? 1 : 0.3,
              scale: hoveredSegment === index ? 1.1 : 1
            }}
            className="absolute pointer-events-none"
            style={{
              left: `${(segment.bbox[0] + segment.bbox[2]) / 2}px`,
              top: `${(segment.bbox[1] + segment.bbox[3]) / 2}px`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="px-2 py-1 bg-black/80 rounded-lg backdrop-blur-sm">
              <span className="text-xs text-white font-semibold">
                {segment.label || `Segment ${index + 1}`}
              </span>
              <span className="ml-2 text-xs text-gray-400">
                {(segment.confidence * 100).toFixed(0)}%
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {segments.map((segment, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedSegment(index)}
            className={`p-2 rounded-lg text-sm transition-all ${
              selectedSegment === index
                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                : 'bg-gray-800/50 text-gray-400 border border-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span>{segment.label || `Segment ${index + 1}`}</span>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}