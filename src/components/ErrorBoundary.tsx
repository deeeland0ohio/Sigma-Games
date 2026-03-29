import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 font-mono">
          <div className="max-w-md w-full bg-zinc-900 border border-red-900/50 rounded-2xl p-8 space-y-6 shadow-2xl">
            <div className="flex items-center gap-4 text-red-500">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold tracking-tighter uppercase">SYSTEM ERROR</h1>
            </div>
            
            <div className="space-y-4">
              <p className="text-zinc-400 text-sm leading-relaxed">
                {this.state.error?.message || 'AN UNEXPECTED ERROR OCCURRED.'}
              </p>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 py-3 bg-red-500 text-black font-bold rounded-xl hover:bg-red-400 transition-all active:scale-95"
            >
              <RefreshCcw className="w-4 h-4" />
              REBOOT SYSTEM
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
