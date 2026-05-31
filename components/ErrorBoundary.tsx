'use client';

import { Component, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-red-900/30 border border-red-800/30 flex items-center justify-center mb-3">
            <span className="text-red-400 text-lg">!</span>
          </div>
          <p className="text-red-400 text-sm font-medium mb-1">Algo deu errado</p>
          <p className="text-muted-foreground text-xs max-w-md">
            {this.state.error?.message || 'Erro inesperado ao carregar este componente.'}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
