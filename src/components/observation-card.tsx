import { useSignal } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import { getPhotos, deleteObservation } from '../db/operations';
import { TAG_CONFIG } from '../types';
import type { Observation } from '../types';

interface ObservationCardProps {
  observation: Observation;
  refLabel: string;
  onEdit: (obs: Observation) => void;
}

export function ObservationCard({ observation, refLabel, onEdit }: ObservationCardProps) {
  const photoUrls = useSignal<string[]>([]);
  const deleting = useSignal(false);

  const tagConfig = TAG_CONFIG[observation.tag];

  useEffect(() => {
    if (observation.photoIds?.length) {
      getPhotos(observation.photoIds).then((photos) => {
        photoUrls.value = photos.map((p) => URL.createObjectURL(p.blob));
      });
    } else {
      photoUrls.value = [];
    }
    return () => {
      photoUrls.value.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [observation.photoIds?.join(',')]);

  async function handleDelete(e: Event) {
    e.stopPropagation();
    if (deleting.value) return;
    if (!confirm('Supprimer cette observation ?')) return;
    deleting.value = true;
    try {
      await deleteObservation(observation.id!);
    } catch (err) {
      console.error('Delete failed:', err);
      deleting.value = false;
    }
  }

  return (
    <div
      class="bg-white rounded-lg shadow-sm p-3 flex gap-3 active:bg-gray-50 touch-manipulation cursor-pointer"
      onClick={() => onEdit(observation)}
    >
      {/* Photo thumbnails */}
      {photoUrls.value.length > 0 && (
        <div class="flex flex-col gap-1 flex-shrink-0">
          {photoUrls.value.map((url, i) => (
            <img
              key={i}
              src={url}
              alt={`Photo ${refLabel}-${i + 1}`}
              class="w-14 h-14 object-cover rounded-md"
            />
          ))}
        </div>
      )}

      {/* Content */}
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <span class={`text-xs font-medium px-2 py-0.5 rounded-full ${tagConfig.color}`}>
            {tagConfig.label}
          </span>
          <span class="inline-block bg-betc-teal text-white text-xs font-bold px-2 py-0.5 rounded">
            {refLabel}
          </span>
          {observation.element && (
            <span class="text-xs text-gray-500 truncate">{observation.element}</span>
          )}
          {photoUrls.value.length > 0 && (
            <span class="text-xs text-gray-400">📷{photoUrls.value.length > 1 ? ` ×${photoUrls.value.length}` : ''}</span>
          )}
        </div>
        <p class="text-sm mt-1 line-clamp-2">{observation.description}</p>
        {observation.action && (
          <p class="text-xs text-action-orange italic mt-0.5">
            → {observation.action}
          </p>
        )}
      </div>

      {/* Delete button */}
      <button
        onClick={handleDelete}
        disabled={deleting.value}
        class="text-xs text-gray-400 min-h-[44px] min-w-[32px] flex items-center justify-center touch-manipulation self-start"
        aria-label="Supprimer"
      >
        🗑️
      </button>
    </div>
  );
}
