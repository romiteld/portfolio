"use client"

import type React from "react"
import { Inter, Poppins } from "next/font/google"
import { usePathname } from "next/navigation"
import Navbar from "./components/Navbar"
import Footer from "./components/Footer"
import BackgroundAnimation from "./components/BackgroundAnimation"
import { AnimatePresence } from "framer-motion"
import { ThemeProvider } from "next-themes"
import { useEffect } from "react"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const poppins = Poppins({ weight: ["400", "600", "700"], subsets: ["latin"], variable: "--font-poppins" })

export default function RootLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isContactPage = pathname === '/contact'

  // Run scroll protection only on client-side after component mounts
  useEffect(() => {
    // Check if we're on the data analyst assistant page using multiple detection methods
    const isDataAnalystPage = 
      pathname.includes('/demos/data-analyst-assistant') || 
      pathname.includes('/data-analyst') || 
      document.querySelector('[data-component-name="DataAnalystAssistant"]') !== null;
    
    // Skip ALL scroll protection for data analyst assistant page
    if (isDataAnalystPage) {
      console.log('Data Analyst Assistant page detected - disabling all scroll protection');
      // Remove any existing scroll event listeners that might be interfering
      const oldScrollListeners = window.onscroll;
      window.onscroll = null;
      
      // Reset any scroll-related styles
      document.documentElement.style.scrollBehavior = '';
      document.documentElement.style.overflowAnchor = '';
      
      return () => {
        // Restore previous scroll listeners when unmounting
        window.onscroll = oldScrollListeners;
      };
    }
    
    let initialScrollPosition = window.scrollY;
    let lastKnownScrollPosition = initialScrollPosition;
    let ticking = false;
    
    // Function to handle scroll events
    const handleScroll = () => {
      // Only check for unwanted scrolls (more than 100px suddenly)
      if (!ticking && Math.abs(window.scrollY - lastKnownScrollPosition) > 100) {
        ticking = true;
        
        requestAnimationFrame(() => {
          // If there was a large jump, immediately restore
          window.scrollTo(0, lastKnownScrollPosition);
          ticking = false;
        });
      } else {
        // Update last known scroll position for legitimate scrolls
        lastKnownScrollPosition = window.scrollY;
        ticking = false;
      }
    };
    
    // Set up scroll protection
    const setupScrollProtection = () => {
      // Force disable scroll behavior and overflow anchor - apply only to documentElement to avoid hydration errors
      document.documentElement.style.scrollBehavior = 'auto';
      document.documentElement.style.overflowAnchor = 'none';
      // No longer applying to body to avoid hydration errors
      
      // Add scroll event listener
      window.addEventListener('scroll', handleScroll, { passive: true });
      
      // After a slight delay, record the initial position as final
      setTimeout(() => {
        initialScrollPosition = window.scrollY;
        lastKnownScrollPosition = initialScrollPosition;
      }, 100);
    };
    
    // Only apply scroll protection if document is ready
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setupScrollProtection();
    } else {
      // Wait for document to be ready
      const readyStateHandler = () => {
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
          setupScrollProtection();
          document.removeEventListener('readystatechange', readyStateHandler);
        }
      };
      document.addEventListener('readystatechange', readyStateHandler);
    }
    
    // Clean up function
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.documentElement.style.scrollBehavior = '';
      document.documentElement.style.overflowAnchor = '';
    };
  }, [pathname]); // Rerun when pathname changes

  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${poppins.variable}`}>
      <head>
      </head>
      <body className={isContactPage ? 'bg-slate-900 dark:bg-slate-950' : ''} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className={`${isContactPage ? 'bg-transparent' : 'bg-neutral-50 dark:bg-black'} text-neutral-900 dark:text-neutral-50 min-h-screen flex flex-col`}>
            {!isContactPage && <BackgroundAnimation />}
            <Navbar />
            <AnimatePresence mode="wait">
              <main className="flex-grow">{children}</main>
            </AnimatePresence>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
