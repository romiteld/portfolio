'use client'

import { useEffect, useState, ReactNode } from 'react'

interface ClientOnlyProps {
  children: ReactNode
  fallback?: ReactNode
}

export default function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [mounted, setMounted] = useState(false)

  // Use useEffect with empty deps array to only run once on mount
  useEffect(() => {
    // Need to wait for React to finish hydration to prevent mismatch
    setTimeout(() => {
      setMounted(true)
    }, 0)
    
    // Cleanup function for unmounting
    return () => {
      setMounted(false)
    }
  }, [])
  
  // Early return until client-side hydration is complete
  if (!mounted) {
    return fallback !== null ? (
      <>{fallback}</>
    ) : (
      // Minimal loading state
      <div style={{ height: "100%", width: "100%", position: "relative" }}></div>
    )
  }
  
  return <>{children}</>
} 