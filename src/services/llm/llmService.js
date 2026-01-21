/**
 * LLM Service - Abstraction layer for multiple LLM providers
 */

import { LLM_PROVIDERS } from '../../utils/constants';

class LLMService {
    constructor() {
        this.provider = null;
        this.model = null;
        this.apiKey = null;
    }

    /**
     * Configure the LLM service
     */
    configure(provider, model, apiKey) {
        this.provider = provider;
        this.model = model;
        this.apiKey = apiKey;
    }

    /**
     * Test the connection to the LLM provider
     */
    async testConnection() {
        if (!this.apiKey) {
            throw new Error('API key not configured');
        }

        try {
            const response = await this.complete('Say "Connected" if you can read this.', {
                maxTokens: 10,
            });
            return response.includes('Connected') || response.length > 0;
        } catch (error) {
            throw new Error(`Connection failed: ${error.message}`);
        }
    }

    /**
     * Send a completion request to the LLM
     */
    async complete(prompt, options = {}) {
        if (!this.provider || !this.apiKey) {
            throw new Error('LLM service not configured');
        }

        const { maxTokens = 4096, temperature = 0.3 } = options;

        switch (this.provider) {
            case 'openai':
                return this.completeOpenAI(prompt, maxTokens, temperature);
            case 'gemini':
                return this.completeGemini(prompt, maxTokens, temperature);
            case 'perplexity':
                return this.completePerplexity(prompt, maxTokens, temperature);
            default:
                throw new Error(`Unknown provider: ${this.provider}`);
        }
    }

    /**
     * OpenAI completion
     */
    async completeOpenAI(prompt, maxTokens, temperature) {
        const response = await fetch(LLM_PROVIDERS.openai.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert chatbot analyst. Always respond with valid JSON when requested.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                max_tokens: maxTokens,
                temperature,
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    /**
     * Gemini completion
     */
    async completeGemini(prompt, maxTokens, temperature) {
        const url = `${LLM_PROVIDERS.gemini.endpoint}/${this.model}:generateContent?key=${this.apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: prompt,
                            },
                        ],
                    },
                ],
                generationConfig: {
                    temperature,
                    maxOutputTokens: maxTokens,
                },
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error?.message || `Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }

    /**
     * Perplexity completion
     */
    async completePerplexity(prompt, maxTokens, temperature) {
        const response = await fetch(LLM_PROVIDERS.perplexity.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert chatbot analyst. Always respond with valid JSON when requested.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                max_tokens: maxTokens,
                temperature,
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error?.message || `Perplexity API error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    /**
     * Stream completion (for real-time display)
     */
    async *streamComplete(prompt, options = {}) {
        if (!this.provider || !this.apiKey) {
            throw new Error('LLM service not configured');
        }

        const { maxTokens = 4096, temperature = 0.3 } = options;

        // Only OpenAI and Perplexity support streaming easily
        if (this.provider === 'openai') {
            yield* this.streamOpenAI(prompt, maxTokens, temperature);
        } else {
            // For non-streaming providers, yield the complete response
            const response = await this.complete(prompt, options);
            yield response;
        }
    }

    /**
     * OpenAI streaming
     */
    async *streamOpenAI(prompt, maxTokens, temperature) {
        const response = await fetch(LLM_PROVIDERS.openai.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert chatbot analyst. Always respond with valid JSON when requested.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                max_tokens: maxTokens,
                temperature,
                stream: true,
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') return;

                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices[0]?.delta?.content;
                        if (content) yield content;
                    } catch (e) {
                        // Ignore parse errors for incomplete chunks
                    }
                }
            }
        }
    }

    /**
     * Parse JSON response, handling potential markdown formatting
     */
    parseJsonResponse(response) {
        // Remove markdown code blocks if present
        let cleaned = response.trim();

        // Remove ```json ... ``` or ``` ... ```
        if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        }

        try {
            return JSON.parse(cleaned);
        } catch (error) {
            console.error('Failed to parse JSON response:', error);
            console.error('Response was:', cleaned);
            throw new Error('Failed to parse LLM response as JSON');
        }
    }

    /**
     * Estimate token count for a prompt
     */
    estimateTokens(text) {
        // Rough estimate: ~4 characters per token
        return Math.ceil((text || '').length / 4);
    }

    /**
     * Estimate cost based on provider and token count
     */
    estimateCost(inputTokens, outputTokens) {
        // Approximate costs per 1M tokens (as of 2024)
        const costs = {
            openai: {
                'gpt-4o': { input: 2.50, output: 10.00 },
                'gpt-4o-mini': { input: 0.15, output: 0.60 },
                'gpt-4-turbo': { input: 10.00, output: 30.00 },
            },
            gemini: {
                'gemini-1.5-pro': { input: 1.25, output: 5.00 },
                'gemini-1.5-flash': { input: 0.075, output: 0.30 },
                'gemini-2.0-flash-exp': { input: 0.075, output: 0.30 },
            },
            perplexity: {
                'llama-3.1-sonar-large-128k-online': { input: 1.00, output: 1.00 },
                'llama-3.1-sonar-small-128k-online': { input: 0.20, output: 0.20 },
                'llama-3.1-sonar-huge-128k-online': { input: 5.00, output: 5.00 },
            },
        };

        const providerCosts = costs[this.provider]?.[this.model];
        if (!providerCosts) return null;

        const inputCost = (inputTokens / 1_000_000) * providerCosts.input;
        const outputCost = (outputTokens / 1_000_000) * providerCosts.output;

        return {
            inputCost,
            outputCost,
            totalCost: inputCost + outputCost,
            currency: 'USD',
        };
    }
}

// Singleton instance
export const llmService = new LLMService();
export default llmService;
