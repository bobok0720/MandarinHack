import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message?: string;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown, errorInfo: React.ErrorInfo) {
    console.error('App crashed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-8 max-w-lg space-y-3">
            <h1 className="text-xl font-semibold text-slate-800">Something went wrong</h1>
            <p className="text-slate-600">Reload the page to try again. If the issue persists, clear site data and rerun the preview.</p>
            {this.state.message && (
              <p className="text-sm text-red-500 font-mono break-words">{this.state.message}</p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
