import { signal, computed } from '@preact/signals';
import { supabase } from './supabase';
import { user } from './auth';
import { db } from '../db/schema';
import type { Building, Mission, Observation, Photo, SyncQueueEntry } from '../types';
import type { Json } from '../types/database.types';

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
    db.syncQueue.count(),
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
    metadata: (building.metadata ?? null) as Json,
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
    metadata: (mission.metadata ?? null) as Json,
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
    metadata: { tag: obs.tag } as Json,
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

  // Process queued deletes
  await flushDeleteQueue();

  await refreshPendingCount();
}

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
        .from(`betc_${entry.table}` as 'betc_buildings')
        .delete()
        .eq('id', entry.supabaseId);

      if (error) {
        // PGRST = row not found (already deleted via CASCADE) — not an error
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
