"use client"

import type React from "react"
import { motion } from "framer-motion"

const BackgroundAnimation: React.FC = () => {
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
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute bg-primary-500 dark:bg-primary-300 rounded-full"
          style={{
            width: Math.random() * 20 + 5,
            height: Math.random() * 20 + 5,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, Math.random() * 100 - 50],
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

