import { db } from './schema';
import type { Visite, Observation, Photo } from '../types';

// --- Visites ---

export async function createVisite(
  data: Omit<Visite, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<number> {
  const now = new Date().toISOString();
  return db.visites.add({ ...data, createdAt: now, updatedAt: now } as Visite);
}

export async function getVisite(id: number): Promise<Visite | undefined> {
  return db.visites.get(id);
}

export async function updateVisite(id: number, data: Partial<Visite>): Promise<void> {
  await db.visites.update(id, { ...data, updatedAt: new Date().toISOString() });
}

export async function listVisites(): Promise<Visite[]> {
  return db.visites.orderBy('createdAt').reverse().toArray();
}

export async function deleteVisite(id: number): Promise<void> {
  await db.transaction('rw', [db.visites, db.observations, db.photos], async () => {
    await db.photos.where('visiteId').equals(id).delete();
    await db.observations.where('visiteId').equals(id).delete();
    await db.visites.delete(id);
  });
}

// --- Observations ---

export async function addObservation(
  data: Omit<Observation, 'id' | 'createdAt'>,
): Promise<number> {
  return db.observations.add({
    ...data,
    createdAt: new Date().toISOString(),
  } as Observation);
}

export async function updateObservation(
  id: number,
  data: Partial<Observation>,
): Promise<void> {
  await db.observations.update(id, data);
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

export async function getObservationsForVisite(visiteId: number): Promise<Observation[]> {
  return db.observations.where('visiteId').equals(visiteId).sortBy('createdAt');
}

// --- Photos ---

export async function savePhoto(
  data: Omit<Photo, 'id' | 'createdAt'>,
): Promise<number> {
  try {
    return await db.photos.add({ ...data, createdAt: new Date().toISOString() } as Photo);
  } catch (err) {
    if ((err as DOMException).name === 'QuotaExceededError') {
      throw new Error('Stockage plein. Supprimez des photos ou des visites.');
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
