# Feature: Passe 4a — Supabase Sync (IndexedDB → Supabase on save)

## Goal
Sync every create/update from IndexedDB to Supabase in the background, so the OpenClaw agent can query mission data in real-time.

## Context
- **PRD Reference**: `.claude/PRD.md` — Supabase sync layer
- **Plan**: `.claude/plans/passe4a-supabase-sync.md`
- **Related Files**: `src/types.ts`, `src/db/schema.ts`, `src/db/operations.ts`, `src/lib/supabase-sync.ts` (new), `src/main.tsx`, `src/app.tsx`

## Tasks

### Phase 1: Foundation — Types + Schema
- [x] Task 1: Add `SyncStatus` type + `supabaseId`/`syncStatus` fields to Building, Mission, Observation, Photo interfaces ✓ 2026-03-22
- [x] Task 2: Bump Dexie schema to v3 with sync indexes + upgrade function ✓ 2026-03-22

### Phase 2: Core — Sync Engine
- [x] Task 3: Create `src/lib/supabase-sync.ts` — signals, upserts, queue flush, init ✓ 2026-03-22

### Phase 3: Integration — Wire Sync into Operations
- [x] Task 4: Update `src/db/operations.ts` — assign UUIDs + trigger sync on every write ✓ 2026-03-22
- [x] Task 5: Update `src/main.tsx` — init sync after auth ✓ 2026-03-22

### Phase 4: UI — Sync Status Indicator
- [x] Task 6: Update `src/app.tsx` — add sync badge in header ✓ 2026-03-22

### Validation
- [x] `npm run typecheck` passes ✓ 2026-03-22
- [x] `npm run build` passes ✓ 2026-03-22

## Completion
- **Started**: 2026-03-22
- **Completed**: 2026-03-22
- **Commit**: (link to commit when done)
