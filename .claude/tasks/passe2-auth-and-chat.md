# Feature: Passe 2 — Auth + OpenClaw Chat

## Goal
Add email/password login and integrate OpenClaw chat via WebSocket into BETClaw PWA for Monday field test.

## Context
- **Priority**: Chat is the main goal for Monday (Longjumeau field test for devis)
- **Auth**: Simple email/password, user already exists in Supabase auth.users
- **Chat**: WebSocket connection to OpenClaw gateway, protocol v3

## Tasks

### Phase 1: Auth (email/password)
- [x] Task 1: Create auth store (session signal + login/logout) ✓ 2026-03-21
- [x] Task 2: Create login screen component ✓ 2026-03-21
- [x] Task 3: Add auth guard to App (show login if not authenticated) ✓ 2026-03-21
- [x] Task 4: Add logout button to header ✓ 2026-03-21

### Phase 2: Chat OpenClaw
- [x] Task 5: Create OpenClawClient (WebSocket client class) ✓ 2026-03-21
- [x] Task 6: Add env vars for OpenClaw (VITE_OPENCLAW_WS_URL, VITE_OPENCLAW_TOKEN) ✓ 2026-03-21
- [x] Task 7: Create ChatView component (message list + input) ✓ 2026-03-21
- [x] Task 8: Add Chat tab to bottom nav (default view) ✓ 2026-03-21
- [x] Task 9: Handle streaming responses + typing indicator ✓ 2026-03-21

### Phase 3: Validation
- [x] Task 10: TypeCheck + Build (0 errors) ✓ 2026-03-21
- [ ] Task 11: Manual test (login → chat → send message) — needs gateway URL + token

## Notes
- Chat is the default tab (first tab in nav bar)
- If VITE_OPENCLAW_WS_URL / VITE_OPENCLAW_TOKEN not set, chat shows config message
- .env has placeholder VITE_OPENCLAW_TOKEN=FILL_ME — needs real token before testing
- Caddy reverse proxy needs to be configured for betclaw.bluegreen.ai → localhost:18789

## Completion
- **Started**: 2026-03-21
- **Completed**: 2026-03-21 (pending manual test + gateway config)
- **Commit**: (pending /commit)
