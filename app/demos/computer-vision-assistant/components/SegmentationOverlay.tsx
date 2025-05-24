'use client';

import { useEffect, useRef } from 'react';

interface SegmentationResult {
  mask: string; // base64 encoded mask image
  score?: number;
  label?: string;
}

interface SegmentationOverlayProps {
  imageUrl: string;
  results: SegmentationResult[];
  opacity?: number;
  className?: string;
}

export function SegmentationOverlay({ 
  imageUrl, 
  results, 
  opacity = 0.6,
  className = '' 
}: SegmentationOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!results.length || !imageUrl) return;

    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawSegmentation = () => {
      // Set canvas size to match displayed image
      const rect = image.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw each mask
      results.forEach((result, index) => {
        const maskImage = new Image();
        maskImage.onload = () => {
          // Create a colored overlay for this mask
          ctx.save();
          
          // Set blend mode for overlay effect
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = opacity;

          // Use different colors for different masks
          const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
            '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
          ];
          const color = colors[index % colors.length];

          // Draw the mask with the selected color
          ctx.fillStyle = color;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Use mask as composite operation
          ctx.globalCompositeOperation = 'destination-in';
          ctx.drawImage(maskImage, 0, 0, canvas.width, canvas.height);

          ctx.restore();

          // Add label if available
          if (result.label) {
            ctx.save();
            ctx.fillStyle = color;
            ctx.font = '12px system-ui';
            ctx.fillText(
              `${result.label}${result.score ? ` (${(result.score * 100).toFixed(1)}%)` : ''}`,
              10,
              20 + (index * 20)
            );
            ctx.restore();
          }
        };
        maskImage.src = result.mask;
      });
    };

    // Draw when image loads
    if (image.complete) {
      drawSegmentation();
    } else {
      image.onload = drawSegmentation;
    }

    // Redraw on window resize
    const handleResize = () => {
      setTimeout(drawSegmentation, 100);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [results, imageUrl, opacity]);

  if (!results.length) return null;

  return (
    <div className={`relative ${className}`}>
      <img
        ref={imageRef}
        src={imageUrl}
        alt="Segmentation source"
        className="w-full h-auto"
        style={{ display: 'block' }}
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 pointer-events-none"
        style={{ 
          width: '100%', 
          height: '100%',
          objectFit: 'contain'
        }}
      />
    </div>
  );
}