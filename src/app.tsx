import { signal } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db/schema';
import { createVisite, updateVisite } from './db/operations';
import { VisitHeader } from './components/visit-header';
import { ObservationForm } from './components/observation-form';
import { ObservationList } from './components/observation-list';
import { ExportView } from './components/export-view';
import type { Visite, BatimentConfig, Participant } from './types';

type View = 'capture' | 'export';
const currentView = signal<View>('capture');
const activeVisiteId = signal<number | null>(null);

const AULNAY_BATIMENTS: BatimentConfig[] = [
  { id: 'A', label: 'Bâtiment A' },
  { id: 'B', label: 'Bâtiment B' },
  { id: 'C', label: 'Bâtiment C' },
  {
    id: 'D',
    label: 'Bâtiment D',
    cages: ['52 av. de Savigny', '54 av. de Savigny', '56 av. de Savigny'],
  },
];

const DEFAULT_PARTICIPANTS: Participant[] = [
  {
    nom: 'R. Laborbe',
    fonction: 'M.O Lot 12',
    entreprise: 'IC Ingénieurs Conseils',
    contact: '06 50 96 61 98',
  },
];

export function App() {
  const visites = useLiveQuery(() => db.visites.orderBy('createdAt').reverse().toArray());
  const visite = useLiveQuery(
    () => (activeVisiteId.value ? db.visites.get(activeVisiteId.value) : undefined),
    [activeVisiteId.value],
  );

  // Auto-create or load existing visite
  useEffect(() => {
    if (!visites) return;
    if (visites.length > 0 && !activeVisiteId.value) {
      activeVisiteId.value = visites[0].id!;
    } else if (visites.length === 0) {
      createVisite({
        titre_service: 'Suivi de réfection des balcons - Lot 12',
        client: 'SDC Le Gros Saule',
        residence: 'Résidence Savigny Impair',
        batiments_visites: 'Bâtiment A',
        adresse: '1-50 avenue de Savigny',
        code_postal_ville: '93600 Aulnay-sous-Bois',
        ref_dossier: 'DE0328',
        date_visite: new Date(),
        visitNumber: 1,
        objet_visite: '',
        synthese: '',
        conclusion: '',
        participants: DEFAULT_PARTICIPANTS,
        batiments: AULNAY_BATIMENTS,
      }).then((id) => {
        activeVisiteId.value = id;
      });
    }
  }, [visites?.length]);

  async function handleVisiteSave(data: Partial<Visite>) {
    if (activeVisiteId.value) {
      await updateVisite(activeVisiteId.value, data);
    }
  }

  const batiments = visite?.batiments ?? AULNAY_BATIMENTS;
  const visitNumber = visite?.visitNumber ?? 1;

  return (
    <div class="min-h-screen flex flex-col pb-safe">
      {/* Header */}
      <header class="bg-ic-blue text-white px-4 py-3 pt-safe flex-shrink-0">
        <h1 class="text-lg font-bold">IC Visite Chantier</h1>
      </header>

      {/* Main content */}
      <main class="flex-1 overflow-y-auto overscroll-contain px-4 py-3 space-y-3">
        {activeVisiteId.value && currentView.value === 'capture' && (
          <>
            <VisitHeader visite={visite ?? null} onSave={handleVisiteSave} />
            <ObservationForm visiteId={activeVisiteId.value} batiments={batiments} />
            <ObservationList
              visiteId={activeVisiteId.value}
              visitNumber={visitNumber}
              onEdit={() => {/* TODO: edit modal */}}
            />
          </>
        )}
        {activeVisiteId.value && currentView.value === 'export' && (
          <ExportView visiteId={activeVisiteId.value} />
        )}
      </main>

      {/* Bottom tab bar */}
      <nav class="bg-white border-t border-gray-200 flex pb-safe flex-shrink-0">
        <button
          onClick={() => (currentView.value = 'capture')}
          class={`flex-1 min-h-[52px] flex flex-col items-center justify-center gap-0.5 touch-manipulation ${
            currentView.value === 'capture' ? 'text-ic-blue font-semibold' : 'text-gray-400'
          }`}
        >
          <span class="text-lg">📋</span>
          <span class="text-xs">Saisie</span>
        </button>
        <button
          onClick={() => (currentView.value = 'export')}
          class={`flex-1 min-h-[52px] flex flex-col items-center justify-center gap-0.5 touch-manipulation ${
            currentView.value === 'export' ? 'text-ic-blue font-semibold' : 'text-gray-400'
          }`}
        >
          <span class="text-lg">📦</span>
          <span class="text-xs">Export</span>
        </button>
      </nav>
    </div>
  );
}
