# IC-VisiteChantier

Site visit report generator for IC Ingénieurs Conseils. Two-part system: a **PWA** for field data capture on construction sites + a **Python script** for generating branded DOCX reports.

## Current Project: Résidence Savigny Impair, Aulnay-sous-Bois

Balcony refurbishment monitoring (Lot 12) for SDC Le Gros Saule, contractor Bouygues Bâtiment.

## Features

### PWA Field Capture (Phase 2 — complete)

Mobile-first offline PWA for on-site data entry:
- Select Building / Floor / Facade with pre-configured options
- Add observations with text + photos (camera or gallery)
- Review and edit observations in a scrollable list
- Export ZIP (JSON context + photos) ready for report generation
- Works offline — all data stored locally in IndexedDB

### DOCX Report Generator (Phase 1 — complete)

Generate a branded IC Ingénieurs Conseils report from the exported ZIP:

```bash
cd template
python render_cr_visite.py context.json --photos-dir ./photos --output cr.docx
```

**Python dependencies:** `pip install python-docx Pillow`

## Getting Started

### PWA Development

```bash
npm install
npm run dev          # Start dev server
npm run build        # Production build (includes type check)
npm run typecheck    # Type check only
```

Deployed on GitHub Pages. Also installable as PWA on mobile.

### Report Generation

```bash
# From an exported ZIP
unzip export.zip -d export/
cd template
python render_cr_visite.py ../export/context.json --photos-dir ../export/photos --output cr.docx
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Preact 10 + Vite 7 + Tailwind v4 |
| Storage | IndexedDB (Dexie.js) — offline-first |
| Export | JSZip |
| PWA | vite-plugin-pwa + Workbox |
| Report | Python + python-docx + Pillow |

## Project Structure

```
src/
├── main.tsx                    # Entry point
├── app.tsx                     # Root component, 3-tab navigation
├── types.ts                    # TypeScript interfaces
├── styles.css                  # Tailwind v4 entry
├── db/
│   ├── schema.ts               # Dexie database definition
│   └── operations.ts           # CRUD helpers
├── lib/
│   ├── export-zip.ts           # ZIP generation
│   └── ref-generator.ts        # V{n}-{nn} reference codes
├── components/
│   ├── visit-header.tsx        # Visit metadata form
│   ├── observation-form.tsx    # Data entry form
│   ├── observation-list.tsx    # Reactive list
│   ├── observation-card.tsx    # Single observation display
│   ├── export-view.tsx         # Recap + ZIP export
│   └── ui/                     # Reusable UI components
template/
├── render_cr_visite.py         # DOCX report generator
├── template_cr_visite_aulnay.docx  # IC-branded template
├── context_visite_27022026.json    # Example context
└── README.md                   # Render script documentation
```

## Documentation

- **[PRD](.claude/PRD.md)** — Full specifications and roadmap
- **[Status](.claude/STATUS.md)** — Current state and next actions
- **[Workflow Guide](docs/workflow-guide.md)** — Development methodology
