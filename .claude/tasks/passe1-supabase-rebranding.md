# Feature: Passe 1 — Supabase Setup + Rebranding to BETClaw

## Goal
Set up the Supabase backend (6 betc_* tables, auth, storage) and rebrand the PWA from "IC Visite Chantier" to "BETClaw".

## Context
- **PRD Reference**: `.claude/PRD.md` section 4
- **Plan**: `.claude/plans/passe1-supabase-rebranding.md`

## Tasks

### Phase 1: Supabase Schema + Storage
- [x] Task 1: CREATE betc_* tables via migration (6 tables + RLS + triggers) ✓ 2026-03-21
- [x] Task 2: CREATE storage buckets (betc-photos, betc-reports) via migration ✓ 2026-03-21
- [x] Task 3: CONFIGURE Supabase Auth (manual step — documented for user) ✓ 2026-03-21

### Phase 2: Client-Side Supabase Integration
- [x] Task 4: INSTALL @supabase/supabase-js ✓ 2026-03-21
- [x] Task 5: CREATE src/lib/supabase.ts (client singleton) ✓ 2026-03-21
- [x] Task 6: UPDATE .env + .env.example with credentials ✓ 2026-03-21
- [x] Task 7: GENERATE TypeScript types from Supabase ✓ 2026-03-21
- [x] Task 8: UPDATE src/lib/supabase.ts with generated types ✓ 2026-03-21

### Phase 3: Rebranding
- [x] Task 9: REBRAND index.html (title + theme-color) ✓ 2026-03-21
- [x] Task 10: REBRAND vite.config.ts (PWA manifest) ✓ 2026-03-21
- [x] Task 11: REBRAND src/styles.css (theme colors ic-blue → betc-teal) ✓ 2026-03-21
- [x] Task 12: REBRAND app.tsx (header + remove Aulnay defaults) ✓ 2026-03-21
- [x] Task 13: REBRAND visit-header.tsx (remove AULNAY_DEFAULTS) ✓ 2026-03-21
- [x] Task 14: UPDATE src/db/schema.ts (rename DB to betclaw) ✓ 2026-03-21
- [x] Task 15: UPDATE package.json (rename project) ✓ 2026-03-21
- [x] Task 16: UPDATE .gitignore (.env) ✓ 2026-03-21

### Phase 4: Validation
- [x] Task 17: FINAL BUILD + TYPECHECK (0 errors) ✓ 2026-03-21

## Notes
- SQL migrations saved in `supabase/migrations/` for tracking (user request)
- Auth redirect URLs need manual dashboard config (Task 3)
- database.types.ts includes ALL project tables, not just betc_* — harmless

## Completion
- **Started**: 2026-03-21
- **Completed**: 2026-03-21
- **Commit**: (pending /commit)
