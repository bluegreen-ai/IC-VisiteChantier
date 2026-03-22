import { useSignal } from '@preact/signals';
import { TextField } from './ui/text-field';
import { SelectField } from './ui/select-field';
import { MISSION_TYPES, MISSION_STATUSES, BUILDING_TYPES } from '../types';
import type { Mission, Building, MissionType, MissionStatus, BuildingType } from '../types';
import { updateBuilding } from '../db/operations';

interface MissionHeaderProps {
  mission: Mission | null;
  building?: Building;
  onSave: (data: Partial<Mission>) => void;
}

const TYPE_LABELS: Record<MissionType, string> = {
  diagnostic: 'Diagnostic',
  suivi_chantier: 'Suivi chantier',
  reception: 'Réception',
  autre: 'Autre',
};

const STATUS_LABELS: Record<MissionStatus, string> = {
  active: 'Active',
  completed: 'Terminée',
  archived: 'Archivée',
};

const TYPE_BADGE_COLORS: Record<MissionType, string> = {
  diagnostic: 'bg-red-100 text-red-700',
  suivi_chantier: 'bg-blue-100 text-blue-700',
  reception: 'bg-green-100 text-green-700',
  autre: 'bg-gray-100 text-gray-700',
};

const BUILDING_TYPE_LABELS: Record<BuildingType, string> = {
  logement_collectif: 'Logement collectif',
  erp: 'ERP',
  tertiaire: 'Tertiaire',
  industriel: 'Industriel',
  other: 'Autre',
};

export function MissionHeader({ mission, building, onSave }: MissionHeaderProps) {
  const expanded = useSignal(false);

  const name = useSignal(mission?.name ?? '');
  const type = useSignal<MissionType>(mission?.type ?? 'diagnostic');
  const brief = useSignal(mission?.brief ?? '');
  const visitedAt = useSignal(mission?.visitedAt ?? new Date().toISOString().split('T')[0]);
  const status = useSignal<MissionStatus>(mission?.status ?? 'active');

  const bldgName = useSignal(building?.name ?? '');
  const bldgAddress = useSignal(building?.address ?? '');
  const bldgCity = useSignal(building?.city ?? '');
  const bldgPostalCode = useSignal(building?.postalCode ?? '');
  const bldgType = useSignal<BuildingType>(building?.buildingType ?? 'other');

  async function handleSave() {
    onSave({
      name: name.value,
      type: type.value,
      brief: brief.value || undefined,
      visitedAt: visitedAt.value || undefined,
      status: status.value,
    });
    if (building?.id) {
      await updateBuilding(building.id, {
        name: bldgName.value,
        address: bldgAddress.value || undefined,
        city: bldgCity.value || undefined,
        postalCode: bldgPostalCode.value || undefined,
        buildingType: bldgType.value,
      });
    }
  }

  if (!mission) return null;

  return (
    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <div class="px-4 py-3 flex items-center justify-between">
        <div class="min-w-0 flex-1">
          <h2 class="font-semibold text-betc-teal truncate">{mission.name}</h2>
          <div class="flex items-center gap-2 mt-0.5">
            <span class={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_BADGE_COLORS[mission.type]}`}>
              {TYPE_LABELS[mission.type]}
            </span>
            {mission.visitedAt && <span class="text-xs text-gray-500">{mission.visitedAt}</span>}
          </div>
          {building && (
            <p class="text-xs text-gray-400 mt-0.5 truncate">
              {building.name}
              {building.address && ` — ${building.address}`}
              {building.city && `, ${building.city}`}
            </p>
          )}
        </div>
        <button
          onClick={() => (expanded.value = !expanded.value)}
          class="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-500 touch-manipulation"
        >
          {expanded.value ? '▲' : '▼'}
        </button>
      </div>

      {expanded.value && (
        <div class="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
          <TextField label="Nom" value={name.value} onChange={(v) => (name.value = v)} />

          <SelectField
            label="Type"
            value={type.value}
            options={MISSION_TYPES as unknown as string[]}
            labels={Object.values(TYPE_LABELS)}
            onChange={(v) => (type.value = v as MissionType)}
          />

          <SelectField
            label="Statut"
            value={status.value}
            options={MISSION_STATUSES as unknown as string[]}
            labels={Object.values(STATUS_LABELS)}
            onChange={(v) => (status.value = v as MissionStatus)}
          />

          <TextField
            label="Brief"
            value={brief.value}
            onChange={(v) => (brief.value = v)}
            multiline
            rows={3}
            placeholder="Objectif de la mission..."
          />

          <label class="block">
            <span class="text-sm font-medium text-gray-700">Date de visite</span>
            <input
              type="date"
              value={visitedAt.value}
              onInput={(e) => (visitedAt.value = (e.target as HTMLInputElement).value)}
              class="mt-1 block w-full min-h-[44px] rounded-lg border border-gray-300 px-3 py-2 text-base shadow-sm focus:border-betc-teal focus:ring-1 focus:ring-betc-teal touch-manipulation"
            />
          </label>

          {building && (
            <div class="border-t border-gray-100 pt-3 space-y-3">
              <h3 class="text-sm font-semibold text-gray-600">Bâtiment</h3>
              <TextField label="Nom" value={bldgName.value} onChange={(v) => (bldgName.value = v)} />
              <div class="grid grid-cols-2 gap-3">
                <TextField label="Adresse" value={bldgAddress.value} onChange={(v) => (bldgAddress.value = v)} />
                <TextField label="Ville" value={bldgCity.value} onChange={(v) => (bldgCity.value = v)} />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <TextField label="Code postal" value={bldgPostalCode.value} onChange={(v) => (bldgPostalCode.value = v)} />
                <SelectField
                  label="Type"
                  value={bldgType.value}
                  options={BUILDING_TYPES as unknown as string[]}
                  labels={Object.values(BUILDING_TYPE_LABELS)}
                  onChange={(v) => (bldgType.value = v as BuildingType)}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleSave}
            class="w-full min-h-[44px] bg-betc-teal text-white font-medium rounded-lg px-4 py-2 active:scale-95 touch-manipulation"
          >
            Enregistrer
          </button>
        </div>
      )}
    </div>
  );
}
