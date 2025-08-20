import { NextRequest, NextResponse } from 'next/server';

const JDICT_API_BASE = 'https://api.jdict.net/api/v1';
const JDICT_STATIC_BASE = 'https://jdict.net';

// Cache configuration (in seconds)
const CACHE_TTL = {
  suggest: 60 * 5,        // 5 minutes for suggestions
  word: 60 * 60 * 24,     // 24 hours for word details
  grammar: 60 * 60 * 24,  // 24 hours for grammar details
  radicals: 60 * 60 * 24 * 7, // 7 days for radicals (rarely changes)
};

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/');
    const searchParams = request.nextUrl.searchParams.toString();
    
    // Determine which base URL to use
    let targetUrl: string;
    let cacheTTL: number;
    
    if (path === 'radicals') {
      // Special case for radicals - fetch from static file
      targetUrl = `${JDICT_STATIC_BASE}/radical.json`;
      cacheTTL = CACHE_TTL.radicals;
    } else {
      // Regular API endpoints
      targetUrl = `${JDICT_API_BASE}/${path}`;
      if (searchParams) {
        targetUrl += `?${searchParams}`;
      }
      
      // Determine cache TTL based on endpoint
      if (path.includes('suggest')) {
        cacheTTL = CACHE_TTL.suggest;
      } else if (path.includes('words')) {
        cacheTTL = CACHE_TTL.word;
      } else if (path.includes('grammars')) {
        cacheTTL = CACHE_TTL.grammar;
      } else {
        cacheTTL = 60 * 5; // Default 5 minutes
      }
    }
    
    // Fetch from upstream
    const response = await fetch(targetUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'JLPT4You/1.0',
      },
      // Add cache revalidation
      next: { revalidate: cacheTTL }
    });
    
    if (!response.ok) {
      throw new Error(`Upstream API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Return with CORS headers
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': `public, s-maxage=${cacheTTL}, stale-while-revalidate`,
      },
    });
    
  } catch (error: any) {
    console.error('Proxy error:', error);
    
    // Return error response
    return NextResponse.json(
      { 
        error: 'Proxy error',
        message: error.message || 'Failed to fetch from JDict API',
        timestamp: new Date().toISOString()
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache',
        }
      }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

