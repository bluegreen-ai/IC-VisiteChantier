import { useSignal } from '@preact/signals';
import { useEffect, useRef } from 'preact/hooks';
import { TextField } from './ui/text-field';
import { PhotoCapture } from './ui/photo-capture';
import type { CapturedPhoto } from './ui/photo-capture';
import { addObservation, updateObservation, savePhoto, getPhotos, deletePhoto } from '../db/operations';
import { OBSERVATION_TAGS, TAG_CONFIG } from '../types';
import type { Observation, ObservationTag } from '../types';

interface ObservationFormProps {
  missionId: number;
  observationCount: number;
  editingObservation?: Observation | null;
  onDone: () => void;
}

export function ObservationForm({ missionId, observationCount, editingObservation, onDone }: ObservationFormProps) {
  const element = useSignal('');
  const tag = useSignal<ObservationTag>('general');
  const description = useSignal('');
  const cause = useSignal('');
  const action = useSignal('');
  const photos = useSignal<CapturedPhoto[]>([]);
  const existingPhotoIds = useSignal<number[]>([]);
  const saving = useSignal(false);
  const error = useSignal('');
  const descriptionError = useSignal('');
  const descriptionRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const formKey = useSignal(0);

  const isEditing = !!editingObservation;

  useEffect(() => {
    if (editingObservation) {
      element.value = editingObservation.element ?? '';
      tag.value = editingObservation.tag;
      description.value = editingObservation.description;
      cause.value = editingObservation.cause ?? '';
      action.value = editingObservation.action ?? '';
      existingPhotoIds.value = editingObservation.photoIds ?? [];

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
    photos.value.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    element.value = '';
    tag.value = 'general';
    description.value = '';
    cause.value = '';
    action.value = '';
    photos.value = [];
    existingPhotoIds.value = [];
    error.value = '';
    descriptionError.value = '';
    formKey.value++;
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!description.value.trim()) {
      descriptionError.value = 'Ce champ est obligatoire';
      descriptionRef.current?.focus();
      return;
    }

    saving.value = true;
    error.value = '';
    descriptionError.value = '';

    try {
      const photoIds: number[] = [];

      if (isEditing) {
        for (const oldId of existingPhotoIds.value) {
          await deletePhoto(oldId);
        }
      }

      for (const photo of photos.value) {
        const id = await savePhoto({
          missionId,
          blob: photo.blob,
          filename: `photo-${Date.now()}-${photoIds.length}.jpg`,
        });
        photoIds.push(id);
      }

      if (isEditing && editingObservation) {
        await updateObservation(editingObservation.id!, {
          element: element.value.trim() || undefined,
          tag: tag.value,
          description: description.value.trim(),
          cause: cause.value.trim() || undefined,
          action: action.value.trim() || undefined,
          photoIds,
        });
      } else {
        await addObservation({
          missionId,
          element: element.value.trim() || undefined,
          tag: tag.value,
          description: description.value.trim(),
          cause: cause.value.trim() || undefined,
          action: action.value.trim() || undefined,
          photoIds,
          sortOrder: observationCount,
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
        <div class="flex items-center justify-between bg-betc-teal-light px-3 py-2 rounded-lg -mt-1 mb-1">
          <span class="text-sm font-medium text-betc-teal">Modification en cours</span>
          <button
            type="button"
            onClick={() => { resetForm(); onDone(); }}
            class="text-sm text-gray-500 underline touch-manipulation"
          >
            Annuler
          </button>
        </div>
      )}

      <TextField
        label="Élément observé"
        value={element.value}
        onChange={(v) => (element.value = v)}
        placeholder="Balcon 3ème, Poutre RDC, Zone affaissement..."
      />

      {/* Tag selector — horizontal pills */}
      <div>
        <span class="text-sm font-medium text-gray-700 block mb-1.5">Catégorie</span>
        <div class="flex flex-wrap gap-2">
          {OBSERVATION_TAGS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => (tag.value = t)}
              class={`px-3 py-1.5 rounded-full text-sm font-medium touch-manipulation ${
                tag.value === t ? TAG_CONFIG[t].color + ' ring-2 ring-offset-1' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {TAG_CONFIG[t].label}
            </button>
          ))}
        </div>
      </div>

      <TextField
        label="Description"
        value={description.value}
        onChange={(v) => { description.value = v; if (v.trim()) descriptionError.value = ''; }}
        placeholder="Fissure traversante de 5mm..."
        error={descriptionError.value}
        multiline
        rows={3}
        inputRef={descriptionRef}
      />

      <TextField
        label="Cause probable"
        value={cause.value}
        onChange={(v) => (cause.value = v)}
        placeholder="Infiltration d'eau (optionnel)"
      />

      <TextField
        label="Action corrective"
        value={action.value}
        onChange={(v) => (action.value = v)}
        placeholder="Reprise étanchéité (optionnel)"
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
        disabled={saving.value}
        class="w-full min-h-[48px] bg-betc-teal text-white font-medium rounded-lg px-4 py-3 active:scale-95 touch-manipulation disabled:opacity-50 disabled:active:scale-100"
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
