"use client"

import { motion } from "framer-motion"

export default function About() {
  return (
    <motion.div
      className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h1
        className="text-3xl font-bold mb-8 text-primary-600 dark:text-primary-400"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        About Me
      </motion.h1>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <p className="text-lg mb-6 text-neutral-700 dark:text-neutral-300">
          I&apos;m an AI Engineer with a passion for creating intelligent systems that solve real-world problems. With years
          of experience in machine learning, natural language processing, and computer vision, I&apos;ve developed a range of
          AI applications that push the boundaries of what&apos;s possible.
        </p>
        <p className="text-lg mb-6 text-neutral-700 dark:text-neutral-300">
          When I&apos;m not coding or training neural networks, you&apos;ll find me in my woodworking shop. Woodworking is my
          creative outlet, allowing me to bring designs to life with my hands. The precision and patience required in
          woodworking complement my technical skills in AI, creating a perfect balance between the digital and physical
          worlds.
        </p>
        <p className="text-lg text-neutral-700 dark:text-neutral-300">
          Through this portfolio, I aim to showcase both my AI projects and woodworking creations, demonstrating how
          diverse interests can fuel innovation and creativity in unexpected ways.
        </p>
      </motion.div>
    </motion.div>
  )
}

