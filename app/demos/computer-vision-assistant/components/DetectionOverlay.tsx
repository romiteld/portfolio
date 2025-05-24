'use client';

import { useRef, useEffect } from 'react';
import { ImageData } from '../hooks/useImage';

interface Detection {
  id: number;
  label: string;
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface DetectionOverlayProps {
  image: ImageData;
  detections: Detection[];
}

export function DetectionOverlay({ image, detections }: DetectionOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !imgRef.current || detections.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imgRef.current;

    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw detection boxes
    detections.forEach((detection, index) => {
      const { bbox, label, confidence } = detection;
      
      // Use different colors for different detections
      const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
        '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
      ];
      const color = colors[index % colors.length];

      // Draw bounding box
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(bbox.x, bbox.y, bbox.width, bbox.height);

      // Draw label background
      const labelText = `${label} (${(confidence * 100).toFixed(1)}%)`;
      ctx.font = '14px Inter, sans-serif';
      const textMetrics = ctx.measureText(labelText);
      const textWidth = textMetrics.width;
      const textHeight = 18;

      ctx.fillStyle = color;
      ctx.fillRect(
        bbox.x,
        bbox.y - textHeight - 4,
        textWidth + 8,
        textHeight + 4
      );

      // Draw label text
      ctx.fillStyle = 'white';
      ctx.fillText(labelText, bbox.x + 4, bbox.y - 6);
    });
  }, [detections]);

  const handleImageLoad = () => {
    if (!canvasRef.current || !imgRef.current) return;

    const canvas = canvasRef.current;
    const img = imgRef.current;

    // Set canvas size to match image display size
    const rect = img.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Scale detection coordinates to canvas size
    const scaleX = rect.width / image.width;
    const scaleY = rect.height / image.height;

    // Update detections with scaled coordinates
    const scaledDetections = detections.map(detection => ({
      ...detection,
      bbox: {
        x: detection.bbox.x * scaleX,
        y: detection.bbox.y * scaleY,
        width: detection.bbox.width * scaleX,
        height: detection.bbox.height * scaleY
      }
    }));

    // Redraw with scaled coordinates
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    scaledDetections.forEach((detection, index) => {
      const { bbox, label, confidence } = detection;
      
      const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
        '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
      ];
      const color = colors[index % colors.length];

      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(bbox.x, bbox.y, bbox.width, bbox.height);

      const labelText = `${label} (${(confidence * 100).toFixed(1)}%)`;
      ctx.font = '14px Inter, sans-serif';
      const textMetrics = ctx.measureText(labelText);
      const textWidth = textMetrics.width;
      const textHeight = 18;

      ctx.fillStyle = color;
      ctx.fillRect(
        bbox.x,
        bbox.y - textHeight - 4,
        textWidth + 8,
        textHeight + 4
      );

      ctx.fillStyle = 'white';
      ctx.fillText(labelText, bbox.x + 4, bbox.y - 6);
    });
  };

  return (
    <div className="space-y-4">
      <div className="relative inline-block">
        <img
          ref={imgRef}
          src={image.url}
          alt="Image with detections"
          className="max-w-full h-auto rounded-lg"
          style={{ maxHeight: '400px' }}
          onLoad={handleImageLoad}
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 pointer-events-none"
          style={{ maxHeight: '400px' }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {detections.map((detection, index) => {
          const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
          ];
          const color = colors[index % colors.length];

          return (
            <div 
              key={detection.id}
              className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded"
            >
              <div 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: color }}
              />
              <span className="font-medium">{detection.label}</span>
              <span className="text-sm text-gray-500">
                {(detection.confidence * 100).toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>

      <div className="text-sm text-gray-500 dark:text-gray-400">
        Found {detections.length} object{detections.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}