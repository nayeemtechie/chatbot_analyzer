import { createContext, useContext, useReducer, useEffect } from 'react';
import { STORAGE_KEYS, LLM_PROVIDERS } from '../utils/constants';

// Initial state
const initialState = {
    // Theme
    theme: 'light',

    // LLM Configuration
    llmConfig: {
        provider: 'openai',
        model: 'gpt-4o',
        apiKey: '',
        isConnected: false,
    },

    // Files
    uploadedFiles: [],
    parsedTranscripts: [],

    // Business context
    businessContext: {
        websiteUrl: '',
        businessModel: 'b2c',
        industry: '',
        geography: '',
        additionalContext: '',
        websiteContent: null, // Scraped website content
    },

    // Analysis state
    analysis: {
        isRunning: false,
        currentStage: null,
        progress: 0,
        error: null,
    },

    // Results
    results: null,

    // UI state
    activeTab: 'summary',
};

// Action types
const ActionTypes = {
    SET_THEME: 'SET_THEME',
    SET_LLM_CONFIG: 'SET_LLM_CONFIG',
    SET_UPLOADED_FILES: 'SET_UPLOADED_FILES',
    SET_PARSED_TRANSCRIPTS: 'SET_PARSED_TRANSCRIPTS',
    SET_BUSINESS_CONTEXT: 'SET_BUSINESS_CONTEXT',
    SET_ANALYSIS_STATE: 'SET_ANALYSIS_STATE',
    SET_RESULTS: 'SET_RESULTS',
    SET_ACTIVE_TAB: 'SET_ACTIVE_TAB',
    RESET_ANALYSIS: 'RESET_ANALYSIS',
};

// Reducer
function appReducer(state, action) {
    switch (action.type) {
        case ActionTypes.SET_THEME:
            return { ...state, theme: action.payload };

        case ActionTypes.SET_LLM_CONFIG:
            return { ...state, llmConfig: { ...state.llmConfig, ...action.payload } };

        case ActionTypes.SET_UPLOADED_FILES:
            return { ...state, uploadedFiles: action.payload };

        case ActionTypes.SET_PARSED_TRANSCRIPTS:
            return { ...state, parsedTranscripts: action.payload };

        case ActionTypes.SET_BUSINESS_CONTEXT:
            return { ...state, businessContext: { ...state.businessContext, ...action.payload } };

        case ActionTypes.SET_ANALYSIS_STATE:
            return { ...state, analysis: { ...state.analysis, ...action.payload } };

        case ActionTypes.SET_RESULTS:
            return { ...state, results: action.payload };

        case ActionTypes.SET_ACTIVE_TAB:
            return { ...state, activeTab: action.payload };

        case ActionTypes.RESET_ANALYSIS:
            return {
                ...state,
                analysis: initialState.analysis,
                results: null,
            };

        default:
            return state;
    }
}

// Context
const AppContext = createContext(null);

// Provider component
export function AppProvider({ children }) {
    const [state, dispatch] = useReducer(appReducer, initialState, (initial) => {
        // Load from localStorage/sessionStorage on init
        if (typeof window !== 'undefined') {
            // Theme
            const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
            if (savedTheme) {
                initial.theme = savedTheme;
            } else {
                // Check system preference
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                initial.theme = prefersDark ? 'dark' : 'light';
            }

            // LLM Config
            const savedConfig = localStorage.getItem(STORAGE_KEYS.llmConfig);
            if (savedConfig) {
                try {
                    const parsed = JSON.parse(savedConfig);
                    initial.llmConfig = { ...initial.llmConfig, ...parsed };
                } catch (e) {
                    console.error('Failed to parse saved LLM config:', e);
                }
            }

            // Clear session data on page load for fresh start
            sessionStorage.removeItem(STORAGE_KEYS.results);
            sessionStorage.removeItem(STORAGE_KEYS.transcripts);
            sessionStorage.removeItem(STORAGE_KEYS.businessContext);
        }
        return initial;
    });

    // Apply theme to document
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', state.theme);
        localStorage.setItem(STORAGE_KEYS.theme, state.theme);
    }, [state.theme]);

    // Save LLM config (except API key for security)
    useEffect(() => {
        const configToSave = {
            provider: state.llmConfig.provider,
            model: state.llmConfig.model,
        };
        localStorage.setItem(STORAGE_KEYS.llmConfig, JSON.stringify(configToSave));
    }, [state.llmConfig.provider, state.llmConfig.model]);

    // Save results to sessionStorage (survives HMR refresh)
    useEffect(() => {
        if (state.results) {
            try {
                sessionStorage.setItem(STORAGE_KEYS.results, JSON.stringify(state.results));
            } catch (e) {
                console.warn('Failed to save results to sessionStorage:', e);
            }
        }
    }, [state.results]);

    // Save transcripts to sessionStorage
    useEffect(() => {
        if (state.parsedTranscripts.length > 0) {
            try {
                sessionStorage.setItem(STORAGE_KEYS.transcripts, JSON.stringify(state.parsedTranscripts));
            } catch (e) {
                console.warn('Failed to save transcripts to sessionStorage:', e);
            }
        }
    }, [state.parsedTranscripts]);

    // Save business context to sessionStorage
    useEffect(() => {
        if (state.businessContext.websiteUrl) {
            try {
                sessionStorage.setItem(STORAGE_KEYS.businessContext, JSON.stringify(state.businessContext));
            } catch (e) {
                console.warn('Failed to save business context to sessionStorage:', e);
            }
        }
    }, [state.businessContext]);

    // Actions
    const actions = {
        setTheme: (theme) => dispatch({ type: ActionTypes.SET_THEME, payload: theme }),
        toggleTheme: () => dispatch({ type: ActionTypes.SET_THEME, payload: state.theme === 'light' ? 'dark' : 'light' }),

        setLLMConfig: (config) => dispatch({ type: ActionTypes.SET_LLM_CONFIG, payload: config }),

        setUploadedFiles: (files) => dispatch({ type: ActionTypes.SET_UPLOADED_FILES, payload: files }),
        addUploadedFiles: (files) => dispatch({ type: ActionTypes.SET_UPLOADED_FILES, payload: [...state.uploadedFiles, ...files] }),
        removeUploadedFile: (index) => {
            const newFiles = [...state.uploadedFiles];
            newFiles.splice(index, 1);
            dispatch({ type: ActionTypes.SET_UPLOADED_FILES, payload: newFiles });
        },

        setParsedTranscripts: (transcripts) => dispatch({ type: ActionTypes.SET_PARSED_TRANSCRIPTS, payload: transcripts }),

        setBusinessContext: (context) => dispatch({ type: ActionTypes.SET_BUSINESS_CONTEXT, payload: context }),

        setAnalysisState: (analysisState) => dispatch({ type: ActionTypes.SET_ANALYSIS_STATE, payload: analysisState }),
        startAnalysis: () => dispatch({ type: ActionTypes.SET_ANALYSIS_STATE, payload: { isRunning: true, progress: 0, error: null } }),
        updateProgress: (stage, progress) => dispatch({ type: ActionTypes.SET_ANALYSIS_STATE, payload: { currentStage: stage, progress } }),
        finishAnalysis: () => dispatch({ type: ActionTypes.SET_ANALYSIS_STATE, payload: { isRunning: false, progress: 100 } }),
        setAnalysisError: (error) => dispatch({ type: ActionTypes.SET_ANALYSIS_STATE, payload: { isRunning: false, error } }),

        setResults: (results) => dispatch({ type: ActionTypes.SET_RESULTS, payload: results }),

        setActiveTab: (tab) => dispatch({ type: ActionTypes.SET_ACTIVE_TAB, payload: tab }),

        resetAnalysis: () => dispatch({ type: ActionTypes.RESET_ANALYSIS }),
    };

    return (
        <AppContext.Provider value={{ state, actions }}>
            {children}
        </AppContext.Provider>
    );
}

// Hook
export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}

export default AppContext;
