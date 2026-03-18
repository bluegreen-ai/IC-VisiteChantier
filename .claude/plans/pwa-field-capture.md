# Feature: PWA Field Data Capture (Phase 2)

The following plan should be complete, but its important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils types and models. Import from the right files etc.

## Feature Description

Offline-first Progressive Web App for construction site field data capture. Allows Renaud to quickly record observations (building/floor/facade + text + photos) on his phone during site visits, then export a ZIP file (JSON + photos) that feeds directly into the existing `render_cr_visite.py` script for branded DOCX report generation.

## User Story

As a construction site inspector (Renaud)
I want to capture observations with photos on my phone during site visits
So that I can generate professional DOCX reports without manual copy-paste from Google Docs

## Problem Statement

Currently, field notes are taken in Google Docs (photos + short comments by floor/facade). Reorganizing this into the structured JSON format for the render script requires tedious manual work. The tool must work offline on construction sites with poor connectivity.

## Solution Statement

A single-page PWA with Preact + Vite that stores observations in IndexedDB (Dexie.js), works fully offline via service worker, and exports a ZIP file matching the exact format expected by `render_cr_visite.py`.

## Feature Metadata

**Feature Type**: New Capability
**Estimated Complexity**: High
**Primary Systems Affected**: New frontend PWA, integration with `template/render_cr_visite.py`
**Dependencies**: Preact, Vite, Dexie.js, JSZip, Tailwind CSS v4, vite-plugin-pwa

---

## CONTEXT REFERENCES

### Relevant Codebase Files — MUST READ BEFORE IMPLEMENTING

- `template/render_cr_visite.py` (lines 106-239) — The render function that consumes our export. Defines the exact JSON schema and photo handling logic.
- `template/context_visite_27022026.json` — Reference JSON context with 17 real observations. This is our "golden" test file.
- `template/template_cr_visite_aulnay.docx` — The DOCX template. Don't modify, but understand what variables exist.
- `.claude/docs/pwa-stack-patterns.md` — Stack research with working code examples for Preact, Vite, Dexie, JSZip, Tailwind, vite-plugin-pwa. **Read this before coding.**
- `CLAUDE.md` — Project conventions (kebab-case files, English code, offline-first principle)

### New Files to Create

```
src/
├── index.html                    # App shell with viewport meta, PWA manifest link
├── main.tsx                      # App entry point, render to DOM
├── app.tsx                       # Root component with routing/views
├── components/
│   ├── visit-header.tsx          # Visit metadata form (date, building, participants)
│   ├── observation-form.tsx      # Add/edit observation (floor/facade/text/photo)
│   ├── observation-list.tsx      # Scrollable list of captured observations
│   ├── observation-card.tsx      # Single observation preview card
│   ├── export-view.tsx           # Recap table + export button
│   └── ui/
│       ├── select-field.tsx      # Reusable select with label
│       ├── text-field.tsx        # Reusable text input/textarea
│       └── photo-capture.tsx     # Camera input + thumbnail preview
├── db/
│   ├── schema.ts                 # Dexie database definition
│   └── operations.ts             # CRUD helpers for visits, observations, photos
├── lib/
│   ├── export-zip.ts             # Build ZIP matching render_cr_visite.py format
│   └── ref-generator.ts          # Generate V{n}-{nn} observation references
├── types.ts                      # TypeScript interfaces
├── styles.css                    # Tailwind v4 entry (@import "tailwindcss")
└── vite-env.d.ts                 # Vite type declarations
vite.config.ts                    # Vite + Preact + PWA + Tailwind config
tsconfig.json                     # TypeScript config
package.json                      # Dependencies
public/
├── manifest.json                 # PWA manifest
├── icon-192.png                  # PWA icon
└── icon-512.png                  # PWA icon
```

### Relevant Documentation

**Read `.claude/docs/pwa-stack-patterns.md` FIRST — it contains tested code examples for all libraries.**

**Fallback URLs:**
- [Preact Signals](https://preactjs.com/guide/v10/signals/) — State management pattern
- [Dexie.js Getting Started](https://dexie.org/docs/Tutorial/Getting-started) — IndexedDB wrapper
- [vite-plugin-pwa Guide](https://vite-pwa-org.netlify.app/guide/) — Service worker config
- [JSZip API](https://stuk.github.io/jszip/documentation/api_jszip.html) — ZIP generation
- [Tailwind CSS v4](https://tailwindcss.com/docs/installation/vite) — Utility-first CSS

### Patterns to Follow

**Naming Conventions (from CLAUDE.md):**
- Files: `kebab-case.ts` / `kebab-case.tsx`
- Classes/Components: `PascalCase`
- Functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE`

**State Management:**
- Use Preact signals for shared state (module-level `signal()`)
- Use `useSignal()` for component-local state
- Dexie `useLiveQuery()` for reactive database reads

**Error Handling (from CLAUDE.md):**
- Fail fast with detailed errors
- Always catch `QuotaExceededError` on IndexedDB writes
- Show user-visible error messages on storage failures

---

## EXPORT FORMAT SPECIFICATION (CRITICAL)

The PWA export ZIP MUST match this exact structure:

```
visite-{date}-{batiment}.zip
├── context.json
└── photos/
    ├── obs-001.jpg
    ├── obs-002.jpg
    └── ...
```

### JSON Schema (context.json)

```typescript
interface ExportContext {
  titre_service: string;        // e.g., "Suivi de réfection des balcons - Lot 12"
  client: string;               // e.g., "SDC Le Gros Saule"
  residence: string;            // e.g., "Résidence Savigny Impair"
  batiments_visites: string;    // e.g., "Bâtiment A"
  adresse: string;
  code_postal_ville: string;    // e.g., "93600 Aulnay-sous-Bois"
  ref_dossier: string;          // e.g., "DE0328"
  date_visite: string;          // ISO 8601 format: "2026-02-27"
  participants: Participant[];
  objet_visite: string;         // Supports \n line breaks
  synthese: string;             // Supports \n and • bullets
  observations: Observation[];
  conclusion: string;           // Supports \n and • bullets
}

interface Participant {
  nom: string;
  fonction: string;
  entreprise: string;
  contact: string;
}

interface Observation {
  ref: string;            // Pattern: V{n}-{nn} e.g., "V1-01" (zero-padded)
  etage_facade: string;   // e.g., "10ème — Façade Est" or "Général"
  observation: string;    // Description text
  action: string;         // Corrective action (can be "")
  photo: string;          // FILENAME ONLY, no path (e.g., "obs-001.jpg")
}
```

### Key Constraints

- **Date format**: ISO 8601 `"YYYY-MM-DD"` (e.g., `"2026-02-27"`). `render_cr_visite.py` converts to French for the DOCX.
- **Photo references**: filename only, flat in `photos/` directory
- **Ref pattern**: `V{visitNumber}-{observationNumber}` with zero-padded two-digit observation number
- **Missing photos**: empty string `""` if no photo for an observation
- **Line breaks**: `\n` in text fields, `• ` (Unicode bullet + space) for bullet points
- **Photo compression in ZIP**: Use `STORE` (images already compressed), `DEFLATE` only for JSON

---

## IMPLEMENTATION PLAN

### Phase 1: Project Scaffolding

Set up the Vite + Preact project with all dependencies and configuration.

**Tasks:**
- Scaffold Vite project with Preact template
- Install all dependencies
- Configure Vite (PWA plugin, Tailwind v4)
- Set up TypeScript config
- Create PWA manifest and placeholder icons
- Create app shell HTML with mobile viewport meta

### Phase 2: Data Layer

Define the IndexedDB schema with Dexie and implement CRUD operations.

**Tasks:**
- Define TypeScript interfaces for all data types
- Create Dexie database with visits, observations, and photos tables
- Implement CRUD operations with quota error handling
- Implement ref generator (V{n}-{nn})
- Update render_cr_visite.py to accept ISO dates and convert to French for DOCX output

### Phase 3: UI Components

Build the mobile-optimized capture interface.

**Tasks:**
- Create the visit header form (project metadata + participants)
- Create the observation form (building/floor/facade selectors + text + camera)
- Create the observation list with edit/delete
- Create the photo capture component with thumbnail preview
- Wire up Dexie live queries for reactive UI

### Phase 4: Export

Implement ZIP export matching render_cr_visite.py format.

**Tasks:**
- Build the export view with recap table
- Implement ZIP generation (JSON + photos)
- Add download trigger
- Test export against render_cr_visite.py

### Phase 5: PWA & Polish

Enable offline mode and mobile optimizations.

**Tasks:**
- Configure service worker for offline-first
- Add install prompt
- Test offline workflow
- Mobile UX polish (touch targets, safe areas)

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic and independently testable.

---

### Task 1: CREATE project scaffolding

```bash
cd /Users/renaud/Projects/IC-VisiteChantier
npm create vite@latest . -- --template preact-ts
# If prompted about existing files, choose to ignore/skip existing
```

If the directory already has files, scaffold in a temp directory and move the src files:
```bash
npm create vite@latest temp-pwa -- --template preact-ts
# Copy relevant files (src/, tsconfig, vite.config, index.html) into project root
# Remove temp-pwa
```

- **VALIDATE**: `ls src/main.tsx && echo "OK"`

---

### Task 2: UPDATE package.json — install dependencies

```bash
npm install preact @preact/signals dexie jszip
npm install -D vite @preact/preset-vite vite-plugin-pwa tailwindcss @tailwindcss/vite @types/jszip typescript
```

- **VALIDATE**: `npm ls preact dexie jszip`

---

### Task 3: CREATE vite.config.ts

```typescript
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    preact(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'IC Visite Chantier',
        short_name: 'IC Visite',
        description: 'Saisie terrain pour comptes rendus de visite',
        theme_color: '#1F3A5F',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
});
```

- **GOTCHA**: Use `registerType: 'prompt'`, NOT `autoUpdate` — autoUpdate can destroy unsaved form data.
- **GOTCHA**: `navigateFallback: 'index.html'` is required for offline SPA routing.
- **VALIDATE**: `npx vite build --mode development 2>&1 | tail -5`

---

### Task 4: CREATE src/styles.css

```css
@import "tailwindcss";

@theme {
  --color-ic-blue: #1F3A5F;
  --color-ic-blue-light: #F0F4F8;
  --color-action-orange: #804000;
}
```

- **GOTCHA**: Tailwind v4 uses `@import "tailwindcss"` — no `@tailwind` directives, no `tailwind.config.js`.
- **VALIDATE**: File exists and imports tailwindcss.

---

### Task 5: CREATE index.html

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta name="theme-color" content="#1F3A5F" />
  <link rel="icon" href="/icon-192.png" />
  <link rel="apple-touch-icon" href="/icon-192.png" />
  <title>IC Visite Chantier</title>
</head>
<body class="bg-gray-50 text-gray-900 antialiased">
  <div id="app"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

- **VALIDATE**: `grep 'viewport-fit=cover' index.html`

---

### Task 6: CREATE public/ PWA assets

Create placeholder icons. Use simple colored squares (IC blue #1F3A5F) as placeholders:

```bash
mkdir -p public
# Generate placeholder PNGs with a simple script or copy from template
```

Create `public/manifest.json` — actually NOT needed since vite-plugin-pwa generates it from config. But place icon files in `public/`.

- **GOTCHA**: vite-plugin-pwa auto-generates the manifest from `vite.config.ts`. Don't duplicate it.
- **VALIDATE**: `ls public/icon-192.png public/icon-512.png`

---

### Task 7: CREATE src/types.ts

```typescript
/** Matches the JSON schema expected by render_cr_visite.py */
export interface ExportContext {
  titre_service: string;
  client: string;
  residence: string;
  batiments_visites: string;
  adresse: string;
  code_postal_ville: string;
  ref_dossier: string;
  date_visite: string;
  participants: Participant[];
  objet_visite: string;
  synthese: string;
  observations: ExportObservation[];
  conclusion: string;
}

export interface Participant {
  nom: string;
  fonction: string;
  entreprise: string;
  contact: string;
}

/** Observation as stored in the export JSON */
export interface ExportObservation {
  ref: string;
  etage_facade: string;
  observation: string;
  action: string;
  photo: string;
}

/** Building configuration — supports optional named stairwells */
export interface BatimentConfig {
  id: string;          // "A", "B", "C", "D"
  label: string;       // "Bâtiment A"
  cages?: string[];    // undefined = single stairwell (hidden), ["52","54","56"] = named stairwells
}

/** Observation as stored in IndexedDB (richer than export) */
export interface Observation {
  id?: number;
  visiteId: number;
  batiment: string;
  cage?: string;       // stairwell name (e.g., "52 av. de Savigny"), only if batiment has cages
  etage: string;
  facade: string;
  observation: string;
  action: string;
  photoId?: number;
  createdAt: string;
}

/** Photo blob stored separately in IndexedDB */
export interface Photo {
  id?: number;
  visiteId: number;
  observationId?: number;
  blob: Blob;
  filename: string;
  createdAt: string;
}

/** Visit session stored in IndexedDB */
export interface Visite {
  id?: number;
  titre_service: string;
  client: string;
  residence: string;
  batiments_visites: string;
  adresse: string;
  code_postal_ville: string;
  ref_dossier: string;
  date_visite: Date;
  visitNumber: number;
  objet_visite: string;
  synthese: string;
  conclusion: string;
  participants: Participant[];
  batiments: BatimentConfig[];   // building configs for this project (with optional cages)
  createdAt: string;
  updatedAt: string;
}

/** Floor and facade options */
export const ETAGES = ['RDC', '1er', '2ème', '3ème', '4ème', '5ème', '6ème', '7ème', '8ème', '9ème', '10ème'] as const;
export const FACADES = ['Nord', 'Sud', 'Est', 'Ouest'] as const;
```

- **PATTERN**: Separate `ExportObservation` (flat, for JSON) from `Observation` (relational, for IndexedDB)
- **VALIDATE**: `npx tsc --noEmit src/types.ts`

---

### Task 8: CREATE src/db/schema.ts

```typescript
import Dexie, { type Table } from 'dexie';
import type { Visite, Observation, Photo } from '../types';

export class VisiteDB extends Dexie {
  visites!: Table<Visite, number>;
  observations!: Table<Observation, number>;
  photos!: Table<Photo, number>;

  constructor() {
    super('ic-visite-chantier');
    this.version(1).stores({
      visites: '++id, createdAt',
      observations: '++id, visiteId, createdAt',
      photos: '++id, visiteId, observationId',
    });
  }
}

export const db = new VisiteDB();
```

- **GOTCHA**: Only indexed fields go in the schema string. All object properties are stored regardless.
- **GOTCHA**: `Blob` objects (photos) are stored directly — no base64 conversion needed.
- **VALIDATE**: `npx tsc --noEmit src/db/schema.ts`

---

### Task 9: CREATE src/db/operations.ts

Implement CRUD operations for visits, observations, and photos. Key operations:

```typescript
import { db } from './schema';
import type { Visite, Observation, Photo } from '../types';

// --- Visites ---
export async function createVisite(data: Omit<Visite, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> { ... }
export async function getVisite(id: number): Promise<Visite | undefined> { ... }
export async function updateVisite(id: number, data: Partial<Visite>): Promise<void> { ... }
export async function listVisites(): Promise<Visite[]> { ... }
export async function deleteVisite(id: number): Promise<void> {
  // Delete visit + its observations + its photos (cascade)
  await db.transaction('rw', [db.visites, db.observations, db.photos], async () => {
    await db.photos.where('visiteId').equals(id).delete();
    await db.observations.where('visiteId').equals(id).delete();
    await db.visites.delete(id);
  });
}

// --- Observations ---
export async function addObservation(data: Omit<Observation, 'id' | 'createdAt'>): Promise<number> { ... }
export async function updateObservation(id: number, data: Partial<Observation>): Promise<void> { ... }
export async function deleteObservation(id: number): Promise<void> {
  // Also delete associated photo
  await db.transaction('rw', [db.observations, db.photos], async () => {
    await db.photos.where('observationId').equals(id).delete();
    await db.observations.delete(id);
  });
}
export async function getObservationsForVisite(visiteId: number): Promise<Observation[]> { ... }

// --- Photos ---
export async function savePhoto(data: Omit<Photo, 'id' | 'createdAt'>): Promise<number> {
  try {
    return await db.photos.add({ ...data, createdAt: new Date().toISOString() });
  } catch (err) {
    if ((err as DOMException).name === 'QuotaExceededError') {
      throw new Error('Stockage plein. Supprimez des photos ou des visites.');
    }
    throw err;
  }
}
export async function getPhoto(id: number): Promise<Photo | undefined> { ... }
```

- **GOTCHA**: Always catch `QuotaExceededError` on photo saves — mobile Safari is aggressive with quotas.
- **GOTCHA**: Call `navigator.storage.persist()` on first app launch to request durable storage.
- **VALIDATE**: `npx tsc --noEmit src/db/operations.ts`

---

### Task 10: UPDATE template/render_cr_visite.py — accept ISO dates

Add a helper function that converts ISO date (`"2026-02-27"`) to French format (`"27 février 2026"`). Apply it to `date_visite` before template variable replacement. This keeps the DOCX output unchanged while allowing the JSON input to use standard ISO dates.

```python
MOIS_FR = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]

def format_date_french(iso_date: str) -> str:
    """Convert ISO date (YYYY-MM-DD) to French format (D mois YYYY).

    Passes through non-ISO strings unchanged for backward compatibility.
    """
    try:
        from datetime import datetime
        dt = datetime.strptime(iso_date, "%Y-%m-%d")
        return f"{dt.day} {MOIS_FR[dt.month - 1]} {dt.year}"
    except (ValueError, TypeError):
        return iso_date
```

Call `format_date_french()` on `context.get("date_visite", "")` in the `var_map` dict (line ~130) and in the intro paragraph replacement (line ~149).

Also remove the hardcoded `"27 février 2026"` check on line 148 — replace with a generic approach that uses the original template text or skips if no match.

- **GOTCHA**: Must remain backward-compatible — if someone passes a French date string, it passes through unchanged.
- **VALIDATE**: `python template/render_cr_visite.py template/context_visite_27022026.json --photos-dir ./photos` still works with existing French date.
- **VALIDATE**: Create a test JSON with `"date_visite": "2026-02-27"` and verify the DOCX shows "27 février 2026".

---

### Task 11: CREATE src/lib/ref-generator.ts

```typescript
/** Generate observation reference: V{visitNumber}-{nn} (zero-padded) */
export function generateRef(visitNumber: number, observationIndex: number): string {
  const nn = String(observationIndex + 1).padStart(2, '0');
  return `V${visitNumber}-${nn}`;
}
```

- **PATTERN**: Matches existing refs in context_visite_27022026.json (V1-01 through V1-17).
- **VALIDATE**: `generateRef(1, 0)` → `"V1-01"`, `generateRef(2, 14)` → `"V2-15"`

---

### Task 12: CREATE src/lib/export-zip.ts

Build ZIP matching render_cr_visite.py's expected input format:

```typescript
import JSZip from 'jszip';
import { db } from '../db/schema';
import type { ExportContext, ExportObservation } from '../types';
import { generateRef } from './ref-generator';

export async function exportVisiteZip(visiteId: number): Promise<Blob> {
  const visite = await db.visites.get(visiteId);
  if (!visite) throw new Error(`Visite ${visiteId} not found`);

  const observations = await db.observations.where('visiteId').equals(visiteId).sortBy('createdAt');

  const zip = new JSZip();
  const photosFolder = zip.folder('photos')!;

  // Build observations array + add photos to zip
  const exportObs: ExportObservation[] = [];
  for (let i = 0; i < observations.length; i++) {
    const obs = observations[i];
    let photoFilename = '';

    if (obs.photoId) {
      const photo = await db.photos.get(obs.photoId);
      if (photo) {
        photoFilename = `obs-${String(i + 1).padStart(3, '0')}.jpg`;
        photosFolder.file(photoFilename, photo.blob, { compression: 'STORE' });
      }
    }

    exportObs.push({
      ref: generateRef(visite.visitNumber, i),
      etage_facade: buildEtageFacade(obs.etage, obs.facade, obs.cage),
      observation: obs.observation,
      action: obs.action,
      photo: photoFilename,
    });
  }

  // Build context JSON
  const context: ExportContext = {
    titre_service: visite.titre_service,
    client: visite.client,
    residence: visite.residence,
    batiments_visites: visite.batiments_visites,
    adresse: visite.adresse,
    code_postal_ville: visite.code_postal_ville,
    ref_dossier: visite.ref_dossier,
    date_visite: visite.date_visite.toISOString().split('T')[0], // "2026-02-27"
    participants: visite.participants,
    objet_visite: visite.objet_visite,
    synthese: visite.synthese,
    observations: exportObs,
    conclusion: visite.conclusion,
  };

  zip.file('context.json', JSON.stringify(context, null, 2), { compression: 'DEFLATE' });

  return zip.generateAsync({ type: 'blob' });
}

function buildEtageFacade(etage: string, facade: string, cage?: string): string {
  const parts: string[] = [];
  if (cage) parts.push(cage);
  parts.push(etage);
  if (facade) parts.push(`Façade ${facade}`);
  return parts.join(' — ');
  // No cage:  "10ème — Façade Est"
  // With cage: "52 av. de Savigny — 3ème — Façade Nord"
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
```

- **CRITICAL**: Photos use `compression: 'STORE'` (already compressed). JSON uses `DEFLATE`.
- **CRITICAL**: Photo filenames are `obs-001.jpg`, `obs-002.jpg` etc. — flat in `photos/` folder.
- **CRITICAL**: `etage_facade` format must match existing data: "10ème — Façade Est" (em dash `—`, not hyphen).
- **VALIDATE**: Export a test visite, unzip, run `python template/render_cr_visite.py context.json --photos-dir ./photos`

---

### Task 13: CREATE src/components/ui/select-field.tsx

Reusable select component with label. Mobile-optimized with min-h-[44px] touch targets.

```typescript
interface SelectFieldProps {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  placeholder?: string;
}
```

- **PATTERN**: Use native `<select>` — better mobile UX than custom dropdowns.
- **VALIDATE**: Visual check in browser.

---

### Task 14: CREATE src/components/ui/text-field.tsx

Reusable text input / textarea with label. Supports both single-line and multiline.

- **VALIDATE**: Visual check in browser.

---

### Task 15: CREATE src/components/ui/photo-capture.tsx

Camera input component:

```html
<input type="file" accept="image/*" capture="environment" />
```

Key behaviors:
- Shows thumbnail preview after capture
- Stores the File blob directly (no base64 conversion)
- Compresses photos > 2MB using canvas resize before storing (mobile cameras produce 3-5MB photos)
- Shows file size indicator

- **GOTCHA**: Mobile cameras produce 3-5MB photos. Compress before storing in IndexedDB.
- **GOTCHA**: `capture="environment"` opens rear camera on mobile. Omit for gallery picker.
- **VALIDATE**: Test on mobile Safari and Chrome — camera should open directly.

---

### Task 16: CREATE src/components/observation-form.tsx

Main data entry form with:
- Select: Bâtiment (from `visite.batiments`)
- Select: Cage d'escalier — **only visible if selected bâtiment has `cages` defined**. Shows cage names (e.g., "52 av. de Savigny"). Hidden for single-stairwell buildings.
- Select: Étage (from ETAGES)
- Select: Façade (from FACADES)
- Text input: observation (1-2 lines)
- Text input: action corrective (optional)
- Photo capture button
- "Ajouter" button → saves to IndexedDB and clears form
- Pre-fills bâtiment/cage/étage/façade from last observation (saves time when on same floor)

State management: Use `useSignal()` for form fields. Save via `db/operations.ts`.

- **PATTERN**: After adding, scroll the observation list to show the new entry.
- **VALIDATE**: Add an observation, verify it appears in the list.

---

### Task 17: CREATE src/components/observation-card.tsx

Compact card showing one observation:
- Ref badge (V1-01) in IC blue
- Location label: Cage (if any) — Étage — Façade
- Observation text (truncated to 2 lines)
- Photo thumbnail (small)
- Edit / Delete buttons (swipe or icons)

- **VALIDATE**: Visual check with multiple observations.

---

### Task 18: CREATE src/components/observation-list.tsx

Scrollable list of observation cards. Uses `useLiveQuery()` from Dexie for reactive updates.

```typescript
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
```

- **GOTCHA**: Import `useLiveQuery` from `dexie-react-hooks` — it works with Preact.
- **VALIDATE**: Add/delete observations and verify list updates reactively.

---

### Task 19: CREATE src/components/visit-header.tsx

Visit metadata form:
- Project info (titre_service, client, residence, etc.) — pre-filled with defaults for Aulnay project
- Date picker (defaults to today)
- Participants list (add/remove, pre-filled with Renaud)
- Visit number (auto-incremented)
- Building configuration (`batiments: BatimentConfig[]`) — pre-filled from defaults. User can edit cage names (free text) or add/remove cages per building. This is a "settings" section, collapsed by default since it rarely changes.

Store defaults in the component or a config constant. For the Aulnay project:
```typescript
const AULNAY_DEFAULTS = {
  titre_service: 'Suivi de réfection des balcons - Lot 12',
  client: 'SDC Le Gros Saule',
  residence: 'Résidence Savigny Impair',
  adresse: '1-50 avenue de Savigny',
  code_postal_ville: '93600 Aulnay-sous-Bois',
  ref_dossier: 'DE0328',
  batiments: [
    { id: 'A', label: 'Bâtiment A' },                                          // tour, 1 cage
    { id: 'B', label: 'Bâtiment B' },                                          // tour, 1 cage
    { id: 'C', label: 'Bâtiment C' },                                          // tour, 1 cage
    { id: 'D', label: 'Bâtiment D', cages: ['52 av. de Savigny', '54 av. de Savigny', '56 av. de Savigny'] },  // barre, multi-cage
  ],
};
```

- **VALIDATE**: Create a visit, verify metadata is stored in IndexedDB.

---

### Task 20: CREATE src/components/export-view.tsx

Recap screen before export:
- Summary table of all observations (scrollable)
- Observation count
- Photo count
- Missing fields warnings
- Editable text areas for `objet_visite`, `synthese`, `conclusion`
- "Exporter ZIP" button → calls `exportVisiteZip()` → `triggerDownload()`

- **VALIDATE**: Export a ZIP, unzip it, verify context.json schema matches specification.

---

### Task 21: CREATE src/app.tsx — Main app with view routing

Simple view switching (not a router library — overkill for 2-3 views):

```typescript
import { signal } from '@preact/signals';

type View = 'capture' | 'export';
const currentView = signal<View>('capture');
```

Layout:
- Top bar: "IC Visite Chantier" title + visit date
- Main area: either capture view (header + form + list) or export view
- Bottom: tab bar with "Saisie" and "Export" buttons
- Sticky observation form at top, scrollable list below

- **VALIDATE**: `npm run dev` → app loads, views switch.

---

### Task 22: CREATE src/main.tsx — Entry point

```typescript
import { render } from 'preact';
import { App } from './app';
import './styles.css';

// Request persistent storage on first launch
navigator.storage?.persist?.();

render(<App />, document.getElementById('app')!);
```

- **VALIDATE**: `npm run dev` → no console errors, app renders.

---

### Task 23: UPDATE tsconfig.json

Ensure these compiler options:
```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "preact",
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "paths": {
      "react": ["./node_modules/preact/compat/"],
      "react-dom": ["./node_modules/preact/compat/"]
    }
  },
  "include": ["src"]
}
```

- **GOTCHA**: `jsxImportSource: "preact"` is critical — without it, JSX compiles to React calls.
- **VALIDATE**: `npx tsc --noEmit`

---

### Task 24: Integration test — full export cycle

1. Start dev server: `npm run dev`
2. Create a visit with Aulnay defaults
3. Add 3 observations with photos
4. Switch to export view, fill in objet/synthese/conclusion
5. Export ZIP
6. Unzip and run: `python template/render_cr_visite.py context.json --photos-dir ./photos --output test_cr.docx`
7. Open test_cr.docx and verify:
   - Cover page has correct metadata
   - Participants table populated
   - Observations table has 3 rows with correct ref format
   - Photos are embedded and resized
   - Alternating row colors work

- **VALIDATE**: `python template/render_cr_visite.py context.json --photos-dir ./photos` exits with code 0

---

### Task 25: PWA offline test

1. Build: `npm run build`
2. Serve: `npx serve dist`
3. Load app in Chrome, verify "Install" prompt appears
4. Go to DevTools → Application → Service Workers → check "Offline"
5. Reload — app should load fully from cache
6. Add an observation with photo while offline
7. Export ZIP while offline
8. Verify ZIP is valid

- **VALIDATE**: App loads and functions with network disabled.

---

## TESTING STRATEGY

### Unit Tests (Vitest)

```bash
npm install -D vitest @testing-library/preact jsdom
```

Add to `vite.config.ts`:
```typescript
test: {
  environment: 'jsdom',
  globals: true,
}
```

**Test files to create:**
- `src/lib/__tests__/ref-generator.test.ts` — V{n}-{nn} generation
- `template/test_render_iso_date.py` — Verify render script handles ISO dates correctly
- `src/lib/__tests__/export-zip.test.ts` — ZIP structure validation
- `src/db/__tests__/operations.test.ts` — CRUD with fake-indexeddb

```bash
npm install -D fake-indexeddb
```

### Integration Tests

- `src/__tests__/export-integration.test.ts` — Full cycle: create visite → add observations → export ZIP → validate JSON schema

### Edge Cases to Test

- Observation with no photo (empty string in export)
- Observation with no action (empty string)
- Visit with 0 observations (valid but empty table)
- Photo > 5MB (compression should kick in)
- ISO date edge cases in render script: "2027-01-01" → "1 janvier 2027", backward compat with "27 février 2026"
- Ref generation with > 99 observations (V1-100)
- QuotaExceededError handling
- Special characters in observation text (accents, quotes, em dashes)

---

## VALIDATION COMMANDS

### Level 1: Syntax & Types

```bash
npx tsc --noEmit
```

**Expected**: Exit code 0, no type errors.

### Level 2: Unit Tests

```bash
npx vitest run
```

**Expected**: All tests pass.

### Level 3: Build

```bash
npm run build
ls dist/index.html dist/assets/*.js
```

**Expected**: Build succeeds, dist/ contains index.html and JS bundles.

### Level 4: Manual Validation

1. `npm run dev` → app loads on mobile viewport
2. Add 3+ observations with photos
3. Export ZIP → unzip → `python template/render_cr_visite.py context.json --photos-dir ./photos`
4. Verify DOCX output matches expected format

### Level 5: PWA Validation

```bash
npx serve dist
# Open in Chrome → DevTools → Lighthouse → PWA audit
```

**Expected**: PWA installable, works offline, all Lighthouse PWA checks pass.

---

## ACCEPTANCE CRITERIA

- [ ] App loads on mobile browser (iOS Safari, Android Chrome)
- [ ] Can create a visit with pre-filled Aulnay project defaults
- [ ] Can add observations with building/floor/facade selection
- [ ] Can capture photos from device camera
- [ ] Photos compressed to < 2MB before storage
- [ ] Observation list updates reactively (Dexie live queries)
- [ ] Can edit and delete observations
- [ ] Export produces ZIP with exact format for render_cr_visite.py
- [ ] `render_cr_visite.py` successfully generates DOCX from exported ZIP
- [ ] App works fully offline (service worker caching)
- [ ] App is installable as PWA
- [ ] French date format correct in export
- [ ] Observation refs follow V{n}-{nn} pattern
- [ ] IndexedDB storage quota errors handled gracefully
- [ ] Touch targets ≥ 44px on all interactive elements
- [ ] Unit tests pass for date-format, ref-generator, export-zip
- [ ] TypeScript compiles with no errors
- [ ] Production build succeeds

---

## COMPLETION CHECKLIST

- [ ] All 25 tasks completed in order
- [ ] Each task validation passed
- [ ] All validation commands executed successfully:
  - [ ] Level 1: `npx tsc --noEmit`
  - [ ] Level 2: `npx vitest run`
  - [ ] Level 3: `npm run build` + dist/ verification
  - [ ] Level 4: Manual export → render_cr_visite.py test
  - [ ] Level 5: Lighthouse PWA audit
- [ ] Full test suite passes
- [ ] No type errors
- [ ] Build succeeds
- [ ] All acceptance criteria met

---

## NOTES

### Design Decisions

1. **Preact over React**: Smaller bundle (~3KB vs ~40KB), critical for offline PWA. Signals provide simpler state management than useState/useReducer.

2. **No router library**: Only 2 views (capture + export). A signal-based view switch is simpler and lighter.

3. **Separate Photo table in IndexedDB**: Photos are large blobs (1-5MB). Keeping them in a separate table from observations allows efficient querying of observation metadata without loading photo data.

4. **Photo compression before storage**: Mobile cameras produce 3-5MB JPEG files. Canvas-based resize to max 1920px wide keeps quality while reducing storage impact. The render script resizes to max 5cm anyway.

5. **Hardcoded Aulnay defaults**: This is a single-project tool. Pre-filling project metadata eliminates repetitive data entry. Multi-project support is Phase 3 scope.

6. **Em dash (—) in etage_facade**: The existing context JSON uses `—` (em dash), not `-` (hyphen). The export must match this.

### Risks

- **iOS Safari IndexedDB quirks**: Safari may evict IndexedDB data under storage pressure. Mitigated by `navigator.storage.persist()` and prominent export reminders.
- **Camera API differences**: `capture="environment"` behavior varies across browsers. Fallback is standard file picker.
- **Large visit exports**: 50+ observations with photos could produce a 100MB+ ZIP. May need to chunk or stream.
