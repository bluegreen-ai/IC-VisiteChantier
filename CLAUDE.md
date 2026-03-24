# Project Guidelines for Claude Code

## Language Policy

- **Conversations**: French OK
- **Code, docs, commits**: English only

---

## Project Overview

**BETClaw** (IC-VisiteChantier) — Offline-first PWA for field data capture by BET engineers. Syncs to Supabase `edifice_*` tables shared with the Edifice webapp.

**Full specifications**: See `.claude/PRD.md`

---

## Tech Stack

- **PWA Frontend**: Vanilla JS or Preact + Vite + Tailwind
- **Storage**: IndexedDB (via Dexie.js) — offline-first, no server
- **Export**: JSZip for JSON + photos bundle
- **Report Generator**: Python + python-docx + Pillow
- **Testing**: Vitest (frontend) / pytest (Python)

---

## Context System (3 tiers)

Context is organized in progressive disclosure — load only what you need:

### Tier 1: Global Rules (this file)

Always loaded. Keep lean (<100 lines of actual rules). If removing a line wouldn't cause mistakes, cut it.

### Tier 2: Path-Scoped Rules (`.claude/rules/`)

Auto-loaded when you work on matching files. Each rule has a `paths:` frontmatter with glob patterns.

### Tier 3: Reference & Deep Docs

| Location | When to read |
|----------|--------------|
| `.claude/reference/` | Manually, for reusable patterns and code examples |
| `.claude/docs/` | Via sub-agents, for heavy guides (100+ lines) |

### Always-Available Documents

| Document | When to Read |
|----------|--------------|
| `.claude/PRD.md` | Project scope, features, architecture |
| `.claude/STATUS.md` | Current sprint, priorities, next actions |

---

## Task Management

**Workflow:**
1. Check `STATUS.md` for current focus
2. Read active task file in `.claude/tasks/`
3. Mark `@claude` when starting, `[x] ✓ YYYY-MM-DD` when done
4. Move completed features to `_archive/`

---

## Code Style

### Naming
- Files: `kebab-case.ts` / `snake_case.py`
- Classes: `PascalCase`
- Functions: `camelCase` (JS) / `snake_case` (Python)
- Constants: `UPPER_SNAKE_CASE`

### Imports
- Group: stdlib → third-party → local
- Sort alphabetically within groups

### Formatting
- Use project formatter (Prettier/Black)
- Max line length: 100 chars

---

## Core Principles

- **Fix forward** — no backward compatibility, remove deprecated code immediately
- **Fail fast** — detailed errors over graceful failures
- **KISS / DRY / YAGNI** — simple, no repetition, no overbuilding
- **Offline-first** — the PWA must work without network on the field

---

## Testing

- Test files: `*.test.ts` / `test_*.py`
- Run before commit
- Test offline scenarios for the PWA

---

## Session Management

- Use `/handoff` before ending long sessions to capture state for the next session
- Use `/commit` with the `Context:` section when AI context files change

---

## Common Gotchas

- IndexedDB blobs can be large — always handle storage quota errors
- Photos from mobile cameras can be 3-5MB — compress before storing
- The DOCX template uses raw `python-docx` XML manipulation, not docxtpl
- Export ZIP must match `render_cr_visite.py` expected format exactly

---

## Supabase (SHARED with Edifice)

- **Project**: `zgkvbjqlvebttbnkklpo` (buildingInspection) — shared instance
- **Tables**: `edifice_buildings`, `edifice_projects`, `edifice_disorders`, `edifice_photos`, `edifice_messages`
- **Storage bucket**: `edifice-photos` — path `{user_id}/{project_id}/{photo_id}.jpg`
- **RLS**: enabled, MVP "all authenticated" policies
- **Org**: `IC_ORG_ID = '11111111-1111-1111-1111-111111111111'` (hardcoded in sync layer)

---

## Shared Backend with Edifice — CRITICAL

This PWA shares Supabase schema and data with **Edifice** (`/Users/renaud/Projects/edifice`).

**What is shared:**
- All `edifice_*` Supabase tables and `edifice-photos` storage bucket
- OpenClaw chat sessions (same `sessionKey` format: `agent:betclaw:{projectId}`)
- Auth users and `edifice_profiles`

**Coordination rules:**
- **Never modify Supabase schema** (migrations, RLS, storage) without checking impact on Edifice
- **Never rename/remove columns** on shared tables without updating the other project's sync layer
- Column mapping lives in `src/lib/supabase-sync.ts` (this repo) — local Dexie names ≠ Supabase names
- **Edifice is the schema owner** — migrations go in `edifice/supabase/migrations/`, not here
- If you add a column that Edifice needs, create the migration in the Edifice repo
- Read the Edifice schema before assuming column names: `edifice/supabase/migrations/00000000000000_initial_schema.sql`

**Key mapping (Dexie → Supabase):**

| Local (Dexie) | Supabase table | Notable column diffs |
|---------------|----------------|----------------------|
| `buildings` | `edifice_buildings` | `organization_id` (no `user_id`), no `city`/`postal_code` |
| `missions` | `edifice_projects` | `mission_context` (not `brief`), `created_by`, no `type`/`visited_at` |
| `observations` | `edifice_disorders` | `project_id`, `recommendations` (not `action`), `display_order`, `observation_type` |
| `photos` | `edifice_photos` | `project_id`, `uploaded_by`, `original_filename`, `file_size`, no `observation_id` |

---

## External Resources

- [PRD](.claude/PRD.md) | [Status](.claude/STATUS.md) | [README](README.md)
- **Sibling project**: [Edifice](/Users/renaud/Projects/edifice) — bureau webapp on same Supabase
