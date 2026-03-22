# Feature: Passe 3 — Capture Observations (BETClaw Model)

The following plan should be complete, but validate documentation and codebase patterns before implementing.

Pay special attention to naming of existing utils, types, and models. Import from the right files.

## Feature Description

Replace the old IC-VisiteChantier data model (Visite/étage/façade/cage) with the BETClaw model (Mission/Building/Observation with free-text `element` + tags). This is the **core field capture pass** — everything the engineer needs to capture observations on-site with photos.

The scope includes:
1. New TypeScript types aligned with Supabase `betc_*` schema
2. Updated Dexie.js schema (IndexedDB) for offline-first storage
3. Mission list + creation screen (replaces auto-created single Visite)
4. Observation form with `element` (free text) + `tag` selector (replaces hardcoded étage/façade)
5. Updated observation cards and list
6. Updated export (ZIP with new context.json format)

**No Supabase sync in this pass** — that's Passe 4. IndexedDB remains the sole data store.

## User Story

As a BET field engineer
I want to create missions and capture observations with photos, free-text element descriptions, and category tags
So that I can document any type of site visit (not just balcony inspections with fixed floor/facade grids)

## Problem Statement

The current model is hardcoded for one use case (Aulnay balcony follow-up): fixed ETAGES, FACADES, cage dropdowns. The BETClaw model must support any mission type — diagnostic toiture, suivi chantier, réception — where the observation structure varies.

## Solution Statement

Replace the rigid geography-based observation model with a flexible one:
- **Mission** (replaces Visite) = a site visit with name, type, brief, date, building reference
- **Observation** = element (free text) + description + cause + action + tag + photos
- **Building** = optional reference (name + address + type)
- **Tags** = `structure | thermique | acces | environnement | general` (selectable per observation)

## Feature Metadata

**Feature Type**: Refactor + Enhancement
**Estimated Complexity**: High (touches every layer: types, DB, forms, cards, export)
**Primary Systems Affected**: types.ts, db/*, components/*, lib/export-zip.ts, lib/ref-generator.ts, app.tsx
**Dependencies**: None new — all existing libs (Dexie, Preact, JSZip)

---

## CONTEXT REFERENCES

### Relevant Codebase Files — YOU MUST READ THESE BEFORE IMPLEMENTING!

**Data Model (must rewrite):**
- `src/types.ts` (all 93 lines) — Current Visite/Observation/Photo model. Replace entirely.
- `src/db/schema.ts` (all 20 lines) — Dexie schema. Must add missions/buildings tables, update observations.
- `src/db/operations.ts` (all 93 lines) — CRUD functions. Rewrite for new model.

**Components (must rewrite):**
- `src/app.tsx` (all 190 lines) — Root component. Replace Visite-based routing with Mission-based.
- `src/components/observation-form.tsx` (all 232 lines) — Remove ETAGES/FACADES dropdowns, add element + tag.
- `src/components/observation-card.tsx` (all 102 lines) — Update location display, add tag badge.
- `src/components/observation-list.tsx` (all 45 lines) — Minor: rename visiteId → missionId.
- `src/components/visit-header.tsx` (all 100 lines) — Rewrite as mission-header with new fields.
- `src/components/export-view.tsx` (all 212 lines) — Update table columns, new context format.

**Lib (must update):**
- `src/lib/export-zip.ts` (all 103 lines) — New ExportContext format, remove buildEtageFacade.
- `src/lib/ref-generator.ts` (all 5 lines) — Add mission type prefix (D for diagnostic, V for visite).

**Keep unchanged:**
- `src/components/ui/photo-capture.tsx` — Reusable, no model dependency.
- `src/components/ui/text-field.tsx` — Reusable.
- `src/components/ui/select-field.tsx` — Reusable.
- `src/components/chat-view.tsx` — Independent.
- `src/components/login-screen.tsx` — Independent.
- `src/lib/auth.ts` — Independent.
- `src/lib/supabase.ts` — Independent.
- `src/lib/openclaw-client.ts` — Independent.

**Reference (read for field names):**
- `src/types/database.types.ts` — Supabase-generated types. Use field names from `betc_missions`, `betc_observations`, `betc_buildings` as source of truth for naming.
- `supabase/migrations/001_create_betc_tables.sql` — SQL schema for reference.

### New Files to Create

- `src/components/mission-list.tsx` — List of missions with cards
- `src/components/mission-create.tsx` — Create mission form (name, type, brief, date, building)
- `src/components/mission-detail.tsx` — Wrapper for observation capture within a mission

No new lib files needed.

### Patterns to Follow

**Preact + Signals pattern (from existing components):**
```tsx
import { useSignal } from '@preact/signals';
export function ComponentName({ prop }: Props) {
  const state = useSignal(initialValue);
  return <div>{/* JSX */}</div>;
}
```

**Dexie live query pattern (from app.tsx:21-32):**
```tsx
const items = useLiveQuery(
  () => db.tableName.where('foreignKey').equals(id).sortBy('createdAt'),
  [id],
);
```

**IndexedDB operations pattern (from db/operations.ts):**
```tsx
export async function createThing(data: Omit<Thing, 'id' | 'createdAt'>): Promise<number> {
  const now = new Date().toISOString();
  return db.things.add({ ...data, createdAt: now } as Thing);
}
```

**Touch-friendly UI pattern (from observation-form.tsx):**
- `min-h-[44px]` on all tap targets (iOS minimum)
- `touch-manipulation` on all interactive elements
- `active:scale-95` for button feedback
- `pb-safe` / `pt-safe` for device notches

**Color scheme:**
- Primary: `bg-betc-teal` / `text-betc-teal` (#0F766E)
- Light bg: `bg-betc-teal-light`
- Action/warning: `text-action-orange` (#804000)
- Cards: `bg-white rounded-xl shadow-sm p-4`

---

## IMPLEMENTATION PLAN

### Phase 1: Foundation — New Types + DB Schema

Replace the data model. Everything else depends on this.

1. Rewrite `src/types.ts` with Mission, Building, Observation (new shape), Photo, Tag constants
2. Update `src/db/schema.ts` — new Dexie tables: missions, buildings, observations, photos
3. Rewrite `src/db/operations.ts` — CRUD for missions, buildings, observations, photos

### Phase 2: Core — Mission Management

New screens for creating and selecting missions.

4. Create `src/components/mission-list.tsx` — cards for each mission
5. Create `src/components/mission-create.tsx` — form with name, type, brief, date, building
6. Rewrite `src/components/visit-header.tsx` → `src/components/mission-header.tsx`

### Phase 3: Core — Observation Capture

The key form rewrite.

7. Rewrite `src/components/observation-form.tsx` — element + description + cause + action + tag + photos
8. Update `src/components/observation-card.tsx` — tag badge, element display
9. Update `src/components/observation-list.tsx` — minor rename

### Phase 4: Integration — App Shell + Export

Wire everything together.

10. Rewrite `src/app.tsx` — mission-based navigation (mission list → mission detail → tabs)
11. Update `src/lib/ref-generator.ts` — type-aware prefix
12. Rewrite `src/lib/export-zip.ts` — new BETClaw export context format
13. Update `src/components/export-view.tsx` — new table columns

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic.

---

### Task 1: REWRITE `src/types.ts`

Replace all types with the BETClaw model.

**IMPLEMENT:**

```typescript
/** Tag categories for observations */
export const OBSERVATION_TAGS = [
  'structure', 'thermique', 'acces', 'environnement', 'general',
] as const;
export type ObservationTag = typeof OBSERVATION_TAGS[number];

/** Mission types */
export const MISSION_TYPES = [
  'diagnostic', 'suivi_chantier', 'reception', 'autre',
] as const;
export type MissionType = typeof MISSION_TYPES[number];

/** Mission statuses */
export const MISSION_STATUSES = ['active', 'completed', 'archived'] as const;
export type MissionStatus = typeof MISSION_STATUSES[number];

/** Building types (matches Supabase betc_buildings.building_type) */
export const BUILDING_TYPES = [
  'logement_collectif', 'erp', 'tertiaire', 'industriel', 'other',
] as const;
export type BuildingType = typeof BUILDING_TYPES[number];

/** Building stored in IndexedDB */
export interface Building {
  id?: number;
  name: string;
  address?: string;
  city?: string;
  postalCode?: string;
  buildingType?: BuildingType;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/** Mission stored in IndexedDB */
export interface Mission {
  id?: number;
  buildingId?: number;
  name: string;
  type: MissionType;
  status: MissionStatus;
  brief?: string;
  visitedAt?: string;  // ISO date string (YYYY-MM-DD)
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/** Observation stored in IndexedDB */
export interface Observation {
  id?: number;
  missionId: number;
  ref?: string;         // auto-generated (D1-01, V1-01...)
  element?: string;     // what is being observed (free text): "Balcon 3ème étage", "Poutre porteuse RDC"
  description: string;  // what was found
  cause?: string;       // probable cause
  action?: string;      // recommended action
  tag: ObservationTag;  // category
  photoIds: number[];
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/** Photo blob stored in IndexedDB */
export interface Photo {
  id?: number;
  missionId: number;
  observationId?: number;
  blob: Blob;
  filename: string;
  createdAt: string;
}

/** Tag display config */
export const TAG_CONFIG: Record<ObservationTag, { label: string; color: string }> = {
  structure: { label: 'Structure', color: 'bg-red-100 text-red-700' },
  thermique: { label: 'Thermique', color: 'bg-orange-100 text-orange-700' },
  acces: { label: 'Accès', color: 'bg-blue-100 text-blue-700' },
  environnement: { label: 'Environnement', color: 'bg-green-100 text-green-700' },
  general: { label: 'Général', color: 'bg-gray-100 text-gray-700' },
};

/** Export context for BETClaw ZIP */
export interface ExportContext {
  betclaw_version: string;
  mission: {
    name: string;
    type: string;
    brief?: string;
    visited_at?: string;
    status: string;
  };
  building?: {
    name: string;
    address?: string;
    city?: string;
    building_type?: string;
  };
  observations: ExportObservation[];
}

export interface ExportObservation {
  ref: string;
  element?: string;
  description: string;
  cause?: string;
  action?: string;
  tag: string;
  photos: string[];   // array of filenames (supports multiple photos)
  timestamp: string;
}
```

- **REMOVE**: `Visite`, `BatimentConfig`, `Participant`, `ETAGES`, `FACADES`, old `ExportContext`, old `ExportObservation`
- **GOTCHA**: The old `ExportContext` is used by `export-zip.ts` and `export-view.tsx` — those will break until Task 12-13 update them. That's expected.
- **VALIDATE**: `npx tsc --noEmit 2>&1 | head -5` — Will show errors in dependent files (expected at this stage)

---

### Task 2: REWRITE `src/db/schema.ts`

New Dexie database with 4 tables.

**IMPLEMENT:**

```typescript
import Dexie, { type Table } from 'dexie';
import type { Mission, Building, Observation, Photo } from '../types';

export class BETClawDB extends Dexie {
  buildings!: Table<Building, number>;
  missions!: Table<Mission, number>;
  observations!: Table<Observation, number>;
  photos!: Table<Photo, number>;

  constructor() {
    super('betclaw');

    // Version 2: BETClaw model (breaks from v1 IC-VisiteChantier)
    this.version(2).stores({
      buildings: '++id, createdAt',
      missions: '++id, buildingId, status, createdAt',
      observations: '++id, missionId, tag, sortOrder, createdAt',
      photos: '++id, missionId, observationId',
      // Delete old tables from v1
      visites: null,
    });

    // Keep v1 for migration path (Dexie requires it)
    this.version(1).stores({
      visites: '++id, createdAt',
      observations: '++id, visiteId, createdAt',
      photos: '++id, visiteId, observationId',
    });
  }
}

export const db = new BETClawDB();
```

- **GOTCHA**: Dexie version upgrade — version 2 must explicitly delete `visites` table (set to `null`). The v1 stores declaration must remain for Dexie's upgrade path. Users with existing v1 data will lose it (acceptable for MVP — only dev data exists).
- **GOTCHA**: The `observations` table changes shape (new indexes: missionId, tag, sortOrder). Dexie handles index changes automatically on version upgrade.
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep schema` — Should show no errors in schema.ts itself

---

### Task 3: REWRITE `src/db/operations.ts`

CRUD operations for all 4 entities.

**IMPLEMENT:**

```typescript
import { db } from './schema';
import type { Mission, Building, Observation, Photo } from '../types';

// --- Buildings ---

export async function createBuilding(
  data: Omit<Building, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<number> {
  const now = new Date().toISOString();
  return db.buildings.add({ ...data, createdAt: now, updatedAt: now } as Building);
}

export async function listBuildings(): Promise<Building[]> {
  return db.buildings.orderBy('createdAt').reverse().toArray();
}

export async function getBuilding(id: number): Promise<Building | undefined> {
  return db.buildings.get(id);
}

// --- Missions ---

export async function createMission(
  data: Omit<Mission, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<number> {
  const now = new Date().toISOString();
  return db.missions.add({ ...data, createdAt: now, updatedAt: now } as Mission);
}

export async function getMission(id: number): Promise<Mission | undefined> {
  return db.missions.get(id);
}

export async function updateMission(id: number, data: Partial<Mission>): Promise<void> {
  await db.missions.update(id, { ...data, updatedAt: new Date().toISOString() });
}

export async function listMissions(): Promise<Mission[]> {
  return db.missions.orderBy('createdAt').reverse().toArray();
}

export async function deleteMission(id: number): Promise<void> {
  await db.transaction('rw', [db.missions, db.observations, db.photos], async () => {
    await db.photos.where('missionId').equals(id).delete();
    await db.observations.where('missionId').equals(id).delete();
    await db.missions.delete(id);
  });
}

// --- Observations ---

export async function addObservation(
  data: Omit<Observation, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<number> {
  const now = new Date().toISOString();
  return db.observations.add({ ...data, createdAt: now, updatedAt: now } as Observation);
}

export async function updateObservation(id: number, data: Partial<Observation>): Promise<void> {
  await db.observations.update(id, { ...data, updatedAt: new Date().toISOString() });
}

export async function deleteObservation(id: number): Promise<void> {
  const obs = await db.observations.get(id);
  await db.transaction('rw', [db.observations, db.photos], async () => {
    if (obs?.photoIds?.length) {
      await db.photos.bulkDelete(obs.photoIds);
    }
    await db.observations.delete(id);
  });
}

export async function getObservationsForMission(missionId: number): Promise<Observation[]> {
  return db.observations.where('missionId').equals(missionId).sortBy('createdAt');
}

export async function getObservationCount(missionId: number): Promise<number> {
  return db.observations.where('missionId').equals(missionId).count();
}

// --- Photos ---

export async function savePhoto(
  data: Omit<Photo, 'id' | 'createdAt'>,
): Promise<number> {
  try {
    return await db.photos.add({ ...data, createdAt: new Date().toISOString() } as Photo);
  } catch (err) {
    if ((err as DOMException).name === 'QuotaExceededError') {
      throw new Error('Stockage plein. Supprimez des photos ou des missions.');
    }
    throw err;
  }
}

export async function getPhoto(id: number): Promise<Photo | undefined> {
  return db.photos.get(id);
}

export async function getPhotos(ids: number[]): Promise<Photo[]> {
  if (!ids.length) return [];
  const photos = await db.photos.bulkGet(ids);
  return photos.filter((p): p is Photo => p !== undefined);
}

export async function deletePhoto(id: number): Promise<void> {
  await db.photos.delete(id);
}
```

- **PATTERN**: Mirrors existing operations.ts structure (same error handling, same transaction pattern)
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep operations` — Should show no errors in operations.ts

---

### Task 4: CREATE `src/components/mission-list.tsx`

List of mission cards. Entry point after login.

**IMPLEMENT:**

- Show all missions sorted by date (newest first)
- Each card: name, type badge, date, observation count, building name
- "+" FAB button to create new mission
- Tap card → navigate to mission detail
- Use `useLiveQuery` to auto-update

**Props:** `onSelectMission: (id: number) => void`, `onCreateMission: () => void`

**UI pattern:** Same card style as observation-card (white rounded-xl shadow-sm). Type badge with colored pill. Date in gray-500 text-sm.

**IMPORTS**: `useLiveQuery` from `dexie-react-hooks`, `db` from `../db/schema`, `useSignal` from `@preact/signals`, types from `../types`

**VALIDATE**: `npx tsc --noEmit 2>&1 | grep mission-list`

---

### Task 5: CREATE `src/components/mission-create.tsx`

Form to create a new mission.

**IMPLEMENT:**

Fields:
- `name` (required text) — "Diagnostic toiture Longjumeau"
- `type` (select from MISSION_TYPES) — default `diagnostic`
- `brief` (multiline text, optional) — "Affaissement toiture. Comprendre structure porteuse..."
- `visitedAt` (date picker) — defaults to today
- Building section: text field for building name (creates inline), optional address/city

On submit:
1. If building name provided → `createBuilding({ name, address, city })` → get buildingId
2. `createMission({ name, type, status: 'active', brief, visitedAt, buildingId })`
3. Call `onCreated(missionId)`

**Props:** `onCreated: (missionId: number) => void`, `onCancel: () => void`

**UI:** Form wrapped in white rounded-xl shadow-sm card. Same TextField/SelectField patterns. Big teal submit button at bottom.

**VALIDATE**: `npx tsc --noEmit 2>&1 | grep mission-create`

---

### Task 6: REWRITE `src/components/visit-header.tsx` → `src/components/mission-header.tsx`

Collapsible header showing mission info at top of mission detail.

**IMPLEMENT:**

Rename file. New interface:
```typescript
interface MissionHeaderProps {
  mission: Mission | null;
  building?: Building;
  onSave: (data: Partial<Mission>) => void;
}
```

Collapsed view: mission name + type badge + date
Expanded view: editable fields (name, type, brief, date, status)

- **REMOVE**: All Visite-specific fields (titre_service, client, residence, batiments_visites, etc.)
- **PATTERN**: Same expand/collapse toggle as current visit-header.tsx (line 50-55)
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep mission-header`

---

### Task 7: REWRITE `src/components/observation-form.tsx`

The key change. Replace geography dropdowns with element + tag.

**IMPLEMENT:**

New form fields (in order):
1. **Element** (text input) — "Balcon 3ème", "Poutre RDC", "Zone affaissement" — placeholder "Élément observé..."
2. **Tag** (horizontal pill selector, not dropdown) — tap to select one of OBSERVATION_TAGS. Show colored pills using TAG_CONFIG. Default: `general`.
3. **Description** (multiline text, required) — "Fissure traversante de 5mm..."
4. **Cause** (text, optional) — "Probable infiltration d'eau"
5. **Action** (text, optional) — "Reprise de l'étanchéité"
6. **Photos** (PhotoCapture component — unchanged)

Tag selector UI:
```tsx
<div class="flex flex-wrap gap-2">
  {OBSERVATION_TAGS.map((t) => (
    <button
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
```

- **REMOVE**: `batiment`, `cage`, `etage`, `facade` signals and all related UI
- **REMOVE**: Import of `ETAGES`, `FACADES`, `BatimentConfig`
- **KEEP**: Photo handling logic (save to IndexedDB, delete old on edit)
- **KEEP**: Form validation (description required)
- **KEEP**: Edit mode with "Modification en cours" banner
- **PROPS**: Change `visiteId: number` → `missionId: number`. Remove `batiments: BatimentConfig[]`.

New signature:
```typescript
interface ObservationFormProps {
  missionId: number;
  observationCount: number;  // for auto-generating sortOrder
  editingObservation?: Observation | null;
  onDone: () => void;
}
```

- **GOTCHA**: Keep `formKey` signal for form reset (line 31) — it forces Preact to remount the form
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep observation-form`

---

### Task 8: UPDATE `src/components/observation-card.tsx`

Update display for new model.

**IMPLEMENT:**

Changes:
- Remove `cage/etage/facade` location concatenation (lines 19-21)
- Add tag badge (colored pill from TAG_CONFIG)
- Show `element` as subtitle if present
- Keep ref generation as `ref` prop (passed from parent, not computed here)

New display layout:
```
[Tag pill] [Ref badge]  [element text]  [photo count]
Description text (line-clamp-2)
→ Action text (if present)
[Delete button]
```

- **PROPS**: Change `visitNumber` → remove (ref passed directly). Add `ref: string` prop computed by parent.
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep observation-card`

---

### Task 9: UPDATE `src/components/observation-list.tsx`

Minor rename and prop update.

**IMPLEMENT:**

- Rename `visiteId` → `missionId` in props and query
- Rename `visitNumber` → `missionType` (for ref generation)
- Compute ref in the map: `generateRef(missionType, i)`
- Pass `ref` string to ObservationCard

```typescript
interface ObservationListProps {
  missionId: number;
  missionType: MissionType;
  onEdit: (obs: Observation) => void;
}
```

- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep observation-list`

---

### Task 10: REWRITE `src/app.tsx`

Mission-based navigation replacing single-Visite auto-creation.

**IMPLEMENT:**

New navigation flow:
```
Login → MissionList → [Create] → MissionDetail
                    → [Select] → MissionDetail
                                   ├── Chat tab
                                   ├── Add tab (ObservationForm)
                                   ├── List tab (ObservationList)
                                   └── Export tab (ExportView)
```

New view type:
```typescript
type View = 'missions' | 'create' | 'detail';
type DetailTab = 'chat' | 'add' | 'list' | 'export';
```

Key changes:
- Remove `activeVisiteId` → `activeMissionId`
- Remove auto-create Visite effect
- Add `MissionList` as landing view
- `MissionCreate` navigates to detail on creation
- Detail view has the same 4-tab bottom bar
- Back button in header to return to mission list

Header shows:
- On mission list: "BETClaw" + "Déconnexion"
- On mission detail: "← Back" + mission name + "Déconnexion"

- **REMOVE**: `createVisite` import, auto-create effect (lines 34-59), `handleVisiteSave` function
- **IMPORTS**: `MissionList`, `MissionCreate`, `MissionHeader` (new), plus existing components
- **VALIDATE**: `npx tsc --noEmit` — Should compile clean at this point (all dependent files updated)

---

### Task 11: UPDATE `src/lib/ref-generator.ts`

Add mission-type-aware prefix.

**IMPLEMENT:**

```typescript
import type { MissionType } from '../types';

/** Prefix map for observation references */
const TYPE_PREFIX: Record<MissionType, string> = {
  diagnostic: 'D',
  suivi_chantier: 'V',
  reception: 'R',
  autre: 'O',
};

/** Generate observation reference: {prefix}{n}-{nn} (zero-padded) */
export function generateRef(missionType: MissionType, observationIndex: number, visitNumber?: number): string {
  const prefix = TYPE_PREFIX[missionType];
  const n = visitNumber ?? 1;
  const nn = String(observationIndex + 1).padStart(2, '0');
  return `${prefix}${n}-${nn}`;
}
```

- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep ref-generator`

---

### Task 12: REWRITE `src/lib/export-zip.ts`

New BETClaw export context format.

**IMPLEMENT:**

Changes:
- Read from `db.missions` and `db.buildings` instead of `db.visites`
- New `ExportContext` shape (from types.ts Task 1)
- Support **multiple photos per observation** (old format: single `photo` string; new: `photos` array)
- Remove `buildEtageFacade` function
- Keep template bundling (render_cr_visite.py, README.md, DOCX template)

```typescript
export async function exportMissionZip(missionId: number): Promise<Blob> {
  const mission = await db.missions.get(missionId);
  if (!mission) throw new Error(`Mission ${missionId} not found`);

  const building = mission.buildingId
    ? await db.buildings.get(mission.buildingId)
    : undefined;

  const observations = await db.observations
    .where('missionId').equals(missionId)
    .sortBy('createdAt');

  const zip = new JSZip();
  const photosFolder = zip.folder('photos')!;

  const exportObs: ExportObservation[] = [];
  for (let i = 0; i < observations.length; i++) {
    const obs = observations[i];
    const ref = generateRef(mission.type, i);
    const photoFilenames: string[] = [];

    if (obs.photoIds?.length) {
      for (let j = 0; j < obs.photoIds.length; j++) {
        const photo = await db.photos.get(obs.photoIds[j]);
        if (photo) {
          const filename = `${ref}_${String(j + 1).padStart(3, '0')}.jpg`;
          photosFolder.file(filename, photo.blob, { compression: 'STORE' });
          photoFilenames.push(`photos/${filename}`);
        }
      }
    }

    exportObs.push({
      ref,
      element: obs.element,
      description: obs.description,
      cause: obs.cause,
      action: obs.action,
      tag: obs.tag,
      photos: photoFilenames,
      timestamp: obs.createdAt,
    });
  }

  const context: ExportContext = {
    betclaw_version: '1.0',
    mission: {
      name: mission.name,
      type: mission.type,
      brief: mission.brief,
      visited_at: mission.visitedAt,
      status: mission.status,
    },
    building: building ? {
      name: building.name,
      address: building.address,
      city: building.city,
      building_type: building.buildingType,
    } : undefined,
    observations: exportObs,
  };

  zip.file('context.json', JSON.stringify(context, null, 2), { compression: 'DEFLATE' });
  // ... keep README, render script, template bundling unchanged
}
```

- **RENAME**: `exportVisiteZip` → `exportMissionZip`
- **KEEP**: `triggerDownload`, `shareFile` functions unchanged
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep export-zip`

---

### Task 13: UPDATE `src/components/export-view.tsx`

Update for new model.

**IMPLEMENT:**

Changes:
- Replace `visiteId` prop → `missionId`
- Read from `db.missions` instead of `db.visites`
- Update recap table columns: Ref | Element | Tag | Description | Photos
- Remove objet/synthese/conclusion text fields (these are now in mission.brief)
- Call `exportMissionZip(missionId)` instead of `exportVisiteZip(visiteId)`
- Update filename generation: `mission-{date}-{name}.zip`

- **REMOVE**: objet, synthese, conclusion signals and their TextField components (these were specific to the IC report format)
- **VALIDATE**: `npx tsc --noEmit && npm run build`

---

## TESTING STRATEGY

### Manual Testing (MVP — no test framework configured for frontend)

1. **Create mission flow:**
   - Open app → see empty mission list → tap "+" → fill form → submit → redirected to mission detail

2. **Capture observations:**
   - In mission detail → "Add" tab → fill element + description + tag → add photo → submit
   - Observation appears in "List" tab with tag badge and photo thumbnail
   - Add 5 observations rapidly (< 3 minutes target per PRD)

3. **Edit observation:**
   - Tap observation card → form pre-filled → modify → submit → card updated

4. **Delete observation:**
   - Tap trash icon → confirm → observation removed

5. **Export:**
   - "Export" tab → see recap table → prepare ZIP → download
   - Unzip → verify context.json has new BETClaw format
   - Verify photos/ folder has files named with refs

6. **Offline:**
   - Toggle airplane mode → create observations → photos saved → toggle back → app still works

### Edge Cases

- Mission with 0 observations → export should show warning, not crash
- Very long element text → should truncate in card view
- Photo capture permission denied → should show error
- Multiple rapid photo captures → no duplicate IDs
- Building reuse across missions → building list shows existing ones

---

## VALIDATION COMMANDS

### Level 1: Type Check + Build

```bash
# TypeScript check (strict)
npx tsc --noEmit

# Production build (includes type check)
npm run build
```

**Expected**: Both pass with exit code 0, zero errors.

### Level 2: Dev Server

```bash
# Start dev server and verify no runtime errors
npm run dev
```

Open http://localhost:5173/IC-VisiteChantier/ — verify:
- Login screen renders
- After login, mission list renders (empty)
- Can create a mission
- Can add observations with photos
- Can export ZIP

### Level 3: Export Verification

```bash
# After exporting a ZIP, verify structure
unzip -l exported.zip
# Should contain: context.json, photos/*.jpg, README.md, render_cr_visite.py, template_cr_visite_aulnay.docx
```

Verify `context.json` has `betclaw_version: "1.0"` and the new structure.

---

## ACCEPTANCE CRITERIA

- [ ] Mission list shows all missions with name, type, date, observation count
- [ ] Can create a mission with name, type, brief, date, and optional building
- [ ] Observation form has: element (text), tag (pill selector), description (required), cause, action, photos
- [ ] Tag pills show correct colors from TAG_CONFIG
- [ ] Observation cards show tag badge + element + description + photo thumbnails
- [ ] Observation refs use type-aware prefix (D1-01, V1-01, R1-01)
- [ ] Can edit and delete observations
- [ ] Export ZIP contains context.json with BETClaw format (`betclaw_version: "1.0"`)
- [ ] Export includes all photos for each observation (multiple per obs supported)
- [ ] All data persisted in IndexedDB (offline-first, no Supabase dependency)
- [ ] `npm run build` succeeds with zero errors
- [ ] 5 observations capturable in < 3 minutes (UX performance)
- [ ] Touch targets >= 44px on all interactive elements

---

## COMPLETION CHECKLIST

- [ ] Task 1: types.ts rewritten
- [ ] Task 2: db/schema.ts updated
- [ ] Task 3: db/operations.ts rewritten
- [ ] Task 4: mission-list.tsx created
- [ ] Task 5: mission-create.tsx created
- [ ] Task 6: mission-header.tsx created (visit-header.tsx replaced)
- [ ] Task 7: observation-form.tsx rewritten
- [ ] Task 8: observation-card.tsx updated
- [ ] Task 9: observation-list.tsx updated
- [ ] Task 10: app.tsx rewritten
- [ ] Task 11: ref-generator.ts updated
- [ ] Task 12: export-zip.ts rewritten
- [ ] Task 13: export-view.tsx updated
- [ ] `npx tsc --noEmit` — zero errors
- [ ] `npm run build` — success
- [ ] Manual test: full create→capture→export flow works
- [ ] Manual test: edit + delete observations work
- [ ] Manual test: offline capture works

---

## NOTES

### Design Decisions

1. **No Supabase sync in Passe 3** — Keeps scope manageable. IndexedDB is the sole store. Passe 4 adds sync.

2. **Dexie version 2 drops v1 data** — Acceptable for MVP (only dev/test data exists). Production would need a migration function, but we're pre-launch.

3. **Free-text `element` instead of structured location** — The whole point of BETClaw is flexibility. An engineer should type "Balcon 3ème NE" or "Poutre P12" or "Zone affaissement" — whatever makes sense for the mission.

4. **Tag as horizontal pills, not dropdown** — Faster one-hand operation in the field. 5 options fit on one row.

5. **Multiple photos per observation** — Old model exported only the first photo. New model exports all. This is critical for field use.

6. **Export format break** — The new `context.json` is NOT backward-compatible with `render_cr_visite.py`. That's fine — the Python script will need updating post-MVP, and BETClaw's report generation will be via the AI agent anyway.

7. **Building as optional** — For speed, an engineer can create a mission without a building. Building can be added later.

### Risk Assessment

- **Medium risk**: Dexie version upgrade may have edge cases with existing browser data. Mitigation: test in incognito or clear IndexedDB before testing.
- **Low risk**: Tag pills may overflow on very small screens. Mitigation: `flex-wrap` handles it.
- **Low risk**: Photo compression is unchanged from Phase 2 — proven to work.

### Confidence Score: 8/10

High confidence because:
- No new dependencies
- Well-understood patterns (copy from existing code)
- Clear model mapping from Supabase schema
- All UI is variations of existing components

Risk factors:
- Dexie version migration (-1)
- Many files to touch simultaneously (-1)
