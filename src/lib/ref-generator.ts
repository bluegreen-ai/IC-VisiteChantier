import type { MissionType } from '../types';

/** Prefix map for observation references */
const TYPE_PREFIX: Record<MissionType, string> = {
  diagnostic: 'D',
  suivi_chantier: 'V',
  reception: 'R',
  autre: 'O',
};

/** Generate observation reference: {prefix}{n}-{nn} (zero-padded) */
export function generateRef(missionType: MissionType, observationIndex: number, visitNumber?: number): string {
  const prefix = TYPE_PREFIX[missionType];
  const n = visitNumber ?? 1;
  const nn = String(observationIndex + 1).padStart(2, '0');
  return `${prefix}${n}-${nn}`;
}
