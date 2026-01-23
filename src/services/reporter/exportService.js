/**
 * Export Service
 * Handle exporting analysis results to various formats
 */

import { downloadFile, formatDate } from '../../utils/helpers';

/**
 * Export results as JSON
 */
export function exportAsJson(results, filename = 'chatbot-analysis') {
    const content = JSON.stringify(results, null, 2);
    downloadFile(content, `${filename}.json`, 'application/json');
}

/**
 * Export results as Markdown
 */
export function exportAsMarkdown(results, filename = 'chatbot-analysis') {
    const md = generateMarkdownReport(results);
    downloadFile(md, `${filename}.md`, 'text/markdown');
}

/**
 * Export results as PDF (using browser print with styled pages)
 */
export function exportAsPdf(results, filename = 'chatbot-analysis') {
    const html = generateStyledPdfReport(results, filename);

    // Create a print-friendly HTML page
    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
}

/**
 * Generate styled PDF report with each section as a page
 */
function generateStyledPdfReport(results, filename = 'chatbot-analysis') {
    const analysis = results?.analysis || {};

    // New data-honest schema
    const sessionOverview = analysis.sessionOverview || {};
    const queryAnalysis = analysis.queryAnalysis || {};
    const botResponses = analysis.botResponseAnalysis || {};

    const issues = analysis.potentialIssues || [];
    const recs = analysis.recommendations || [];
    const dataQuality = analysis.dataQualityNotes || {};

    // Build pages HTML
    let html = `<!DOCTYPE html>
<html>
<head>
    <title>${filename}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #1e293b;
            background: #fff;
        }
        .page {
            page-break-after: always;
            padding: 40px;
            min-height: 100vh;
        }
        .page:last-child { page-break-after: auto; }
        .page-header {
            background: #82C8E5;
            margin: -40px -40px 30px -40px;
            padding: 20px 40px;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .page-header h1 {
            font-size: 24px;
            font-weight: 600;
            color: #1e293b;
        }
        .page-header .icon { font-size: 28px; }
        h2 { color: #334155; font-size: 18px; margin: 24px 0 12px; }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 16px;
            margin: 16px 0;
        }
        .metric-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 16px;
            text-align: center;
        }
        .metric-label { font-size: 12px; color: #64748b; margin-bottom: 4px; }
        .metric-value { font-size: 24px; font-weight: 700; color: #6366f1; }
        .metric-value.positive { color: #10b981; }
        .metric-value.warning { color: #f59e0b; }
        .badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
        }
        .badge-success { background: #dcfce7; color: #166534; }
        .badge-warning { background: #fef3c7; color: #92400e; }
        .badge-danger { background: #fee2e2; color: #991b1b; }
        .badge-primary { background: #e0e7ff; color: #3730a3; }
        .badge-neutral { background: #f1f5f9; color: #475569; }
        .item-card {
            background: #fff;
            border: 1px solid #e2e8f0;
            border-left: 4px solid #6366f1;
            border-radius: 8px;
            padding: 16px;
            margin: 12px 0;
        }
        .item-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 8px;
        }
        .item-number {
            background: #6366f1;
            color: white;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 600;
        }
        .item-title { font-weight: 600; color: #1e293b; }
        .item-desc { color: #64748b; font-size: 14px; margin-top: 8px; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        th, td { border: 1px solid #e2e8f0; padding: 10px 14px; text-align: left; font-size: 13px; }
        th { background: #f8fafc; font-weight: 600; color: #475569; }
        .evidence-box {
            background: #f8fafc;
            border-left: 3px solid #94a3b8;
            padding: 12px;
            margin: 8px 0;
            font-style: italic;
            font-size: 13px;
            color: #64748b;
        }
        .warning-box {
            background: linear-gradient(135deg, #fef3c7, #fde68a);
            border-left: 4px solid #f59e0b;
            padding: 16px;
            border-radius: 8px;
            margin: 16px 0;
        }
        @media print {
            .page { padding: 20px; }
            .page-header { margin: -20px -20px 20px -20px; padding: 15px 20px; }
        }
</style>
</head>
<body>`;

    // Page 1: Site Info
    const websiteContent = results?.businessContext?.websiteContent;
    html += `
    <div class="page">
        <div class="page-header">
            <span class="icon">🌐</span>
            <h1>Site Information</h1>
        </div>
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-label">Data Source</div>
                <div class="metric-value" style="font-size: 16px;">Jina AI Reader</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Website URL</div>
                <div class="metric-value" style="font-size: 14px; word-break: break-all;">${results?.websiteUrl || 'N/A'}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">AI Analysis</div>
                <div class="metric-value" style="font-size: 14px;">${results?.llmEnabled ? '✅ Enabled' : '❌ Disabled'}</div>
            </div>
        </div>`;

    if (websiteContent?.success) {
        html += `
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-label">Sitemap URLs</div>
                <div class="metric-value">${websiteContent.sitemap?.urls?.length || 0}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Categories Analyzed</div>
                <div class="metric-value">${websiteContent.categories?.length || 0}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Products Analyzed</div>
                <div class="metric-value">${websiteContent.products?.length || 0}</div>
            </div>
        </div>`;
    }
    html += `</div>`;

    // Page 2: Session Overview
    const timePatterns = sessionOverview.timePatterns || {};
    html += `
    <div class="page">
        <div class="page-header">
            <span class="icon">📊</span>
            <h1>Session Overview</h1>
        </div>
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-label">Total Sessions</div>
                <div class="metric-value positive">${sessionOverview.totalSessions || 'N/A'}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Date Range</div>
                <div class="metric-value" style="font-size: 16px;">
                    ${sessionOverview.dateRange?.start || 'N/A'} - ${sessionOverview.dateRange?.end || 'N/A'}
                </div>
            </div>
        </div>
        <h2>Turn Analysis</h2>
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-label">Single-Turn Sessions</div>
                <div class="metric-value">${sessionOverview.turnAnalysis?.singleTurnSessions || 0}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Multi-Turn Sessions</div>
                <div class="metric-value positive">${sessionOverview.turnAnalysis?.multiTurnSessions || 0}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Avg Turns/Session</div>
                <div class="metric-value">${sessionOverview.turnAnalysis?.avgTurnsPerSession || 'N/A'}</div>
            </div>
        </div>`;

    // Time Patterns
    if (timePatterns.busiestHour || timePatterns.busiestDay || timePatterns.busiestDate) {
        html += `
        <h2>Time Patterns</h2>
        <div class="metrics-grid">`;
        if (timePatterns.busiestDate) {
            html += `
            <div class="metric-card">
                <div class="metric-label">Busiest Date</div>
                <div class="metric-value" style="font-size: 16px;">${timePatterns.busiestDate}</div>
                <div style="font-size: 12px; color: #64748b;">${timePatterns.busiestDateCount || 0} sessions</div>
            </div>`;
        }
        if (timePatterns.busiestHour) {
            html += `
            <div class="metric-card">
                <div class="metric-label">Busiest Hour</div>
                <div class="metric-value" style="font-size: 16px;">${timePatterns.busiestHour}</div>
                <div style="font-size: 12px; color: #64748b;">${timePatterns.busiestHourCount || 0} sessions</div>
            </div>`;
        }
        if (timePatterns.busiestDay) {
            html += `
            <div class="metric-card">
                <div class="metric-label">Busiest Day</div>
                <div class="metric-value" style="font-size: 16px;">${timePatterns.busiestDay}</div>
                <div style="font-size: 12px; color: #64748b;">${timePatterns.busiestDayCount || 0} sessions</div>
            </div>`;
        }
        html += `</div>`;
    }
    html += `</div>`;

    // Page 2: Query Analysis
    html += `
    <div class="page">
        <div class="page-header">
            <span class="icon">🔍</span>
            <h1>Query Analysis</h1>
        </div>
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-label">Total Queries</div>
                <div class="metric-value">${queryAnalysis.totalQueries || 0}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Unique Queries</div>
                <div class="metric-value">${queryAnalysis.uniqueQueries || 0}</div>
            </div>
        </div>`;

    if (queryAnalysis.allUniqueQueries?.length > 0) {
        html += `
        <h2>Top Queries</h2>
        <table>
            <tr><th>Query</th><th>Count</th></tr>`;
        queryAnalysis.allUniqueQueries.slice(0, 15).forEach(q => {
            html += `<tr><td>${q.query || ''}</td><td style="text-align: center;">${q.frequency || 0}</td></tr>`;
        });
        html += `</table>`;
    }
    html += `</div>`;

    // Page 3: User Insights
    const userBehavior = analysis.userBehavior || {};
    const queryComplexity = userBehavior.queryComplexity || {};
    const intentCategories = userBehavior.intentCategories || {};
    const behaviorInsights = userBehavior.insights || [];

    html += `
    <div class="page">
        <div class="page-header">
            <span class="icon">👤</span>
            <h1>User Insights</h1>
        </div>
        <h2>Query Complexity</h2>
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-label">Single Word</div>
                <div class="metric-value">${queryComplexity.singleWord || 0}</div>
                <div style="font-size: 12px; color: #64748b;">${queryComplexity.percentages?.singleWord || 0}%</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Simple Phrase</div>
                <div class="metric-value">${queryComplexity.simplePhrase || 0}</div>
                <div style="font-size: 12px; color: #64748b;">${queryComplexity.percentages?.simplePhrase || 0}%</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Advanced Search</div>
                <div class="metric-value positive">${queryComplexity.advancedSearch || 0}</div>
                <div style="font-size: 12px; color: #64748b;">${queryComplexity.percentages?.advancedSearch || 0}%</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Natural Language</div>
                <div class="metric-value positive">${queryComplexity.naturalLanguage || 0}</div>
                <div style="font-size: 12px; color: #64748b;">${queryComplexity.percentages?.naturalLanguage || 0}%</div>
            </div>
        </div>
        <h2>Intent Categories</h2>
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-label">Product Search</div>
                <div class="metric-value">${intentCategories.productSearch || 0}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Location Query</div>
                <div class="metric-value">${intentCategories.locationQuery || 0}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Category Browse</div>
                <div class="metric-value">${intentCategories.categoryBrowse || 0}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Support Request</div>
                <div class="metric-value" style="color: ${intentCategories.supportRequest > 0 ? '#f59e0b' : '#6366f1'};">${intentCategories.supportRequest || 0}</div>
            </div>
        </div>`;

    // Repeated Queries section
    const repeatedQueries = userBehavior.repeatedQueries || {};
    if (repeatedQueries.sessionsWithRepeats > 0) {
        html += `
        <h2>Repeated Queries</h2>
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-label">Sessions with Repeats</div>
                <div class="metric-value warning">${repeatedQueries.sessionsWithRepeats}</div>
                <div style="font-size: 12px; color: #64748b;">${repeatedQueries.percentage || 0}% of sessions</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Total Repeat Queries</div>
                <div class="metric-value">${repeatedQueries.totalRepeats || 0}</div>
            </div>
        </div>`;
        if (repeatedQueries.examples?.length > 0) {
            html += `<div class="evidence-box">`;
            repeatedQueries.examples.slice(0, 5).forEach(ex => {
                html += `<div>"${ex.query}" - repeated ${ex.count}x</div>`;
            });
            html += `</div>`;
        }
    }

    if (behaviorInsights.length > 0) {
        html += `<h2>Key Insights</h2>`;
        behaviorInsights.forEach(insight => {
            html += `
            <div class="item-card" style="border-left-color: ${insight.type === 'warning' ? '#f59e0b' : insight.type === 'positive' ? '#10b981' : '#6366f1'};">
                <div class="item-header">
                    <span class="item-title">${insight.type === 'warning' ? '⚠️' : insight.type === 'positive' ? '✅' : 'ℹ️'} ${insight.title}</span>
                </div>
                <p style="font-size: 13px; color: #64748b; margin: 8px 0;">${insight.message}</p>
                ${insight.recommendation ? `<p style="font-size: 12px; color: #6366f1;">💡 ${insight.recommendation}</p>` : ''}
            </div>`;
        });
    }
    html += `</div>`;

    // Page 4: Issues & Recommendations
    html += `
    <div class="page">
        <div class="page-header">
            <span class="icon">⚠️</span>
            <h1>Issues and Recommendations</h1>
        </div>
        <p style="color: #64748b; font-size: 13px; margin-bottom: 16px;">
            Note: These are potential issues inferred from patterns. Without engagement data, impact cannot be confirmed.
        </p>`;

    if (issues.length > 0) {
        html += `<h2>Potential Issues (${issues.length})</h2>`;
        issues.slice(0, 5).forEach(issue => {
            html += `
            <div class="item-card" style="border-left-color: ${issue.severity === 'high' ? '#ef4444' : '#f59e0b'};">
                <div class="item-header">
                    <span class="item-title">${issue.issue || ''}</span>
                    <span class="badge ${issue.severity === 'high' ? 'badge-danger' : 'badge-warning'}">${issue.severity || ''}</span>
                </div>
            </div>`;
        });
    }

    if (recs.length > 0) {
        html += `<h2>Recommendations (${recs.length})</h2>`;
        recs.slice(0, 5).forEach((rec, i) => {
            html += `
            <div class="item-card">
                <div class="item-header">
                    <span class="item-number">${i + 1}</span>
                    <span class="item-title">${rec.title || ''}</span>
                    <span class="badge ${rec.effort === 'low' ? 'badge-success' : 'badge-warning'}">${rec.effort || ''} effort</span>
                </div>
                ${rec.action ? '<div class="item-desc">' + rec.action + '</div>' : ''}
            </div>`;
        });
    }

    html += `
    </div>
    <script>
        window.onload = function() {
            window.print();
        };
    </script>
</body>
</html>`;

    return html;
}

/**
 * Generate markdown report
 */
function generateMarkdownReport(results) {
    const analysis = results?.analysis || {};
    const overview = analysis.sessionOverview || {};
    const queries = analysis.queryAnalysis || {};
    const botResponses = analysis.botResponseAnalysis || {};
    const userBehavior = analysis.userBehavior || {};

    const issues = analysis.potentialIssues || [];
    const recs = analysis.recommendations || [];
    const dataQuality = analysis.dataQualityNotes || {};

    let md = '# Chatbot Transcript Analysis Report\n\n';

    md += '## Session Overview\n';
    md += `- **Total Sessions**: ${overview.totalSessions || 'N/A'}\n`;
    md += `- **Single-Turn Sessions**: ${overview.turnAnalysis?.singleTurnSessions || 0}\n`;
    md += `- **Multi-Turn Sessions**: ${overview.turnAnalysis?.multiTurnSessions || 0}\n\n`;

    md += '## Query Analysis\n';
    md += `- **Total Queries**: ${queries.totalQueries || 0}\n`;
    md += `- **Unique Queries**: ${queries.uniqueQueries || 0}\n\n`;

    // User Insights section
    const queryComplexity = userBehavior.queryComplexity || {};
    const intentCategories = userBehavior.intentCategories || {};
    const behaviorInsights = userBehavior.insights || [];

    md += '## User Insights\n\n';
    md += '### Query Complexity\n';
    md += `| Type | Count | Percentage |\n`;
    md += `|------|-------|------------|\n`;
    md += `| Single Word | ${queryComplexity.singleWord || 0} | ${queryComplexity.percentages?.singleWord || 0}% |\n`;
    md += `| Simple Phrase | ${queryComplexity.simplePhrase || 0} | ${queryComplexity.percentages?.simplePhrase || 0}% |\n`;
    md += `| Advanced Search | ${queryComplexity.advancedSearch || 0} | ${queryComplexity.percentages?.advancedSearch || 0}% |\n`;
    md += `| Natural Language | ${queryComplexity.naturalLanguage || 0} | ${queryComplexity.percentages?.naturalLanguage || 0}% |\n\n`;

    md += '### Intent Categories\n';
    md += `- **Product Search**: ${intentCategories.productSearch || 0}\n`;
    md += `- **Location Query**: ${intentCategories.locationQuery || 0}\n`;
    md += `- **Category Browse**: ${intentCategories.categoryBrowse || 0}\n`;
    md += `- **Support Request**: ${intentCategories.supportRequest || 0}\n\n`;

    if (behaviorInsights.length > 0) {
        md += '### Key Insights\n';
        behaviorInsights.forEach(insight => {
            const icon = insight.type === 'warning' ? '⚠️' : insight.type === 'positive' ? '✅' : 'ℹ️';
            md += `- ${icon} **${insight.title}**: ${insight.message}\n`;
            if (insight.recommendation) {
                md += `  - 💡 ${insight.recommendation}\n`;
            }
        });
        md += '\n';
    }

    if (issues.length > 0) {
        md += '## Potential Issues\n';
        issues.forEach(issue => {
            md += `- **${issue.issue}** (${issue.severity})\n`;
        });
        md += '\n';
    }

    if (recs.length > 0) {
        md += '## Recommendations\n';
        recs.forEach((rec, i) => {
            md += `${i + 1}. **${rec.title}** (${rec.effort} effort)\n`;
        });
        md += '\n';
    }

    if (dataQuality.dataLimitations?.length > 0) {
        md += '## Data Limitations\n';
        dataQuality.dataLimitations.forEach(lim => {
            md += `- ${lim}\n`;
        });
    }

    md += '\n---\n*Generated by Chatbot Analyzer*\n';

    return md;
}
