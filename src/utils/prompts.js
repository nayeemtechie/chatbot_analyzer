/**
 * LLM Prompts for Chatbot Analysis
 * These prompts are designed to extract actionable insights from chatbot transcripts
 */

/**
 * Domain inference prompt - Understand the business context from URL
 */
export function getDomainInferencePrompt(url, businessModel) {
  return `You are an expert eCommerce analyst. Based on the following website URL and business model, infer key business characteristics.

Website URL: ${url}
Business Model: ${businessModel.toUpperCase()}

Analyze and provide a JSON response with this structure:
{
  "industry": "The primary industry (e.g., Electronics, Fashion, Industrial Supplies, Food & Beverage)",
  "productComplexity": "simple | variant-based | spec-heavy",
  "productComplexityReason": "Brief explanation of why this complexity level",
  "typicalCustomerJourney": ["Step 1", "Step 2", "Step 3"],
  "expectedChatbotUseCases": [
    "Product discovery and recommendations",
    "Availability and delivery inquiries",
    "... other relevant use cases"
  ],
  "keyProductAttributes": ["Attribute 1", "Attribute 2"],
  "commonCustomerQuestions": ["Question 1", "Question 2"],
  "b2bSpecificConsiderations": "Only if B2B - bulk ordering, MOQ, account management etc.",
  "conversionFactors": ["Key factor 1", "Key factor 2"]
}

Respond ONLY with valid JSON, no markdown formatting.`;
}

/**
 * Intent discovery prompt - Extract and classify intents from transcripts
 */
export function getIntentDiscoveryPrompt(transcripts, domainContext) {
  const transcriptSample = transcripts.slice(0, 50); // Limit for token management

  return `You are an expert conversational AI analyst specializing in eCommerce chatbot optimization.

DOMAIN CONTEXT:
${JSON.stringify(domainContext, null, 2)}

CHATBOT TRANSCRIPTS:
${JSON.stringify(transcriptSample, null, 2)}

Analyze these transcripts and identify ALL user intents. For each intent, provide:

{
  "intents": [
    {
      "intentName": "Clear, action-oriented name (e.g., 'Check Product Availability')",
      "category": "One of: Product Discovery | Product Details | Availability & Delivery | Pricing & Offers | Returns & Warranty | Support & Help | Order Status | Compatibility | Bulk/B2B Inquiries | General Questions",
      "frequency": "high | medium | low",
      "exampleUtterances": ["Example 1", "Example 2", "Example 3"],
      "qualityScore": "effective | partial | ineffective",
      "qualityReason": "Why this score - based on user behavior after bot response",
      "coverageGaps": ["Missing information or capability 1", "Gap 2"],
      "improvementOpportunity": "Specific suggestion to improve handling"
    }
  ],
  "missingIntents": [
    {
      "intentName": "Intent the chatbot should handle but doesn't",
      "evidence": "User utterances that weren't properly handled",
      "priority": "high | medium | low",
      "recommendedResponses": ["How the bot should respond"]
    }
  ],
  "emergingIntents": [
    {
      "intentName": "New pattern that may need dedicated handling",
      "occurrences": 5,
      "examples": ["Example utterance"]
    }
  ],
  "overloadedIntents": [
    {
      "currentIntent": "Intent that's trying to do too much",
      "suggestedSplit": ["Sub-intent 1", "Sub-intent 2"]
    }
  ]
}

Respond ONLY with valid JSON.`;
}

/**
 * Response quality scoring prompt
 */
export function getResponseScoringPrompt(transcripts) {
  return `You are a chatbot quality analyst. Score the bot's response quality based on user behavior signals.

SCORING CRITERIA:
🟢 EFFECTIVE - User progresses: Makes a purchase decision, gets answer and moves on, expresses satisfaction
🟡 PARTIAL - User clarifies: Asks follow-up questions, rephrases query, seeks more details
🔴 INEFFECTIVE - User loops/exits: Repeats same question, expresses frustration, escalates to human, abandons conversation

TRANSCRIPTS:
${JSON.stringify(transcripts.slice(0, 30), null, 2)}

Analyze and provide:

{
  "overallScores": {
    "effective": 0.45,
    "partial": 0.35,
    "ineffective": 0.20
  },
  "conversationAnalysis": [
    {
      "conversationId": "id",
      "overallScore": "effective | partial | ineffective",
      "keyMoments": [
        {
          "turn": 3,
          "userMessage": "What user said",
          "botResponse": "What bot said",
          "score": "effective | partial | ineffective",
          "reason": "Why this score",
          "suggestion": "How to improve"
        }
      ],
      "outcome": "resolution | escalation | abandonment | purchase",
      "userSentiment": "positive | neutral | negative | frustrated"
    }
  ],
  "commonFailurePatterns": [
    {
      "pattern": "Description of common failure",
      "frequency": 15,
      "impact": "high | medium | low",
      "examples": ["Example 1"],
      "fix": "How to address this"
    }
  ]
}

Respond ONLY with valid JSON.`;
}

/**
 * Loop and friction detection prompt
 */
export function getFrictionDetectionPrompt(transcripts) {
  return `You are an expert in conversational UX. Detect loops, friction points, and context issues in these chatbot conversations.

DETECTION FOCUS:
- Repetitive loops: User asking same thing multiple times
- Lost context: Bot forgetting previous information
- Unnecessary clarifications: Bot asking questions it shouldn't
- Dead ends: Conversations going nowhere
- Frustration signals: User expressing annoyance

TRANSCRIPTS:
${JSON.stringify(transcripts.slice(0, 30), null, 2)}

Provide analysis:

{
  "frictionSummary": {
    "loopRate": 0.15,
    "contextLossRate": 0.10,
    "averageTurnsToResolution": 5.2,
    "frustrationRate": 0.08
  },
  "loops": [
    {
      "conversationId": "id",
      "loopType": "repetitive_question | clarification_loop | redirect_loop",
      "turnsInvolved": [2, 3, 4],
      "userFrustrationLevel": "low | medium | high",
      "rootCause": "Why this happened",
      "evidence": "Relevant transcript excerpt",
      "solution": "How to fix"
    }
  ],
  "contextIssues": [
    {
      "conversationId": "id",
      "issue": "What context was lost",
      "impact": "How it affected the conversation",
      "fix": "Recommended solution"
    }
  ],
  "deadEnds": [
    {
      "conversationId": "id",
      "lastUserMessage": "What user said before abandoning",
      "botResponse": "Unhelpful bot response",
      "missedOpportunity": "What should have happened"
    }
  ],
  "clarificationIssues": {
    "overAsking": [
      {
        "scenario": "When bot asks too many questions",
        "example": "Transcript excerpt",
        "betterApproach": "Suggested improvement"
      }
    ],
    "underAsking": [
      {
        "scenario": "When bot should ask but doesn't",
        "example": "Transcript excerpt",
        "clarifyingQuestionNeeded": "What to ask"
      }
    ]
  }
}

Respond ONLY with valid JSON.`;
}

/**
 * Knowledge gap detection prompt
 */
export function getKnowledgeGapPrompt(transcripts, domainContext) {
  return `You are a knowledge base analyst. Identify gaps in the chatbot's knowledge that prevent it from helping users effectively.

DOMAIN CONTEXT:
${JSON.stringify(domainContext, null, 2)}

TRANSCRIPTS:
${JSON.stringify(transcripts.slice(0, 30), null, 2)}

Identify knowledge gaps:

{
  "knowledgeGaps": [
    {
      "category": "Product Information | Policies | Procedures | FAQs | Technical Specs | Pricing | Delivery | Returns",
      "specificGap": "What information is missing",
      "evidence": ["User query that exposed the gap", "Bot's inadequate response"],
      "frequency": 10,
      "impact": "high | medium | low",
      "suggestedContent": "What information should be added to the knowledge base",
      "priority": 1
    }
  ],
  "faqsNeeded": [
    {
      "question": "Frequently asked question not well handled",
      "occurrences": 15,
      "currentResponse": "How bot currently handles it",
      "recommendedResponse": "Better response"
    }
  ],
  "productAttributeGaps": [
    {
      "attribute": "Missing product attribute or specification",
      "userQueries": ["How users ask about this"],
      "importance": "high | medium | low"
    }
  ],
  "policyGaps": [
    {
      "policy": "Return policy, warranty, shipping, etc.",
      "userConfusion": "What users are confused about",
      "clarificationNeeded": "What should be clearer"
    }
  ],
  "b2bSpecificGaps": [
    {
      "topic": "B2B-specific knowledge gap",
      "businessImpact": "How this affects B2B customers"
    }
  ]
}

Respond ONLY with valid JSON.`;
}

/**
 * Prompt optimization suggestions
 */
export function getPromptOptimizationPrompt(analysisResults, domainContext) {
  return `You are an expert prompt engineer for conversational AI. Based on the analysis results, suggest system prompt improvements.

DOMAIN CONTEXT:
${JSON.stringify(domainContext, null, 2)}

ANALYSIS RESULTS (Summary):
- Top Issues: ${JSON.stringify(analysisResults.topIssues || [])}
- Common Failures: ${JSON.stringify(analysisResults.commonFailures || [])}
- Missing Intents: ${JSON.stringify(analysisResults.missingIntents || [])}

Generate prompt optimization recommendations:

{
  "systemPromptIssues": [
    {
      "issue": "Identified weakness in current prompting",
      "evidence": "How this manifests in conversations",
      "impact": "high | medium | low"
    }
  ],
  "promptImprovements": [
    {
      "area": "Tone | Clarification | Knowledge | Guardrails | Flow | Personalization",
      "currentBehavior": "What the bot does now",
      "targetBehavior": "What it should do",
      "promptSnippet": "Actual prompt text to add or modify",
      "expectedOutcome": "How this will improve conversations"
    }
  ],
  "guardrailsNeeded": [
    {
      "risk": "Potential issue (hallucination, off-topic, etc.)",
      "guardrailPrompt": "Prompt text to prevent this"
    }
  ],
  "toneAdjustments": {
    "currentTone": "Description of current tone",
    "recommendedTone": "Better tone for this domain",
    "examples": {
      "before": "Example of current response style",
      "after": "Example of improved response style"
    }
  },
  "verbosityOptimization": {
    "currentAvgResponseLength": "Description",
    "recommendation": "shorter | same | longer",
    "reason": "Why this change"
  },
  "examplePromptTemplate": "A complete improved system prompt template incorporating all suggestions"
}

Respond ONLY with valid JSON.`;
}

/**
 * Recommendations generation prompt
 */
export function getRecommendationsPrompt(fullAnalysis, domainContext, businessModel) {
  return `You are a senior chatbot product manager. Generate a prioritized action plan based on the complete analysis.

BUSINESS CONTEXT:
- Business Model: ${businessModel.toUpperCase()}
- Domain: ${JSON.stringify(domainContext)}

COMPLETE ANALYSIS:
${JSON.stringify(fullAnalysis, null, 2)}

Generate prioritized recommendations:

{
  "executiveSummary": {
    "overallHealth": "healthy | needs-attention | critical",
    "healthScore": 72,
    "keyFindings": [
      "Finding 1 - one sentence",
      "Finding 2 - one sentence",
      "Finding 3 - one sentence"
    ],
    "topPriority": "The single most important thing to fix",
    "estimatedImpact": "Description of potential improvement"
  },
  "healthMetrics": {
    "resolutionRate": 0.65,
    "escalationRate": 0.12,
    "loopRate": 0.15,
    "userSatisfactionEstimate": 0.70,
    "averageConversationLength": 4.5,
    "abandonmentRate": 0.18
  },
  "recommendations": [
    {
      "id": 1,
      "title": "Clear, action-oriented title",
      "category": "prompt | training | knowledge | flow",
      "description": "What to do and why",
      "impact": "high | medium | low",
      "effort": "low | medium | high",
      "expectedOutcome": "Specific measurable improvement expected",
      "implementation": "Step-by-step how to implement",
      "priority": 1,
      "status": "recommended"
    }
  ],
  "quickWins": [
    {
      "action": "Easy fix that can be done immediately",
      "impact": "Expected result",
      "timeToImplement": "1 hour"
    }
  ],
  "trainingRecommendations": {
    "newIntentsToAdd": [
      {
        "intentName": "Name",
        "sampleUtterances": ["Utterance 1", "Utterance 2", "Utterance 3"],
        "suggestedResponses": ["Response template"]
      }
    ],
    "intentsToImprove": [
      {
        "intentName": "Name",
        "currentIssue": "What's wrong",
        "additionalUtterances": ["More training data"],
        "improvedResponses": ["Better responses"]
      }
    ]
  },
  "knowledgeBaseUpdates": [
    {
      "topic": "Topic to add/update",
      "content": "Suggested content",
      "priority": "high | medium | low"
    }
  ],
  "jiraReadyItems": [
    {
      "title": "JIRA ticket title",
      "type": "Task | Story | Bug",
      "description": "Ticket description",
      "acceptanceCriteria": ["Criterion 1", "Criterion 2"],
      "storyPoints": 3,
      "labels": ["chatbot", "improvement"]
    }
  ],
  "weeklyFocusAreas": {
    "week1": "Focus area for week 1",
    "week2": "Focus area for week 2",
    "week3": "Focus area for week 3",
    "week4": "Focus area for week 4"
  }
}

Respond ONLY with valid JSON.`;
}

/**
 * Generate the full analysis prompt (combined for efficiency with capable models)
 */
export function getFullAnalysisPrompt(transcripts, websiteUrl, businessModel, businessContext) {
  const transcriptSample = transcripts.slice(0, 100);

  // Get website content if available
  const websiteContentSection = businessContext.websiteContent?.success
    ? `
=== SCRAPED WEBSITE CONTENT ===
The following content was extracted from the website to help you understand their categories, products, and business:

${businessContext.websiteContent.summary || 'No summary available'}
`
    : '';

  // Additional context overrides - this takes priority
  // Detect if it's JSON and format accordingly
  let additionalContextOverride = '';
  if (businessContext.additionalContext) {
    let formattedContext = businessContext.additionalContext;
    let isJsonPrompt = false;

    // Try to detect and parse JSON
    try {
      const trimmed = businessContext.additionalContext.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        const parsed = JSON.parse(trimmed);
        isJsonPrompt = true;
        // Format JSON nicely for the LLM
        formattedContext = `[JSON PROMPT DETECTED]
The user has provided structured JSON instructions. Parse and follow these exactly:

\`\`\`json
${JSON.stringify(parsed, null, 2)}
\`\`\`

Key fields to extract and apply:
${Object.entries(parsed).map(([key, value]) => `- ${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`).join('\n')}`;
      }
    } catch (e) {
      // Not valid JSON, use as plain text
      isJsonPrompt = false;
    }

    additionalContextOverride = `
=== USER OVERRIDE INSTRUCTIONS (HIGHEST PRIORITY) ===
The following instructions from the user OVERRIDE any default behavior. Follow these exactly:
${isJsonPrompt ? '\n[This is a structured JSON prompt - parse all fields carefully]\n' : ''}
${formattedContext}

=== END USER OVERRIDE ===
`;
  }


  return `You are an expert eCommerce chatbot analyst. Perform a comprehensive analysis of these chatbot transcripts.

=== CRITICAL GROUNDING RULES (READ FIRST) ===
You MUST follow these rules strictly to avoid hallucinations:

1. **ONLY report what you can DIRECTLY observe** in the provided transcripts
2. **DO NOT invent or fabricate** any numbers, counts, percentages, or metrics
3. **If data is insufficient**, use null, "insufficient_data", or "not_observed"
4. **Every claim must have transcript evidence** - if you can't quote it, don't report it
5. **Use confidence labels for ALL findings**:
   - "observed" = Directly seen in transcript text (quote the evidence)
   - "inferred" = Logically derived from observed patterns (explain reasoning)
   - "assumed" = Based on domain knowledge, NOT transcript data (clearly mark as assumption)

6. **For metrics and counts**:
   - Only count what you can literally count in the transcripts
   - If you cannot count exactly, say "approximately X based on Y observed instances"
   - Never invent precise percentages or rates

7. **For recommendations**:
   - Only recommend fixes for problems you OBSERVED in transcripts
   - Do not recommend solutions for imagined problems

${additionalContextOverride}
=== BUSINESS CONTEXT ===
Website URL: ${websiteUrl}
Business Model: ${businessModel.toUpperCase()}
Business Goal: Enhance Product Discovery
Industry Override: ${businessContext.industry || 'Auto-detect from website'}
Geography: ${businessContext.geography || 'Not specified'}
${websiteContentSection}
=== TRANSCRIPTS (${transcripts.length} total, showing first ${transcriptSample.length}) ===
${JSON.stringify(transcriptSample, null, 2)}

=== ANALYSIS REQUIRED ===
Analyze ONLY based on the provided transcripts. 

CRITICAL: This transcript data contains ONLY:
- USER lines: The exact query the user typed
- AI lines: The chatbot's text response  
- RESULTS lines: Contains STYLES (style categories) and PRODUCTS (arrays of product IDs)

=== RESULTS LINE PARSING (VERY IMPORTANT) ===
Example RESULTS line:
RESULTS: STYLES: ['Adventure Ready', 'Trail King']; PRODUCTS [['27503-298992', '24331-789'], ['27352-163', '25370-1020']]

How to parse this:
- STYLES array: ['Adventure Ready', 'Trail King'] → 2 styles
- PRODUCTS nested arrays: [['27503-298992', '24331-789'], ['27352-163', '25370-1020']]
  → Flatten: ['27503-298992', '24331-789', '27352-163', '25370-1020'] → 4 product IDs
- Count EACH product ID appearance across ALL RESULTS lines
- Extract EACH style name from ALL RESULTS lines

For productInsights:
- totalProductsRecommended = sum of ALL product IDs across ALL RESULTS lines
- uniqueProductsRecommended = count of UNIQUE product IDs
- topRecommendedProducts = most frequently appearing product IDs
- styleAnalysis.totalStyles = count of UNIQUE style names
- styleAnalysis.topStyles = most frequently appearing style names

=== END RESULTS PARSING ===

- Timestamps: When each message occurred

You CANNOT determine from this data:
- Whether users clicked on results or purchased
- User satisfaction or frustration (no feedback signals)
- Whether the conversation was "successful" 
- Engagement metrics beyond turn counts

Focus your analysis on what IS observable.

{
  "sessionOverview": {
    "totalSessions": "EXACT count of sessions analyzed",
    "dateRange": {
      "start": "Earliest timestamp found",
      "end": "Latest timestamp found",
      "totalDays": "days between"
    },
    "turnAnalysis": {
      "singleTurnSessions": "count of sessions with exactly 1 user message",
      "multiTurnSessions": "count of sessions with 2+ user messages",
      "avgTurnsPerSession": "calculated average",
      "maxTurnsInSession": "highest turn count observed"
    },
    "timePatterns": {
      "busiestHour": "Hour with most sessions if determinable",
      "busiestDay": "Day of week if determinable"
    }
  },

  "queryAnalysis": {
    "overview": "Brief summary of what users are searching for",
    "totalQueries": "Total USER messages counted",
    "uniqueQueries": "Count of distinct queries",
    "allUniqueQueries": [
      {
        "query": "EXACT user query text copied verbatim",
        "frequency": "number of times this exact query appeared"
      }
    ],
    "queryCategories": [
      {
        "category": "Vehicle/Brand | Product Type | Style/Feature | Location | General",
        "count": "number of queries in this category",
        "percentage": "calculated from count",
        "examples": ["EXACT query 1", "EXACT query 2"]
      }
    ],
    "topSearchTerms": ["most common search term 1", "term 2", "term 3"],
    "queryLengthAnalysis": {
      "singleWordQueries": "count",
      "multiWordQueries": "count",
      "avgWordsPerQuery": "number"
    }
  },

  "botResponseAnalysis": {
    "overview": "How the chatbot responded to queries",
    "sessionsWithResults": {
      "count": "Sessions where RESULTS line appeared",
      "percentage": "calculated"
    },
    "sessionsWithoutResults": {
      "count": "Sessions with no RESULTS line",
      "percentage": "calculated"
    },
    "avgProductsReturned": "Average count of product IDs in RESULTS",
    "responsePatterns": [
      {
        "pattern": "Clarifying Question | Direct Results | No Results | Error",
        "count": "how many times this pattern occurred",
        "example": "EXACT AI response quote"
      }
    ],
    "clarifyingQuestions": {
      "count": "How often bot asked clarifying questions",
      "examples": ["EXACT question quote 1", "quote 2"]
    }
  },

  "productInsights": {
    "overview": "Summary of what products/styles are being recommended based on RESULTS lines",
    "totalProductsRecommended": "NUMBER - Count ALL product IDs from ALL RESULTS lines (e.g., if 37 sessions each have 30 products, total = 1110)",
    "uniqueProductsRecommended": "NUMBER - Count of DISTINCT product IDs after deduplication",
    "topRecommendedProducts": [
      {
        "productId": "Exact product ID string like '27503-298992'",
        "frequency": "NUMBER - how many times this ID appeared",
        "associatedQueries": ["user queries that resulted in this product"]
      }
    ],
    "styleAnalysis": {
      "totalStyles": "NUMBER - Count of UNIQUE style names across all RESULTS",
      "topStyles": [
        {
          "style": "Exact style name like 'Adventure Ready' or 'Government Fleet Utility'",
          "frequency": "NUMBER - how many times this style appeared",
          "exampleQueries": ["queries that triggered this style"]
        }
      ]
    }
  },

  "potentialIssues": [
    {
      "issue": "Description of potential issue",
      "type": "No Results | Ambiguous Query | Repeated Query | Very Short Session",
      "frequency": "How often observed",
      "evidence": "EXACT transcript quote",
      "caveat": "Why this is only a potential issue (no engagement data to confirm)",
      "severity": "high | medium | low"
    }
  ],

  "observations": {
    "patterns": [
      {
        "observation": "Pattern noticed in the data",
        "evidence": "Supporting data points",
        "businessRelevance": "Why this might matter"
      }
    ],
    "anomalies": [
      {
        "anomaly": "Unusual pattern or outlier",
        "details": "What makes it unusual"
      }
    ]
  },

  "recommendations": [
    {
      "id": "number",
      "title": "Clear recommendation",
      "rationale": "Why this is recommended based on observed data",
      "evidence": "Data supporting this recommendation",
      "action": "Specific action to take",
      "effort": "low | medium | high",
      "caveat": "Any limitations on this recommendation"
    }
  ],

  "dataQualityNotes": {
    "totalTranscriptsAnalyzed": "${transcriptSample.length}",
    "dataLimitations": [
      "No user engagement/click data available",
      "No conversion or purchase data",
      "Cannot determine user satisfaction"
    ],
    "whatWeCannotDetermine": [
      "Whether users found what they were looking for",
      "Actual resolution or success rates",
      "User frustration or satisfaction levels"
    ],
    "analysisConfidence": "Description of overall confidence in findings"
  }
}

FINAL REMINDERS:
- Only analyze what is ACTUALLY in the transcripts
- USER lines = user queries, AI lines = bot responses, RESULTS = products returned
- Do NOT invent engagement metrics, satisfaction scores, or resolution rates
- Every finding must quote actual transcript content
- If you cannot observe something, say so explicitly
- Focus on query patterns, product recommendations, and response patterns
- Respond ONLY with valid JSON, no markdown code blocks`;
}
