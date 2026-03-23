import { useSignal } from '@preact/signals';
import { useLiveQuery } from 'dexie-react-hooks';
import { TextField } from './ui/text-field';
import { SelectField } from './ui/select-field';
import { AddressInput } from './address-input';
import { createMission, createBuilding } from '../db/operations';
import { db } from '../db/schema';
import { MISSION_TYPES, BUILDING_TYPES } from '../types';
import type { MissionType, BuildingType, Building } from '../types';
import type { AddressSuggestion } from '../lib/address-autocomplete';

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
  // Address state
  const addressText = useSignal('');
  const selectedAddress = useSignal<AddressSuggestion | null>(null);
  const matchedBuilding = useSignal<Building | null>(null);
  const isNewBuilding = useSignal(false);
  const buildingName = useSignal('');
  const buildingType = useSignal<BuildingType>('other');

  // Mission state
  const name = useSignal('');
  const type = useSignal<MissionType>('diagnostic');
  const brief = useSignal('');
  const visitedAt = useSignal(new Date().toISOString().split('T')[0]);

  // UI state
  const saving = useSignal(false);
  const error = useSignal('');
  const nameError = useSignal('');
  const addressError = useSignal('');

  const buildings = useLiveQuery(() => db.buildings.toArray());

  function handleAddressSelect(suggestion: AddressSuggestion) {
    selectedAddress.value = suggestion;
    addressText.value = suggestion.label;

    // Try to match existing building by address
    const normalized = suggestion.label.trim().toLowerCase();
    const match = (buildings ?? []).find(
      (b) => b.address?.trim().toLowerCase() === normalized,
    );

    if (match) {
      matchedBuilding.value = match;
      isNewBuilding.value = false;
    } else {
      matchedBuilding.value = null;
      isNewBuilding.value = true;
      buildingName.value = '';
    }
    addressError.value = '';
  }

  function handleAddressChange(text: string) {
    addressText.value = text;
    // Reset selection when user types (invalidates previous choice)
    if (selectedAddress.value && text !== selectedAddress.value.label) {
      selectedAddress.value = null;
      matchedBuilding.value = null;
      isNewBuilding.value = false;
    }
  }

  function handleUseExisting() {
    // Confirmed — keep matchedBuilding, not new
    isNewBuilding.value = false;
  }

  function handleCreateNew() {
    // User wants a new building even though match was found
    matchedBuilding.value = null;
    isNewBuilding.value = true;
    buildingName.value = '';
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();

    // Validate address
    if (!selectedAddress.value && !addressText.value.trim()) {
      addressError.value = "L'adresse est obligatoire";
      return;
    }

    if (!name.value.trim()) {
      nameError.value = 'Le nom de la mission est obligatoire';
      return;
    }

    saving.value = true;
    error.value = '';
    nameError.value = '';
    addressError.value = '';

    try {
      let buildingId: number;

      if (matchedBuilding.value?.id) {
        // Reuse existing building
        buildingId = matchedBuilding.value.id;
      } else {
        // Create new building from address
        const addr = selectedAddress.value;
        buildingId = await createBuilding({
          name: buildingName.value.trim() || addr?.label || addressText.value.trim(),
          address: addr?.label || addressText.value.trim(),
          city: addr?.city,
          postalCode: addr?.postcode,
          buildingType: buildingType.value,
          latitude: addr?.coordinates[1],
          longitude: addr?.coordinates[0],
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

  const hasAddress = !!selectedAddress.value || addressText.value.trim().length > 0;
  const buildingResolved = !!matchedBuilding.value || isNewBuilding.value;

  return (
    <div class="px-4 py-3">
      <form onSubmit={handleSubmit} class="space-y-4">
        {/* Step 1: Address */}
        <div class="bg-white rounded-xl shadow-sm p-4 space-y-3">
          <h2 class="font-semibold text-betc-teal">Nouvelle mission</h2>

          <AddressInput
            value={addressText.value}
            onSelect={handleAddressSelect}
            onChange={handleAddressChange}
          />
          {addressError.value && (
            <p class="text-sm text-red-600">{addressError.value}</p>
          )}

          {/* Existing building match */}
          {selectedAddress.value && matchedBuilding.value && !isNewBuilding.value && (
            <div class="bg-teal-50 border border-teal-200 rounded-lg p-3">
              <p class="text-sm font-medium text-teal-800">
                Bâtiment existant : {matchedBuilding.value.name}
              </p>
              <p class="text-xs text-teal-600 mt-0.5">
                {matchedBuilding.value.address}
                {matchedBuilding.value.city && `, ${matchedBuilding.value.city}`}
              </p>
              <div class="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleUseExisting}
                  class="text-sm font-medium text-white bg-betc-teal px-3 py-1.5 rounded-lg touch-manipulation active:scale-95 min-h-[36px]"
                >
                  Utiliser
                </button>
                <button
                  type="button"
                  onClick={handleCreateNew}
                  class="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg touch-manipulation active:scale-95 min-h-[36px]"
                >
                  Créer nouveau
                </button>
              </div>
            </div>
          )}

          {/* New building fields */}
          {isNewBuilding.value && (
            <div class="border-t border-gray-100 pt-3 space-y-3">
              <h3 class="text-sm font-semibold text-gray-600">Nouveau bâtiment</h3>
              <TextField
                label="Nom du bâtiment"
                value={buildingName.value}
                onChange={(v) => (buildingName.value = v)}
                placeholder="Résidence Les Lilas, La Poste..."
              />
              <SelectField
                label="Type de bâtiment"
                value={buildingType.value}
                options={BUILDING_TYPES as unknown as string[]}
                labels={['Logement collectif', 'ERP', 'Tertiaire', 'Industriel', 'Autre']}
                onChange={(v) => (buildingType.value = v as BuildingType)}
              />
            </div>
          )}
        </div>

        {/* Step 2: Mission fields (shown when building is resolved) */}
        {(buildingResolved || (hasAddress && !selectedAddress.value)) && (
          <div class="bg-white rounded-xl shadow-sm p-4 space-y-3">
            <h3 class="text-sm font-semibold text-gray-600">Détails de la mission</h3>

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
        )}

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
