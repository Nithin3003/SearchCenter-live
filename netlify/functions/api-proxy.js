/**
 * Netlify Function for API Proxy
 * Handles API requests that can't be proxied directly
 */

const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const { path, httpMethod, headers, body } = event;

  // Add CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'CORS preflight successful' }),
    };
  }

  try {
    // Extract API path and parameters
    const pathParts = path.replace('/api/', '').split('/');
    const apiType = pathParts[0];
    const apiPath = pathParts.slice(1).join('/');

    let response;

    // Route to appropriate service
    switch (apiType) {
      case 'search':
        response = await handleSearchRequest(apiPath, httpMethod, body, headers);
        break;
      case 'auth':
        response = await handleAuthRequest(apiPath, httpMethod, body, headers);
        break;
      case 'webhooks':
        response = await handleWebhookRequest(apiPath, httpMethod, body, headers);
        break;
      default:
        response = { error: 'API endpoint not found', status: 404 };
    }

    return {
      statusCode: response.status || 200,
      headers: {
        ...corsHeaders,
        ...response.headers,
      },
      body: JSON.stringify(response.data || response),
    };

  } catch (error) {
    console.error('API Proxy Error:', error);

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
    };
  }
};

async function handleSearchRequest(path, method, body, headers) {
  // Handle search-related API calls
  switch (path) {
    case 'google':
      return await proxyGoogleSearch(JSON.parse(body));
    case 'youtube':
      return await proxyYouTubeSearch(JSON.parse(body));
    default:
      return { error: 'Search endpoint not found', status: 404 };
  }
}

async function handleAuthRequest(path, method, body, headers) {
  // Handle authentication-related API calls
  switch (path) {
    case 'refresh':
      return { data: { message: 'Token refreshed' }, status: 200 };
    case 'verify':
      return { data: { valid: true }, status: 200 };
    default:
      return { error: 'Auth endpoint not found', status: 404 };
  }
}

async function handleWebhookRequest(path, method, body, headers) {
  // Handle webhook processing
  switch (path) {
    case 'razorpay':
      return await processRazorpayWebhook(JSON.parse(body), headers);
    case 'clerk':
      return await processClerkWebhook(JSON.parse(body), headers);
    default:
      return { error: 'Webhook endpoint not found', status: 404 };
  }
}

async function proxyGoogleSearch(searchData) {
  try {
    // This would call Google Search API
    const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

    if (!apiKey) {
      return { error: 'Google Search API key not configured', status: 500 };
    }

    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(searchData.q)}&num=${searchData.num || 10}`;

    const response = await fetch(url);
    const data = await response.json();

    return {
      data: {
        results: data.items || [],
        totalResults: data.searchInformation?.totalResults || 0,
        searchTime: data.searchInformation?.searchTime || 0
      },
      status: 200
    };
  } catch (error) {
    return { error: error.message, status: 500 };
  }
}

async function proxyYouTubeSearch(searchData) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
      return { error: 'YouTube API key not configured', status: 500 };
    }

    const url = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&part=snippet&q=${encodeURIComponent(searchData.q)}&maxResults=${searchData.maxResults || 10}`;

    const response = await fetch(url);
    const data = await response.json();

    return {
      data: {
        videos: data.items || [],
        totalResults: data.pageInfo?.totalResults || 0
      },
      status: 200
    };
  } catch (error) {
    return { error: error.message, status: 500 };
  }
}

async function processRazorpayWebhook(webhookData, headers) {
  try {
    // Verify webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const receivedSignature = headers['x-razorpay-signature'];

    // In production, verify signature here
    // This is a simplified implementation

    console.log('Razorpay Webhook:', webhookData);

    // Process webhook event
    switch (webhookData.event) {
      case 'payment.captured':
        // Handle successful payment
        return {
          data: { message: 'Payment processed successfully' },
          status: 200
        };
      case 'payment.failed':
        // Handle failed payment
        return {
          data: { message: 'Payment failed notification' },
          status: 200
        };
      default:
        return {
          data: { message: 'Webhook received' },
          status: 200
        };
    }
  } catch (error) {
    return { error: error.message, status: 500 };
  }
}

async function processClerkWebhook(webhookData, headers) {
  try {
    console.log('Clerk Webhook:', webhookData);

    // Process Clerk webhook events
    switch (webhookData.type) {
      case 'user.created':
        return {
          data: { message: 'User created webhook processed' },
          status: 200
        };
      case 'session.created':
        return {
          data: { message: 'Session created webhook processed' },
          status: 200
        };
      default:
        return {
          data: { message: 'Webhook received' },
          status: 200
        };
    }
  } catch (error) {
    return { error: error.message, status: 500 };
  }
}