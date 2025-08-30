import type { NextRequest } from 'next/server';

export const runtime = 'edge';

function buildUpstreamUrl(value: string) {
  const apiKey = process.env.TRACAU_API_KEY;
  if (!apiKey) {
    throw new Error('TRACAU_API_KEY environment variable is not set');
  }
  return `https://api.tracau.vn/${apiKey}/dj/${encodeURIComponent(value)}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const value = searchParams.get('value');
  if (!value) {
    return new Response(JSON.stringify({ error: 'Missing "value"' }), {
      status: 400,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }

  try {
    const upstreamUrl = buildUpstreamUrl(value);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    try {
    const res = await fetch(upstreamUrl, {
      signal: controller.signal,
      headers: { 'user-agent': 'jlpt4you-tracau-proxy/1.0' },
    });
    const text = await res.text();

    // Reflect origin for CORS (dev demo). We do not use credentials.
    const origin = req.headers.get('origin') || '*';

    return new Response(text, {
      status: res.status,
      headers: {
        'content-type': res.headers.get('content-type') || 'application/json; charset=utf-8',
        'cache-control': 's-maxage=86400, stale-while-revalidate=604800',
        'access-control-allow-origin': origin,
        'access-control-allow-methods': 'GET, OPTIONS',
      },
    });
  } catch (e) {
      return new Response(JSON.stringify({ error: 'Upstream fetch failed' }), {
        status: 502,
        headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' },
      });
    } finally {
      clearTimeout(timer);
    }
  } catch (configError) {
    return new Response(JSON.stringify({ error: 'Configuration error' }), {
      status: 500,
      headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' },
    });
  }
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin') || '*';
  return new Response(null, {
    status: 204,
    headers: {
      'access-control-allow-origin': origin,
      'access-control-allow-methods': 'GET, OPTIONS',
      'access-control-allow-headers': 'Content-Type',
      'access-control-max-age': '86400',
    },
  });
}

