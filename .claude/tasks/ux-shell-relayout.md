# Feature: UX Shell Relayout — Fixed Bottom Bar + Contextual FAB

## Goal
Restructure navigation from 4-tab bottom bar to fixed 3-tab shell with contextual FAB for observations.

## Context
- **Plan**: `.claude/plans/ux-shell-relayout.md`
- **Primary File**: `src/app.tsx`

## Tasks

### Phase 1: Restructure App Shell
- [x] Task 1: Rewrite `src/app.tsx` — new navigation shell (3 tabs + FAB + overlay) ✓ 2026-03-22

### Phase 2: Component Updates
- [x] Task 2: Update `src/components/observation-form.tsx` — remove edit banner ✓ 2026-03-22
- [x] Task 3: Update `src/components/observation-list.tsx` — improve empty state ✓ 2026-03-22
- [x] Task 4: Update `src/components/mission-list.tsx` — FAB positioning ✓ 2026-03-22

### Phase 3: Validation
- [x] Task 5: typecheck + build pass ✓ 2026-03-22

## Completion
- **Started**: 2026-03-22
- **Completed**: 2026-03-22
- **Commit**: (pending /commit)
