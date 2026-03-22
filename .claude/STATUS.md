# BETClaw - Current Status

**Last Updated**: 2026-03-22
**Current Phase**: Agent auth + Supabase sync — enabling agent access to field data
**Deadline**: Field test Longjumeau, Monday 2026-03-23

---

## Current Focus

### Strategy shift: Supabase sync = agent bridge

The critical path for Monday is NOT offline queues or gallery polish — it's **getting field data into Supabase so the OpenClaw agent can access it in real-time**. This enables:
- Agent assists during the mission (checklist guidance, questions)
- Report generation from Supabase data post-mission (via Claude Code/Cowork)
- Export/ZIP can be done post-field from desktop

### Agent auth: JWT passthrough via silent message (MVP)

**Decision (2026-03-22):** The agent must query Supabase as the user (RLS-scoped), not with a service_role key.

- **MVP approach:** PWA sends the user's Supabase JWT as a silent message `[system:supabase_auth:<JWT>]` right after WebSocket connect. The agent extracts the token and uses it for all Supabase queries. Token expires in 1h, acceptable risk for mono-user MVP.
- **Target approach (Passe 11):** Supabase Edge Function proxy — JWT validated server-side, passed to agent via `extraSystemPrompt` (native OpenClaw mechanism). See PRD § Passe 11.
- **Reference doc:** `betclaw-skill-supabase-reader.md` — full schema, queries, auth patterns.

### MVP weekend 22-23 mars — reprioritized

| Passe | Scope | Priority | Status |
|-------|-------|----------|--------|
| 1 | Supabase setup (6 tables + auth + storage + RLS) + rebranding | — | **Done** ✓ |
| 2 | Auth email/password + Chat OpenClaw | — | **Done** ✓ |
| 3 | Capture observations (photos + text + tags) | — | **Done** ✓ |
| 4 | Supabase sync (upsert on save + photo upload + offline queue) | — | **Done** ✓ |
| 4b | Agent skill: supabase-reader on OpenClaw VPS | **P0** | **In progress** |
| 7 | UX polish + mobile deploy + test | P1 | Not started |
| 8 | Full Longjumeau flow test (PWA + agent) | **P0** | Not started |
| 5 | Photo gallery (fullscreen swipe) | P2 | Deferred |
| 6 | ZIP export (context.json + photos) | P2 | Deferred post-field |

### Post-MVP

| Passe | Scope | Priority | Status |
|-------|-------|----------|--------|
| 10 | Agent BETClaw complet (SOUL.md, skills, report-generator) | P1 | Not started |
| 11 | **Auth propre: Edge Function proxy + extraSystemPrompt** | P1 | Not started |

**Rationale Passe 11:**
- OpenClaw `connect` and `chat.send` have `additionalProperties: false` — no custom context fields
- MVP workaround (JWT in message) puts the token in the LLM context — acceptable for mono-user, not for multi-tenant
- `extraSystemPrompt` in OpenClaw's `agent` method is the proper channel — available via HTTP hooks or Edge Function proxy
- Industry standard: JWT at HTTP layer, never in chat protocol (Vercel AI SDK, LangServe, CopilotKit all do this)

---

## Key References

- **Skill doc**: `betclaw-skill-supabase-reader.md` — schema, queries, auth, examples
- **PinchChat** (webchat OpenClaw): https://github.com/MarlBurroW/pinchchat
- **OpenClaw brief**: `brief-openclaw-betclaw.md`

---

## What's DONE (from IC-VisiteChantier)

### Phase 1: Report Template (reusable)
- [x] DOCX template with IC branding
- [x] render_cr_visite.py script (Python + python-docx + Pillow)

### Phase 2: PWA Foundation (reusable for BETClaw)
- [x] Vite + Preact + Tailwind v4 scaffolding
- [x] IndexedDB data layer (Dexie.js 4) — offline-first
- [x] Photo capture: camera + gallery buttons with compression
- [x] ZIP export (legacy IC format — needs update for BETClaw)
- [x] PWA with offline support (service worker via Workbox)
- [x] GitHub Pages deployment workflow
- [x] TypeScript clean, production build successful

---

## Architecture (current understanding)

```
MVP (tonight):
PWA ──WebSocket──▶ OpenClaw Gateway ──▶ Agent betclaw
  │                                        │
  │ silent msg: [system:supabase_auth:JWT]  │ uses JWT to query Supabase
  │                                        │
  └──sync──▶ Supabase ◀───────────────────┘
                                    (RLS enforced)

Target (Passe 11):
PWA ──fetch──▶ Supabase Edge Function ──▶ OpenClaw (agent method)
  │              validates JWT              │ extraSystemPrompt: JWT
  │              server-side                │
  └──sync──▶ Supabase ◀───────────────────┘
                                    (RLS enforced)
```

**Why NOT service_role key:** Real 2025 incident — LLM agent with service_role key got tricked via prompt injection into exfiltrating secrets (Pomerium post-mortem). OWASP LLM Top 10 (LLM08 — Excessive Agency) explicitly warns against this.

---

**Current Task File**: `.claude/tasks/passe4-supabase-sync.md`
**Next Action**: Configure agent betclaw on VPS with supabase-reader skill + test full Longjumeau flow
