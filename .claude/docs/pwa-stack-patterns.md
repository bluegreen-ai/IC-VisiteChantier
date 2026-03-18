# PWA Stack Implementation Patterns

Reference for: Preact + Vite + vite-plugin-pwa + Dexie.js + JSZip + Tailwind CSS v4

---

## 1. Preact + Vite

### Install

```bash
# Scaffold with official Vite template
npm create vite@latest my-app -- --template preact-ts
cd my-app
npm install

# Add Preact signals (separate package)
npm install @preact/signals
```

### Versions (as of early 2026)
- Preact: 10.x stable (11.0.0-beta.1 exists, do NOT use in production)
- Vite: 6.x
- Template: `preact-ts` (TypeScript) or `preact` (JS)

### Signals — State Management

Signals are the preferred state primitive in Preact. They bypass vdom diffing for direct DOM updates when used directly in JSX.

```tsx
import { signal, computed, effect } from '@preact/signals';
import { useSignal, useComputed } from '@preact/signals'; // hook variants

// --- Module-level (shared state) ---
const count = signal(0);
const doubled = computed(() => count.value * 2);

effect(() => {
  console.log('count changed:', count.value);
  // return cleanup fn if needed
});

// --- Component-level ---
function Counter() {
  const count = useSignal(0);
  const doubled = useComputed(() => count.value * 2);

  return (
    <div>
      {/* Direct signal in JSX = no vdom diff, pure DOM update */}
      <p>Count: {count}</p>
      <p>Doubled: {doubled}</p>
      <button onClick={() => count.value++}>+</button>
    </div>
  );
}
```

### Key Differences from React
- No `useSyncExternalStore`, `useTransition`, `useTransition` — stubbed or absent
- `useEffect`, `useState`, `useRef`, `useContext` all work normally
- Import hooks from `preact/hooks`, not `react`
- For React-ecosystem libs: use `preact/compat` alias (see vite config below)

### vite.config.ts with preact/compat alias

```ts
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [preact()],
  resolve: {
    alias: {
      'react': 'preact/compat',
      'react-dom': 'preact/compat',
      'react/jsx-runtime': 'preact/jsx-runtime',
    },
  },
});
```

**Gotcha**: The Vite `preact-ts` template uses `@preact/preset-vite`, not `@vitejs/plugin-react`. Do not mix them.

---

## 2. vite-plugin-pwa

### Install

```bash
npm install -D vite-plugin-pwa workbox-window
```

### Minimal Offline-First Config

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    preact(),
    VitePWA({
      registerType: 'prompt',  // 'autoUpdate' risks data loss on forms
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      workbox: {
        // Precache all build output
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Offline fallback for navigation requests
        navigateFallback: 'index.html',
        // Don't precache large assets by default
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
        runtimeCaching: [
          {
            // Cache API calls with NetworkFirst (fresh data when online)
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
              networkTimeoutSeconds: 10,
            },
          },
        ],
      },
      manifest: {
        name: 'IC Visite Chantier',
        short_name: 'VisiteChantier',
        description: 'Rapport de visite chantier',
        theme_color: '#1d4ed8',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      devOptions: {
        enabled: true, // Test SW in dev mode
        type: 'module',
      },
    }),
  ],
});
```

### Preact SW Registration Component

```tsx
// src/components/PwaUpdater.tsx
import { useRegisterSW } from 'virtual:pwa-register/preact';

/// <reference types="vite-plugin-pwa/preact" />

export function PwaUpdater() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW registered:', r);
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    },
  });

  if (offlineReady) {
    return (
      <div class="fixed bottom-4 left-4 right-4 bg-green-600 text-white p-3 rounded-lg">
        App prête pour utilisation hors ligne
        <button onClick={() => setOfflineReady(false)} class="ml-2 underline">OK</button>
      </div>
    );
  }

  if (needRefresh) {
    return (
      <div class="fixed bottom-4 left-4 right-4 bg-blue-600 text-white p-3 rounded-lg">
        Nouvelle version disponible
        <button onClick={() => updateServiceWorker(true)} class="ml-2 underline">Mettre à jour</button>
        <button onClick={() => setNeedRefresh(false)} class="ml-2 underline">Plus tard</button>
      </div>
    );
  }

  return null;
}
```

### tsconfig.json addition

```json
{
  "compilerOptions": {
    "types": ["vite-plugin-pwa/preact"]
  }
}
```

### Key Gotchas
- Use `registerType: 'prompt'` (not `autoUpdate`) for form-heavy apps — autoUpdate can kill unsaved data mid-form
- `workbox-window` must be a devDependency, not dependency
- `navigateFallback: 'index.html'` is required for SPA routing to work offline
- Icons must physically exist in `public/` folder at build time
- HTTPS required in production (localhost works in dev)

---

## 3. Dexie.js

### Install

```bash
npm install dexie
# For React/Preact reactive queries:
# useLiveQuery is included in dexie itself
```

### Version note
Dexie 4.x is stable. The `useLiveQuery` hook works with Preact because it relies on standard hooks (`useState`/`useEffect`) internally — no React-specific APIs.

### Database Definition

```ts
// src/db.ts
import Dexie, { type EntityTable } from 'dexie';

// Type your records
interface VisiteRecord {
  id?: number;          // auto-increment — optional in TS interface
  chantierRef: string;  // indexed — queryable
  dateVisite: string;   // indexed
  statut: 'brouillon' | 'finalise';
  metadata: object;     // NOT indexed — stored but not queryable by index
  createdAt: number;    // timestamp
}

interface PhotoRecord {
  id?: number;
  visiteId: number;     // indexed — foreign key pattern
  filename: string;
  blob: Blob;           // Binary data — stored as-is in IndexedDB
  takenAt: number;
}

// Schema syntax:
//   ++id      = auto-increment primary key
//   &field    = unique index
//   *field    = multi-entry index (for arrays)
//   [f1+f2]   = compound index
//   field     = regular index (queryable)
//   (nothing) = stored but NOT indexed (cannot query/sort by it efficiently)
//
// IMPORTANT: Only list fields you need to QUERY. All object properties
// are stored regardless — schema only defines indexes.

class VisiteDB extends Dexie {
  visites!: EntityTable<VisiteRecord, 'id'>;
  photos!: EntityTable<PhotoRecord, 'id'>;

  constructor() {
    super('VisiteChantierDB');
    this.version(1).stores({
      visites: '++id, chantierRef, dateVisite, statut, createdAt',
      photos:  '++id, visiteId, takenAt',
    });
  }
}

export const db = new VisiteDB();
```

### CRUD Operations

```ts
// CREATE
const id = await db.visites.add({
  chantierRef: 'CH-2024-001',
  dateVisite: '2024-03-15',
  statut: 'brouillon',
  metadata: { temperature: 12, meteo: 'nuageux' },
  createdAt: Date.now(),
});

// READ — single
const visite = await db.visites.get(id);

// READ — query (only indexed fields work in where())
const brouillons = await db.visites
  .where('statut').equals('brouillon')
  .toArray();

// READ — all sorted
const all = await db.visites.orderBy('createdAt').reverse().toArray();

// UPDATE — partial
await db.visites.update(id, { statut: 'finalise' });

// UPDATE — full replace
await db.visites.put({ id, chantierRef: 'CH-2024-001', ...rest });

// DELETE
await db.visites.delete(id);

// BULK operations (much faster than individual adds)
await db.photos.bulkAdd([
  { visiteId: 1, filename: 'photo1.jpg', blob: blob1, takenAt: Date.now() },
  { visiteId: 1, filename: 'photo2.jpg', blob: blob2, takenAt: Date.now() },
]);
```

### Storing Photo Blobs

```ts
// Storing a File from <input type="file"> or camera capture
async function savePhoto(visiteId: number, file: File): Promise<number> {
  return await db.photos.add({
    visiteId,
    filename: file.name,
    blob: file,          // File extends Blob — works directly
    takenAt: Date.now(),
  });
}

// Retrieving and displaying
async function getPhotoUrl(photoId: number): Promise<string> {
  const photo = await db.photos.get(photoId);
  if (!photo) throw new Error('Photo not found');
  const url = URL.createObjectURL(photo.blob);
  // IMPORTANT: revoke when done to avoid memory leaks
  // URL.revokeObjectURL(url);
  return url;
}
```

### Reactive Queries with useLiveQuery

```tsx
// Works with Preact — useLiveQuery uses standard useState/useEffect internally
import { useLiveQuery } from 'dexie/react';
// OR: import { useLiveQuery } from 'dexie'; // also works in v4

function VisiteList() {
  const visites = useLiveQuery(
    () => db.visites.orderBy('createdAt').reverse().toArray(),
    [],  // deps array — re-subscribe when these change
  );

  // useLiveQuery returns undefined while loading
  if (!visites) return <div>Chargement...</div>;

  return (
    <ul>
      {visites.map(v => <li key={v.id}>{v.chantierRef}</li>)}
    </ul>
  );
}

// With parameters — re-run query when visiteId changes
function PhotoList({ visiteId }: { visiteId: number }) {
  const photos = useLiveQuery(
    () => db.photos.where('visiteId').equals(visiteId).toArray(),
    [visiteId],  // re-subscribes when visiteId changes
  );

  return <div>{photos?.length ?? 0} photos</div>;
}
```

### Transactions

```ts
// Atomic multi-table write
await db.transaction('rw', db.visites, db.photos, async () => {
  const visiteId = await db.visites.add({ ...visiteData });
  await db.photos.bulkAdd(photos.map(p => ({ ...p, visiteId })));
});
```

### Schema Versioning / Migrations

```ts
class VisiteDB extends Dexie {
  constructor() {
    super('VisiteChantierDB');

    // v1 — initial schema
    this.version(1).stores({
      visites: '++id, chantierRef, dateVisite, statut',
    });

    // v2 — add photos table + new index on visites
    this.version(2).stores({
      visites: '++id, chantierRef, dateVisite, statut, createdAt',
      photos:  '++id, visiteId',
    }).upgrade(tx => {
      // Migrate existing data if needed
      return tx.table('visites').toCollection().modify(v => {
        v.createdAt = Date.now();
      });
    });
  }
}
```

### Error Handling — Storage Quota

```ts
async function savePhotoSafely(visiteId: number, file: File) {
  try {
    await db.photos.add({ visiteId, filename: file.name, blob: file, takenAt: Date.now() });
  } catch (err) {
    if (err instanceof Error && err.name === 'QuotaExceededError') {
      // Handle gracefully — show user message
      alert('Stockage insuffisant. Supprimez des anciennes visites.');
    } else {
      throw err;
    }
  }
}

// Check available storage proactively
async function checkStorage() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const { usage, quota } = await navigator.storage.estimate();
    const usedMB = Math.round((usage ?? 0) / 1024 / 1024);
    const quotaMB = Math.round((quota ?? 0) / 1024 / 1024);
    console.log(`Storage: ${usedMB}MB / ${quotaMB}MB`);
    return { usedMB, quotaMB, percentUsed: usage && quota ? (usage / quota) * 100 : 0 };
  }
}
```

### Key Gotchas
- **Only indexed fields** can be used in `.where()` — querying non-indexed fields requires `.filter()` (full scan)
- Blobs stored in IndexedDB **do not survive** service worker caches — they live in IndexedDB only
- Mobile browsers (especially iOS Safari) have strict quota limits (~50-150MB for PWAs)
- `useLiveQuery` returns `undefined` on first render — always guard with null check
- In Dexie 4.x, use `EntityTable<T, 'id'>` for proper TypeScript types
- Do NOT call `db.version()` after any `db.open()` or queries — define all versions upfront

---

## 4. JSZip

### Install

```bash
npm install jszip
npm install -D @types/jszip  # TypeScript types
```

### Version: 3.10.1 (latest stable as of 2026)

### Creating a ZIP with JSON + Photo Blobs

```ts
import JSZip from 'jszip';

interface ExportData {
  visite: object;
  photos: Array<{ filename: string; blob: Blob }>;
}

async function exportVisiteZip(data: ExportData): Promise<void> {
  const zip = new JSZip();

  // Add JSON data file
  const jsonStr = JSON.stringify(data.visite, null, 2);
  zip.file('visite.json', jsonStr);

  // Add photos folder
  const photosFolder = zip.folder('photos')!;
  for (const photo of data.photos) {
    // Blobs and Files work directly — no conversion needed
    photosFolder.file(photo.filename, photo.blob);
  }

  // Generate ZIP as Blob
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },  // 1 (fast) to 9 (best)
  });

  // Trigger browser download
  triggerDownload(zipBlob, 'visite-chantier.zip');
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Clean up object URL after a short delay
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
```

### With Progress Tracking (for large photo sets)

```ts
const zipBlob = await zip.generateAsync(
  { type: 'blob', compression: 'DEFLATE' },
  (metadata) => {
    const percent = Math.round(metadata.percent);
    console.log(`Generating ZIP: ${percent}% — ${metadata.currentFile}`);
    // Update a progress signal: progressSignal.value = percent;
  }
);
```

### Loading a ZIP (for import/verification)

```ts
async function loadZip(file: File) {
  const zip = await JSZip.loadAsync(file);

  // Read JSON file
  const jsonFile = zip.file('visite.json');
  if (jsonFile) {
    const jsonStr = await jsonFile.async('string');
    const data = JSON.parse(jsonStr);
  }

  // Read all photos
  const photoFiles: Array<{ name: string; blob: Blob }> = [];
  for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
    if (relativePath.startsWith('photos/') && !zipEntry.dir) {
      const blob = await zipEntry.async('blob');
      photoFiles.push({ name: zipEntry.name, blob });
    }
  }
}
```

### Key Gotchas
- **No FileSaver.js required** — use `URL.createObjectURL()` + `<a>` click pattern (shown above)
- Image blobs should use `compression: 'STORE'` (not DEFLATE) — JPEG/PNG are already compressed, DEFLATE wastes CPU
- Large photo sets can spike memory — consider generating in batches or streaming
- `JSZip.support.blob` should be `true` in all target browsers; check in dev if needed
- The `streamFiles: true` option reduces memory but some unzip tools don't support it — avoid for user-facing exports

### Optimal compression for photo ZIPs

```ts
// Photos are already compressed (JPEG/PNG) — use STORE, not DEFLATE
photosFolder.file(photo.filename, photo.blob, { compression: 'STORE' });
// JSON is text — DEFLATE makes sense
zip.file('visite.json', jsonStr, { compression: 'DEFLATE' });
```

---

## 5. Tailwind CSS v4

### Install

```bash
npm install tailwindcss @tailwindcss/vite
```

**No `tailwind.config.js` needed in v4.** No PostCSS config needed when using the Vite plugin.

### vite.config.ts

```ts
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    preact(),
    tailwindcss(),  // Must come before VitePWA
    VitePWA({ /* ... */ }),
  ],
});
```

### CSS Entry Point

```css
/* src/index.css */
@import "tailwindcss";

/* Custom theme tokens (replaces tailwind.config.js theme section) */
@theme {
  --color-primary: #1d4ed8;
  --color-primary-dark: #1e3a8a;
  --breakpoint-xs: 30rem;
}
```

### Key v4 Changes vs v3
- No `tailwind.config.js` — configuration is in CSS via `@theme {}`
- No PostCSS config needed (Vite plugin handles it)
- `@apply` still works
- JIT is now the only mode (always on)
- Import: `@import "tailwindcss"` (not `@tailwind base; @tailwind components; @tailwind utilities`)

### Mobile PWA Utility Patterns

```html
<!-- Touch targets: minimum 44x44px (Apple HIG) / 48x48px (Material) -->
<button class="min-h-[44px] min-w-[44px] p-3 touch-manipulation">
  Tap me
</button>

<!-- Full-screen PWA layout with safe areas (notch, home indicator) -->
<div class="min-h-screen pb-safe pt-safe px-safe">
  <!-- pb-safe = padding-bottom: env(safe-area-inset-bottom) -->
</div>

<!-- Safe area insets (Tailwind v4 built-in) -->
<nav class="fixed bottom-0 w-full pb-safe bg-white">
  <!-- Navigation bar above home indicator -->
</nav>

<!-- Camera input — full width, mobile friendly -->
<label class="block w-full">
  <span class="sr-only">Prendre une photo</span>
  <input
    type="file"
    accept="image/*"
    capture="environment"
    class="block w-full text-sm text-gray-500
           file:mr-4 file:py-3 file:px-4
           file:rounded-lg file:border-0
           file:text-base file:font-medium
           file:bg-blue-600 file:text-white
           file:min-h-[44px]
           hover:file:bg-blue-700
           active:file:scale-95"
  />
</label>

<!-- Scrollable content area between fixed header and footer -->
<main class="flex-1 overflow-y-auto overscroll-contain">
  <!-- overscroll-contain prevents pull-to-refresh on iOS -->
</main>

<!-- Offline indicator banner -->
<div class="fixed top-0 w-full bg-yellow-400 text-center py-1 text-sm font-medium">
  Hors ligne — données sauvegardées localement
</div>
```

### Safe Area Insets Setup (index.html)

```html
<!-- Required meta tag for safe areas on iOS notch/Dynamic Island -->
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

### Key Gotchas
- `safe-area-inset-*` utilities (`pb-safe`, `pt-safe`) require `viewport-fit=cover` in the viewport meta tag
- In v4, arbitrary CSS variables are auto-detected — no need to list them in config
- `touch-manipulation` disables double-tap zoom delay (important for buttons)
- `overscroll-contain` on scroll areas prevents iOS pull-to-refresh conflicts with SW
- Use `active:scale-95` on buttons for tactile feedback (no hover on mobile)

---

## Complete Stack Integration Example

### Full vite.config.ts

```ts
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
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        navigateFallback: 'index.html',
      },
      manifest: {
        name: 'IC Visite Chantier',
        short_name: 'VisiteChantier',
        theme_color: '#1d4ed8',
        display: 'standalone',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
});
```

### package.json dependencies summary

```json
{
  "dependencies": {
    "preact": "^10.x",
    "@preact/signals": "^1.x",
    "dexie": "^4.x",
    "jszip": "^3.10.x"
  },
  "devDependencies": {
    "@preact/preset-vite": "^2.x",
    "@tailwindcss/vite": "^4.x",
    "tailwindcss": "^4.x",
    "vite": "^6.x",
    "vite-plugin-pwa": "^0.x",
    "workbox-window": "^7.x",
    "@types/jszip": "^3.x"
  }
}
```

---

## Mobile/PWA Gotchas Summary

| Issue | Library | Solution |
|-------|---------|----------|
| iOS Safari storage limit | Dexie | Request persistent storage: `navigator.storage.persist()` |
| Form data lost on SW update | vite-plugin-pwa | Use `registerType: 'prompt'`, not `autoUpdate` |
| Pull-to-refresh conflicts | Tailwind | Add `overscroll-contain` to scroll areas |
| Double-tap zoom delay | Tailwind | Use `touch-manipulation` on interactive elements |
| Safe area (notch/home bar) | Tailwind | `viewport-fit=cover` + `pb-safe`/`pt-safe` utilities |
| Photo blobs not compressed | JSZip | Use `compression: 'STORE'` for JPEG/PNG files |
| Blob URL memory leaks | Dexie/JSZip | Always call `URL.revokeObjectURL()` after use |
| SW not active in dev | vite-plugin-pwa | Set `devOptions: { enabled: true }` |
| iOS camera from PWA | HTML | `capture="environment"` on `<input type="file">` |
