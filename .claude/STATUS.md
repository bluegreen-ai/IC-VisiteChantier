# IC-VisiteChantier - Current Status

**Last Updated**: 2026-03-19
**Current Phase**: Phase 2 complete — ready for field testing
**Deployed**: GitHub Pages

---

## Current Focus

### Priority Order

1. **Field testing** — Use PWA on a real site visit, identify friction points
2. **UX polish** — Refinements based on field feedback
3. **Phase 3 planning** — Inter-visit tracking, multi-project support

---

## What's DONE

### Phase 1: Report Template
- [x] DOCX template with IC branding
- [x] render_cr_visite.py script (Python + python-docx + Pillow)
- [x] Reference JSON context (17 observations example)

### Phase 2: PWA Field Capture
- [x] Vite + Preact + Tailwind v4 scaffolding
- [x] IndexedDB data layer (Dexie.js) — offline-first
- [x] Mobile-optimized UI: 3-tab navigation (Add / List / Export)
- [x] Observation form: Building / Floor / Facade selectors + text + photos
- [x] Photo capture: camera + gallery buttons with compression
- [x] Observation list: edit, delete, photo thumbnails
- [x] ZIP export matching render_cr_visite.py format (includes script + template + README)
- [x] ISO date support in render script
- [x] PWA with offline support (service worker via Workbox)
- [x] Form validation
- [x] GitHub Pages deployment workflow
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

# Generate report from exported ZIP
unzip export.zip -d export/
python template/render_cr_visite.py export/context.json --photos-dir export/photos
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Preact 10 + Vite 7 + Tailwind v4 |
| Storage | IndexedDB (Dexie.js 4) |
| Export | JSZip |
| Report | Python + python-docx + Pillow |
| PWA | vite-plugin-pwa + Workbox |
| Hosting | GitHub Pages |

---

**Next Action**: Test on mobile device during next site visit.
