import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Advanced Chess AI Engine | AI Demos",
  description: "Play against a neural network chess engine trained with deep reinforcement learning techniques and test your skills against different AI difficulty levels.",
}

export default function ChessAILayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 