import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4 text-center">
                    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md w-full">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                            Diçka shkoi gabim
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            Ndodhi një gabim i papritur. Ju lutem provoni të rifreskoni faqen.
                        </p>
                        {this.state.error && (
                            <div className="mb-6 p-3 bg-red-50 dark:bg-red-950/30 rounded text-left overflow-auto max-h-32 text-xs text-red-800 dark:text-red-300 font-mono">
                                {this.state.error.toString()}
                            </div>
                        )}
                        <Button
                            onClick={this.handleReload}
                            className="w-full h-12 gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Rifresko Faqen
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
