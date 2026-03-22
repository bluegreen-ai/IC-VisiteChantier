import { useSignal } from '@preact/signals';
import { TextField } from './ui/text-field';
import { SelectField } from './ui/select-field';
import { createMission, createBuilding } from '../db/operations';
import { MISSION_TYPES, BUILDING_TYPES } from '../types';
import type { MissionType, BuildingType } from '../types';

interface MissionCreateProps {
  onCreated: (missionId: number) => void;
  onCancel: () => void;
}

const TYPE_OPTIONS: { value: MissionType; label: string }[] = [
  { value: 'diagnostic', label: 'Diagnostic' },
  { value: 'suivi_chantier', label: 'Suivi chantier' },
  { value: 'reception', label: 'Réception' },
  { value: 'autre', label: 'Autre' },
];

export function MissionCreate({ onCreated, onCancel }: MissionCreateProps) {
  const name = useSignal('');
  const type = useSignal<MissionType>('diagnostic');
  const brief = useSignal('');
  const visitedAt = useSignal(new Date().toISOString().split('T')[0]);
  const buildingName = useSignal('');
  const buildingAddress = useSignal('');
  const buildingCity = useSignal('');
  const buildingPostalCode = useSignal('');
  const buildingType = useSignal<BuildingType>('other');
  const saving = useSignal(false);
  const error = useSignal('');
  const nameError = useSignal('');

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!name.value.trim()) {
      nameError.value = 'Le nom de la mission est obligatoire';
      return;
    }

    saving.value = true;
    error.value = '';
    nameError.value = '';

    try {
      let buildingId: number | undefined;
      if (buildingName.value.trim()) {
        buildingId = await createBuilding({
          name: buildingName.value.trim(),
          address: buildingAddress.value.trim() || undefined,
          city: buildingCity.value.trim() || undefined,
          postalCode: buildingPostalCode.value.trim() || undefined,
          buildingType: buildingType.value,
        });
      }

      const missionId = await createMission({
        name: name.value.trim(),
        type: type.value,
        status: 'active',
        brief: brief.value.trim() || undefined,
        visitedAt: visitedAt.value || undefined,
        buildingId,
      });

      onCreated(missionId);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erreur lors de la création';
    } finally {
      saving.value = false;
    }
  }

  return (
    <div class="px-4 py-3">
      <form onSubmit={handleSubmit} class="space-y-4">
        <div class="bg-white rounded-xl shadow-sm p-4 space-y-3">
          <h2 class="font-semibold text-betc-teal">Nouvelle mission</h2>

          <TextField
            label="Nom de la mission"
            value={name.value}
            onChange={(v) => { name.value = v; if (v.trim()) nameError.value = ''; }}
            placeholder="Diagnostic toiture Longjumeau..."
            error={nameError.value}
          />

          <SelectField
            label="Type"
            value={type.value}
            options={MISSION_TYPES as unknown as string[]}
            labels={TYPE_OPTIONS.map((o) => o.label)}
            onChange={(v) => (type.value = v as MissionType)}
          />

          <TextField
            label="Brief / objectif"
            value={brief.value}
            onChange={(v) => (brief.value = v)}
            placeholder="Affaissement toiture. Comprendre structure porteuse..."
            multiline
            rows={3}
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
        </div>

        <div class="bg-white rounded-xl shadow-sm p-4 space-y-3">
          <h3 class="text-sm font-semibold text-gray-600">Bâtiment (optionnel)</h3>

          <TextField
            label="Nom du bâtiment"
            value={buildingName.value}
            onChange={(v) => (buildingName.value = v)}
            placeholder="Tour A, Résidence Les Lilas..."
          />

          <div class="grid grid-cols-2 gap-3">
            <TextField
              label="Adresse"
              value={buildingAddress.value}
              onChange={(v) => (buildingAddress.value = v)}
              placeholder="12 rue..."
            />
            <TextField
              label="Ville"
              value={buildingCity.value}
              onChange={(v) => (buildingCity.value = v)}
              placeholder="Longjumeau"
            />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <TextField
              label="Code postal"
              value={buildingPostalCode.value}
              onChange={(v) => (buildingPostalCode.value = v)}
              placeholder="91160"
            />
            <SelectField
              label="Type de bâtiment"
              value={buildingType.value}
              options={BUILDING_TYPES as unknown as string[]}
              labels={['Logement collectif', 'ERP', 'Tertiaire', 'Industriel', 'Autre']}
              onChange={(v) => (buildingType.value = v as BuildingType)}
            />
          </div>
        </div>

        {error.value && (
          <p class="text-red-600 text-sm font-medium text-center">{error.value}</p>
        )}

        <div class="space-y-2">
          <button
            type="submit"
            disabled={saving.value}
            class="w-full min-h-[48px] bg-betc-teal text-white font-medium rounded-lg px-4 py-3 active:scale-95 touch-manipulation disabled:opacity-50 disabled:active:scale-100"
          >
            {saving.value ? 'Création...' : 'Créer la mission'}
          </button>

          <button
            type="button"
            onClick={onCancel}
            class="w-full min-h-[44px] text-gray-500 font-medium rounded-lg px-4 py-2 active:scale-95 touch-manipulation"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
