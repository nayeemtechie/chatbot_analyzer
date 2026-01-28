import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { REPORT_SECTIONS } from '../../utils/constants';
import { exportAsMarkdown, exportAsPdf } from '../../services/reporter/exportService';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './ReportViewer.css';

export default function ReportViewer() {
    const { state } = useApp();
    const { results, activeTab } = state;
    const { actions } = useApp();

    const [showExportMenu, setShowExportMenu] = useState(false);
    const [showDebug, setShowDebug] = useState(false);

    const analysis = results?.analysis;

    // Debug logging when results change
    useEffect(() => {
        if (results) {
            console.group('📊 Analysis Results Debug');
            console.log('Full results object:', results);
            console.log('Analysis object:', analysis);
            console.log('Executive Summary:', analysis?.executiveSummary);
            console.log('Health Metrics:', analysis?.healthMetrics);
            console.log('Key Findings type:', typeof analysis?.executiveSummary?.keyFindings);
            console.log('Key Findings:', analysis?.executiveSummary?.keyFindings);
            console.groupEnd();
        }
    }, [results, analysis]);


    const handleExport = (format) => {
        setShowExportMenu(false);
        const filename = `chatbot-analysis-${new Date().toISOString().split('T')[0]}`;

        switch (format) {
            case 'pdf':
                exportAsPdf(results, filename);
                break;
            case 'markdown':
                exportAsMarkdown(results, filename);
                break;
        }
    };

    if (!results) {
        return (
            <div className="report-viewer">
                <div className="no-results">
                    <span className="no-results-icon">📊</span>
                    <h3 className="no-results-title">No Analysis Results</h3>
                    <p className="no-results-text">
                        Configure the LLM, upload transcripts, and run analysis to see results here.
                    </p>
                </div>
            </div>
        );
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'siteInfo':
                return <SiteInfo websiteContent={results?.businessContext?.websiteContent} llmEnabled={results?.llmEnabled} />;
            case 'overview':
                return <SessionOverview analysis={analysis} />;
            case 'queries':
                return <QueryAnalysis analysis={analysis} />;
            case 'userInsights':
                return <UserInsights userBehavior={analysis?.userBehavior} />;
            case 'issues':
                return <IssuesAndRecommendations analysis={analysis} />;
            default:
                return <SiteInfo websiteContent={results?.businessContext?.websiteContent} llmEnabled={results?.llmEnabled} />;
        }
    };

    return (
        <div className="report-viewer">
            <div className="report-header">
                <h2 className="report-title">
                    <span>📊</span>
                    Analysis Results
                </h2>

                <div className="report-actions">
                    <div className="export-dropdown">
                        <button
                            className="btn btn-secondary"
                            onClick={() => setShowExportMenu(!showExportMenu)}
                        >
                            📥 Export
                        </button>
                        {showExportMenu && (
                            <div className="export-menu">
                                <button className="export-menu-item" onClick={() => handleExport('pdf')}>
                                    <span>📄</span> PDF
                                </button>
                                <button className="export-menu-item" onClick={() => handleExport('markdown')}>
                                    <span>📝</span> Markdown
                                </button>
                            </div>
                        )}
                    </div>
                    <button
                        className="btn btn-ghost"
                        onClick={() => setShowDebug(!showDebug)}
                        style={{ fontSize: '12px' }}
                    >
                        🐛 {showDebug ? 'Hide' : 'Show'} Debug
                    </button>
                    <button
                        className="btn btn-ghost"
                        onClick={() => actions.resetAnalysis()}
                    >
                        🔄 New Analysis
                    </button>
                </div>
            </div>

            {/* Debug Panel */}
            {showDebug && (
                <div style={{
                    background: '#1e293b',
                    color: '#e2e8f0',
                    padding: '16px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    fontSize: '12px',
                    maxHeight: '300px',
                    overflow: 'auto'
                }}>
                    <h4 style={{ margin: '0 0 12px 0', color: '#94a3b8' }}>🐛 Debug: Raw Analysis Data</h4>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                        {JSON.stringify(analysis, null, 2)}
                    </pre>
                </div>
            )}

            <div className="report-tabs">
                {REPORT_SECTIONS.map((section) => (
                    <button
                        key={section.id}
                        className={`report-tab ${activeTab === section.id ? 'active' : ''}`}
                        onClick={() => actions.setActiveTab(section.id)}
                    >
                        <span className="report-tab-icon">{section.icon}</span>
                        {section.name}
                    </button>
                ))}
            </div>

            <div className="report-content">
                {renderContent()}
            </div>
        </div>
    );
}


// Executive Summary Component - Leadership Focused
function ExecutiveSummary({ analysis }) {
    const exec = analysis?.executiveSummary || {};
    const leadership = analysis?.leadershipSummary || {};
    const opportunities = analysis?.businessOpportunities || [];
    const queryIntel = analysis?.queryIntelligence || {};

    // Helper to get confidence badge
    const getConfidenceBadge = (confidence) => {
        if (!confidence) return null;
        const colors = {
            observed: 'badge-success',
            inferred: 'badge-warning',
            assumed: 'badge-neutral'
        };
        return (
            <span className={`badge ${colors[confidence] || 'badge-neutral'}`} style={{ marginLeft: '8px', fontSize: '10px' }}>
                {confidence}
            </span>
        );
    };

    const getImpactColor = (impact) => {
        const colors = {
            'Customer Experience': 'var(--color-primary-500)',
            'Revenue': 'var(--color-success-500)',
            'Efficiency': 'var(--color-info-500)',
            'Support Cost': 'var(--color-warning-500)'
        };
        return colors[impact] || 'var(--color-neutral-500)';
    };

    return (
        <div className="executive-summary">
            {/* Leadership Summary Header */}
            {leadership.analysisOverview && (
                <div style={{ marginBottom: '24px' }}>
                    <div className="metrics-grid" style={{ marginBottom: '16px' }}>
                        <div className="metric-card">
                            <div className="metric-label">Sessions Analyzed</div>
                            <div className="metric-value positive">{leadership.analysisOverview.totalSessionsAnalyzed || 'N/A'}</div>
                            <div className="metric-trend">
                                {leadership.analysisOverview.dateRange?.start && leadership.analysisOverview.dateRange?.end
                                    ? `${leadership.analysisOverview.dateRange.start} → ${leadership.analysisOverview.dateRange.end}`
                                    : 'Date range not available'}
                            </div>
                        </div>
                        {leadership.keyMetrics && (
                            <>
                                <div className="metric-card">
                                    <div className="metric-label">Avg Turns/Session</div>
                                    <div className="metric-value">{leadership.keyMetrics.avgTurnsPerSession || 'N/A'}</div>
                                </div>
                                <div className="metric-card">
                                    <div className="metric-label">Multi-Turn Sessions</div>
                                    <div className="metric-value positive">{leadership.keyMetrics.multiTurnSessions || 0}</div>
                                    <div className="metric-trend">engaged users</div>
                                </div>
                                <div className="metric-card">
                                    <div className="metric-label">Single-Turn Bounces</div>
                                    <div className="metric-value warning">{leadership.keyMetrics.singleTurnSessions || 0}</div>
                                </div>
                            </>
                        )}
                    </div>

                    {leadership.topLineInsight && (
                        <div style={{
                            background: 'linear-gradient(135deg, var(--color-primary-50), var(--color-primary-100))',
                            padding: '16px',
                            borderRadius: '12px',
                            borderLeft: '4px solid var(--color-primary-500)'
                        }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-primary-700)', marginBottom: '4px' }}>
                                💡 TOP INSIGHT
                            </div>
                            <div style={{ fontSize: '15px', color: 'var(--color-primary-900)' }}>
                                {leadership.topLineInsight}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Health Status */}
            <div className="health-overview" style={{ marginBottom: '24px' }}>
                <div className="health-score-circle">
                    <span className={`health-status ${exec.overallHealth || 'unknown'}`} style={{ fontSize: '24px' }}>
                        {exec.overallHealth === 'healthy' && '🟢'}
                        {exec.overallHealth === 'needs-attention' && '🟡'}
                        {exec.overallHealth === 'critical' && '🔴'}
                        {!exec.overallHealth && '⚪'}
                    </span>
                    <span className="health-score-label" style={{ textTransform: 'capitalize' }}>
                        {exec.overallHealth?.replace('-', ' ') || 'Unknown'}
                    </span>
                </div>
                <div className="health-details">
                    {exec.healthRationale && (
                        <p style={{ margin: '0 0 12px 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
                            {exec.healthRationale}
                        </p>
                    )}
                    <div className="key-findings">
                        {(exec.keyFindings || []).slice(0, 3).map((finding, index) => (
                            <div key={index} className="key-finding" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ color: 'var(--color-primary-500)' }}>•</span>
                                {typeof finding === 'string' ? finding : finding.finding}
                                {typeof finding === 'object' && getConfidenceBadge(finding.confidence)}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Top Priority */}
            {exec.topPriority && (
                <div className="top-priority" style={{ marginBottom: '24px' }}>
                    <div className="top-priority-label">
                        <span>⚡</span>
                        Top Priority
                    </div>
                    <p className="top-priority-text">{exec.topPriority}</p>
                    {exec.topPriorityEvidence && (
                        <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '8px' }}>
                            <strong>Evidence:</strong> {exec.topPriorityEvidence}
                        </p>
                    )}
                </div>
            )}

            {/* Business Opportunities */}
            {opportunities.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                    <h3 className="section-title">🎯 Business Opportunities ({opportunities.length})</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {opportunities.slice(0, 5).map((opp, index) => (
                            <div key={index} className="recommendation-item" style={{
                                borderLeft: `4px solid ${getImpactColor(opp.businessImpact)}`
                            }}>
                                <div className="recommendation-header">
                                    <span className="recommendation-number" style={{ background: getImpactColor(opp.businessImpact) }}>
                                        {opp.priority || index + 1}
                                    </span>
                                    <span className="recommendation-title">{opp.title}</span>
                                </div>
                                <div className="recommendation-tags">
                                    <span className={`badge ${opp.type === 'Quick Win' ? 'badge-success' : 'badge-primary'}`}>
                                        {opp.type}
                                    </span>
                                    <span className="badge badge-info">{opp.businessImpact}</span>
                                    <span className={`badge ${opp.estimatedEffort === 'Low' ? 'badge-success' : opp.estimatedEffort === 'Medium' ? 'badge-warning' : 'badge-danger'}`}>
                                        {opp.estimatedEffort} effort
                                    </span>
                                </div>
                                <div className="recommendation-description">{opp.problem}</div>
                                {opp.evidence?.quote && (
                                    <div className="recommendation-outcome" style={{ marginTop: '8px' }}>
                                        <span className="recommendation-outcome-label">Evidence: </span>
                                        <span className="recommendation-outcome-text">"{opp.evidence.quote}"</span>
                                        {opp.evidence.frequency && (
                                            <span style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                                                ({opp.evidence.frequency})
                                            </span>
                                        )}
                                    </div>
                                )}
                                <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--color-success-600)' }}>
                                    <strong>Action:</strong> {opp.suggestedAction}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Query Distribution Preview */}
            {queryIntel.queryDistribution && queryIntel.queryDistribution.length > 0 && (
                <div>
                    <h3 className="section-title">📊 Query Distribution</h3>
                    <div className="metrics-grid">
                        {queryIntel.queryDistribution.slice(0, 4).map((cat, index) => (
                            <div key={index} className="metric-card">
                                <div className="metric-label">{cat.category}</div>
                                <div className="metric-value">{cat.count}</div>
                                <div className="metric-trend">{cat.percentage}%</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Data Quality Notes */}
            {analysis?.dataQualityNotes && (
                <div style={{ marginTop: '24px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>📋 Data Quality Notes</h4>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <strong>Transcripts analyzed:</strong> {analysis.dataQualityNotes.totalTranscriptsAnalyzed}
                    </div>
                    {analysis.dataQualityNotes.dataLimitations?.length > 0 && (
                        <div style={{ marginTop: '8px' }}>
                            <strong style={{ fontSize: '12px' }}>Limitations:</strong>
                            <ul style={{ margin: '4px 0', paddingLeft: '20px', fontSize: '12px' }}>
                                {analysis.dataQualityNotes.dataLimitations.map((lim, i) => (
                                    <li key={i}>{lim}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}



// Health Metrics / Conversation Quality Component
function HealthMetrics({ analysis }) {
    const quality = analysis?.conversationQuality || {};
    const leadership = analysis?.leadershipSummary?.keyMetrics || {};

    const getConfidenceBadge = (confidence) => {
        if (!confidence) return null;
        const colors = {
            observed: 'badge-success',
            inferred: 'badge-warning',
            assumed: 'badge-neutral'
        };
        return (
            <span className={`badge ${colors[confidence] || 'badge-neutral'}`} style={{ fontSize: '9px', marginLeft: '4px' }}>
                {confidence}
            </span>
        );
    };

    return (
        <div>
            <h3 className="section-title">📊 Conversation Quality</h3>

            {quality.overview && (
                <p style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>{quality.overview}</p>
            )}

            {/* Key Metrics Grid */}
            <div className="metrics-grid" style={{ marginBottom: '24px' }}>
                {quality.successfulInteractions && (
                    <div className="metric-card">
                        <div className="metric-label">Successful Interactions</div>
                        <div className="metric-value positive">{quality.successfulInteractions.count || 0}</div>
                        <div className="metric-trend">{quality.successfulInteractions.percentage}%</div>
                    </div>
                )}
                {leadership.avgTurnsPerSession && (
                    <div className="metric-card">
                        <div className="metric-label">Avg Turns/Session</div>
                        <div className="metric-value">{leadership.avgTurnsPerSession}</div>
                    </div>
                )}
                {leadership.multiTurnSessions !== undefined && (
                    <div className="metric-card">
                        <div className="metric-label">Multi-Turn Sessions</div>
                        <div className="metric-value positive">{leadership.multiTurnSessions}</div>
                        <div className="metric-trend">engaged users</div>
                    </div>
                )}
                {leadership.longestSession && (
                    <div className="metric-card">
                        <div className="metric-label">Longest Session</div>
                        <div className="metric-value">{leadership.longestSession}</div>
                        <div className="metric-trend">turns</div>
                    </div>
                )}
            </div>

            {/* Bot Strengths */}
            {quality.botStrengths && quality.botStrengths.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ color: 'var(--color-success-600)', marginBottom: '12px' }}>✅ Bot Strengths</h4>
                    <div className="recommendation-list">
                        {quality.botStrengths.map((item, index) => (
                            <div key={index} className="recommendation-item" style={{ borderLeftColor: 'var(--color-success-500)' }}>
                                <div className="recommendation-title">{item.strength}</div>
                                {item.evidence && (
                                    <div className="recommendation-outcome" style={{ marginTop: '8px' }}>
                                        <span className="recommendation-outcome-label">Example: </span>
                                        <span className="recommendation-outcome-text">"{item.evidence}"</span>
                                        {getConfidenceBadge(item.confidence)}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Bot Weaknesses */}
            {quality.botWeaknesses && quality.botWeaknesses.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ color: 'var(--color-warning-600)', marginBottom: '12px' }}>⚠️ Areas for Improvement</h4>
                    <div className="recommendation-list">
                        {quality.botWeaknesses.map((item, index) => (
                            <div key={index} className="recommendation-item" style={{ borderLeftColor: 'var(--color-warning-500)' }}>
                                <div className="recommendation-title">{item.weakness}</div>
                                {item.evidence && (
                                    <div className="recommendation-description" style={{ marginTop: '8px' }}>
                                        <strong>Evidence:</strong> "{item.evidence}"
                                    </div>
                                )}
                                {item.suggestedFix && (
                                    <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--color-success-600)' }}>
                                        <strong>Suggested Fix:</strong> {item.suggestedFix}
                                    </div>
                                )}
                                {getConfidenceBadge(item.confidence)}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Problematic Patterns */}
            {quality.problematicPatterns && quality.problematicPatterns.length > 0 && (
                <div>
                    <h4 style={{ color: 'var(--color-danger-600)', marginBottom: '12px' }}>🚨 Problematic Patterns</h4>
                    <div className="recommendation-list">
                        {quality.problematicPatterns.map((pattern, index) => (
                            <div key={index} className="recommendation-item" style={{ borderLeftColor: 'var(--color-danger-500)' }}>
                                <div className="recommendation-header">
                                    <span className={`badge ${pattern.pattern === 'Loop' ? 'badge-warning' : pattern.pattern === 'Frustration' ? 'badge-danger' : 'badge-info'}`}>
                                        {pattern.pattern}
                                    </span>
                                    <span style={{ marginLeft: '8px' }}>{pattern.description}</span>
                                </div>
                                <div className="recommendation-tags" style={{ marginTop: '8px' }}>
                                    <span className="badge badge-neutral">Count: {pattern.count}</span>
                                    <span className="badge badge-info">{pattern.impact}</span>
                                    {getConfidenceBadge(pattern.confidence)}
                                </div>
                                {pattern.evidence && (
                                    <div className="recommendation-outcome" style={{ marginTop: '8px' }}>
                                        <span className="recommendation-outcome-label">Example: </span>
                                        <span className="recommendation-outcome-text">"{pattern.evidence}"</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}



// Intent Analysis Component
function IntentAnalysis({ analysis }) {
    const intents = analysis?.intentAnalysis?.discoveredIntents || [];
    const missing = analysis?.intentAnalysis?.missingIntents || [];

    return (
        <div>
            <h3 className="section-title">🎯 Discovered Intents ({intents.length})</h3>
            <div className="intent-list">
                {intents.map((intent, index) => (
                    <div key={index} className="intent-item">
                        <div className="intent-item-header">
                            <span className="intent-name">{intent.name}</span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <span className={`badge badge-${intent.qualityScore === 'effective' ? 'success' : intent.qualityScore === 'partial' ? 'warning' : 'danger'}`}>
                                    {intent.qualityScore}
                                </span>
                                <span className="badge badge-neutral">{intent.frequency}</span>
                            </div>
                        </div>
                        <div className="intent-category">{intent.category}</div>
                        {intent.examples?.length > 0 && (
                            <div className="intent-examples">
                                {intent.examples.slice(0, 3).map((ex, i) => (
                                    <div key={i} className="intent-example">"{ex}"</div>
                                ))}
                            </div>
                        )}
                        {intent.gaps?.length > 0 && (
                            <div style={{ marginTop: '8px' }}>
                                <strong style={{ fontSize: '12px', color: 'var(--color-warning-600)' }}>Gaps: </strong>
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                    {intent.gaps.join(', ')}
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {missing.length > 0 && (
                <>
                    <h3 className="section-title" style={{ marginTop: '32px' }}>⚠️ Missing Intents ({missing.length})</h3>
                    <div className="intent-list">
                        {missing.map((intent, index) => (
                            <div key={index} className="intent-item" style={{ borderLeftColor: 'var(--color-warning-500)' }}>
                                <div className="intent-item-header">
                                    <span className="intent-name">{intent.name}</span>
                                    <span className={`badge impact-${intent.priority}`}>{intent.priority} priority</span>
                                </div>
                                <div className="intent-category" style={{ marginTop: '8px' }}>{intent.evidence}</div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

// Issues View Component
function IssuesView({ analysis }) {
    const issues = analysis?.topFailures || [];
    const loops = analysis?.conversationIssues?.loops || [];

    return (
        <div>
            <h3 className="section-title">🚨 Top Failures ({issues.length})</h3>
            <div className="recommendation-list">
                {issues.map((issue, index) => (
                    <div key={index} className="recommendation-item">
                        <div className="recommendation-header">
                            <span className="recommendation-number" style={{ background: 'var(--color-danger-600)' }}>
                                {index + 1}
                            </span>
                            <span className="recommendation-title">{issue.issue}</span>
                        </div>
                        <div className="recommendation-description">
                            <strong>Root Cause:</strong> {issue.rootCause}
                        </div>
                        <div className="recommendation-description" style={{ marginTop: '8px' }}>
                            <strong>User Impact:</strong> {issue.userImpact}
                        </div>
                        {issue.transcriptEvidence && (
                            <div className="recommendation-outcome">
                                <span className="recommendation-outcome-label">Evidence: </span>
                                <span className="recommendation-outcome-text">"{issue.transcriptEvidence}"</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {loops.length > 0 && (
                <>
                    <h3 className="section-title" style={{ marginTop: '32px' }}>🔁 Detected Loops ({loops.length})</h3>
                    <div className="recommendation-list">
                        {loops.map((loop, index) => (
                            <div key={index} className="recommendation-item">
                                <div className="recommendation-header">
                                    <span className="recommendation-title">{loop.type}</span>
                                    <span className="badge badge-warning">Frequency: {loop.frequency}</span>
                                </div>
                                <div className="recommendation-description">{loop.rootCause}</div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

// Recommendations View Component
function RecommendationsView({ analysis }) {
    const recs = analysis?.recommendations || [];

    return (
        <div>
            <h3 className="section-title">💡 Recommendations ({recs.length})</h3>
            <div className="recommendation-list">
                {recs.map((rec, index) => (
                    <div key={index} className="recommendation-item">
                        <div className="recommendation-header">
                            <span className="recommendation-number">{rec.id || index + 1}</span>
                            <span className="recommendation-title">{rec.title}</span>
                        </div>
                        <div className="recommendation-tags">
                            <span className={`badge badge-${rec.category?.toLowerCase() === 'prompt' ? 'primary' :
                                rec.category?.toLowerCase() === 'training' ? 'info' :
                                    rec.category?.toLowerCase() === 'knowledge' ? 'success' : 'warning'}`}>
                                {rec.category}
                            </span>
                            <span className={`badge impact-${rec.impact}`}>Impact: {rec.impact}</span>
                            <span className={`badge ${rec.effort === 'low' ? 'badge-success' : rec.effort === 'medium' ? 'badge-warning' : 'badge-danger'}`}>
                                Effort: {rec.effort}
                            </span>
                        </div>
                        <div className="recommendation-description">{rec.description}</div>
                        {rec.expectedOutcome && (
                            <div className="recommendation-outcome">
                                <span className="recommendation-outcome-label">Expected Outcome: </span>
                                <span className="recommendation-outcome-text">{rec.expectedOutcome}</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// Prompt Optimization Component
function PromptOptimization({ analysis }) {
    const suggestions = analysis?.promptOptimization?.suggestions || [];
    const samplePrompt = analysis?.promptOptimization?.sampleImprovedPrompt;

    return (
        <div>
            <h3 className="section-title">✏️ Prompt Improvement Suggestions ({suggestions.length})</h3>
            <div className="recommendation-list">
                {suggestions.map((sug, index) => (
                    <div key={index} className="recommendation-item">
                        <div className="recommendation-header">
                            <span className="recommendation-title">{sug.area}</span>
                        </div>
                        <div className="recommendation-description">
                            <strong>Current:</strong> {sug.currentBehavior}
                        </div>
                        <div className="recommendation-description" style={{ marginTop: '8px' }}>
                            <strong>Recommended:</strong> {sug.recommendation}
                        </div>
                        {sug.promptSnippet && (
                            <div className="recommendation-outcome">
                                <span className="recommendation-outcome-label">Prompt Snippet:</span>
                                <pre style={{
                                    background: 'var(--bg-tertiary)',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    marginTop: '8px',
                                    fontSize: '12px',
                                    overflow: 'auto'
                                }}>
                                    {sug.promptSnippet}
                                </pre>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {samplePrompt && (
                <div style={{ marginTop: '24px' }}>
                    <h3 className="section-title">📄 Sample Improved System Prompt</h3>
                    <pre style={{
                        background: 'var(--bg-tertiary)',
                        padding: '16px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        overflow: 'auto',
                        maxHeight: '400px'
                    }}>
                        {samplePrompt}
                    </pre>
                </div>
            )}
        </div>
    );
}

// Training Recommendations Component
function TrainingRecommendations({ analysis }) {
    const newIntents = analysis?.trainingRecommendations?.newIntents || [];
    const faqs = analysis?.trainingRecommendations?.faqsToAdd || [];

    return (
        <div>
            <h3 className="section-title">📚 New Intents to Train ({newIntents.length})</h3>
            <div className="recommendation-list">
                {newIntents.map((intent, index) => (
                    <div key={index} className="recommendation-item">
                        <div className="recommendation-header">
                            <span className="recommendation-title">{intent.name}</span>
                        </div>
                        <div>
                            <strong style={{ fontSize: '12px' }}>Training Utterances:</strong>
                            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                                {(intent.utterances || []).map((u, i) => (
                                    <li key={i} style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>"{u}"</li>
                                ))}
                            </ul>
                        </div>
                        {intent.responses?.[0] && (
                            <div className="recommendation-outcome">
                                <span className="recommendation-outcome-label">Suggested Response:</span>
                                <div style={{
                                    background: 'var(--bg-secondary)',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    marginTop: '8px',
                                    fontSize: '13px'
                                }}>
                                    {intent.responses[0]}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {faqs.length > 0 && (
                <div style={{ marginTop: '24px' }}>
                    <h3 className="section-title">❓ FAQs to Add ({faqs.length})</h3>
                    <div className="recommendation-list">
                        {faqs.map((faq, index) => (
                            <div key={index} className="recommendation-item">
                                <div style={{ fontWeight: 600, marginBottom: '8px' }}>Q: {faq.question}</div>
                                <div style={{ color: 'var(--text-secondary)' }}>A: {faq.answer}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// Query Insights Component
function QueryInsights({ analysis }) {
    const queryIntel = analysis?.queryIntelligence || {};
    const leadership = analysis?.leadershipSummary?.analysisOverview || {};
    const queryDistribution = queryIntel.queryDistribution || [];
    const topSearchedItems = queryIntel.topSearchedItems || [];
    const unmetNeeds = queryIntel.unmetNeeds || [];

    const getConfidenceBadge = (confidence) => {
        if (!confidence) return null;
        const colors = {
            observed: 'badge-success',
            inferred: 'badge-warning'
        };
        return (
            <span className={`badge ${colors[confidence] || 'badge-neutral'}`} style={{ fontSize: '9px', marginLeft: '4px' }}>
                {confidence}
            </span>
        );
    };

    return (
        <div>
            <h3 className="section-title">📊 Query Intelligence</h3>

            {queryIntel.overview && (
                <p style={{ marginBottom: '24px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    {queryIntel.overview}
                </p>
            )}

            {/* Volume Stats */}
            <div className="metrics-grid" style={{ marginBottom: '24px' }}>
                <div className="metric-card">
                    <div className="metric-label">Total Unique Queries</div>
                    <div className="metric-value">{queryIntel.totalUniqueQueries || 'N/A'}</div>
                </div>
                {leadership.dateRange && (
                    <div className="metric-card">
                        <div className="metric-label">📅 Date Range</div>
                        <div className="metric-value" style={{ fontSize: 'var(--font-size-lg)' }}>
                            {leadership.dateRange.start || 'N/A'} → {leadership.dateRange.end || 'N/A'}
                        </div>
                        <div className="metric-trend">{leadership.dateRange.totalDays || 0} days</div>
                    </div>
                )}
            </div>

            {/* Query Distribution */}
            {queryDistribution.length > 0 && (
                <>
                    <h3 className="section-title">📊 Query Distribution</h3>
                    <div className="metrics-grid" style={{ marginBottom: '24px' }}>
                        {queryDistribution.map((cat, index) => (
                            <div key={index} className="metric-card">
                                <div className="metric-label">{cat.category}</div>
                                <div className="metric-value">{cat.count}</div>
                                <div className="metric-trend">{cat.percentage}%</div>
                                {cat.businessImplication && (
                                    <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                                        {cat.businessImplication}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Top Searched Items */}
            {topSearchedItems.length > 0 && (
                <>
                    <h3 className="section-title">🔍 Top Searched Items ({topSearchedItems.length})</h3>
                    <div className="recommendation-list" style={{ marginBottom: '24px' }}>
                        {topSearchedItems.slice(0, 15).map((item, index) => (
                            <div key={index} className="recommendation-item">
                                <div className="recommendation-header">
                                    <span className="recommendation-number">{item.searchCount}</span>
                                    <span className="recommendation-title">{item.item}</span>
                                </div>
                                <div className="recommendation-tags">
                                    <span className={`badge ${item.botResponseQuality === 'Effective' ? 'badge-success' :
                                        item.botResponseQuality === 'Needs Improvement' ? 'badge-warning' : 'badge-danger'
                                        }`}>
                                        {item.botResponseQuality}
                                    </span>
                                </div>
                                {item.examples?.length > 0 && (
                                    <div style={{ marginTop: '8px', fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)' }}>
                                        Examples: {item.examples.slice(0, 3).map(e => `"${e}"`).join(', ')}
                                    </div>
                                )}
                                {item.qualityEvidence && (
                                    <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                                        {item.qualityEvidence}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Unmet Needs */}
            {unmetNeeds.length > 0 && (
                <>
                    <h3 className="section-title" style={{ color: 'var(--color-danger-600)' }}>
                        🚨 Unmet User Needs ({unmetNeeds.length})
                    </h3>
                    <div className="recommendation-list">
                        {unmetNeeds.map((need, index) => (
                            <div key={index} className="recommendation-item" style={{ borderLeftColor: 'var(--color-danger-500)' }}>
                                <div className="recommendation-header">
                                    <span className="recommendation-title">{need.need}</span>
                                </div>
                                <div className="recommendation-tags">
                                    <span className="badge badge-danger">{need.impact}</span>
                                    <span className="badge badge-neutral">Frequency: {need.frequency}</span>
                                    {getConfidenceBadge(need.confidence)}
                                </div>
                                {need.example && (
                                    <div style={{
                                        marginTop: '8px',
                                        padding: '8px 12px',
                                        background: 'var(--bg-secondary)',
                                        borderLeft: '3px solid var(--color-danger-400)',
                                        fontSize: '13px',
                                        fontStyle: 'italic',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        "{need.example}"
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Empty state */}
            {queryDistribution.length === 0 && topSearchedItems.length === 0 && unmetNeeds.length === 0 && (
                <div style={{
                    textAlign: 'center',
                    padding: '48px',
                    color: 'var(--text-tertiary)',
                    background: 'var(--bg-secondary)',
                    borderRadius: '12px'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                    <div style={{ fontSize: '16px', fontWeight: 500 }}>No Query Intelligence Data</div>
                    <div style={{ fontSize: '14px', marginTop: '8px' }}>
                        Query distribution and search patterns will appear here after analysis.
                    </div>
                </div>
            )}
        </div>
    );
}


// ============== NEW DATA-HONEST COMPONENTS ==============

// Session Overview Component
function SessionOverview({ analysis }) {
    const overview = analysis?.sessionOverview || {};
    const turnAnalysis = overview.turnAnalysis || {};
    const timePatterns = overview.timePatterns || {};
    const dataQuality = analysis?.dataQualityNotes || {};

    return (
        <div>
            <h3 className="section-title">📊 Session Overview</h3>

            <div className="metrics-grid" style={{ marginBottom: '24px' }}>
                <div className="metric-card">
                    <div className="metric-label">Total Sessions</div>
                    <div className="metric-value positive">{overview.totalSessions || 'N/A'}</div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">Date Range</div>
                    <div className="metric-value" style={{ fontSize: '16px' }}>
                        {overview.dateRange?.start || 'N/A'} → {overview.dateRange?.end || 'N/A'}
                    </div>
                    <div className="metric-trend">{overview.dateRange?.totalDays || 0} days</div>
                </div>
            </div>

            <h4 style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>Turn Analysis</h4>
            <div className="metrics-grid" style={{ marginBottom: '24px' }}>
                <div className="metric-card" title="Sessions where user asked just 1 query and left — they got what they needed or gave up immediately">
                    <div className="metric-label">Single-Turn Sessions</div>
                    <div className="metric-value">{turnAnalysis.singleTurnSessions || 0}</div>
                    <div className="metric-trend">1 query & done</div>
                </div>
                <div className="metric-card" title="Sessions with 2+ queries — user had a conversation with the chatbot">
                    <div className="metric-label">Multi-Turn Sessions</div>
                    <div className="metric-value positive">{turnAnalysis.multiTurnSessions || 0}</div>
                    <div className="metric-trend">2+ queries</div>
                </div>
                <div className="metric-card" title="Average number of user messages per session. Low values suggest users treat chatbot as search, high values indicate conversational engagement">
                    <div className="metric-label">Avg Turns/Session</div>
                    <div className="metric-value">{turnAnalysis.avgTurnsPerSession || 'N/A'}</div>
                </div>
                <div className="metric-card" title="The longest conversation — maximum number of back-and-forth messages in a single session">
                    <div className="metric-label">Max Turns</div>
                    <div className="metric-value">{turnAnalysis.maxTurnsInSession || 'N/A'}</div>
                </div>
            </div>

            {(timePatterns.busiestHour || timePatterns.busiestDay || timePatterns.busiestDate) && (
                <>
                    <h4 style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>Time Patterns</h4>
                    <div className="metrics-grid" style={{ marginBottom: '24px' }}>
                        {timePatterns.busiestDate && (
                            <div className="metric-card">
                                <div className="metric-label">Busiest Date</div>
                                <div className="metric-value" style={{ fontSize: '18px' }}>{timePatterns.busiestDate}</div>
                                <div className="metric-trend">{timePatterns.busiestDateCount} sessions</div>
                            </div>
                        )}
                        {timePatterns.busiestHour && (
                            <div className="metric-card">
                                <div className="metric-label">Busiest Hour</div>
                                <div className="metric-value">{timePatterns.busiestHour}</div>
                                <div className="metric-trend">{timePatterns.busiestHourCount} sessions</div>
                            </div>
                        )}
                        {timePatterns.busiestDay && (
                            <div className="metric-card">
                                <div className="metric-label">Busiest Day of Week</div>
                                <div className="metric-value">{timePatterns.busiestDay}</div>
                                <div className="metric-trend">{timePatterns.busiestDayCount} sessions</div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Data Quality Notes */}
            {dataQuality.dataLimitations && (
                <div style={{
                    background: 'var(--bg-secondary)',
                    padding: '16px',
                    borderRadius: '8px',
                    borderLeft: '4px solid var(--color-warning-400)'
                }}>
                    <h4 style={{ marginBottom: '8px', color: 'var(--color-warning-600)' }}>⚠️ Data Limitations</h4>
                    <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-secondary)' }}>
                        {dataQuality.dataLimitations.map((limitation, i) => (
                            <li key={i} style={{ marginBottom: '4px' }}>{limitation}</li>
                        ))}
                    </ul>
                    {dataQuality.whatWeCannotDetermine && (
                        <>
                            <h5 style={{ marginTop: '12px', marginBottom: '4px', color: 'var(--text-tertiary)' }}>Cannot determine from this data:</h5>
                            <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                                {dataQuality.whatWeCannotDetermine.map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

// Query Analysis Component
function QueryAnalysis({ analysis }) {
    const [searchTerm, setSearchTerm] = useState('');
    const queryData = analysis?.queryAnalysis || {};
    const allQueries = queryData.allUniqueQueries || [];
    const categories = queryData.queryCategories || [];

    const filteredQueries = allQueries
        .filter(q => q.query?.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => (b.frequency || 0) - (a.frequency || 0));

    return (
        <div>
            <h3 className="section-title">🔍 Query Analysis</h3>

            {queryData.overview && (
                <p style={{ marginBottom: '24px', color: 'var(--text-secondary)' }}>{queryData.overview}</p>
            )}

            <div className="metrics-grid" style={{ marginBottom: '24px' }}>
                <div className="metric-card">
                    <div className="metric-label">Total Queries</div>
                    <div className="metric-value">{queryData.totalQueries || 0}</div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">Unique Queries</div>
                    <div className="metric-value">{queryData.uniqueQueries || allQueries.length}</div>
                </div>
            </div>

            {categories.length > 0 && (
                <>
                    <h4 style={{ marginBottom: '16px' }}>Query Categories</h4>
                    <div className="metrics-grid" style={{ marginBottom: '24px' }}>
                        {categories.map((cat, i) => (
                            <div key={i} className="metric-card">
                                <div className="metric-label">{cat.category}</div>
                                <div className="metric-value">{cat.count}</div>
                                <div className="metric-trend">{cat.percentage}%</div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {queryData.topSearchedQueries && queryData.topSearchedQueries.length > 0 && (
                <>
                    <h4 style={{ marginBottom: '12px' }}>Top Searched Queries</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
                        {queryData.topSearchedQueries.map((item, i) => (
                            <span key={i} className="badge badge-primary" style={{ fontSize: '14px', padding: '6px 12px' }}>
                                {item.query} ({item.frequency})
                            </span>
                        ))}
                    </div>
                </>
            )}

            <h4 style={{ marginBottom: '16px' }}>All Queries ({allQueries.length})</h4>
            <input
                type="text"
                placeholder="Search queries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                    width: '100%',
                    maxWidth: '400px',
                    padding: '10px 16px',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                }}
            />

            {filteredQueries.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'var(--bg-secondary)' }}>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--border-primary)' }}>Query</th>
                            <th style={{ padding: '12px', textAlign: 'center', width: '100px', borderBottom: '2px solid var(--border-primary)' }}>Count</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredQueries.slice(0, 50).map((q, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid var(--border-secondary)' }}>
                                <td style={{ padding: '12px' }}>{q.query}</td>
                                <td style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>{q.frequency}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-tertiary)', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
                    No queries found
                </div>
            )}
        </div>
    );
}

// Bot Responses Component
function BotResponses({ analysis }) {
    const responses = analysis?.botResponseAnalysis || {};
    const patterns = responses.responsePatterns || [];

    return (
        <div>
            <h3 className="section-title">🤖 Bot Response Analysis</h3>

            {responses.overview && (
                <p style={{ marginBottom: '24px', color: 'var(--text-secondary)' }}>{responses.overview}</p>
            )}

            <div className="metrics-grid" style={{ marginBottom: '24px' }}>
                <div className="metric-card">
                    <div className="metric-label">Sessions With Results</div>
                    <div className="metric-value positive">{responses.sessionsWithResults?.count || 0}</div>
                    <div className="metric-trend">{responses.sessionsWithResults?.percentage || 0}%</div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">Sessions Without Results</div>
                    <div className="metric-value warning">{responses.sessionsWithoutResults?.count || 0}</div>
                    <div className="metric-trend">{responses.sessionsWithoutResults?.percentage || 0}%</div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">Avg Products Returned</div>
                    <div className="metric-value">{responses.avgProductsReturned || 'N/A'}</div>
                </div>
            </div>

            {patterns.length > 0 && (
                <>
                    <h4 style={{ marginBottom: '16px' }}>Response Patterns</h4>
                    <div className="recommendation-list">
                        {patterns.map((pattern, i) => (
                            <div key={i} className="recommendation-item">
                                <div className="recommendation-header">
                                    <span className="recommendation-title">{pattern.pattern}</span>
                                    <span className="badge badge-neutral">{pattern.count} times</span>
                                </div>
                                {pattern.example && (
                                    <div style={{ marginTop: '8px', padding: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', fontSize: '13px', fontStyle: 'italic' }}>
                                        "{pattern.example}"
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}

            {responses.clarifyingQuestions?.count > 0 && (
                <>
                    <h4 style={{ marginTop: '24px', marginBottom: '16px' }}>Clarifying Questions ({responses.clarifyingQuestions.count})</h4>
                    <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px' }}>
                        {responses.clarifyingQuestions.examples?.map((q, i) => (
                            <div key={i} style={{ marginBottom: '8px', fontStyle: 'italic' }}>
                                "{typeof q === 'string' ? q : q.content}"
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

// Product Insights Component
function ProductInsights({ analysis }) {
    const products = analysis?.productInsights || {};
    const topProducts = products.topRecommendedProducts || [];
    const styles = products.styleAnalysis || {};

    return (
        <div>
            <h3 className="section-title">🏷️ Product Insights</h3>

            {products.overview && (
                <p style={{ marginBottom: '24px', color: 'var(--text-secondary)' }}>{products.overview}</p>
            )}

            <div className="metrics-grid" style={{ marginBottom: '24px' }}>
                <div className="metric-card">
                    <div className="metric-label">Total Products Recommended</div>
                    <div className="metric-value">{products.totalProductsRecommended || 0}</div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">Unique Products</div>
                    <div className="metric-value">{products.uniqueProductsRecommended || 0}</div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">Unique Styles</div>
                    <div className="metric-value">{styles.totalStyles || 0}</div>
                </div>
            </div>

            {styles.topStyles && styles.topStyles.length > 0 && (
                <>
                    <h4 style={{ marginBottom: '16px' }}>Top Styles Surfaced</h4>
                    <div className="recommendation-list" style={{ marginBottom: '24px' }}>
                        {styles.topStyles.map((style, i) => (
                            <div key={i} className="recommendation-item">
                                <div className="recommendation-header">
                                    <span className="recommendation-title">{style.style}</span>
                                    <span className="badge badge-primary">{style.frequency} times</span>
                                </div>
                                {style.exampleQueries && style.exampleQueries.length > 0 && (
                                    <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-tertiary)' }}>
                                        Triggered by: {style.exampleQueries.slice(0, 3).map(q => `"${q}"`).join(', ')}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}

            {topProducts.length > 0 && (
                <>
                    <h4 style={{ marginBottom: '16px' }}>Top Recommended Products</h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-secondary)' }}>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Product ID</th>
                                <th style={{ padding: '12px', textAlign: 'center', width: '100px' }}>Frequency</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topProducts.slice(0, 20).map((product, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--border-secondary)' }}>
                                    <td style={{ padding: '12px', fontFamily: 'monospace' }}>{product.productId}</td>
                                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>{product.frequency}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}
        </div>
    );
}

// Issues and Recommendations Component
function IssuesAndRecommendations({ analysis }) {
    const issues = analysis?.potentialIssues || [];
    const recommendations = analysis?.recommendations || [];
    const observations = analysis?.observations || {};

    const severityColors = {
        high: 'badge-danger',
        medium: 'badge-warning',
        low: 'badge-neutral'
    };

    return (
        <div>
            <h3 className="section-title">⚠️ Potential Issues</h3>
            <p style={{ marginBottom: '16px', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                Note: These are inferred issues based on patterns in the data. Without engagement data, we cannot confirm impact.
            </p>

            {issues.length > 0 ? (
                <div className="recommendation-list" style={{ marginBottom: '32px' }}>
                    {issues.map((issue, i) => (
                        <div key={i} className="recommendation-item" style={{ borderLeftColor: issue.severity === 'high' ? 'var(--color-danger-500)' : issue.severity === 'medium' ? 'var(--color-warning-500)' : 'var(--color-neutral-400)' }}>
                            <div className="recommendation-header">
                                <span className="recommendation-title">{issue.issue}</span>
                                <span className={`badge ${severityColors[issue.severity] || 'badge-neutral'}`}>{issue.severity}</span>
                                <span className="badge badge-neutral">{issue.type}</span>
                            </div>
                            {issue.frequency && (
                                <div style={{ marginTop: '8px', fontSize: '13px' }}>Observed: {issue.frequency} times</div>
                            )}
                            {issue.evidence && (
                                <div style={{ marginTop: '8px', padding: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', fontSize: '13px', fontStyle: 'italic' }}>
                                    "{issue.evidence}"
                                </div>
                            )}
                            {issue.caveat && (
                                <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--color-warning-600)' }}>
                                    ⚠️ {issue.caveat}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '32px', background: 'var(--bg-secondary)', borderRadius: '12px', marginBottom: '32px' }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>🤖</div>
                    <div style={{ fontWeight: 500, marginBottom: '8px' }}>No Issues Detected</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                        Connect an LLM in the settings to enable AI-powered issue detection and recommendations.
                    </div>
                </div>
            )}

            <h3 className="section-title">💡 Recommendations</h3>
            {recommendations.length > 0 ? (
                <div className="recommendation-list">
                    {recommendations.map((rec, i) => (
                        <div key={i} className="recommendation-item">
                            <div className="recommendation-header">
                                <span className="recommendation-number">{rec.id || i + 1}</span>
                                <span className="recommendation-title">{rec.title}</span>
                                <span className={`badge ${rec.effort === 'low' ? 'badge-success' : rec.effort === 'high' ? 'badge-danger' : 'badge-warning'}`}>
                                    {rec.effort} effort
                                </span>
                            </div>
                            {rec.rationale && (
                                <div style={{ marginTop: '8px', color: 'var(--text-secondary)' }}>{rec.rationale}</div>
                            )}
                            {rec.evidence && (
                                <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-tertiary)' }}>
                                    Evidence: {rec.evidence}
                                </div>
                            )}
                            {rec.action && (
                                <div style={{ marginTop: '8px', padding: '8px', background: 'var(--bg-secondary)', borderRadius: '4px' }}>
                                    <strong>Action:</strong> {rec.action}
                                </div>
                            )}
                            {rec.caveat && (
                                <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--color-warning-600)' }}>
                                    ⚠️ {rec.caveat}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '24px', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
                    No recommendations generated
                </div>
            )}

            {observations.patterns && observations.patterns.length > 0 && (
                <>
                    <h3 className="section-title" style={{ marginTop: '32px' }}>👁️ Observations</h3>
                    <div className="recommendation-list">
                        {observations.patterns.map((obs, i) => (
                            <div key={i} className="recommendation-item">
                                <div className="recommendation-title">{obs.observation}</div>
                                {obs.evidence && (
                                    <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-tertiary)' }}>{obs.evidence}</div>
                                )}
                                {obs.businessRelevance && (
                                    <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--color-primary-600)' }}>
                                        📈 {obs.businessRelevance}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

// Site Info Component - displays website info from Jina AI scraper
function SiteInfo({ websiteContent, llmEnabled }) {
    if (!websiteContent?.success) {
        return (
            <div>
                <h3 className="section-title">🌐 Site Information</h3>
                <div style={{ textAlign: 'center', padding: '48px', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌐</div>
                    <div style={{ fontWeight: 500, marginBottom: '8px' }}>No Site Data Available</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                        Click "Fetch Content" on the website URL to analyze site structure.
                    </div>
                </div>
            </div>
        );
    }

    const homepage = websiteContent.homepage;
    const categories = websiteContent.categories || [];
    const products = websiteContent.products || [];
    const sitemap = websiteContent.sitemap;
    const extractedCategories = websiteContent.extractedCategories || [];
    const extractedLinks = websiteContent.extractedLinks || [];

    // Extract key info from homepage content
    const extractTitle = (content) => {
        const titleMatch = content?.match(/^#\s*(.+)$/m);
        return titleMatch ? titleMatch[1] : null;
    };

    const extractDescription = (content) => {
        if (!content) return null;
        // Get first paragraph-like content
        const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#') && !l.startsWith('['));
        return lines.slice(0, 3).join(' ').substring(0, 300);
    };

    const siteTitle = extractTitle(homepage?.content);
    const siteDescription = extractDescription(homepage?.content);

    // Show extracted categories count if no sitemap categories found
    const displayCategoryCount = categories.length > 0 ? categories.length : extractedCategories.length;
    const hasCategories = categories.length > 0 || extractedCategories.length > 0;

    return (
        <div>
            <h3 className="section-title">🌐 Site Information</h3>

            <div className="metrics-grid" style={{ marginBottom: '24px' }}>
                <div className="metric-card">
                    <div className="metric-label">Data Source</div>
                    <div className="metric-value" style={{ fontSize: '16px' }}>Jina AI Reader</div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">Page URL</div>
                    <div className="metric-value" style={{ fontSize: '13px', wordBreak: 'break-all' }}>
                        {homepage?.url || 'N/A'}
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">AI Analysis</div>
                    <div className="metric-value" style={{ fontSize: '14px' }}>
                        {llmEnabled ? '✅ Enabled' : '❌ Disabled'}
                    </div>
                </div>
            </div>

            {siteTitle && (
                <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ marginBottom: '8px' }}>Site Title</h4>
                    <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '18px', fontWeight: 500 }}>
                        {siteTitle}
                    </div>
                </div>
            )}

            {siteDescription && (
                <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ marginBottom: '8px' }}>Site Description</h4>
                    <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                        {siteDescription}...
                    </div>
                </div>
            )}

            <div className="metrics-grid" style={{ marginBottom: '24px' }}>
                <div className="metric-card">
                    <div className="metric-label">Sitemap URLs</div>
                    <div className="metric-value">{sitemap?.urls?.length || 0}</div>
                    <div className="metric-trend" style={{ color: sitemap?.success ? 'var(--color-success-500)' : 'var(--color-warning-500)' }}>
                        {sitemap?.success ? 'Found' : 'Not found'}
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">Categories Found</div>
                    <div className="metric-value">{displayCategoryCount}</div>
                    {!sitemap?.success && extractedCategories.length > 0 && (
                        <div className="metric-trend">From homepage</div>
                    )}
                </div>
                <div className="metric-card">
                    <div className="metric-label">Products Analyzed</div>
                    <div className="metric-value">{products.length}</div>
                </div>
            </div>

            {/* LLM-Extracted Site Analysis */}
            {websiteContent.llmAnalysis && (
                <div style={{ marginBottom: '24px', padding: '20px', background: 'linear-gradient(135deg, var(--color-primary-50) 0%, var(--color-primary-100) 100%)', borderRadius: '12px', border: '1px solid var(--color-primary-200)' }}>
                    <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>🤖</span> AI-Powered Site Analysis
                        <span className="badge badge-primary" style={{ fontSize: '11px', padding: '2px 8px' }}>LLM</span>
                    </h4>

                    <div className="metrics-grid" style={{ marginBottom: '16px' }}>
                        {websiteContent.llmAnalysis.industry && (
                            <div className="metric-card" style={{ background: 'rgba(255,255,255,0.8)' }}>
                                <div className="metric-label">Industry</div>
                                <div className="metric-value" style={{ fontSize: '15px' }}>{websiteContent.llmAnalysis.industry}</div>
                            </div>
                        )}
                        {websiteContent.llmAnalysis.businessType && (
                            <div className="metric-card" style={{ background: 'rgba(255,255,255,0.8)' }}>
                                <div className="metric-label">Business Type</div>
                                <div className="metric-value" style={{ fontSize: '15px' }}>{websiteContent.llmAnalysis.businessType}</div>
                            </div>
                        )}
                        {websiteContent.llmAnalysis.targetAudience && (
                            <div className="metric-card" style={{ background: 'rgba(255,255,255,0.8)' }}>
                                <div className="metric-label">Target Audience</div>
                                <div className="metric-value" style={{ fontSize: '13px' }}>{websiteContent.llmAnalysis.targetAudience}</div>
                            </div>
                        )}
                    </div>

                    {websiteContent.llmAnalysis.mainCategories?.length > 0 && (
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-secondary)' }}>Main Categories</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {websiteContent.llmAnalysis.mainCategories.map((cat, i) => (
                                    <span key={i} className="badge badge-primary" style={{ padding: '6px 12px', background: 'var(--color-primary-600)', color: 'white' }}>
                                        {typeof cat === 'object' ? cat.name : cat}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {websiteContent.llmAnalysis.productTypes?.length > 0 && (
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-secondary)' }}>Product Types</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {websiteContent.llmAnalysis.productTypes.slice(0, 10).map((type, i) => (
                                    <span key={i} className="badge" style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.9)', border: '1px solid var(--color-primary-300)' }}>
                                        {type}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {websiteContent.llmAnalysis.keyFeatures?.length > 0 && (
                        <div>
                            <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-secondary)' }}>Key Features</div>
                            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                {websiteContent.llmAnalysis.keyFeatures.slice(0, 5).map((feature, i) => (
                                    <li key={i}>{feature}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {websiteContent.llmAnalysis.confidence && (
                        <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>Confidence: {websiteContent.llmAnalysis.confidence.overall}</span>
                            {websiteContent.llmAnalysis.confidence.reason && (
                                <span>• {websiteContent.llmAnalysis.confidence.reason}</span>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Show extracted categories from homepage when sitemap not found */}
            {extractedCategories.length > 0 && categories.length === 0 && (
                <>
                    <h4 style={{ marginBottom: '12px' }}>Categories (Extracted from Homepage)</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
                        {extractedCategories.slice(0, 15).map((cat, i) => (
                            <span key={i} className="badge badge-primary" style={{ padding: '6px 12px' }}>
                                {cat}
                            </span>
                        ))}
                    </div>
                </>
            )}

            {/* Show extracted links from homepage */}
            {extractedLinks.length > 0 && categories.length === 0 && (
                <>
                    <h4 style={{ marginBottom: '12px' }}>Site Links ({extractedLinks.length} found)</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '24px', maxHeight: '200px', overflowY: 'auto' }}>
                        {extractedLinks.slice(0, 20).map((link, i) => (
                            <div key={i} style={{ fontSize: '13px' }}>
                                <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary-600)' }}>
                                    {link.text}
                                </a>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {categories.length > 0 && (
                <>
                    <h4 style={{ marginBottom: '12px' }}>Category Pages</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                        {categories.map((cat, i) => (
                            <div key={i} style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '13px' }}>
                                <a href={cat.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary-600)' }}>
                                    {cat.url}
                                </a>
                                {cat.success && <span className="badge badge-success" style={{ marginLeft: '8px' }}>✓</span>}
                            </div>
                        ))}
                    </div>
                </>
            )}

            {products.length > 0 && (
                <>
                    <h4 style={{ marginBottom: '12px' }}>Product Pages</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                        {products.map((prod, i) => (
                            <div key={i} style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '13px' }}>
                                <a href={prod.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary-600)' }}>
                                    {prod.url}
                                </a>
                                {prod.success && <span className="badge badge-success" style={{ marginLeft: '8px' }}>✓</span>}
                            </div>
                        ))}
                    </div>
                </>
            )}

            {homepage?.content && (
                <>
                    <h4 style={{ marginBottom: '12px' }}>Homepage Content Preview</h4>
                    <div style={{
                        padding: '16px',
                        background: 'var(--bg-secondary)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        maxHeight: '300px',
                        overflowY: 'auto',
                        whiteSpace: 'pre-wrap',
                        color: 'var(--text-tertiary)'
                    }}>
                        {homepage.content.substring(0, 2000)}
                        {homepage.content.length > 2000 && '\n\n[Content truncated...]'}
                    </div>
                </>
            )}
        </div>
    );
}

// User Insights Component - displays user behavior analysis
function UserInsights({ userBehavior }) {
    if (!userBehavior) {
        return (
            <div>
                <h3 className="section-title">👤 User Insights</h3>
                <div style={{ textAlign: 'center', padding: '48px', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>👤</div>
                    <div style={{ fontWeight: 500 }}>No user behavior data available</div>
                </div>
            </div>
        );
    }

    const { queryComplexity, repeatedQueries, intentCategories, insights } = userBehavior;

    return (
        <div>
            <h3 className="section-title">👤 User Insights</h3>
            <p style={{ color: 'var(--text-tertiary)', marginBottom: '24px' }}>
                Understanding how users interact with your chatbot
            </p>

            {/* Query Complexity Breakdown */}
            <div style={{ marginBottom: '32px' }}>
                <h4 style={{ marginBottom: '16px' }}>Query Complexity</h4>
                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                    {/* Pie Chart */}
                    <div style={{ flex: '1', minWidth: '280px', height: '250px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Single Word', value: queryComplexity?.singleWord || 0, color: '#94a3b8' },
                                        { name: 'Simple Phrase', value: queryComplexity?.simplePhrase || 0, color: '#60a5fa' },
                                        { name: 'Advanced Search', value: queryComplexity?.advancedSearch || 0, color: '#34d399' },
                                        { name: 'Natural Language', value: queryComplexity?.naturalLanguage || 0, color: '#a78bfa' },
                                    ].filter(d => d.value > 0)}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={2}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    labelLine={false}
                                >
                                    {[
                                        { name: 'Single Word', value: queryComplexity?.singleWord || 0, color: '#94a3b8' },
                                        { name: 'Simple Phrase', value: queryComplexity?.simplePhrase || 0, color: '#60a5fa' },
                                        { name: 'Advanced Search', value: queryComplexity?.advancedSearch || 0, color: '#34d399' },
                                        { name: 'Natural Language', value: queryComplexity?.naturalLanguage || 0, color: '#a78bfa' },
                                    ].filter(d => d.value > 0).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => [value, 'Queries']} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Metric Cards */}
                    <div style={{ flex: '1', minWidth: '280px' }}>
                        <div className="metrics-grid">
                            <div className="metric-card">
                                <div className="metric-label">Single Word</div>
                                <div className="metric-value">{queryComplexity?.singleWord || 0}</div>
                                <div className="metric-trend">{queryComplexity?.percentages?.singleWord || 0}%</div>
                            </div>
                            <div className="metric-card">
                                <div className="metric-label">Simple Phrase</div>
                                <div className="metric-value">{queryComplexity?.simplePhrase || 0}</div>
                                <div className="metric-trend">{queryComplexity?.percentages?.simplePhrase || 0}%</div>
                            </div>
                            <div className="metric-card">
                                <div className="metric-label">Advanced Search</div>
                                <div className="metric-value">{queryComplexity?.advancedSearch || 0}</div>
                                <div className="metric-trend positive">{queryComplexity?.percentages?.advancedSearch || 0}%</div>
                            </div>
                            <div className="metric-card">
                                <div className="metric-label">Natural Language</div>
                                <div className="metric-value">{queryComplexity?.naturalLanguage || 0}</div>
                                <div className="metric-trend positive">{queryComplexity?.percentages?.naturalLanguage || 0}%</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Examples */}
                {queryComplexity?.examples && (
                    <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                        {queryComplexity.examples.singleWord?.length > 0 && (
                            <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>Single Word Examples</div>
                                {queryComplexity.examples.singleWord.slice(0, 3).map((q, i) => (
                                    <div key={i} style={{ fontSize: '13px', marginBottom: '4px' }}>"{q}"</div>
                                ))}
                            </div>
                        )}
                        {queryComplexity.examples.advancedSearch?.length > 0 && (
                            <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>Advanced Search Examples</div>
                                {queryComplexity.examples.advancedSearch.slice(0, 3).map((q, i) => (
                                    <div key={i} style={{ fontSize: '13px', marginBottom: '4px' }}>"{q}"</div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Intent Categories */}
            <div style={{ marginBottom: '32px' }}>
                <h4 style={{ marginBottom: '16px' }}>User Intent Categories</h4>
                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                    {/* Pie Chart */}
                    <div style={{ flex: '1', minWidth: '280px', height: '250px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Product Search', value: intentCategories?.productSearch || 0, color: '#6366f1' },
                                        { name: 'Location Query', value: intentCategories?.locationQuery || 0, color: '#22d3ee' },
                                        { name: 'Category Browse', value: intentCategories?.categoryBrowse || 0, color: '#f59e0b' },
                                        { name: 'Support Request', value: intentCategories?.supportRequest || 0, color: '#ef4444' },
                                    ].filter(d => d.value > 0)}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={2}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    labelLine={false}
                                >
                                    {[
                                        { name: 'Product Search', value: intentCategories?.productSearch || 0, color: '#6366f1' },
                                        { name: 'Location Query', value: intentCategories?.locationQuery || 0, color: '#22d3ee' },
                                        { name: 'Category Browse', value: intentCategories?.categoryBrowse || 0, color: '#f59e0b' },
                                        { name: 'Support Request', value: intentCategories?.supportRequest || 0, color: '#ef4444' },
                                    ].filter(d => d.value > 0).map((entry, index) => (
                                        <Cell key={`cell-intent-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => [value, 'Queries']} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Metric Cards */}
                    <div style={{ flex: '1', minWidth: '280px' }}>
                        <div className="metrics-grid">
                            <div className="metric-card">
                                <div className="metric-label">Product Search</div>
                                <div className="metric-value">{intentCategories?.productSearch || 0}</div>
                            </div>
                            <div className="metric-card">
                                <div className="metric-label">Location Query</div>
                                <div className="metric-value">{intentCategories?.locationQuery || 0}</div>
                            </div>
                            <div className="metric-card">
                                <div className="metric-label">Category Browse</div>
                                <div className="metric-value">{intentCategories?.categoryBrowse || 0}</div>
                            </div>
                            <div className="metric-card">
                                <div className="metric-label">Support Request</div>
                                <div className="metric-value" style={{ color: intentCategories?.supportRequest > 0 ? 'var(--color-warning-500)' : 'inherit' }}>
                                    {intentCategories?.supportRequest || 0}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Repeated Queries */}
            {repeatedQueries?.sessionsWithRepeats > 0 && (
                <div style={{ marginBottom: '32px' }}>
                    <h4 style={{ marginBottom: '16px' }}>Repeated Queries</h4>
                    <div className="metrics-grid" style={{ marginBottom: '16px' }}>
                        <div className="metric-card">
                            <div className="metric-label">Sessions with Repeats</div>
                            <div className="metric-value" style={{ color: 'var(--color-warning-500)' }}>{repeatedQueries.sessionsWithRepeats}</div>
                            <div className="metric-trend">{repeatedQueries.percentage}% of sessions</div>
                        </div>
                        <div className="metric-card">
                            <div className="metric-label">Total Repeat Queries</div>
                            <div className="metric-value">{repeatedQueries.totalRepeats}</div>
                        </div>
                    </div>
                    {repeatedQueries.examples?.length > 0 && (
                        <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '12px' }}>Examples of Repeated Queries</div>
                            {repeatedQueries.examples.slice(0, 5).map((ex, i) => (
                                <div key={i} style={{ fontSize: '13px', marginBottom: '8px', padding: '8px', background: 'var(--bg-primary)', borderRadius: '4px' }}>
                                    <strong>"{ex.query}"</strong> - repeated {ex.count}x in session
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Auto-Generated Insights */}
            {insights?.length > 0 && (
                <div>
                    <h4 style={{ marginBottom: '16px' }}>Key Insights</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {insights.map((insight, i) => (
                            <div
                                key={i}
                                style={{
                                    padding: '16px',
                                    background: insight.type === 'warning' ? 'rgba(245, 158, 11, 0.1)' :
                                        insight.type === 'positive' ? 'rgba(16, 185, 129, 0.1)' :
                                            'var(--bg-secondary)',
                                    borderRadius: '8px',
                                    borderLeft: `4px solid ${insight.type === 'warning' ? 'var(--color-warning-500)' :
                                        insight.type === 'positive' ? 'var(--color-success-500)' :
                                            'var(--color-primary-500)'
                                        }`
                                }}
                            >
                                <div style={{ fontWeight: 600, marginBottom: '8px' }}>
                                    {insight.type === 'warning' ? '⚠️' : insight.type === 'positive' ? '✅' : 'ℹ️'} {insight.title}
                                </div>
                                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                    {insight.message}
                                </div>
                                {insight.recommendation && (
                                    <div style={{ fontSize: '13px', color: 'var(--color-primary-600)' }}>
                                        💡 {insight.recommendation}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
