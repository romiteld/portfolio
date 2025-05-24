'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Eraser, Paintbrush, RotateCcw } from 'lucide-react';

interface InpaintBrushProps {
  imageUrl: string;
  onMaskChange: (maskDataUrl: string) => void;
  className?: string;
}

export function InpaintBrush({ imageUrl, onMaskChange, className = '' }: InpaintBrushProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState([20]);
  const [isErasing, setIsErasing] = useState(false);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);

  const getCoordinates = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }, []);

  const drawLine = useCallback((
    ctx: CanvasRenderingContext2D,
    from: { x: number; y: number },
    to: { x: number; y: number }
  ) => {
    ctx.lineWidth = brushSize[0];
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = isErasing ? 'destination-out' : 'source-over';
    ctx.strokeStyle = isErasing ? 'rgba(0,0,0,1)' : 'rgba(255,255,255,1)';

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }, [brushSize, isErasing]);

  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const coords = getCoordinates(e);
    setLastPoint(coords);

    // Draw initial point
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = isErasing ? 'destination-out' : 'source-over';
    ctx.fillStyle = isErasing ? 'rgba(0,0,0,1)' : 'rgba(255,255,255,1)';
    ctx.beginPath();
    ctx.arc(coords.x, coords.y, brushSize[0] / 2, 0, 2 * Math.PI);
    ctx.fill();
  }, [getCoordinates, brushSize, isErasing]);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPoint) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);
    drawLine(ctx, lastPoint, coords);
    setLastPoint(coords);

    // Generate mask data URL
    const maskDataUrl = canvas.toDataURL();
    onMaskChange(maskDataUrl);
  }, [isDrawing, lastPoint, getCoordinates, drawLine, onMaskChange]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    setLastPoint(null);
  }, []);

  const clearMask = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onMaskChange('');
  }, [onMaskChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || !imageUrl) return;

    const setupCanvas = () => {
      const rect = image.getBoundingClientRect();
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      
      // Style the canvas to match the image display size
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set up canvas for mask drawing
      ctx.fillStyle = 'rgba(0,0,0,0)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    if (image.complete) {
      setupCanvas();
    } else {
      image.onload = setupCanvas;
    }

    const handleResize = () => {
      setTimeout(setupCanvas, 100);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [imageUrl]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Controls */}
      <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
        <div className="flex items-center gap-2">
          <Button
            variant={isErasing ? "outline" : "default"}
            size="sm"
            onClick={() => setIsErasing(false)}
          >
            <Paintbrush className="w-4 h-4" />
            Paint
          </Button>
          <Button
            variant={isErasing ? "default" : "outline"}
            size="sm"
            onClick={() => setIsErasing(true)}
          >
            <Eraser className="w-4 h-4" />
            Erase
          </Button>
        </div>

        <div className="flex items-center gap-2 flex-1">
          <span className="text-sm font-medium">Size:</span>
          <Slider
            value={brushSize}
            onValueChange={setBrushSize}
            max={100}
            min={5}
            step={5}
            className="flex-1 max-w-32"
          />
          <span className="text-sm text-muted-foreground">{brushSize[0]}px</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={clearMask}
        >
          <RotateCcw className="w-4 h-4" />
          Clear
        </Button>
      </div>

      {/* Canvas Container */}
      <div className="relative">
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Inpaint source"
          className="w-full h-auto block"
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          style={{
            background: 'rgba(255, 0, 0, 0.1)', // Slight red tint to show mask area
            mixBlendMode: 'multiply'
          }}
        />
      </div>

      <p className="text-sm text-muted-foreground">
        Draw white areas to inpaint. Use the eraser to remove mask areas.
      </p>
    </div>
  );
}