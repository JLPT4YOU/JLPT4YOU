import { NextResponse } from 'next/server'

const BASE_URL = process.env.NEXT_PUBLIC_JLPT_API_URL as string
const API_KEY = process.env.NEXT_PUBLIC_JLPT_API_KEY as string

export async function GET(req: Request) {
  try {
    const incoming = new URL(req.url)
    const target = new URL('/api/words', BASE_URL)
    incoming.searchParams.forEach((v, k) => target.searchParams.append(k, v))
    // Also support query auth method as per API docs (redundant with header but helps some gateways)
    target.searchParams.set('api_key', API_KEY)

    const origin = (req.headers.get('origin') || '').toString()
    const referer = (req.headers.get('referer') || '').toString()
    const ua = (req.headers.get('user-agent') || '').toString()

    const headers: Record<string, string> = { 'X-API-Key': API_KEY }
    if (origin) headers['Origin'] = origin
    if (referer) headers['Referer'] = referer
    headers['User-Agent'] = ua || 'JLPT4YOU-NextProxy/1.0'

    const res = await fetch(target.toString(), { headers })

    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Proxy error' }, { status: 500 })
  }
}

