# Feature: Merge Edifice & BETClaw — Unified Schema + OpenClaw Chat

## Goal
Unify BETClaw PWA and Edifice around `edifice_*` Supabase tables and add OpenClaw chat to Edifice.

## Context
- **Plan**: `.claude/plans/merge-edifice-betclaw.md`
- **Related Files**: `src/lib/supabase-sync.ts`, `src/types.ts`, `src/db/schema.ts`, Edifice frontend

## Tasks

### Phase 1: Schema Evolution
- [x] Task 1: CREATE Supabase migration (observation_type + messages + field columns) ✓ 2026-03-23

### Phase 2: PWA Sync Layer → edifice_*
- [x] Task 2: UPDATE `src/types.ts` — align interfaces with Edifice schema ✓ 2026-03-23
- [x] Task 3: UPDATE `src/db/schema.ts` — bump Dexie to v5 ✓ 2026-03-23
- [x] Task 4: UPDATE `src/lib/supabase-sync.ts` — remap betc_* to edifice_* ✓ 2026-03-23
- [x] Task 5: Regenerate `src/types/database.types.ts` + fix observation-form.tsx ✓ 2026-03-23

### Phase 3: OpenClaw Chat in Edifice
- [x] Task 6: CREATE OpenClaw client for Edifice ✓ 2026-03-23
- [x] Task 7: CREATE React hook useOpenClawChat ✓ 2026-03-23
- [x] Task 8: CREATE React chat component ✓ 2026-03-23
- [x] Task 9: UPDATE Edifice project detail page — add Chat tab ✓ 2026-03-23

### Phase 4: Validation
- [x] Task 10: Typecheck and build both projects ✓ 2026-03-23

## Completion
- **Started**: 2026-03-23
- **Completed**: 2026-03-23
- **Commit**: (pending /commit)

## Notes
- Migration applied live via MCP `apply_migration`
- `observation-form.tsx` needed `observationType: 'note'` added (required field)
- Photos sync with `width: 0, height: 0` placeholder since field capture doesn't extract dimensions
- Edifice env vars needed: `NEXT_PUBLIC_OPENCLAW_URL`, `NEXT_PUBLIC_OPENCLAW_TOKEN`, `NEXT_PUBLIC_OPENCLAW_SESSION_PREFIX`
