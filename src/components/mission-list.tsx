import { useLiveQuery } from 'dexie-react-hooks';
import { useSignal } from '@preact/signals';
import { db } from '../db/schema';
import { deleteMission } from '../db/operations';
import { flushPendingSync } from '../lib/supabase-sync';
import type { MissionType } from '../types';

interface MissionListProps {
  onSelectMission: (id: number) => void;
  onCreateMission: () => void;
}

const TYPE_LABELS: Record<MissionType, string> = {
  diagnostic: 'Diagnostic',
  suivi_chantier: 'Suivi chantier',
  reception: 'Réception',
  autre: 'Autre',
};

const TYPE_COLORS: Record<MissionType, string> = {
  diagnostic: 'bg-red-100 text-red-700',
  suivi_chantier: 'bg-blue-100 text-blue-700',
  reception: 'bg-green-100 text-green-700',
  autre: 'bg-gray-100 text-gray-700',
};

export function MissionList({ onSelectMission, onCreateMission }: MissionListProps) {
  const missions = useLiveQuery(() => db.missions.orderBy('createdAt').reverse().toArray());
  const buildings = useLiveQuery(() => db.buildings.toArray());
  const confirmDeleteId = useSignal<number | null>(null);

  if (!missions) return <div class="text-center text-gray-400 py-8">Chargement...</div>;

  const buildingMap = new Map((buildings ?? []).map((b) => [b.id!, b.name]));

  async function handleDelete(id: number) {
    await deleteMission(id);
    confirmDeleteId.value = null;
    flushPendingSync().catch(() => {});
  }

  return (
    <div class="px-4 py-3 space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-800">Missions</h2>
        <span class="text-sm text-gray-400">{missions.length} mission{missions.length !== 1 ? 's' : ''}</span>
      </div>

      {missions.length === 0 ? (
        <div class="text-center py-12">
          <p class="text-gray-400 mb-4">Aucune mission. Créez-en une pour commencer.</p>
          <button
            onClick={onCreateMission}
            class="bg-betc-teal text-white font-medium rounded-lg px-6 py-3 active:scale-95 touch-manipulation"
          >
            Nouvelle mission
          </button>
        </div>
      ) : (
        <div class="space-y-2">
          {missions.map((m) => (
            <div key={m.id}>
              <MissionCard
                name={m.name}
                type={m.type}
                date={m.visitedAt}
                buildingName={m.buildingId ? buildingMap.get(m.buildingId) : undefined}
                status={m.status}
                onClick={() => onSelectMission(m.id!)}
                onDelete={() => (confirmDeleteId.value = m.id!)}
              />
              {confirmDeleteId.value === m.id && (
                <div class="bg-red-50 border border-red-200 rounded-lg p-3 mt-1 flex items-center justify-between gap-2">
                  <span class="text-sm text-red-700">Supprimer cette mission et toutes ses observations ?</span>
                  <div class="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => (confirmDeleteId.value = null)}
                      class="text-sm text-gray-500 px-3 py-1.5 rounded-lg touch-manipulation min-h-[36px]"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => handleDelete(m.id!)}
                      class="text-sm text-white bg-red-600 px-3 py-1.5 rounded-lg touch-manipulation active:scale-95 min-h-[36px]"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {missions.length > 0 && (
        <button
          onClick={onCreateMission}
          class="fixed bottom-6 right-4 w-14 h-14 bg-betc-teal text-white text-2xl rounded-full shadow-lg flex items-center justify-center active:scale-95 touch-manipulation z-10"
          aria-label="Nouvelle mission"
        >
          +
        </button>
      )}
    </div>
  );
}

function MissionCard({
  name,
  type,
  date,
  buildingName,
  status,
  onClick,
  onDelete,
}: {
  name: string;
  type: MissionType;
  date?: string;
  buildingName?: string;
  status: string;
  onClick: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      class="bg-white rounded-xl shadow-sm p-4 active:bg-gray-50 touch-manipulation cursor-pointer"
      onClick={onClick}
    >
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0 flex-1">
          <h3 class="font-semibold text-gray-800 truncate">{name}</h3>
          <div class="flex items-center gap-2 mt-1 flex-wrap">
            <span class={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[type]}`}>
              {TYPE_LABELS[type]}
            </span>
            {date && <span class="text-xs text-gray-500">{date}</span>}
            {status === 'completed' && <span class="text-xs text-green-600 font-medium">Terminée</span>}
          </div>
          {buildingName && (
            <p class="text-sm text-betc-teal mt-1 truncate underline decoration-betc-teal/30">{buildingName}</p>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          class="text-gray-300 hover:text-red-500 text-lg flex-shrink-0 touch-manipulation min-h-[36px] min-w-[36px] flex items-center justify-center"
          aria-label="Supprimer"
        >
          ×
        </button>
      </div>
    </div>
  );
}
