import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Advanced Chess AI Engine | AI Demos",
  description: "Play against a neural network chess engine trained with deep reinforcement learning techniques and test your skills against different AI difficulty levels.",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5
  }
}

export default function ChessAILayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="chess-ai-layout w-full overflow-x-hidden">
      {children}
    </div>
  )
} 