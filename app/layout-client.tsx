"use client"

import type React from "react"
import { Inter, Poppins } from "next/font/google"
import { usePathname } from "next/navigation"
import Navbar from "./components/Navbar"
import Footer from "./components/Footer"
import ChatWidget from "./components/ChatWidget"
import BackgroundAnimation from "./components/BackgroundAnimation"
import { AnimatePresence } from "framer-motion"
import { ThemeProvider } from "next-themes"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const poppins = Poppins({ weight: ["400", "600", "700"], subsets: ["latin"], variable: "--font-poppins" })

export default function RootLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isContactPage = pathname === '/contact'

  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${poppins.variable}`}>
      <body className={isContactPage ? 'bg-slate-900 dark:bg-slate-950' : ''}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className={`${isContactPage ? 'bg-transparent' : 'bg-neutral-50 dark:bg-black'} text-neutral-900 dark:text-neutral-50 min-h-screen flex flex-col`}>
            {!isContactPage && <BackgroundAnimation />}
            <Navbar />
            <AnimatePresence mode="wait">
              <main className="flex-grow">{children}</main>
            </AnimatePresence>
            <Footer />
            <ChatWidget />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}

