# BETClaw

Generic field capture tool for BET engineering firms. AI-powered chat adapts to each mission type — no rigid forms.

**Built on:** IC-VisiteChantier codebase (evolved in-place)
**Sibling project:** [Edifice](https://github.com/bluegreen-ai/edifice) — bureau webapp sharing the same Supabase backend

## How It Works

1. **Create a mission** with a brief describing what you need to inspect
2. **OpenClaw AI** generates a contextual checklist and guides you through the visit via chat
3. **Capture observations** — text + photos, all structured automatically
4. **Export & report** — ZIP export + DOCX generation via `document-generator` skill

## Features

### PWA Field Capture
- Chat-based data entry — AI adapts to your mission type
- Photo capture (camera/gallery) with compression
- Offline-first — works without network, syncs on reconnect
- Mission management with building registry

### Backend (Supabase — shared with Edifice)
- Auth via magic link (no passwords)
- Syncs to `edifice_*` tables (same schema as Edifice webapp)
- Storage bucket: `edifice-photos`
- Offline sync queue with automatic retry on reconnect
- See [Edifice schema](https://github.com/bluegreen-ai/edifice/blob/main/supabase/migrations/00000000000000_initial_schema.sql) for the canonical table definitions

### AI Assistant (OpenClaw)
- Contextual checklist generation from mission brief
- Field guidance during the visit
- Structured data extraction from chat

### Report Generation
- DOCX reports via `document-generator` Claude Code skill
- Uses existing `render_cr_visite.py` + IC-branded template
- ZIP export as backup (JSON context + photos)

## Getting Started

### PWA Development

```bash
npm install
npm run dev          # Start dev server
npm run build        # Production build
npm run typecheck    # Type check only
```

### Environment Variables

```bash
cp .env.example .env
# Fill in: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_OPENCLAW_URL, VITE_OPENCLAW_API_KEY
```

### Report Generation

```bash
# From an exported ZIP
unzip export.zip -d export/
cd template
python render_cr_visite.py ../export/context.json --photos-dir ../export/photos --output cr.docx
```

Or use the `document-generator` skill in Claude Code.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Preact 10 + Vite 7 + Tailwind v4 |
| Storage | IndexedDB (Dexie.js) — offline-first |
| Backend | Supabase (Auth + Postgres + Storage) |
| AI Chat | OpenClaw API |
| Export | JSZip |
| PWA | vite-plugin-pwa + Workbox |
| Report | Python + python-docx + Pillow (via `document-generator` skill) |

## Project Structure

```
src/
├── main.tsx                    # Entry point
├── app.tsx                     # Root component
├── types.ts                    # TypeScript interfaces
├── styles.css                  # Tailwind v4 entry
├── db/
│   ├── schema.ts               # Dexie database definition
│   └── operations.ts           # CRUD helpers
├── lib/
│   ├── supabase.ts             # Supabase client
│   ├── export-zip.ts           # ZIP generation
│   └── ref-generator.ts        # Reference codes
├── components/
│   ├── mission-list.tsx        # Mission cards
│   ├── mission-create.tsx      # New mission form
│   ├── chat-window.tsx         # Chat messages
│   ├── chat-input.tsx          # Message input + photo
│   ├── photo-gallery.tsx       # Swipable gallery
│   ├── export-view.tsx         # ZIP export
│   └── ui/                     # Reusable UI components
template/
├── render_cr_visite.py         # DOCX report generator
├── template_cr_visite_aulnay.docx  # IC-branded template
└── context_visite_27022026.json    # Example context
```

## Relationship with Edifice

BETClaw and [Edifice](https://github.com/bluegreen-ai/edifice) form a **terrain ↔ bureau** pair:

| | BETClaw (this repo) | Edifice |
|---|---|---|
| **Role** | Field capture (terrain) | Report writing (bureau) |
| **Tech** | Preact PWA, offline-first | Next.js webapp |
| **Data flow** | Writes observations, photos | Reads + enriches, generates DOCX |
| **AI chat** | OpenClaw (field guidance) | OpenClaw + CopilotKit (report HITL) |

**Shared resources** (changing these requires coordinating both projects):
- Supabase `edifice_*` tables and `edifice-photos` bucket
- OpenClaw chat sessions (`agent:betclaw:{projectId}`)
- Auth users + `edifice_profiles` + `edifice_organizations`

**Schema ownership**: Edifice owns the schema. Migrations go in `edifice/supabase/migrations/`. BETClaw adapts its sync layer (`src/lib/supabase-sync.ts`) to match.

## Documentation

- **[PRD](.claude/PRD.md)** — Full specifications and roadmap
- **[Status](.claude/STATUS.md)** — Current state and next actions
