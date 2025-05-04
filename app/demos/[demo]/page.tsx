"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { notFound } from "next/navigation"
import { X } from "lucide-react"

const demos = [
  {
    slug: "financial-assistant",
    title: "Financial Market Assistant",
    description: "Get real-time financial analysis, market insights, and investment advice.",
  },
  {
    slug: "computer-vision-assistant",
    title: "Computer Vision Assistant",
    description: "Analyze and interpret visual data with our AI-powered vision system.",
  },
  {
    slug: "chess-ai-magnus",
    title: "Advanced Chess AI Engine",
    description: "Play against a neural network chess engine trained with deep reinforcement learning techniques.",
  },
  {
    slug: "generative-ai",
    title: "Generative AI (Text & Image Creation)",
    description: "Create unique text and images using cutting-edge generative AI models.",
  },
  {
    slug: "knowledge-graph",
    title: "AI-Powered Knowledge Graph",
    description: "Explore complex relationships in data with our intelligent knowledge graph.",
  },
  {
    slug: "ai-sales-agent",
    title: "AI Sales Agent (CrewAI-Powered)",
    description: "Experience an AI-driven sales conversation powered by CrewAI.",
  },
  {
    slug: "interactive-agents",
    title: "Interactive AI Agents (CrewAI Task Collaboration)",
    description: "See multiple AI agents collaborate on complex tasks using CrewAI.",
  },
  {
    slug: "youtube-summarizer",
    title: "YouTube Summarizer & Insights",
    description: "Get quick summaries and key insights from YouTube videos.",
  },
  {
    slug: "data-analyst-assistant",
    title: "AI Data Analyst Assistant",
    description: "Let AI help you analyze and interpret complex datasets.",
  },
  {
    slug: "enhanced-rag-langchain",
    title: "Enhanced RAG (LangChain)",
    description: "Experience advanced retrieval-augmented generation using LangChain.",
  },
]

export default function DemoPage({ params }: { params: { demo: string } }) {
  const router = useRouter()
  const demo = demos.find((d) => d.slug === params.demo)

  if (!demo) {
    notFound()
  }

  const currentIndex = demos.findIndex((d) => d.slug === params.demo)
  const prevDemo = currentIndex > 0 ? demos[currentIndex - 1] : null
  const nextDemo = currentIndex < demos.length - 1 ? demos[currentIndex + 1] : null

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
      {/* Close button */}
      <button
        onClick={() => router.push("/demos")}
        className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Close demo"
      >
        <X className="h-6 w-6" />
      </button>

      <Link href="/demos" className="text-blue-500 hover:underline mb-4 inline-block">
        ← Back to All Demos
      </Link>

      <h1 className="text-3xl font-bold mb-4">{demo.title}</h1>
      <p className="text-gray-700 dark:text-gray-300 mb-8">{demo.description}</p>

      <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-lg mb-8">
        <p className="text-lg font-semibold mb-4">Demo Interface</p>
        <p>Placeholder for the {demo.title} interface. Coming soon for full functionality...</p>
      </div>

      <div className="flex justify-between">
        {prevDemo && (
          <Link href={`/demos/${prevDemo.slug}`} className="text-blue-500 hover:underline">
            ← {prevDemo.title}
          </Link>
        )}
        {nextDemo && (
          <Link href={`/demos/${nextDemo.slug}`} className="text-blue-500 hover:underline">
            {nextDemo.title} →
          </Link>
        )}
      </div>
    </main>
  )
}

