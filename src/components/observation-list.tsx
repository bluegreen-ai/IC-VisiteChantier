import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { ObservationCard } from './observation-card';
import { generateRef } from '../lib/ref-generator';
import type { Observation, MissionType } from '../types';

interface ObservationListProps {
  missionId: number;
  missionType: MissionType;
  onEdit: (obs: Observation) => void;
}

export function ObservationList({ missionId, missionType, onEdit }: ObservationListProps) {
  const observations = useLiveQuery(
    () => db.observations.where('missionId').equals(missionId).sortBy('createdAt'),
    [missionId],
  );

  if (!observations) return <div class="text-center text-gray-400 py-4">Chargement...</div>;

  if (observations.length === 0) {
    return (
      <div class="text-center text-gray-400 py-8">
        Aucune observation. Appuyez sur ＋ pour en ajouter.
      </div>
    );
  }

  return (
    <div class="space-y-2">
      <h3 class="text-sm font-medium text-gray-500">
        {observations.length} observation{observations.length > 1 ? 's' : ''}
      </h3>
      {observations.map((obs, i) => (
        <ObservationCard
          key={obs.id}
          observation={obs}
          refLabel={generateRef(missionType, i)}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}
