import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Chess AI Magnus | AI Demos",
  description: "Play against a neural network chess engine trained with deep reinforcement learning techniques."
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
      {/* Script to completely disable automatic scrolling */}
      <script dangerouslySetInnerHTML={{
        __html: `
          (function() {
            // Store current scroll position and restore it after any operation
            let lastScrollPosition = 0;
            let scrollLocked = false;

            // Function to save current scroll position
            function saveScrollPosition() {
              lastScrollPosition = window.scrollY;
            }

            // Function to restore saved scroll position
            function restoreScrollPosition() {
              if (scrollLocked) return;
              scrollLocked = true;
              window.scrollTo(0, lastScrollPosition);
              setTimeout(() => { scrollLocked = false; }, 50);
            }

            // Save position on load
            window.addEventListener('load', saveScrollPosition);

            // Hook into various events that might cause scrolling
            document.addEventListener('click', saveScrollPosition);
            document.addEventListener('touchstart', saveScrollPosition);
            document.addEventListener('focusin', function(e) {
              saveScrollPosition();
              setTimeout(restoreScrollPosition, 10);
            });

            // Aggressive scroll position maintenance
            const scrollHandler = function() {
              if (Math.abs(window.scrollY - lastScrollPosition) > 5 && !scrollLocked) {
                restoreScrollPosition();
              }
            };
            
            // We'll run this at a high frequency to catch any scroll changes
            setInterval(scrollHandler, 100);

            // Override any programmatic scrolling
            const originalScrollTo = window.scrollTo;
            window.scrollTo = function(...args) {
              if (args[0] === 0 && args[1] === 0) {
                // Allow scroll to top only if explicitly requested
                originalScrollTo.apply(window, args);
                setTimeout(() => { lastScrollPosition = 0; }, 50);
              } else if (args[0] && typeof args[0] === 'object' && args[0].top === 0) {
                // Handle the object version of scrollTo
                originalScrollTo.apply(window, args);
                setTimeout(() => { lastScrollPosition = 0; }, 50);
              } else {
                // Block other scroll attempts
                console.log('Prevented automatic scroll');
              }
            };
          })();
        `
      }} />
      {children}
    </div>
  )
} 