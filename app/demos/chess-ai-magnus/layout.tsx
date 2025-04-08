import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Reinforcement Learning Chess AI vs. Magnus | AI Demos",
  description: "An AI chess opponent trained using reinforcement learning that can challenge Magnus Carlsen-level play.",
}

export default function ChessAILayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 