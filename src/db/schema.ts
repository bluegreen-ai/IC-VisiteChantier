import Dexie, { type Table } from 'dexie';
import type { Mission, Building, Observation, Photo } from '../types';

export class BETClawDB extends Dexie {
  buildings!: Table<Building, number>;
  missions!: Table<Mission, number>;
  observations!: Table<Observation, number>;
  photos!: Table<Photo, number>;

  constructor() {
    super('betclaw');

    // Version 2: BETClaw model (breaks from v1 IC-VisiteChantier)
    this.version(2).stores({
      buildings: '++id, createdAt',
      missions: '++id, buildingId, status, createdAt',
      observations: '++id, missionId, tag, sortOrder, createdAt',
      photos: '++id, missionId, observationId',
      // Delete old tables from v1
      visites: null,
    });

    // Keep v1 for migration path (Dexie requires it)
    this.version(1).stores({
      visites: '++id, createdAt',
      observations: '++id, visiteId, createdAt',
      photos: '++id, visiteId, observationId',
    });
  }
}

export const db = new BETClawDB();
