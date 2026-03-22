# Feature: Offline-Safe Delete Sync via syncQueue

The following plan should be complete, but validate documentation and codebase patterns before implementing.

Pay special attention to naming of existing utils, types, and models. Import from the right files.

## Feature Description

Add a `syncQueue` table in Dexie that records delete operations with enough context (supabaseId, storage paths) to replay them against Supabase when online. The existing upsert-based sync (`syncStatus` field) is untouched — this is additive.

## User Story

As a field engineer using BETClaw
I want my deleted observations, photos, and missions to be removed from Supabase
So that the OpenClaw agent and Supabase dashboard reflect my actual data, even when I delete things offline

## Problem Statement

Deletes in the PWA are local-only. IndexedDB records are removed but Supabase retains orphaned rows and Storage files. The OpenClaw agent sees stale data.

## Solution Statement

A new `syncQueue` Dexie table stores `{ operation: 'delete', table, supabaseId, storagePaths }` entries. Delete functions in `operations.ts` queue entries before removing local records. `flushPendingSync()` processes the queue after upserts: deletes Storage files, then DB rows, then removes queue entries on success.

## Feature Metadata

**Feature Type**: Enhancement
**Estimated Complexity**: Medium
**Primary Systems Affected**: `db/schema.ts`, `db/operations.ts`, `lib/supabase-sync.ts`, `types.ts`
**Dependencies**: None (uses existing Supabase client and Dexie)

---

## CONTEXT REFERENCES

### Relevant Codebase Files — READ BEFORE IMPLEMENTING

- `src/db/schema.ts` (all) — Dexie schema v3, needs v4 with syncQueue table
- `src/db/operations.ts` (all) — CRUD functions; `deleteMission` (L60-66), `deleteObservation` (L90-98), `deletePhoto` (L140-142) need modification
- `src/lib/supabase-sync.ts` (all) — Sync layer; `flushPendingSync` (L184-203) and `refreshPendingCount` (L31-40) need additions
- `src/types.ts` (all) — TypeScript interfaces; add `SyncQueueEntry`
- `src/lib/auth.ts` — Exports `user` signal needed for `userId` in storage paths
- `src/components/observation-card.tsx` (L33-47) — `handleDelete` has redundant `db.photos.bulkDelete` before calling `deleteObservation` (which already deletes photos)
- `supabase/migrations/001_create_betc_tables.sql` — CASCADE rules: missions CASCADE to observations, photos, messages, reports. But `betc_photos.observation_id` has NO CASCADE.

### No New Files to Create

All changes are modifications to existing files.

---

## KEY DESIGN DECISIONS

### 1. syncQueue for deletes only, not upserts

The current `syncStatus` field approach works for upserts. A unified queue would be a bigger refactor with no MVP benefit. Keep it minimal.

### 2. Rely on Supabase CASCADE for mission deletes

`betc_observations`, `betc_photos`, `betc_messages`, `betc_reports` all have `ON DELETE CASCADE` from `betc_missions`. Deleting a mission row in Supabase auto-deletes its children DB rows. So we only queue the mission delete (not individual child row deletes).

**BUT** we must still queue Storage file cleanup — CASCADE only removes DB rows, not Storage blobs.

### 3. For observation deletes, explicitly queue child photo deletes

`betc_photos.observation_id` references `betc_observations(id)` with **NO CASCADE**. So deleting an observation does NOT auto-delete its photos in Supabase. We must queue both photo deletes and the observation delete.

### 4. Flush order: children before parents

Process deletes in order: photos → observations → missions → buildings. This avoids FK violations (though CASCADE would handle most cases, explicit ordering is safer).

### 5. Storage delete is non-fatal

If `supabase.storage.remove()` fails, log a warning but still delete the DB row. Orphaned files can be cleaned up later.

---

## IMPLEMENTATION PLAN

### Phase 1: Type + Schema

Add `SyncQueueEntry` type and bump Dexie to v4 with the new table.

### Phase 2: Modify Delete Operations

Update `deleteMission`, `deleteObservation`, `deletePhoto` to queue sync entries before local deletion. Fix the double-delete bug in `observation-card.tsx`.

### Phase 3: Process Delete Queue in Sync Layer

Add `flushDeleteQueue()` called at the end of `flushPendingSync()`. Update `refreshPendingCount` to include queue size.

### Phase 4: Validate

Type check + build + manual test.

---

## STEP-BY-STEP TASKS

### Task 1: ADD `SyncQueueEntry` to `src/types.ts`

Add after the `SyncStatus` type (line 18):

```typescript
/** Entry in the offline delete sync queue */
export interface SyncQueueEntry {
  id?: number;
  operation: 'delete';
  table: 'buildings' | 'missions' | 'observations' | 'photos';
  supabaseId: string;
  storagePaths?: string[];
  createdAt: string;
}
```

- **VALIDATE**: `npm run typecheck`

### Task 2: UPDATE `src/db/schema.ts` — add syncQueue table, bump to v4

- Import `SyncQueueEntry` from `../types`
- Add class property: `syncQueue!: Table<SyncQueueEntry, number>;`
- Add version 4 BEFORE the existing version 3 block (Dexie requires descending order):

```typescript
this.version(4).stores({
  buildings: '++id, createdAt, supabaseId, syncStatus',
  missions: '++id, buildingId, status, createdAt, supabaseId, syncStatus',
  observations: '++id, missionId, tag, sortOrder, createdAt, supabaseId, syncStatus',
  photos: '++id, missionId, observationId, supabaseId, syncStatus',
  syncQueue: '++id, table, createdAt',
});
```

- No upgrade function needed (additive table).
- **VALIDATE**: `npm run typecheck`

### Task 3: UPDATE `src/db/operations.ts` — add `user` import

Add at top:

```typescript
import { user } from '../lib/auth';
import type { SyncQueueEntry } from '../types';
```

- **GOTCHA**: Check for circular dependency. `auth.ts` imports from `supabase.ts`, `operations.ts` imports from `schema.ts` and `supabase-sync.ts`. Adding `auth.ts` import should be safe (no back-reference).
- **VALIDATE**: `npm run typecheck`

### Task 4: UPDATE `src/db/operations.ts` — rewrite `deleteMission`

Replace the existing `deleteMission` function (L60-66) with:

```typescript
export async function deleteMission(id: number): Promise<void> {
  const mission = await db.missions.get(id);

  if (mission?.supabaseId) {
    // Collect photo storage paths BEFORE deleting locally
    const photos = await db.photos.where('missionId').equals(id).toArray();
    const userId = user.value?.id;
    const storagePaths = photos
      .filter(p => p.supabaseId && userId)
      .map(p => `${userId}/${mission.supabaseId}/${p.supabaseId}.jpg`);

    await db.transaction('rw', [db.missions, db.observations, db.photos, db.syncQueue], async () => {
      await db.photos.where('missionId').equals(id).delete();
      await db.observations.where('missionId').equals(id).delete();
      await db.missions.delete(id);
      // Queue mission delete — CASCADE handles child DB rows in Supabase
      // But we need storage paths for photo file cleanup
      await db.syncQueue.add({
        operation: 'delete',
        table: 'missions',
        supabaseId: mission.supabaseId!,
        storagePaths: storagePaths.length > 0 ? storagePaths : undefined,
        createdAt: new Date().toISOString(),
      });
    });
  } else {
    // Never synced — just delete locally
    await db.transaction('rw', [db.missions, db.observations, db.photos], async () => {
      await db.photos.where('missionId').equals(id).delete();
      await db.observations.where('missionId').equals(id).delete();
      await db.missions.delete(id);
    });
  }

  syncRecord('missions', id).catch(() => {}); // Update pending count
}
```

- **GOTCHA**: The final `syncRecord` call will fail to find the record (deleted) but `refreshPendingCount` will run and pick up the new queue entry.
- Actually, remove the trailing `syncRecord` call — the record is deleted. Instead, import and call `refreshPendingCount` directly... BUT it's not exported. Better approach: just import `flushPendingSync` and call it, or call `syncRecord` which will gracefully handle missing records and still call `refreshPendingCount`.
- Actually looking at `syncRecord`: it does `db.buildings.get(localId)` → if not found, `r` is undefined → skips sync → calls `refreshPendingCount()`. So calling `syncRecord('missions', id)` after delete is fine — it'll just update the count.
- **VALIDATE**: `npm run typecheck`

### Task 5: UPDATE `src/db/operations.ts` — rewrite `deleteObservation`

Replace the existing `deleteObservation` function (L90-98) with:

```typescript
export async function deleteObservation(id: number): Promise<void> {
  const obs = await db.observations.get(id);

  if (obs?.supabaseId) {
    const mission = await db.missions.get(obs.missionId);
    const userId = user.value?.id;
    const photos = obs.photoIds?.length
      ? (await db.photos.bulkGet(obs.photoIds)).filter((p): p is Photo => !!p)
      : [];

    // Build storage paths for photo cleanup
    const storagePaths: string[] = [];
    for (const p of photos) {
      if (p.supabaseId && userId && mission?.supabaseId) {
        storagePaths.push(`${userId}/${mission.supabaseId}/${p.supabaseId}.jpg`);
      }
    }

    await db.transaction('rw', [db.observations, db.photos, db.syncQueue], async () => {
      if (obs.photoIds?.length) await db.photos.bulkDelete(obs.photoIds);
      await db.observations.delete(id);

      // Queue photo DB deletes (no CASCADE from observation_id)
      for (const p of photos) {
        if (p.supabaseId) {
          await db.syncQueue.add({
            operation: 'delete',
            table: 'photos',
            supabaseId: p.supabaseId,
            createdAt: new Date().toISOString(),
          });
        }
      }

      // Queue observation delete (with storage paths for photo file cleanup)
      await db.syncQueue.add({
        operation: 'delete',
        table: 'observations',
        supabaseId: obs.supabaseId!,
        storagePaths: storagePaths.length > 0 ? storagePaths : undefined,
        createdAt: new Date().toISOString(),
      });
    });
  } else {
    // Never synced
    await db.transaction('rw', [db.observations, db.photos], async () => {
      if (obs?.photoIds?.length) await db.photos.bulkDelete(obs.photoIds);
      await db.observations.delete(id);
    });
  }
}
```

- **IMPORTS**: Needs `Photo` type import (already imported at top of file).
- **VALIDATE**: `npm run typecheck`

### Task 6: UPDATE `src/db/operations.ts` — rewrite `deletePhoto`

Replace the existing `deletePhoto` function (L140-142) with:

```typescript
export async function deletePhoto(id: number): Promise<void> {
  const photo = await db.photos.get(id);

  if (photo?.supabaseId) {
    const userId = user.value?.id;
    const mission = await db.missions.get(photo.missionId);
    const storagePath = (userId && mission?.supabaseId)
      ? [`${userId}/${mission.supabaseId}/${photo.supabaseId}.jpg`]
      : undefined;

    await db.transaction('rw', [db.photos, db.syncQueue], async () => {
      await db.photos.delete(id);
      await db.syncQueue.add({
        operation: 'delete',
        table: 'photos',
        supabaseId: photo.supabaseId!,
        storagePaths: storagePath,
        createdAt: new Date().toISOString(),
      });
    });
  } else {
    await db.photos.delete(id);
  }
}
```

- **VALIDATE**: `npm run typecheck`

### Task 7: FIX `src/components/observation-card.tsx` — remove double delete

In `handleDelete` (L33-47), remove the redundant `db.photos.bulkDelete` call. The updated `deleteObservation` already handles photo cleanup.

Replace lines 38-42:
```typescript
    try {
      if (observation.photoIds?.length) {
        await db.photos.bulkDelete(observation.photoIds);
      }
      await deleteObservation(observation.id!);
```

With:
```typescript
    try {
      await deleteObservation(observation.id!);
```

Also remove the unused `db` import from line 4 (`import { db } from '../db/schema';`) if it's no longer used elsewhere in the file.

- **VALIDATE**: `npm run typecheck`

### Task 8: UPDATE `src/lib/supabase-sync.ts` — add `flushDeleteQueue`

Add import at top:
```typescript
import type { SyncQueueEntry } from '../types';
```

Add the `flushDeleteQueue` function after `flushPendingSync`:

```typescript
async function flushDeleteQueue(): Promise<void> {
  const entries = await db.syncQueue.orderBy('createdAt').toArray();
  if (!entries.length) return;

  // Process children before parents to respect FK constraints
  const order: SyncQueueEntry['table'][] = ['photos', 'observations', 'missions', 'buildings'];
  const sorted = order.flatMap(t => entries.filter(e => e.table === t));

  for (const entry of sorted) {
    try {
      // 1. Delete Storage files (non-fatal)
      if (entry.storagePaths?.length) {
        const { error } = await supabase.storage
          .from('betc-photos')
          .remove(entry.storagePaths);
        if (error) console.warn('Storage cleanup failed (non-fatal):', error);
      }

      // 2. Delete DB row
      const { error } = await supabase
        .from(`betc_${entry.table}`)
        .delete()
        .eq('id', entry.supabaseId);

      if (error) {
        // PGRST116 = row not found (already deleted via CASCADE) — not an error
        if (!error.code?.startsWith('PGRST')) {
          console.error(`Delete sync failed [${entry.table}/${entry.supabaseId}]:`, error);
          continue; // Leave in queue for retry
        }
      }

      // 3. Remove from queue on success
      await db.syncQueue.delete(entry.id!);
    } catch (err) {
      console.error('Delete flush error:', err);
      // Leave in queue for retry on next flush
    }
  }
}
```

- **GOTCHA**: `supabase.from()` accepts a string, but TypeScript may want a union of known table names. Use type assertion if needed: `.from(`betc_${entry.table}` as 'betc_buildings')` — or just cast to `string & {}` to bypass.
- **VALIDATE**: `npm run typecheck`

### Task 9: UPDATE `src/lib/supabase-sync.ts` — call flushDeleteQueue in flushPendingSync

Add `await flushDeleteQueue();` at the end of `flushPendingSync`, before `refreshPendingCount`:

```typescript
export async function flushPendingSync(): Promise<void> {
  if (!getUserId()) return;

  // ... existing upsert code (buildings → missions → observations → photos) ...

  // Process queued deletes
  await flushDeleteQueue();

  await refreshPendingCount();
}
```

- **VALIDATE**: `npm run typecheck`

### Task 10: UPDATE `src/lib/supabase-sync.ts` — include syncQueue in pending count

In `refreshPendingCount`, add `db.syncQueue.count()` to the Promise.all:

```typescript
async function refreshPendingCount(): Promise<void> {
  const statuses = ['pending', 'error'];
  const counts = await Promise.all([
    db.buildings.where('syncStatus').anyOf(statuses).count(),
    db.missions.where('syncStatus').anyOf(statuses).count(),
    db.observations.where('syncStatus').anyOf(statuses).count(),
    db.photos.where('syncStatus').anyOf(statuses).count(),
    db.syncQueue.count(),
  ]);
  syncPending.value = counts.reduce((a, b) => a + b, 0);
}
```

- **VALIDATE**: `npm run typecheck`

---

## TESTING STRATEGY

No test framework is set up (MVP weekend). Manual testing only.

### Manual Test Cases

1. **Online delete observation**: Create obs with 2 photos → delete → check Supabase: obs row gone, photo rows gone, Storage files gone
2. **Online delete mission**: Create mission with 3 obs → delete mission → check Supabase: mission + all children gone, Storage files gone
3. **Offline delete**: Go offline → delete obs → verify `syncQueue` has entries (DevTools → Application → IndexedDB) → go online → verify auto-flush clears queue and Supabase
4. **Never-synced delete**: Create obs while offline → delete before syncing → verify no queue entry, clean local delete
5. **Delete photo from observation form**: Edit obs, remove a photo → verify photo deleted from Supabase Storage and DB

---

## VALIDATION COMMANDS

### Level 1: Type Check + Build

```bash
npm run typecheck
npm run build
```

**Expected**: Both exit code 0.

### Level 2: Manual Validation

1. `npm run dev` → open app → create mission + observations + photos
2. Delete an observation → check Supabase dashboard (Table Editor: `betc_observations`, `betc_photos`) and Storage (`betc-photos` bucket)
3. Test offline: DevTools → Network → Offline → delete → go back online → check Supabase

---

## ACCEPTANCE CRITERIA

- [ ] Deleting an observation removes its row AND photo rows from Supabase
- [ ] Deleting an observation removes photo files from Supabase Storage
- [ ] Deleting a mission removes mission + all children from Supabase (via CASCADE)
- [ ] Deleting a mission removes all photo files from Supabase Storage
- [ ] Deleting while offline queues the operation and flushes on reconnect
- [ ] Deleting a never-synced record does NOT create a queue entry
- [ ] Sync status indicator counts queue entries in "pending" display
- [ ] `npm run typecheck` passes
- [ ] `npm run build` passes
- [ ] No double-delete bug in observation-card.tsx

---

## EDGE CASES

| Scenario | Expected Behavior |
|----------|------------------|
| Delete record never synced (no supabaseId) | Local delete only, no queue entry |
| Pending upsert + queued delete for same record | Upsert finds no local record → skips. Delete fires → no-op or success |
| Storage delete fails | Log warning, still delete DB row and remove from queue |
| DB delete returns "not found" (CASCADE already removed) | Treat as success, remove from queue |
| Network error during delete flush | Leave entry in queue, retry on next flush |

---

## NOTES

- This is additive to the existing sync layer — zero changes to upsert logic
- The `syncRecord('missions', id)` call at end of `deleteMission` is debatable. It'll fail to find the record but will call `refreshPendingCount`. An alternative is to export `refreshPendingCount` from supabase-sync.ts, but the current approach works fine.
- Post-MVP improvement: add a `syncQueue` entry for upserts too, replacing the `syncStatus` field approach entirely. This would unify the sync model but is not worth the refactor for Monday.
