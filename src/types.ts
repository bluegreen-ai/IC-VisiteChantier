/** Matches the JSON schema expected by render_cr_visite.py */
export interface ExportContext {
  titre_service: string;
  client: string;
  residence: string;
  batiments_visites: string;
  adresse: string;
  code_postal_ville: string;
  ref_dossier: string;
  date_visite: string;
  participants: Participant[];
  objet_visite: string;
  synthese: string;
  observations: ExportObservation[];
  conclusion: string;
}

export interface Participant {
  nom: string;
  fonction: string;
  entreprise: string;
  contact: string;
}

/** Observation as stored in the export JSON */
export interface ExportObservation {
  ref: string;
  etage_facade: string;
  observation: string;
  action: string;
  photo: string;
}

/** Building configuration — supports optional named stairwells */
export interface BatimentConfig {
  id: string;
  label: string;
  cages?: string[];
}

/** Observation as stored in IndexedDB (richer than export) */
export interface Observation {
  id?: number;
  visiteId: number;
  batiment: string;
  cage?: string;
  etage: string;
  facade: string;
  observation: string;
  action: string;
  photoId?: number;
  createdAt: string;
}

/** Photo blob stored separately in IndexedDB */
export interface Photo {
  id?: number;
  visiteId: number;
  observationId?: number;
  blob: Blob;
  filename: string;
  createdAt: string;
}

/** Visit session stored in IndexedDB */
export interface Visite {
  id?: number;
  titre_service: string;
  client: string;
  residence: string;
  batiments_visites: string;
  adresse: string;
  code_postal_ville: string;
  ref_dossier: string;
  date_visite: Date;
  visitNumber: number;
  objet_visite: string;
  synthese: string;
  conclusion: string;
  participants: Participant[];
  batiments: BatimentConfig[];
  createdAt: string;
  updatedAt: string;
}

/** Floor and facade options */
export const ETAGES = [
  'RDC', '1er', '2ème', '3ème', '4ème', '5ème',
  '6ème', '7ème', '8ème', '9ème', '10ème', 'Général',
] as const;

export const FACADES = ['Nord', 'Sud', 'Est', 'Ouest'] as const;
