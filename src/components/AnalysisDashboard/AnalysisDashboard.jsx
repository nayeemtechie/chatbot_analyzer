import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BUSINESS_MODELS } from '../../utils/constants';
import { runAnalysis } from '../../services/analyzer/analysisEngine';
import { isValidUrl, estimateTokens } from '../../utils/helpers';
import { scrapeWebsite } from '../../services/scraper/websiteScraperService';
import llmService from '../../services/llm/llmService';
import './AnalysisDashboard.css';

export default function AnalysisDashboard() {
    const { state, actions } = useApp();
    const { llmConfig, parsedTranscripts, businessContext, analysis } = state;

    const [showOptional, setShowOptional] = useState(false);
    const [fetchingWebsite, setFetchingWebsite] = useState(false);
    const [fetchProgress, setFetchProgress] = useState('');

    const handleContextChange = (field, value) => {
        actions.setBusinessContext({ [field]: value });
    };

    const handleFetchWebsite = async () => {
        if (!hasWebsiteUrl || fetchingWebsite) return;

        setFetchingWebsite(true);
        setFetchProgress('Starting...');

        try {
            const result = await scrapeWebsite(
                businessContext.websiteUrl,
                (message, progress) => {
                    setFetchProgress(message);
                },
                isLLMConfigured ? llmConfig : null
            );

            actions.setBusinessContext({ websiteContent: result });
            setFetchProgress(result.success ? 'Content fetched!' : 'Partial fetch');
        } catch (error) {
            console.error('Website fetch failed:', error);
            setFetchProgress('Failed to fetch');
        } finally {
            setFetchingWebsite(false);
            // Clear status after 3 seconds
            setTimeout(() => setFetchProgress(''), 3000);
        }
    };

    const handleRunAnalysis = async () => {
        if (!canRunAnalysis) return;

        actions.startAnalysis();

        try {
            // Configure LLM service
            llmService.configure(llmConfig.provider, llmConfig.model, llmConfig.apiKey);

            const results = await runAnalysis({
                transcripts: parsedTranscripts,
                websiteUrl: businessContext.websiteUrl,
                businessModel: businessContext.businessModel,
                businessContext: {
                    industry: businessContext.industry,
                    geography: businessContext.geography,
                    additionalContext: businessContext.additionalContext,
                    websiteContent: businessContext.websiteContent,
                },
                // Pass LLM config - analysis will skip LLM if not configured
                llmConfig: isLLMConfigured ? llmConfig : null,
                onProgress: (stage, progress) => {
                    actions.updateProgress(stage, progress);
                },
            });

            actions.setResults(results);
            actions.finishAnalysis();
        } catch (error) {
            console.error('Analysis failed:', error);
            actions.setAnalysisError(error.message);
        }
    };

    const isLLMConfigured = llmConfig.isConnected && llmConfig.apiKey;
    const hasTranscripts = parsedTranscripts.length > 0;
    const hasWebsiteUrl = businessContext.websiteUrl && isValidUrl(businessContext.websiteUrl);
    const hasWebsiteContent = businessContext.websiteContent?.success;
    // LLM is optional - only require transcripts and website URL
    const canRunAnalysis = hasTranscripts && hasWebsiteUrl && !analysis.isRunning;

    // Estimate tokens and cost
    const transcriptText = JSON.stringify(parsedTranscripts);
    const estimatedInputTokens = estimateTokens(transcriptText);
    const estimatedOutputTokens = 4000;
    const costEstimate = llmService.estimateCost?.(estimatedInputTokens, estimatedOutputTokens);

    return (
        <div className="analysis-dashboard">
            <div className="analysis-dashboard-header">
                <h2 className="analysis-dashboard-title">
                    <span>🎯</span>
                    Analysis Configuration
                </h2>
            </div>

            <div className="analysis-dashboard-body">
                <div className="business-context-section">
                    <div className="context-row">
                        <div className="form-group website-url-group">
                            <label className="form-label" htmlFor="websiteUrl">
                                Website URL
                            </label>
                            <div className="website-url-input-wrapper">
                                <input
                                    id="websiteUrl"
                                    type="url"
                                    className="form-input"
                                    placeholder="https://example.com"
                                    value={businessContext.websiteUrl}
                                    onChange={(e) => handleContextChange('websiteUrl', e.target.value)}
                                />
                                <button
                                    type="button"
                                    className={`btn btn-secondary fetch-website-btn ${hasWebsiteContent ? 'fetched' : ''}`}
                                    onClick={handleFetchWebsite}
                                    disabled={!hasWebsiteUrl || fetchingWebsite}
                                >
                                    {fetchingWebsite ? (
                                        <>
                                            <span className="spinner" />
                                            Fetching...
                                        </>
                                    ) : hasWebsiteContent ? (
                                        <>✓ Fetched</>
                                    ) : (
                                        <>🔍 Fetch Content</>
                                    )}
                                </button>
                            </div>
                            {fetchProgress && (
                                <p className="fetch-progress">{fetchProgress}</p>
                            )}
                            <p className="form-hint">
                                Click "Fetch Content" to analyze your site's categories and products for better analysis
                            </p>
                        </div>

                        <div className="form-group business-model-toggle">
                            <label className="form-label">Business Model</label>
                            <div className="toggle-group">
                                {Object.values(BUSINESS_MODELS).map((model) => (
                                    <button
                                        key={model.id}
                                        type="button"
                                        className={`toggle-option ${businessContext.businessModel === model.id ? 'active' : ''}`}
                                        onClick={() => handleContextChange('businessModel', model.id)}
                                    >
                                        {model.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="optional-context">
                        <button
                            type="button"
                            className="optional-context-toggle"
                            onClick={() => setShowOptional(!showOptional)}
                        >
                            <span>{showOptional ? '▼' : '▶'}</span>
                            Optional: Additional Business Context
                        </button>

                        {showOptional && (
                            <div className="optional-context-fields">
                                <div className="form-group">
                                    <label className="form-label" htmlFor="industry">
                                        Industry Override
                                    </label>
                                    <input
                                        id="industry"
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g., Electronics, Fashion"
                                        value={businessContext.industry}
                                        onChange={(e) => handleContextChange('industry', e.target.value)}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label" htmlFor="geography">
                                        Geography / Language
                                    </label>
                                    <input
                                        id="geography"
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g., North America, English"
                                        value={businessContext.geography}
                                        onChange={(e) => handleContextChange('geography', e.target.value)}
                                    />
                                </div>

                                <div className="form-group additional-context-group">
                                    <label className="form-label" htmlFor="additionalContext">
                                        Additional Context
                                    </label>
                                    <textarea
                                        id="additionalContext"
                                        className="form-textarea"
                                        placeholder="Provide any additional context about your website, products, or specific areas you want the analysis to focus on. This helps the LLM understand your business better."
                                        value={businessContext.additionalContext}
                                        onChange={(e) => handleContextChange('additionalContext', e.target.value)}
                                        rows={3}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="analysis-actions">
                    <div className="analysis-actions-content">
                        <button
                            className="btn btn-primary run-analysis-btn"
                            onClick={handleRunAnalysis}
                            disabled={!canRunAnalysis}
                        >
                            {analysis.isRunning ? (
                                <>
                                    <span className="spinner" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    🚀 Run Analysis
                                </>
                            )}
                        </button>

                        <div className="analysis-requirements">
                            <span className={`requirement-badge ${isLLMConfigured ? 'met' : 'optional'}`}>
                                {isLLMConfigured ? '✓' : '○'} LLM {isLLMConfigured ? 'Connected' : '(Optional)'}
                            </span>
                            <span className={`requirement-badge ${hasTranscripts ? 'met' : 'unmet'}`}>
                                {hasTranscripts ? '✓' : '○'} Transcripts Uploaded
                            </span>
                            <span className={`requirement-badge ${hasWebsiteUrl ? 'met' : 'unmet'}`}>
                                {hasWebsiteUrl ? '✓' : '○'} Website URL
                            </span>
                        </div>

                        {costEstimate && hasTranscripts && (
                            <div className="cost-estimate">
                                <span>Est. tokens: ~{(estimatedInputTokens / 1000).toFixed(1)}K</span>
                                {costEstimate.totalCost > 0 && (
                                    <>
                                        <span>•</span>
                                        <span>Est. cost: <span className="cost-estimate-value">
                                            ${costEstimate.totalCost.toFixed(4)}
                                        </span></span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
