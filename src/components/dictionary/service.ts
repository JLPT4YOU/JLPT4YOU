/*
 * Dictionary Service for TraCau (/dj only)
 * What: Build URL, fetch with timeout, and normalize response
 * Why: Isolate API details and make future changes easier
 */

export type DjResponse = {
  tratu?: Array<{
    fields?: {
      fulltext?: string;
      kinds?: string; // e.g. "je|"
      word?: string;
    };
  }>;
};

export type DjResult = {
  fulltext: string; // raw HTML from fields.fulltext
  word?: string;
};

export function buildDjUrl(value: string): string {
  // Always use local proxy to bypass CORS and hide API keys
  return `/api/tracau/dj?value=${encodeURIComponent(value)}`;
}

export async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(input, { ...init, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchDj(value: string, opts?: { timeoutMs?: number }): Promise<DjResult> {
  const url = buildDjUrl(value);
  const res = await fetchWithTimeout(url, {}, opts?.timeoutMs ?? 8000);
  if (!res.ok) {
    throw new Error(`TraCau /dj fetch failed: ${res.status} ${res.statusText}`);
  }
  const json = (await res.json()) as DjResponse;
  const fulltext = json?.tratu?.[0]?.fields?.fulltext ?? "";
  const word = json?.tratu?.[0]?.fields?.word;
  if (!fulltext) throw new Error("TraCau /dj empty fulltext");
  return { fulltext, word };
}

// Simple LRU in-memory cache for client side
export class LruCache<V> {
  private map = new Map<string, V>();
  constructor(private max = 200) {}
  get(key: string): V | undefined {
    const val = this.map.get(key);
    if (val !== undefined) {
      // refresh order
      this.map.delete(key);
      this.map.set(key, val);
    }
    return val;
  }
  set(key: string, val: V) {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, val);
    if (this.map.size > this.max) {
      const firstKey = this.map.keys().next().value;
      if (firstKey !== undefined) {
        this.map.delete(firstKey);
      }
    }
  }
}

export const djCache = new LruCache<DjResult>(200);

export async function lookupDjCached(value: string): Promise<DjResult> {
  const key = value.trim();
  if (!key) throw new Error("Empty query");
  const hit = djCache.get(key);
  if (hit) return hit;
  const data = await fetchDj(key);
  djCache.set(key, data);
  return data;
}

