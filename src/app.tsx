import { signal } from '@preact/signals';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db/schema';
import { updateMission, getBuilding } from './db/operations';
import { session, authLoading, signOut } from './lib/auth';
import { LoginScreen } from './components/login-screen';
import { MissionList } from './components/mission-list';
import { MissionCreate } from './components/mission-create';
import { MissionHeader } from './components/mission-header';
import { ObservationForm } from './components/observation-form';
import { ObservationList } from './components/observation-list';
import { ExportView } from './components/export-view';
import { ChatView } from './components/chat-view';
import type { Mission, Building, Observation } from './types';

type View = 'missions' | 'create' | 'detail';
type DetailTab = 'observations' | 'chat' | 'export';

const currentView = signal<View>('missions');
const activeMissionId = signal<number | null>(null);
const activeTab = signal<DetailTab>('observations');
const editingObs = signal<Observation | null>(null);
const showObservationForm = signal(false);

function MissionDetail({ missionId }: { missionId: number }) {
  const mission = useLiveQuery(
    () => db.missions.get(missionId),
    [missionId],
  );

  const building = useLiveQuery(
    async () => {
      const m = await db.missions.get(missionId);
      return m?.buildingId ? getBuilding(m.buildingId) : undefined;
    },
    [missionId],
  );

  const obsCount = useLiveQuery(
    () => db.observations.where('missionId').equals(missionId).count(),
    [missionId],
  );

  async function handleMissionSave(data: Partial<Mission>) {
    await updateMission(missionId, data);
  }

  function handleEdit(obs: Observation) {
    editingObs.value = obs;
    showObservationForm.value = true;
  }

  return (
    <>
      <main class="flex-1 overflow-y-auto overscroll-contain min-h-0">
        {activeTab.value === 'observations' && (
          <div class="px-4 py-3 space-y-3">
            <MissionHeader
              mission={mission ?? null}
              building={building as Building | undefined}
              onSave={handleMissionSave}
            />
            <ObservationList
              missionId={missionId}
              missionType={mission?.type ?? 'autre'}
              onEdit={handleEdit}
            />
          </div>
        )}
        {activeTab.value === 'chat' && <ChatView />}
        {activeTab.value === 'export' && (
          <div class="px-4 py-3 space-y-3">
            <ExportView missionId={missionId} />
          </div>
        )}
      </main>

      {/* FAB — only on observations tab */}
      {activeTab.value === 'observations' && (
        <button
          onClick={() => { editingObs.value = null; showObservationForm.value = true; }}
          class="fixed bottom-20 right-4 z-30 w-14 h-14 bg-betc-teal text-white rounded-full shadow-lg flex items-center justify-center text-2xl touch-manipulation active:scale-95 transition-transform"
          aria-label="Add observation"
        >
          ＋
        </button>
      )}

      {/* Observation form overlay */}
      {showObservationForm.value && (
        <div class="fixed inset-0 z-40 bg-white flex flex-col">
          <header class="bg-betc-teal text-white px-4 py-3 pt-safe flex-shrink-0 flex items-center gap-2">
            <button
              onClick={() => { showObservationForm.value = false; editingObs.value = null; }}
              class="text-white/80 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2"
            >
              ←
            </button>
            <h2 class="text-lg font-bold">
              {editingObs.value ? 'Modifier observation' : 'Nouvelle observation'}
            </h2>
          </header>
          <main class="flex-1 overflow-y-auto overscroll-contain min-h-0 px-4 py-3">
            <ObservationForm
              missionId={missionId}
              observationCount={obsCount ?? 0}
              editingObservation={editingObs.value}
              onDone={() => { showObservationForm.value = false; editingObs.value = null; }}
            />
          </main>
        </div>
      )}

      {/* Bottom tab bar — 3 tabs */}
      <nav class="bg-white border-t border-gray-200 flex pb-safe flex-shrink-0">
        <button
          onClick={() => (activeTab.value = 'observations')}
          class={`flex-1 min-h-[52px] flex flex-col items-center justify-center gap-0.5 touch-manipulation ${
            activeTab.value === 'observations' ? 'text-betc-teal font-semibold' : 'text-gray-400'
          }`}
        >
          <span class="text-lg">📋</span>
          <span class="text-xs">Observations</span>
        </button>
        <button
          onClick={() => (activeTab.value = 'chat')}
          class={`flex-1 min-h-[52px] flex flex-col items-center justify-center gap-0.5 touch-manipulation ${
            activeTab.value === 'chat' ? 'text-betc-teal font-semibold' : 'text-gray-400'
          }`}
        >
          <span class="text-lg">💬</span>
          <span class="text-xs">Chat</span>
        </button>
        <button
          onClick={() => (activeTab.value = 'export')}
          class={`flex-1 min-h-[52px] flex flex-col items-center justify-center gap-0.5 touch-manipulation ${
            activeTab.value === 'export' ? 'text-betc-teal font-semibold' : 'text-gray-400'
          }`}
        >
          <span class="text-lg">📦</span>
          <span class="text-xs">Export</span>
        </button>
      </nav>
    </>
  );
}

function AuthenticatedApp() {
  function handleSelectMission(id: number) {
    activeMissionId.value = id;
    activeTab.value = 'observations';
    currentView.value = 'detail';
  }

  function handleCreateMission() {
    currentView.value = 'create';
  }

  function handleMissionCreated(id: number) {
    activeMissionId.value = id;
    activeTab.value = 'observations';
    currentView.value = 'detail';
  }

  function handleBack() {
    activeMissionId.value = null;
    editingObs.value = null;
    showObservationForm.value = false;
    currentView.value = 'missions';
  }

  return (
    <div class="h-dvh flex flex-col overflow-hidden">
      {/* Header */}
      <header class="bg-betc-teal text-white px-4 py-3 pt-safe flex-shrink-0 flex items-center justify-between">
        <div class="flex items-center gap-2">
          {currentView.value !== 'missions' && (
            <button
              onClick={handleBack}
              class="text-white/80 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2"
            >
              ←
            </button>
          )}
          <h1 class="text-lg font-bold">
            {currentView.value !== 'missions' ? 'Missions' : 'BETClaw'}
          </h1>
        </div>
        <button
          onClick={() => signOut()}
          class="text-white/70 text-sm touch-manipulation"
        >
          Déconnexion
        </button>
      </header>

      {/* Content */}
      {currentView.value === 'missions' && (
        <main class="flex-1 overflow-y-auto overscroll-contain min-h-0">
          <MissionList
            onSelectMission={handleSelectMission}
            onCreateMission={handleCreateMission}
          />
        </main>
      )}

      {currentView.value === 'create' && (
        <main class="flex-1 overflow-y-auto overscroll-contain min-h-0">
          <MissionCreate
            onCreated={handleMissionCreated}
            onCancel={handleBack}
          />
        </main>
      )}

      {currentView.value === 'detail' && activeMissionId.value && (
        <MissionDetail missionId={activeMissionId.value} />
      )}
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
