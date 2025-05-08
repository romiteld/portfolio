import { Metadata, Viewport } from "next"

export const metadata: Metadata = {
  title: "Financial Market Assistant | AI Demos",
  description: "Interactive AI-powered financial market assistant to analyze stocks, provide market insights, and offer investment advice."
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5
}

export default function FinancialAssistantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div 
      className="financial-assistant-layout w-full overflow-x-hidden scroll-behavior-auto overflow-anchor-none"
    >
      {/* Script to prevent all automatic scrolling */}
      <script dangerouslySetInnerHTML={{
        __html: `
          document.addEventListener('DOMContentLoaded', () => {
            // Store the initial scroll position
            const initialScrollPos = window.scrollY;
            
            // Helper function to restore scroll position
            const restoreScroll = () => {
              window.scrollTo(0, initialScrollPos);
            };
            
            // Force overflow anchor to none
            document.documentElement.style.overflowAnchor = 'none';
            document.body.style.overflowAnchor = 'none';
            
            // Disable focus-induced scrolling
            document.querySelectorAll('input, button, select, textarea, [tabindex]').forEach(el => {
              el.addEventListener('focus', (e) => {
                e.preventDefault();
                setTimeout(restoreScroll, 0);
              });
            });
            
            // Restore scroll a few times to catch delayed scrolling
            setTimeout(restoreScroll, 100);
            setTimeout(restoreScroll, 500);
            setTimeout(restoreScroll, 1000);
          });
        `
      }} />
      
      {children}
    </div>
  )
} 