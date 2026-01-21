/**
 * Format file size to human readable string
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format date to locale string
 */
export function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Format percentage
 */
export function formatPercent(value, decimals = 1) {
    return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
}

/**
 * Generate unique ID
 */
export function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Debounce function
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Deep clone object
 */
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if string is valid URL
 */
export function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

/**
 * Extract domain from URL
 */
export function extractDomain(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace('www.', '');
    } catch (_) {
        return url;
    }
}

/**
 * Group array by key
 */
export function groupBy(array, key) {
    return array.reduce((result, item) => {
        const group = item[key];
        if (!result[group]) result[group] = [];
        result[group].push(item);
        return result;
    }, {});
}

/**
 * Calculate average of array
 */
export function average(arr) {
    if (!arr || arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

/**
 * Count occurrences in array
 */
export function countOccurrences(arr) {
    return arr.reduce((acc, val) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
    }, {});
}

/**
 * Sort array of objects by key
 */
export function sortBy(arr, key, order = 'asc') {
    return [...arr].sort((a, b) => {
        if (order === 'asc') {
            return a[key] > b[key] ? 1 : -1;
        }
        return a[key] < b[key] ? 1 : -1;
    });
}

/**
 * Sleep/delay utility
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
export async function retry(fn, maxRetries = 3, baseDelay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            const delay = baseDelay * Math.pow(2, i);
            await sleep(delay);
        }
    }
}

/**
 * Download file from blob
 */
export function downloadFile(content, filename, type = 'application/json') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Failed to copy:', err);
        return false;
    }
}

/**
 * Sanitize HTML (basic)
 */
export function sanitizeHtml(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
}

/**
 * Parse transcript content to structured format
 */
export function parseTranscriptContent(content, filename) {
    // Try JSON first
    try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
            return parsed.map((item, index) => ({
                id: item.session_id || item.id || `${filename}-${index}`,
                messages: item.messages || [item],
                metadata: {
                    timestamp: item.timestamp,
                    language: item.language,
                    escalated: item.escalation_flag,
                    hasOrder: item.order_flag,
                },
            }));
        }
        // Single object
        return [{
            id: parsed.session_id || parsed.id || filename,
            messages: parsed.messages || [parsed],
            metadata: {
                timestamp: parsed.timestamp,
                language: parsed.language,
                escalated: parsed.escalation_flag,
                hasOrder: parsed.order_flag,
            },
        }];
    } catch {
        // Parse as plain text
        return parseTextTranscript(content, filename);
    }
}

/**
 * Parse plain text transcript - supports multiple formats
 */
function parseTextTranscript(content, filename) {
    // Check if it's the timestamped format: [2026-01-09T05:09:10.591551+00:00] USER: message
    const timestampPattern = /\[(\d{4}-\d{2}-\d{2}T[\d:.]+\+[\d:]+)\]\s*(USER|AI|RESULTS|CONVERSATION STARTED)(?:\s*:\s*)?/i;

    if (timestampPattern.test(content)) {
        return parseTimestampedTranscript(content, filename);
    }

    // Fallback to original simple format parsing
    return parseSimpleTextTranscript(content, filename);
}

/**
 * Parse timestamped transcript format like:
 * [2026-01-09T05:09:10.591551+00:00] USER: message
 * [2026-01-09T05:09:15.201538+00:00] AI: response
 * [2026-01-09T05:09:15.201538+00:00] RESULTS: STYLES: [...]; PRODUCTS [...]
 */
function parseTimestampedTranscript(content, filename) {
    const lines = content.split('\n');
    const messages = [];
    let currentMessage = null;
    let sessionId = filename;
    let earliestTimestamp = null;
    let latestTimestamp = null;

    // Extract session ID from filename if it's in the format: session_UUID_transcript.txt
    const sessionIdMatch = filename.match(/session_([a-f0-9-]+)_transcript/i);
    if (sessionIdMatch) {
        sessionId = sessionIdMatch[1];
    }

    // Regex to match timestamped lines
    const linePattern = /^\[(\d{4}-\d{2}-\d{2}T[\d:.]+(?:\+[\d:]+)?)\]\s*(USER|AI|RESULTS|CONVERSATION STARTED)(?:\s*:\s*)?(.*)$/i;
    const separatorPattern = /^={10,}$/; // Line of equals signs

    for (const line of lines) {
        const trimmedLine = line.trim();

        // Skip separator lines
        if (separatorPattern.test(trimmedLine) || !trimmedLine) {
            continue;
        }

        const match = trimmedLine.match(linePattern);

        // Debug: check if line contains "RESULTS" but didn't match
        if (trimmedLine.includes('RESULTS') && !match) {
            console.warn('⚠️ RESULTS line not matching regex:', trimmedLine.substring(0, 150));
        }

        if (match) {
            // Save previous message if exists
            if (currentMessage) {
                messages.push(currentMessage);
            }

            const [, timestamp, role, content] = match;
            const parsedTimestamp = new Date(timestamp);

            // Track date range
            if (!earliestTimestamp || parsedTimestamp < earliestTimestamp) {
                earliestTimestamp = parsedTimestamp;
            }
            if (!latestTimestamp || parsedTimestamp > latestTimestamp) {
                latestTimestamp = parsedTimestamp;
            }

            const normalizedRole = role.toUpperCase();

            if (normalizedRole === 'CONVERSATION STARTED') {
                // Skip conversation started markers, just continue
                currentMessage = null;
                continue;
            }

            if (normalizedRole === 'RESULTS') {
                // Parse RESULTS as metadata for the previous AI message
                console.log('📦 RESULTS line detected:', content.substring(0, 100) + '...');
                if (messages.length > 0) {
                    const lastMessage = messages[messages.length - 1];
                    console.log('  Last message role:', lastMessage.role);
                    if (lastMessage.role === 'bot') {
                        lastMessage.results = parseResultsContent(content);
                        console.log('  ✅ Results attached:', lastMessage.results);
                    }
                }
                currentMessage = null;
                continue;
            }

            currentMessage = {
                role: normalizedRole === 'USER' ? 'user' : 'bot',
                content: content.trim(),
                timestamp: timestamp,
            };
        } else if (currentMessage && trimmedLine) {
            // Continuation of previous message
            currentMessage.content += ' ' + trimmedLine;
        }
    }

    // Don't forget the last message
    if (currentMessage) {
        messages.push(currentMessage);
    }

    // Return as single conversation
    return [{
        id: sessionId,
        messages: messages,
        metadata: {
            timestamp: earliestTimestamp?.toISOString() || null,
            dateRange: {
                start: earliestTimestamp?.toISOString() || null,
                end: latestTimestamp?.toISOString() || null,
            },
            sourceFile: filename,
            format: 'timestamped',
        },
    }];
}

/**
 * Parse RESULTS content: STYLES: [...]; PRODUCTS [[...]]
 */
function parseResultsContent(content) {
    const results = {};

    // Extract STYLES
    const stylesMatch = content.match(/STYLES:\s*\[([^\]]+)\]/i);
    if (stylesMatch) {
        results.styles = stylesMatch[1].split(',').map(s => s.trim().replace(/['"]/g, ''));
    }

    // Extract PRODUCTS (could be nested arrays)
    const productsMatch = content.match(/PRODUCTS\s*(\[[\s\S]*\])/i);
    if (productsMatch) {
        try {
            results.products = JSON.parse(productsMatch[1].replace(/'/g, '"'));
        } catch (e) {
            results.productsRaw = productsMatch[1];
        }
    }

    return results;
}

/**
 * Parse simple text format (original implementation)
 */
function parseSimpleTextTranscript(content, filename) {
    const lines = content.split('\n').filter(line => line.trim());
    const conversations = [];
    let currentConversation = { id: filename, messages: [], metadata: {} };

    for (const line of lines) {
        // Detect patterns like "User:", "Bot:", "Customer:", "Assistant:", etc.
        const userMatch = line.match(/^(user|customer|human|visitor)\s*[:\-]\s*(.+)/i);
        const botMatch = line.match(/^(bot|assistant|agent|chatbot|ai)\s*[:\-]\s*(.+)/i);
        const sessionMatch = line.match(/^(session|conversation)\s*[:\-]\s*(.+)/i);

        if (sessionMatch) {
            if (currentConversation.messages.length > 0) {
                conversations.push(currentConversation);
            }
            currentConversation = {
                id: sessionMatch[2].trim(),
                messages: [],
                metadata: {}
            };
        } else if (userMatch) {
            currentConversation.messages.push({
                role: 'user',
                content: userMatch[2].trim(),
            });
        } else if (botMatch) {
            currentConversation.messages.push({
                role: 'bot',
                content: botMatch[2].trim(),
            });
        } else if (line.trim() && currentConversation.messages.length > 0) {
            // Append to last message if no prefix
            const lastMsg = currentConversation.messages[currentConversation.messages.length - 1];
            lastMsg.content += ' ' + line.trim();
        }
    }

    if (currentConversation.messages.length > 0) {
        conversations.push(currentConversation);
    }

    return conversations.length > 0 ? conversations : [{
        id: filename,
        messages: [{ role: 'unknown', content }],
        metadata: {},
    }];
}


/**
 * Estimate token count (rough approximation)
 */
export function estimateTokens(text) {
    if (!text) return 0;
    // Rough estimate: ~4 characters per token for English
    return Math.ceil(text.length / 4);
}

/**
 * Format number with K/M suffix
 */
export function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}
