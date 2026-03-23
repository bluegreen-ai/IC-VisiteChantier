# Feature: Building-Mission Flow with Address Autocomplete

## Feature Description

Fix building-mission linkage bugs and redesign the creation flow. Building is **mandatory** when creating a mission. The flow starts with **address input** (autocomplete via API BAN) which either matches an existing building or creates a new one. No building listing page — buildings are accessed only through missions.

## User Story

As a BET engineer
I want to start a mission by typing an address, get autocomplete suggestions, and have the building auto-created or matched
So that building data is always correct and I can reuse buildings across missions (diagnostic → suivi chantier).

## Problem Statement

1. **Bug**: Mission creation always creates a new building — no way to select an existing one. Longjumeau mission has `building_id = null`.
2. **Bug**: Sync race condition — mission sync silently skips if building hasn't synced yet.
3. **UX**: Building section is optional and buried at the bottom of mission-create. No address validation.
4. **Data model gap**: No sub-building context on observations.

## Solution Statement

- **Address-first flow**: Mission creation starts with address autocomplete (API BAN `api-adresse.data.gouv.fr`). If a building with the same address exists in DB, propose to reuse it. Otherwise create new.
- **Building is mandatory**: No mission without a building.
- **No building listing page**: Buildings are accessed from mission cards/headers.
- **Sub-building context**: Optional `metadata.location` field on observations for "Bât. D, Cage 2, RDC".
- **No schema migration needed**.

## Feature Metadata

**Feature Type**: Enhancement + Bug Fix
**Estimated Complexity**: Medium
**Primary Systems Affected**: mission-create, mission-header, mission-list, observation-form, supabase-sync
**Dependencies**: API BAN (api-adresse.data.gouv.fr) — free, no API key, French addresses only

---

## CONTEXT REFERENCES

### Relevant Codebase Files — MUST READ BEFORE IMPLEMENTING

- `src/components/mission-create.tsx` (full file) — **REWRITE**: currently has inline building creation with no address autocomplete, building is optional
- `src/components/mission-header.tsx` (full file) — displays building info, needs tappable building name
- `src/components/mission-list.tsx` (full file) — mission cards show building name, needs tappable link
- `src/app.tsx` (full file) — navigation state machine `View = 'missions' | 'create' | 'detail'`
- `src/db/operations.ts` (lines 8-34) — `createBuilding`, `updateBuilding`, `listBuildings`, `getBuilding`
- `src/lib/supabase-sync.ts` (lines 70-103) — `syncMission` race condition bug at line 80
- `src/types.ts` (lines 37-65) — `Building` and `Mission` interfaces
- `src/db/schema.ts` — Dexie schema
- `src/components/observation-form.tsx` — will need optional location field
- `src/components/ui/text-field.tsx` — reusable text field component

### Reference: Edifice address autocomplete

- **API**: `https://api-adresse.data.gouv.fr/search/?q={query}&limit=5&autocomplete=1`
- **Hook**: `/Users/renaud/Projects/edifice/frontend/hooks/use-address-autocomplete.ts` — debounce 300ms, min 3 chars, AbortController for cancellation
- **Component**: `/Users/renaud/Projects/edifice/frontend/components/buildings/address-input.tsx` — suggestions dropdown UI
- **Response shape**: GeoJSON FeatureCollection → extract `label`, `housenumber`, `street`, `postcode`, `city`, `coordinates [lon, lat]`

### New Files to Create

- `src/lib/address-autocomplete.ts` — API BAN fetch logic (debounced, with AbortController)
- `src/components/address-input.tsx` — Address autocomplete input with suggestions dropdown

### Patterns to Follow

**Component pattern**: Preact functional components with `useSignal` for local state, `useLiveQuery` for reactive DB queries.
**Naming**: Files `kebab-case.tsx`, components `PascalCase`, signals `camelCase`.
**Touch targets**: All interactive elements `min-h-[44px]` + `touch-manipulation` class.

---

## IMPLEMENTATION PLAN

### Phase 1: Address autocomplete lib + component

Port the API BAN logic from Edifice. Pure fetch, no external deps.

### Phase 2: Rewrite mission-create with address-first flow

Building is mandatory. Flow: address → match existing or create new → then mission fields.

### Phase 3: Fix sync race condition

Chain building sync before mission sync.

### Phase 4: Wire building navigation from mission views

Tappable building name in mission-list and mission-header.

### Phase 5: Location field on observations

Optional sub-building context.

---

## STEP-BY-STEP TASKS

### Task 1: CREATE `src/lib/address-autocomplete.ts`

**IMPLEMENT**: API BAN fetch logic

```ts
export interface AddressSuggestion {
  id: string;          // BAN ID
  label: string;       // Full formatted address
  housenumber?: string;
  street?: string;
  postcode: string;
  city: string;
  citycode: string;
  coordinates: [number, number]; // [lon, lat]
}

export async function searchAddress(
  query: string,
  signal?: AbortSignal,
): Promise<AddressSuggestion[]>
```

- Endpoint: `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5&autocomplete=1`
- Parse GeoJSON FeatureCollection → map `features[].properties` + `features[].geometry.coordinates`
- Return empty array on error (network down = offline, no crash)

**REFERENCE**: `/Users/renaud/Projects/edifice/frontend/hooks/use-address-autocomplete.ts` (lines 50-100)
**VALIDATE**: `npx tsc --noEmit`

### Task 2: CREATE `src/components/address-input.tsx`

**IMPLEMENT**: Address autocomplete input with suggestions dropdown

```tsx
interface AddressInputProps {
  value: string;
  onSelect: (suggestion: AddressSuggestion) => void;
  onChange: (text: string) => void;
  placeholder?: string;
}
```

Behavior:
- Text input with `min-h-[48px]` for field use
- On input (≥ 3 chars), debounce 300ms, call `searchAddress()`
- Use `AbortController` — cancel previous request on new input
- Show suggestions as a dropdown list below the input (max 5 items)
- Each suggestion: tappable row with `label` text, `min-h-[48px]`
- On tap suggestion → call `onSelect(suggestion)`, close dropdown
- On blur (after small delay for tap to register) → close dropdown
- If offline or API error → no suggestions, no error shown (graceful)

**REFERENCE**: `/Users/renaud/Projects/edifice/frontend/components/buildings/address-input.tsx`
**IMPORTS**: `searchAddress` from `../lib/address-autocomplete`, `useSignal`, `useRef`
**VALIDATE**: `npx tsc --noEmit`

### Task 3: REWRITE `src/components/mission-create.tsx`

**IMPLEMENT**: Address-first mission creation flow

**New flow (top to bottom in the form):**

**Step 1 — Address (mandatory)**
- `<AddressInput>` at the top
- When user selects an address suggestion:
  - Check existing buildings in DB: `db.buildings.where('address').equalsIgnoreCase(suggestion.label)` or match by `postalCode` + `city` + normalized street
  - If match found → show: "Bâtiment existant : {building.name} — {building.address}" with "Utiliser" / "Créer nouveau" buttons
  - If no match → show "Nouveau bâtiment" section with name field (pre-fill address/city/CP from suggestion)

**Step 2 — Building name**
- If new building: `TextField` for name (e.g., "La Poste Longjumeau", "Résidence Savigny")
- If existing building: show building name (read-only)

**Step 3 — Mission fields**
- Nom de la mission (mandatory)
- Type (select)
- Brief (textarea)
- Date de visite

**handleSubmit:**
- If new building: `createBuilding({name, address, city, postalCode, buildingType, latitude, longitude})` → get `buildingId`
- If existing building: use `selectedBuildingId`
- `createMission({...missionData, buildingId})`

**Remove**: All old building signals (buildingName, buildingAddress, etc.), old building form section
**Add**: `addressText` signal, `selectedAddress` signal, `matchedBuilding` signal, `selectedBuildingId` signal, `isNewBuilding` signal

**IMPORTS**: `AddressInput`, `AddressSuggestion`, `db`, `createBuilding`, `createMission`, `useLiveQuery`
**GOTCHA**: Building matching — normalize strings for comparison (trim, lowercase). Match on address field since that's what API BAN returns consistently.
**GOTCHA**: Store `latitude` and `longitude` from the API BAN suggestion on the building (Supabase schema already has these columns)
**VALIDATE**: `npx tsc --noEmit`

### Task 4: UPDATE `src/lib/supabase-sync.ts` — Fix sync race condition

**IMPLEMENT**: In `syncMission` (line 76-81), chain building sync when needed.

Replace:
```ts
let buildingSupabaseId: string | null = null;
if (mission.buildingId) {
  const building = await db.buildings.get(mission.buildingId);
  buildingSupabaseId = building?.supabaseId ?? null;
  if (mission.buildingId && !buildingSupabaseId) return;
}
```

With:
```ts
let buildingSupabaseId: string | null = null;
if (mission.buildingId) {
  let building = await db.buildings.get(mission.buildingId);
  if (building && building.syncStatus !== 'synced') {
    await syncBuilding(building);
    building = await db.buildings.get(mission.buildingId);
  }
  buildingSupabaseId = building?.supabaseId ?? null;
  if (mission.buildingId && !buildingSupabaseId) return;
}
```

**VALIDATE**: `npx tsc --noEmit`

### Task 5: UPDATE `src/components/mission-list.tsx` — Building name tappable

**IMPLEMENT**: Building name on mission cards becomes a tappable link

- Add `onSelectBuilding?: (id: number) => void` to `MissionListProps`
- In `MissionCard`, wrap building name in a `<button>` with `onClick={(e) => { e.stopPropagation(); onSelectBuilding?.(buildingId); }}`
- Style: underline or teal color to indicate tappable
- Pass `buildingId` (not just name) to `MissionCard` — need to adjust the map to pass IDs

**VALIDATE**: `npx tsc --noEmit`

### Task 6: UPDATE `src/components/mission-header.tsx` — Building info tappable

**IMPLEMENT**:
- Building name/address line becomes tappable → opens expanded building details
- No separate building page — building info is in the expandable section (already exists)
- No new navigation needed

**VALIDATE**: `npx tsc --noEmit`

### Task 7: UPDATE `src/components/observation-form.tsx` — Add location field

**IMPLEMENT**: Add optional "Localisation" text field

- Add `location` signal, initialized from `editingObservation?.metadata?.location as string ?? ''`
- Render `<TextField label="Localisation" placeholder="Bât. D, Cage 2, 3ème étage..." />` between element and description
- On save, merge into metadata: `metadata: { ...existingMetadata, location: location.value.trim() || undefined }`
- Keep it simple — single text field, no hierarchy

**GOTCHA**: `metadata` on Observation type is `undefined` by default. Initialize as `{}` before merging.
**VALIDATE**: `npx tsc --noEmit`

### Task 8: Fix Longjumeau data in Supabase

**ALREADY DONE** ✓ — Mission linked to building via SQL UPDATE.

---

## TESTING STRATEGY

### Type Checking + Build

```bash
npx tsc --noEmit && npm run build
```

### Manual Validation

1. **Address autocomplete**: Type "9 rue" → suggestions appear from API BAN → select one
2. **Existing building match**: Create mission for same address → "Bâtiment existant" prompt appears
3. **New building creation**: New address → building created with name, address pre-filled, lat/lon stored
4. **Building mandatory**: Cannot submit mission without selecting/creating a building
5. **Sync**: Create mission + building → both appear in Supabase with correct `building_id`
6. **Offline**: Create mission offline → building/mission sync correctly when back online
7. **Location field**: Add observation with "Bât. D, Cage 2" → verify in `metadata.location`
8. **Tappable building**: Tap building name in mission list → expands mission header building section

---

## ACCEPTANCE CRITERIA

- [ ] Address autocomplete works via API BAN (api-adresse.data.gouv.fr)
- [ ] Building is mandatory for mission creation
- [ ] Existing buildings matched by address and proposed for reuse
- [ ] New buildings created with lat/lon from API BAN
- [ ] `building_id` correctly propagated to Supabase (sync race condition fixed)
- [ ] No building listing page — accessed only from missions
- [ ] Building name tappable in mission list → shows building info
- [ ] Optional location field on observations (`metadata.location`)
- [ ] TypeScript compiles clean
- [ ] Production build succeeds
- [ ] All touch targets ≥ 44px, field-usable

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` succeeds
- [ ] Manual flow tested (address autocomplete → building match → mission create → sync)
- [ ] All acceptance criteria met

---

## NOTES

### Address matching strategy

Match existing buildings by comparing the `address` field (stored from API BAN `label`). Normalize: trim + lowercase. This works because API BAN returns consistent formatted addresses. If the user types the same address, they get the same suggestions, so the `label` will match.

For fuzzy cases (typos, abbreviations), the API BAN itself handles normalization — "9 rue hotel postes longjumeau" returns the same result as "9 RUE DE L'HOTEL DES POSTES, LONGJUMEAU". We store the API-formatted `label`, so matching is reliable.

### Why not a building listing page?

- Engineers think in missions, not buildings. The building is context, not the primary entity.
- Most engineers have < 10 active buildings. A listing adds navigation complexity for no value.
- Building info is accessible by tapping the building name in any mission card/header.
- If needed later, adding a building tab is a small incremental change.

### Sub-buildings via metadata.location

Rather than a parent/child building hierarchy (over-engineering), sub-building context is a free text field: "Bât. D, Cage 2, RDC". BETClaw AI can parse this at report time. Keeps field UI dead simple.

### API BAN availability offline

API BAN requires network. If offline, the address input simply shows no suggestions. The user can still type a free-text address — it won't autocomplete but the building will be created with whatever they type. This is acceptable: offline field use is rare (per field test feedback) and the building can be corrected at the office.

### Lat/lon storage

API BAN returns coordinates. We store them on `betc_buildings` (columns already exist: `latitude`, `longitude`). Useful for future map features and for BETClaw AI to know the location context.
