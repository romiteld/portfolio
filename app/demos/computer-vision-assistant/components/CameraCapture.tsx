"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface AnalysisResult {
  labels?: string[];
  description?: string;
  text?: string[];
  math_solution?: string;
  faces?: {
    emotions?: string[];
    headwear?: string;
    glasses?: boolean;
  }[];
  landmarks?: string[];
  objects?: {
    name: string;
    confidence: number;
  }[];
}

interface CameraCaptureProps {
  onAnalysisComplete?: (result: AnalysisResult) => void;
}

export default function CameraCapture({ onAnalysisComplete }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [autoAnalyze, setAutoAnalyze] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoAnalyzeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('user');

  useEffect(() => {
    return () => {
      // Clean up timers
      if (autoAnalyzeTimerRef.current) {
        clearTimeout(autoAnalyzeTimerRef.current);
      }
      
      // Clean up camera stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (stream) {
        // If there's an existing stream, stop all tracks
        stream.getTracks().forEach(track => track.stop());
      }
      
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: cameraFacingMode
        }
      });
      
      setStream(newStream);
      setIsCameraActive(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access camera. Please ensure you've granted permission and no other app is using it.");
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraActive(false);
      setAutoAnalyze(false);
      
      if (autoAnalyzeTimerRef.current) {
        clearTimeout(autoAnalyzeTimerRef.current);
      }
    }
  };

  const switchCamera = async () => {
    // Toggle camera facing mode
    const newMode = cameraFacingMode === 'user' ? 'environment' : 'user';
    setCameraFacingMode(newMode);
    
    // Restart camera with new mode
    if (isCameraActive) {
      stopCamera();
      setTimeout(() => {
        startCamera();
      }, 300);
    }
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return null;
    
    // Set canvas size to match video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get image data as base64
    const imageData = canvas.toDataURL('image/jpeg');
    return imageData;
  };

  const analyzeFrame = async () => {
    if (!isCameraActive || isAnalyzing) return;
    
    const imageData = captureFrame();
    if (!imageData) return;
    
    setIsAnalyzing(true);
    
    try {
      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageData }),
      });
      
      if (!response.ok) {
        throw new Error('Analysis failed');
      }
      
      const data = await response.json();
      setAnalysisResults(data);
      
      // Pass analysis results to parent component if callback provided
      if (onAnalysisComplete) {
        onAnalysisComplete(data);
      }
      
      // Schedule next analysis if auto-analyze is enabled
      if (autoAnalyze) {
        autoAnalyzeTimerRef.current = setTimeout(() => {
          analyzeFrame();
        }, 3000); // Analyze every 3 seconds
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      setError('Failed to analyze image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Trigger auto-analysis when enabled
  useEffect(() => {
    if (isCameraActive && autoAnalyze && !isAnalyzing) {
      analyzeFrame();
    }
  }, [isCameraActive, autoAnalyze, isAnalyzing]);

  // Start camera when component mounts
  useEffect(() => {
    startCamera();
    
    // Clean up function
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-gray-900 p-4 rounded-xl">
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <ul className="grid grid-cols-2 gap-2 mt-4">
                <li className="col-span-2 text-sm text-gray-400 mb-1">No objects detected. Try adjusting the camera.</li>
              </ul>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex items-center justify-center text-center p-6">
              <div>
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 16 16" className="text-red-500 mx-auto mb-4">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                  <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
                </svg>
                <p className="text-red-400">{error}</p>
                <button 
                  onClick={startCamera}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-medium"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              playsInline
              muted
            />
          )}
          
          {isAnalyzing && (
            <div className="absolute top-4 right-4">
              <div className="bg-black bg-opacity-60 rounded-full p-2 animate-pulse">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap items-center justify-between mt-4 gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={isCameraActive ? stopCamera : startCamera}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                isCameraActive
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isCameraActive ? 'Stop Camera' : 'Start Camera'}
            </button>
            
            {isCameraActive && (
              <>
                <button
                  onClick={analyzeFrame}
                  disabled={isAnalyzing}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    isAnalyzing
                      ? 'bg-gray-700 text-gray-300 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Now'}
                </button>
                
                <button
                  onClick={switchCamera}
                  className="px-4 py-2 rounded-md text-sm font-medium bg-gray-700 hover:bg-gray-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Switch Camera
                </button>
              </>
            )}
          </div>
          
          {isCameraActive && (
            <div className="flex items-center">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={autoAnalyze}
                  onChange={() => setAutoAnalyze(!autoAnalyze)}
                />
                <div className="relative w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-sm font-medium text-gray-300">Auto-Analyze</span>
              </label>
            </div>
          )}
        </div>
        
        {/* Hidden canvas for image capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
      
      <div className="bg-gray-900 p-4 rounded-xl">
        <h3 className="text-lg font-medium mb-4">Analysis Results</h3>
        {isAnalyzing ? (
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-center">
              <LoadingSpinner size="large" />
              <p className="mt-4 text-gray-400">Processing your image with AI...</p>
            </div>
          </div>
        ) : analysisResults ? (
          <div className="h-[400px] overflow-y-auto pr-2">
            <AnalysisResults results={analysisResults} />
          </div>
        ) : (
          <div className="h-[400px] flex items-center justify-center text-gray-500 text-center">
            <div>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 16 16" className="mx-auto mb-4">
                <path d="M8 2a5.53 5.53 0 0 0-3.594 1.342c-.766.66-1.321 1.52-1.464 2.383C1.266 6.095 0 7.555 0 9.318 0 11.366 1.708 13 3.781 13h8.906C14.502 13 16 11.57 16 9.773c0-1.636-1.242-2.969-2.834-3.194C12.923 3.999 10.69 2 8 2zm2.354 5.146a.5.5 0 0 1-.708.708L8.5 6.707V10.5a.5.5 0 0 1-1 0V6.707L6.354 7.854a.5.5 0 1 1-.708-.708l2-2a.5.5 0 0 1 .708 0l2 2z"/>
              </svg>
              <p>Click "Analyze Now" to see what the AI detects</p>
              <p className="text-sm mt-2">Or enable "Auto-Analyze" for continuous detection</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface AnalysisResultsProps {
  results: AnalysisResult;
}

function AnalysisResults({ results }: AnalysisResultsProps) {
  return (
    <div className="space-y-4">
      {results.math_solution && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-blue-900/30 border border-blue-500/50 p-3 rounded-md"
        >
          <h4 className="font-medium text-blue-400 mb-2">Math Solution</h4>
          <div className="bg-gray-800 p-3 rounded-md text-sm">
            <p className="text-lg font-semibold">{results.math_solution}</p>
          </div>
        </motion.div>
      )}
      
      {results.objects && results.objects.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h4 className="font-medium text-blue-400 mb-2">Objects Detected</h4>
          <ul role="list" className="grid grid-cols-2 gap-2">
            {results.objects.map((object, i) => (
              <motion.li
                key={i} role="listitem"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
                className="bg-gray-800 px-3 py-2 rounded-md text-sm flex items-center justify-between"
              >
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  {object.name}
                </li>
                <li className="text-xs opacity-70">{Math.round(object.confidence * 100)}%</li>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}
      
      {results.labels && results.labels.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h4 className="font-medium text-blue-400 mb-2">Things I See</h4>
          <ul role="list" className="grid grid-cols-2 gap-2">
            {results.labels.map((label, i) => (
              <motion.li
                key={i}
                role="listitem"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
                className="bg-gray-800 px-3 py-2 rounded-md text-sm flex items-center"
              >
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                {label}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}
      
      {results.description && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <h4 className="font-medium text-blue-400 mb-2">Description</h4>
          <div className="bg-gray-800 p-3 rounded-md text-sm">
            {results.description}
          </div>
        </motion.div>
      )}
      
      {results.text && results.text.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <h4 className="font-medium text-blue-400 mb-2">Text Detected</h4>
          <div className="bg-gray-800 p-3 rounded-md text-sm">
            {results.text.join(' ')}
          </div>
        </motion.div>
      )}
      
      {results.faces && results.faces.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <h4 className="font-medium text-blue-400 mb-2">Face Analysis</h4>
          <div className="space-y-2">
            {results.faces.map((face, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.2 + i * 0.05 }}
                className="bg-gray-800 p-3 rounded-md text-sm"
              >
                <div className="font-medium mb-1">Face {i+1}</div>
                <ul className="space-y-1 text-gray-300">
                  {face.emotions && <li>Emotion: {face.emotions.join(', ')}</li>}
                  {face.headwear && <li>Headwear: {face.headwear}</li>}
                  {face.glasses && <li>Glasses: Yes</li>}
                </ul>
              </motion.li>
            ))}
          </div>
        </motion.div>
      )}
      
      {results.landmarks && results.landmarks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <h4 className="font-medium text-blue-400 mb-2">Landmarks</h4>
          <ul role="list" className="space-y-1">
            {results.landmarks.map((landmark, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.4 + i * 0.05 }}
                className="bg-gray-800 px-3 py-2 rounded-md text-sm"
              >
                {landmark}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
}