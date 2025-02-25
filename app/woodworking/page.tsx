"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import type { Photo } from "@/lib/types"
import Gallery from "@/app/components/Gallery"
import fs from 'fs'
import path from 'path'

export default function Woodworking() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPhotos = async () => {
      try {
        setLoading(true)
        // The photos will be served from the public/photos directory
        const response = await fetch('/api/photos')
        const data = await response.json()
        
        if (!data || !data.photos) {
          throw new Error('No photos found')
        }

        setPhotos(data.photos)
      } catch (err) {
        console.error('Error loading photos:', err)
        setError(`Failed to load photos: ${err instanceof Error ? err.message : 'Unknown error'}`)
      } finally {
        setLoading(false)
      }
    }

    loadPhotos()
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-4xl font-bold mb-8 text-primary-600 dark:text-primary-400"
        >
          Woodworking Projects
        </motion.h1>
        
        <motion.p
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-lg text-neutral-700 dark:text-neutral-300 mb-12"
        >
          Collection of some of my woodworking custom furniture builds, additions, and more.
        </motion.p>

        {loading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 dark:text-red-400 py-8">
            {error}
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center text-neutral-500 dark:text-neutral-400 py-8">
            No photos found. Please make sure you have uploaded some photos.
          </div>
        ) : (
          <Gallery photos={photos} />
        )}
      </div>
    </motion.div>
  )
}

