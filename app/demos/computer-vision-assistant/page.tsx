"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import "./computerVision.css";

// Define message interface
interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// Dynamically import components to avoid SSR issues
const VideoComponent = dynamic(
  () => import("./components/VideoComponent"),
  { 
    ssr: false, 
    loading: () => <VideoLoadingPlaceholder /> 
  }
);

// Copy the VoiceInterface-fixed to VoiceInterface
const VoiceInterface = dynamic(
  () => import("./components/VoiceInterface-fixed").then(mod => {
    // Return the default export
    return mod.default;
  }),
  {
    ssr: false,
    loading: () => <div className="h-64 bg-gray-800 rounded-lg animate-pulse"></div>
  }
);

// Loading placeholder for video
function VideoLoadingPlaceholder() {
  return (
    <div className="w-full h-[300px] bg-gray-900 rounded-lg flex items-center justify-center">
      <LoadingSpinner size="large" />
    </div>
  );
}

// ClientOnly wrapper to prevent hydration errors
const ClientOnly = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  return mounted ? <>{children}</> : null;
};

export default function ComputerVisionAssistant() {
  const [isClient, setIsClient] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  // Initialize on client-side only
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Request permissions for camera and microphone
  const requestPermissions = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setPermissionsGranted(true);
    } catch (error) {
      console.error("Error requesting permissions:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <header className="border-b border-gray-800 p-4">
        <h1 className="text-xl font-medium">Computer Vision Assistant</h1>
      </header>
      
      <main className="flex-1 overflow-hidden flex flex-col">
        {!permissionsGranted ? (
          <div className="flex items-center justify-center h-full">
            <div className="max-w-md w-full bg-gray-800 p-6 rounded-lg text-center">
              <h2 className="text-xl font-medium mb-4">Enable camera & microphone</h2>
              <p className="text-gray-300 mb-6">
                This demo requires camera and microphone access to provide a complete AI assistant experience.
              </p>
              <button
                onClick={requestPermissions}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-full text-white font-medium"
              >
                Start stream
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row h-full">
            {/* Left column - Camera view */}
            <div className="w-full md:w-1/2 p-4 flex flex-col">
              <h2 className="text-lg font-medium mb-3">Camera View</h2>
              <div className="flex-1 bg-gray-800 rounded-lg overflow-hidden">
                <ClientOnly>
                  <VideoComponent />
                </ClientOnly>
              </div>
            </div>
            
            {/* Right column - Voice interface */}
            <div className="w-full md:w-1/2 p-4 flex flex-col">
              <h2 className="text-lg font-medium mb-3">Voice Assistant</h2>
              <div className="flex-1 bg-gray-800 rounded-lg p-4">
                <ClientOnly>
                  <VoiceInterface />
                </ClientOnly>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}