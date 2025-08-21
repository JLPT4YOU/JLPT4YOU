import { NextResponse } from 'next/server'

// Safe defaults so proxy still works on Vercel if envs are not set
const BASE_URL = (process.env.NEXT_PUBLIC_JLPT_API_URL as string) || 'https://jlpt-vocabulary-api-6jmc.vercel.app'
const API_KEY = (process.env.NEXT_PUBLIC_JLPT_API_KEY as string) || 'test_key'
const DEBUG = (process.env.NEXT_PUBLIC_ENABLE_DEBUG_LOGS || 'false') === 'true'

export async function GET(req: Request) {
  try {
    const incoming = new URL(req.url)
    const target = new URL('/api/words/kanji-only', BASE_URL)
    incoming.searchParams.forEach((v, k) => target.searchParams.append(k, v))
    // Support query auth if key exists (avoid sending empty key)
    if (API_KEY) target.searchParams.set('api_key', API_KEY)

    const reqUrl = new URL(req.url)
    const defaultOrigin = `${reqUrl.protocol}//${reqUrl.host}`
    const origin = (req.headers.get('origin') || defaultOrigin).toString()
    const referer = (req.headers.get('referer') || `${defaultOrigin}/`).toString()
    const ua = (req.headers.get('user-agent') || '').toString()

    const headers: Record<string, string> = { Accept: 'application/json' }
    if (API_KEY) headers['X-API-Key'] = API_KEY
    if (origin) headers['Origin'] = origin
    if (referer) headers['Referer'] = referer
    headers['User-Agent'] = ua || 'JLPT4YOU-NextProxy/1.0'

    const url = target.toString()
    const res = await fetch(url, { headers })

    // Enhanced debug logging on error
    if (!res.ok && DEBUG) {
      try {
        const text = await res.text()
        let parsed: any = null
        try { parsed = JSON.parse(text) } catch {}
        console.error('[JLPT Proxy][kanji-only] Error', { url, status: res.status, body: parsed || text?.slice?.(0, 500) })
        // Re-create a Response from the captured text
        const data = parsed || { raw: text }
        return NextResponse.json(data, { status: res.status })
      } catch (e) {
        console.error('[JLPT Proxy][kanji-only] Error (no body)', { url, status: res.status })
      }
    }

    // Normal path
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err: any) {
    if (DEBUG) console.error('[JLPT Proxy][kanji-only] Proxy exception', err)
    return NextResponse.json({ error: err?.message || 'Proxy error' }, { status: 500 })
  }
}
