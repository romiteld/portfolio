import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Computer Vision Assistant | AI Demos",
  description: "AI-powered computer vision system that can analyze and interpret visual data, identify objects, and provide detailed descriptions of images.",
}

export default function ComputerVisionAssistantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 