import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { LLM_PROVIDERS } from '../../utils/constants';
import llmService from '../../services/llm/llmService';
import './ConfigPanel.css';

export default function ConfigPanel() {
    const { state, actions } = useApp();
    const { llmConfig } = state;

    const [showApiKey, setShowApiKey] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);

    const currentProvider = LLM_PROVIDERS[llmConfig.provider];

    // Auto-fix stale model selections (e.g., from old localStorage cache)
    useEffect(() => {
        if (currentProvider) {
            const modelExists = currentProvider.models.some(m => m.id === llmConfig.model);
            if (!modelExists && currentProvider.models.length > 0) {
                console.log(`⚠️ Model "${llmConfig.model}" not found in ${llmConfig.provider}, resetting to ${currentProvider.models[0].id}`);
                actions.setLLMConfig({ model: currentProvider.models[0].id, isConnected: false });
            }
        }
    }, [llmConfig.provider, llmConfig.model, currentProvider, actions]);

    const handleProviderChange = (e) => {
        const provider = e.target.value;
        const firstModel = LLM_PROVIDERS[provider]?.models[0]?.id || '';
        actions.setLLMConfig({
            provider,
            model: firstModel,
            isConnected: false
        });
        setTestResult(null);
    };

    const handleModelChange = (e) => {
        actions.setLLMConfig({ model: e.target.value, isConnected: false });
        setTestResult(null);
    };

    const handleApiKeyChange = (e) => {
        actions.setLLMConfig({ apiKey: e.target.value, isConnected: false });
        setTestResult(null);
    };

    const testConnection = async () => {
        if (!llmConfig.apiKey) {
            setTestResult({ success: false, message: 'Please enter an API key' });
            return;
        }

        setTesting(true);
        setTestResult(null);

        try {
            llmService.configure(llmConfig.provider, llmConfig.model, llmConfig.apiKey);
            await llmService.testConnection();
            setTestResult({ success: true, message: 'Connection successful!' });
            actions.setLLMConfig({ isConnected: true });
        } catch (error) {
            setTestResult({ success: false, message: error.message });
            actions.setLLMConfig({ isConnected: false });
        } finally {
            setTesting(false);
        }
    };

    return (
        <div className="config-panel">
            <div className="config-panel-header">
                <h2 className="config-panel-title">
                    <span className="config-panel-title-icon">⚙️</span>
                    LLM Configuration
                </h2>
                {llmConfig.isConnected && (
                    <span className="badge badge-success">Connected</span>
                )}
            </div>

            <div className="config-panel-body">
                <div className="config-row">
                    <div className="form-group">
                        <label className="form-label" htmlFor="provider">
                            LLM Provider
                        </label>
                        <select
                            id="provider"
                            className="form-select"
                            value={llmConfig.provider}
                            onChange={handleProviderChange}
                        >
                            {Object.values(LLM_PROVIDERS).map((provider) => (
                                <option key={provider.id} value={provider.id}>
                                    {provider.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="model">
                            Model
                        </label>
                        <select
                            id="model"
                            className="form-select"
                            value={llmConfig.model}
                            onChange={handleModelChange}
                        >
                            {currentProvider?.models.map((model) => (
                                <option key={model.id} value={model.id}>
                                    {model.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="apiKey">
                        API Key
                    </label>
                    <div className="api-key-input-wrapper">
                        <div className="api-key-input-group">
                            <input
                                id="apiKey"
                                type={showApiKey ? 'text' : 'password'}
                                className="form-input"
                                placeholder={`Enter your ${currentProvider?.name} API key`}
                                value={llmConfig.apiKey}
                                onChange={handleApiKeyChange}
                            />
                            <button
                                type="button"
                                className="api-key-toggle"
                                onClick={() => setShowApiKey(!showApiKey)}
                                aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
                            >
                                {showApiKey ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                        <button
                            className="btn btn-secondary test-connection-btn"
                            onClick={testConnection}
                            disabled={testing || !llmConfig.apiKey}
                        >
                            {testing ? (
                                <>
                                    <span className="spinner" />
                                    Testing...
                                </>
                            ) : (
                                'Test Connection'
                            )}
                        </button>
                    </div>
                    <p className="form-hint">
                        Your API key is stored locally in your browser and never sent to any server.
                    </p>
                </div>

                {testResult && (
                    <div className={`connection-status ${testResult.success ? 'success' : 'error'}`}>
                        <span>{testResult.success ? '✅' : '❌'}</span>
                        <span>{testResult.message}</span>
                    </div>
                )}

                <div className="config-security-note">
                    <span className="config-security-note-icon">🔒</span>
                    <span>
                        API keys are stored in your browser's local storage. For production use,
                        consider implementing a backend proxy to protect your API keys.
                    </span>
                </div>

                <div className="config-security-note config-privacy-note">
                    <span className="config-security-note-icon">🛡️</span>
                    <span>
                        <strong>Data Privacy:</strong> Your transcript data is sent directly to the LLM provider's API
                        and is <strong>not stored</strong> on any server. Per OpenAI/Anthropic/Google API policies,
                        data sent via API is <strong>not used for model training</strong>.
                    </span>
                </div>
            </div>
        </div>
    );
}
