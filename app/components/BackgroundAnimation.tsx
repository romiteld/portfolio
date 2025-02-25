"use client"

import type React from "react"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"

interface AnimatedDot {
  width: number
  height: number
  top: string
  left: string
  yOffset: number
}

const BackgroundAnimation: React.FC = () => {
  const [dots, setDots] = useState<AnimatedDot[]>([])

  useEffect(() => {
    // Generate dots only on client side
    const newDots = Array(20).fill(null).map(() => ({
      width: Math.random() * 20 + 5,
      height: Math.random() * 20 + 5,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      yOffset: Math.random() * 100 - 50
    }))
    setDots(newDots)
  }, [])

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute inset-0 opacity-20 dark:opacity-10"
        animate={{
          backgroundImage: [
            "radial-gradient(circle, var(--tw-color-primary-300) 0%, transparent 60%)",
            "radial-gradient(circle, var(--tw-color-accent-300) 0%, transparent 60%)",
            "radial-gradient(circle, var(--tw-color-primary-300) 0%, transparent 60%)",
          ],
        }}
        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 10, ease: "linear" }}
      />
      {dots.map((dot, i) => (
        <motion.div
          key={i}
          className="absolute bg-primary-500 dark:bg-primary-300 rounded-full"
          style={{
            width: dot.width,
            height: dot.height,
            top: dot.top,
            left: dot.left,
          }}
          animate={{
            y: [0, dot.yOffset],
            opacity: [0, 1, 0],
          }}
          transition={{
            repeat: Number.POSITIVE_INFINITY,
            duration: Math.random() * 10 + 10,
            ease: "linear",
          }}
        />
      ))}
    </div>
  )
}

export default BackgroundAnimation

