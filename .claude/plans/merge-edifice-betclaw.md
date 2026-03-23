# Feature: Merge Edifice & BETClaw — Unified Schema + OpenClaw Chat in Edifice

The following plan should be complete, but validate documentation and codebase patterns before implementing.

Pay special attention to naming of existing utils, types, and models. Import from the right files.

## Feature Description

Unify BETClaw PWA and Edifice around a **single Supabase schema** (`edifice_*` tables) and add an **OpenClaw WebSocket chat** to Edifice for terrain↔bureau conversational continuity. The PWA becomes the field capture tool writing to `edifice_*` tables. Edifice keeps its CopilotKit HITL features but gains a persistent OpenClaw chat that shares history with the PWA. The report generation workflow in Edifice stays as-is but gains the ability to be triggered conversationally via the OpenClaw chat.

## User Story

As a BET engineer (Laurent)
I want to capture observations on the field with BETClaw PWA, then continue the same conversation at the office in Edifice
So that context is never lost — field notes, urgent deadlines, client requests all flow naturally into the report writing process

## Problem Statement

BETClaw PWA and Edifice both serve IC Ingénieurs on the same Supabase instance (`zgkvbjqlvebttbnkklpo`) but use separate table sets (`betc_*` vs `edifice_*`). Data captured on the field doesn't appear in Edifice. Chat context from the field is lost when switching to the bureau. This forces manual re-entry and loses conversational context (e.g., "client wants the quote this week").

## Solution Statement

1. **PWA sync layer → `edifice_*` tables**: Change table names and column mappings in `supabase-sync.ts`. No new features in PWA.
2. **OpenClaw chat component in Edifice**: A React WebSocket chat panel (reusing `openclaw-client.ts` logic) embedded in Edifice's project detail page. Same agent, same session, same history as the PWA.
3. **Schema evolution**: Add `observation_type` column to `edifice_disorders` to generalize observations (disorder, note, context). Add `edifice_messages` table for chat persistence.

## Feature Metadata

**Feature Type**: Refactor + Enhancement
**Estimated Complexity**: Medium
**Primary Systems Affected**: BETClaw PWA (`src/lib/supabase-sync.ts`, `src/types.ts`, `src/db/`), Edifice frontend (`frontend/`), Supabase schema
**Dependencies**: OpenClaw gateway (existing), Supabase (existing), Edifice frontend (existing)

---

## CONTEXT REFERENCES

### Relevant Codebase Files — MUST READ BEFORE IMPLEMENTING

#### BETClaw PWA (this repo)
- `src/lib/supabase-sync.ts` (all 314 lines) — **THE file to change**. Contains all `betc_*` table names, column mappings, storage bucket references
- `src/types.ts` (all 138 lines) — Local TypeScript interfaces (Building, Mission, Observation, Photo). Must align with Edifice schema
- `src/db/schema.ts` (all 61 lines) — Dexie IndexedDB schema (v4). Needs v5 migration
- `src/db/operations.ts` (all 260 lines) — CRUD operations. References table names for delete queue
- `src/types/database.types.ts` — Auto-generated Supabase types. Must regenerate from Edifice schema
- `src/lib/openclaw-client.ts` (all 191 lines) — WebSocket client to port to Edifice React
- `src/components/chat-view.tsx` (all 247 lines) — Chat UI component, reference for Edifice implementation

#### Edifice (sibling repo)
- `/Users/renaud/Projects/edifice/supabase/migrations/00000000000000_initial_schema.sql` — Complete Edifice schema
- `/Users/renaud/Projects/edifice/frontend/types/database.ts` — Edifice Supabase types
- `/Users/renaud/Projects/edifice/frontend/app/layout.tsx` — CopilotKit setup (stays as-is)
- `/Users/renaud/Projects/edifice/frontend/app/(dashboard)/projects/[projectId]/page.tsx` — Project detail page (add chat tab here)
- `/Users/renaud/Projects/edifice/backend/app/agents/diagnostic_agent.py` — Pydantic AI agent (stays as-is)
- `/Users/renaud/Projects/edifice/backend/app/reports/generator.py` — Report generation (stays as-is)
- `/Users/renaud/Projects/edifice/backend/app/reports/context_builder.py` — Context builder (stays as-is)

### New Files to Create

#### BETClaw PWA
- None — only modifications to existing files

#### Edifice
- `/Users/renaud/Projects/edifice/frontend/lib/openclaw-client.ts` — OpenClaw WebSocket client (port from BETClaw)
- `/Users/renaud/Projects/edifice/frontend/components/openclaw-chat.tsx` — React chat panel component
- `/Users/renaud/Projects/edifice/frontend/hooks/useOpenClawChat.ts` — React hook for chat state

#### Supabase
- New migration: `supabase/migrations/YYYYMMDD_add_observation_type_and_messages.sql`

### Patterns to Follow

**BETClaw sync pattern** — upsert with `onConflict: 'id'`, `clean()` to strip undefined, chain-sync parents before children, dependency order: buildings → projects → disorders → photos

**Edifice frontend pattern** — Next.js App Router, shadcn/ui components, Supabase client via `createBrowserClient()`

**OpenClaw WebSocket** — Challenge-response connect, `chat.send` / `chat.history` methods, `chat` events with `delta`/`final` states for streaming

---

## IMPLEMENTATION PLAN

### Phase 1: Schema Evolution (Supabase migration)

Add `observation_type` to `edifice_disorders` and create `edifice_messages` table. This must happen first since both PWA and Edifice depend on it.

### Phase 2: PWA Sync Layer → `edifice_*`

Change all `betc_*` references to `edifice_*` in the sync layer. Adapt column mappings. Regenerate TypeScript types.

### Phase 3: OpenClaw Chat in Edifice

Port the WebSocket client, create a React chat component, embed it in the project detail page.

---

## STEP-BY-STEP TASKS

### Task 1: CREATE Supabase migration — observation_type + messages

Create a new migration file that:

1. Adds `observation_type TEXT DEFAULT 'disorder' CHECK (observation_type IN ('disorder', 'note', 'context'))` to `edifice_disorders`
2. Creates `edifice_messages` table for chat persistence:

```sql
CREATE TABLE IF NOT EXISTS public.edifice_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.edifice_projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_edifice_messages_project ON public.edifice_messages(project_id, created_at);

ALTER TABLE public.edifice_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY edifice_messages_all ON public.edifice_messages
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

3. Updates `edifice_photos` to add nullable `message_id UUID REFERENCES edifice_messages(id) ON DELETE SET NULL` (for photos sent in chat)

**IMPORTANT column mapping notes for the PWA sync**:

The PWA currently syncs observations to `betc_observations` with these columns:
- `ref`, `element`, `description`, `cause`, `action`, `sort_order`, `metadata` (contains `tag`)

Edifice `edifice_disorders` has:
- `name` (≈ `ref` or `element`), `location`, `description`, `cause`, `recommendations` (≈ `action`), `display_order` (≈ `sort_order`)
- Plus: `component_type_id`, `disorder_type_id`, `condition_index`, `created_by`
- New: `observation_type`

The migration must also add these columns to `edifice_disorders` for field compatibility:
```sql
ALTER TABLE public.edifice_disorders ADD COLUMN IF NOT EXISTS ref TEXT;
ALTER TABLE public.edifice_disorders ADD COLUMN IF NOT EXISTS element TEXT;
ALTER TABLE public.edifice_disorders ADD COLUMN IF NOT EXISTS metadata JSONB;
```

This allows the PWA to sync raw field observations without forcing structured data entry on the field. The bureau (Edifice) enriches them later with component_type, disorder_type, condition_index.

- **VALIDATE**: Apply migration via `mcp__supabase__apply_migration` or `supabase db push`

---

### Task 2: UPDATE `src/types.ts` — align interfaces with Edifice schema

Map BETClaw local types to Edifice columns:

**Building** — add `organizationId?: string`:
- PWA will set this to a hardcoded IC org UUID on sync (not stored locally)

**Mission → Project** — rename conceptually but keep `Mission` interface name in PWA for minimal churn:
- Add `referenceNumber?: string` (maps to `edifice_projects.reference_number`)
- Add `missionContext?: string` (maps to `edifice_projects.mission_context`) — alias for `brief`
- `type` field: Edifice `edifice_projects` has no `type` column → store in `metadata` JSONB

**Observation** — add fields:
- Add `observationType?: 'disorder' | 'note' | 'context'` (defaults to `'note'` for field capture)
- Add `name?: string` (maps to `edifice_disorders.name`)
- Add `location?: string` (maps to `edifice_disorders.location`)
- Add `recommendations?: string` (alias for `action`, maps to `edifice_disorders.recommendations`)
- Keep `action` locally for backward compat, sync maps it to `recommendations`

**Photo** — adapt:
- `filename` → `original_filename` in Supabase
- Add optional `width?: number`, `height?: number`, `rotation?: number`

**SyncQueueEntry** — change table union:
- `'buildings' | 'missions' | 'observations' | 'photos'` stays same locally
- Sync maps `missions` → `edifice_projects`, `observations` → `edifice_disorders`

- **VALIDATE**: `npm run typecheck`

---

### Task 3: UPDATE `src/db/schema.ts` — Dexie v5

Add version 5 with same stores (local table names don't change). No migration logic needed since there's only 1 test mission to discard.

```typescript
this.version(5).stores({
  buildings: '++id, createdAt, supabaseId, syncStatus',
  missions: '++id, buildingId, status, createdAt, supabaseId, syncStatus',
  observations: '++id, missionId, tag, sortOrder, createdAt, supabaseId, syncStatus',
  photos: '++id, missionId, observationId, supabaseId, syncStatus',
  syncQueue: '++id, table, createdAt',
});
```

Just bump the version number. The stores definition is identical — the schema change is only on the Supabase side.

- **VALIDATE**: `npm run typecheck`

---

### Task 4: UPDATE `src/lib/supabase-sync.ts` — the core change

This is the main task. Every `betc_*` reference becomes `edifice_*` with adapted column names.

#### 4a. `syncBuilding()` (lines 49-62)

```
betc_buildings → edifice_buildings
```

Column changes:
| Before (betc) | After (edifice) | Notes |
|---|---|---|
| `user_id: userId` | **REMOVE** | Edifice uses `organization_id` instead |
| — | `organization_id: IC_ORG_ID` | **ADD** — hardcoded IC org UUID constant |
| All other columns | Same names | `name`, `address`, `city`→ absent in edifice (store in address), `postal_code`→ absent, `building_type`, `latitude`, `longitude`, `metadata` |

**IMPORTANT**: Edifice `edifice_buildings` does NOT have `city` or `postal_code` columns. The PWA currently captures these via API BAN. Options:
- Store city + postal_code as part of `address` string (simplest)
- Or store them in a `metadata` JSONB field

Recommend: concatenate into `address` field: `"${address}, ${postalCode} ${city}"`

The `organization_id` must be set. Define a constant:
```typescript
// IC Ingénieurs Conseils org — seeded in Edifice schema
const IC_ORG_ID = '11111111-1111-1111-1111-111111111111'
```

#### 4b. `syncMission()` (lines 88-100)

```
betc_missions → edifice_projects
```

Column changes:
| Before (betc) | After (edifice) | Notes |
|---|---|---|
| `user_id: userId` | **REMOVE** | |
| — | `organization_id: IC_ORG_ID` | **ADD** |
| — | `created_by: userId` | **ADD** — maps auth.uid() to profiles.id |
| `name` | `name` | Same |
| `type` | **REMOVE** from top-level | Store in metadata JSONB: `{ type: mission.type }` |
| `status` | `status` | Same values: 'active', 'completed', 'archived' |
| `brief` | `mission_context` | **RENAME** |
| `visited_at` | **REMOVE** | Edifice stores this at report level |
| `metadata` | **REMOVE** (or merge) | Merge with type into metadata |

#### 4c. `syncObservation()` (lines 118-130)

```
betc_observations → edifice_disorders
```

Column changes:
| Before (betc) | After (edifice) | Notes |
|---|---|---|
| `mission_id` | `project_id` | **RENAME** — same FK, different column name |
| — | `created_by: userId` | **ADD** |
| `ref` | `ref` | NEW column added in Task 1 migration |
| `element` | `element` | NEW column added in Task 1 migration |
| `description` | `description` | Same |
| `cause` | `cause` | Same |
| `action` | `recommendations` | **RENAME** |
| `sort_order` | `display_order` | **RENAME** |
| `metadata` (with tag) | `metadata` | NEW column added in Task 1 migration. Keep tag inside |
| — | `observation_type: 'note'` | **ADD** — field observations default to 'note', bureau can upgrade to 'disorder' |
| — | `name: obs.ref \|\| obs.element \|\| 'Observation'` | **ADD** — required in edifice, fallback to ref/element |

#### 4d. `syncPhoto()` (lines 140-186)

```
betc_photos → edifice_photos
Storage: betc-photos → edifice-photos
```

Column changes:
| Before (betc) | After (edifice) | Notes |
|---|---|---|
| `mission_id` | `project_id` | **RENAME** |
| `observation_id` | **REMOVE** | Edifice links photos to disorders via annotations table, not direct FK |
| `filename` | `original_filename` | **RENAME** |
| `size_bytes` | `file_size` | **RENAME** |
| — | `uploaded_by: userId` | **ADD** |
| — | `width`, `height` | **ADD** if available (optional) |
| `storage_path` | `storage_path` | Same |

**Storage bucket**: `betc-photos` → `edifice-photos`

**Storage path format change**: Current is `${userId}/${mission.supabaseId}/${photo.supabaseId}.jpg`. Edifice convention is just `${projectId}/${photoId}.jpg` (no user folder, org-scoped access). Keep BETClaw's format for now since it works, but note the `storage_path` column captures the actual path.

**Photo ↔ disorder linking**: Edifice does NOT have `observation_id` on photos. Instead it uses `edifice_annotations` table. For field capture, we skip annotation creation — the photo is linked to the project, and the bureau user can create annotations later. The `photoIds` array on observations stays local-only (Dexie).

#### 4e. `flushDeleteQueue()` (lines 214-253)

Change:
- `betc-photos` → `edifice-photos` (storage bucket, line 227)
- `` `betc_${entry.table}` `` → mapping function:

```typescript
const SUPABASE_TABLE_MAP: Record<SyncQueueEntry['table'], string> = {
  buildings: 'edifice_buildings',
  missions: 'edifice_projects',
  observations: 'edifice_disorders',
  photos: 'edifice_photos',
};
```

Use: `SUPABASE_TABLE_MAP[entry.table]` instead of `` `betc_${entry.table}` ``

- **VALIDATE**: `npm run typecheck && npm run build`

---

### Task 5: UPDATE `src/types/database.types.ts` — regenerate from Supabase

Run: `npm run gen:types` to regenerate types from the Supabase schema.

This will pull in all `edifice_*` tables. The `supabase.from('edifice_buildings')` calls will be type-safe.

**If gen:types fails** (needs Supabase CLI auth), manually update the type file to add the `edifice_*` table types matching the schema.

- **VALIDATE**: `npm run typecheck`

---

### Task 6: UPDATE `src/db/operations.ts` — adapt delete queue table names

The delete queue entries use `table: 'missions'` / `table: 'observations'` etc. These are **local** names that get mapped in sync. No change needed in operations.ts UNLESS the code uses Supabase table names directly.

Check line 234: `` `betc_${entry.table}` `` — this is in `supabase-sync.ts`, already handled in Task 4e.

The only change in `operations.ts`: if any Supabase table name is hardcoded (unlikely). Quick grep confirms operations.ts only uses local Dexie tables → **no changes needed**.

- **VALIDATE**: `npm run typecheck`

---

### Task 7: UPDATE `src/components/mission-create.tsx` — organization_id

The mission creation form doesn't need changes for the user — but the `createBuilding()` and `createMission()` calls in `operations.ts` don't set `organizationId`. Since `organization_id` is injected at sync time (not in local DB), no component changes needed.

Check that the address handling still works. Currently, `address-input.tsx` captures address, city, postalCode separately. Since Edifice doesn't have city/postalCode columns, we need to either:
- Concatenate at sync time (recommended — Task 4a handles this)
- Or change the form

**No component changes needed** — concatenation happens in sync layer.

- **VALIDATE**: Manual — create a mission, verify sync works

---

### Task 8: CREATE OpenClaw client for Edifice — `/Users/renaud/Projects/edifice/frontend/lib/openclaw-client.ts`

Port the `OpenClawClient` class from BETClaw's `src/lib/openclaw-client.ts`. The class is framework-agnostic (pure TypeScript, no Preact imports), so it's a direct copy.

Changes from BETClaw version:
- Update `userAgent` string: `'edifice-web/1.0.0'` instead of `'betclaw-pwa/1.0.0'`
- Same protocol, same auth, same everything else

- **VALIDATE**: `cd /Users/renaud/Projects/edifice/frontend && npx tsc --noEmit`

---

### Task 9: CREATE React hook — `/Users/renaud/Projects/edifice/frontend/hooks/useOpenClawChat.ts`

```typescript
'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { OpenClawClient, type ChatMessage } from '@/lib/openclaw-client'
import { createBrowserClient } from '@supabase/ssr'

interface UseOpenClawChatOptions {
  wsUrl: string
  token: string
  sessionKey: string
}

export function useOpenClawChat({ wsUrl, token, sessionKey }: UseOpenClawChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [connected, setConnected] = useState(false)
  const [sending, setSending] = useState(false)
  const [agentTyping, setAgentTyping] = useState(false)
  const clientRef = useRef<OpenClawClient | null>(null)

  useEffect(() => {
    const client = new OpenClawClient(wsUrl, token, sessionKey)
    clientRef.current = client

    // Pass Supabase JWT for RLS-scoped agent queries
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    supabase.auth.getSession().then(({ data }) => {
      client.setSupabaseToken(data.session?.access_token ?? null)
    })

    client.onEvent((event, payload) => {
      switch (event) {
        case '_connected':
          setConnected(true)
          // Load history on connect
          client.getHistory().then((res: any) => {
            if (res?.messages) setMessages(res.messages)
          }).catch(() => {})
          break
        case '_disconnected':
          setConnected(false)
          break
        case 'chat':
          handleChatEvent(payload)
          break
        case 'agent':
          setAgentTyping(true)
          break
      }
    })

    client.connect()
    return () => { client.disconnect(); clientRef.current = null }
  }, [wsUrl, token, sessionKey])

  function handleChatEvent(payload: Record<string, unknown>) {
    // Same logic as BETClaw chat-view.tsx handleChatEvent
    const state = payload.state as string | undefined
    const msgData = (payload.message ?? payload) as Record<string, unknown>
    const runId = (payload.runId ?? msgData.id ?? `msg-${Date.now()}`) as string

    let content = ''
    const rawContent = msgData.content ?? msgData.text
    if (typeof rawContent === 'string') content = rawContent
    else if (Array.isArray(rawContent)) {
      content = rawContent
        .filter((b: any) => b.type === 'text' && typeof b.text === 'string')
        .map((b: any) => b.text)
        .join('')
    }

    const role = (msgData.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant'
    const streaming = state === 'delta'

    if (state === 'error' || state === 'aborted') {
      setAgentTyping(false)
      if (state === 'aborted') {
        setMessages(prev => prev.map(m => m.streaming ? { ...m, streaming: false } : m))
      }
      return
    }

    setAgentTyping(streaming)
    setMessages(prev => {
      const idx = prev.findIndex(m => m.id === runId)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = { ...updated[idx], content, streaming }
        return updated
      }
      return content ? [...prev, { id: runId, role, content, timestamp: Date.now(), streaming }] : prev
    })
  }

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || sending || !clientRef.current?.isConnected) return
    setMessages(prev => [...prev, {
      id: `local-${Date.now()}`, role: 'user', content: text, timestamp: Date.now()
    }])
    setSending(true)
    setAgentTyping(true)
    try {
      await clientRef.current.sendMessage(text)
    } finally {
      setSending(false)
    }
  }, [sending])

  return { messages, connected, sending, agentTyping, sendMessage }
}
```

- **VALIDATE**: TypeScript compiles

---

### Task 10: CREATE React chat component — `/Users/renaud/Projects/edifice/frontend/components/openclaw-chat.tsx`

Build a shadcn/ui-styled chat panel using the `useOpenClawChat` hook. Use Edifice's existing UI patterns (Card, ScrollArea, Input, Button from shadcn/ui).

Key requirements:
- Show connection status
- Render messages with user/assistant styling
- Streaming indicator (typing dots)
- Input with send button
- Auto-scroll to bottom
- Load history on mount (via `chat.history`)

Use `@/components/ui/card`, `@/components/ui/button`, `@/components/ui/input`, `@/components/ui/scroll-area` from Edifice's existing shadcn setup.

- **VALIDATE**: Component renders without errors in dev

---

### Task 11: UPDATE Edifice project detail page — add Chat tab

In `/Users/renaud/Projects/edifice/frontend/app/(dashboard)/projects/[projectId]/page.tsx`:

Add a new tab "Chat BETClaw" alongside existing tabs (Info, Photos, Disorders, Reports).

The tab renders the `<OpenClawChat />` component with:
- `wsUrl` from env `NEXT_PUBLIC_OPENCLAW_URL` (https → wss)
- `token` from env `NEXT_PUBLIC_OPENCLAW_TOKEN`
- `sessionKey`: `agent:betclaw:${projectId}` — scoped per project for context

**Environment variables to add** to Edifice's `.env`:
```
NEXT_PUBLIC_OPENCLAW_URL=https://openclaw.bluegreen.ai
NEXT_PUBLIC_OPENCLAW_TOKEN=<same token as BETClaw PWA>
NEXT_PUBLIC_OPENCLAW_SESSION_PREFIX=agent:betclaw
```

- **VALIDATE**: Navigate to project → Chat tab renders, connects, can send/receive messages

---

## TESTING STRATEGY

### Manual Validation (Primary — no automated tests for this refactor)

#### Test 1: PWA → Edifice sync
1. Create a building + mission in PWA
2. Add 2 observations with photos
3. Check `edifice_buildings`, `edifice_projects`, `edifice_disorders`, `edifice_photos` in Supabase dashboard
4. Verify data appears correctly with `organization_id`, `created_by`, `observation_type='note'`

#### Test 2: PWA data visible in Edifice
1. Open Edifice, navigate to projects
2. Verify the mission created in PWA appears as a project
3. Verify observations appear as disorders (with type='note')
4. Verify photos appear in the gallery

#### Test 3: Chat continuity
1. In PWA chat, send "le client veut le devis cette semaine"
2. In Edifice, open the same project's Chat tab
3. Verify message history loads
4. Send a follow-up message from Edifice
5. Verify the agent has context from the PWA conversation

#### Test 4: Delete sync
1. Delete an observation in PWA
2. Verify it's removed from `edifice_disorders` in Supabase

---

## VALIDATION COMMANDS

### Level 1: Syntax & Types (BETClaw PWA)
```bash
cd /Users/renaud/Projects/IC-VisiteChantier
npm run typecheck
npm run build
```

### Level 2: Supabase Schema
```bash
# Verify migration applied
npm run gen:types
# Check generated types include edifice_* tables
```

### Level 3: Edifice Frontend (if modifying)
```bash
cd /Users/renaud/Projects/edifice/frontend
npx tsc --noEmit
npm run build
```

### Level 4: Manual E2E
- Create mission in PWA → verify in Supabase → verify in Edifice
- Chat in PWA → verify history in Edifice chat

---

## ACCEPTANCE CRITERIA

- [ ] PWA syncs buildings to `edifice_buildings` with `organization_id`
- [ ] PWA syncs missions to `edifice_projects` with `organization_id` + `created_by`
- [ ] PWA syncs observations to `edifice_disorders` with `observation_type='note'`
- [ ] PWA syncs photos to `edifice_photos` bucket with `uploaded_by`
- [ ] PWA delete queue works with `edifice_*` tables
- [ ] `npm run typecheck` and `npm run build` pass on PWA
- [ ] Edifice project detail page has a "Chat" tab with OpenClaw WebSocket
- [ ] Chat history persists between PWA and Edifice (same sessionKey)
- [ ] OpenClaw chat in Edifice streams messages correctly
- [ ] Data created in PWA appears in Edifice's project views
- [ ] No regressions: CopilotKit HITL still works in Edifice for disorder editing

---

## COMPLETION CHECKLIST

- [ ] Supabase migration applied (observation_type + messages table)
- [ ] PWA types aligned with Edifice schema
- [ ] PWA sync layer uses `edifice_*` tables and `edifice-photos` bucket
- [ ] Supabase TypeScript types regenerated
- [ ] PWA builds and typechecks clean
- [ ] OpenClaw client ported to Edifice
- [ ] React chat component created with shadcn/ui
- [ ] Chat tab added to Edifice project detail page
- [ ] Manual E2E validation passed (sync + chat continuity)

---

## NOTES

### Design Decisions

1. **Local Dexie table names stay the same** (`missions`, `observations`, etc.) — only the Supabase mapping changes. This minimizes PWA code churn.

2. **`observation_type` defaults to `'note'`** for field capture. The bureau (Edifice) upgrades relevant observations to `'disorder'` when adding component_type, disorder_type, condition_index. This matches the "everything is a note" philosophy from the field test.

3. **Photos are NOT linked to disorders via FK in Edifice** — they go through `edifice_annotations`. For field capture, photos stay project-level. The bureau creates annotations to link specific photos to disorders.

4. **`city` and `postal_code` are concatenated into `address`** at sync time because Edifice buildings table doesn't have these columns. The API BAN data is preserved in local Dexie for display.

5. **OpenClaw sessionKey is `agent:betclaw:${projectId}`** — scoped per project so each mission has its own conversation thread. The agent gets project context from the session.

6. **CopilotKit stays in Edifice** for structured HITL operations (disorder editing, report section proposals). OpenClaw chat is additive, not a replacement. They coexist.

### Risk: Organization + Profile Setup

The PWA injects `organization_id: IC_ORG_ID` on sync. For this to work:
- The IC org must exist in `edifice_organizations` (already seeded: `11111111-1111-1111-1111-111111111111`)
- The user must have an `edifice_profiles` record with this org. **This may need a one-time manual insert or a Supabase trigger on auth.users.**

### Out of Scope

- Report generation from PWA (stays bureau-only via Edifice)
- Migrating existing `betc_*` data (only 1 test mission — discard)
- OpenClaw agent skill modifications (supabase-reader already works, just needs table name updates)
- Desktop client (future)
