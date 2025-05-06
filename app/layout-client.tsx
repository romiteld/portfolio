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
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            // Global scroll position protection
            (function() {
              var initialScrollPosition = 0;
              var preventAutoScroll = function() {
                // Record initial position once DOM is ready
                if (document.readyState === 'complete' || document.readyState === 'interactive') {
                  initialScrollPosition = window.scrollY;
                  
                  // Force disable scroll behavior and overflow anchor
                  document.documentElement.style.scrollBehavior = 'auto';
                  document.documentElement.style.overflowAnchor = 'none';
                  document.body.style.overflowAnchor = 'none';
                  
                  // Observe for any sudden scroll changes
                  var lastKnownScrollPosition = initialScrollPosition;
                  var ticking = false;
                  
                  document.addEventListener('scroll', function() {
                    // Only check for unwanted scrolls (more than 100px suddenly)
                    if (!ticking && Math.abs(window.scrollY - lastKnownScrollPosition) > 100) {
                      ticking = true;
                      
                      requestAnimationFrame(function() {
                        // If there was a large jump, immediately restore
                        window.scrollTo(0, lastKnownScrollPosition);
                        ticking = false;
                      });
                    } else {
                      // Update last known scroll position for legitimate scrolls
                      lastKnownScrollPosition = window.scrollY;
                      ticking = false;
                    }
                  });
                } else {
                  // If DOM not ready, retry
                  setTimeout(preventAutoScroll, 10);
                }
              };
              
              // Start the protection
              preventAutoScroll();
              
              // After a slight delay, record the initial position as final
              setTimeout(function() {
                initialScrollPosition = window.scrollY;
              }, 100);
            })();
          `
        }} />
      </head>
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

