import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Financial Market Assistant | AI Demos",
  description: "Interactive AI-powered financial market assistant to analyze stocks, provide market insights, and offer investment advice.",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5
  }
}

export default function FinancialAssistantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="financial-assistant-layout w-full overflow-x-hidden">
      {children}
    </div>
  )
} 