import { Component } from 'react';

/**
 * Error Boundary Component
 * Catches React rendering errors and displays helpful debugging information
 */
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '24px',
                    margin: '20px',
                    background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
                    borderRadius: '12px',
                    border: '2px solid #ef4444',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}>
                    <h2 style={{ color: '#b91c1c', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>🚨</span> Something went wrong
                    </h2>

                    <div style={{
                        background: '#fff',
                        padding: '16px',
                        borderRadius: '8px',
                        marginBottom: '16px'
                    }}>
                        <h3 style={{ color: '#dc2626', margin: '0 0 8px 0', fontSize: '14px' }}>Error Message:</h3>
                        <pre style={{
                            background: '#1e293b',
                            color: '#f87171',
                            padding: '12px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            overflow: 'auto',
                            margin: 0
                        }}>
                            {this.state.error && this.state.error.toString()}
                        </pre>
                    </div>

                    {this.state.errorInfo && (
                        <div style={{
                            background: '#fff',
                            padding: '16px',
                            borderRadius: '8px',
                            marginBottom: '16px'
                        }}>
                            <h3 style={{ color: '#dc2626', margin: '0 0 8px 0', fontSize: '14px' }}>Component Stack:</h3>
                            <pre style={{
                                background: '#1e293b',
                                color: '#94a3b8',
                                padding: '12px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                overflow: 'auto',
                                margin: 0,
                                maxHeight: '200px'
                            }}>
                                {this.state.errorInfo.componentStack}
                            </pre>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                padding: '10px 20px',
                                background: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '14px'
                            }}
                        >
                            🔄 Reload Page
                        </button>
                        <button
                            onClick={() => {
                                this.setState({ hasError: false, error: null, errorInfo: null });
                            }}
                            style={{
                                padding: '10px 20px',
                                background: '#64748b',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '14px'
                            }}
                        >
                            ↩️ Try Again
                        </button>
                        <button
                            onClick={() => {
                                const errorData = {
                                    error: this.state.error?.toString(),
                                    stack: this.state.error?.stack,
                                    componentStack: this.state.errorInfo?.componentStack
                                };
                                navigator.clipboard.writeText(JSON.stringify(errorData, null, 2));
                                alert('Error details copied to clipboard!');
                            }}
                            style={{
                                padding: '10px 20px',
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '14px'
                            }}
                        >
                            📋 Copy Error
                        </button>
                    </div>

                    <p style={{ color: '#7f1d1d', fontSize: '12px', marginTop: '16px' }}>
                        💡 Tip: Open browser console (F12) for more details. Check if the LLM returned valid JSON.
                    </p>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
