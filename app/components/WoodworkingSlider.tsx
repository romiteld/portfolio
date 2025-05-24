"use client"

import { useState } from "react"
import Image from "next/image"
import { useSpring, animated } from "@react-spring/web"
import type { SpringValue } from "@react-spring/web"

interface IImage {
  src: string
  alt: string
}

interface WoodworkingSliderProps {
  images: IImage[]
}

export default function WoodworkingSlider({ images }: WoodworkingSliderProps) {
  const [index, setIndex] = useState(0)

  interface AnimatedStyle {
    opacity: SpringValue<number>
    transform: SpringValue<string>
  }

  const props = useSpring<AnimatedStyle>({
    opacity: 1,
    transform: "perspective(500px) rotateY(0deg)",
    from: { 
      opacity: 0, 
      transform: "perspective(500px) rotateY(180deg)" 
    },
    config: { tension: 280, friction: 60 }
  })

  const nextSlide = () => {
    setIndex((prevIndex) => (prevIndex + 1) % images.length)
  }

  const prevSlide = () => {
    setIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length)
  }

  return (
    <div className="relative w-full max-w-3xl mx-auto h-64 sm:h-80 md:h-96">
      <animated.div
        style={{
          opacity: props.opacity.to((o) => o),
          transform: props.transform.to((t) => t),
        }}
        className="relative w-full h-full"
      >
        <Image
          src={images[index].src || "/placeholder.svg"}
          alt={images[index].alt}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover rounded-lg shadow-md"
        />
      </animated.div>

      <div className="absolute top-1/2 -translate-y-1/2 left-4">
        <button
          onClick={prevSlide}
          className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Prev
        </button>
      </div>
      <div className="absolute top-1/2 -translate-y-1/2 right-4">
        <button
          onClick={nextSlide}
          className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  )
}

