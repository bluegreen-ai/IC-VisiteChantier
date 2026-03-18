import { useSignal } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import { getPhoto, deleteObservation, deletePhoto } from '../db/operations';
import type { Observation } from '../types';

interface ObservationCardProps {
  observation: Observation;
  index: number;
  visitNumber: number;
  onEdit: (obs: Observation) => void;
}

export function ObservationCard({ observation, index, visitNumber, onEdit }: ObservationCardProps) {
  const photoUrl = useSignal('');
  const deleting = useSignal(false);

  const ref = `V${visitNumber}-${String(index + 1).padStart(2, '0')}`;
  const location = [observation.cage, observation.etage, observation.facade ? `Façade ${observation.facade}` : '']
    .filter(Boolean)
    .join(' — ');

  useEffect(() => {
    if (observation.photoId) {
      getPhoto(observation.photoId).then((photo) => {
        if (photo) {
          photoUrl.value = URL.createObjectURL(photo.blob);
        }
      });
    }
    return () => {
      if (photoUrl.value) URL.revokeObjectURL(photoUrl.value);
    };
  }, [observation.photoId]);

  async function handleDelete() {
    if (deleting.value) return;
    deleting.value = true;
    try {
      if (observation.photoId) await deletePhoto(observation.photoId);
      await deleteObservation(observation.id!);
    } catch (err) {
      console.error('Delete failed:', err);
      deleting.value = false;
    }
  }

  return (
    <div class="bg-white rounded-lg shadow-sm p-3 flex gap-3">
      {photoUrl.value && (
        <img
          src={photoUrl.value}
          alt={`Photo ${ref}`}
          class="w-16 h-16 object-cover rounded-md flex-shrink-0"
        />
      )}
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <span class="inline-block bg-ic-blue text-white text-xs font-bold px-2 py-0.5 rounded">
            {ref}
          </span>
          <span class="text-xs text-gray-500 truncate">{location}</span>
        </div>
        <p class="text-sm mt-1 line-clamp-2">{observation.observation}</p>
        {observation.action && (
          <p class="text-xs text-action-orange italic mt-0.5">
            → {observation.action}
          </p>
        )}
      </div>
      <div class="flex flex-col gap-1 flex-shrink-0">
        <button
          onClick={() => onEdit(observation)}
          class="text-xs text-gray-500 min-h-[32px] min-w-[32px] flex items-center justify-center touch-manipulation"
          aria-label="Modifier"
        >
          ✏️
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting.value}
          class="text-xs text-gray-500 min-h-[32px] min-w-[32px] flex items-center justify-center touch-manipulation"
          aria-label="Supprimer"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
