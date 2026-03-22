import { signal } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db/schema';
import { createVisite, updateVisite } from './db/operations';
import { session, authLoading, signOut } from './lib/auth';
import { LoginScreen } from './components/login-screen';
import { VisitHeader } from './components/visit-header';
import { ObservationForm } from './components/observation-form';
import { ObservationList } from './components/observation-list';
import { ExportView } from './components/export-view';
import { ChatView } from './components/chat-view';
import type { Visite, Observation } from './types';

type View = 'chat' | 'add' | 'list' | 'export';
const currentView = signal<View>('chat');
const activeVisiteId = signal<number | null>(null);
const editingObs = signal<Observation | null>(null);

function AuthenticatedApp() {
  const visites = useLiveQuery(() => db.visites.orderBy('createdAt').reverse().toArray());
  const visite = useLiveQuery(
    () => (activeVisiteId.value ? db.visites.get(activeVisiteId.value) : undefined),
    [activeVisiteId.value],
  );

  const obsCount = useLiveQuery(
    () => activeVisiteId.value
      ? db.observations.where('visiteId').equals(activeVisiteId.value).count()
      : 0,
    [activeVisiteId.value],
  );

  // Auto-create or load existing visite
  useEffect(() => {
    if (!visites) return;
    if (visites.length > 0 && !activeVisiteId.value) {
      activeVisiteId.value = visites[0].id!;
    } else if (visites.length === 0) {
      createVisite({
        titre_service: '',
        client: '',
        residence: '',
        batiments_visites: '',
        adresse: '',
        code_postal_ville: '',
        ref_dossier: '',
        date_visite: new Date(),
        visitNumber: 1,
        objet_visite: '',
        synthese: '',
        conclusion: '',
        participants: [],
        batiments: [],
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

  function handleEdit(obs: Observation) {
    editingObs.value = obs;
    currentView.value = 'add';
  }

  function handleFormDone() {
    editingObs.value = null;
  }

  const batiments = visite?.batiments ?? [];
  const visitNumber = visite?.visitNumber ?? 1;

  return (
    <div class="h-dvh flex flex-col overflow-hidden">
      {/* Header */}
      <header class="bg-betc-teal text-white px-4 py-3 pt-safe flex-shrink-0 flex items-center justify-between">
        <h1 class="text-lg font-bold">BETClaw</h1>
        <button
          onClick={() => signOut()}
          class="text-white/70 text-sm touch-manipulation"
        >
          Déconnexion
        </button>
      </header>

      {/* Main content */}
      <main class="flex-1 overflow-y-auto overscroll-contain min-h-0">
        {currentView.value === 'chat' && (
          <ChatView />
        )}
        {activeVisiteId.value && currentView.value === 'add' && (
          <div class="px-4 py-3 space-y-3">
            <VisitHeader visite={visite ?? null} onSave={handleVisiteSave} />
            <ObservationForm
              visiteId={activeVisiteId.value}
              batiments={batiments}
              editingObservation={editingObs.value}
              onDone={handleFormDone}
            />
          </div>
        )}
        {activeVisiteId.value && currentView.value === 'list' && (
          <div class="px-4 py-3 space-y-3">
            <ObservationList
              visiteId={activeVisiteId.value}
              visitNumber={visitNumber}
              onEdit={handleEdit}
            />
          </div>
        )}
        {activeVisiteId.value && currentView.value === 'export' && (
          <div class="px-4 py-3 space-y-3">
            <ExportView visiteId={activeVisiteId.value} />
          </div>
        )}
      </main>

      {/* Bottom tab bar */}
      <nav class="bg-white border-t border-gray-200 flex pb-safe flex-shrink-0">
        <button
          onClick={() => (currentView.value = 'chat')}
          class={`flex-1 min-h-[52px] flex flex-col items-center justify-center gap-0.5 touch-manipulation ${
            currentView.value === 'chat' ? 'text-betc-teal font-semibold' : 'text-gray-400'
          }`}
        >
          <span class="text-lg">💬</span>
          <span class="text-xs">Chat</span>
        </button>
        <button
          onClick={() => { editingObs.value = null; currentView.value = 'add'; }}
          class={`flex-1 min-h-[52px] flex flex-col items-center justify-center gap-0.5 touch-manipulation ${
            currentView.value === 'add' ? 'text-betc-teal font-semibold' : 'text-gray-400'
          }`}
        >
          <span class="text-xl">＋</span>
          <span class="text-xs">Ajouter</span>
        </button>
        <button
          onClick={() => (currentView.value = 'list')}
          class={`flex-1 min-h-[52px] flex flex-col items-center justify-center gap-0.5 touch-manipulation relative ${
            currentView.value === 'list' ? 'text-betc-teal font-semibold' : 'text-gray-400'
          }`}
        >
          <span class="text-lg">📋</span>
          <span class="text-xs">Observations</span>
          {(obsCount ?? 0) > 0 && (
            <span class="absolute top-1.5 right-1/4 bg-betc-teal text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center">
              {obsCount}
            </span>
          )}
        </button>
        <button
          onClick={() => (currentView.value = 'export')}
          class={`flex-1 min-h-[52px] flex flex-col items-center justify-center gap-0.5 touch-manipulation ${
            currentView.value === 'export' ? 'text-betc-teal font-semibold' : 'text-gray-400'
          }`}
        >
          <span class="text-lg">📦</span>
          <span class="text-xs">Export</span>
        </button>
      </nav>
    </div>
  );
}

export function App() {
  if (authLoading.value) {
    return (
      <div class="h-dvh flex items-center justify-center bg-gray-50">
        <div class="text-center">
          <h1 class="text-2xl font-bold text-betc-teal">BETClaw</h1>
          <p class="text-gray-400 mt-2">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!session.value) {
    return <LoginScreen />;
  }

  return <AuthenticatedApp />;
}
