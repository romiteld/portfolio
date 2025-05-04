"use client"

import type React from "react"

import { motion } from "framer-motion"
import { useState, useEffect, useRef } from "react"
import { gsap } from "gsap"
import { MotionPathPlugin } from "gsap/MotionPathPlugin"
import SpaceBackgroundAnimation from "../components/SpaceBackgroundAnimation"

// Register GSAP plugin
gsap.registerPlugin(MotionPathPlugin)

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const buttonRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (buttonRef.current) {
      const svg = buttonRef.current.querySelector("svg")
      const path = svg?.querySelector(".button-path")
      const line = svg?.querySelector(".motion-line")

      if (svg && path && line) {
        const { width, height } = buttonRef.current.getBoundingClientRect()
        const radius = 12 // Matches the rounded-xl class
        
        // Create a rounded rectangle path
        const d = `
          M ${radius},0
          L ${width - radius},0
          A ${radius},${radius} 0 0 1 ${width},${radius}
          L ${width},${height - radius}
          A ${radius},${radius} 0 0 1 ${width - radius},${height}
          L ${radius},${height}
          A ${radius},${radius} 0 0 1 0,${height - radius}
          L 0,${radius}
          A ${radius},${radius} 0 0 1 ${radius},0
          Z
        `.replace(/\s+/g, ' ').trim()
        
        path.setAttribute("d", d)
        line.setAttribute("d", d)

        const pathLength = width * 2 + height * 2 // Total path length

        // Set initial path properties
        path.setAttribute("stroke", "#f97316")
        path.setAttribute("stroke-opacity", "0.1")
        path.setAttribute("stroke-width", "1")
        path.setAttribute("stroke-linecap", "round")
        path.setAttribute("stroke-linejoin", "round")

        // Set up the line animation
        gsap.set(line, {
          strokeDasharray: pathLength,
          strokeDashoffset: pathLength,
          strokeWidth: 2,
          opacity: 0,
        })

        // Create timeline for line animation
        gsap
          .timeline({
            repeat: -1,
          })
          .to(line, {
            strokeDashoffset: 0,
            duration: 5,
            ease: "none",
          })
          .to(line, {
            strokeWidth: "+=4",
            duration: 3,
            ease: "power2.in",
          }, 1)
          .to(line, {
            opacity: 1,
            duration: 0.3,
            ease: "power1.in",
          }, 0)
          .to(line, {
            opacity: 0,
            duration: 0.5,
            ease: "power1.out",
          }, 3.5)

        // Create color animation timeline
        gsap
          .timeline({
            repeat: -1,
          })
          .to(line, {
            attr: {
              stroke: "url(#endGradient)",
            },
            duration: 2.5,
            ease: "power2.in",
          }, 1)
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      message: formData.get('message'),
    }

    try {
      console.log('Submitting form data:', data);
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      console.log('Response status:', response.status);
      
      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to send message');
      }

      setIsSubmitted(true)
      if (formRef.current) {
        formRef.current.reset();
      }
    } catch (err) {
      console.error('Contact form error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <SpaceBackgroundAnimation />
      <motion.div
        className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="bg-white/5 dark:bg-black/25 backdrop-blur-sm rounded-xl p-8 shadow-xl border border-white/20 dark:border-slate-800/50"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <motion.h1
            className="text-3xl font-bold mb-8 text-primary-600 dark:text-primary-400"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Contact Me
          </motion.h1>
          <motion.form
            ref={formRef}
            className="space-y-6"
            onSubmit={handleSubmit}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
                required
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
                required
              ></textarea>
            </div>
            {error && (
              <div className="text-red-500 dark:text-red-400 text-sm">
                {error}
              </div>
            )}
            {isSubmitted && (
              <div className="text-green-500 dark:text-green-400 text-sm">
                Message sent successfully! I'll get back to you soon.
              </div>
            )}
            <div ref={buttonRef} className="relative">
              <motion.button
                type="submit"
                className="w-full bg-primary-500 hover:bg-primary-600 text-black dark:text-white font-bold py-4 px-8 rounded-xl transition-colors shadow-md relative"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isSubmitting || isSubmitted}
              >
                {isSubmitting ? "Sending..." : isSubmitted ? "Message Sent!" : "Send Message"}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <defs>
                    <linearGradient id="startGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{ stopColor: "#fef9c3", stopOpacity: 0.3 }} />
                      <stop offset="100%" style={{ stopColor: "#f97316", stopOpacity: 0.4 }} />
                    </linearGradient>
                    <linearGradient id="endGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{ stopColor: "#f97316", stopOpacity: 0.5 }} />
                      <stop offset="100%" style={{ stopColor: "#dc2626", stopOpacity: 0.6 }} />
                    </linearGradient>
                    <filter id="fire" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
                      <feBlend in="SourceGraphic" in2="blur" mode="screen" />
                    </filter>
                  </defs>
                  <path className="button-path" d="" stroke="#f97316" strokeOpacity="0.1" fill="none" />
                  <path className="motion-line" d="" stroke="url(#startGradient)" fill="none" filter="url(#fire)" />
                </svg>
              </motion.button>
            </div>
          </motion.form>
        </motion.div>
      </motion.div>
    </>
  )
}

