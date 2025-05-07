"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface AnalysisResult {
  labels: string[];
  description: string;
  faces?: {
    emotions?: string[];
    headwear?: string;
    glasses?: boolean;
  }[];
  text?: string[];
  landmarks?: string[];
}

export default function CameraCapture() {
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
      // First check if permissions are already granted
      const permissions = await navigator.permissions.query({ name: 'camera' as PermissionName });
      
      if (permissions.state === 'denied') {
        throw new Error('Camera permission has been blocked. Please reset permissions in your browser settings.');
      }
      
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        }
      });
      
      setStream(newStream);
      setIsCameraActive(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError("Camera permission denied. Please click 'Allow' when prompted by your browser, or reset permissions in your browser settings.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError("No camera detected. Please connect a camera and try again.");
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError("Camera is in use by another application. Please close other applications that might be using your camera.");
      } else {
        setError(`Could not access camera: ${err.message || 'Unknown error'}. Please ensure you've granted permission in your browser settings.`);
      }
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

  useEffect(() => {
    if (isCameraActive && autoAnalyze && !isAnalyzing) {
      analyzeFrame();
    }
  }, [isCameraActive, autoAnalyze, isAnalyzing]);

  useEffect(() => {
    // Start camera when component mounts
    startCamera();
    
    // Clean up function
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-gray-900 p-4 rounded-xl">
        <div className="relative bg-gray-800 rounded-xl overflow-hidden border border-gray-700" style={{ minHeight: '300px' }} data-component-name="CameraCapture">
          {isLoading ? (
            <div className="flex items-center justify-center h-[300px]" data-component-name="CameraCapture">
              <LoadingSpinner size="large" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-[300px] p-6 text-center" data-component-name="CameraCapture">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 16 16" className="text-red-500 mx-auto mb-4">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
              </svg>
              <p className="text-red-400" data-component-name="CameraCapture">{error}</p>
              <div className="mt-4 flex flex-col space-y-2">
                <button 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-medium"
                  onClick={startCamera}
                  data-component-name="CameraCapture"
                >
                  Try Again
                </button>
                <p className="text-xs text-gray-400 max-w-md" data-component-name="CameraCapture">
                  If your browser blocked camera permissions, you may need to reset them. Look for the camera icon in your address bar
                  or go to your browser settings to enable camera access for this site.
                </p>
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
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center">
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
              <button
                onClick={analyzeFrame}
                disabled={isAnalyzing}
                className={`ml-3 px-4 py-2 rounded-md text-sm font-medium ${
                  isAnalyzing
                    ? 'bg-gray-700 text-gray-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze Now'}
              </button>
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
      {results.labels && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h4 className="font-medium text-blue-400 mb-2">Objects & Elements</h4>
          <ul className="grid grid-cols-2 gap-2">
            {results.labels.map((label: string, i: number) => (
              <motion.li
                key={i}
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
      
      {results.faces && results.faces.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <h4 className="font-medium text-blue-400 mb-2">Face Analysis</h4>
          <div className="space-y-2">
            {results.faces.map((face: any, i: number) => (
              <motion.div
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
              </motion.div>
            ))}
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
      
      {results.landmarks && results.landmarks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <h4 className="font-medium text-blue-400 mb-2">Landmarks</h4>
          <ul className="space-y-1">
            {results.landmarks.map((landmark: string, i: number) => (
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