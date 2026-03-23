# Feature: Building-Mission Flow with Address Autocomplete

## Goal
Fix building-mission linkage bugs and redesign the creation flow with address-first autocomplete via API BAN.

## Context
- **Plan**: `.claude/plans/passe12-building-mission-flow.md`
- **Related Files**: mission-create, mission-header, mission-list, observation-form, supabase-sync, types, db/operations

## Tasks

### Phase 1: Address Autocomplete Lib + Component
- [x] Task 1: Create `src/lib/address-autocomplete.ts` — API BAN fetch logic ✓ 2026-03-23
- [x] Task 2: Create `src/components/address-input.tsx` — Autocomplete input with dropdown ✓ 2026-03-23

### Phase 2: Mission Create Rewrite
- [x] Task 3: Rewrite `src/components/mission-create.tsx` — Address-first flow ✓ 2026-03-23

### Phase 3: Sync Fix
- [x] Task 4: Fix sync race condition in `src/lib/supabase-sync.ts` ✓ 2026-03-23

### Phase 4: Navigation
- [x] Task 5: Make building name tappable in `src/components/mission-list.tsx` ✓ 2026-03-23
- [x] Task 6: Make building info tappable in `src/components/mission-header.tsx` ✓ 2026-03-23

### Phase 5: Observation Location
- [x] Task 7: Add optional location field in `src/components/observation-form.tsx` ✓ 2026-03-23

### Validation
- [x] TypeScript compiles clean (`npx tsc --noEmit`) ✓ 2026-03-23
- [x] Production build succeeds (`npm run build`) ✓ 2026-03-23

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/lib/address-autocomplete.ts` | Create | API BAN fetch logic |
| `src/components/address-input.tsx` | Create | Address autocomplete component |
| `src/components/mission-create.tsx` | Rewrite | Address-first creation flow |
| `src/lib/supabase-sync.ts` | Modify | Fix sync race condition |
| `src/components/mission-list.tsx` | Modify | Tappable building name |
| `src/components/mission-header.tsx` | Modify | Tappable building info |
| `src/components/observation-form.tsx` | Modify | Add location field |

## Notes
- Task 8 (Fix Longjumeau data) already done per plan

## Completion
- **Started**: 2026-03-23
- **Completed**: 2026-03-23
- **Commit**: (link to commit when done)
