# BETClaw - Current Status

**Last Updated**: 2026-03-22
**Current Phase**: Supabase sync — enabling agent access to field data
**Deadline**: Field test Longjumeau, Monday 2026-03-23

---

## Current Focus

### Strategy shift: Supabase sync = agent bridge

The critical path for Monday is NOT offline queues or gallery polish — it's **getting field data into Supabase so the OpenClaw agent can access it in real-time**. This enables:
- Agent assists during the mission (checklist guidance, questions)
- Report generation from Supabase data post-mission (via Claude Code/Cowork)
- Export/ZIP can be done post-field from desktop

### MVP weekend 22-23 mars — reprioritized

| Passe | Scope | Priority | Status |
|-------|-------|----------|--------|
| 1 | Supabase setup (6 tables + auth + storage + RLS) + rebranding | — | **Done** ✓ |
| 2 | Auth email/password + Chat OpenClaw | — | **Done** ✓ |
| 3 | Capture observations (photos + text + tags) | — | **Done** ✓ |
| 4 | **Supabase sync (upsert on save + photo upload)** | **P0** | **In progress** |
| 4b | Agent skill: supabase-reader on OpenClaw VPS | P1 | Not started |
| 7 | UX polish + mobile deploy + test | P1 | Not started |
| 8 | Full Longjumeau flow test (PWA + agent) | **P0** | Not started |
| 5 | Photo gallery (fullscreen swipe) | P2 | Deferred |
| 6 | ZIP export (context.json + photos) | P2 | Deferred post-field |

**Rationale:**
- Passe 4 (sync) is the bridge between PWA and agent — without it, agent is blind
- Passe 5 (gallery) and 6 (export) are not needed on the field Monday — export happens at the office
- Passe 4b (agent skill) can be configured on the VPS separately

---

## Key References

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
PWA (terrain)                    Supabase                 OpenClaw Gateway
┌──────────────────┐       ┌──────────────────┐     ┌──────────────────┐
│ Capture          │       │ Auth             │     │ Agent "betclaw"  │
│  observations    │──sync─▶ betc_missions    │     │                  │
│  photos          │──────▶│ betc_observations│◀────│ skill:           │
│                  │       │ betc_photos      │ SQL │  supabase-reader │
│ IndexedDB/Dexie  │       │ Storage (photos) │     │                  │
│ (offline buffer) │       │                  │     │ SOUL.md (BET)    │
│                  │       │                  │     │                  │
│ Chat ◀──────────────WebSocket──────────────────▶ │ Chat responses   │
└──────────────────┘       └──────────────────┘     └──────────────────┘

Data flow:
1. User captures observation → IndexedDB (instant) → Supabase (when online)
2. User asks agent a question → agent queries Supabase → responds with context
3. Post-mission: agent has full data for report generation
```

**Why NOT CopilotKit:** CopilotKit exposes frontend React state to AI. Our architecture is better — Supabase is the shared data layer. Agent reads DB directly via SQL, not screen state. Works regardless of which page the user is on.

---

**Current Task File**: `.claude/tasks/passe4-supabase-sync.md` (to create)
**Next Action**: Implement Supabase sync — upsert on every create/update + photo upload to Storage
