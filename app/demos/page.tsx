"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
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
  CircleDollarSign,
  TrendingUp,
  ScanEye,
  Crown,
  Sparkles,
  Share2,
  MessagesSquare as MessagesSquareIcon,
  Group,
  Clapperboard,
  AreaChart,
  SearchCheck,
} from "lucide-react";

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

const demos = [
  {
    slug: "financial-assistant",
    title: "Financial Market Assistant",
    description:
      "Get real-time financial analysis, market insights, and investment advice.",
    gradient: "from-blue-500 to-purple-500",
    icon: <TrendingUp strokeWidth={1.5} className="w-10 h-10" />,
  },
  {
    slug: "computer-vision-assistant",
    title: "Computer Vision Assistant",
    description:
      "Analyze and interpret visual data with our AI-powered vision system.",
    gradient: "from-emerald-500 to-teal-500",
    icon: <ScanEye strokeWidth={1.5} className="w-10 h-10" />,
  },
  {
    slug: "chess-ai-magnus",
    title: "Advanced Chess AI Engine",
    description:
      "Play against a neural network chess engine trained with deep reinforcement learning techniques.",
    gradient: "from-amber-500 to-orange-500",
    icon: <Crown strokeWidth={1.5} className="w-10 h-10" />,
  },
  {
    slug: "generative-ai",
    title: "Generative AI (Text & Image Creation)",
    description:
      "Create unique text and images using cutting-edge generative AI models.",
    gradient: "from-pink-500 to-rose-500",
    icon: <Sparkles strokeWidth={1.5} className="w-10 h-10" />,
  },
  {
    slug: "knowledge-graph",
    title: "AI-Powered Knowledge Graph",
    description:
      "Explore complex relationships in data with our intelligent knowledge graph.",
    gradient: "from-fuchsia-500 to-purple-500",
    icon: <Share2 strokeWidth={1.5} className="w-10 h-10" />,
  },
  {
    slug: "ai-sales-agent",
    title: "AI Sales Agent (CrewAI-Powered)",
    description:
      "Experience an AI-driven sales conversation powered by CrewAI.",
    gradient: "from-red-500 to-orange-500",
    icon: <MessagesSquareIcon strokeWidth={1.5} className="w-10 h-10" />,
  },
  {
    slug: "interactive-agents",
    title: "Interactive AI Agents (CrewAI Task Collaboration)",
    description:
      "See multiple AI agents collaborate on complex tasks using CrewAI.",
    gradient: "from-lime-500 to-green-500",
    icon: <Group strokeWidth={1.5} className="w-10 h-10" />,
  },
  {
    slug: "youtube-summarizer",
    title: "YouTube Summarizer & Insights",
    description: "Get quick summaries and key insights from YouTube videos.",
    gradient: "from-sky-500 to-blue-500",
    icon: <Clapperboard strokeWidth={1.5} className="w-10 h-10" />,
  },
  {
    slug: "data-analyst-assistant",
    title: "AI Data Analyst Assistant",
    description:
      "Let AI help you analyze and interpret complex datasets with interactive charts, statistics, and automated insights.",
    gradient: "from-violet-500 to-indigo-500",
    icon: <AreaChart strokeWidth={1.5} className="w-10 h-10" />,
  },
  {
    slug: "enhanced-rag-langchain",
    title: "Enhanced RAG (LangChain)",
    description:
      "Experience advanced retrieval-augmented generation using LangChain.",
    gradient: "from-cyan-500 to-blue-500",
    icon: <SearchCheck strokeWidth={1.5} className="w-10 h-10" />,
  },
];

export default function DemosPage() {
  const demoCardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (demoCardsRef.current) {
      const ctx = gsap.context(() => {
        const cards =
          demoCardsRef.current?.querySelectorAll(".demo-card") || [];

        // 1. Initial Staggered Fade-In for ALL Cards on Load
        gsap.fromTo(
          cards,
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power3.out",
            stagger: 0.07, // Keep the slight stagger
            delay: 0.3, // Start slightly after page load elements
          },
        );

        // Animate icon paths after cards start appearing
        cards.forEach((card, index) => {
          const iconSvg = card.querySelector(".demo-icon svg");
          const paths =
            iconSvg?.querySelectorAll("path, polyline, circle, rect, line") ||
            [];
          if (paths.length > 0) {
            paths.forEach((path) => {
              const length =
                (path as SVGGeometryElement).getTotalLength?.() || 100;
              gsap.set(path, {
                strokeDasharray: length,
                strokeDashoffset: length,
              });
            });
            gsap.to(paths, {
              strokeDashoffset: 0,
              duration: 0.8,
              ease: "power1.inOut",
              stagger: 0.05,
              delay: 0.5 + index * 0.07, // Delay based on card stagger
            });
          }
        });

        // 2. ScrollTrigger for Fading Cards OUTSIDE Central Viewport
        cards.forEach((card) => {
          gsap.to(card, {
            // Animate opacity based on scroll
            opacity: 0.3, // Fade to partial opacity when outside central view
            ease: "power1.inOut",
            scrollTrigger: {
              trigger: card,
              start: "top 15%", // Start fading when card top is near viewport top
              end: "bottom 85%", // Fully faded by the time card bottom is near viewport bottom
              scrub: true, // Smooth animation linked to scroll
              // markers: true, // For debugging
              // Custom toggle logic might be complex; using scrub for fade effect
            },
          });
          // We might need a second trigger to fade back to full opacity if scrub alone isn't enough
          gsap.to(card, {
            // Animate opacity based on scroll
            opacity: 1, // Fade back to full opacity in the middle
            ease: "power1.inOut",
            scrollTrigger: {
              trigger: card,
              start: "top 60%", // Start fading back in
              end: "bottom 40%", // Fully opaque in this zone
              scrub: true, // Smooth animation linked to scroll
              // markers: true, // For debugging
            },
          });
        });

        // 3. Row transition animation when scrolling
        ScrollTrigger.batch(cards, {
          interval: 0.1,
          batchMax: 3,
          start: "top 80%",
          onEnter: (batch) =>
            gsap.fromTo(
              batch,
              { y: 50, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.5,
                ease: "power3.out",
                stagger: { each: 0.1, grid: "auto" },
              },
            ),
          onLeave: (batch) =>
            gsap.to(batch, {
              y: -50,
              opacity: 0,
              duration: 0.4,
              ease: "power3.in",
              stagger: { each: 0.1, grid: "auto" },
            }),
          onEnterBack: (batch) =>
            gsap.fromTo(
              batch,
              { y: -50, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.5,
                ease: "power3.out",
                stagger: { each: 0.1, grid: "auto" },
              },
            ),
          onLeaveBack: (batch) =>
            gsap.to(batch, {
              y: 50,
              opacity: 0,
              duration: 0.4,
              ease: "power3.in",
              stagger: { each: 0.1, grid: "auto" },
            }),
        });
      }, demoCardsRef);

      return () => ctx.revert();
    }
  }, []);

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
        AI Portfolio Demos
      </motion.h1>
      <div
        ref={demoCardsRef}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 grid-auto-rows-auto"
      >
        {demos.map((demo) => (
          <Link key={demo.slug} href={`/demos/${demo.slug}`} className="flex">
            <motion.div
              className="demo-card group bg-white dark:bg-neutral-800/50 backdrop-blur-sm rounded-xl border border-neutral-200/50 dark:border-neutral-700/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col flex-grow h-full"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div className="demo-icon mb-6">
                <div className="relative w-16 h-16 transform transition-transform group-hover:scale-110">
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${demo.gradient} rounded-xl opacity-20 group-hover:opacity-30 transition-opacity`}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    {demo.icon}
                  </div>
                </div>
              </motion.div>
              <div className="flex flex-col flex-grow">
                <h2 className="text-2xl font-semibold mb-3 text-primary-600 dark:text-primary-400 group-hover:text-primary-500 transition-colors">
                  {demo.title}
                </h2>
                <p className="text-neutral-600 dark:text-neutral-300 mb-4 line-clamp-2">
                  {demo.description}
                </p>
              </div>
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
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </motion.span>
            </motion.div>
          </Link>
        ))}
      </div>
    </motion.main>
  );
}
