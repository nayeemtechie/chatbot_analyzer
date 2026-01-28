import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { STORAGE_KEYS } from '../../utils/constants';
import './Header.css';

export default function Header() {
    const { state, actions } = useApp();
    const { theme, llmConfig } = state;
    const [showHelp, setShowHelp] = useState(false);

    const handleReset = () => {
        // Clear session data before reload
        sessionStorage.removeItem(STORAGE_KEYS.results);
        sessionStorage.removeItem(STORAGE_KEYS.transcripts);
        sessionStorage.removeItem(STORAGE_KEYS.businessContext);
        window.location.reload();
    };

    return (
        <header className="header">
            <div className="header-left" onClick={handleReset} style={{ cursor: 'pointer' }} title="Reset and start fresh">
                <svg className="header-logo" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{ stopColor: '#4F46E5', stopOpacity: 1 }} />
                            <stop offset="100%" style={{ stopColor: '#7C3AED', stopOpacity: 1 }} />
                        </linearGradient>
                    </defs>
                    <rect width="64" height="64" rx="14" fill="url(#headerGrad)" />
                    <path d="M20 24h24c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2h-6l-6 6-6-6h-6c-1.1 0-2-.9-2-2V26c0-1.1.9-2 2-2z" fill="white" opacity="0.9" />
                    <circle cx="26" cy="32" r="2" fill="#4F46E5" />
                    <circle cx="32" cy="32" r="2" fill="#4F46E5" />
                    <circle cx="38" cy="32" r="2" fill="#4F46E5" />
                </svg>
                <div>
                    <h1 className="header-title">Chatbot Analyzer</h1>
                    <p className="header-subtitle">Transcript Analysis & Optimization</p>
                </div>
            </div>

            <div className="header-right">
                <div className="header-status">
                    <span
                        className={`header-status-dot ${llmConfig.isConnected ? 'connected' : ''}`}
                    />
                    <span>
                        {llmConfig.isConnected
                            ? `${llmConfig.provider.toUpperCase()} Connected`
                            : 'Not Connected'}
                    </span>
                </div>

                <button
                    className="theme-toggle"
                    onClick={() => setShowHelp(true)}
                    aria-label="Help"
                    title="Help & Documentation"
                >
                    ❓
                </button>

                <button
                    className="theme-toggle"
                    onClick={actions.toggleTheme}
                    aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
                >
                    {theme === 'light' ? '🌙' : '☀️'}
                </button>
            </div>

            {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
        </header>
    );
}

// Help Modal Component
function HelpModal({ onClose }) {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
        }} onClick={onClose}>
            <div style={{
                background: 'var(--bg-primary)',
                borderRadius: '16px',
                width: '90%',
                maxWidth: '800px',
                maxHeight: '85vh',
                overflow: 'auto',
                padding: '32px',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ margin: 0 }}>📚 Help & Documentation</h2>
                    <button onClick={onClose} style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '24px',
                        cursor: 'pointer',
                        padding: '4px',
                    }}>✕</button>
                </div>

                {/* Data Sources Legend */}
                <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '12px' }}>🔍 Data Source Legend</h3>
                    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ background: '#22c55e', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>📊 Parser</span>
                            <span style={{ fontSize: '14px' }}>Rule-based extraction from transcripts</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ background: '#6366f1', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>🤖 LLM</span>
                            <span style={{ fontSize: '14px' }}>AI-generated insights (requires API key)</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ background: '#f59e0b', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>🌐 Jina AI</span>
                            <span style={{ fontSize: '14px' }}>Website content extraction</span>
                        </div>
                    </div>
                </div>

                {/* Tab Documentation */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Site Info */}
                    <div style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <h4 style={{ margin: 0 }}>🌐 Site Information</h4>
                            <span style={{ background: '#f59e0b', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '11px' }}>Jina AI</span>
                        </div>
                        <p style={{ margin: '8px 0 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
                            Website content extracted via Jina AI Reader. Shows site title, description, categories, and products found on the website.
                        </p>
                    </div>

                    {/* Session Overview */}
                    <div style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <h4 style={{ margin: 0 }}>📊 Session Overview</h4>
                            <span style={{ background: '#22c55e', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '11px' }}>Parser</span>
                        </div>
                        <p style={{ margin: '8px 0 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
                            <strong>Total Sessions, Date Range, Turn Analysis, Time Patterns</strong> — All extracted from transcript timestamps and message counts. No LLM required.
                        </p>
                    </div>

                    {/* Query Analysis */}
                    <div style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <h4 style={{ margin: 0 }}>🔍 Query Analysis</h4>
                            <span style={{ background: '#22c55e', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '11px' }}>Parser</span>
                        </div>
                        <p style={{ margin: '8px 0 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
                            <strong>Total Queries, Unique Queries, Top Queries</strong> — Extracted by parsing USER messages. Query frequency and patterns are calculated programmatically.
                        </p>
                    </div>

                    {/* User Insights */}
                    <div style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <h4 style={{ margin: 0 }}>👤 User Insights</h4>
                            <span style={{ background: '#22c55e', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '11px' }}>Parser</span>
                        </div>
                        <p style={{ margin: '8px 0 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
                            <strong>Query Complexity</strong> — Word count and pattern matching (single word, phrases, natural language).<br />
                            <strong>Intent Categories</strong> — Keyword detection (product search, location, support).<br />
                            <strong>Repeated Queries</strong> — Duplicate query detection within sessions.
                        </p>
                    </div>

                    {/* Issues & Recommendations */}
                    <div style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '8px', flexWrap: 'wrap' }}>
                            <h4 style={{ margin: 0 }}>⚠️ Issues & Recommendations</h4>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <span style={{ background: '#22c55e', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '11px' }}>Parser</span>
                                <span style={{ background: '#6366f1', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '11px' }}>+ LLM</span>
                            </div>
                        </div>
                        <p style={{ margin: '8px 0 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
                            <strong>Basic issues</strong> — Parser detects no-result queries, repeated searches, long queries.<br />
                            <strong>AI Recommendations</strong> — When LLM is connected, provides intelligent recommendations and deeper issue analysis.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ marginTop: '24px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', fontSize: '13px', color: 'var(--text-tertiary)' }}>
                    💡 <strong>Tip:</strong> Parser-based features work without an API key. Connect an LLM provider for enhanced AI-powered insights and recommendations.
                </div>
            </div>
        </div>
    );
}
