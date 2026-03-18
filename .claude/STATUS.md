# IC-VisiteChantier - Current Status

**Last Updated**: 2026-03-18
**Current Phase**: Phase 2 — PWA Field Data Capture
**Target**: MVP for next site visit

---

## Current Focus

**Task File**: `.claude/tasks/pwa-field-capture.md`

### Priority Order

1. **PWA Field Capture** - Complete, pending commit
2. **Manual testing** - Test on mobile with real data
3. **Polish** - UX refinements based on field use

---

## What's DONE

### Phase 1: Report Template
- [x] DOCX template with IC branding
- [x] render_cr_visite.py script
- [x] Reference JSON context

### Phase 2: PWA Field Capture
- [x] Vite + Preact + Tailwind v4 scaffolding
- [x] IndexedDB data layer (Dexie.js)
- [x] Mobile-optimized UI components
- [x] ZIP export matching render_cr_visite.py format
- [x] ISO date support in render script
- [x] PWA with offline support (service worker)
- [x] TypeScript clean, production build successful

---

## Architecture

```
PWA (Preact + Vite)          Python Script
┌──────────────────┐        ┌──────────────────┐
│ Visit Header     │        │ render_cr_visite  │
│ Observation Form │───ZIP──│   .py             │
│ Observation List │        │                   │
│ Export View      │        │ → DOCX Report     │
│ IndexedDB/Dexie  │        │                   │
└──────────────────┘        └──────────────────┘
```

---

## Quick Commands

```bash
# Development
npm run dev

# Type check
npx tsc --noEmit

# Build
npm run build

# Generate report from export
python template/render_cr_visite.py context.json --photos-dir ./photos
```

---

## Key Files

```
src/
├── main.tsx                    # Entry point
├── app.tsx                     # Root component with view routing
├── types.ts                    # TypeScript interfaces
├── styles.css                  # Tailwind v4 entry
├── db/
│   ├── schema.ts               # Dexie database definition
│   └── operations.ts           # CRUD helpers
├── lib/
│   ├── export-zip.ts           # ZIP generation
│   └── ref-generator.ts        # V{n}-{nn} refs
├── components/
│   ├── visit-header.tsx        # Visit metadata form
│   ├── observation-form.tsx    # Data entry form
│   ├── observation-list.tsx    # Reactive list
│   ├── observation-card.tsx    # Single observation card
│   ├── export-view.tsx         # Recap + export
│   └── ui/
│       ├── select-field.tsx    # Reusable select
│       ├── text-field.tsx      # Reusable text input
│       └── photo-capture.tsx   # Camera + compression
template/
├── render_cr_visite.py         # Report generator
├── template_cr_visite_aulnay.docx
└── context_visite_27022026.json
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Preact + Vite + Tailwind v4 |
| Storage | IndexedDB (Dexie.js) |
| Export | JSZip |
| Report | Python + python-docx + Pillow |
| PWA | vite-plugin-pwa + Workbox |

---

**Next Action**: `/commit` then test on mobile device.
