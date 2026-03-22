# BETClaw - Current Status

**Last Updated**: 2026-03-21
**Current Phase**: Pivot to BETClaw — starting Passe 1
**Deadline**: Field test Longjumeau, Monday 2026-03-23

---

## Current Focus

### MVP weekend 22-23 mars (passes 1-8 guaranteed, 9 stretch)

| Passe | Scope | Status |
|-------|-------|--------|
| 1 | Supabase setup (6 tables + auth + storage + RLS) + rebranding | **Done** ✓ |
| 2 | Auth email/password + Chat OpenClaw | **Done** ✓ |
| 3 | Capture observations (photos + text + tags) — KEY PASS | **Done** ✓ |
| 4 | Offline sync (IndexedDB ↔ Supabase) | Not started |
| 5 | Photo gallery | Not started |
| 6 | ZIP export (context.json + photos) | Not started |
| 7 | UX polish + mobile auth test | Not started |
| 8 | Full Longjumeau flow test | Not started |
| 9 | **Stretch:** Chat OpenClaw via PinchChat | Not started |

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
- [x] ZIP export
- [x] PWA with offline support (service worker via Workbox)
- [x] GitHub Pages deployment workflow
- [x] TypeScript clean, production build successful

---

## Architecture (target)

```
PWA BETClaw                    Supabase              OpenClaw Gateway
┌──────────────────┐     ┌──────────────────┐   ┌──────────────┐
│ Mission List     │     │ Auth (magic link) │   │ Agent        │
│ Mission Create   │────▶│ betc_buildings    │   │ "betclaw"    │
│ Observation      │────▶│ betc_missions     │   │              │
│   Capture        │     │ betc_observations │   │ WebSocket    │
│ Photo Gallery    │     │ betc_messages     │   │ (PinchChat)  │
│ Chat (PinchChat) │◀───▶│ betc_photos       │   └──────────────┘
│ Export View      │     │ betc_reports      │
│ IndexedDB/Dexie  │     │ Storage buckets   │
└──────────────────┘     └──────────────────┘
```

---

**Current Task File**: `.claude/tasks/passe3-capture-observations.md`
**Next Action**: Passe 4 — Offline sync (IndexedDB ↔ Supabase)
