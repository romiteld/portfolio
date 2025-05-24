'use client';

import { Loader2 } from 'lucide-react';

interface LoaderProps {
  text?: string;
  className?: string;
}

export function Loader({ text = 'Processing...', className = '' }: LoaderProps) {
  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

export function InlineLoader({ text = 'Loading...', className = '' }: LoaderProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Loader2 className="w-4 h-4 animate-spin" />
      <span className="text-sm">{text}</span>
    </div>
  );
}