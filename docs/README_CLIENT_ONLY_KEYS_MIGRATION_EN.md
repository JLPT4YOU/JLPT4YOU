# Client-only API Keys Migration (Gemini & Groq for iRIN)

Created: 2025-09-01
Owner: JLPT4YOU Engineering
Status: Draft (English version for implementation)

Purpose
- Move user API keys (Google Gemini, Groq) to client-only storage (localStorage).
- Remove encrypted storage in Supabase and server-side decryption endpoints.
- Simplify architecture: no user_api_keys table, no /api/user/keys/* routes, no APP_ENCRYPT_SECRET.
- Preserve good UX: users enter/validate keys in Settings/Modal; chat works immediately.

Scope
- Affects iRIN chat, Settings/Modal, AIProviderManager, Gemini/Groq services, user/keys API routes, and DB migrations.
- Out of scope: dictionary proxy routes (Tracau/JDict) and unrelated features.

Current State (key pointers)
- Persist/decrypt on server:
  - Save (encrypt+upsert): src/app/api/user/keys/[provider]/route.ts (PUT/DELETE)
  - Decrypt & return to client: src/app/api/user/keys/[provider]/decrypt/route.ts
  - Status: src/app/api/user/keys/route.ts (GET)
  - Secure wrapper that fetches keys on-demand: src/lib/secure-ai-service-wrapper.ts
  - Legacy helper: src/lib/api-key-service.ts
  - Supabase table: database/migrations/20250725_user_api_keys.sql
- Key input UI (calls server to save): src/components/multi-provider-api-key-modal.tsx
- Base service currently disables localStorage (server-only path forced):
  - src/lib/ai-config.ts → getApiKeyFromStorage() returns null; saveApiKeyToStorage() is no-op

Target Architecture (client-only)
- Storage: localStorage in the user’s browser.
  - Keys:
    - ai:gemini:apiKey
    - ai:groq:apiKey
- Retrieval: services (Gemini/Groq) read from localStorage or from configure(apiKey) when the user saves.
- No calls to /api/user/keys/*; no server decryption.
- Logout: by default, keep keys (optional future: clear on logout).
- Security: accept client-side exposure risk; clearly documented in Settings.

User Flow After Migration
1) User opens Settings → API Keys modal.
2) Enter Gemini/Groq key → validate directly via provider SDK → on success, save to localStorage → aiProviderManager.configureProvider(provider, key).
3) Chat uses ensureConfigured() and the saved key.

Technical Changes by Module
A) Remove server endpoints & helpers
- Delete:
  - src/app/api/user/keys/[provider]/route.ts (PUT/DELETE)
  - src/app/api/user/keys/[provider]/decrypt/route.ts
  - src/app/api/user/keys/route.ts (GET status)
- Delete helpers:
  - src/lib/api-key-service.ts
  - src/lib/secure-ai-service-wrapper.ts
- Remove all APP_ENCRYPT_SECRET references (code and env).

B) Re-enable localStorage in BaseAIService
- File: src/lib/ai-config.ts
- Replace get/save with safe browser guards:

```ts
protected getApiKeyFromStorage(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const key = localStorage.getItem(`ai:${this.storageKeyPrefix}:apiKey`);
    return key || null;
  } catch {
    return null;
  }
}

protected saveApiKeyToStorage(apiKey: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`ai:${this.storageKeyPrefix}:apiKey`, apiKey);
  } catch {
    // ignore write errors (private mode / quota / policy)
  }
}
```

C) Update Gemini/Groq services
- Files: src/lib/gemini-service.ts, src/lib/groq-service.ts
- Keep API as-is: constructor/ensureConfigured/configure already compatible.
- Ensure configure(apiKey) calls saveApiKeyToStorage(apiKey) (Gemini already does; Groq should mirror this behavior).

D) Update AIProviderManager
- File: src/lib/ai-provider-manager.ts
- Remove createSecureAIService wrapper; use getGeminiService() and getGroqService() directly.
- configureProvider(provider, apiKey?):
  - If apiKey provided, call service.configure(apiKey).
  - Fire config-changed event as today (if used by UI).
- isProviderConfigured(provider):
  - Prefer a direct check via localStorage (indirect through service or a tiny helper) or service.configured flag.

E) Update key input UI (Modal)
- File: src/components/multi-provider-api-key-modal.tsx
- Remove any fetch calls to /api/user/keys*.
- After validation success: aiProviderManager.configureProvider(provider, key) – the service persists to localStorage.
- Status “Configured”: derive from localStorage/service, not from server status API.
- Add a clear UX note: “Keys are stored only in your browser. Clearing browser data will remove them.”

F) Docs & Env cleanup
- docs/settings-api-keys.md: make security note explicit (client-only; no server transmission).
- Remove APP_ENCRYPT_SECRET from .env.* and code.

Database Migration
- Add: database/migrations/20250901_drop_user_api_keys.sql

Suggested content:
```sql
-- Drop user_api_keys if exists
DROP TABLE IF EXISTS public.user_api_keys;
```
- Remove any related policies/triggers if present.

Rollout Plan
- Phase 1 (backwards-safe):
  - Implement client-only path and switch UI first.
  - Keep /api/user/keys/* endpoints temporarily (unused) for fast rollback.
- Phase 2 (cleanup):
  - Delete endpoints and legacy helpers; remove secure wrapper.
  - Run DB migration to drop user_api_keys.
  - Remove APP_ENCRYPT_SECRET from env and code.

Test Plan
- Unit
  - BaseAIService localStorage get/save (SSR-safe), tolerate storage errors.
  - Gemini/Groq: configure → ensureConfigured → send/stream paths.
- Integration
  - Modal: validate → configure → chat works; switching provider; default model handling; thinking/files (Gemini) if applicable.
- E2E
  - Valid/invalid key paths; update/clear; refresh page; Configured badge reflects localStorage state.
- Security
  - Ensure no calls to /api/user/keys/*.
  - No APP_ENCRYPT_SECRET references remain.
  - No localStorage access on the server (SSR guarded).

Risks & Mitigations
- Keys lost if browser data is cleared → clearly warn and provide easy re-entry.
- Client-side key exposure → accepted by design (documented warning; Groq browser flag if applicable).
- Multi-tab sync → consider window.storage event to refresh UI state.
- Legacy keys in server DB become unused → communicate that users must re-enter keys after update.

Rollback (Backout)
- Keep a backup branch before deleting endpoints & table.
- If necessary, revert commits; restore /api/user/keys/*, secure wrapper, APP_ENCRYPT_SECRET, and the user_api_keys table.

Implementation Checklist (PR sequence)
1) PR1 – Base services: enable localStorage get/save in src/lib/ai-config.ts; confirm Gemini/Groq configure() persists.
2) PR2 – Provider manager: remove secure wrapper; use direct services; adjust isProviderConfigured.
3) PR3 – UI: update multi-provider modal to use client-only flow; remove API calls; add warning note.
4) PR4 – Legacy cleanup (code only): delete src/lib/secure-ai-service-wrapper.ts and src/lib/api-key-service.ts; keep API routes temporarily.
5) PR5 – API & DB cleanup: remove /api/user/keys/* routes; add migration to drop user_api_keys; remove APP_ENCRYPT_SECRET.
6) PR6 – Docs: update docs/settings-api-keys.md; add this README; announce that users must re-enter keys once.

Acceptance Criteria
- No server routes exist for user keys; no APP_ENCRYPT_SECRET references.
- Gemini & Groq chats work with keys stored only in localStorage.
- UI correctly shows Configured based on localStorage and supports update/clear flows.
- DB migration drops user_api_keys successfully in all environments.
- All tests (unit/integration/E2E) pass; no SSR violations.

