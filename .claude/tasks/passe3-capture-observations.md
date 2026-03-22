# Feature: Passe 3 — Capture Observations (BETClaw Model)

## Goal
Replace IC-VisiteChantier data model with BETClaw model (Mission/Building/Observation with free-text element + tags)

## Context
- **Plan**: `.claude/plans/passe3-capture-observations.md`
- **PRD Reference**: `.claude/PRD.md`

## Tasks

### Phase 1: Foundation — New Types + DB Schema
- [x] Task 1: Rewrite `src/types.ts` with BETClaw model ✓ 2026-03-22
- [x] Task 2: Rewrite `src/db/schema.ts` with new Dexie tables ✓ 2026-03-22
- [x] Task 3: Rewrite `src/db/operations.ts` with new CRUD operations ✓ 2026-03-22

### Phase 2: Core — Mission Management
- [x] Task 4: Create `src/components/mission-list.tsx` ✓ 2026-03-22
- [x] Task 5: Create `src/components/mission-create.tsx` ✓ 2026-03-22
- [x] Task 6: Create `src/components/mission-header.tsx` (replace visit-header.tsx) ✓ 2026-03-22

### Phase 3: Core — Observation Capture
- [x] Task 7: Rewrite `src/components/observation-form.tsx` ✓ 2026-03-22
- [x] Task 8: Update `src/components/observation-card.tsx` ✓ 2026-03-22
- [x] Task 9: Update `src/components/observation-list.tsx` ✓ 2026-03-22

### Phase 4: Integration — App Shell + Export
- [x] Task 10: Rewrite `src/app.tsx` with mission-based navigation ✓ 2026-03-22
- [x] Task 11: Update `src/lib/ref-generator.ts` with type-aware prefix ✓ 2026-03-22
- [x] Task 12: Rewrite `src/lib/export-zip.ts` with BETClaw format ✓ 2026-03-22
- [x] Task 13: Update `src/components/export-view.tsx` ✓ 2026-03-22

### Validation
- [x] TypeScript check passes (`npx tsc --noEmit`) ✓ 2026-03-22
- [x] Production build succeeds (`npm run build`) ✓ 2026-03-22

## Completion
- **Started**: 2026-03-22
- **Completed**: 2026-03-22
- **Commit**: (link to commit when done)
