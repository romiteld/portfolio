"use client"

import dynamic from "next/dynamic"
import { motion } from "framer-motion"

const ImageSlider3D = dynamic(() => import("@/app/components/ImageSlider3D"), { ssr: false })

const woodworkingProjects = [
  { src: "/placeholder.svg?height=600&width=800", alt: "Handcrafted Dining Table" },
  { src: "/placeholder.svg?height=600&width=800", alt: "Modern Bookshelf" },
  { src: "/placeholder.svg?height=600&width=800", alt: "Rustic Coffee Table" },
  { src: "/placeholder.svg?height=600&width=800", alt: "Elegant Bedside Cabinet" },
  { src: "/placeholder.svg?height=600&width=800", alt: "Custom Kitchen Cabinets" },
  { src: "/placeholder.svg?height=600&width=800", alt: "Wooden Rocking Chair" },
  { src: "/placeholder.svg?height=600&width=800", alt: "Decorative Wall Shelf" },
  { src: "/placeholder.svg?height=600&width=800", alt: "Outdoor Garden Bench" },
]

export default function Woodworking() {
  return (
    <motion.div
      className="container mx-auto px-4 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h1
        className="text-3xl font-bold mb-8 text-center text-primary-600 dark:text-primary-400"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        Woodworking Projects
      </motion.h1>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <ImageSlider3D images={woodworkingProjects} />
      </motion.div>
    </motion.div>
  )
}

