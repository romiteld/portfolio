'use client';

import { useEffect, useState, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Cpu, HardDrive, Zap, X } from 'lucide-react';

interface PerformanceStats {
  fps: number;
  avgFps: number;
  minFps: number;
  maxFps: number;
  drawCalls: number;
  triangles: number;
  memory: number;
  loadTime: number;
}

export function PerformanceMonitor() {
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState<PerformanceStats>({
    fps: 60,
    avgFps: 60,
    minFps: 60,
    maxFps: 60,
    drawCalls: 0,
    triangles: 0,
    memory: 0,
    loadTime: 0
  });

  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const fpsHistory = useRef<number[]>([]);
  const { gl, scene } = useThree();

  useFrame(() => {
    frameCount.current++;
    const currentTime = performance.now();
    
    // Calculate FPS every second
    if (currentTime - lastTime.current >= 1000) {
      const fps = Math.round((frameCount.current * 1000) / (currentTime - lastTime.current));
      fpsHistory.current.push(fps);
      
      // Keep only last 60 seconds
      if (fpsHistory.current.length > 60) {
        fpsHistory.current.shift();
      }

      // Calculate stats
      const avgFps = Math.round(
        fpsHistory.current.reduce((a, b) => a + b, 0) / fpsHistory.current.length
      );
      const minFps = Math.min(...fpsHistory.current);
      const maxFps = Math.max(...fpsHistory.current);

      // Get render info
      const info = gl.info;
      const drawCalls = info.render.calls;
      const triangles = info.render.triangles;

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
        drawCalls,
        triangles,
        memory,
        loadTime: stats.loadTime
      });

      frameCount.current = 0;
      lastTime.current = currentTime;
    }
  });

  useEffect(() => {
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
    return () => window.removeEventListener('keydown', handleKeyPress);
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

        {/* Draw Calls */}
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1">
            <Cpu className="w-3 h-3" />
            Draw Calls
          </span>
          <span>{stats.drawCalls.toLocaleString()}</span>
        </div>

        {/* Triangles */}
        <div className="flex justify-between items-center">
          <span>Triangles</span>
          <span>{stats.triangles.toLocaleString()}</span>
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

// Performance tips component
export function PerformanceTips({ currentFPS }: { currentFPS: number }) {
  if (currentFPS >= 50) return null;

  const tips = currentFPS < 30 
    ? [
        'Consider reducing particle effects',
        'Disable post-processing on this device',
        'Use simplified geometry mode',
        'Reduce the number of visible nodes'
      ]
    : [
        'Performance is below optimal',
        'Some visual effects may be reduced',
        'Consider closing other applications'
      ];

  return (
    <Card className="absolute bottom-6 left-6 p-3 bg-yellow-900/80 backdrop-blur-sm border-yellow-600/50 text-yellow-200 max-w-xs">
      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
        <Activity className="w-4 h-4" />
        Performance Tips
      </h4>
      <ul className="text-xs space-y-1">
        {tips.map((tip, i) => (
          <li key={i}>• {tip}</li>
        ))}
      </ul>
    </Card>
  );
}