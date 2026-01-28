/**
 * Website Scraper Service
 * Uses Jina AI Reader and sitemap parsing to extract website content
 * Supports LLM-powered analysis for intelligent category/product extraction
 */

import { getSiteAnalysisPrompt, getUrlOnlySiteAnalysisPrompt } from '../../utils/prompts';

const JINA_READER_URL = 'https://r.jina.ai/';
const SITE_ANALYSIS_CACHE_KEY = 'chatbot_analyzer_site_analysis_cache';

/**
 * Get cached LLM site analysis results
 */
function getCachedSiteAnalysis(url) {
    try {
        const cached = sessionStorage.getItem(SITE_ANALYSIS_CACHE_KEY);
        if (cached) {
            const cache = JSON.parse(cached);
            // Normalize URL for comparison
            const normalizedUrl = new URL(url).origin;
            if (cache[normalizedUrl] && cache[normalizedUrl].timestamp) {
                // Cache valid for 1 hour
                const age = Date.now() - cache[normalizedUrl].timestamp;
                if (age < 3600000) {
                    console.log('Using cached LLM site analysis for:', normalizedUrl);
                    return cache[normalizedUrl].data;
                }
            }
        }
    } catch (e) {
        console.warn('Failed to read site analysis cache:', e);
    }
    return null;
}

/**
 * Store LLM site analysis results in cache
 */
function cacheSiteAnalysis(url, data) {
    try {
        const normalizedUrl = new URL(url).origin;
        let cache = {};
        const existing = sessionStorage.getItem(SITE_ANALYSIS_CACHE_KEY);
        if (existing) {
            cache = JSON.parse(existing);
        }
        cache[normalizedUrl] = {
            timestamp: Date.now(),
            data
        };
        sessionStorage.setItem(SITE_ANALYSIS_CACHE_KEY, JSON.stringify(cache));
        console.log('Cached LLM site analysis for:', normalizedUrl);
    } catch (e) {
        console.warn('Failed to cache site analysis:', e);
    }
}

/**
 * Analyze site content using LLM for intelligent extraction
 * Falls back to URL-only inference if rawContent is not available
 * @param {string} url - The website URL
 * @param {string|null} rawContent - Raw markdown content from Jina AI (optional)
 * @param {object} llmConfig - LLM configuration with apiKey, provider, model
 * @returns {object|null} - Structured site analysis or null on failure
 */
export async function analyzeSiteWithLLM(url, rawContent, llmConfig) {
    if (!llmConfig?.apiKey) {
        return null;
    }

    // Check cache first
    const cached = getCachedSiteAnalysis(url);
    if (cached) {
        return cached;
    }

    try {
        // Use content-based prompt if available, otherwise fall back to URL-only inference
        const isUrlOnly = !rawContent;
        const prompt = isUrlOnly
            ? getUrlOnlySiteAnalysisPrompt(url)
            : getSiteAnalysisPrompt(url, rawContent);

        console.log(isUrlOnly
            ? 'LLM analyzing site from URL only (Jina fetch failed)'
            : 'LLM analyzing site with content');

        // Determine API endpoint based on provider
        const provider = llmConfig.provider || 'openai';
        let apiUrl, headers, body;

        if (provider === 'openai' || provider === 'openai-compatible') {
            apiUrl = llmConfig.baseUrl || 'https://api.openai.com/v1/chat/completions';
            headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${llmConfig.apiKey}`
            };
            body = JSON.stringify({
                model: llmConfig.model || 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'You are an expert at analyzing website content and extracting structured business information. Always respond with valid JSON only.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.3,
                max_tokens: 2000
            });
        } else if (provider === 'anthropic') {
            apiUrl = 'https://api.anthropic.com/v1/messages';
            headers = {
                'Content-Type': 'application/json',
                'x-api-key': llmConfig.apiKey,
                'anthropic-version': '2023-06-01'
            };
            body = JSON.stringify({
                model: llmConfig.model || 'claude-3-haiku-20240307',
                max_tokens: 2000,
                messages: [
                    { role: 'user', content: prompt }
                ]
            });
        } else {
            console.warn('Unsupported LLM provider for site analysis:', provider);
            return null;
        }

        console.log('Analyzing site with LLM:', url);
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers,
            body
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('LLM API error:', response.status, errorText);
            return null;
        }

        const result = await response.json();

        // Extract content based on provider
        let content;
        if (provider === 'anthropic') {
            content = result.content?.[0]?.text;
        } else {
            content = result.choices?.[0]?.message?.content;
        }

        if (!content) {
            console.error('No content in LLM response');
            return null;
        }

        // Parse JSON response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('Could not extract JSON from LLM response');
            return null;
        }

        const analysis = JSON.parse(jsonMatch[0]);

        // Cache the result
        cacheSiteAnalysis(url, analysis);

        return analysis;
    } catch (error) {
        console.error('LLM site analysis failed:', error);
        return null;
    }
}

/**
 * Fetch page content using Jina AI Reader (converts to clean markdown)
 */
export async function fetchWithJinaReader(url) {
    try {
        const response = await fetch(JINA_READER_URL + encodeURIComponent(url), {
            headers: {
                'Accept': 'text/plain',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status}`);
        }

        const content = await response.text();
        return {
            url,
            content,
            success: true,
        };
    } catch (error) {
        console.error(`Error fetching ${url}:`, error);
        return {
            url,
            content: null,
            success: false,
            error: error.message,
        };
    }
}

/**
 * Fetch and parse sitemap.xml
 */
export async function fetchSitemap(baseUrl) {
    const sitemapUrls = [
        `${baseUrl}/sitemap.xml`,
        `${baseUrl}/sitemap_index.xml`,
        `${baseUrl}/sitemap/sitemap.xml`,
    ];

    for (const sitemapUrl of sitemapUrls) {
        try {
            // Use a CORS proxy for sitemap
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(sitemapUrl)}`;
            const response = await fetch(proxyUrl);

            if (!response.ok) continue;

            const xml = await response.text();
            if (!xml.includes('<urlset') && !xml.includes('<sitemapindex')) continue;

            const urls = parseSitemapXml(xml);
            if (urls.length > 0) {
                return {
                    success: true,
                    urls,
                    source: sitemapUrl,
                };
            }
        } catch (error) {
            console.log(`Sitemap not found at ${sitemapUrl}`);
        }
    }

    return {
        success: false,
        urls: [],
        error: 'No sitemap found',
    };
}

/**
 * Parse sitemap XML and extract URLs
 */
function parseSitemapXml(xml) {
    const urls = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');

    // Handle sitemap index (contains links to other sitemaps)
    const sitemapLocs = doc.querySelectorAll('sitemap > loc');
    if (sitemapLocs.length > 0) {
        sitemapLocs.forEach((loc) => {
            urls.push({ url: loc.textContent, type: 'sitemap' });
        });
    }

    // Handle regular sitemap URLs
    const urlLocs = doc.querySelectorAll('url > loc');
    urlLocs.forEach((loc) => {
        urls.push({ url: loc.textContent, type: 'page' });
    });

    return urls;
}

/**
 * Extract category/collection URLs from sitemap
 */
export function extractCategoryUrls(urls, limit = 5) {
    const categoryPatterns = [
        /\/collections?\//i,
        /\/categor(y|ies)\//i,
        /\/shop\//i,
        /\/products?\//i,
        /\/department/i,
    ];

    const categoryUrls = urls
        .filter((item) => item.type === 'page')
        .filter((item) => categoryPatterns.some((pattern) => pattern.test(item.url)))
        .slice(0, limit);

    return categoryUrls.map((item) => item.url);
}

/**
 * Extract product URLs from sitemap
 */
export function extractProductUrls(urls, limit = 3) {
    const productPatterns = [
        /\/products?\//i,
        /\/item\//i,
        /\/p\//i,
        /\/dp\//i,
    ];

    // Filter URLs that look like product pages (usually have more path segments)
    const productUrls = urls
        .filter((item) => item.type === 'page')
        .filter((item) => {
            const url = new URL(item.url);
            const pathSegments = url.pathname.split('/').filter(Boolean);
            return pathSegments.length >= 2 && productPatterns.some((pattern) => pattern.test(item.url));
        })
        .slice(0, limit);

    return productUrls.map((item) => item.url);
}

/**
 * Main function to scrape website content
 * @param {string} websiteUrl - URL to scrape
 * @param {function} onProgress - Progress callback
 * @param {object} llmConfig - Optional LLM configuration for intelligent extraction
 */
export async function scrapeWebsite(websiteUrl, onProgress, llmConfig = null) {
    const results = {
        homepage: null,
        categories: [],
        products: [],
        sitemap: null,
        summary: null,
        llmAnalysis: null, // New: LLM-extracted site analysis
    };

    try {
        // Normalize URL
        const baseUrl = new URL(websiteUrl).origin;

        // Step 1: Fetch homepage
        onProgress?.('Fetching homepage...', 10);
        results.homepage = await fetchWithJinaReader(baseUrl);

        // Step 2: If LLM is connected, analyze site with LLM
        // Works with content if available, falls back to URL-only inference if Jina failed
        if (llmConfig?.apiKey) {
            const hasContent = results.homepage?.success && results.homepage?.content;
            onProgress?.(hasContent
                ? 'Analyzing site with AI...'
                : 'Inferring site details from URL...', 25);

            results.llmAnalysis = await analyzeSiteWithLLM(
                baseUrl,
                hasContent ? results.homepage.content : null,
                llmConfig
            );

            if (results.llmAnalysis) {
                console.log('LLM site analysis completed:', results.llmAnalysis);
            }
        }

        // Step 3: Try to fetch sitemap
        onProgress?.('Looking for sitemap...', 35);
        results.sitemap = await fetchSitemap(baseUrl);

        if (results.sitemap.success && results.sitemap.urls.length > 0) {
            // Step 4: Extract and fetch category pages
            onProgress?.('Analyzing category pages...', 50);
            const categoryUrls = extractCategoryUrls(results.sitemap.urls, 3);

            for (const url of categoryUrls) {
                const content = await fetchWithJinaReader(url);
                if (content.success) {
                    results.categories.push(content);
                }
            }

            // Step 5: Extract and fetch product pages
            onProgress?.('Analyzing product pages...', 70);
            const productUrls = extractProductUrls(results.sitemap.urls, 2);

            for (const url of productUrls) {
                const content = await fetchWithJinaReader(url);
                if (content.success) {
                    results.products.push(content);
                }
            }
        } else if (results.homepage?.success) {
            // Fallback: Extract categories from homepage content
            onProgress?.('Extracting categories from homepage...', 50);
            const extracted = extractCategoriesFromContent(results.homepage.content);
            results.extractedCategories = extracted.categories;
            results.extractedLinks = extracted.links;
        }

        // Step 6: Generate summary
        onProgress?.('Generating summary...', 90);
        results.summary = generateWebsiteSummary(results);

        onProgress?.('Complete!', 100);
        return {
            success: true,
            ...results,
        };
    } catch (error) {
        console.error('Website scraping failed:', error);
        return {
            success: false,
            error: error.message,
            ...results,
        };
    }
}

/**
 * Extract categories from homepage markdown content
 */
function extractCategoriesFromContent(content) {
    const categories = [];
    const links = [];

    if (!content) return { categories, links };

    // Look for navigation links and category patterns
    const lines = content.split('\n');

    // Common category keywords to look for
    const categoryKeywords = [
        'shop', 'browse', 'categories', 'departments', 'collections',
        'products', 'auctions', 'deals', 'sales', 'surplus', 'equipment',
        'vehicles', 'electronics', 'machinery', 'industrial', 'commercial'
    ];

    // Words to exclude - these indicate it's NOT a real category
    const excludePatterns = [
        /^image\s*\d*/i,
        /logo/i,
        /icon/i,
        /banner/i,
        /header/i,
        /footer/i,
        /menu/i,
        /nav/i,
        /button/i,
        /close/i,
        /search/i,
        /sign\s*(in|up|out)/i,
        /login/i,
        /register/i,
        /cart/i,
        /account/i,
        /home$/i,
        /^\s*$/
    ];

    const isExcluded = (text) => {
        return excludePatterns.some(pattern => pattern.test(text));
    };

    for (const line of lines) {
        const lowerLine = line.toLowerCase();

        // Extract markdown links: [text](url)
        const linkMatches = line.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g);
        for (const match of linkMatches) {
            const linkText = match[1].trim();
            const linkUrl = match[2].trim();

            // Skip image references, logos, very short or nav items
            if (linkText.length > 2 && linkText.length < 50 && !isExcluded(linkText)) {
                // Only add meaningful links
                if (!linkUrl.includes('#') || linkUrl.length > 5) {
                    links.push({ text: linkText, url: linkUrl });
                }

                // If it looks like a category, add it
                if ((categoryKeywords.some(kw => lowerLine.includes(kw)) ||
                    /\/(category|shop|browse|collection|department|auction)/i.test(linkUrl)) &&
                    !isExcluded(linkText)) {
                    categories.push(linkText);
                }
            }
        }

        // Extract heading-based categories (## Category Name)
        const headingMatch = line.match(/^#{1,3}\s+(.+)$/);
        if (headingMatch) {
            const heading = headingMatch[1].trim();
            if (heading.length > 2 && heading.length < 60 && !isExcluded(heading)) {
                if (categoryKeywords.some(kw => heading.toLowerCase().includes(kw))) {
                    categories.push(heading);
                }
            }
        }
    }

    // Dedupe categories and filter final results
    const uniqueCategories = [...new Set(categories)].filter(c => !isExcluded(c));

    return {
        categories: uniqueCategories.slice(0, 20),
        links: links.filter(l => !isExcluded(l.text)).slice(0, 50)
    };
}

/**
 * Generate a summary of the scraped content for LLM consumption
 */
function generateWebsiteSummary(results) {
    const parts = [];

    if (results.homepage?.success) {
        // Extract first ~2000 chars of homepage (navigation, main content)
        const homepageContent = results.homepage.content.slice(0, 2000);
        parts.push(`## Homepage Content\n${homepageContent}`);
    }

    if (results.categories.length > 0) {
        parts.push(`## Category Pages (${results.categories.length} found)`);
        results.categories.forEach((cat) => {
            if (cat.success) {
                const excerpt = cat.content.slice(0, 1000);
                parts.push(`### ${cat.url}\n${excerpt}`);
            }
        });
    }

    if (results.products.length > 0) {
        parts.push(`## Product Pages (${results.products.length} found)`);
        results.products.forEach((prod) => {
            if (prod.success) {
                const excerpt = prod.content.slice(0, 800);
                parts.push(`### ${prod.url}\n${excerpt}`);
            }
        });
    }

    if (results.sitemap?.success) {
        const urlCount = results.sitemap.urls.length;
        parts.push(`## Site Structure\n- Sitemap found with ${urlCount} URLs`);
    }

    return parts.join('\n\n');
}

/**
 * Get a compact version for the LLM prompt
 */
export function getWebsiteContentForPrompt(scrapedData, maxLength = 8000) {
    if (!scrapedData?.success || !scrapedData?.summary) {
        return null;
    }

    let content = scrapedData.summary;

    // Truncate if too long
    if (content.length > maxLength) {
        content = content.slice(0, maxLength) + '\n\n[Content truncated...]';
    }

    return content;
}
