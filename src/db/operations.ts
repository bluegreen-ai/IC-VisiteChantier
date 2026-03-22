import { db } from './schema';
import type { Mission, Building, Observation, Photo } from '../types';

// --- Buildings ---

export async function createBuilding(
  data: Omit<Building, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<number> {
  const now = new Date().toISOString();
  return db.buildings.add({ ...data, createdAt: now, updatedAt: now } as Building);
}

export async function listBuildings(): Promise<Building[]> {
  return db.buildings.orderBy('createdAt').reverse().toArray();
}

export async function getBuilding(id: number): Promise<Building | undefined> {
  return db.buildings.get(id);
}

// --- Missions ---

export async function createMission(
  data: Omit<Mission, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<number> {
  const now = new Date().toISOString();
  return db.missions.add({ ...data, createdAt: now, updatedAt: now } as Mission);
}

export async function getMission(id: number): Promise<Mission | undefined> {
  return db.missions.get(id);
}

export async function updateMission(id: number, data: Partial<Mission>): Promise<void> {
  await db.missions.update(id, { ...data, updatedAt: new Date().toISOString() });
}

export async function listMissions(): Promise<Mission[]> {
  return db.missions.orderBy('createdAt').reverse().toArray();
}

export async function deleteMission(id: number): Promise<void> {
  await db.transaction('rw', [db.missions, db.observations, db.photos], async () => {
    await db.photos.where('missionId').equals(id).delete();
    await db.observations.where('missionId').equals(id).delete();
    await db.missions.delete(id);
  });
}

// --- Observations ---

export async function addObservation(
  data: Omit<Observation, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<number> {
  const now = new Date().toISOString();
  return db.observations.add({ ...data, createdAt: now, updatedAt: now } as Observation);
}

export async function updateObservation(id: number, data: Partial<Observation>): Promise<void> {
  await db.observations.update(id, { ...data, updatedAt: new Date().toISOString() });
}

export async function deleteObservation(id: number): Promise<void> {
  const obs = await db.observations.get(id);
  await db.transaction('rw', [db.observations, db.photos], async () => {
    if (obs?.photoIds?.length) {
      await db.photos.bulkDelete(obs.photoIds);
    }
    await db.observations.delete(id);
  });
}

export async function getObservationsForMission(missionId: number): Promise<Observation[]> {
  return db.observations.where('missionId').equals(missionId).sortBy('createdAt');
}

export async function getObservationCount(missionId: number): Promise<number> {
  return db.observations.where('missionId').equals(missionId).count();
}

// --- Photos ---

export async function savePhoto(
  data: Omit<Photo, 'id' | 'createdAt'>,
): Promise<number> {
  try {
    return await db.photos.add({ ...data, createdAt: new Date().toISOString() } as Photo);
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
  await db.photos.delete(id);
}
