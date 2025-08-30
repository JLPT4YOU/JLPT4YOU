import { NextResponse } from 'next/server'

const BASE_URL = process.env.NEXT_PUBLIC_JLPT_API_URL as string
const API_KEY = process.env.NEXT_PUBLIC_JLPT_API_KEY as string

export async function GET(req: Request) {
  try {
    const incoming = new URL(req.url)
    const target = new URL('/api/words/kanji-only', BASE_URL)
    incoming.searchParams.forEach((v, k) => target.searchParams.append(k, v))
    // Backward compat: map count -> limit for new endpoint
    const count = incoming.searchParams.get('count')
    if (count && !target.searchParams.has('limit')) {
      target.searchParams.set('limit', count)
      target.searchParams.delete('count')
    }

    const reqUrl = new URL(req.url)
    const defaultOrigin = `${reqUrl.protocol}//${reqUrl.host}`
    const origin = (req.headers.get('origin') || defaultOrigin).toString()
    const referer = (req.headers.get('referer') || `${defaultOrigin}/`).toString()

    const headers: Record<string, string> = { 'X-API-Key': API_KEY }
    if (origin) headers['Origin'] = origin
    if (referer) headers['Referer'] = referer
    // Always use a safe browser UA to pass external API checks
    headers['User-Agent'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    headers['Accept'] = 'application/json'

    const res = await fetch(target.toString(), { headers })

    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Proxy error' }, { status: 500 })
  }
}

