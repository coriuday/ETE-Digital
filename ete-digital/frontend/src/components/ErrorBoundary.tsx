/**
 * Error Boundary Component
 * Catches React errors and displays fallback UI
 */
import { Component, ErrorInfo, ReactNode } from 'react';

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
            error: null,
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
        // TODO: Send to error tracking service (Sentry)
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                        <div className="text-6xl mb-4">⚠️</div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            Oops! Something went wrong
                        </h1>
                        <p className="text-gray-600 mb-6">
                            We encountered an unexpected error. Don't worry, your data is safe.
                        </p>
                        {this.state.error && (
                            <div className="bg-red-50 border border-red-200 rounded p-4 mb-6 text-left">
                                <p className="text-sm text-red-800 font-mono">
                                    {this.state.error.message}
                                </p>
                            </div>
                        )}
                        <button
                            onClick={this.handleReset}
                            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
                        >
                            Go to Homepage
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
