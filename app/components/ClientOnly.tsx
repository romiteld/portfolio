'use client'

import { useEffect, useState, ReactNode } from 'react'

interface ClientOnlyProps {
  children: ReactNode
  fallback?: ReactNode
  delay?: number // Optional delay to ensure complete DOM loading
}

/**
 * ClientOnly component ensures content only renders on the client-side
 * This prevents hydration errors with React Three Fiber and other client-only libraries
 * 
 * @param children The React components to render client-side only
 * @param fallback Optional component to show while waiting for client-side rendering
 * @param delay Optional delay in ms before rendering (default: 10ms)
 */
export default function ClientOnly({ 
  children, 
  fallback = null, 
  delay = 10 
}: ClientOnlyProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Use a small timeout to ensure React context is fully established
    // This helps prevent "Cannot read properties of undefined" errors
    const timer = setTimeout(() => {
      setMounted(true)
    }, delay)
    
    // Cleanup timer on unmount
    return () => {
      clearTimeout(timer)
      setMounted(false)
    }
  }, [delay])
  
  // Only render children when component is mounted client-side
  // This prevents SSR hydration mismatch errors
  if (!mounted) {
    // Return fallback if provided, otherwise a minimal placeholder
    return fallback !== null ? (
      <>{fallback}</>
    ) : (
      <div 
        style={{ 
          height: "100%", 
          width: "100%", 
          position: "relative",
          minHeight: "200px", // Ensures space is reserved
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <div className="animate-pulse flex flex-col items-center justify-center opacity-70">
          <div className="h-10 w-10 rounded-full border-t-2 border-b-2 border-blue-500 animate-spin"></div>
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading...</div>
        </div>
      </div>
    )
  }
  
  // Once mounted client-side, render the children
  return <>{children}</>
}