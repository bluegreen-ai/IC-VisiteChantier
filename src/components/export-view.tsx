import { useSignal } from '@preact/signals';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { updateVisite, getVisite } from '../db/operations';
import { exportVisiteZip, triggerDownload } from '../lib/export-zip';
import { generateRef } from '../lib/ref-generator';
import { TextField } from './ui/text-field';
import type { Visite } from '../types';

interface ExportViewProps {
  visiteId: number;
}

export function ExportView({ visiteId }: ExportViewProps) {
  const objet = useSignal('');
  const synthese = useSignal('');
  const conclusion = useSignal('');
  const exporting = useSignal(false);
  const error = useSignal('');
  const loaded = useSignal(false);

  const observations = useLiveQuery(
    () => db.observations.where('visiteId').equals(visiteId).sortBy('createdAt'),
    [visiteId],
  );

  const visite = useLiveQuery(() => db.visites.get(visiteId), [visiteId]);

  // Load text fields from visite on first render
  if (visite && !loaded.value) {
    objet.value = visite.objet_visite;
    synthese.value = visite.synthese;
    conclusion.value = visite.conclusion;
    loaded.value = true;
  }

  const photoCount = observations?.filter((o) => o.photoId).length ?? 0;

  async function handleExport() {
    exporting.value = true;
    error.value = '';

    try {
      // Save text fields to visite
      await updateVisite(visiteId, {
        objet_visite: objet.value,
        synthese: synthese.value,
        conclusion: conclusion.value,
      });

      const blob = await exportVisiteZip(visiteId);
      const v = await getVisite(visiteId);
      const datePart = v?.date_visite?.toISOString().split('T')[0] ?? 'export';
      const batPart = v?.batiments_visites?.replace(/\s+/g, '-') ?? 'visite';
      triggerDownload(blob, `visite-${datePart}-${batPart}.zip`);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erreur lors de l\'export';
    } finally {
      exporting.value = false;
    }
  }

  if (!observations || !visite) {
    return <div class="text-center text-gray-400 py-8">Chargement...</div>;
  }

  return (
    <div class="space-y-4">
      <div class="bg-white rounded-xl shadow-sm p-4">
        <h2 class="font-semibold text-ic-blue mb-3">Récapitulatif</h2>
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
              <tr class="bg-ic-blue text-white">
                <th class="px-2 py-2 text-left">Réf</th>
                <th class="px-2 py-2 text-left">Localisation</th>
                <th class="px-2 py-2 text-left">Observation</th>
                <th class="px-2 py-2 text-center">📷</th>
              </tr>
            </thead>
            <tbody>
              {observations.map((obs, i) => (
                <tr key={obs.id} class={i % 2 === 0 ? 'bg-ic-blue-light' : ''}>
                  <td class="px-2 py-1.5 font-mono text-xs font-bold text-ic-blue">
                    {generateRef(visite.visitNumber, i)}
                  </td>
                  <td class="px-2 py-1.5 text-xs">
                    {[obs.cage, obs.etage, obs.facade ? `F.${obs.facade}` : ''].filter(Boolean).join(' — ')}
                  </td>
                  <td class="px-2 py-1.5 text-xs truncate max-w-[150px]">{obs.observation}</td>
                  <td class="px-2 py-1.5 text-center">{obs.photoId ? '✓' : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Text fields */}
      <div class="bg-white rounded-xl shadow-sm p-4 space-y-3">
        <TextField
          label="Objet de la visite"
          value={objet.value}
          onChange={(v) => (objet.value = v)}
          multiline
          rows={4}
          placeholder="IC Ingénieurs Conseils assure le suivi..."
        />
        <TextField
          label="Synthèse des observations"
          value={synthese.value}
          onChange={(v) => (synthese.value = v)}
          multiline
          rows={4}
          placeholder="L'inspection a permis..."
        />
        <TextField
          label="Conclusion"
          value={conclusion.value}
          onChange={(v) => (conclusion.value = v)}
          multiline
          rows={4}
          placeholder="La visite confirme..."
        />
      </div>

      {error.value && (
        <p class="text-red-600 text-sm font-medium text-center">{error.value}</p>
      )}

      <button
        onClick={handleExport}
        disabled={exporting.value || observations.length === 0}
        class="w-full min-h-[52px] bg-green-600 text-white font-semibold rounded-xl px-4 py-3 active:scale-95 touch-manipulation disabled:opacity-50 disabled:active:scale-100 text-lg"
      >
        {exporting.value ? 'Export en cours...' : `Exporter ZIP (${observations.length} obs.)`}
      </button>
    </div>
  );
}
