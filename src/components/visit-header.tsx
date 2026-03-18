import { useSignal } from '@preact/signals';
import { TextField } from './ui/text-field';
import type { Participant, BatimentConfig, Visite } from '../types';

const AULNAY_DEFAULTS = {
  titre_service: 'Suivi de réfection des balcons - Lot 12',
  client: 'SDC Le Gros Saule',
  residence: 'Résidence Savigny Impair',
  adresse: '1-50 avenue de Savigny',
  code_postal_ville: '93600 Aulnay-sous-Bois',
  ref_dossier: 'DE0328',
  batiments: [
    { id: 'A', label: 'Bâtiment A' },
    { id: 'B', label: 'Bâtiment B' },
    { id: 'C', label: 'Bâtiment C' },
    {
      id: 'D',
      label: 'Bâtiment D',
      cages: ['52 av. de Savigny', '54 av. de Savigny', '56 av. de Savigny'],
    },
  ] as BatimentConfig[],
  participants: [
    {
      nom: 'R. Laborbe',
      fonction: 'M.O Lot 12',
      entreprise: 'IC Ingénieurs Conseils',
      contact: '06 50 96 61 98',
    },
  ] as Participant[],
};

interface VisitHeaderProps {
  visite: Visite | null;
  onSave: (data: Partial<Visite>) => void;
}

export function VisitHeader({ visite, onSave }: VisitHeaderProps) {
  const expanded = useSignal(false);

  const titre = useSignal(visite?.titre_service ?? AULNAY_DEFAULTS.titre_service);
  const client = useSignal(visite?.client ?? AULNAY_DEFAULTS.client);
  const residence = useSignal(visite?.residence ?? AULNAY_DEFAULTS.residence);
  const adresse = useSignal(visite?.adresse ?? AULNAY_DEFAULTS.adresse);
  const codePostal = useSignal(visite?.code_postal_ville ?? AULNAY_DEFAULTS.code_postal_ville);
  const refDossier = useSignal(visite?.ref_dossier ?? AULNAY_DEFAULTS.ref_dossier);
  const batimentsVisites = useSignal(visite?.batiments_visites ?? 'Bâtiment A');
  const dateVisite = useSignal(
    visite?.date_visite
      ? visite.date_visite.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
  );
  const visitNumber = useSignal(visite?.visitNumber ?? 1);

  function handleSave() {
    onSave({
      titre_service: titre.value,
      client: client.value,
      residence: residence.value,
      adresse: adresse.value,
      code_postal_ville: codePostal.value,
      ref_dossier: refDossier.value,
      batiments_visites: batimentsVisites.value,
      date_visite: new Date(dateVisite.value),
      visitNumber: visitNumber.value,
      participants: AULNAY_DEFAULTS.participants,
      batiments: AULNAY_DEFAULTS.batiments,
    });
  }

  return (
    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <div class="px-4 py-3 flex items-center justify-between">
        <div>
          <h2 class="font-semibold text-ic-blue">{batimentsVisites.value}</h2>
          <p class="text-sm text-gray-500">{dateVisite.value} — V{visitNumber.value}</p>
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
          <TextField label="Titre service" value={titre.value} onChange={(v) => (titre.value = v)} />
          <TextField label="Client" value={client.value} onChange={(v) => (client.value = v)} />
          <TextField label="Résidence" value={residence.value} onChange={(v) => (residence.value = v)} />
          <TextField label="Bâtiment(s) visité(s)" value={batimentsVisites.value} onChange={(v) => (batimentsVisites.value = v)} />
          <TextField label="Adresse" value={adresse.value} onChange={(v) => (adresse.value = v)} />
          <TextField label="Code postal / Ville" value={codePostal.value} onChange={(v) => (codePostal.value = v)} />
          <TextField label="Réf. dossier" value={refDossier.value} onChange={(v) => (refDossier.value = v)} />

          <label class="block">
            <span class="text-sm font-medium text-gray-700">Date de visite</span>
            <input
              type="date"
              value={dateVisite.value}
              onInput={(e) => (dateVisite.value = (e.target as HTMLInputElement).value)}
              class="mt-1 block w-full min-h-[44px] rounded-lg border border-gray-300 px-3 py-2 text-base shadow-sm focus:border-ic-blue focus:ring-1 focus:ring-ic-blue touch-manipulation"
            />
          </label>

          <label class="block">
            <span class="text-sm font-medium text-gray-700">N° de visite</span>
            <input
              type="number"
              min="1"
              value={visitNumber.value}
              onInput={(e) => (visitNumber.value = parseInt((e.target as HTMLInputElement).value) || 1)}
              class="mt-1 block w-full min-h-[44px] rounded-lg border border-gray-300 px-3 py-2 text-base shadow-sm focus:border-ic-blue focus:ring-1 focus:ring-ic-blue touch-manipulation"
            />
          </label>

          <button
            onClick={handleSave}
            class="w-full min-h-[44px] bg-ic-blue text-white font-medium rounded-lg px-4 py-2 active:scale-95 touch-manipulation"
          >
            Enregistrer
          </button>
        </div>
      )}
    </div>
  );
}
