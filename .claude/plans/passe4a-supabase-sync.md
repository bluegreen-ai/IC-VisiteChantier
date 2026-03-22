# Feature: Passe 4a — Supabase Sync (IndexedDB → Supabase on save)

The following plan should be complete, but validate documentation and codebase patterns before implementing.

Pay special attention to naming of existing utils, types, and models. Import from the right files.

## Feature Description

Every create/update in the PWA (building, mission, observation, photo) must sync to Supabase in the background. This enables the OpenClaw agent `betclaw` to query mission data in real-time via SQL, turning Supabase into the shared data layer between the field engineer and the AI assistant.

## User Story

As an engineer using BETClaw on a construction site,
I want my observations and photos to sync to Supabase automatically,
So that my AI assistant can see what I've captured and help me during the mission.

## Problem Statement

Currently all data lives in IndexedDB only. The OpenClaw agent has no access to field data. Without sync, the agent is blind and cannot assist during or after the mission.

## Solution Statement

Add a sync layer that:
1. Assigns a `supabaseId` (UUID) to every local record at creation time
2. Upserts records to Supabase after every local write (fire-and-forget when online)
3. Uploads photo blobs to Supabase Storage
4. Tracks sync status per record (`pending` / `synced` / `error`)
5. Provides visual feedback (sync indicator in the UI)
6. Flushes pending records when connectivity returns

## Feature Metadata

**Feature Type**: New Capability
**Estimated Complexity**: Medium-High
**Primary Systems Affected**: `src/db/`, `src/lib/`, `src/components/`, `src/types.ts`
**Dependencies**: `@supabase/supabase-js` (already installed), `crypto.randomUUID()` (browser API)

---

## CONTEXT REFERENCES

### Relevant Codebase Files — READ BEFORE IMPLEMENTING

- `src/db/schema.ts` (all lines) — Dexie DB definition, version 2. Must bump to v3.
- `src/db/operations.ts` (all lines) — All CRUD functions. Every create/update must trigger sync.
- `src/lib/supabase.ts` (all lines) — Supabase client, already typed with `Database`.
- `src/lib/auth.ts` (all lines) — Auth signals: `session`, `user`, `authLoading`. Need `user.value?.id` for `user_id`.
- `src/types.ts` (all lines) — Local interfaces. Must add `supabaseId` and `syncStatus` fields.
- `src/types/database.types.ts` (lines 1-300) — Auto-generated Supabase types. Field name mapping reference.
- `src/components/observation-form.tsx` — Creates observations + photos. Must trigger sync.
- `src/components/mission-create.tsx` — Creates buildings + missions. Must trigger sync.
- `src/components/mission-header.tsx` — Updates mission. Must trigger sync.
- `src/app.tsx` (all lines) — App shell. Add sync status indicator + init sync on auth.
- `src/main.tsx` (all lines) — App bootstrap. Add online/offline listeners.
- `supabase/migrations/001_create_betc_tables.sql` — Supabase schema reference (UUID PKs, field names).

### New Files to Create

- `src/lib/supabase-sync.ts` — Sync engine: upsert functions, photo upload, queue flush, status signals

### Patterns to Follow

**Naming: IndexedDB (camelCase) → Supabase (snake_case)**

| IndexedDB field | Supabase column |
|----------------|-----------------|
| `buildingId` | `building_id` |
| `missionId` | `mission_id` |
| `observationId` | `observation_id` |
| `postalCode` | `postal_code` |
| `buildingType` | `building_type` |
| `sortOrder` | `sort_order` |
| `visitedAt` | `visited_at` |
| `createdAt` | `created_at` |
| `updatedAt` | `updated_at` |
| `photoIds` | *(not synced — local reference only)* |
| `blob` | *(uploaded to Storage, not to table)* |

**Error Handling Pattern (from existing code):**
```typescript
try {
  // ... operation
} catch (err) {
  console.error('Context:', err);
  // Don't throw for background sync — mark as error instead
}
```

**Signal Pattern (from auth.ts):**
```typescript
import { signal, computed } from '@preact/signals';
export const mySignal = signal<Type>(initialValue);
```

**DB Operations Pattern (from operations.ts):**
```typescript
export async function createThing(data: Omit<Thing, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
  const now = new Date().toISOString();
  return db.things.add({ ...data, createdAt: now, updatedAt: now } as Thing);
}
```

### Relevant Documentation

**Supabase JS v2:**
- Upsert: `supabase.from('table').upsert(row, { onConflict: 'id' })`
- Storage upload: `supabase.storage.from('bucket').upload(path, blob, { contentType, upsert: true })`
- Auth user ID: `(await supabase.auth.getUser()).data.user?.id` or use the `user` signal from auth.ts

**Dexie.js 4:**
- Version upgrade: `this.version(3).stores({...}).upgrade(tx => ...)`
- New indexes require version bump
- All previous versions must remain in constructor

---

## IMPLEMENTATION PLAN

### Phase 1: Foundation — Types + Schema

Extend the IndexedDB types and schema to support sync metadata (supabaseId, syncStatus).

### Phase 2: Core — Sync Engine

Create `supabase-sync.ts` with upsert functions for each entity, photo upload, and queue flush logic.

### Phase 3: Integration — Wire Sync into Operations

Modify `operations.ts` to assign UUIDs on creation and trigger sync after every write. Wire online/offline events.

### Phase 4: UI — Sync Status Indicator

Add a small visual indicator showing sync state (synced / N pending / offline).

---

## STEP-BY-STEP TASKS

### Task 1: UPDATE `src/types.ts` — Add sync fields to interfaces

- **IMPLEMENT**: Add `supabaseId?: string` and `syncStatus?: 'pending' | 'synced' | 'error'` to `Building`, `Mission`, `Observation`, and `Photo` interfaces
- **PATTERN**: Follow existing optional field pattern (e.g. `address?: string`)
- **GOTCHA**: `syncStatus` must be optional (undefined = legacy records from before sync existed). `supabaseId` also optional for same reason.
- **GOTCHA**: Do NOT change `ExportContext` or `ExportObservation` — those are export-only types
- **VALIDATE**: `npm run typecheck`

Exact changes:
```typescript
// In Building interface, add before createdAt:
supabaseId?: string;
syncStatus?: 'pending' | 'synced' | 'error';

// Same for Mission, Observation, Photo interfaces
```

Also add a shared type at the top:
```typescript
export type SyncStatus = 'pending' | 'synced' | 'error';
```

---

### Task 2: UPDATE `src/db/schema.ts` — Bump to version 3 with sync indexes

- **IMPLEMENT**: Add `version(3)` with `supabaseId` and `syncStatus` indexed on all tables
- **PATTERN**: Follow existing version(2) → version(1) pattern. Keep v1 and v2 for migration.
- **IMPORTS**: None new needed
- **GOTCHA**: Version 3 must go BEFORE version 2 in the constructor (Dexie reads top-down, highest first)
- **GOTCHA**: Add upgrade function to set `syncStatus: 'pending'` on all existing records
- **VALIDATE**: `npm run typecheck`

Exact code to add BEFORE the existing `this.version(2)`:
```typescript
// Version 3: Add sync metadata
this.version(3).stores({
  buildings: '++id, createdAt, supabaseId, syncStatus',
  missions: '++id, buildingId, status, createdAt, supabaseId, syncStatus',
  observations: '++id, missionId, tag, sortOrder, createdAt, supabaseId, syncStatus',
  photos: '++id, missionId, observationId, supabaseId, syncStatus',
}).upgrade(tx => {
  const tables = ['buildings', 'missions', 'observations', 'photos'] as const;
  return Promise.all(
    tables.map(t =>
      tx.table(t).toCollection().modify(record => {
        record.supabaseId ??= crypto.randomUUID();
        record.syncStatus ??= 'pending';
      })
    )
  );
});
```

---

### Task 3: CREATE `src/lib/supabase-sync.ts` — Sync engine

- **IMPLEMENT**: Full sync module with:
  1. Signals: `syncPending`, `isOnline`, `syncLabel`
  2. Helper: `getUserId()` — get current user UUID from auth signal
  3. Upsert functions: `syncBuilding()`, `syncMission()`, `syncObservation()`, `syncPhoto()`
  4. Queue flush: `flushPendingSync()` — sync all pending records in dependency order
  5. Init: `initSync()` — setup online/offline listeners, initial flush
- **IMPORTS**: `supabase` from `./supabase`, `user` from `./auth`, `db` from `../db/schema`, `signal`/`computed` from `@preact/signals`
- **PATTERN**: Fire-and-forget sync (don't block UI). Catch all errors, mark record as `error`.
- **GOTCHA**: Sync order matters: buildings → missions → observations → photos
- **GOTCHA**: Photos need parent `supabaseId`s resolved before upload
- **GOTCHA**: `undefined` fields must be converted to `null` for Supabase (or omitted)
- **GOTCHA**: Storage path: `{userId}/{missionSupabaseId}/{photoSupabaseId}.jpg`
- **GOTCHA**: `navigator.onLine` is unreliable — always catch network errors gracefully
- **VALIDATE**: `npm run typecheck`

Full implementation:

```typescript
import { signal, computed } from '@preact/signals';
import { supabase } from './supabase';
import { user } from './auth';
import { db } from '../db/schema';
import type { Building, Mission, Observation, Photo } from '../types';

// --- Signals ---

export const syncPending = signal(0);
export const isOnline = signal(navigator.onLine);
export const syncLabel = computed(() =>
  !isOnline.value ? 'Hors ligne'
  : syncPending.value > 0 ? `${syncPending.value} en attente…`
  : '✓ Synchronisé'
);

// --- Helpers ---

function getUserId(): string | null {
  return user.value?.id ?? null;
}

/** Strip undefined values (Supabase rejects them) */
function clean<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as T;
}

async function refreshPendingCount(): Promise<void> {
  const statuses = ['pending', 'error'];
  const counts = await Promise.all([
    db.buildings.where('syncStatus').anyOf(statuses).count(),
    db.missions.where('syncStatus').anyOf(statuses).count(),
    db.observations.where('syncStatus').anyOf(statuses).count(),
    db.photos.where('syncStatus').anyOf(statuses).count(),
  ]);
  syncPending.value = counts.reduce((a, b) => a + b, 0);
}

// --- Individual sync functions ---

async function syncBuilding(building: Building): Promise<void> {
  const userId = getUserId();
  if (!userId || !building.supabaseId) return;

  const { error } = await supabase.from('betc_buildings').upsert(clean({
    id: building.supabaseId,
    user_id: userId,
    name: building.name,
    address: building.address ?? null,
    city: building.city ?? null,
    postal_code: building.postalCode ?? null,
    building_type: building.buildingType ?? null,
    metadata: building.metadata ?? null,
    created_at: building.createdAt,
    updated_at: building.updatedAt,
  }), { onConflict: 'id' });

  if (error) {
    console.error('Sync building failed:', error);
    await db.buildings.update(building.id!, { syncStatus: 'error' });
  } else {
    await db.buildings.update(building.id!, { syncStatus: 'synced' });
  }
}

async function syncMission(mission: Mission): Promise<void> {
  const userId = getUserId();
  if (!userId || !mission.supabaseId) return;

  // Resolve building supabaseId if linked
  let buildingSupabaseId: string | null = null;
  if (mission.buildingId) {
    const building = await db.buildings.get(mission.buildingId);
    buildingSupabaseId = building?.supabaseId ?? null;
    // If building not synced yet, skip mission sync (will retry on flush)
    if (mission.buildingId && !buildingSupabaseId) return;
  }

  const { error } = await supabase.from('betc_missions').upsert(clean({
    id: mission.supabaseId,
    user_id: userId,
    building_id: buildingSupabaseId,
    name: mission.name,
    type: mission.type ?? null,
    status: mission.status ?? 'active',
    brief: mission.brief ?? null,
    visited_at: mission.visitedAt ?? null,
    metadata: mission.metadata ?? null,
    created_at: mission.createdAt,
    updated_at: mission.updatedAt,
  }), { onConflict: 'id' });

  if (error) {
    console.error('Sync mission failed:', error);
    await db.missions.update(mission.id!, { syncStatus: 'error' });
  } else {
    await db.missions.update(mission.id!, { syncStatus: 'synced' });
  }
}

async function syncObservation(obs: Observation): Promise<void> {
  const userId = getUserId();
  if (!userId || !obs.supabaseId) return;

  // Resolve mission supabaseId
  const mission = await db.missions.get(obs.missionId);
  if (!mission?.supabaseId) return; // Parent not synced yet

  const { error } = await supabase.from('betc_observations').upsert(clean({
    id: obs.supabaseId,
    mission_id: mission.supabaseId,
    ref: obs.ref ?? null,
    element: obs.element ?? null,
    description: obs.description,
    cause: obs.cause ?? null,
    action: obs.action ?? null,
    sort_order: obs.sortOrder ?? 0,
    metadata: { tag: obs.tag, ...(obs.metadata ?? {}) } as Record<string, unknown>,
    created_at: obs.createdAt,
    updated_at: obs.updatedAt,
  }), { onConflict: 'id' });

  if (error) {
    console.error('Sync observation failed:', error);
    await db.observations.update(obs.id!, { syncStatus: 'error' });
  } else {
    await db.observations.update(obs.id!, { syncStatus: 'synced' });
  }
}

async function syncPhoto(photo: Photo): Promise<void> {
  const userId = getUserId();
  if (!userId || !photo.supabaseId) return;

  // Resolve mission supabaseId
  const mission = await db.missions.get(photo.missionId);
  if (!mission?.supabaseId) return;

  // Resolve observation supabaseId (optional)
  let obsSupabaseId: string | null = null;
  if (photo.observationId) {
    const obs = await db.observations.get(photo.observationId);
    obsSupabaseId = obs?.supabaseId ?? null;
  }

  const storagePath = `${userId}/${mission.supabaseId}/${photo.supabaseId}.jpg`;

  try {
    // 1. Upload blob to Storage
    const { error: uploadError } = await supabase.storage
      .from('betc-photos')
      .upload(storagePath, photo.blob, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // 2. Upsert metadata row
    const { error: dbError } = await supabase.from('betc_photos').upsert(clean({
      id: photo.supabaseId,
      mission_id: mission.supabaseId,
      observation_id: obsSupabaseId,
      storage_path: storagePath,
      filename: photo.filename,
      size_bytes: photo.blob.size,
      created_at: photo.createdAt,
    }), { onConflict: 'id' });

    if (dbError) throw dbError;

    await db.photos.update(photo.id!, { syncStatus: 'synced' });
  } catch (err) {
    console.error('Sync photo failed:', err);
    await db.photos.update(photo.id!, { syncStatus: 'error' });
  }
}

// --- Queue flush ---

export async function flushPendingSync(): Promise<void> {
  if (!getUserId()) return;

  const statuses = ['pending', 'error'];

  // Sync in dependency order: buildings → missions → observations → photos
  const buildings = await db.buildings.where('syncStatus').anyOf(statuses).toArray();
  for (const b of buildings) await syncBuilding(b);

  const missions = await db.missions.where('syncStatus').anyOf(statuses).toArray();
  for (const m of missions) await syncMission(m);

  const observations = await db.observations.where('syncStatus').anyOf(statuses).toArray();
  for (const o of observations) await syncObservation(o);

  const photos = await db.photos.where('syncStatus').anyOf(statuses).toArray();
  for (const p of photos) await syncPhoto(p);

  await refreshPendingCount();
}

// --- Sync a single record (called after each write) ---

export async function syncRecord(
  table: 'buildings' | 'missions' | 'observations' | 'photos',
  localId: number,
): Promise<void> {
  if (!isOnline.value || !getUserId()) {
    await refreshPendingCount();
    return;
  }

  try {
    switch (table) {
      case 'buildings': {
        const r = await db.buildings.get(localId);
        if (r) await syncBuilding(r);
        break;
      }
      case 'missions': {
        const r = await db.missions.get(localId);
        if (r) await syncMission(r);
        break;
      }
      case 'observations': {
        const r = await db.observations.get(localId);
        if (r) await syncObservation(r);
        break;
      }
      case 'photos': {
        const r = await db.photos.get(localId);
        if (r) await syncPhoto(r);
        break;
      }
    }
  } catch {
    // Network error — will retry on flush
  }

  await refreshPendingCount();
}

// --- Init ---

export function initSync(): void {
  window.addEventListener('online', () => {
    isOnline.value = true;
    flushPendingSync();
  });
  window.addEventListener('offline', () => {
    isOnline.value = false;
  });

  // Initial flush
  if (isOnline.value) {
    flushPendingSync();
  } else {
    refreshPendingCount();
  }
}
```

---

### Task 4: UPDATE `src/db/operations.ts` — Assign UUIDs + trigger sync

- **IMPLEMENT**: Every `create*` function assigns `supabaseId` + `syncStatus: 'pending'`, then calls `syncRecord()` after the IDB write. Every `update*` function marks `syncStatus: 'pending'` and triggers sync.
- **IMPORTS**: Add `import { syncRecord } from '../lib/supabase-sync';`
- **PATTERN**: Non-blocking sync: `syncRecord(...).catch(() => {})` — fire and forget
- **GOTCHA**: Don't `await` sync in the main flow — user must not be blocked
- **GOTCHA**: `deleteObservation` and `deleteMission` do NOT need sync for MVP (Supabase data is append-only for now)
- **VALIDATE**: `npm run typecheck`

Exact changes per function:

**`createBuilding`**:
```typescript
export async function createBuilding(
  data: Omit<Building, 'id' | 'createdAt' | 'updatedAt' | 'supabaseId' | 'syncStatus'>,
): Promise<number> {
  const now = new Date().toISOString();
  const id = await db.buildings.add({
    ...data,
    supabaseId: crypto.randomUUID(),
    syncStatus: 'pending',
    createdAt: now,
    updatedAt: now,
  } as Building);
  syncRecord('buildings', id).catch(() => {});
  return id;
}
```

**`createMission`**:
```typescript
export async function createMission(
  data: Omit<Mission, 'id' | 'createdAt' | 'updatedAt' | 'supabaseId' | 'syncStatus'>,
): Promise<number> {
  const now = new Date().toISOString();
  const id = await db.missions.add({
    ...data,
    supabaseId: crypto.randomUUID(),
    syncStatus: 'pending',
    createdAt: now,
    updatedAt: now,
  } as Mission);
  syncRecord('missions', id).catch(() => {});
  return id;
}
```

**`updateMission`**:
```typescript
export async function updateMission(id: number, data: Partial<Mission>): Promise<void> {
  await db.missions.update(id, { ...data, syncStatus: 'pending', updatedAt: new Date().toISOString() });
  syncRecord('missions', id).catch(() => {});
}
```

**`addObservation`**:
```typescript
export async function addObservation(
  data: Omit<Observation, 'id' | 'createdAt' | 'updatedAt' | 'supabaseId' | 'syncStatus'>,
): Promise<number> {
  const now = new Date().toISOString();
  const id = await db.observations.add({
    ...data,
    supabaseId: crypto.randomUUID(),
    syncStatus: 'pending',
    createdAt: now,
    updatedAt: now,
  } as Observation);
  syncRecord('observations', id).catch(() => {});
  return id;
}
```

**`updateObservation`**:
```typescript
export async function updateObservation(id: number, data: Partial<Observation>): Promise<void> {
  await db.observations.update(id, { ...data, syncStatus: 'pending', updatedAt: new Date().toISOString() });
  syncRecord('observations', id).catch(() => {});
}
```

**`savePhoto`**:
```typescript
export async function savePhoto(
  data: Omit<Photo, 'id' | 'createdAt' | 'supabaseId' | 'syncStatus'>,
): Promise<number> {
  try {
    const id = await db.photos.add({
      ...data,
      supabaseId: crypto.randomUUID(),
      syncStatus: 'pending',
      createdAt: new Date().toISOString(),
    } as Photo);
    syncRecord('photos', id).catch(() => {});
    return id;
  } catch (err) {
    if ((err as DOMException).name === 'QuotaExceededError') {
      throw new Error('Stockage plein. Supprimez des photos ou des missions.');
    }
    throw err;
  }
}
```

---

### Task 5: UPDATE `src/main.tsx` — Init sync after auth

- **IMPLEMENT**: Import and call `initSync()` after `initAuth()` resolves
- **IMPORTS**: `import { initSync } from './lib/supabase-sync';`
- **GOTCHA**: `initSync()` must run AFTER auth is ready (needs user ID for Supabase calls)
- **VALIDATE**: `npm run typecheck`

Change in main.tsx — after `initAuth()`:
```typescript
import { initSync } from './lib/supabase-sync';

async function bootstrap() {
  navigator.storage?.persist?.();
  await initAuth();
  initSync();
  render(<App />, document.getElementById('app')!);
}

bootstrap();
```

---

### Task 6: UPDATE `src/app.tsx` — Add sync status indicator

- **IMPLEMENT**: Add a small sync badge in the header bar showing current sync state
- **IMPORTS**: `import { syncLabel, isOnline } from './lib/supabase-sync';`
- **PATTERN**: Small text in the header, colored by status (green=synced, amber=pending, gray=offline)
- **GOTCHA**: Keep it minimal — just text, no popup or modal
- **VALIDATE**: `npm run typecheck` then `npm run build`

Add in the `AuthenticatedApp` header, between the title and the sign-out button:
```tsx
<span class={`text-xs px-2 py-0.5 rounded-full ${
  !isOnline.value ? 'bg-gray-500/30 text-white/60'
  : syncLabel.value.startsWith('✓') ? 'bg-white/20 text-white/80'
  : 'bg-amber-400/30 text-amber-100'
}`}>
  {syncLabel.value}
</span>
```

---

## TESTING STRATEGY

### Manual Integration Test (Primary — No test framework set up)

1. **Create flow**: Create a building + mission + 3 observations with photos
2. **Check Supabase**: Open Supabase dashboard → verify data in `betc_buildings`, `betc_missions`, `betc_observations`, `betc_photos`
3. **Check Storage**: Verify photos uploaded in `betc-photos` bucket
4. **Offline test**: Enable airplane mode → create observation → verify it saves locally → disable airplane mode → verify it syncs
5. **Error recovery**: Create data with bad Supabase credentials → verify `syncStatus: 'error'` → fix creds → flush → verify recovery

### Edge Cases

- Create observation before mission is synced → observation sync should wait, then succeed on next flush
- Large photo (3MB+) → should upload successfully (already compressed to < 2MB)
- Rapid-fire creates (5 observations in 10 seconds) → all should sync without race conditions
- Kill app mid-sync → pending records should re-sync on next app open

---

## VALIDATION COMMANDS

### Level 1: Syntax & Types

```bash
npm run typecheck
```

**Expected**: Exit code 0, no type errors

### Level 2: Build

```bash
npm run build
```

**Expected**: Exit code 0, clean production build

### Level 3: Manual Validation

1. `npm run dev` → open app → log in
2. Create a building + mission
3. Open Supabase dashboard → check `betc_buildings` and `betc_missions` tables
4. Create 2 observations with photos
5. Check `betc_observations` and `betc_photos` tables + `betc-photos` storage bucket
6. Check sync indicator shows "✓ Synchronisé"
7. Toggle offline (DevTools Network tab) → create observation → check indicator shows "Hors ligne" then "1 en attente…"
8. Toggle online → check auto-flush → "✓ Synchronisé"

---

## ACCEPTANCE CRITERIA

- [ ] Every `createBuilding`, `createMission`, `addObservation`, `savePhoto` assigns a UUID and triggers background sync
- [ ] Every `updateMission`, `updateObservation` marks record as pending and triggers background sync
- [ ] Photos are uploaded to Supabase Storage at `{userId}/{missionUuid}/{photoUuid}.jpg`
- [ ] Photo metadata row is created in `betc_photos` with correct `storage_path`
- [ ] Sync indicator in header shows current state (synced / N pending / offline)
- [ ] Online → offline → create data → online → auto-flush works
- [ ] No UI blocking — all sync is fire-and-forget
- [ ] `npm run typecheck` passes
- [ ] `npm run build` passes
- [ ] Data visible in Supabase dashboard after sync

---

## COMPLETION CHECKLIST

- [ ] Task 1: Types updated with `supabaseId` + `syncStatus`
- [ ] Task 2: Dexie schema bumped to v3 with sync indexes
- [ ] Task 3: `supabase-sync.ts` created with full sync engine
- [ ] Task 4: `operations.ts` wired with UUID assignment + sync triggers
- [ ] Task 5: `main.tsx` calls `initSync()` after auth
- [ ] Task 6: Sync status indicator in app header
- [ ] `npm run typecheck` passes
- [ ] `npm run build` passes
- [ ] Manual test: data appears in Supabase after creating in PWA

---

## NOTES

### Design Decisions

1. **Client-side UUID generation** (`crypto.randomUUID()`): Avoids round-trip to Supabase for ID. The UUID is the Supabase PK, set at creation time on the client.

2. **Dual ID strategy** (numeric `id` + string `supabaseId`): Local IDB operations continue using auto-increment `id` for speed. `supabaseId` is only used for Supabase sync. This avoids breaking any existing code that references numeric IDs.

3. **`tag` stored in observation `metadata` JSONB**: Supabase schema has no `tag` column. We store it in `metadata: { tag: 'structure' }`. This is flexible and matches the PRD's JSONB design philosophy.

4. **No bidirectional sync (Supabase → IDB)**: For MVP, data flows one way: device → Supabase. The agent reads from Supabase. If the agent modifies data (future), a separate pull mechanism will be needed.

5. **No delete sync**: Deleting locally doesn't delete from Supabase. For MVP this is fine — Supabase has the complete history. Can add soft-delete sync later.

6. **Photo blob stays in IDB after upload**: We don't delete the local blob after uploading to Storage. This ensures photos are always available offline for display. Can add cleanup later if storage quota is an issue.

### Risks

- **RLS policy mismatch**: If `user_id` in the upsert doesn't match `auth.uid()`, the operation silently fails (no error, no row). Always verify `getUserId()` matches the authenticated session.
- **Storage bucket permissions**: The `betc-photos` bucket must allow authenticated uploads. Verify the policy in the Supabase dashboard if uploads fail.
- **Dexie version upgrade in existing installs**: Users with existing data will hit the v2→v3 upgrade. The upgrade function assigns `supabaseId` + `syncStatus: 'pending'` to all existing records, which will then sync on next flush.
