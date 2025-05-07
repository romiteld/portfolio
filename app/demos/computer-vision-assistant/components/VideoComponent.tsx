"use client";

import { useEffect, useRef, useState } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function VideoComponent() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  // Check if camera is actually available
  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Camera API not available in this browser");
      setIsLoading(false);
      return;
    }
    
    async function checkDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        if (videoDevices.length === 0) {
          setError("No camera detected on this device");
          setIsLoading(false);
        } else {
          setDebugInfo(`Found ${videoDevices.length} video devices`);
        }
      } catch (err) {
        console.error("Error checking devices:", err);
      }
    }
    
    checkDevices();
  }, []);

  useEffect(() => {
    async function setupCamera() {
      if (error) return null; // Don't proceed if we already have an error
      
      try {
        console.log("Attempting to access camera...");
        
        // First check permission status if possible
        if (navigator.permissions && navigator.permissions.query) {
          try {
            const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
            console.log("Camera permission status:", permissionStatus.state);
            
            if (permissionStatus.state === 'denied') {
              setError("Camera access denied. Please allow camera access in your browser settings.");
              setHasPermission(false);
              setIsLoading(false);
              return null;
            }
          } catch (permErr) {
            console.log("Permission check not supported", permErr);
          }
        }
        
        // Try to access the camera
        const constraints = {
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          },
          audio: false
        };
        
        console.log("Requesting media with constraints:", constraints);
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log("Stream obtained:", stream.id, "with", stream.getVideoTracks().length, "video tracks");
        
        setDebugInfo(`Stream active: ${stream.active}, tracks: ${stream.getVideoTracks().length}`);
        setHasPermission(true);
        
        if (videoRef.current) {
          console.log("Setting stream to video element");
          videoRef.current.srcObject = stream;
          
          // Make sure autoplay works
          try {
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  console.log("Video playback started successfully");
                  setIsLoading(false);
                })
                .catch(playErr => {
                  console.error("Error playing video:", playErr);
                  setError("Error starting video playback. Try clicking the video area.");
                  setIsLoading(false);
                });
            }
          } catch (playErr) {
            console.error("Exception during play():", playErr);
          }
          
          videoRef.current.onloadedmetadata = () => {
            console.log("Video metadata loaded");
            setIsLoading(false);
          };
        } else {
          console.error("Video ref is null");
          setError("Video element not available");
          setIsLoading(false);
        }

        return () => {
          console.log("Cleaning up camera stream");
          stream.getTracks().forEach(track => {
            console.log(`Stopping track: ${track.kind}, ${track.label}, enabled: ${track.enabled}`);
            track.stop();
          });
        };
      } catch (err) {
        console.error("Error accessing camera:", err);
        let errorMessage = "Could not access camera. ";
        
        if (err instanceof DOMException) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            errorMessage += "Permission denied. Please allow camera access in your browser settings.";
            setHasPermission(false);
          } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            errorMessage += "No camera device found.";
          } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
            errorMessage += "Camera is already in use by another application.";
          } else if (err.name === 'OverconstrainedError') {
            errorMessage += "Camera cannot satisfy the requested constraints.";
          } else {
            errorMessage += `${err.name}: ${err.message}`;
          }
        } else {
          errorMessage += String(err);
        }
        
        setError(errorMessage);
        setIsLoading(false);
        return null;
      }
    }

    const cleanupPromise = setupCamera();
    return () => {
      cleanupPromise?.then(cleanupFn => {
        if (cleanupFn) cleanupFn();
      }).catch(err => console.error("Error in cleanup:", err));
    };
  }, [error]);

  // Function to manually retry camera access
  const retryCamera = () => {
    setIsLoading(true);
    setError(null);
    setDebugInfo(null);
    setHasPermission(null);
  };

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner size="large" />
          <span className="ml-3 text-white">Initializing camera...</span>
        </div>
      ) : error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-red-400 mb-3">{error}</p>
          {hasPermission === false && (
            <div className="text-sm text-gray-400 mb-4">
              To fix this, try:<br/>
              1. Check your browser's address bar for camera permission<br/>
              2. Open browser settings and reset camera permissions<br/>
              3. Make sure no other app is using your camera
            </div>
          )}
          <button 
            onClick={retryCamera}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white text-sm font-medium"
          >
            Try Again
          </button>
          {debugInfo && <div className="text-xs text-gray-500 mt-3">{debugInfo}</div>}
        </div>
      ) : (
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted
          onClick={(e) => {
            if (videoRef.current && videoRef.current.paused) {
              videoRef.current.play().catch(err => console.error("Error playing video on click:", err));
            }
          }}
        />
      )}
    </div>
  );
}