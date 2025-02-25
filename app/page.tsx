"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { MotionPathPlugin } from "gsap/MotionPathPlugin"

// Register GSAP plugin
gsap.registerPlugin(MotionPathPlugin)

export default function Home() {
  const mainRef = useRef<HTMLDivElement>(null)
  const text = "i, I'm Danny"

  useEffect(() => {
    if (mainRef.current) {
      const ctx = gsap.context(() => {
        // Create timeline for roll-in animation
        const tl = gsap.timeline({
          onComplete: () => {
            // Start continuous flip animation on H after roll-in
            gsap.to(".flipH", {
              rotationY: 360,
              duration: 2,
              ease: "linear",
              repeat: -1,
              repeatDelay: 1,
            })
          },
        })

        // Roll-in animation for heading
        tl.from(".hero-heading", {
          y: -100,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
          skewY: 10,
        })

        // Stagger in letters
        tl.from(
          ".hero-heading .letter:not(.flipH)",
          {
            opacity: 0,
            y: 20,
            duration: 0.5,
            stagger: 0.05,
            ease: "power2.out",
          },
          "-=0.5",
        )

        // Animate other elements
        gsap.from(".hero-paragraph", {
          opacity: 0,
          y: 50,
          duration: 1,
          ease: "power3.out",
          delay: 1.2,
        })

        // Keep existing button animations
        const buttons = gsap.utils.toArray(".hero-buttons > *") as Element[]
        buttons.forEach((button: Element) => {
          const svg = button.querySelector("svg")
          const path = svg?.querySelector(".button-path")
          const line = svg?.querySelector(".motion-line")

          if (svg && path && line) {
            const { width, height } = button.getBoundingClientRect()
            const size = Math.max(width, height)
            const cx = size / 2
            const cy = size / 2
            const radius = size / 2 - 8

            // Set up the circular path
            const d = `M ${cx},${cy - radius} A ${radius},${radius} 0 0 1 ${cx},${cy + radius} A ${radius},${radius} 0 0 1 ${cx},${cy - radius}Z`
            path.setAttribute("d", d)
            line.setAttribute("d", d) // Set the same path for the motion line

            // Set initial path properties
            const isAIButton = button.classList.contains("ai-button")
            path.setAttribute("stroke", isAIButton ? "#60a5fa33" : "#34d39933")
            path.setAttribute("stroke-width", "2")

            // Set up the line animation
            gsap.set(line, {
              strokeDasharray: "0.1 100",
              strokeDashoffset: 0,
              strokeWidth: 3,
              opacity: 0,
            })

            // Create timeline for line animation
            gsap
              .timeline({
                repeat: -1,
              })
              .to(line, {
                strokeDasharray: "50 50",
                opacity: 1,
                duration: 1,
                ease: "power2.in",
              })
              .to(line, {
                strokeDasharray: "0.1 100",
                opacity: 0,
                duration: 1,
                ease: "power2.out",
              })
              .to(
                line,
                {
                  rotation: 360,
                  svgOrigin: `${cx} ${cy}`,
                  duration: 2,
                  ease: "none",
                },
                0,
              )
          }
        })
      }, mainRef)

      return () => ctx.revert()
    }
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <motion.main ref={mainRef} className="flex flex-col items-center justify-center flex-1 px-4 sm:px-20 text-center">
        <h1 className="hero-heading text-4xl sm:text-6xl font-bold mb-4 font-heading text-primary-600 dark:text-primary-400">
          <span className="letter flipH inline-block">H</span>
          {text.split("").map((char, i) => (
            <span key={i} className="letter inline-block">
              {char === " " ? "\u00A0" : char}
            </span>
          ))}
        </h1>
        <p className="hero-paragraph text-xl sm:text-2xl mb-8 text-neutral-700 dark:text-neutral-300">
          I'm an AI Engineer and woodworking enthusiast.
        </p>
        <div className="hero-buttons flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <Link href="/demos">
            <motion.span
              className="ai-button bg-primary-500 hover:bg-primary-600 text-black dark:text-white font-bold p-6 rounded-full transition-colors shadow-md relative inline-flex items-center justify-center w-32 h-32"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-center">Demos</span>
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                  <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{ stopColor: "#93c5fd", stopOpacity: 1 }} />
                    <stop offset="50%" style={{ stopColor: "#3b82f6", stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: "#93c5fd", stopOpacity: 1 }} />
                  </linearGradient>
                </defs>
                <path className="button-path" d="" stroke="currentColor" fill="none" />
                <path className="motion-line" d="" stroke="url(#blueGradient)" fill="none" />
              </svg>
            </motion.span>
          </Link>
          <Link href="/woodworking">
            <motion.span
              className="woodworking-button bg-accent-500 hover:bg-accent-600 text-black dark:text-white font-bold p-6 rounded-full transition-colors shadow-md relative inline-flex items-center justify-center w-32 h-32"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-center">Woodworking</span>
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                  <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{ stopColor: "#6ee7b7", stopOpacity: 1 }} />
                    <stop offset="50%" style={{ stopColor: "#10b981", stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: "#6ee7b7", stopOpacity: 1 }} />
                  </linearGradient>
                </defs>
                <path className="button-path" d="" stroke="currentColor" fill="none" />
                <path className="motion-line" d="" stroke="url(#greenGradient)" fill="none" />
              </svg>
            </motion.span>
          </Link>
        </div>
      </motion.main>
    </div>
  )
}
