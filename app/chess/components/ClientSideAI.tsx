'use client';

import { useEffect, useState } from 'react';
import { initializeModel } from '../utils/clientNeuralNet';
import type { Board, Move, PieceColor } from '../types';

/**
 * Client-side AI Neural Network initialization component
 * This component preloads the neural network model when the page loads
 * to make the first AI move faster
 */
export default function ClientSideAI({ enabled = true }: { enabled?: boolean }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    
    // Only run in client
    if (typeof window === 'undefined') return;
    
    let mounted = true;
    
    async function loadModel() {
      try {
        setStatus('loading');
        console.log('Preloading chess neural network model...');
        
        const session = await initializeModel();
        
        if (!mounted) return;
        
        if (session) {
          setStatus('ready');
          console.log('Chess neural network model loaded successfully');
        } else {
          setStatus('error');
          setError('Failed to load neural network model');
        }
      } catch (err) {
        if (!mounted) return;
        
        console.error('Error loading neural network model:', err);
        setStatus('error');
        setError(err instanceof Error ? err.message : String(err));
      }
    }
    
    // Start loading after a short delay to avoid blocking initial render
    const timer = setTimeout(loadModel, 2000);
    
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [enabled]);

  // This is just a preloader component, so it doesn't render anything visible
  return null;
}

/**
 * Hook to get the model loading status
 */
export function useAIModelStatus() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Check if the model is already loaded
    const checkStatus = async () => {
      try {
        const session = await initializeModel();
        setStatus(session ? 'ready' : 'loading');
      } catch (err) {
        console.error('Error checking model status:', err);
        setStatus('error');
      }
    };
    
    checkStatus();
  }, []);
  
  return status;
}
