# Feature: Offline-Safe Delete Sync via syncQueue

## Goal
Queue delete operations in a `syncQueue` Dexie table so they replay against Supabase when online.

## Context
- **Plan**: `.claude/plans/sync-queue-deletes.md`
- **Related Files**: `src/types.ts`, `src/db/schema.ts`, `src/db/operations.ts`, `src/lib/supabase-sync.ts`, `src/components/observation-card.tsx`

## Tasks

### Phase 1: Type + Schema
- [x] Task 1: Add `SyncQueueEntry` type to `src/types.ts` ✓ 2026-03-22
- [x] Task 2: Add syncQueue table to `src/db/schema.ts` (bump to v4) ✓ 2026-03-22

### Phase 2: Modify Delete Operations
- [x] Task 3: Add `user` and `SyncQueueEntry` imports to `src/db/operations.ts` ✓ 2026-03-22
- [x] Task 4: Rewrite `deleteMission` with sync queue ✓ 2026-03-22
- [x] Task 5: Rewrite `deleteObservation` with sync queue ✓ 2026-03-22
- [x] Task 6: Rewrite `deletePhoto` with sync queue ✓ 2026-03-22
- [x] Task 7: Fix double-delete in `observation-card.tsx` ✓ 2026-03-22

### Phase 3: Sync Layer
- [x] Task 8: Add `flushDeleteQueue` to `src/lib/supabase-sync.ts` ✓ 2026-03-22
- [x] Task 9: Call `flushDeleteQueue` in `flushPendingSync` ✓ 2026-03-22
- [x] Task 10: Include syncQueue in pending count ✓ 2026-03-22

### Validation
- [x] Type check passes ✓ 2026-03-22
- [x] Build passes ✓ 2026-03-22

## Completion
- **Started**: 2026-03-22
- **Completed**: 2026-03-22
- **Commit**: (pending)
