/**
 * Vercel Serverless Function for Google Search API
 */

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, num = 10, start = 1 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const apiKey = process.env.VITE_GOOGLE_SEARCH_API_KEY;
    const searchEngineId = process.env.VITE_GOOGLE_SEARCH_ENGINE_ID;

    if (!apiKey || !searchEngineId) {
      return res.status(500).json({ error: 'Google Search API not configured' });
    }

    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&num=${num}&start=${start}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return res.status(400).json({ error: data.error?.message || 'Google Search API error' });
    }

    return res.status(200).json({
      results: data.items || [],
      totalResults: data.searchInformation?.totalResults || 0,
      searchTime: data.searchInformation?.searchTime || 0,
      query,
    });

  } catch (error) {
    console.error('Google Search API Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}