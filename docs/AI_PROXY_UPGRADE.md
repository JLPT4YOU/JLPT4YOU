# AI Proxy Security Upgrade Guide (2025-09-02)

This document describes the security refactor that moves all AI provider calls (Gemini, Groq) behind backend API routes so user API keys are never exposed to the client.

## Goals
- Eliminate any client-side handling of provider API keys.
- Proxy all AI traffic via our backend.
- Store per-user AI prompt configuration and language preferences on the server (Supabase) and apply them automatically to every chat.
- Provide a clear migration path and troubleshooting guide.

---

## What Changed (High-Level)
- Removed insecure decrypt endpoint that exposed keys to the browser.
- Added a secure chat proxy: client calls our API, backend reads user key from DB and calls Gemini/Groq.
- Added server-side key validation endpoint.
- Added endpoints to save/load user prompt config and AI language preferences to users.metadata.
- Added chat title generation endpoint (Gemini) with auto language detection.

---

## New API Endpoints

1) POST /api/ai-proxy/chat
- Purpose: Single entry point to chat with AI providers.
- Request body:
  {
    "provider": "gemini" | "groq",
    "messages": Array<{ role: 'user'|'assistant'|'system', content: string }>,
    "options": { model?: string, temperature?: number, stream?: boolean, ... }
  }
- Auth: Supabase session required.
- Behavior:
  - Loads user key from public.user_api_keys.
  - Loads users.metadata.promptConfig and language settings; composes system prompt as: Core iRIN + language instruction + user's custom prompt.
  - Calls provider using server-only SDK/HTTP. If stream=true, pipes back a text stream.

2) POST /api/ai-proxy/generate-title
- Purpose: Generate a short chat title based on the first user message.
- Request body: { firstMessage: string }
- Picks language by aiLanguage or auto-detect from firstMessage.

3) POST /api/ai-proxy/generate-prompt
- Purpose: Generate user-specific prompt text (without injecting Core iRIN).
- Request body: { preferredName, desiredTraits, personalInfo, additionalRequests }

4) GET/PUT /api/user/prompt
- Purpose: Persist and retrieve user prompt config and AI language preferences.
- GET returns: { promptConfig, customPrompt, aiLanguage, customAiLanguage }
- PUT accepts: { promptConfig, aiLanguage, customAiLanguage }

5) POST /api/user/keys/validate
- Purpose: Server-side API key validation for Gemini/Groq.
- Request body: { provider, apiKey }

---

## Data Model (Supabase)

- Table: public.user_api_keys
  - Columns: user_id (UUID), provider (text), api_key (text)

- Table: public.users
  - Column: metadata JSONB (required)
    - metadata.promptConfig: {
        preferredName: string,
        desiredTraits: string,
        personalInfo: string,
        additionalRequests: string,
        generatedPrompt: string
      }
    - metadata.customPrompt: string (compat fallback = promptConfig.generatedPrompt)
    - metadata.aiLanguage: 'auto' | 'vietnamese' | 'english' | 'japanese' | 'custom'
    - metadata.customAiLanguage: string

If your project uses a profiles table instead of public.users, adapt the endpoints accordingly.

### RLS Policies (if enabled)
- Ensure the logged-in user can SELECT and UPDATE only their own row:
  - SELECT USING (id = auth.uid())
  - UPDATE USING (id = auth.uid())

---

## Client-Side Changes (Summary)
- All direct SDK calls and key usage on client removed.
- gemini-service.ts & groq-service.ts now call /api/ai-proxy/chat for send/stream.
- Client-side key validation uses /api/user/keys/validate.
- Removed legacy loadAndConfigureFromServer patterns that retrieved/decrypted keys.
- New title generation flow after first message: calls /api/ai-proxy/generate-title.

---

## Feature Status Matrix

Security
- Keys never exposed to client: DONE
- Insecure decrypt endpoint removed: DONE
- Server-side key validation: DONE

Prompt & Language
- Save/load full prompt config server-side: DONE
- Apply Core iRIN + language instruction + user custom prompt to every chat: DONE
- Auto title generation with language auto-detect: DONE

Streaming
- Groq: true delta streaming: DONE
- Gemini: pseudo-stream (single-chunk fallback): TODO improve to true streaming

Thinking
- Gemini thinking mode: NOT IMPLEMENTED in server path
- Groq thinking markers: NOT EMITTED (regular content only)

Gemini Tools
- Google Search: NOT IMPLEMENTED server-side
- Code Execution: NOT IMPLEMENTED server-side
- File/Image upload: NOT IMPLEMENTED server-side

---

## Backward Compatibility / Breaking Changes
- Removed client code that decrypted/fetched keys; any UI invoking these will need to use the new validation + save endpoints.
- Title generation now happens via backend; client should not call provider SDKs directly.
- Gemini advanced features (thinking, tools, file upload) from legacy client code are disabled until added server-side.

---

## Example Requests

Chat (non-stream)
```bash
curl -X POST /api/ai-proxy/chat \
  -H 'Content-Type: application/json' \
  -d '{
    "provider": "groq",
    "messages": [
      {"role":"user","content":"Xin chào iRIN!"}
    ],
    "options": {"model":"llama-3.1-8b-instant","temperature":0.7}
  }'
```

Validate Gemini key
```bash
curl -X POST /api/user/keys/validate \
  -H 'Content-Type: application/json' \
  -d '{"provider":"gemini","apiKey":"AIza..."}'
```

Save prompt config + language
```bash
curl -X PUT /api/user/prompt \
  -H 'Content-Type: application/json' \
  -d '{
    "promptConfig": {
      "preferredName":"Mai",
      "desiredTraits":"ấm áp, kiên nhẫn",
      "personalInfo":"thích JLPT N3",
      "additionalRequests":"giải thích ngắn gọn",
      "generatedPrompt":"..."
    },
    "aiLanguage":"vietnamese",
    "customAiLanguage":""
  }'
```

---

## Rollout Checklist
- [ ] Ensure public.users has JSONB column metadata (default '{}').
- [ ] Apply/verify RLS policies for SELECT/UPDATE by owner.
- [ ] Verify /api/user/keys/validate works for both providers.
- [ ] Verify /api/user/prompt GET/PUT reads/writes metadata.
- [ ] Test /api/ai-proxy/chat with both providers; confirm keys not visible in client.
- [ ] Test auto title endpoint with different first-message languages.

---

## Roadmap (Suggested)
1) True Gemini streaming (server HTTP chunk piping)
2) Gemini tools (Google Search, Code Execution) behind server flags
3) File/Image upload routes and multimodal requests
4) Thinking mode for Gemini; structured markers for Groq
5) Observability: structured logs and error code taxonomy for proxy endpoints

---

## Troubleshooting
- Key validates on provider console but fails here:
  - Check provider restrictions (HTTP referrer vs server), ensure Generative Language API is enabled.
- Saving prompt/language reverts to auto:
  - Confirm Authorization header present for PUT /api/user/prompt; validate RLS policies.
- Gemini stream looks like one block:
  - Current server path returns a single chunk. Upgrade to true streaming in roadmap.

