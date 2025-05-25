'use client';

import { useEffect } from 'react';

export default function KnowledgeGraphLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Apply styles on mount
    const style = document.createElement('style');
    style.textContent = `
      body.knowledge-graph-page {
        overflow: hidden;
        touch-action: none;
        -webkit-overflow-scrolling: touch;
      }
      .knowledge-graph-demo * {
        -webkit-tap-highlight-color: transparent;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        user-select: none;
      }
      .knowledge-graph-demo button,
      .knowledge-graph-demo input,
      .knowledge-graph-demo select {
        -webkit-user-select: auto;
        user-select: auto;
        touch-action: manipulation;
      }
    `;
    document.head.appendChild(style);
    document.body.classList.add('knowledge-graph-page');

    return () => {
      document.head.removeChild(style);
      document.body.classList.remove('knowledge-graph-page');
    };
  }, []);

  return (
    <div className="knowledge-graph-demo overflow-hidden touch-manipulation">
      {children}
    </div>
  );
}