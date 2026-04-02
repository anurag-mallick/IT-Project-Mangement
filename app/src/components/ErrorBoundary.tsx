"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
        this.setState({ errorInfo });
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen flex items-center justify-center bg-[#050505] p-6">
                    <div className="max-w-md w-full bg-zinc-900/50 border border-red-500/20 rounded-xl p-8 text-center space-y-6">
                        <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
                            <AlertCircle size={32} className="text-red-500" />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-xl font-bold text-white">Something went wrong</h2>
                            <p className="text-white/40 text-sm">
                                An unexpected error occurred. Please try refreshing the page.
                            </p>
                        </div>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="bg-black/50 rounded-lg p-4 text-left">
                                <p className="text-red-400 text-xs font-mono break-all">
                                    {this.state.error.message}
                                </p>
                                {this.state.errorInfo && (
                                    <details className="mt-2">
                                        <summary className="text-white/40 text-xs cursor-pointer">Stack trace</summary>
                                        <pre className="text-red-400/70 text-xs mt-2 overflow-auto max-h-32">
                                            {this.state.errorInfo.componentStack}
                                        </pre>
                                    </details>
                                )}
                            </div>
                        )}

                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={this.handleReset}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg transition-colors"
                            >
                                <RefreshCw size={16} />
                                Try Again
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2 rounded-lg transition-colors"
                            >
                                Refresh Page
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// Hook-based error boundary for functional components
export function useErrorHandler() {
    const [error, setError] = React.useState<Error | null>(null);

    React.useEffect(() => {
        if (error) {
            throw error;
        }
    }, [error]);

    const handleError = React.useCallback((error: Error) => {
        console.error('Error caught by useErrorHandler:', error);
        setError(error);
    }, []);

    const resetError = React.useCallback(() => {
        setError(null);
    }, []);

    return { handleError, resetError, error };
}

// Async error wrapper
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    errorHandler?: (error: Error) => void
): T {
    return (async (...args: any[]) => {
        try {
            return await fn(...args);
        } catch (error) {
            if (errorHandler && error instanceof Error) {
                errorHandler(error);
            } else {
                console.error('Unhandled async error:', error);
            }
            throw error;
        }
    }) as T;
}