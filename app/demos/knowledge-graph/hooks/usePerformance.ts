import { useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';

export function usePerformance() {
  const { gl } = useThree();
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('high');
  const [fps, setFps] = useState(60);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        setFps(frameCount);
        
        // Adjust quality based on FPS
        if (frameCount < 30 && quality !== 'low') {
          setQuality('low');
          gl.setPixelRatio(1);
        } else if (frameCount >= 30 && frameCount < 50 && quality !== 'medium') {
          setQuality('medium');
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        } else if (frameCount >= 50 && quality !== 'high') {
          setQuality('high');
          gl.setPixelRatio(window.devicePixelRatio);
        }
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };

    const animationId = requestAnimationFrame(measureFPS);
    
    return () => cancelAnimationFrame(animationId);
  }, [gl, quality]);

  return { quality, fps };
}