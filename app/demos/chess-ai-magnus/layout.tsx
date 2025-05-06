import { Metadata, Viewport } from "next"

export const metadata: Metadata = {
  title: "Advanced Chess AI Engine | AI Demos",
  description: "Play against a neural network chess engine trained with deep reinforcement learning techniques and test your skills against different AI difficulty levels."
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5
}

export default function ChessAILayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div 
      className="chess-ai-layout w-full overflow-x-hidden"
      style={{ 
        scrollBehavior: 'auto',
        overflowAnchor: 'none'
      }}
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
            
            // Add click handler to chess-related elements
            document.querySelectorAll('.chess-board .square, .chess-piece, .control-button').forEach(el => {
              el.addEventListener('click', () => {
                setTimeout(restoreScroll, 10);
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