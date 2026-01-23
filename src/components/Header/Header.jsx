import { useApp } from '../../context/AppContext';
import { STORAGE_KEYS } from '../../utils/constants';
import './Header.css';

export default function Header() {
    const { state, actions } = useApp();
    const { theme, llmConfig } = state;

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
                    onClick={actions.toggleTheme}
                    aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
                >
                    {theme === 'light' ? '🌙' : '☀️'}
                </button>
            </div>
        </header>
    );
}
