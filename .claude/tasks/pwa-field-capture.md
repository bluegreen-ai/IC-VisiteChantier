# Feature: PWA Field Data Capture

## Goal
Offline-first PWA for construction site field data capture — observations with photos, export ZIP for render_cr_visite.py.

## Context
- **PRD Reference**: `.claude/PRD.md` section 3
- **Plan**: `.claude/plans/pwa-field-capture.md`
- **Related Files**: `template/render_cr_visite.py`, `template/context_visite_27022026.json`

## Tasks

### Phase 1: Project Scaffolding
- [x] Task 1: Scaffold Vite + Preact project ✓ 2026-03-18
- [x] Task 2: Install dependencies ✓ 2026-03-18
- [x] Task 3: Create vite.config.ts ✓ 2026-03-18
- [x] Task 4: Create src/styles.css (Tailwind v4) ✓ 2026-03-18
- [x] Task 5: Create index.html ✓ 2026-03-18
- [x] Task 6: Create public/ PWA assets (placeholder icons) ✓ 2026-03-18

### Phase 2: Data Layer
- [x] Task 7: Create src/types.ts ✓ 2026-03-18
- [x] Task 8: Create src/db/schema.ts ✓ 2026-03-18
- [x] Task 9: Create src/db/operations.ts ✓ 2026-03-18
- [x] Task 10: Update render_cr_visite.py for ISO dates ✓ 2026-03-18
- [x] Task 11: Create src/lib/ref-generator.ts ✓ 2026-03-18
- [x] Task 12: Create src/lib/export-zip.ts ✓ 2026-03-18

### Phase 3: UI Components
- [x] Task 13: Create src/components/ui/select-field.tsx ✓ 2026-03-18
- [x] Task 14: Create src/components/ui/text-field.tsx ✓ 2026-03-18
- [x] Task 15: Create src/components/ui/photo-capture.tsx ✓ 2026-03-18
- [x] Task 16: Create src/components/observation-form.tsx ✓ 2026-03-18
- [x] Task 17: Create src/components/observation-card.tsx ✓ 2026-03-18
- [x] Task 18: Create src/components/observation-list.tsx ✓ 2026-03-18
- [x] Task 19: Create src/components/visit-header.tsx ✓ 2026-03-18
- [x] Task 20: Create src/components/export-view.tsx ✓ 2026-03-18

### Phase 4: App Shell & Integration
- [x] Task 21: Create src/app.tsx with view routing ✓ 2026-03-18
- [x] Task 22: Create src/main.tsx entry point ✓ 2026-03-18
- [x] Task 23: Update tsconfig.json ✓ 2026-03-18

### Phase 5: Validation
- [x] Task 24: TypeScript compiles (npx tsc --noEmit) ✓ 2026-03-18
- [x] Task 25: Build succeeds (npm run build) ✓ 2026-03-18

## Completion
- **Started**: 2026-03-18
- **Completed**: 2026-03-18
- **Commit**: (pending)
