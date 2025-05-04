"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { motion } from "framer-motion"
import { gsap } from "gsap"

interface ImageSliderProps {
  images: { src: string; alt: string }[]
}

const ImageSlider3D: React.FC<ImageSliderProps> = ({ images }) => {
  const [index, setIndex] = useState(0)
  const imageRef = useRef<HTMLDivElement>(null)

  const nextSlide = () => {
    setIndex((prevIndex) => (prevIndex + 1) % images.length)
  }

  const prevSlide = () => {
    setIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length)
  }

  useEffect(() => {
    if (imageRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          imageRef.current!,
          { opacity: 0, rotationY: -90 },
          { opacity: 1, rotationY: 0, duration: 1, ease: "power3.out" },
        )
      }, imageRef)

      return () => ctx.revert()
    }
  }, [imageRef])

  return (
    <div className="relative w-full max-w-3xl mx-auto h-[60vh] flex items-center justify-center overflow-hidden">
      <div ref={imageRef} className="w-full h-full">
        <Image
          src={images[index].src || "/placeholder.svg"}
          alt={images[index].alt}
          layout="fill"
          objectFit="contain"
          className="rounded-lg shadow-xl"
        />
      </div>
      <motion.button
        onClick={prevSlide}
        className="absolute left-4 z-10 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-white p-2 rounded-full shadow-md hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <ChevronLeft size={24} />
      </motion.button>
      <motion.button
        onClick={nextSlide}
        className="absolute right-4 z-10 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-white p-2 rounded-full shadow-md hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <ChevronRight size={24} />
      </motion.button>
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-neutral-800 px-4 py-2 rounded-full shadow-md">
        {index + 1} / {images.length}
      </div>
    </div>
  )
}

export default ImageSlider3D

