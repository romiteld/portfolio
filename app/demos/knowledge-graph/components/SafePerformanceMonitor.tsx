'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Cpu, HardDrive, Zap, X } from 'lucide-react';

interface PerformanceStats {
  fps: number;
  avgFps: number;
  minFps: number;
  maxFps: number;
  memory: number;
  loadTime: number;
}

export function SafePerformanceMonitor() {
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState<PerformanceStats>({
    fps: 60,
    avgFps: 60,
    minFps: 60,
    maxFps: 60,
    memory: 0,
    loadTime: 0
  });

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    const fpsHistory: number[] = [];
    let animationId: number;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      // Calculate FPS every second
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        fpsHistory.push(fps);
        
        // Keep only last 60 seconds
        if (fpsHistory.length > 60) {
          fpsHistory.shift();
        }

        // Calculate stats
        const avgFps = Math.round(
          fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length
        );
        const minFps = Math.min(...fpsHistory);
        const maxFps = Math.max(...fpsHistory);

        // Memory usage (if available)
        let memory = 0;
        if ((performance as any).memory) {
          memory = Math.round((performance as any).memory.usedJSHeapSize / 1048576);
        }

        setStats({
          fps,
          avgFps,
          minFps,
          maxFps,
          memory,
          loadTime: stats.loadTime
        });

        frameCount = 0;
        lastTime = currentTime;
      }
      
      animationId = requestAnimationFrame(measureFPS);
    };

    animationId = requestAnimationFrame(measureFPS);

    // Measure initial load time
    const loadTime = performance.now();
    setStats(prev => ({ ...prev, loadTime: Math.round(loadTime) }));

    // Keyboard shortcut for toggle
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'p' && e.ctrlKey) {
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  if (!isVisible) {
    return (
      <Button
        size="icon"
        variant="outline"
        className="absolute top-6 right-6 bg-black/50 backdrop-blur-sm border-white/20 text-white hover:bg-white/10"
        onClick={() => setIsVisible(true)}
      >
        <Activity className="w-4 h-4" />
      </Button>
    );
  }

  const getFPSColor = (fps: number) => {
    if (fps >= 50) return 'text-green-500';
    if (fps >= 30) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <Card className="absolute top-6 right-6 p-4 bg-black/80 backdrop-blur-md border-white/20 text-white min-w-[250px]">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Performance Monitor
        </h3>
        <Button
          size="icon"
          variant="ghost"
          className="w-6 h-6"
          onClick={() => setIsVisible(false)}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>

      <div className="space-y-2 text-xs">
        {/* FPS */}
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            FPS
          </span>
          <span className={getFPSColor(stats.fps)}>
            {stats.fps} (avg: {stats.avgFps})
          </span>
        </div>

        {/* FPS Range */}
        <div className="flex justify-between items-center text-gray-400">
          <span>Range</span>
          <span>{stats.minFps} - {stats.maxFps}</span>
        </div>

        {/* Memory */}
        {stats.memory > 0 && (
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1">
              <HardDrive className="w-3 h-3" />
              Memory
            </span>
            <span>{stats.memory} MB</span>
          </div>
        )}

        {/* Load Time */}
        <div className="flex justify-between items-center">
          <span>Load Time</span>
          <span>{(stats.loadTime / 1000).toFixed(2)}s</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-white/20 text-xs text-gray-400">
        Press Ctrl+P to toggle
      </div>
    </Card>
  );
}