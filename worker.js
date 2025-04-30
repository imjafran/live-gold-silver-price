/**
 * Cloudflare Worker for parsing gold and silver prices from BAJUS website
 * Optimized for low latency with caching
 */

// Cache control constants
const CACHE_TIME = 60 * 60; // Cache for 1 hour (in seconds)
const CACHE_NAME = 'bajus-prices';

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // Set up CORS headers for cross-origin requests
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request for CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    // Try to get from cache first
    const cacheKey = new Request('https://www.bajus.org/gold-price', { method: 'GET' });
    const cache = caches.default;
    let response = await cache.match(cacheKey);

    if (!response) {
      // If not in cache, fetch fresh data
      const priceData = await fetchPriceData();
      
      // Create new response
      response = new Response(JSON.stringify(priceData, null, 0), {
        headers: {
          ...corsHeaders,
          'Cache-Control': `public, max-age=${CACHE_TIME}`,
        }
      });
      
      // Store in cache
      await cache.put(cacheKey, response.clone());
    }
    
    return response;
  } catch (error) {
    // Handle errors gracefully
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * Fetches and processes price data from the BAJUS website
 * @returns {Object} - Processed price data object
 */
async function fetchPriceData() {
  // Fetch the webpage content
  const response = await fetch('https://www.bajus.org/gold-price');
  
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status}`);
  }

  const html = await response.text();
  
  // Extract gold prices
  const goldPrices = extractPrices(html, 'gold-table');
  
  // Extract silver prices
  const silverPrices = extractPrices(html, 'silver-table');
  
  // Create response object
  return {
    timestamp: new Date().toISOString(),
    unit: 'BDT/GRAM',
    gold: goldPrices,
    silver: silverPrices
  };
}

/**
 * Extracts prices from HTML table
 * @param {string} html - The HTML content
 * @param {string} tableClass - The class of the table to extract from
 * @returns {Array} - Array of price objects
 */
function extractPrices(html, tableClass) {
  const results = [];
  
  // Find the table with the specified class
  const tableRegex = new RegExp(`<table class="[^"]*${tableClass}[^"]*"[^>]*>([\\s\\S]*?)<\\/table>`, 'i');
  const tableMatch = html.match(tableRegex);
  
  if (!tableMatch) return results;
  
  const tableContent = tableMatch[1];
  
  // Extract rows from the table body
  const rowRegex = /<tr>\s*<th[^>]*>\s*<h6>\s*([^<]*)\s*<\/h6>\s*<\/th>\s*<td[^>]*>\s*<p>([^<]*)<\/p>\s*<\/td>\s*<td[^>]*>\s*<span[^>]*>([^<]*)<\/span>\s*<\/td>\s*<\/tr>/gi;
  
  let match;
  while ((match = rowRegex.exec(tableContent)) !== null) {
    const name = match[1].trim();
    const priceText = match[3].trim();
    
    // Extract numerical value
    const priceMatch = priceText.match(/(\d+(?:,\d+)*(?:\.\d+)?)/);
    
    if (priceMatch) {
      // Parse price value from string
      const price = parseFloat(priceMatch[1].replace(/,/g, ''));
      
      results.push({
        name,
        price
      });
    }
  }
  
  return results;
}
