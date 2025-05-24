'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Knowledge Graph Error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-screen bg-black flex items-center justify-center p-8">
          <Card className="max-w-md w-full p-8 bg-white/10 backdrop-blur-xl border-white/20 text-white">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="p-4 bg-red-500/20 rounded-full">
                <AlertTriangle className="w-12 h-12 text-red-500" />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  Oops! Something went wrong
                </h2>
                <p className="text-gray-300">
                  The Knowledge Graph encountered an error while rendering.
                </p>
              </div>

              {this.state.error && (
                <div className="w-full p-4 bg-black/50 rounded-lg">
                  <p className="text-sm font-mono text-gray-400">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  onClick={this.handleReset}
                  className="bg-white/20 hover:bg-white/30"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Page
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.history.back()}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Go Back
                </Button>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}