'use client';

import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError?.(error, errorInfo);
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Что-то пошло не так</h2>
          <p className="text-sm text-muted-foreground max-w-md mb-6">
            Произошла непредвиденная ошибка. Попробуйте обновить страницу.
          </p>
          {this.state.error && (
            <details className="mb-4 w-full max-w-md">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                Подробности ошибки
              </summary>
              <pre className="mt-2 p-3 bg-muted rounded-lg text-xs text-muted-foreground overflow-auto text-left">
                {this.state.error.message}
              </pre>
            </details>
          )}
          <Button onClick={this.handleRetry}>
            <RefreshCw className="h-4 w-4" />
            Попробовать снова
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
