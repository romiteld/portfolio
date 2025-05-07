"use client";

import React, { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

// Loading placeholder for camera
const CameraLoadingPlaceholder = () => (
  <div className="relative w-full aspect-video bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden border border-gray-700">
    <LoadingSpinner size="large" className="text-blue-500" />
    <p className="mt-4 text-gray-400">Initializing camera...</p>
  </div>
);

// Loading placeholder for component initialization
const ComponentLoadingPlaceholder = () => (
  <div className="text-center">
    <LoadingSpinner size="large" />
    <p className="mt-4 text-gray-400">Initializing camera components...</p>
  </div>
);

// Dynamically import components with proper Next.js dynamic approach
const CameraCapture = dynamic(
  () => import("./components/CameraCapture"),
  { 
    ssr: false,
    loading: () => <CameraLoadingPlaceholder />
  }
);

const VoiceInterface = dynamic(
  () => import("./components/VoiceInterface"), 
  { 
    ssr: false,
    loading: () => <ComponentLoadingPlaceholder /> 
  }
);

// ClientOnly component to prevent hydration errors
const ClientOnly = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  return mounted ? <>{children}</> : null;
};

// Main component
export default function ComputerVisionAssistant() {
  const [isClient, setIsClient] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState<{camera: boolean, microphone: boolean}>({camera: false, microphone: false});
  const [permissionRequesting, setPermissionRequesting] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Function to request camera and microphone permissions together
  const requestPermissions = async () => {
    setPermissionRequesting(true);
    try {
      // Check if mediaDevices is available (browser security restrictions)
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Browser doesn't support or allow media devices access");
      }

      // Request both camera and microphone permissions at once
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      // Permissions granted, update state
      setPermissionsGranted({ camera: true, microphone: true });
      
      // Stop the streams after getting permissions
      stream.getTracks().forEach(track => track.stop());
    } catch (error: unknown) {
      // More detailed error logging with proper TypeScript handling
      const err = error as Error;
      console.error('Error requesting permissions:', {
        name: err.name || 'Unknown error',
        message: err.message || 'No error message provided',
        stack: err.stack,
        error
      });

      // Handle specific error types
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        console.warn('Permission denied by user');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        console.warn('Required camera or microphone not found');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        console.warn('Camera or microphone already in use');
      } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
        console.warn('Camera constraints cannot be satisfied');
      }

      // Check individual permissions
      try {
        // Try camera only
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setPermissionsGranted(prev => ({ ...prev, camera: true }));
        videoStream.getTracks().forEach(track => track.stop());
      } catch (vError: unknown) {
        const videoError = vError as Error;
        console.warn('Camera permission denied:', videoError.name || 'Unknown error');
        setPermissionsGranted(prev => ({ ...prev, camera: false }));
      }
      
      try {
        // Try audio only
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setPermissionsGranted(prev => ({ ...prev, microphone: true }));
        audioStream.getTracks().forEach(track => track.stop());
      } catch (aError: unknown) {
        const audioError = aError as Error;
        console.warn('Microphone permission denied:', audioError.name || 'Unknown error');
        setPermissionsGranted(prev => ({ ...prev, microphone: false }));
      }
    } finally {
      setPermissionRequesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 text-center"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            Computer Vision Assistant
          </h1>
          <p className="mt-4 text-lg text-gray-300 max-w-3xl mx-auto">
            Explore the power of real-time computer vision. Use your camera and voice to interact with 
            AI-powered object detection, scene understanding, and intelligent analysis in real-time.
          </p>
        </motion.div>

        {!permissionsGranted.camera || !permissionsGranted.microphone ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg mx-auto bg-gray-800/80 rounded-xl p-6 mb-8 border border-gray-700 shadow-xl"
          >
            <h2 className="text-xl font-semibold mb-4 text-center">Enable Camera & Microphone</h2>
            <p className="text-gray-300 mb-6">
              This demo requires both camera and microphone access to provide a complete AI assistant experience.
              Click the button below to grant access to both.
            </p>
            
            <div className="flex flex-col space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg border ${permissionsGranted.camera ? 'border-green-500 bg-green-900/20' : 'border-gray-600 bg-gray-700/30'}`}>
                  <div className="flex items-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${permissionsGranted.camera ? 'text-green-400' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">Camera</span>
                  </div>
                  <span className={`text-sm ${permissionsGranted.camera ? 'text-green-400' : 'text-gray-400'}`}>
                    {permissionsGranted.camera ? 'Access granted' : 'Access needed'}
                  </span>
                </div>
                
                <div className={`p-4 rounded-lg border ${permissionsGranted.microphone ? 'border-green-500 bg-green-900/20' : 'border-gray-600 bg-gray-700/30'}`}>
                  <div className="flex items-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${permissionsGranted.microphone ? 'text-green-400' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    <span className="font-medium">Microphone</span>
                  </div>
                  <span className={`text-sm ${permissionsGranted.microphone ? 'text-green-400' : 'text-gray-400'}`}>
                    {permissionsGranted.microphone ? 'Access granted' : 'Access needed'}
                  </span>
                </div>
              </div>
              
              <button
                onClick={requestPermissions}
                disabled={permissionRequesting}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${permissionRequesting ? 'bg-blue-700 cursor-wait' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {permissionRequesting ? (
                  <span className="flex items-center justify-center">
                    <LoadingSpinner size="small" className="mr-2" />
                    Requesting Access...
                  </span>
                ) : (
                  'Enable Camera & Microphone'
                )}
              </button>
              
              <p className="text-xs text-gray-400 text-center">
                If you've previously denied permissions, you may need to click the camera/microphone icon in your browser's address bar.
              </p>
            </div>
          </motion.div>
        ) : null}

        <div className="max-w-6xl mx-auto">
          <ClientOnly>
            {permissionsGranted.camera && permissionsGranted.microphone ? (
              <>
                <Suspense fallback={<CameraLoadingPlaceholder />}>
                  <CameraCapture />
                </Suspense>
                <div className="mt-8">
                  <Suspense fallback={<ComponentLoadingPlaceholder />}>
                    <VoiceInterface />
                  </Suspense>
                </div>
              </>
            ) : isClient ? (
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <h3 className="text-xl font-medium mb-2">Permissions Required</h3>
                <p className="text-gray-400 mb-4">
                  Please grant camera and microphone permissions to use the Computer Vision Assistant.
                </p>
              </div>
            ) : (
              <CameraLoadingPlaceholder />
            )}
          </ClientOnly>
        </div>
      </div>
    </div>
  );
}