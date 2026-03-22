# Feature: Passe 4b — Agent Auth + Supabase Reader Skill

## Goal
Enable the OpenClaw agent betclaw to query Supabase as the authenticated user via JWT passthrough, so it can answer questions about missions, observations, and photos.

## Context
- **PRD Reference**: `.claude/PRD.md` — Passe 4b + Passe 11
- **Skill Doc**: `betclaw-skill-supabase-reader.md`
- **Agent Briefing**: `brief-openclaw-betclaw-update.md`

## Tasks

### Phase 1: PWA — Send JWT to Agent
- [x] Add `setSupabaseToken()` to OpenClawClient ✓ 2026-03-22
- [x] Send `[system:supabase_auth:<JWT>]` silent message after WebSocket connect ✓ 2026-03-22
- [x] Pass `session.access_token` from auth to chat-view ✓ 2026-03-22

### Phase 2: Agent — Configure Skill (VPS)
- [x] Write skill doc with schema, queries, auth patterns ✓ 2026-03-22
- [x] Write agent briefing document ✓ 2026-03-22
- [x] Agent configured to detect `[system:supabase_auth:...]` and extract JWT ✓ 2026-03-22
- [x] Agent queries Supabase with user JWT — returns real data ✓ 2026-03-22

### Phase 3: Documentation
- [x] PRD updated with Passe 11 (Edge Function proxy — target architecture) ✓ 2026-03-22
- [x] STATUS updated with auth decision + rationale ✓ 2026-03-22
- [x] Security research documented (`.claude/docs/supabase-agent-auth-patterns.md`) ✓ 2026-03-22

### Validation
- [x] `npm run typecheck` passes ✓ 2026-03-22
- [x] Agent returns mission count > 0 when queried ✓ 2026-03-22

## Completion
- **Started**: 2026-03-22
- **Completed**: 2026-03-22
- **Commit**: a9f2828
