import { useSignal } from '@preact/signals';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { exportMissionZip, triggerDownload, shareFile } from '../lib/export-zip';
import { generateRef } from '../lib/ref-generator';
import { TAG_CONFIG } from '../types';
import type { ObservationTag } from '../types';

interface ExportViewProps {
  missionId: number;
}

export function ExportView({ missionId }: ExportViewProps) {
  const preparing = useSignal(false);
  const error = useSignal('');
  const readyBlob = useSignal<Blob | null>(null);
  const readyFilename = useSignal('');

  const observations = useLiveQuery(
    () => db.observations.where('missionId').equals(missionId).sortBy('createdAt'),
    [missionId],
  );

  const mission = useLiveQuery(() => db.missions.get(missionId), [missionId]);

  const photoCount = observations?.reduce((sum, o) => sum + (o.photoIds?.length ?? 0), 0) ?? 0;

  async function handlePrepare() {
    preparing.value = true;
    error.value = '';
    readyBlob.value = null;
    try {
      const blob = await exportMissionZip(missionId);
      const datePart = mission?.visitedAt ?? 'export';
      const namePart = mission?.name?.replace(/\s+/g, '-').slice(0, 30) ?? 'mission';
      readyBlob.value = blob;
      readyFilename.value = `mission-${datePart}-${namePart}.zip`;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erreur lors de la préparation';
    } finally {
      preparing.value = false;
    }
  }

  async function handleShare() {
    if (!readyBlob.value) return;
    error.value = '';
    try {
      const shared = await shareFile(readyBlob.value, readyFilename.value);
      if (!shared) {
        triggerDownload(readyBlob.value, readyFilename.value);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      error.value = err instanceof Error ? err.message : 'Erreur lors du partage';
    }
  }

  function handleDownload() {
    if (!readyBlob.value) return;
    triggerDownload(readyBlob.value, readyFilename.value);
  }

  if (!observations || !mission) {
    return <div class="text-center text-gray-400 py-8">Chargement...</div>;
  }

  return (
    <div class="space-y-4">
      <div class="bg-white rounded-xl shadow-sm p-4">
        <h2 class="font-semibold text-betc-teal mb-3">Récapitulatif</h2>
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span class="text-gray-500">Observations</span>
            <p class="font-semibold text-lg">{observations.length}</p>
          </div>
          <div>
            <span class="text-gray-500">Photos</span>
            <p class="font-semibold text-lg">{photoCount}</p>
          </div>
        </div>
      </div>

      {/* Observations recap table */}
      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-betc-teal text-white">
                <th class="px-2 py-2 text-left">Réf</th>
                <th class="px-2 py-2 text-left">Élément</th>
                <th class="px-2 py-2 text-left">Tag</th>
                <th class="px-2 py-2 text-left">Description</th>
                <th class="px-2 py-2 text-center">📷</th>
              </tr>
            </thead>
            <tbody>
              {observations.map((obs, i) => {
                const tagConfig = TAG_CONFIG[obs.tag as ObservationTag];
                return (
                  <tr key={obs.id} class={i % 2 === 0 ? 'bg-betc-teal-light' : ''}>
                    <td class="px-2 py-1.5 font-mono text-xs font-bold text-betc-teal">
                      {generateRef(mission.type, i)}
                    </td>
                    <td class="px-2 py-1.5 text-xs truncate max-w-[80px]">
                      {obs.element ?? '—'}
                    </td>
                    <td class="px-2 py-1.5">
                      <span class={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${tagConfig?.color ?? ''}`}>
                        {tagConfig?.label ?? obs.tag}
                      </span>
                    </td>
                    <td class="px-2 py-1.5 text-xs truncate max-w-[150px]">{obs.description}</td>
                    <td class="px-2 py-1.5 text-center">{obs.photoIds?.length ? `${obs.photoIds.length}` : ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {error.value && (
        <p class="text-red-600 text-sm font-medium text-center">{error.value}</p>
      )}

      {!readyBlob.value ? (
        <button
          onClick={handlePrepare}
          disabled={preparing.value || observations.length === 0}
          class="w-full min-h-[52px] bg-green-600 text-white font-semibold rounded-xl px-4 py-3 active:scale-95 touch-manipulation disabled:opacity-50 disabled:active:scale-100 text-lg"
        >
          {preparing.value ? 'Préparation du ZIP...' : `Préparer le ZIP (${observations.length} obs.)`}
        </button>
      ) : (
        <div class="space-y-2">
          <button
            onClick={handleShare}
            class="w-full min-h-[52px] bg-green-600 text-white font-semibold rounded-xl px-4 py-3 active:scale-95 touch-manipulation text-lg"
          >
            Partager ZIP
          </button>
          <button
            onClick={handleDownload}
            class="w-full min-h-[44px] bg-gray-100 text-gray-700 font-medium rounded-xl px-4 py-2.5 active:scale-95 touch-manipulation text-sm"
          >
            Télécharger ZIP
          </button>
        </div>
      )}
    </div>
  );
}
