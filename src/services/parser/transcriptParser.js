/**
 * Transcript Parser Service
 * Handles parsing of various transcript file formats
 */

import JSZip from 'jszip';
import { parseTranscriptContent, generateId } from '../../utils/helpers';

/**
 * Parse uploaded files into structured transcript data
 */
export async function parseUploadedFiles(files) {
    const results = [];

    for (const file of files) {
        try {
            if (file.name.endsWith('.zip')) {
                const zipResults = await parseZipFile(file);
                results.push(...zipResults);
            } else {
                const content = await readFileContent(file);
                const parsed = parseTranscriptContent(content, file.name);
                results.push({
                    filename: file.name,
                    transcripts: parsed,
                    error: null,
                });
            }
        } catch (error) {
            results.push({
                filename: file.name,
                transcripts: [],
                error: error.message,
            });
        }
    }

    return results;
}

/**
 * Read file content as text
 */
async function readFileContent(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

/**
 * Parse ZIP file containing transcripts
 */
async function parseZipFile(file) {
    const zip = new JSZip();
    const contents = await zip.loadAsync(file);
    const results = [];

    const fileEntries = Object.entries(contents.files).filter(
        ([name, entry]) => !entry.dir && (name.endsWith('.txt') || name.endsWith('.json'))
    );

    for (const [name, entry] of fileEntries) {
        try {
            const content = await entry.async('string');
            const parsed = parseTranscriptContent(content, name);
            results.push({
                filename: name,
                transcripts: parsed,
                error: null,
            });
        } catch (error) {
            results.push({
                filename: name,
                transcripts: [],
                error: error.message,
            });
        }
    }

    return results;
}

/**
 * Normalize transcripts to a standard format
 */
export function normalizeTranscripts(parsedResults) {
    const allTranscripts = [];

    for (const result of parsedResults) {
        if (result.error) continue;

        for (const transcript of result.transcripts) {
            // Ensure consistent structure
            const normalized = {
                id: transcript.id || generateId(),
                sourceFile: result.filename,
                messages: normalizeMessages(transcript.messages || []),
                metadata: {
                    ...transcript.metadata,
                    messageCount: transcript.messages?.length || 0,
                    hasEscalation: detectEscalation(transcript.messages || []),
                    hasOrder: detectOrder(transcript.messages || []),
                    userTurns: countUserTurns(transcript.messages || []),
                    botTurns: countBotTurns(transcript.messages || []),
                },
            };

            allTranscripts.push(normalized);
        }
    }

    return allTranscripts;
}

/**
 * Normalize message format
 */
function normalizeMessages(messages) {
    return messages.map((msg, index) => ({
        id: msg.id || `msg-${index}`,
        role: normalizeRole(msg.role || msg.sender || 'unknown'),
        content: msg.content || msg.text || msg.message || '',
        timestamp: msg.timestamp || null,
        // Preserve RESULTS data (STYLES, PRODUCTS) if present
        ...(msg.results && { results: msg.results }),
    }));
}

/**
 * Normalize role names
 */
function normalizeRole(role) {
    const userRoles = ['user', 'customer', 'human', 'visitor', 'client'];
    const botRoles = ['bot', 'assistant', 'agent', 'chatbot', 'ai', 'system'];

    const normalized = role.toLowerCase();

    if (userRoles.includes(normalized)) return 'user';
    if (botRoles.includes(normalized)) return 'bot';
    return 'unknown';
}

/**
 * Detect escalation in conversation
 */
function detectEscalation(messages) {
    const escalationPhrases = [
        'speak to a human',
        'speak to someone',
        'transfer me',
        'real person',
        'human agent',
        'customer service',
        'supervisor',
        'manager',
        'escalate',
        "can't help",
        "don't understand",
    ];

    const content = messages.map(m => (m.content || '').toLowerCase()).join(' ');
    return escalationPhrases.some(phrase => content.includes(phrase));
}

/**
 * Detect order-related conversation
 */
function detectOrder(messages) {
    const orderPhrases = [
        'order number',
        'order status',
        'tracking',
        'shipment',
        'delivery',
        'purchase',
        'bought',
        'ordered',
        'payment',
        'receipt',
    ];

    const content = messages.map(m => (m.content || '').toLowerCase()).join(' ');
    return orderPhrases.some(phrase => content.includes(phrase));
}

/**
 * Count user turns
 */
function countUserTurns(messages) {
    return messages.filter(m => normalizeRole(m.role || '') === 'user').length;
}

/**
 * Count bot turns
 */
function countBotTurns(messages) {
    return messages.filter(m => normalizeRole(m.role || '') === 'bot').length;
}

/**
 * Get transcript statistics
 */
export function getTranscriptStats(transcripts) {
    if (!transcripts || transcripts.length === 0) {
        return {
            totalConversations: 0,
            totalMessages: 0,
            avgMessagesPerConversation: 0,
            escalationRate: 0,
            avgUserTurns: 0,
            avgBotTurns: 0,
        };
    }

    const totalMessages = transcripts.reduce((sum, t) => sum + t.messages.length, 0);
    const escalations = transcripts.filter(t => t.metadata.hasEscalation).length;
    const userTurns = transcripts.reduce((sum, t) => sum + t.metadata.userTurns, 0);
    const botTurns = transcripts.reduce((sum, t) => sum + t.metadata.botTurns, 0);

    return {
        totalConversations: transcripts.length,
        totalMessages,
        avgMessagesPerConversation: (totalMessages / transcripts.length).toFixed(1),
        escalationRate: ((escalations / transcripts.length) * 100).toFixed(1),
        avgUserTurns: (userTurns / transcripts.length).toFixed(1),
        avgBotTurns: (botTurns / transcripts.length).toFixed(1),
    };
}
