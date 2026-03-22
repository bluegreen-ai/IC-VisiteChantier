import Dexie, { type Table } from 'dexie';
import type { Visite, Observation, Photo } from '../types';

export class VisiteDB extends Dexie {
  visites!: Table<Visite, number>;
  observations!: Table<Observation, number>;
  photos!: Table<Photo, number>;

  constructor() {
    super('betclaw');
    this.version(1).stores({
      visites: '++id, createdAt',
      observations: '++id, visiteId, createdAt',
      photos: '++id, visiteId, observationId',
    });
  }
}

export const db = new VisiteDB();
