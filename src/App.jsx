import { AppProvider, useApp } from './context/AppContext';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import Header from './components/Header/Header';
import ConfigPanel from './components/ConfigPanel/ConfigPanel';
import FileUpload from './components/FileUpload/FileUpload';
import AnalysisDashboard from './components/AnalysisDashboard/AnalysisDashboard';
import ProgressBar from './components/ProgressBar/ProgressBar';
import ReportViewer from './components/ReportViewer/ReportViewer';
import './App.css';

function AppContent() {
    const { state } = useApp();
    const { analysis, results, parsedTranscripts, llmConfig } = state;

    // Determine current step for step indicator
    const getStepStatus = (step) => {
        if (results) return 'completed';
        switch (step) {
            case 1: return llmConfig.isConnected ? 'completed' : 'active';
            case 2: return llmConfig.isConnected ? (parsedTranscripts.length > 0 ? 'completed' : 'active') : 'pending';
            case 3: return parsedTranscripts.length > 0 ? 'active' : 'pending';
            case 4: return results ? 'completed' : 'pending';
            default: return 'pending';
        }
    };

    return (
        <div className="app">
            <Header />

            <main className="app-main">
                {/* Step Indicator */}
                <div className="step-indicator">
                    <div className={`step-dot ${getStepStatus(1)}`}>
                        <div className="step-dot-circle">
                            {getStepStatus(1) === 'completed' ? '✓' : '1'}
                        </div>
                        <span className="step-dot-label">Configure</span>
                    </div>
                    <div className={`step-line ${getStepStatus(1) === 'completed' ? 'completed' : ''}`} />

                    <div className={`step-dot ${getStepStatus(2)}`}>
                        <div className="step-dot-circle">
                            {getStepStatus(2) === 'completed' ? '✓' : '2'}
                        </div>
                        <span className="step-dot-label">Upload</span>
                    </div>
                    <div className={`step-line ${getStepStatus(2) === 'completed' ? 'completed' : ''}`} />

                    <div className={`step-dot ${getStepStatus(3)}`}>
                        <div className="step-dot-circle">
                            {getStepStatus(3) === 'completed' ? '✓' : '3'}
                        </div>
                        <span className="step-dot-label">Analyze</span>
                    </div>
                    <div className={`step-line ${getStepStatus(4) === 'completed' ? 'completed' : ''}`} />

                    <div className={`step-dot ${getStepStatus(4)}`}>
                        <div className="step-dot-circle">
                            {getStepStatus(4) === 'completed' ? '✓' : '4'}
                        </div>
                        <span className="step-dot-label">Results</span>
                    </div>
                </div>

                {/* Main Content */}
                {results ? (
                    <div className="results-mode">
                        <ErrorBoundary>
                            <ReportViewer />
                        </ErrorBoundary>
                    </div>
                ) : (
                    <div className="workflow">
                        {/* Row 1: Config + Upload */}
                        <div className="analysis-layout">
                            <div className="workflow-step">
                                <ConfigPanel />
                            </div>
                            <div className="workflow-step">
                                <FileUpload />
                            </div>
                        </div>

                        {/* Row 2: Analysis Dashboard */}
                        <div className="workflow-step">
                            <AnalysisDashboard />
                        </div>
                    </div>
                )}

                {/* Analysis Progress Overlay */}
                {analysis.isRunning && (
                    <div className="analysis-overlay">
                        <div className="analysis-overlay-content">
                            <ProgressBar
                                currentStage={analysis.currentStage}
                                progress={analysis.progress}
                                error={analysis.error}
                            />
                        </div>
                    </div>
                )}
            </main>

            <footer className="app-footer">
                <p className="app-footer-text">
                    Chatbot Transcript Analyzer — Built for Leadership Teams
                </p>
            </footer>
        </div>
    );
}

function App() {
    return (
        <ErrorBoundary>
            <AppProvider>
                <AppContent />
            </AppProvider>
        </ErrorBoundary>
    );
}

export default App;

