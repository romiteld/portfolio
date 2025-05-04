import type React from "react"
import "./globals.css"
import RootLayoutClient from "./layout-client"
import { Analytics } from "@vercel/analytics/react"


export const metadata = {
  title: "AI Engineer",
  description: "Showcasing AI engineering demos, and woodworking projects", 
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <RootLayoutClient>{children}</RootLayoutClient>
      <Analytics />
    </>
  )
}