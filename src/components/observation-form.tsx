import { useSignal } from '@preact/signals';
import { SelectField } from './ui/select-field';
import { TextField } from './ui/text-field';
import { PhotoCapture } from './ui/photo-capture';
import { addObservation } from '../db/operations';
import { savePhoto } from '../db/operations';
import { ETAGES, FACADES } from '../types';
import type { BatimentConfig } from '../types';

interface ObservationFormProps {
  visiteId: number;
  batiments: BatimentConfig[];
}

export function ObservationForm({ visiteId, batiments }: ObservationFormProps) {
  const batiment = useSignal(batiments[0]?.id ?? '');
  const cage = useSignal('');
  const etage = useSignal('');
  const facade = useSignal('');
  const observationText = useSignal('');
  const action = useSignal('');
  const photoBlob = useSignal<Blob | null>(null);
  const saving = useSignal(false);
  const error = useSignal('');

  const selectedBat = batiments.find((b) => b.id === batiment.value);
  const hasCages = selectedBat?.cages && selectedBat.cages.length > 0;

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!observationText.value.trim()) return;

    saving.value = true;
    error.value = '';

    try {
      let photoId: number | undefined;
      if (photoBlob.value) {
        photoId = await savePhoto({
          visiteId,
          blob: photoBlob.value,
          filename: `photo-${Date.now()}.jpg`,
        });
      }

      await addObservation({
        visiteId,
        batiment: batiment.value,
        cage: hasCages ? cage.value : undefined,
        etage: etage.value,
        facade: facade.value,
        observation: observationText.value.trim(),
        action: action.value.trim(),
        photoId,
      });

      // Clear form but keep location (saves time on same floor)
      observationText.value = '';
      action.value = '';
      photoBlob.value = null;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde';
    } finally {
      saving.value = false;
    }
  }

  return (
    <form onSubmit={handleSubmit} class="space-y-3 bg-white p-4 rounded-xl shadow-sm">
      <div class="grid grid-cols-2 gap-3">
        <SelectField
          label="Bâtiment"
          value={batiment.value}
          options={batiments.map((b) => b.id)}
          onChange={(v) => {
            batiment.value = v;
            cage.value = '';
          }}
        />
        {hasCages && (
          <SelectField
            label="Cage"
            value={cage.value}
            options={selectedBat!.cages!}
            onChange={(v) => (cage.value = v)}
            placeholder="Cage..."
          />
        )}
        <SelectField
          label="Étage"
          value={etage.value}
          options={ETAGES}
          onChange={(v) => (etage.value = v)}
          placeholder="Étage..."
        />
        <SelectField
          label="Façade"
          value={facade.value}
          options={['', ...FACADES]}
          onChange={(v) => (facade.value = v)}
          placeholder="Façade..."
        />
      </div>

      <TextField
        label="Observation"
        value={observationText.value}
        onChange={(v) => (observationText.value = v)}
        placeholder="Description de l'observation..."
      />

      <TextField
        label="Action corrective"
        value={action.value}
        onChange={(v) => (action.value = v)}
        placeholder="Action à entreprendre (optionnel)"
      />

      <PhotoCapture onCapture={(blob) => (photoBlob.value = blob)} />

      {error.value && (
        <p class="text-red-600 text-sm font-medium">{error.value}</p>
      )}

      <button
        type="submit"
        disabled={saving.value || !observationText.value.trim()}
        class="w-full min-h-[48px] bg-ic-blue text-white font-medium rounded-lg px-4 py-3 active:scale-95 touch-manipulation disabled:opacity-50 disabled:active:scale-100"
      >
        {saving.value ? 'Enregistrement...' : 'Ajouter l\'observation'}
      </button>
    </form>
  );
}
