import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { provider, apiKey } = await request.json();

    if (!provider || !apiKey) {
      return NextResponse.json({ isValid: false, error: 'Missing provider or API key' }, { status: 400 });
    }

    let isValid = false;
    let reason: string | undefined;
    let statusCode: number | undefined;

    if (provider === 'gemini') {
      try {
        // 1) Quick validation: list models
        const listBases = [
          'https://generativelanguage.googleapis.com/v1',
          'https://generativelanguage.googleapis.com/v1beta'
        ];
        for (const base of listBases) {
          const listUrl = `${base}/models?key=${encodeURIComponent(apiKey)}`;
          const listResp = await fetch(listUrl);
          if (listResp.ok) {
            isValid = true;
            break;
          } else {
            statusCode = listResp.status;
            try {
              const j = await listResp.json();
              reason = j?.error?.message || reason;
            } catch {}
          }
        }

        // 2) Fallback: minimal generateContent call if list failed (some keys allow only generateContent)
        if (!isValid) {
          const models = [
            'gemini-1.5-flash',
            'gemini-1.5-flash-latest',
            'gemini-1.5-flash-8b',
            'gemini-1.5-pro'
          ];
          const payload = {
            contents: [
              {
                role: 'user',
                parts: [{ text: 'ping' }]
              }
            ]
          };
          for (const base of listBases) {
            for (const model of models) {
              const url = `${base}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
              const resp = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });
              if (resp.ok) {
                isValid = true;
                break;
              } else {
                statusCode = resp.status;
                try {
                  const j = await resp.json();
                  reason = j?.error?.message || reason;
                } catch {}
              }
            }
            if (isValid) break;
          }
        }
      } catch (e) {
        isValid = false;
        reason = 'Network error or blocked by restrictions';
      }
    } else if (provider === 'groq') {
      try {
        const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: [{ role: 'user', content: 'ping' }],
            max_tokens: 1,
            stream: false
          })
        });
        isValid = resp.ok;
        if (!resp.ok) {
          statusCode = resp.status;
          try {
            const j = await resp.json();
            reason = j?.error?.message || reason;
          } catch {}
        }
      } catch {
        isValid = false;
        reason = 'Network error';
      }
    } else {
      return NextResponse.json({ isValid: false, error: 'Unsupported provider' }, { status: 400 });
    }

    return NextResponse.json({ isValid, provider, statusCode, reason });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
    console.error('[VALIDATE API KEY] Error:', errorMessage);
    return NextResponse.json({ isValid: false, error: errorMessage }, { status: 500 });
  }
}

