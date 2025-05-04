import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Financial Market Assistant | AI Demos",
  description: "Interactive AI-powered financial market assistant to analyze stocks, provide market insights, and offer investment advice.",
}

export default function FinancialAssistantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 