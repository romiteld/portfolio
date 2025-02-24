"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import {
  MessageSquare,
  Eye,
  CastleIcon as ChessKing,
  Palette,
  Network,
  Users,
  Bot,
  Youtube,
  BarChart,
  Link2,
} from "lucide-react"

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger)

const demos = [
  {
    slug: "conversational-ai-chatbot",
    title: "Conversational AI Chatbot",
    description: "Experience real-time Q&A with our advanced chatbot.",
    gradient: "from-blue-500 to-purple-500",
    icon: <MessageSquare strokeWidth={1.5} className="w-10 h-10" />,
  },
  {
    slug: "computer-vision-assistant",
    title: "Computer Vision Assistant",
    description: "Analyze and interpret visual data with our AI-powered vision system.",
    gradient: "from-emerald-500 to-teal-500",
    icon: <Eye strokeWidth={1.5} className="w-10 h-10" />,
  },
  {
    slug: "chess-ai-magnus",
    title: "Reinforcement Learning Chess AI vs. Magnus",
    description: "Watch our AI challenge Magnus Carlsen in chess using reinforcement learning.",
    gradient: "from-amber-500 to-orange-500",
    icon: <ChessKing strokeWidth={1.5} className="w-10 h-10" />,
  },
  {
    slug: "generative-ai",
    title: "Generative AI (Text & Image Creation)",
    description: "Create unique text and images using cutting-edge generative AI models.",
    gradient: "from-pink-500 to-rose-500",
    icon: <Palette strokeWidth={1.5} className="w-10 h-10" />,
  },
  {
    slug: "knowledge-graph",
    title: "AI-Powered Knowledge Graph",
    description: "Explore complex relationships in data with our intelligent knowledge graph.",
    gradient: "from-fuchsia-500 to-purple-500",
    icon: <Network strokeWidth={1.5} className="w-10 h-10" />,
  },
  {
    slug: "ai-sales-agent",
    title: "AI Sales Agent (CrewAI-Powered)",
    description: "Experience an AI-driven sales conversation powered by CrewAI.",
    gradient: "from-red-500 to-orange-500",
    icon: <Users strokeWidth={1.5} className="w-10 h-10" />,
  },
  {
    slug: "interactive-agents",
    title: "Interactive AI Agents (CrewAI Task Collaboration)",
    description: "See multiple AI agents collaborate on complex tasks using CrewAI.",
    gradient: "from-lime-500 to-green-500",
    icon: <Bot strokeWidth={1.5} className="w-10 h-10" />,
  },
  {
    slug: "youtube-summarizer",
    title: "YouTube Summarizer & Insights",
    description: "Get quick summaries and key insights from YouTube videos.",
    gradient: "from-sky-500 to-blue-500",
    icon: <Youtube strokeWidth={1.5} className="w-10 h-10" />,
  },
  {
    slug: "data-analyst-assistant",
    title: "AI Data Analyst Assistant",
    description: "Let AI help you analyze and interpret complex datasets.",
    gradient: "from-violet-500 to-indigo-500",
    icon: <BarChart strokeWidth={1.5} className="w-10 h-10" />,
  },
  {
    slug: "enhanced-rag-langchain",
    title: "Enhanced RAG (LangChain)",
    description: "Experience advanced retrieval-augmented generation using LangChain.",
    gradient: "from-cyan-500 to-blue-500",
    icon: <Link2 strokeWidth={1.5} className="w-10 h-10" />,
  },
]

export default function DemosPage() {
  const demoCardsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (demoCardsRef.current) {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: demoCardsRef.current,
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none reverse",
        },
      })

      // Loop through each demo card
      gsap.utils.toArray(demoCardsRef.current.children).forEach((card) => {
        const svg = card.querySelector(".demo-icon svg")
        if (svg) {
          // Set initial state for SVG paths
          const paths = svg.querySelectorAll("path, polyline, circle, rect, line")
          paths.forEach((path) => {
            const length = path.getTotalLength?.() || 100
            gsap.set(path, {
              strokeDasharray: length,
              strokeDashoffset: length,
            })
          })

          // Animate card entrance and SVG drawing
          tl.from(card, {
            opacity: 0,
            y: 50,
            duration: 0.8,
            ease: "power3.out",
          }).to(
            paths,
            {
              strokeDashoffset: 0,
              duration: 1,
              ease: "power1.inOut",
              stagger: 0.05,
            },
            "-=0.5",
          )
        }
      })
    }
  }, [])

  return (
    <motion.main
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h1
        className="text-4xl font-bold mb-8 text-primary-600 dark:text-primary-400 font-heading"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        AI Demos Portfolio
      </motion.h1>
      <div ref={demoCardsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {demos.map((demo) => (
          <Link key={demo.slug} href={`/demos/${demo.slug}`}>
            <motion.div
              className="group bg-white dark:bg-neutral-800/50 backdrop-blur-sm rounded-xl border border-neutral-200/50 dark:border-neutral-700/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div className="demo-icon mb-6">
                <div className="relative w-16 h-16 transform transition-transform group-hover:scale-110">
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${demo.gradient} rounded-xl opacity-20 group-hover:opacity-30 transition-opacity`}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">{demo.icon}</div>
                </div>
              </motion.div>
              <h2 className="text-2xl font-semibold mb-3 text-primary-600 dark:text-primary-400 group-hover:text-primary-500 transition-colors">
                {demo.title}
              </h2>
              <p className="text-neutral-600 dark:text-neutral-300 mb-4 line-clamp-2">{demo.description}</p>
              <motion.span
                className={`inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r ${demo.gradient} text-white font-medium shadow-lg transition-all duration-300 hover:shadow-xl hover:translate-y-[-2px]`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Try Demo
                <svg
                  className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.span>
            </motion.div>
          </Link>
        ))}
      </div>
    </motion.main>
  )
}

