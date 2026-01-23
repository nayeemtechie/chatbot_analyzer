// LLM Provider configurations
export const LLM_PROVIDERS = {
    openai: {
        id: 'openai',
        name: 'OpenAI',
        models: [
            { id: 'gpt-5-mini', name: 'GPT-5 Mini', maxTokens: 128000 },
            { id: 'gpt-4o', name: 'GPT-4o (Recommended)', maxTokens: 128000 },
            { id: 'gpt-4o-mini', name: 'GPT-4o Mini', maxTokens: 128000 },
            { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', maxTokens: 128000 },
        ],
        endpoint: 'https://api.openai.com/v1/chat/completions',
    },
    gemini: {
        id: 'gemini',
        name: 'Google Gemini',
        models: [
            { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Recommended)', maxTokens: 1000000 },
            { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', maxTokens: 1000000 },
            { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', maxTokens: 1000000 },
        ],
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    },
    perplexity: {
        id: 'perplexity',
        name: 'Perplexity',
        models: [
            { id: 'sonar', name: 'Sonar', maxTokens: 128000 },
        ],
        endpoint: 'https://api.perplexity.ai/chat/completions',
    },
};

// Business model types
export const BUSINESS_MODELS = {
    b2c: { id: 'b2c', name: 'B2C', description: 'Business to Consumer' },
    b2b: { id: 'b2b', name: 'B2B', description: 'Business to Business' },
};

// Analysis stages
export const ANALYSIS_STAGES = [
    { id: 'parsing', name: 'Parsing Transcripts', icon: '📄' },
    { id: 'domain', name: 'Analyzing Domain', icon: '🌐' },
    { id: 'intents', name: 'Discovering Intents', icon: '🎯' },
    { id: 'scoring', name: 'Scoring Responses', icon: '📊' },
    { id: 'friction', name: 'Detecting Issues', icon: '⚠️' },
    { id: 'recommendations', name: 'Generating Recommendations', icon: '💡' },
    { id: 'report', name: 'Compiling Report', icon: '📋' },
];

// Intent categories
export const INTENT_CATEGORIES = [
    'Product Discovery',
    'Product Details',
    'Availability & Delivery',
    'Pricing & Offers',
    'Returns & Warranty',
    'Support & Help',
    'Order Status',
    'Compatibility',
    'Bulk/B2B Inquiries',
    'General Questions',
];

// Response quality scores
export const QUALITY_SCORES = {
    effective: { label: 'Effective', color: 'success', icon: '🟢', description: 'User progresses' },
    partial: { label: 'Partial', color: 'warning', icon: '🟡', description: 'User clarifies' },
    ineffective: { label: 'Ineffective', color: 'danger', icon: '🔴', description: 'User loops/exits' },
};

// Recommendation categories
export const RECOMMENDATION_CATEGORIES = {
    prompt: { id: 'prompt', name: 'Prompt Change', icon: '✏️' },
    training: { id: 'training', name: 'Training Data', icon: '📚' },
    knowledge: { id: 'knowledge', name: 'Knowledge Base', icon: '📖' },
    flow: { id: 'flow', name: 'Conversation Flow', icon: '🔄' },
};

// Impact levels
export const IMPACT_LEVELS = {
    high: { label: 'High', color: 'danger' },
    medium: { label: 'Medium', color: 'warning' },
    low: { label: 'Low', color: 'success' },
};

// Effort levels
export const EFFORT_LEVELS = {
    low: { label: 'Low', color: 'success' },
    medium: { label: 'Medium', color: 'warning' },
    high: { label: 'High', color: 'danger' },
};

// Supported file types
export const SUPPORTED_FILE_TYPES = {
    'text/plain': ['.txt'],
    'application/json': ['.json'],
    'application/zip': ['.zip'],
};

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// Local storage keys
export const STORAGE_KEYS = {
    llmConfig: 'chatbot_analyzer_llm_config',
    analysisHistory: 'chatbot_analyzer_history',
    theme: 'chatbot_analyzer_theme',
    results: 'chatbot_analyzer_results',
    transcripts: 'chatbot_analyzer_transcripts',
    businessContext: 'chatbot_analyzer_business_context',
};

// Report sections (data-honest analysis)
export const REPORT_SECTIONS = [
    { id: 'siteInfo', name: 'Site Info', icon: '🌐' },
    { id: 'overview', name: 'Session Overview', icon: '📊' },
    { id: 'queries', name: 'Query Analysis', icon: '🔍' },
    { id: 'userInsights', name: 'User Insights', icon: '👤' },
    { id: 'issues', name: 'Issues & Recommendations', icon: '⚠️' },
];


