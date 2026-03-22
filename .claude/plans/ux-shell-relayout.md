# Feature: UX Shell Relayout — Fixed Bottom Bar + Contextual FAB

The following plan should be complete, but validate documentation and codebase patterns before implementing.

Pay special attention to naming of existing utils, types, and models. Import from the right files.

## Feature Description

Restructure the BETClaw PWA navigation from a context-switching 4-tab bottom bar to a fixed 3-tab shell with contextual FAB. The current layout has an ambiguous "Ajouter" tab and hides Chat when not in mission detail. The new layout keeps Chat and Export always accessible, uses the observation list as the default mission view, and adds observations via a FAB button instead of a dedicated tab.

## User Story

As a BET field engineer on a construction site,
I want a simple, always-consistent navigation with one-tap access to capture, chat, and export,
So that I can focus on inspecting — not figuring out the UI.

## Problem Statement

1. Bottom tab bar changes meaning based on context (4 tabs only in mission detail)
2. "Ajouter" tab is ambiguous — add what?
3. Chat is only accessible inside mission detail, not from mission list
4. Two different navigation patterns (FAB on mission list, tabs in detail) create cognitive friction
5. On the field, the engineer is locked into one mission — the "Missions" tab would be noise

## Solution Statement

- **Mission List** = simple selection screen (no bottom bar), FAB [+] creates a mission
- **Mission Detail** = fixed 3-tab bottom bar: `📋 Observations | 💬 Chat | 📦 Export`
- **Observation list is the default tab** when entering a mission
- **FAB [+] on observation list** = add new observation (opens form as full-screen overlay)
- **Back arrow ←** in header returns to mission list
- **Chat always one tap away** regardless of what you're doing in the mission

## Feature Metadata

**Feature Type**: Enhancement (UX restructuring)
**Estimated Complexity**: Medium
**Primary Systems Affected**: `src/app.tsx`, all components in `src/components/`
**Dependencies**: None (pure frontend restructuring, no new libraries)

---

## CONTEXT REFERENCES

### Relevant Codebase Files — MUST READ BEFORE IMPLEMENTING

- `src/app.tsx` (entire file) — Current navigation shell, signal-based routing, MissionDetail component with 4-tab bar. **This is the main file to rewrite.**
- `src/components/mission-list.tsx` (entire file) — Mission cards + FAB. Keep as-is, just remove the `onCreateMission` callback pattern (FAB stays here).
- `src/components/mission-create.tsx` (entire file) — Mission creation form. Keep logic, but it will now be rendered as a full-screen overlay or pushed view.
- `src/components/mission-header.tsx` (entire file) — Collapsible mission info card. Remove from the "add" tab context — move to a compact always-visible header in mission detail, or keep as a collapsible section at the top of observation list.
- `src/components/observation-form.tsx` (entire file) — Observation creation/editing form. Currently a tab; will become a full-screen overlay triggered by FAB.
- `src/components/observation-list.tsx` (entire file) — Observation cards list. Currently a tab; becomes the **default content** of mission detail.
- `src/components/observation-card.tsx` (entire file) — Individual observation card with photo thumbnails, delete, edit. Keep as-is.
- `src/components/chat-view.tsx` (entire file) — OpenClaw chat. Keep as-is; just a tab now always accessible.
- `src/components/export-view.tsx` (entire file) — ZIP export. Keep as-is; just a tab now always accessible.
- `src/components/login-screen.tsx` — No changes needed.
- `src/components/ui/photo-capture.tsx` — No changes needed.
- `src/components/ui/text-field.tsx` — No changes needed.
- `src/components/ui/select-field.tsx` — No changes needed.
- `src/styles.css` — May need a new color or z-index utility for FAB/overlay.
- `src/types.ts` — No changes needed (data model unchanged).
- `src/db/operations.ts` — No changes needed.
- `src/db/schema.ts` — No changes needed.

### New Files to Create

None. This is a relayout of existing components, not new feature code.

### Patterns to Follow

**Signal-based navigation** (from `src/app.tsx`):
```typescript
const currentView = signal<View>('missions');
const activeMissionId = signal<number | null>(null);
const activeTab = signal<DetailTab>('observations'); // was 'add'
```

**Preact signals for local state** (every component uses `useSignal` or module-level `signal`):
```typescript
import { signal } from '@preact/signals';
const showForm = signal(false);
```

**useLiveQuery for DB subscriptions** (pattern used everywhere):
```typescript
const missions = useLiveQuery(() => db.missions.orderBy('createdAt').reverse().toArray());
```

**Tailwind v4 custom theme** (from `src/styles.css`):
- `bg-betc-teal` / `text-betc-teal` — primary brand (#0F766E)
- `bg-betc-teal-light` — light background (#F0FDFA)
- `text-action-orange` — action/correction text (#804000)

**Touch targets**: All interactive elements use `min-h-[44px]` and `touch-manipulation`.

**Mobile-first layout**: `h-dvh flex flex-col` on root, `flex-1 overflow-y-auto min-h-0` on scrollable areas.

---

## IMPLEMENTATION PLAN

### Phase 1: Restructure App Shell

Rewrite `src/app.tsx` to implement the new navigation model:
- Remove `DetailTab = 'chat' | 'add' | 'list' | 'export'`
- Replace with `DetailTab = 'observations' | 'chat' | 'export'`
- Add `showObservationForm = signal(false)` for overlay state
- Default tab when entering mission: `'observations'` (not `'add'`)
- Bottom bar: 3 tabs only, visible only in mission detail view

### Phase 2: Observation List as Default + FAB

- Observation list becomes the main content of mission detail
- Add FAB [+] button (floating, bottom-right, above tab bar)
- FAB visible only on `observations` tab
- Tapping FAB sets `showObservationForm.value = true`

### Phase 3: Observation Form as Overlay

- ObservationForm renders as a full-screen slide-up overlay
- Overlay has its own header with ← close button and title
- On submit or cancel → `showObservationForm.value = false`
- Edit flow: tapping edit on ObservationCard → opens overlay pre-filled

### Phase 4: Mission Header Integration

- MissionHeader becomes a compact, collapsible card at the top of the observations tab
- Shows mission name + type + date + building (collapsed)
- Tap to expand for editing

### Phase 5: Validation & Polish

- Verify all navigation flows work
- Test on mobile viewport (375px width)
- Ensure Chat and Export tabs work unchanged
- Verify observation CRUD (create, edit, delete) still works
- Build passes with zero errors

---

## STEP-BY-STEP TASKS

### Task 1: UPDATE `src/app.tsx` — Rewrite navigation shell

**IMPLEMENT**: Replace the entire MissionDetail component and navigation logic.

**Changes:**

1. Change `DetailTab` type:
```typescript
type DetailTab = 'observations' | 'chat' | 'export';
```

2. Add overlay signal:
```typescript
const showObservationForm = signal(false);
```

3. Default tab on mission entry:
```typescript
activeTab.value = 'observations'; // was 'add'
```

4. **MissionDetail component** new structure:
```tsx
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
```

5. **handleEdit** function update:
```typescript
function handleEdit(obs: Observation) {
  editingObs.value = obs;
  showObservationForm.value = true;
}
```

6. **handleSelectMission** update:
```typescript
function handleSelectMission(id: number) {
  activeMissionId.value = id;
  activeTab.value = 'observations'; // was 'add'
  currentView.value = 'detail';
}
```

7. **handleMissionCreated** update:
```typescript
function handleMissionCreated(id: number) {
  activeMissionId.value = id;
  activeTab.value = 'observations'; // was 'add'
  currentView.value = 'detail';
}
```

8. **handleBack** update — also close overlay:
```typescript
function handleBack() {
  activeMissionId.value = null;
  editingObs.value = null;
  showObservationForm.value = false;
  currentView.value = 'missions';
}
```

9. Remove imports that are no longer needed at the top level (ObservationForm is still imported but used inside overlay now).

**PATTERN**: Follow existing signal + conditional rendering pattern from current `app.tsx`
**IMPORTS**: All existing imports stay; no new imports needed
**GOTCHA**: The FAB must be positioned above the tab bar. Use `bottom-20` (80px) to clear the ~52px tab bar + safe area. Adjust if needed.
**GOTCHA**: The overlay must use `fixed inset-0 z-40` to cover everything including the tab bar.
**GOTCHA**: `pt-safe` class on overlay header for notch devices (same as main header).
**VALIDATE**: `npm run typecheck`

### Task 2: UPDATE `src/components/observation-form.tsx` — Remove internal edit banner

**IMPLEMENT**: The "Modification en cours" banner with cancel button is now redundant — the overlay header handles this. Remove the banner from the form component.

Specifically, find and remove the edit indicator section at the top of the form's JSX. The form should start directly with the Element text field.

Also remove the internal "Annuler" (cancel) button logic that was clearing `editingObs` — the overlay's close button now handles this via `onDone()`.

**PATTERN**: The `onDone` callback is already wired to close the overlay in Task 1.
**GOTCHA**: Make sure the submit button still calls `onDone()` after successful save — this closes the overlay.
**GOTCHA**: Do NOT remove the `useEffect` that loads editing data — it's still needed.
**VALIDATE**: `npm run typecheck`

### Task 3: UPDATE `src/components/observation-list.tsx` — Improve empty state

**IMPLEMENT**: Update the empty state message. Currently says "Appuyez sur ＋ pour en ajouter." — this still makes sense with the FAB, but update to be clearer:

Change empty state text to: `"Aucune observation. Appuyez sur le bouton ＋ pour commencer."`

Also remove the count header ("X observations") since the observation count badge on the tab already shows this. Or keep it if it provides useful context — use judgment.

**VALIDATE**: `npm run typecheck`

### Task 4: UPDATE `src/components/mission-list.tsx` — Ensure clean standalone screen

**IMPLEMENT**: The mission list is already a clean standalone screen with its own FAB. No structural changes needed. Just verify:

1. The FAB (+) for creating missions renders correctly without a bottom tab bar below it
2. The `onCreateMission` callback still works (it should — MissionCreate is still rendered as a separate view)

Minor improvement: position the FAB at `bottom-6` instead of whatever it currently uses, since there's no tab bar to clear on this screen.

**VALIDATE**: `npm run typecheck`

### Task 5: BUILD & VERIFY

**IMPLEMENT**: Run full build and verify zero errors.

**VALIDATE**:
```bash
npm run typecheck
npm run build
```

---

## TESTING STRATEGY

### Manual Testing (Primary — this is a UI restructuring)

No automated tests exist for components. All validation is manual + typecheck + build.

#### Flow 1: Mission Selection
1. Open app → see mission list (no bottom bar)
2. Tap FAB [+] → mission create form appears
3. Create mission → lands on mission detail, observations tab active, list is empty
4. See 3-tab bar at bottom: Observations | Chat | Export

#### Flow 2: Observation Capture (Core Field Flow)
1. In mission detail, observations tab is default
2. MissionHeader visible at top (collapsed)
3. Tap FAB [+] → full-screen overlay opens with observation form
4. Fill form + take photo → submit → overlay closes, observation appears in list
5. Tap FAB [+] again → new empty form
6. Repeat 3 times rapidly (simulates field capture pace)

#### Flow 3: Edit Observation
1. In observation list, tap an observation card
2. Overlay opens pre-filled with observation data
3. Edit description → submit → overlay closes, changes visible in list

#### Flow 4: Delete Observation
1. In observation list, tap delete icon on a card
2. Confirm dialog → observation removed from list

#### Flow 5: Tab Navigation
1. Tap Chat tab → chat view loads (connection status visible)
2. Tap Observations tab → back to list + FAB
3. Tap Export tab → export view with summary and ZIP button
4. Navigate freely between all 3 tabs

#### Flow 6: Back to Mission List
1. Tap ← in header → returns to mission list
2. Select different mission → new mission's observations shown

#### Flow 7: Overlay + Back Interaction
1. Open observation form overlay
2. Tap ← in overlay header → overlay closes, back to observations list
3. Open overlay again → tap device back button (if applicable) → overlay should close

### Edge Cases
- Empty mission (0 observations) → empty state message + FAB visible
- Observation with no photos → card renders without thumbnail section
- Very long observation list (20+) → scrolls under MissionHeader, FAB stays fixed
- Chat tab while offline → shows connection error, but tab is still accessible

---

## VALIDATION COMMANDS

### Level 1: Type Safety
```bash
npm run typecheck
```
**Expected**: Exit code 0, zero errors

### Level 2: Production Build
```bash
npm run build
```
**Expected**: Exit code 0, dist/ generated

### Level 3: Dev Server Smoke Test
```bash
npm run dev
```
**Expected**: App loads at localhost, no console errors, navigation works

### Level 4: Manual Mobile Viewport
- Open Chrome DevTools → toggle device toolbar → iPhone 14 (390×844)
- Walk through all 7 test flows above
- Verify touch targets are ≥44px
- Verify FAB doesn't overlap with tab bar
- Verify overlay covers full screen including safe areas

---

## ACCEPTANCE CRITERIA

- [ ] Mission list has NO bottom tab bar
- [ ] Mission detail has exactly 3 tabs: Observations | Chat | Export
- [ ] Default tab when entering a mission is Observations
- [ ] FAB [+] visible on Observations tab, triggers full-screen overlay
- [ ] Observation form overlay has its own header with ← close button
- [ ] Creating an observation closes the overlay and shows it in the list
- [ ] Editing an observation opens the overlay pre-filled
- [ ] Chat tab is always accessible from mission detail
- [ ] Export tab is always accessible from mission detail
- [ ] ← in main header returns to mission list
- [ ] MissionHeader (collapsible) visible at top of observations tab
- [ ] `npm run typecheck` passes with zero errors
- [ ] `npm run build` succeeds

---

## COMPLETION CHECKLIST

- [ ] Task 1: app.tsx rewritten with new shell
- [ ] Task 2: observation-form.tsx edit banner removed
- [ ] Task 3: observation-list.tsx empty state updated
- [ ] Task 4: mission-list.tsx FAB positioning verified
- [ ] Task 5: typecheck + build pass
- [ ] All 7 manual test flows verified
- [ ] All acceptance criteria met

---

## NOTES

### Design Decisions

1. **3 tabs, not 2**: Export earns its own tab because it's the final step of every field visit. Burying it in a menu would add friction at the worst time (end of visit, engineer wants to leave).

2. **Full-screen overlay, not modal**: On mobile, modals that cover 80% of the screen are worse than full-screen — they tease content behind them and create accidental dismiss taps. A clean full-screen takeover with its own header is the standard pattern (iOS sheet, Android full-screen dialog).

3. **MissionHeader stays in observations tab**: The engineer needs to see which mission they're in and potentially edit the brief. Putting it as a collapsible card at the top of the observation list keeps context without wasting space.

4. **No animation for MVP**: Slide-up transitions for the overlay would be nice but are not worth the implementation time. The overlay appears/disappears instantly. Can be added post-MVP with CSS transitions.

5. **Observation count on tab badge removed**: Since observations is now the default tab and the list is always visible, a count badge is redundant. The engineer can see the list. If we want a count, it's in the list header.

### What's NOT changing
- Data model (types, DB schema, operations)
- Business logic (observation CRUD, photo capture, export ZIP)
- Chat integration (OpenClaw client)
- Auth flow (login screen, session management)
- Styling system (Tailwind theme, colors)
