import { useSignal } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import { SelectField } from './ui/select-field';
import { TextField } from './ui/text-field';
import { PhotoCapture } from './ui/photo-capture';
import type { CapturedPhoto } from './ui/photo-capture';
import { addObservation, updateObservation, savePhoto, getPhotos, deletePhoto } from '../db/operations';
import { ETAGES, FACADES } from '../types';
import type { BatimentConfig, Observation } from '../types';

interface ObservationFormProps {
  visiteId: number;
  batiments: BatimentConfig[];
  editingObservation?: Observation | null;
  onDone: () => void;
}

export function ObservationForm({ visiteId, batiments, editingObservation, onDone }: ObservationFormProps) {
  const batiment = useSignal(batiments[0]?.id ?? '');
  const cage = useSignal('');
  const etage = useSignal('');
  const facade = useSignal('');
  const observationText = useSignal('');
  const action = useSignal('');
  const photos = useSignal<CapturedPhoto[]>([]);
  const existingPhotoIds = useSignal<number[]>([]);
  const saving = useSignal(false);
  const error = useSignal('');
  const formKey = useSignal(0);

  const isEditing = !!editingObservation;

  // Load editing observation data
  useEffect(() => {
    if (editingObservation) {
      batiment.value = editingObservation.batiment;
      cage.value = editingObservation.cage ?? '';
      etage.value = editingObservation.etage;
      facade.value = editingObservation.facade;
      observationText.value = editingObservation.observation;
      action.value = editingObservation.action;
      existingPhotoIds.value = editingObservation.photoIds ?? [];

      // Load existing photo blobs as previews
      if (editingObservation.photoIds?.length) {
        getPhotos(editingObservation.photoIds).then((dbPhotos) => {
          photos.value = dbPhotos.map((p) => ({
            blob: p.blob,
            previewUrl: URL.createObjectURL(p.blob),
            sizeMB: (p.blob.size / 1024 / 1024).toFixed(1),
          }));
        });
      } else {
        photos.value = [];
      }
    } else {
      resetForm();
    }
  }, [editingObservation?.id]);

  function resetForm() {
    // Clean up preview URLs
    photos.value.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    observationText.value = '';
    action.value = '';
    photos.value = [];
    existingPhotoIds.value = [];
    error.value = '';
    formKey.value++;
    // Keep batiment/etage/facade for faster same-floor capture
  }

  const selectedBat = batiments.find((b) => b.id === batiment.value);
  const hasCages = selectedBat?.cages && selectedBat.cages.length > 0;

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!observationText.value.trim()) return;

    saving.value = true;
    error.value = '';

    try {
      // Save new photos to IndexedDB
      const photoIds: number[] = [];

      if (isEditing) {
        // Delete old photos that were removed
        for (const oldId of existingPhotoIds.value) {
          await deletePhoto(oldId);
        }
      }

      for (const photo of photos.value) {
        const id = await savePhoto({
          visiteId,
          blob: photo.blob,
          filename: `photo-${Date.now()}-${photoIds.length}.jpg`,
        });
        photoIds.push(id);
      }

      if (isEditing && editingObservation) {
        await updateObservation(editingObservation.id!, {
          batiment: batiment.value,
          cage: hasCages ? cage.value : undefined,
          etage: etage.value,
          facade: facade.value,
          observation: observationText.value.trim(),
          action: action.value.trim(),
          photoIds,
        });
      } else {
        await addObservation({
          visiteId,
          batiment: batiment.value,
          cage: hasCages ? cage.value : undefined,
          etage: etage.value,
          facade: facade.value,
          observation: observationText.value.trim(),
          action: action.value.trim(),
          photoIds,
        });
      }

      resetForm();
      onDone();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde';
    } finally {
      saving.value = false;
    }
  }

  return (
    <form onSubmit={handleSubmit} class="space-y-3 bg-white p-4 rounded-xl shadow-sm" key={formKey.value}>
      {isEditing && (
        <div class="flex items-center justify-between bg-ic-blue-light px-3 py-2 rounded-lg -mt-1 mb-1">
          <span class="text-sm font-medium text-ic-blue">Modification en cours</span>
          <button
            type="button"
            onClick={() => { resetForm(); onDone(); }}
            class="text-sm text-gray-500 underline touch-manipulation"
          >
            Annuler
          </button>
        </div>
      )}

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

      <PhotoCapture
        photos={photos.value}
        onChange={(p) => (photos.value = p)}
      />

      {error.value && (
        <p class="text-red-600 text-sm font-medium">{error.value}</p>
      )}

      <button
        type="submit"
        disabled={saving.value || !observationText.value.trim()}
        class="w-full min-h-[48px] bg-ic-blue text-white font-medium rounded-lg px-4 py-3 active:scale-95 touch-manipulation disabled:opacity-50 disabled:active:scale-100"
      >
        {saving.value
          ? 'Enregistrement...'
          : isEditing
            ? 'Modifier l\'observation'
            : 'Ajouter l\'observation'}
      </button>
    </form>
  );
}
