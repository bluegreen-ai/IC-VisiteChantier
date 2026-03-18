import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { ObservationCard } from './observation-card';
import type { Observation } from '../types';

interface ObservationListProps {
  visiteId: number;
  visitNumber: number;
  onEdit: (obs: Observation) => void;
}

export function ObservationList({ visiteId, visitNumber, onEdit }: ObservationListProps) {
  const observations = useLiveQuery(
    () => db.observations.where('visiteId').equals(visiteId).sortBy('createdAt'),
    [visiteId],
  );

  if (!observations) return <div class="text-center text-gray-400 py-4">Chargement...</div>;

  if (observations.length === 0) {
    return (
      <div class="text-center text-gray-400 py-8">
        Aucune observation. Ajoutez-en une ci-dessus.
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
          index={i}
          visitNumber={visitNumber}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}
