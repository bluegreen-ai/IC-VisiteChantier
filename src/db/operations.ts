import { db } from './schema';
import { syncRecord } from '../lib/supabase-sync';
import { user } from '../lib/auth';
import type { Mission, Building, Observation, Photo } from '../types';

// --- Buildings ---

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

export async function updateBuilding(id: number, data: Partial<Building>): Promise<void> {
  await db.buildings.update(id, { ...data, syncStatus: 'pending', updatedAt: new Date().toISOString() });
  syncRecord('buildings', id).catch(() => {});
}

export async function listBuildings(): Promise<Building[]> {
  return db.buildings.orderBy('createdAt').reverse().toArray();
}

export async function getBuilding(id: number): Promise<Building | undefined> {
  return db.buildings.get(id);
}

// --- Missions ---

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

export async function getMission(id: number): Promise<Mission | undefined> {
  return db.missions.get(id);
}

export async function updateMission(id: number, data: Partial<Mission>): Promise<void> {
  await db.missions.update(id, { ...data, syncStatus: 'pending', updatedAt: new Date().toISOString() });
  syncRecord('missions', id).catch(() => {});
}

export async function listMissions(): Promise<Mission[]> {
  return db.missions.orderBy('createdAt').reverse().toArray();
}

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

// --- Observations ---

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

  // Back-link photos to this observation so Supabase sync gets the observation_id
  if (data.photoIds?.length) {
    await linkPhotosToObservation(data.photoIds, id);
  }

  return id;
}

export async function updateObservation(id: number, data: Partial<Observation>): Promise<void> {
  await db.observations.update(id, { ...data, syncStatus: 'pending', updatedAt: new Date().toISOString() });
  syncRecord('observations', id).catch(() => {});

  // Back-link photos to this observation so Supabase sync gets the observation_id
  if (data.photoIds?.length) {
    await linkPhotosToObservation(data.photoIds, id);
  }
}

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

export async function getObservationsForMission(missionId: number): Promise<Observation[]> {
  return db.observations.where('missionId').equals(missionId).sortBy('createdAt');
}

export async function getObservationCount(missionId: number): Promise<number> {
  return db.observations.where('missionId').equals(missionId).count();
}

/** Set observationId on photos and re-trigger sync so Supabase gets the link */
async function linkPhotosToObservation(photoIds: number[], observationId: number): Promise<void> {
  for (const pid of photoIds) {
    await db.photos.update(pid, { observationId, syncStatus: 'pending' });
    syncRecord('photos', pid).catch(() => {});
  }
}

// --- Photos ---

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

export async function getPhoto(id: number): Promise<Photo | undefined> {
  return db.photos.get(id);
}

export async function getPhotos(ids: number[]): Promise<Photo[]> {
  if (!ids.length) return [];
  const photos = await db.photos.bulkGet(ids);
  return photos.filter((p): p is Photo => p !== undefined);
}

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
