"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { useInView } from "react-intersection-observer"
import type { Photo } from "@/lib/types"
import { gsap } from "gsap"

interface GalleryProps {
  photos: Photo[]
}

export default function Gallery({ photos: initialPhotos }: GalleryProps) {
  const [photos, setPhotos] = useState(() => initialPhotos.slice(0, 24))
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(initialPhotos.length > 24)
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false
  })
  const galleryRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const PHOTOS_PER_PAGE = 24

  useEffect(() => {
    if (inView && hasMore) {
      const start = page * PHOTOS_PER_PAGE
      const end = start + PHOTOS_PER_PAGE
      const nextPhotos = initialPhotos.slice(start, end)
      
      if (nextPhotos.length > 0) {
        setPhotos(prev => [...prev, ...nextPhotos])
        setPage(prev => prev + 1)
        setHasMore(end < initialPhotos.length)
      } else {
        setHasMore(false)
      }
    }
  }, [inView, hasMore, initialPhotos, page])

  useEffect(() => {
    if (galleryRef.current) {
      const ctx = gsap.context(() => {
        gsap.from(".gallery-item", {
          opacity: 0,
          y: 20,
          duration: 0.5,
          stagger: {
            amount: 0.3,
            from: "start"
          },
          ease: "power2.out",
          clearProps: "all"
        })
      }, galleryRef.current)

      return () => ctx.revert()
    }
  }, [photos])

  useEffect(() => {
    if (selectedPhoto && previewRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(".preview-backdrop",
          { 
            backdropFilter: "blur(0px)",
            backgroundColor: "rgba(0, 0, 0, 0)" 
          },
          { 
            backdropFilter: "blur(20px)",
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            duration: 0.5,
            ease: "power2.out"
          }
        )

        gsap.fromTo(".preview-container",
          { 
            scale: 0.8,
            y: 50,
            opacity: 0
          },
          { 
            scale: 1,
            y: 0,
            opacity: 1,
            duration: 0.6,
            ease: "power3.out",
            delay: 0.2
          }
        )
      }, previewRef.current)

      return () => ctx.revert()
    }
  }, [selectedPhoto])

  return (
    <>
      <div ref={galleryRef} className="relative max-w-7xl mx-auto px-4">
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4">
          {photos.map((photo, index) => {
            return (
              <div 
                key={photo.id} 
                className="gallery-item break-inside-avoid mb-4 cursor-pointer overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                onClick={() => setSelectedPhoto(photo)}
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    width={800}
                    height={600}
                    className="w-full h-full object-cover rounded-lg"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    priority={index < 8}
                    loading={index < 8 ? "eager" : "lazy"}
                    quality={75}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Loading indicator */}
        {hasMore && (
          <div 
            ref={ref}
            className="flex justify-center items-center py-8"
          >
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        )}
      </div>

      {/* Fullscreen Preview */}
      <AnimatePresence>
        {selectedPhoto && (
          <div
            ref={previewRef}
            className="preview-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <div
              className="preview-container relative w-full max-w-6xl aspect-auto max-h-[90vh] rounded-xl overflow-hidden bg-black/90 backdrop-blur-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <Image
                  src={selectedPhoto.src}
                  alt={selectedPhoto.alt}
                  width={1920}
                  height={1440}
                  className="w-full h-full object-contain"
                  sizes="100vw"
                  priority
                  quality={90}
                />
              </div>
              <motion.button
                className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 backdrop-blur-sm"
                onClick={() => setSelectedPhoto(null)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Close preview"
                aria-label="Close image preview"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </motion.button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
} 