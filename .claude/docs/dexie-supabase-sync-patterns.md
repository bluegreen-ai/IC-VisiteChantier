# Dexie.js 4 + Supabase — Offline-First Sync Patterns

Reference for BETClaw: Dexie 4.x, @supabase/supabase-js 2.x, @preact/signals, Vite PWA.

---

## 1. Core Architecture

```
User action
  → Write to Dexie (IndexedDB) immediately          ← primary store, always works
  → Mark record syncStatus = 'pending'
  → If online: attempt Supabase upsert in background
      success → update syncStatus = 'synced', store supabaseId
      failure → leave syncStatus = 'pending' (will retry)
  → If offline: leave pending, listen for 'online' event
  → On 'online' event: flush sync queue
```

**Key principle:** Dexie is the source of truth for the UI. Supabase is the remote backup/sync target. Never block the UI on a network call.

---

## 2. Type Additions for Sync (types.ts)

Add these fields to every syncable entity:

```typescript
// Sync status for each local record
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'error';

// Mixin applied to all syncable entities
export interface SyncMeta {
  supabaseId?: string;     // UUID in Supabase (null until first sync)
  syncStatus?: SyncStatus; // defaults to 'pending' on create
  syncedAt?: string;       // ISO timestamp of last successful sync
  syncError?: string;      // last error message, cleared on next attempt
}

// Updated entities
export interface Mission extends SyncMeta { ... }
export interface Building extends SyncMeta { ... }
export interface Observation extends SyncMeta { ... }
export interface Photo extends SyncMeta {
  supabaseStoragePath?: string; // storage path after upload
  supabaseStorageUrl?: string;  // public URL after upload
}
```

---

## 3. Dexie Schema Version Migration

Add new indexed fields by bumping the version number. Dexie runs the upgrade
function only for existing users — new installs get the latest schema directly.

```typescript
// src/db/schema.ts
import Dexie, { type Table } from 'dexie';
import type { Mission, Building, Observation, Photo } from '../types';

export class BETClawDB extends Dexie {
  buildings!: Table<Building, number>;
  missions!: Table<Mission, number>;
  observations!: Table<Observation, number>;
  photos!: Table<Photo, number>;

  constructor() {
    super('betclaw');

    // v1 — original IC-VisiteChantier schema
    this.version(1).stores({
      visites: '++id, createdAt',
      observations: '++id, visiteId, createdAt',
      photos: '++id, visiteId, observationId',
    });

    // v2 — BETClaw model
    this.version(2).stores({
      buildings: '++id, createdAt',
      missions: '++id, buildingId, status, createdAt',
      observations: '++id, missionId, tag, sortOrder, createdAt',
      photos: '++id, missionId, observationId',
      visites: null, // delete old table
    });

    // v3 — Add sync fields as indexes
    // NOTE: Only fields listed in stores() are indexed.
    // supabaseId needs to be indexed so we can look up by UUID from Supabase.
    // syncStatus needs to be indexed so we can query WHERE syncStatus = 'pending'.
    this.version(3).stores({
      buildings:    '++id, createdAt, syncStatus, supabaseId',
      missions:     '++id, buildingId, status, createdAt, syncStatus, supabaseId',
      observations: '++id, missionId, tag, sortOrder, createdAt, syncStatus, supabaseId',
      photos:       '++id, missionId, observationId, syncStatus, supabaseId',
    }).upgrade(tx => {
      // Set default syncStatus for all existing records
      // Use Promise.all to run all table upgrades in parallel within the tx
      return Promise.all([
        tx.table('buildings').toCollection().modify({ syncStatus: 'pending' }),
        tx.table('missions').toCollection().modify({ syncStatus: 'pending' }),
        tx.table('observations').toCollection().modify({ syncStatus: 'pending' }),
        tx.table('photos').toCollection().modify({ syncStatus: 'pending' }),
      ]);
    });
  }
}

export const db = new BETClawDB();
```

### Schema Index Syntax Reference

```
++id         auto-increment primary key
id           non-auto primary key (you assign it)
$$id         UUID auto-generated primary key (via Dexie.Observable plugin — avoid unless using that plugin)
[a+b]        compound index on fields a and b
*tags        multi-entry index (for arrays of values)
&email       unique index
```

**Gotcha:** Only index fields you actually filter/order by. Indexes have overhead.
Fields like `name`, `description`, `blob` should NOT be indexed — just stored.

---

## 4. Client-Side UUID Generation

Use `crypto.randomUUID()` (built into modern browsers, no library needed) to
generate the Supabase UUID locally before inserting into Dexie. This is the
canonical offline-first pattern: the client owns the ID, no round-trip needed.

```typescript
// src/db/operations.ts — updated createMission

export async function createMission(
  data: Omit<Mission, 'id' | 'createdAt' | 'updatedAt' | 'supabaseId' | 'syncStatus'>,
): Promise<number> {
  const now = new Date().toISOString();
  return db.missions.add({
    ...data,
    createdAt: now,
    updatedAt: now,
    supabaseId: crypto.randomUUID(), // pre-assign UUID for Supabase
    syncStatus: 'pending',
  } as Mission);
}
```

**ID mapping strategy:**
- `id` (number) = Dexie auto-increment primary key — used for all local lookups
- `supabaseId` (string UUID) = Supabase primary key — used for all remote operations
- Never use the Dexie `id` in Supabase. Never use `supabaseId` for IDB queries.

---

## 5. Supabase Upsert Pattern

Upsert = insert if not exists, update if exists (based on `onConflict` column).
This is the safe operation for sync: idempotent, handles retries cleanly.

```typescript
// src/lib/sync.ts

import { supabase } from './supabase';
import { db } from '../db/schema';
import type { Mission } from '../types';

export async function syncMission(localId: number): Promise<void> {
  const mission = await db.missions.get(localId);
  if (!mission || !mission.supabaseId) return;

  // Mark as syncing (so UI shows spinner)
  await db.missions.update(localId, { syncStatus: 'syncing' });

  try {
    const { error } = await supabase
      .from('betc_missions')
      .upsert(
        {
          id: mission.supabaseId,               // Supabase UUID PK
          name: mission.name,
          type: mission.type,
          status: mission.status,
          brief: mission.brief ?? null,
          visited_at: mission.visitedAt ?? null,
          // building_id: mission.building.supabaseId — resolved separately
          updated_at: mission.updatedAt,
          created_at: mission.createdAt,
        },
        {
          onConflict: 'id',        // conflict on the UUID primary key
          ignoreDuplicates: false, // do update on conflict (default)
        },
      )
      .select('id')
      .single();

    if (error) throw error;

    await db.missions.update(localId, {
      syncStatus: 'synced',
      syncedAt: new Date().toISOString(),
      syncError: undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db.missions.update(localId, {
      syncStatus: 'error',
      syncError: message,
    });
    // Do not re-throw — sync errors are non-blocking
    console.warn(`[sync] mission ${localId} failed:`, message);
  }
}
```

---

## 6. Photo Upload to Supabase Storage

### Storage path convention

```
{user_id}/{mission_supabase_id}/{photo_local_id}.jpg
```

This path satisfies the RLS policy that scopes by `auth.uid()` as the first folder segment.

### Upload from Blob (IndexedDB → Supabase Storage)

```typescript
// src/lib/sync.ts

export async function syncPhoto(localId: number, userId: string): Promise<void> {
  const photo = await db.photos.get(localId);
  if (!photo || !photo.supabaseId) return;

  // Resolve the mission's supabaseId for the path
  const mission = photo.missionId
    ? await db.missions.get(photo.missionId)
    : undefined;
  if (!mission?.supabaseId) {
    // Can't upload without a mission supabaseId — mission must sync first
    return;
  }

  await db.photos.update(localId, { syncStatus: 'syncing' });

  try {
    const storagePath = `${userId}/${mission.supabaseId}/${photo.supabaseId}.jpg`;

    // Upload the Blob directly — no File wrapper needed
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('betclaw-photos')         // bucket name
      .upload(storagePath, photo.blob, {
        contentType: 'image/jpeg',
        upsert: true,                 // safe to retry: overwrite if exists
        cacheControl: '3600',
      });

    if (uploadError) throw uploadError;

    // Get public URL (only if bucket is public)
    const { data: { publicUrl } } = supabase.storage
      .from('betclaw-photos')
      .getPublicUrl(uploadData.path);

    // For private buckets, use signed URL instead:
    // const { data, error } = await supabase.storage
    //   .from('betclaw-photos')
    //   .createSignedUrl(uploadData.path, 3600); // expires in 1 hour
    // const signedUrl = data?.signedUrl;

    // Persist photo metadata row to DB table
    const { error: dbError } = await supabase
      .from('betc_photos')
      .upsert(
        {
          id: photo.supabaseId,
          mission_id: mission.supabaseId,
          storage_path: storagePath,
          public_url: publicUrl,
          filename: photo.filename,
          created_at: photo.createdAt,
        },
        { onConflict: 'id' },
      );

    if (dbError) throw dbError;

    await db.photos.update(localId, {
      syncStatus: 'synced',
      syncedAt: new Date().toISOString(),
      supabaseStoragePath: storagePath,
      supabaseStorageUrl: publicUrl,
      syncError: undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db.photos.update(localId, { syncStatus: 'error', syncError: message });
    console.warn(`[sync] photo ${localId} failed:`, message);
  }
}
```

### Storage RLS Policy

```sql
-- Allow authenticated users to upload only under their own user_id folder
create policy "Users upload own photos"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'betclaw-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to read only their own photos
create policy "Users read own photos"
on storage.objects for select to authenticated
using (
  bucket_id = 'betclaw-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### File size & compression considerations

- Supabase Storage default max: **50MB per file** (configurable per project)
- Mobile camera photos: typically 3–10MB JPEG
- Recommended: compress to max 1920px wide before storing in Dexie AND before upload
- Use browser Canvas API or `browser-image-compression` (npm) for compression
- The existing `savePhoto` in `operations.ts` should compress before `db.photos.add()`

---

## 7. Sync Queue — Flush on Reconnect

```typescript
// src/lib/sync-queue.ts

import { db } from '../db/schema';
import { syncMission, syncPhoto } from './sync';
import { supabase } from './supabase';

let isFlushing = false;

/** Sync all pending records for a given user */
export async function flushSyncQueue(userId: string): Promise<void> {
  if (isFlushing) return; // prevent concurrent flushes
  if (!navigator.onLine) return;

  isFlushing = true;
  console.log('[sync] flushing queue...');

  try {
    // Sync in dependency order: buildings → missions → observations → photos
    // (foreign keys require parent to exist first)

    const pendingBuildings = await db.buildings
      .where('syncStatus').anyOf(['pending', 'error'])
      .toArray();
    for (const b of pendingBuildings) {
      if (b.id != null) await syncBuilding(b.id);
    }

    const pendingMissions = await db.missions
      .where('syncStatus').anyOf(['pending', 'error'])
      .toArray();
    for (const m of pendingMissions) {
      if (m.id != null) await syncMission(m.id);
    }

    const pendingObservations = await db.observations
      .where('syncStatus').anyOf(['pending', 'error'])
      .toArray();
    for (const o of pendingObservations) {
      if (o.id != null) await syncObservation(o.id);
    }

    const pendingPhotos = await db.photos
      .where('syncStatus').anyOf(['pending', 'error'])
      .toArray();
    for (const p of pendingPhotos) {
      if (p.id != null) await syncPhoto(p.id, userId);
    }

    console.log('[sync] queue flushed');
  } finally {
    isFlushing = false;
  }
}

/** Register online/offline listeners — call once on app init */
export function registerSyncListeners(getUserId: () => string | null): void {
  window.addEventListener('online', () => {
    const userId = getUserId();
    if (userId) flushSyncQueue(userId);
  });

  // Also attempt flush when app becomes visible again (tab switch, phone unlock)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      const userId = getUserId();
      if (userId && navigator.onLine) flushSyncQueue(userId);
    }
  });
}
```

---

## 8. Sync on Save — Optimistic Local Write

Replace the existing `createMission` call pattern with:

```typescript
// src/db/operations.ts — updated pattern

import { flushSyncQueue } from '../lib/sync-queue';
import { sessionSignal } from '../lib/auth'; // your existing signal

export async function createMission(
  data: Omit<Mission, 'id' | 'createdAt' | 'updatedAt' | 'supabaseId' | 'syncStatus'>,
): Promise<number> {
  const now = new Date().toISOString();

  // 1. Write locally — this always succeeds (offline safe)
  const localId = await db.missions.add({
    ...data,
    createdAt: now,
    updatedAt: now,
    supabaseId: crypto.randomUUID(),
    syncStatus: 'pending',
  } as Mission);

  // 2. Fire-and-forget sync — do NOT await, do NOT block UI
  const userId = sessionSignal.value?.user.id;
  if (userId && navigator.onLine) {
    syncMission(localId).catch(() => { /* already handled inside syncMission */ });
  }

  return localId;
}
```

Same pattern applies for `updateMission`, `addObservation`, `savePhoto`.

---

## 9. Preact Signals for Sync State

```typescript
// src/lib/sync-state.ts

import { signal, computed } from '@preact/signals';
import { db } from '../db/schema';

// Count of pending/error records across all tables
export const pendingCount = signal(0);
export const isOnline = signal(navigator.onLine);

// Derived: is there anything left to sync?
export const hasPendingSync = computed(() => pendingCount.value > 0);
export const syncStatusLabel = computed(() => {
  if (!isOnline.value) return 'Hors ligne';
  if (pendingCount.value > 0) return `${pendingCount.value} en attente`;
  return 'Synchronisé';
});

/** Recompute pendingCount from Dexie — call after any write */
export async function refreshPendingCount(): Promise<void> {
  const [b, m, o, p] = await Promise.all([
    db.buildings.where('syncStatus').anyOf(['pending', 'error']).count(),
    db.missions.where('syncStatus').anyOf(['pending', 'error']).count(),
    db.observations.where('syncStatus').anyOf(['pending', 'error']).count(),
    db.photos.where('syncStatus').anyOf(['pending', 'error']).count(),
  ]);
  pendingCount.value = b + m + o + p;
}

/** Register online/offline into signals — call once on app init */
export function initSyncSignals(): void {
  window.addEventListener('online',  () => { isOnline.value = true; });
  window.addEventListener('offline', () => { isOnline.value = false; });
}
```

### Sync status indicator component

```tsx
// src/components/SyncBadge.tsx
import { hasPendingSync, syncStatusLabel, isOnline } from '../lib/sync-state';

export function SyncBadge() {
  return (
    <span class={`text-xs px-2 py-0.5 rounded-full ${
      !isOnline.value
        ? 'bg-gray-100 text-gray-500'
        : hasPendingSync.value
          ? 'bg-amber-100 text-amber-700'
          : 'bg-green-100 text-green-700'
    }`}>
      {/* Direct signal interpolation — no re-render, pure DOM update */}
      {syncStatusLabel}
    </span>
  );
}
```

---

## 10. App Initialization Order

```typescript
// src/main.tsx

import { supabase } from './lib/supabase';
import { sessionSignal } from './lib/auth';
import { registerSyncListeners, flushSyncQueue } from './lib/sync-queue';
import { initSyncSignals, refreshPendingCount } from './lib/sync-state';

async function init() {
  // 1. Init signals
  initSyncSignals();

  // 2. Restore auth session (localStorage read — no network)
  const { data: { session } } = await supabase.auth.getSession();
  sessionSignal.value = session;

  // 3. Subscribe to auth changes
  supabase.auth.onAuthStateChange((_event, session) => {
    sessionSignal.value = session;
    if (session) {
      // New login — try to flush anything queued while logged out
      flushSyncQueue(session.user.id);
    }
  });

  // 4. Register online/offline sync listeners
  registerSyncListeners(() => sessionSignal.value?.user.id ?? null);

  // 5. Count pending records for badge
  await refreshPendingCount();

  // 6. Attempt flush on startup if online and logged in
  if (navigator.onLine && sessionSignal.value) {
    flushSyncQueue(sessionSignal.value.user.id);
  }

  // 7. Render app
  render(<App />, document.getElementById('app')!);
}

init();
```

---

## 11. RLS Setup for BETClaw Tables

```sql
-- Enable RLS on all sync tables
alter table betc_buildings    enable row level security;
alter table betc_missions     enable row level security;
alter table betc_observations enable row level security;
alter table betc_photos       enable row level security;

-- Standard owner-only policies (repeat for each table)
create policy "owner_select" on betc_missions
  for select to authenticated using (auth.uid() = user_id);

create policy "owner_insert" on betc_missions
  for insert to authenticated with check (auth.uid() = user_id);

create policy "owner_update" on betc_missions
  for update to authenticated using (auth.uid() = user_id);

create policy "owner_delete" on betc_missions
  for delete to authenticated using (auth.uid() = user_id);
```

**Critical:** Each row needs a `user_id uuid references auth.users(id)` column.
Include it in every upsert payload: `user_id: session.user.id`.

---

## 12. Error Handling Reference

```typescript
// Supabase errors you'll see in sync
const SUPABASE_ERROR_CODES = {
  '42501': 'RLS policy violation — check user_id in payload and policies',
  '23505': 'Unique constraint — supabaseId already exists, safe to ignore',
  'PGRST116': '.single() returned 0 or multiple rows',
  'PGRST204': 'Column does not exist in table',
} as const;

// Storage errors
// 'Bucket not found' — bucket doesn't exist or wrong name
// 'Object not found' — path doesn't exist (on download)
// 'new row violates RLS' — storage policy blocks upload

// Network errors (Supabase client wraps fetch errors)
// { message: 'Failed to fetch' } — offline or CORS
```

---

## 13. Known Gotchas

| Gotcha | Solution |
|--------|----------|
| Dexie upgrade function not running | Version must be **higher** than all previous versions in all open tabs. Close other tabs during testing. |
| `syncStatus` not indexed after adding to stores() | Must bump version number for index to be created. Dexie only re-indexes on version upgrade. |
| `undefined` fields in upsert payload | Supabase rejects `undefined` values. Use `null` explicitly or strip undefined keys before upsert. |
| Parent missing supabaseId during child sync | Always sync in order: buildings → missions → observations → photos. Gate child sync on parent.supabaseId != null. |
| `crypto.randomUUID()` in test environments | Not available in older Node or non-secure contexts. Use polyfill or `uuid` npm package in tests. |
| Storage upload with upsert: CDN caching | Use unique filenames (UUID) rather than overwriting. CDN may serve stale content for overwritten paths. |
| `navigator.onLine` is unreliable | It only reports if connected to *any* network, not if Supabase is reachable. Treat sync failures as offline fallback. |
| Dexie `modify()` in upgrade is not reactive | Upgrade runs during `db.open()`. Don't call db methods outside the upgrade transaction object. |

---

## Quick Reference

| Task | Code |
|------|------|
| Add sync fields to schema | Bump version, add to `stores()`, `modify({ syncStatus: 'pending' })` in upgrade |
| Generate UUID client-side | `crypto.randomUUID()` |
| Upsert to Supabase | `.upsert(row, { onConflict: 'id' })` |
| Upload Blob to Storage | `supabase.storage.from(bucket).upload(path, blob, { upsert: true })` |
| Get public URL | `supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl` |
| Query pending records | `db.missions.where('syncStatus').anyOf(['pending', 'error']).toArray()` |
| Online status signal | `signal(navigator.onLine)` + `window.addEventListener('online'/'offline')` |
| Hook on record creation | `db.missions.hook('creating', (primKey, obj, tx) => { obj.supabaseId ??= crypto.randomUUID() })` |
