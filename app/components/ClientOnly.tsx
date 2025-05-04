'use client'

import { useEffect, useState, ReactNode } from 'react'

interface ClientOnlyProps {
  children: ReactNode
}

export default function ClientOnly({ children }: ClientOnlyProps) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) {
    return null // or a loading placeholder
  }
  
  return <>{children}</>
} 