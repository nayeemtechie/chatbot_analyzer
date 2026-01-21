/**
 * Rule-Based Analyzer Service
 * Extracts metrics from chatbot transcripts without using LLM calls
 * This reduces API costs and provides instant computed metrics
 */

/**
 * Format a Date object or ISO string to human-readable format
 * @param {Date|string} date - Date to format
 * @param {boolean} includeTime - Whether to include time
 * @returns {string} - Formatted date string
 */
function formatTimestamp(date, includeTime = true) {
    if (!date) return null;

    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return null;

    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    };

    if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
    }

    return d.toLocaleDateString('en-US', options);
}

/**
 * Main function to extract all rule-based metrics from transcripts
 * @param {Array} transcripts - Array of parsed transcript objects
 * @returns {Object} - Computed metrics object
 */
export function extractRuleBasedMetrics(transcripts) {
    if (!transcripts || transcripts.length === 0) {
        return getEmptyMetrics();
    }

    const sessionOverview = extractSessionOverview(transcripts);
    const turnAnalysis = extractTurnAnalysis(transcripts);
    const queryAnalysis = extractQueryAnalysis(transcripts);
    const productInsights = extractProductInsights(transcripts);
    const botResponseAnalysis = extractBotResponseAnalysis(transcripts);
    const timePatterns = extractTimePatterns(transcripts);

    return {
        sessionOverview,
        turnAnalysis,
        queryAnalysis,
        productInsights,
        botResponseAnalysis,
        timePatterns,
        dataQualityNotes: {
            totalTranscriptsAnalyzed: transcripts.length,
            extractionMethod: 'rule-based',
            dataLimitations: [
                'No user engagement/click data available',
                'No conversion or purchase data',
                'Cannot determine user satisfaction',
            ],
        },
    };
}

/**
 * Return empty metrics structure
 */
function getEmptyMetrics() {
    return {
        sessionOverview: {
            totalSessions: 0,
            dateRange: { start: null, end: null, totalDays: 0 },
        },
        turnAnalysis: {
            singleTurnSessions: 0,
            multiTurnSessions: 0,
            avgTurnsPerSession: 0,
            maxTurnsInSession: 0,
        },
        queryAnalysis: {
            totalQueries: 0,
            uniqueQueries: [],
            queryLengthAnalysis: { singleWordQueries: 0, multiWordQueries: 0, avgWordsPerQuery: 0 },
            topSearchTerms: [],
        },
        productInsights: {
            totalProductsRecommended: 0,
            uniqueProductsRecommended: 0,
            topRecommendedProducts: [],
            styleAnalysis: { totalStyles: 0, topStyles: [] },
        },
        botResponseAnalysis: {
            sessionsWithResults: { count: 0, percentage: 0 },
            sessionsWithoutResults: { count: 0, percentage: 100 },
            avgProductsReturned: 0,
            clarifyingQuestions: { count: 0, examples: [] },
        },
        timePatterns: { busiestHour: null, busiestDay: null, hourlyDistribution: {} },
        dataQualityNotes: { totalTranscriptsAnalyzed: 0, extractionMethod: 'rule-based' },
    };
}

// ============================================================================
// SESSION OVERVIEW EXTRACTION
// ============================================================================

/**
 * Extract session overview metrics
 */
function extractSessionOverview(transcripts) {
    const timestamps = [];

    for (const transcript of transcripts) {
        // Extract timestamps from messages
        for (const msg of transcript.messages || []) {
            if (msg.timestamp) {
                const date = new Date(msg.timestamp);
                if (!isNaN(date.getTime())) {
                    timestamps.push(date);
                }
            }
        }

        // Check metadata for date range
        if (transcript.metadata?.dateRange) {
            if (transcript.metadata.dateRange.start) {
                const startDate = new Date(transcript.metadata.dateRange.start);
                if (!isNaN(startDate.getTime())) timestamps.push(startDate);
            }
            if (transcript.metadata.dateRange.end) {
                const endDate = new Date(transcript.metadata.dateRange.end);
                if (!isNaN(endDate.getTime())) timestamps.push(endDate);
            }
        }
    }

    let dateRange = { start: null, end: null, totalDays: 0 };

    if (timestamps.length > 0) {
        timestamps.sort((a, b) => a - b);
        const start = timestamps[0];
        const end = timestamps[timestamps.length - 1];
        const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

        dateRange = {
            start: formatTimestamp(start),
            end: formatTimestamp(end),
            startRaw: start.toISOString(),
            endRaw: end.toISOString(),
            totalDays: Math.max(1, totalDays),
        };
    }

    return {
        totalSessions: transcripts.length,
        dateRange,
    };
}

// ============================================================================
// TURN ANALYSIS EXTRACTION
// ============================================================================

/**
 * Extract turn analysis metrics
 */
function extractTurnAnalysis(transcripts) {
    let singleTurnSessions = 0;
    let multiTurnSessions = 0;
    let totalUserTurns = 0;
    let maxTurns = 0;

    for (const transcript of transcripts) {
        const userMessages = (transcript.messages || []).filter(m => m.role === 'user');
        const userTurnCount = userMessages.length;

        if (userTurnCount === 1) {
            singleTurnSessions++;
        } else if (userTurnCount > 1) {
            multiTurnSessions++;
        }

        totalUserTurns += userTurnCount;
        maxTurns = Math.max(maxTurns, userTurnCount);
    }

    return {
        singleTurnSessions,
        multiTurnSessions,
        avgTurnsPerSession: transcripts.length > 0
            ? parseFloat((totalUserTurns / transcripts.length).toFixed(2))
            : 0,
        maxTurnsInSession: maxTurns,
        totalUserMessages: totalUserTurns,
        totalBotMessages: transcripts.reduce(
            (sum, t) => sum + (t.messages || []).filter(m => m.role === 'bot').length,
            0
        ),
    };
}

// ============================================================================
// QUERY ANALYSIS EXTRACTION
// ============================================================================

/**
 * Extract query analysis metrics
 */
function extractQueryAnalysis(transcripts) {
    const allQueries = [];
    const queryFrequency = {};

    for (const transcript of transcripts) {
        for (const msg of transcript.messages || []) {
            if (msg.role === 'user' && msg.content) {
                const query = msg.content.trim();
                allQueries.push(query);

                const normalizedQuery = query.toLowerCase();
                queryFrequency[normalizedQuery] = queryFrequency[normalizedQuery] || {
                    query: query,
                    frequency: 0,
                };
                queryFrequency[normalizedQuery].frequency++;
            }
        }
    }

    // Sort by frequency and get unique queries
    const uniqueQueries = Object.values(queryFrequency)
        .sort((a, b) => b.frequency - a.frequency);

    // Query length analysis
    let singleWordQueries = 0;
    let multiWordQueries = 0;
    let totalWords = 0;

    for (const query of allQueries) {
        const wordCount = query.split(/\s+/).filter(w => w.length > 0).length;
        totalWords += wordCount;

        if (wordCount === 1) {
            singleWordQueries++;
        } else {
            multiWordQueries++;
        }
    }

    // Extract top search terms (individual words)
    const wordFrequency = {};
    const stopWords = new Set(['a', 'an', 'the', 'is', 'are', 'was', 'were', 'for', 'of', 'to', 'in', 'on', 'with', 'i', 'me', 'my', 'you', 'your', 'it', 'and', 'or', 'but', 'do', 'does', 'can', 'will', 'what', 'how', 'where', 'when', 'any', 'have', 'has']);

    for (const query of allQueries) {
        const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
        for (const word of words) {
            wordFrequency[word] = (wordFrequency[word] || 0) + 1;
        }
    }

    const topSearchTerms = Object.entries(wordFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([term, count]) => ({ term, count }));

    return {
        totalQueries: allQueries.length,
        uniqueQueryCount: uniqueQueries.length,
        uniqueQueries: uniqueQueries.slice(0, 50), // Limit to top 50
        allUniqueQueries: uniqueQueries, // Full list for detailed analysis
        queryLengthAnalysis: {
            singleWordQueries,
            multiWordQueries,
            avgWordsPerQuery: allQueries.length > 0
                ? parseFloat((totalWords / allQueries.length).toFixed(2))
                : 0,
        },
        topSearchTerms,
    };
}

// ============================================================================
// PRODUCT INSIGHTS EXTRACTION
// ============================================================================

/**
 * Extract product insights from RESULTS lines
 */
function extractProductInsights(transcripts) {
    const allProductIds = [];
    const productFrequency = {};
    const allStyles = [];
    const styleFrequency = {};
    const productToQueries = {};
    const styleToQueries = {};

    for (const transcript of transcripts) {
        // Get the user query for this session (first user message)
        const userQuery = (transcript.messages || [])
            .find(m => m.role === 'user')?.content || 'unknown';

        for (const msg of transcript.messages || []) {
            // Check if bot message has results attached
            if (msg.role === 'bot' && msg.results) {
                // Extract products
                if (msg.results.products) {
                    const flatProducts = flattenProducts(msg.results.products);
                    for (const productId of flatProducts) {
                        allProductIds.push(productId);
                        productFrequency[productId] = (productFrequency[productId] || 0) + 1;

                        if (!productToQueries[productId]) {
                            productToQueries[productId] = new Set();
                        }
                        productToQueries[productId].add(userQuery);
                    }
                }

                // Extract styles
                if (msg.results.styles) {
                    for (const style of msg.results.styles) {
                        if (style && style.trim()) {
                            const normalizedStyle = style.trim();
                            allStyles.push(normalizedStyle);
                            styleFrequency[normalizedStyle] = (styleFrequency[normalizedStyle] || 0) + 1;

                            if (!styleToQueries[normalizedStyle]) {
                                styleToQueries[normalizedStyle] = new Set();
                            }
                            styleToQueries[normalizedStyle].add(userQuery);
                        }
                    }
                }
            }
        }
    }

    // Build top recommended products
    const topRecommendedProducts = Object.entries(productFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([productId, frequency]) => ({
            productId,
            frequency,
            associatedQueries: Array.from(productToQueries[productId] || []),
        }));

    // Build top styles
    const topStyles = Object.entries(styleFrequency)
        .sort((a, b) => b[1] - a[1])
        .map(([style, frequency]) => ({
            style,
            frequency,
            exampleQueries: Array.from(styleToQueries[style] || []).slice(0, 5),
        }));

    // Get unique product IDs
    const uniqueProductIds = new Set(allProductIds);

    return {
        totalProductsRecommended: allProductIds.length,
        uniqueProductsRecommended: uniqueProductIds.size,
        topRecommendedProducts,
        allProductIds: Array.from(uniqueProductIds), // Full list of unique IDs
        styleAnalysis: {
            totalStyles: Object.keys(styleFrequency).length,
            totalStyleMentions: allStyles.length,
            topStyles,
            allStyles: Object.keys(styleFrequency),
        },
    };
}

/**
 * Flatten nested product arrays
 */
function flattenProducts(products) {
    const flat = [];

    function flatten(arr) {
        if (!Array.isArray(arr)) {
            if (arr && typeof arr === 'string') {
                flat.push(arr);
            }
            return;
        }

        for (const item of arr) {
            if (Array.isArray(item)) {
                flatten(item);
            } else if (item && typeof item === 'string') {
                flat.push(item);
            }
        }
    }

    flatten(products);
    return flat;
}

// ============================================================================
// BOT RESPONSE ANALYSIS
// ============================================================================

/**
 * Extract bot response analysis metrics
 */
function extractBotResponseAnalysis(transcripts) {
    let sessionsWithResults = 0;
    let sessionsWithoutResults = 0;
    let totalProductsInResults = 0;
    let resultsCount = 0;
    const clarifyingQuestions = [];

    // Debug: Log first transcript structure
    if (transcripts.length > 0) {
        const firstTranscript = transcripts[0];
        console.log('🔍 Analyzer - First transcript structure:', {
            id: firstTranscript.id,
            messageCount: firstTranscript.messages?.length,
            firstBotMessage: firstTranscript.messages?.find(m => m.role === 'bot'),
        });
        // Check if any message has results
        const msgWithResults = firstTranscript.messages?.find(m => m.results);
        console.log('🔍 Analyzer - Message with results in first transcript:', msgWithResults ? 'YES' : 'NO');
    }

    // Common patterns for clarifying questions
    const clarifyingPatterns = [
        /which\s+(location|state|city|area|option)/i,
        /would you like me to/i,
        /can you (tell|clarify|specify)/i,
        /what (type|kind|model|year)/i,
        /are you looking for/i,
        /do you (want|need|prefer)/i,
        /could you (be more specific|clarify)/i,
    ];

    for (const transcript of transcripts) {
        let hasResults = false;

        for (const msg of transcript.messages || []) {
            if (msg.role === 'bot') {
                // Check for results
                if (msg.results) {
                    hasResults = true;
                    if (msg.results.products) {
                        const products = flattenProducts(msg.results.products);
                        totalProductsInResults += products.length;
                        resultsCount++;
                    }
                }

                // Check for clarifying questions
                if (msg.content) {
                    for (const pattern of clarifyingPatterns) {
                        if (pattern.test(msg.content)) {
                            clarifyingQuestions.push({
                                content: msg.content.slice(0, 200),
                                sessionId: transcript.id,
                            });
                            break;
                        }
                    }
                }
            }
        }

        if (hasResults) {
            sessionsWithResults++;
        } else {
            sessionsWithoutResults++;
        }
    }

    const totalSessions = transcripts.length;

    return {
        sessionsWithResults: {
            count: sessionsWithResults,
            percentage: totalSessions > 0
                ? parseFloat(((sessionsWithResults / totalSessions) * 100).toFixed(1))
                : 0,
        },
        sessionsWithoutResults: {
            count: sessionsWithoutResults,
            percentage: totalSessions > 0
                ? parseFloat(((sessionsWithoutResults / totalSessions) * 100).toFixed(1))
                : 0,
        },
        avgProductsReturned: resultsCount > 0
            ? parseFloat((totalProductsInResults / resultsCount).toFixed(1))
            : 0,
        clarifyingQuestions: {
            count: clarifyingQuestions.length,
            examples: clarifyingQuestions.slice(0, 10),
        },
    };
}

// ============================================================================
// TIME PATTERNS EXTRACTION
// ============================================================================

/**
 * Extract time-based patterns
 */
function extractTimePatterns(transcripts) {
    const hourCounts = {};
    const dayCounts = {};
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    for (const transcript of transcripts) {
        // Get the first timestamp from the session
        const firstMessage = (transcript.messages || [])[0];
        if (firstMessage?.timestamp) {
            const date = new Date(firstMessage.timestamp);
            if (!isNaN(date.getTime())) {
                const hour = date.getHours();
                const day = dayNames[date.getDay()];

                hourCounts[hour] = (hourCounts[hour] || 0) + 1;
                dayCounts[day] = (dayCounts[day] || 0) + 1;
            }
        }
    }

    // Find busiest hour
    let busiestHour = null;
    let maxHourCount = 0;
    for (const [hour, count] of Object.entries(hourCounts)) {
        if (count > maxHourCount) {
            maxHourCount = count;
            busiestHour = parseInt(hour);
        }
    }

    // Find busiest day
    let busiestDay = null;
    let maxDayCount = 0;
    for (const [day, count] of Object.entries(dayCounts)) {
        if (count > maxDayCount) {
            maxDayCount = count;
            busiestDay = day;
        }
    }

    return {
        busiestHour: busiestHour !== null ? formatHour(busiestHour) : null,
        busiestDay,
        hourlyDistribution: hourCounts,
        dailyDistribution: dayCounts,
    };
}

/**
 * Format hour to human-readable range
 */
function formatHour(hour) {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    const nextHour = (hour + 1) % 24;
    const nextPeriod = nextHour >= 12 ? 'PM' : 'AM';
    const nextDisplayHour = nextHour % 12 || 12;
    return `${displayHour}:00 ${period} - ${nextDisplayHour}:00 ${nextPeriod}`;
}

// ============================================================================
// USER BEHAVIOR ANALYSIS
// ============================================================================

/**
 * Extract user behavior metrics - how users interact with the chatbot
 */
export function extractUserBehavior(transcripts) {
    if (!transcripts || transcripts.length === 0) {
        return getEmptyUserBehavior();
    }

    // Query complexity classification
    const queryComplexity = {
        singleWord: 0,        // "iPad"
        simplePhrase: 0,      // "find iPad"
        advancedSearch: 0,    // "iPad Pro 12.9 near Austin TX under $500"
        naturalLanguage: 0,   // "I'm looking for an iPad for my kids"
        examples: { singleWord: [], simplePhrase: [], advancedSearch: [], naturalLanguage: [] }
    };

    // Repeated queries detection
    const repeatedQueries = {
        sessionsWithRepeats: 0,
        totalRepeats: 0,
        examples: []
    };

    // Intent categorization
    const intentCategories = {
        productSearch: 0,     // Looking for a product
        locationQuery: 0,     // Near me, in Austin, etc.
        priceInquiry: 0,      // Price, cost, under $X
        supportRequest: 0,    // Help, issue, problem
        categoryBrowse: 0,    // Browsing categories
        specificItem: 0       // Specific model/SKU
    };

    // Pattern matchers
    const patterns = {
        location: /\b(near|in|at|around|close to|nearby)\s+(me|my|location|\w+,?\s*\w*)/i,
        price: /\b(price|cost|under|below|above|budget|\$\d+|cheap|expensive|affordable)/i,
        support: /\b(help|issue|problem|error|can'?t|unable|locked|not working|broken)/i,
        naturalLanguage: /\b(i'?m|i am|i want|i need|looking for|searching for|trying to find|do you have)/i,
        specificItem: /\b([A-Z]{2,}\s*[-]?\s*\d+|\d{4,}|model|sku|item\s*#)/i,
    };

    for (const transcript of transcripts) {
        const userMessages = (transcript.messages || []).filter(m => m.role === 'user');
        const sessionQueries = [];

        for (const msg of userMessages) {
            const query = msg.content?.trim() || '';
            if (!query) continue;

            sessionQueries.push(query.toLowerCase());
            const wordCount = query.split(/\s+/).filter(w => w.length > 0).length;

            // Classify query complexity
            if (wordCount === 1) {
                queryComplexity.singleWord++;
                if (queryComplexity.examples.singleWord.length < 5) {
                    queryComplexity.examples.singleWord.push(query);
                }
            } else if (patterns.naturalLanguage.test(query)) {
                queryComplexity.naturalLanguage++;
                if (queryComplexity.examples.naturalLanguage.length < 5) {
                    queryComplexity.examples.naturalLanguage.push(query);
                }
            } else if (wordCount >= 5 || (patterns.location.test(query) && patterns.price.test(query))) {
                queryComplexity.advancedSearch++;
                if (queryComplexity.examples.advancedSearch.length < 5) {
                    queryComplexity.examples.advancedSearch.push(query);
                }
            } else {
                queryComplexity.simplePhrase++;
                if (queryComplexity.examples.simplePhrase.length < 5) {
                    queryComplexity.examples.simplePhrase.push(query);
                }
            }

            // Classify intent
            if (patterns.support.test(query)) {
                intentCategories.supportRequest++;
            } else if (patterns.location.test(query)) {
                intentCategories.locationQuery++;
            }

            if (patterns.price.test(query)) {
                intentCategories.priceInquiry++;
            }

            if (patterns.specificItem.test(query)) {
                intentCategories.specificItem++;
            } else if (wordCount <= 2 && !patterns.location.test(query) && !patterns.support.test(query)) {
                intentCategories.categoryBrowse++;
            } else {
                intentCategories.productSearch++;
            }
        }

        // Check for repeated queries in same session
        const uniqueInSession = new Set(sessionQueries);
        if (sessionQueries.length > uniqueInSession.size) {
            repeatedQueries.sessionsWithRepeats++;
            const repeatCount = sessionQueries.length - uniqueInSession.size;
            repeatedQueries.totalRepeats += repeatCount;

            // Find the repeated query
            const seen = {};
            for (const q of sessionQueries) {
                seen[q] = (seen[q] || 0) + 1;
            }
            for (const [q, count] of Object.entries(seen)) {
                if (count > 1 && repeatedQueries.examples.length < 5) {
                    repeatedQueries.examples.push({
                        query: q,
                        count: count,
                        sessionId: transcript.id
                    });
                }
            }
        }
    }

    // Calculate totals for percentages
    const totalQueries = queryComplexity.singleWord + queryComplexity.simplePhrase +
        queryComplexity.advancedSearch + queryComplexity.naturalLanguage;

    return {
        queryComplexity: {
            ...queryComplexity,
            total: totalQueries,
            percentages: {
                singleWord: totalQueries > 0 ? Math.round((queryComplexity.singleWord / totalQueries) * 100) : 0,
                simplePhrase: totalQueries > 0 ? Math.round((queryComplexity.simplePhrase / totalQueries) * 100) : 0,
                advancedSearch: totalQueries > 0 ? Math.round((queryComplexity.advancedSearch / totalQueries) * 100) : 0,
                naturalLanguage: totalQueries > 0 ? Math.round((queryComplexity.naturalLanguage / totalQueries) * 100) : 0,
            }
        },
        repeatedQueries: {
            ...repeatedQueries,
            percentage: transcripts.length > 0
                ? Math.round((repeatedQueries.sessionsWithRepeats / transcripts.length) * 100)
                : 0
        },
        intentCategories,
        insights: generateBehaviorInsights(queryComplexity, repeatedQueries, intentCategories, totalQueries, transcripts.length)
    };
}

/**
 * Generate human-readable insights from behavior data
 */
function generateBehaviorInsights(complexity, repeats, intents, totalQueries, totalSessions) {
    const insights = [];

    // Query complexity insight
    const singleWordPct = totalQueries > 0 ? (complexity.singleWord / totalQueries) * 100 : 0;
    if (singleWordPct > 50) {
        insights.push({
            type: 'warning',
            title: 'Basic Search Behavior',
            message: `${Math.round(singleWordPct)}% of queries are single words. Users may not know the chatbot can handle complex searches.`,
            recommendation: 'Consider adding prompts like "Try: iPad Pro near Austin under $500"'
        });
    } else if (complexity.advancedSearch > complexity.singleWord) {
        insights.push({
            type: 'positive',
            title: 'Advanced Search Usage',
            message: 'Users are leveraging advanced search features with multi-criteria queries.',
            recommendation: 'Continue promoting complex search capabilities.'
        });
    }

    // Repeated queries insight
    if (repeats.sessionsWithRepeats > totalSessions * 0.1) {
        insights.push({
            type: 'warning',
            title: 'Query Repetition Detected',
            message: `${repeats.percentage}% of sessions have repeated queries, suggesting users aren't finding what they need.`,
            recommendation: 'Review bot responses for these repeated queries and improve clarity.'
        });
    }

    // Location queries insight
    if (intents.locationQuery > totalQueries * 0.2) {
        insights.push({
            type: 'info',
            title: 'Location-Based Searches Popular',
            message: `Many users include location in their searches.`,
            recommendation: 'Ensure location-based filtering is prominent in the UI.'
        });
    }

    // Support requests insight
    if (intents.supportRequest > 0) {
        insights.push({
            type: 'warning',
            title: 'Support Requests via Chatbot',
            message: `${intents.supportRequest} queries appear to be support requests, not product searches.`,
            recommendation: 'Consider adding a support handoff option for non-product queries.'
        });
    }

    return insights;
}

/**
 * Return empty user behavior structure
 */
function getEmptyUserBehavior() {
    return {
        queryComplexity: {
            singleWord: 0, simplePhrase: 0, advancedSearch: 0, naturalLanguage: 0,
            total: 0, percentages: { singleWord: 0, simplePhrase: 0, advancedSearch: 0, naturalLanguage: 0 },
            examples: { singleWord: [], simplePhrase: [], advancedSearch: [], naturalLanguage: [] }
        },
        repeatedQueries: { sessionsWithRepeats: 0, totalRepeats: 0, percentage: 0, examples: [] },
        intentCategories: { productSearch: 0, locationQuery: 0, priceInquiry: 0, supportRequest: 0, categoryBrowse: 0, specificItem: 0 },
        insights: []
    };
}

export default {
    extractRuleBasedMetrics,
    extractUserBehavior,
};
