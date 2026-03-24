import { signal, computed } from '@preact/signals';
import { supabase } from './supabase';
import { user } from './auth';
import { db } from '../db/schema';
import type { Building, Mission, Observation, Photo, SyncQueueEntry } from '../types';
import type { Json } from '../types/database.types';

// IC Ingénieurs Conseils org — seeded in Edifice schema
const IC_ORG_ID = '11111111-1111-1111-1111-111111111111';

// Local Dexie table name → Supabase table name
const SUPABASE_TABLE_MAP: Record<SyncQueueEntry['table'], string> = {
  buildings: 'edifice_buildings',
  missions: 'edifice_projects',
  observations: 'edifice_disorders',
  photos: 'edifice_photos',
};

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

/** Build full address from parts (Edifice has no city/postal_code columns) */
function buildAddress(building: Building): string | null {
  const parts = [building.address, building.postalCode, building.city].filter(Boolean);
  return parts.length ? parts.join(', ') : null;
}

/** Map BETClaw building types to Edifice CHECK constraint values */
const BUILDING_TYPE_MAP: Record<string, string> = {
  logement_collectif: 'apartment_building',
  erp: 'commercial',
  tertiaire: 'commercial',
  industriel: 'industrial',
  other: 'other',
};

function mapBuildingType(localType: string | undefined): string | null {
  if (!localType) return null;
  return BUILDING_TYPE_MAP[localType] ?? 'other';
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

  const { error } = await supabase.from('edifice_buildings').upsert(clean({
    id: building.supabaseId,
    organization_id: IC_ORG_ID,
    name: building.name,
    address: buildAddress(building),
    building_type: mapBuildingType(building.buildingType),
    latitude: building.latitude ?? null,
    longitude: building.longitude ?? null,
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

  // Resolve building supabaseId if linked — chain sync if needed
  let buildingSupabaseId: string | null = null;
  if (mission.buildingId) {
    let building = await db.buildings.get(mission.buildingId);
    if (building && building.syncStatus !== 'synced') {
      await syncBuilding(building);
      building = await db.buildings.get(mission.buildingId);
    }
    buildingSupabaseId = building?.supabaseId ?? null;
    if (mission.buildingId && !buildingSupabaseId) return;
  }

  const { error } = await supabase.from('edifice_projects').upsert(clean({
    id: mission.supabaseId,
    organization_id: IC_ORG_ID,
    building_id: buildingSupabaseId,
    created_by: userId,
    name: mission.name,
    reference_number: mission.referenceNumber ?? null,
    mission_context: mission.missionContext ?? mission.brief ?? null,
    status: mission.status ?? 'active',
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

  const { error } = await supabase.from('edifice_disorders').upsert(clean({
    id: obs.supabaseId,
    project_id: mission.supabaseId,
    created_by: userId,
    observation_type: obs.observationType ?? 'note',
    name: obs.name ?? obs.ref ?? obs.element ?? 'Observation',
    location: obs.location ?? null,
    ref: obs.ref ?? null,
    element: obs.element ?? null,
    description: obs.description,
    cause: obs.cause ?? null,
    recommendations: obs.recommendations ?? obs.action ?? null,
    display_order: obs.sortOrder ?? 0,
    metadata: { tag: obs.tag, ...obs.metadata } as Json,
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

  const storagePath = `${userId}/${mission.supabaseId}/${photo.supabaseId}.jpg`;

  try {
    // 1. Upload blob to Storage
    const { error: uploadError } = await supabase.storage
      .from('edifice-photos')
      .upload(storagePath, photo.blob, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // 2. Upsert metadata row
    // Note: edifice_photos requires width/height — use 0 as placeholder from field capture
    const { error: dbError } = await supabase.from('edifice_photos').upsert(clean({
      id: photo.supabaseId,
      project_id: mission.supabaseId,
      uploaded_by: userId,
      storage_path: storagePath,
      original_filename: photo.filename,
      file_size: photo.blob.size,
      width: 0,
      height: 0,
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

  // Sync in dependency order: buildings → projects → disorders → photos
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
          .from('edifice-photos')
          .remove(entry.storagePaths);
        if (error) console.warn('Storage cleanup failed (non-fatal):', error);
      }

      // 2. Delete DB row
      const tableName = SUPABASE_TABLE_MAP[entry.table];
      const { error } = await supabase
        .from(tableName as 'edifice_buildings')
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
