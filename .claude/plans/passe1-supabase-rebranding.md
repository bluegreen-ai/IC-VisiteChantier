# Feature: Passe 1 — Supabase Setup + Rebranding to BETClaw

The following plan should be complete, but validate documentation and codebase patterns before implementing.

Pay special attention to naming of existing utils, types, and models. Import from the right files.

## Feature Description

Set up the Supabase backend (6 `betc_*` tables with RLS, auth magic link, storage buckets) and rebrand the PWA from "IC Visite Chantier" to "BETClaw". This is the foundation pass — no new screens yet, but the app must build clean, display the new brand, and have a working Supabase client.

## User Story

As an engineer at a BET firm
I want a branded BETClaw app connected to Supabase
So that my field data can sync to a real backend with authentication

## Problem Statement

The current PWA is hardcoded for the Aulnay balconies project (IC Ingénieurs). It has no backend, no auth, and IC-specific branding. It needs to become "BETClaw" with a Supabase backend ready for Passes 2-8.

## Solution Statement

1. Create 6 `betc_*` tables in the existing `buildingInspection` Supabase project (prefix `betc_` to avoid conflicts with existing tables)
2. Configure auth magic link + storage buckets
3. Rebrand all UI/config from "IC Visite Chantier" to "BETClaw"
4. Add Supabase client library + generated types
5. Remove Aulnay-specific hardcoded defaults
6. Keep the app building and functional (IndexedDB still works, Supabase integration is passive)

## Feature Metadata

**Feature Type**: New Capability + Refactor
**Estimated Complexity**: Medium
**Primary Systems Affected**: Supabase (new), PWA config, theme, types
**Dependencies**: @supabase/supabase-js, existing Supabase project `zgkvbjqlvebttbnkklpo`

---

## CONTEXT REFERENCES

### Relevant Codebase Files — READ BEFORE IMPLEMENTING

- `src/app.tsx` (lines 17-75) — Aulnay defaults to remove, header text to change
- `src/components/visit-header.tsx` (lines 5-30) — AULNAY_DEFAULTS to remove
- `src/db/schema.ts` (all) — Dexie DB name to change
- `src/types.ts` (all) — Current type definitions, will need new BETClaw types alongside
- `src/styles.css` (lines 1-10) — Theme color CSS variables
- `src/lib/export-zip.ts` (line 7) — Template path reference
- `index.html` (lines 6, 9) — Theme color + title
- `vite.config.ts` (lines 7, 14-20) — Base path + PWA manifest
- `package.json` (line 2) — Project name
- `.env.example` — Supabase env vars template

### New Files to Create

- `src/lib/supabase.ts` — Supabase client singleton
- `src/types/database.types.ts` — Generated Supabase types (via `supabase gen types`)
- `src/types/betclaw.ts` — BETClaw domain types (Mission, Building, Observation for Supabase)

### Existing Files to Modify

- `src/app.tsx` — Remove Aulnay defaults, rebrand header
- `src/components/visit-header.tsx` — Remove AULNAY_DEFAULTS
- `src/styles.css` — Change theme colors
- `src/db/schema.ts` — Rename DB, add new tables for BETClaw
- `index.html` — Title + theme-color meta
- `vite.config.ts` — Base path + manifest
- `package.json` — Name + add @supabase/supabase-js dependency
- `.env.example` — Document all env vars
- `.env` — Actual credentials (not committed)

### Patterns to Follow

**Supabase Client (new pattern):**
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

**Dexie pattern (existing):**
```typescript
// Keep the same Dexie pattern but rename DB and add new stores
super('betclaw');
```

**Signal pattern (existing):**
```typescript
// app.tsx uses @preact/signals for view state — keep this pattern
const currentView = signal<View>('add');
```

**Color naming:**
- Current: `--color-ic-blue`, `bg-ic-blue`, `text-ic-blue`
- Target: `--color-betc-blue`, `bg-betc-blue`, `text-betc-blue`

---

## IMPLEMENTATION PLAN

### Phase 1: Supabase Schema (via MCP apply_migration)

Create the 6 `betc_*` tables with RLS, indexes, and triggers in the existing `buildingInspection` project. Use `apply_migration` MCP tool — NOT raw SQL.

### Phase 2: Supabase Auth + Storage

Configure magic link auth redirect URLs and create storage buckets with RLS policies.

### Phase 3: Client-Side Supabase Integration

Install `@supabase/supabase-js`, create client singleton, generate TypeScript types.

### Phase 4: Rebranding

Change all IC references to BETClaw — colors, titles, manifest, DB name, remove Aulnay defaults.

### Phase 5: Validation

Build clean, typecheck, verify PWA manifest, verify Supabase connection.

---

## STEP-BY-STEP TASKS

### IMPORTANT: Supabase project details

- **Project ID**: `zgkvbjqlvebttbnkklpo`
- **Region**: eu-west-3
- **CRITICAL**: Only create/modify tables with `betc_` prefix. Other tables in this project belong to other apps.
- **Supabase URL**: Retrieve via `get_project_url` MCP tool
- **Anon key**: Already in `.env` — `SUPABASE_ANON_KEY=sb_publishable_PyPuIhnem_BIt3l2z1fnYA_o55vEhuB`

---

### Task 1: CREATE betc_* tables via migration

Use `mcp__supabase__apply_migration` to create all 6 tables in a single migration.

**Migration name**: `create_betc_tables`

**SQL** (copy from PRD section 4, reproduced here for completeness):

```sql
-- Buildings (shared reference across missions)
CREATE TABLE betc_buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  latitude FLOAT,
  longitude FLOAT,
  building_type TEXT,
  construction_year INT,
  floor_count INT,
  surface_area FLOAT,
  structural_system TEXT,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE betc_buildings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_buildings" ON betc_buildings FOR ALL USING (auth.uid() = user_id);
CREATE INDEX ON betc_buildings(user_id);

-- Missions
CREATE TABLE betc_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  building_id UUID REFERENCES betc_buildings(id),
  name TEXT NOT NULL,
  type TEXT,
  status TEXT DEFAULT 'active',
  brief TEXT,
  checklist JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  visited_at DATE
);
ALTER TABLE betc_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_missions" ON betc_missions FOR ALL USING (auth.uid() = user_id);
CREATE INDEX ON betc_missions(user_id, status);
CREATE INDEX ON betc_missions(building_id);

-- Messages (chat history)
CREATE TABLE betc_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES betc_missions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  attachments JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE betc_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_messages" ON betc_messages FOR ALL USING (
  EXISTS (SELECT 1 FROM betc_missions WHERE id = betc_messages.mission_id AND user_id = auth.uid())
);
CREATE INDEX ON betc_messages(mission_id, created_at);

-- Observations (core entity — feeds reports)
CREATE TABLE betc_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES betc_missions(id) ON DELETE CASCADE,
  ref TEXT,
  element TEXT,
  description TEXT NOT NULL,
  cause TEXT,
  action TEXT,
  metadata JSONB,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE betc_observations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_observations" ON betc_observations FOR ALL USING (
  EXISTS (SELECT 1 FROM betc_missions WHERE id = betc_observations.mission_id AND user_id = auth.uid())
);
CREATE INDEX ON betc_observations(mission_id, sort_order);

-- Photos
CREATE TABLE betc_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES betc_missions(id) ON DELETE CASCADE,
  observation_id UUID REFERENCES betc_observations(id),
  message_id UUID REFERENCES betc_messages(id),
  storage_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  size_bytes INT,
  width INT,
  height INT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE betc_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_photos" ON betc_photos FOR ALL USING (
  EXISTS (SELECT 1 FROM betc_missions WHERE id = betc_photos.mission_id AND user_id = auth.uid())
);
CREATE INDEX ON betc_photos(mission_id);

-- Reports
CREATE TABLE betc_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES betc_missions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  report_type TEXT,
  status TEXT DEFAULT 'brouillon',
  sections JSONB,
  template_id TEXT,
  storage_path TEXT,
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE betc_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_reports" ON betc_reports FOR ALL USING (
  EXISTS (SELECT 1 FROM betc_missions WHERE id = betc_reports.mission_id AND user_id = auth.uid())
);
CREATE INDEX ON betc_reports(mission_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION betc_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER betc_buildings_updated_at BEFORE UPDATE ON betc_buildings FOR EACH ROW EXECUTE FUNCTION betc_update_updated_at();
CREATE TRIGGER betc_missions_updated_at BEFORE UPDATE ON betc_missions FOR EACH ROW EXECUTE FUNCTION betc_update_updated_at();
CREATE TRIGGER betc_observations_updated_at BEFORE UPDATE ON betc_observations FOR EACH ROW EXECUTE FUNCTION betc_update_updated_at();
CREATE TRIGGER betc_reports_updated_at BEFORE UPDATE ON betc_reports FOR EACH ROW EXECUTE FUNCTION betc_update_updated_at();
```

**GOTCHA**: The trigger function is named `betc_update_updated_at()` (prefixed) to avoid conflicts with any existing `update_updated_at()` function in the project.

**VALIDATE**: Use `mcp__supabase__list_tables` filtered to `betc_*` tables to confirm creation.

---

### Task 2: CREATE storage buckets via migration

**Migration name**: `create_betc_storage_buckets`

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('betc-photos', 'betc-photos', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('betc-reports', 'betc-reports', false);

-- Storage policies: authenticated users can manage their own files
-- Photos bucket
CREATE POLICY "user_upload_photos" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'betc-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "user_read_photos" ON storage.objects FOR SELECT
  USING (bucket_id = 'betc-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "user_delete_photos" ON storage.objects FOR DELETE
  USING (bucket_id = 'betc-photos' AND auth.uid() IS NOT NULL);

-- Reports bucket
CREATE POLICY "user_upload_reports" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'betc-reports' AND auth.uid() IS NOT NULL);

CREATE POLICY "user_read_reports" ON storage.objects FOR SELECT
  USING (bucket_id = 'betc-reports' AND auth.uid() IS NOT NULL);
```

**GOTCHA**: Storage path convention is `{user_id}/{mission_id}/{filename}` — enforced by app logic, not SQL policy (keeping policies simple for MVP).

**VALIDATE**: Verify buckets exist via Supabase dashboard or `execute_sql`: `SELECT id, name, public FROM storage.buckets WHERE id LIKE 'betc-%';`

---

### Task 3: CONFIGURE Supabase Auth

Via Supabase Dashboard (manual step — document for the user):

1. **Auth > URL Configuration**: Add redirect URLs:
   - `http://localhost:5173` (dev)
   - `http://localhost:4173` (preview)
   - `https://bluegreen-ai.github.io/IC-VisiteChantier/` (current GH Pages)
   - Any future production URL
2. **Auth > Email Templates**: Customize magic link email (optional, can do post-MVP)
3. **Auth > Providers**: Ensure "Email" provider is enabled with "Confirm email" ON

**This is a manual dashboard step — flag it clearly to the user during execution.**

---

### Task 4: INSTALL @supabase/supabase-js

```bash
npm install @supabase/supabase-js
```

**VALIDATE**: `npm ls @supabase/supabase-js` shows installed version

---

### Task 5: CREATE src/lib/supabase.ts

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment variables. Copy .env.example to .env and fill in credentials.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

**PATTERN**: Fail fast — if env vars are missing, throw immediately. Supabase is always available (cloud), there's no reason to run without it.

**GOTCHA**: Don't import generated Database types yet — we'll generate them in Task 7. Use untyped client for now, add types when available.

**VALIDATE**: `npm run typecheck`

---

### Task 6: UPDATE .env with real credentials

Retrieve project URL via `mcp__supabase__get_project_url` and use the existing anon key from `.env`.

```bash
# .env (not committed)
VITE_SUPABASE_URL=https://zgkvbjqlvebttbnkklpo.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_PyPuIhnem_BIt3l2z1fnYA_o55vEhuB
```

**UPDATE `.env.example`:**
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxx

# OpenClaw / BETClaw chat (stretch goal)
# VITE_BETCLAW_CHAT_URL=https://pinchchat.bluegreen.ai
# VITE_BETCLAW_WS_URL=wss://betclaw.bluegreen.ai
```

**VALIDATE**: `cat .env` shows both VITE_ vars set

---

### Task 7: GENERATE TypeScript types from Supabase

```bash
npx supabase login
npx supabase gen types --project-id zgkvbjqlvebttbnkklpo --lang typescript > src/types/database.types.ts
```

**GOTCHA**: This generates types for ALL tables in the project, not just `betc_*`. That's fine — we only import what we need. If the generated file is too large or noisy, we can extract just the `betc_*` types into a separate file.

**Add script to package.json:**
```json
"gen:types": "npx supabase gen types --project-id zgkvbjqlvebttbnkklpo --lang typescript > src/types/database.types.ts"
```

**VALIDATE**: File `src/types/database.types.ts` exists and contains `betc_buildings`, `betc_missions`, etc.

---

### Task 8: UPDATE src/lib/supabase.ts with generated types

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment variables.')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

**VALIDATE**: `npm run typecheck`

---

### Task 9: REBRAND index.html

**UPDATE** `index.html`:
- Line 6: `<meta name="theme-color" content="#0F766E">` (teal-700, BETClaw brand)
- Line 9: `<title>BETClaw</title>`

**VALIDATE**: `grep -n 'BETClaw\|theme-color' index.html`

---

### Task 10: REBRAND vite.config.ts

**UPDATE** `vite.config.ts`:
- Line 7: `base: '/IC-VisiteChantier/'` → keep as-is for now (GitHub Pages URL doesn't change yet)
- PWA manifest:
  - `name: 'BETClaw'`
  - `short_name: 'BETClaw'`
  - `description: 'Assistant terrain pour ingénieurs BET'`
  - `theme_color: '#0F766E'`

**VALIDATE**: `npm run build` succeeds

---

### Task 11: REBRAND src/styles.css

**REPLACE** theme colors:
```css
@theme {
  --color-betc-teal: #0F766E;
  --color-betc-teal-light: #F0FDFA;
  --color-action-orange: #804000;
}
```

Then **find-and-replace** across all component files:
- `ic-blue` → `betc-teal`
- `ic-blue-light` → `betc-teal-light`

Files to update (all uses of `ic-blue` or `ic-blue-light`):
- `src/app.tsx` — header bg, tab active states, badge
- `src/components/visit-header.tsx` — text color, button bg, focus states
- `src/components/observation-form.tsx` — edit banner bg, submit button
- `src/components/observation-card.tsx` — ref badge bg
- `src/components/export-view.tsx` — header, table styling
- `src/components/ui/text-field.tsx` — focus ring/border
- `src/components/ui/select-field.tsx` — focus border

**VALIDATE**: `grep -r 'ic-blue' src/` returns nothing

---

### Task 12: REBRAND app.tsx header + remove Aulnay defaults

**CHANGES in `src/app.tsx`:**

1. Change header text (line 101): `IC Visite Chantier` → `BETClaw`
2. Remove `AULNAY_BATIMENTS` constant (lines 17-26) — replace with empty array `[]`
3. Remove `DEFAULT_PARTICIPANTS` constant (lines 28-35)
4. **Keep the auto-create logic** but with generic defaults:

```typescript
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
```

**WHY keep auto-create**: The app still needs a visite record to function in Passes 2-8. We'll replace this with a proper MissionCreate screen in Passe 2.

**VALIDATE**: `npm run typecheck && npm run build`

---

### Task 13: REBRAND visit-header.tsx — remove AULNAY_DEFAULTS

**REMOVE** the `AULNAY_DEFAULTS` object (lines 5-30 of visit-header.tsx).

Replace any usage of `AULNAY_DEFAULTS` with empty/null fallbacks. The component already handles `visite ?? null`, so it should work with empty data.

**VALIDATE**: `npm run typecheck`

---

### Task 14: UPDATE src/db/schema.ts — rename database

**CHANGE** line 10: `super('ic-visite-chantier')` → `super('betclaw')`

**GOTCHA**: This creates a NEW IndexedDB database. Old `ic-visite-chantier` data becomes inaccessible. This is fine — we're pivoting, and the old data was Aulnay test data.

**VALIDATE**: `npm run typecheck`

---

### Task 15: UPDATE package.json — rename project

**CHANGE** line 2: `"name": "ic-visitechantier"` → `"name": "betclaw"`

**VALIDATE**: `cat package.json | head -3`

---

### Task 16: UPDATE .gitignore

Ensure `.env` is ignored (should already be, but verify):
```
.env
.env.*.local
```

**VALIDATE**: `grep 'env.local' .gitignore`

---

### Task 17: FINAL BUILD + TYPECHECK

```bash
npm run typecheck
npm run build
```

Both must pass with 0 errors.

**VALIDATE**: Exit code 0 for both commands

---

## TESTING STRATEGY

### No Unit Tests for Passe 1

This pass is infrastructure + branding. No business logic added. Testing is:
1. Build succeeds (`npm run build`)
2. TypeScript compiles (`npm run typecheck`)
3. Supabase tables exist (verified via MCP tools)
4. App loads in browser with BETClaw branding
5. IndexedDB still works (existing offline capture flow)

### Manual Validation

1. `npm run dev` — app loads with "BETClaw" header and teal theme
2. Create an observation — stored in IndexedDB (betclaw DB name)
3. Export ZIP — still works
4. Check console — Supabase client initialized (or graceful warning if no env vars)

---

## VALIDATION COMMANDS

### Level 1: Build & Types

```bash
npm run typecheck
npm run build
```

### Level 2: No Stale References

```bash
# No IC branding left in source
grep -r 'ic-blue' src/ && echo "FAIL: ic-blue references remain" || echo "PASS"
grep -r 'IC Visite' src/ index.html vite.config.ts && echo "FAIL: IC Visite references remain" || echo "PASS"
grep -r 'AULNAY' src/ && echo "FAIL: Aulnay references remain" || echo "PASS"

# Supabase client exists
test -f src/lib/supabase.ts && echo "PASS" || echo "FAIL: supabase.ts missing"
```

### Level 3: Dev Server

```bash
npm run dev
# Manually verify: BETClaw header, teal theme, observation capture works
```

---

## ACCEPTANCE CRITERIA

- [ ] 6 `betc_*` tables created in Supabase with RLS enabled
- [ ] Storage buckets `betc-photos` and `betc-reports` created
- [ ] `@supabase/supabase-js` installed and client singleton created
- [ ] TypeScript types generated from Supabase schema
- [ ] All "IC Visite Chantier" references replaced with "BETClaw"
- [ ] All `ic-blue` color references replaced with `betc-teal`
- [ ] Aulnay-specific defaults removed (AULNAY_BATIMENTS, DEFAULT_PARTICIPANTS, AULNAY_DEFAULTS)
- [ ] IndexedDB renamed to `betclaw`
- [ ] `npm run typecheck` passes
- [ ] `npm run build` passes
- [ ] `.env` has real Supabase credentials
- [ ] `.env.example` documents all env vars
- [ ] App loads with BETClaw branding in dev server

---

## COMPLETION CHECKLIST

- [ ] All tasks 1-17 completed in order
- [ ] `npm run typecheck` — 0 errors
- [ ] `npm run build` — 0 errors
- [ ] No `ic-blue`, `IC Visite`, or `AULNAY` references in src/
- [ ] Supabase tables verified via MCP
- [ ] Dev server shows BETClaw branding
- [ ] All acceptance criteria met

---

## NOTES

### Design Decisions

1. **Teal brand color** (`#0F766E` / Tailwind teal-700): Professional, distinct from IC blue, works well on mobile. Can be adjusted later.

2. **Fail fast on missing credentials**: If `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` are missing, the app throws immediately. Supabase is always available (cloud) — no reason to support a "no backend" mode.

3. **Keep existing types**: `src/types.ts` with `Visite`, `Observation`, `Photo` is NOT deleted. The existing IndexedDB flow still works. BETClaw Supabase types live separately in `src/types/database.types.ts`. Merging happens in Passe 2-4 when we build the sync layer.

4. **Auto-create visite with empty defaults**: The app still creates a blank visite on first load. This is a temporary measure — Passe 2 replaces this with a proper MissionList + MissionCreate screen.

5. **Trigger function prefixed**: `betc_update_updated_at()` instead of `update_updated_at()` to avoid conflicts with existing functions in the shared Supabase project.

### Risks

- **Auth redirect URLs**: Must be configured manually in Supabase Dashboard. If forgotten, magic link login will fail in Passe 7.
- **Generated types file size**: The `gen types` command generates types for ALL tables, not just `betc_*`. The file may be large but that's harmless.
- **IndexedDB data loss**: Renaming the DB from `ic-visite-chantier` to `betclaw` means old test data is inaccessible. This is intentional — we're pivoting.

### Time Estimate

- Tasks 1-3 (Supabase): ~45 min
- Tasks 4-8 (Client + types): ~30 min
- Tasks 9-16 (Rebranding): ~45 min
- Task 17 (Validation): ~15 min
- **Total: ~2-2.5h**
