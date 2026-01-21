/**
 * Analysis Engine
 * Orchestrates the complete chatbot transcript analysis
 * Uses hybrid approach: rule-based for data tabs, LLM for insights (optional)
 */

import llmService from '../llm/llmService';
import { getFullAnalysisPrompt } from '../../utils/prompts';
import { sleep } from '../../utils/helpers';
import { extractRuleBasedMetrics, extractUserBehavior } from './ruleBasedAnalyzer';

/**
 * Run the complete analysis pipeline
 * Hybrid approach: rule-based metrics (always) + LLM insights (optional)
 */
export async function runAnalysis(config) {
    const {
        transcripts,
        websiteUrl,
        businessModel,
        businessContext,
        llmConfig,  // Optional - if not provided, skip LLM analysis
        onProgress,
    } = config;

    const results = {
        timestamp: new Date().toISOString(),
        transcriptCount: transcripts.length,
        websiteUrl,
        businessModel,
        businessContext,
        llmEnabled: !!llmConfig,
    };

    try {
        // Stage 1: Parsing (already done, just update progress)
        onProgress?.('parsing', 10);
        await sleep(300);

        // Stage 2: Rule-based metrics extraction (FREE - no LLM needed)
        onProgress?.('metrics', 25);
        const ruleBasedMetrics = extractRuleBasedMetrics(transcripts);
        console.log('✅ Rule-based metrics extracted:', ruleBasedMetrics);

        // Stage 2b: User behavior analysis
        onProgress?.('behavior', 35);
        const userBehavior = extractUserBehavior(transcripts);
        console.log('✅ User behavior analyzed:', userBehavior);

        // Stage 3: LLM Analysis (optional - only if LLM is configured)
        let llmAnalysis = null;

        if (llmConfig) {
            onProgress?.('intents', 50);
            console.log('🤖 LLM configured, running AI analysis...');

            // Configure LLM service
            llmService.configure(llmConfig.provider, llmConfig.model, llmConfig.apiKey);

            const prompt = getFullAnalysisPrompt(
                transcripts,
                websiteUrl,
                businessModel,
                businessContext
            );

            onProgress?.('scoring', 70);

            const response = await llmService.complete(prompt, {
                maxTokens: 8000,
                temperature: 0.2,
            });

            onProgress?.('friction', 85);

            llmAnalysis = llmService.parseJsonResponse(response);
            console.log('✅ LLM analysis received:', llmAnalysis);
        } else {
            console.log('ℹ️ LLM not configured - skipping AI analysis, using rule-based metrics only');
            onProgress?.('scoring', 70);
        }

        onProgress?.('recommendations', 95);

        // Merge rule-based metrics with LLM analysis
        // Rule-based data takes priority for data tabs
        results.analysis = {
            // LLM-generated insights (Issues & Recommendations tab)
            // Empty if LLM was not configured
            potentialIssues: llmAnalysis?.potentialIssues || [],
            recommendations: llmAnalysis?.recommendations || [],
            observations: llmAnalysis?.observations || {},

            // Rule-based data (Session Overview tab)
            sessionOverview: {
                totalSessions: ruleBasedMetrics.sessionOverview.totalSessions,
                dateRange: ruleBasedMetrics.sessionOverview.dateRange,
                turnAnalysis: ruleBasedMetrics.turnAnalysis,
                timePatterns: ruleBasedMetrics.timePatterns,
            },

            // Rule-based data (Query Analysis tab)
            queryAnalysis: {
                totalQueries: ruleBasedMetrics.queryAnalysis.totalQueries,
                uniqueQueries: ruleBasedMetrics.queryAnalysis.uniqueQueryCount,
                allUniqueQueries: ruleBasedMetrics.queryAnalysis.allUniqueQueries,
                queryLengthAnalysis: ruleBasedMetrics.queryAnalysis.queryLengthAnalysis,
                // Top full queries (for "Top Searched Queries" section)
                topSearchedQueries: ruleBasedMetrics.queryAnalysis.allUniqueQueries.slice(0, 15),
            },

            // Rule-based data (Bot Responses tab)
            botResponseAnalysis: {
                sessionsWithResults: ruleBasedMetrics.botResponseAnalysis.sessionsWithResults,
                sessionsWithoutResults: ruleBasedMetrics.botResponseAnalysis.sessionsWithoutResults,
                avgProductsReturned: ruleBasedMetrics.botResponseAnalysis.avgProductsReturned,
                clarifyingQuestions: ruleBasedMetrics.botResponseAnalysis.clarifyingQuestions,
            },

            // User behavior analysis (User Insights tab)
            userBehavior,

            // Rule-based product data (kept for internal use)
            productInsights: ruleBasedMetrics.productInsights,

            // Data quality notes from rule-based extraction
            dataQualityNotes: ruleBasedMetrics.dataQualityNotes,
        };

        // Store raw metrics for debugging
        results.ruleBasedMetrics = ruleBasedMetrics;
        results.userBehavior = userBehavior;
        results.llmAnalysis = llmAnalysis;

        results.success = true;
        onProgress?.('complete', 100);

        return results;
    } catch (error) {
        console.error('Analysis failed:', error);
        results.success = false;
        results.error = error.message;
        throw error;
    }
}

/**
 * Get a summary of the analysis for display
 */
export function getAnalysisSummary(results) {
    if (!results?.analysis) return null;

    const { analysis } = results;

    return {
        health: analysis.executiveSummary?.overallHealth || 'unknown',
        healthScore: analysis.executiveSummary?.healthScore || 0,
        keyFindings: analysis.executiveSummary?.keyFindings || [],
        topPriority: analysis.executiveSummary?.topPriority || 'No priority identified',
        metrics: {
            resolutionRate: formatPercent(analysis.healthMetrics?.estimatedResolutionRate),
            escalationRate: formatPercent(analysis.healthMetrics?.escalationRate),
            loopRate: formatPercent(analysis.healthMetrics?.loopRate),
            frustration: formatPercent(analysis.healthMetrics?.frustrationIndicators),
        },
        intentCount: analysis.intentAnalysis?.discoveredIntents?.length || 0,
        issueCount: analysis.topFailures?.length || 0,
        recommendationCount: analysis.recommendations?.length || 0,
    };
}

function formatPercent(value) {
    if (value === undefined || value === null) return 'N/A';
    return `${(value * 100).toFixed(1)}%`;
}

/**
 * Get health score color
 */
export function getHealthColor(health) {
    switch (health) {
        case 'healthy':
            return 'success';
        case 'needs-attention':
            return 'warning';
        case 'critical':
            return 'danger';
        default:
            return 'neutral';
    }
}

/**
 * Get recommendations by category
 */
export function getRecommendationsByCategory(recommendations) {
    const categories = {
        prompt: [],
        training: [],
        knowledge: [],
        flow: [],
    };

    for (const rec of recommendations || []) {
        const category = rec.category?.toLowerCase() || 'other';
        if (categories[category]) {
            categories[category].push(rec);
        }
    }

    return categories;
}

/**
 * Sort recommendations by priority
 */
export function sortRecommendations(recommendations, sortBy = 'priority') {
    const sorted = [...(recommendations || [])];

    if (sortBy === 'priority') {
        sorted.sort((a, b) => (a.priority || 999) - (b.priority || 999));
    } else if (sortBy === 'impact') {
        const impactOrder = { high: 0, medium: 1, low: 2 };
        sorted.sort((a, b) =>
            (impactOrder[a.impact] ?? 3) - (impactOrder[b.impact] ?? 3)
        );
    } else if (sortBy === 'effort') {
        const effortOrder = { low: 0, medium: 1, high: 2 };
        sorted.sort((a, b) =>
            (effortOrder[a.effort] ?? 3) - (effortOrder[b.effort] ?? 3)
        );
    }

    return sorted;
}
