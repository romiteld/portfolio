import type React from "react"
import "./globals.css"
import RootLayoutClient from "./layout-client"

export const metadata = {
  title: "AI Engineer Portfolio",
  description: "Portfolio showcasing AI engineering and woodworking projects",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <RootLayoutClient>{children}</RootLayoutClient>
}



import './globals.css'