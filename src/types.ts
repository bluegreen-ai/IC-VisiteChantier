/** Tag categories for observations */
export const OBSERVATION_TAGS = [
  'structure', 'thermique', 'acces', 'environnement', 'general',
] as const;
export type ObservationTag = typeof OBSERVATION_TAGS[number];

/** Mission types */
export const MISSION_TYPES = [
  'diagnostic', 'suivi_chantier', 'reception', 'autre',
] as const;
export type MissionType = typeof MISSION_TYPES[number];

/** Mission statuses */
export const MISSION_STATUSES = ['active', 'completed', 'archived'] as const;
export type MissionStatus = typeof MISSION_STATUSES[number];

/** Sync status for IndexedDB → Supabase sync */
export type SyncStatus = 'pending' | 'synced' | 'error';

/** Entry in the offline delete sync queue */
export interface SyncQueueEntry {
  id?: number;
  operation: 'delete';
  table: 'buildings' | 'missions' | 'observations' | 'photos';
  supabaseId: string;
  storagePaths?: string[];
  createdAt: string;
}

/** Building types (matches Supabase betc_buildings.building_type) */
export const BUILDING_TYPES = [
  'logement_collectif', 'erp', 'tertiaire', 'industriel', 'other',
] as const;
export type BuildingType = typeof BUILDING_TYPES[number];

/** Building stored in IndexedDB */
export interface Building {
  id?: number;
  supabaseId?: string;
  syncStatus?: SyncStatus;
  name: string;
  address?: string;
  city?: string;
  postalCode?: string;
  buildingType?: BuildingType;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/** Mission stored in IndexedDB */
export interface Mission {
  id?: number;
  supabaseId?: string;
  syncStatus?: SyncStatus;
  buildingId?: number;
  name: string;
  type: MissionType;
  status: MissionStatus;
  brief?: string;
  visitedAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/** Observation stored in IndexedDB */
export interface Observation {
  id?: number;
  supabaseId?: string;
  syncStatus?: SyncStatus;
  missionId: number;
  ref?: string;
  element?: string;
  description: string;
  cause?: string;
  action?: string;
  tag: ObservationTag;
  photoIds: number[];
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/** Photo blob stored in IndexedDB */
export interface Photo {
  id?: number;
  supabaseId?: string;
  syncStatus?: SyncStatus;
  missionId: number;
  observationId?: number;
  blob: Blob;
  filename: string;
  createdAt: string;
}

/** Tag display config */
export const TAG_CONFIG: Record<ObservationTag, { label: string; color: string }> = {
  structure: { label: 'Structure', color: 'bg-red-100 text-red-700' },
  thermique: { label: 'Thermique', color: 'bg-orange-100 text-orange-700' },
  acces: { label: 'Accès', color: 'bg-blue-100 text-blue-700' },
  environnement: { label: 'Environnement', color: 'bg-green-100 text-green-700' },
  general: { label: 'Général', color: 'bg-gray-100 text-gray-700' },
};

/** Export context for BETClaw ZIP */
export interface ExportContext {
  betclaw_version: string;
  mission: {
    name: string;
    type: string;
    brief?: string;
    visited_at?: string;
    status: string;
  };
  building?: {
    name: string;
    address?: string;
    city?: string;
    building_type?: string;
  };
  observations: ExportObservation[];
}

export interface ExportObservation {
  ref: string;
  element?: string;
  description: string;
  cause?: string;
  action?: string;
  tag: string;
  photos: string[];
  timestamp: string;
}
