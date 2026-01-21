/**
 * Website Scraper Service
 * Uses Jina AI Reader and sitemap parsing to extract website content
 */

const JINA_READER_URL = 'https://r.jina.ai/';

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
 */
export async function scrapeWebsite(websiteUrl, onProgress) {
    const results = {
        homepage: null,
        categories: [],
        products: [],
        sitemap: null,
        summary: null,
    };

    try {
        // Normalize URL
        const baseUrl = new URL(websiteUrl).origin;

        // Step 1: Fetch homepage
        onProgress?.('Fetching homepage...', 10);
        results.homepage = await fetchWithJinaReader(baseUrl);

        // Step 2: Try to fetch sitemap
        onProgress?.('Looking for sitemap...', 30);
        results.sitemap = await fetchSitemap(baseUrl);

        if (results.sitemap.success && results.sitemap.urls.length > 0) {
            // Step 3: Extract and fetch category pages
            onProgress?.('Analyzing category pages...', 50);
            const categoryUrls = extractCategoryUrls(results.sitemap.urls, 3);

            for (const url of categoryUrls) {
                const content = await fetchWithJinaReader(url);
                if (content.success) {
                    results.categories.push(content);
                }
            }

            // Step 4: Extract and fetch product pages
            onProgress?.('Analyzing product pages...', 70);
            const productUrls = extractProductUrls(results.sitemap.urls, 2);

            for (const url of productUrls) {
                const content = await fetchWithJinaReader(url);
                if (content.success) {
                    results.products.push(content);
                }
            }
        }

        // Step 5: Generate summary
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
