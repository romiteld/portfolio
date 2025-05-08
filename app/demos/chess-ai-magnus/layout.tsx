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
    >
      {/* Script to only prevent unwanted focus jumps while allowing normal scrolling */}
      <script dangerouslySetInnerHTML={{
        __html: `
          (function() {
            // Only prevent unwanted focus jumps while allowing normal scrolling
            document.addEventListener('click', function(e) {
              // Find if the click happened on or within a chess component
              let target = e.target;
              let isChessComponent = false;
              
              while (target && target !== document.body) {
                if (target.getAttribute && target.getAttribute('data-component-name') === 'ChessAIDemo') {
                  isChessComponent = true;
                  break;
                }
                target = target.parentNode;
              }
              
              // Only apply minimal focus protection to chess component interactions
              if (isChessComponent) {
                // Allow normal scrolling but prevent focus-induced unwanted jumps
                setTimeout(() => {
                  // Get all focusable elements and add a protection
                  const focusables = document.querySelectorAll('button, input, select, textarea');
                  focusables.forEach(el => {
                    el.setAttribute('scroll-margin', '0');
                  });
                }, 10);
              }
            });
          })();
        `
      }} />
      {children}
    </div>
  )
} 