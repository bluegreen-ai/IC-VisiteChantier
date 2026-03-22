# Skill: supabase-reader — BETClaw Agent

## Purpose

This skill gives the BETClaw agent read access to the Supabase database backing the BETClaw PWA. It allows the agent to:

- List all missions for the current user
- Get full details on a specific mission (with its building)
- List observations for a mission
- Get a specific observation with its photos
- Get photo URLs for display or report generation

---

## Supabase Connection

| Parameter | Value |
|-----------|-------|
| Project ID | `zgkvbjqlvebttbnkklpo` |
| API URL | `https://zgkvbjqlvebttbnkklpo.supabase.co` |

### Authentication — JWT Passthrough (User-Scoped)

The agent queries Supabase **as the user**, not as a superadmin. The PWA sends the user's Supabase `access_token` (JWT) to the agent via the OpenClaw WebSocket handshake. The agent uses this JWT in all Supabase requests.

**Why NOT service_role key:**
- service_role bypasses RLS entirely — one prompt injection could leak all users' data
- Real incident in 2025: an LLM agent with service_role key got tricked into exfiltrating secrets (Pomerium post-mortem)
- OWASP LLM Top 10 (LLM08 — Excessive Agency) explicitly warns against this pattern

**How it works (MVP):**

```
PWA (user logged in via Supabase Auth)
  │
  │ WebSocket connect → then sends silent message:
  │ [system:supabase_auth:<JWT>]
  │
  ▼
OpenClaw Gateway → agent betclaw
  │
  │ Agent detects the [system:supabase_auth:...] pattern
  │ Extracts the JWT, creates a Supabase client scoped to this user
  │
  ▼
Supabase (RLS enforced automatically — agent can ONLY see this user's data)
```

**Extracting the token:**

The user's Supabase JWT arrives as the first message after WebSocket connect, in the format `[system:supabase_auth:<JWT>]`. The agent must:

1. Detect messages matching the pattern `[system:supabase_auth:...]`
2. Extract the JWT string between the last `:` and `]`
3. Store it in memory for the duration of the session
4. **Never echo, repeat, or include the token in any response**
5. Use it to create a user-scoped Supabase client

**Creating a user-scoped Supabase client:**

```typescript
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zgkvbjqlvebttbnkklpo.supabase.co';
const SUPABASE_ANON_KEY = process.env.BETCLAW_SUPABASE_ANON_KEY; // anon key (NOT service_role)

function createUserClient(userJwt: string) {
  // CRITICAL: create a NEW client per request — never reuse across users
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${userJwt}` } },
  });
}

// Usage in skill
const supabase = createUserClient(supabaseAccessToken);
const { data } = await supabase.from('betc_missions').select('*');
// ↑ RLS enforced: only returns missions where user_id = this user
```

**Environment variable on the VPS:**

```bash
BETCLAW_SUPABASE_ANON_KEY=sb_publishable_PyPuIhnem_BIt3l2z1fnYA_o55vEhuB
```

> The anon key is safe to store server-side — it has no special privileges. RLS does all the work.

**Token expiry handling:**

Supabase JWTs expire after 1 hour. If a query returns a 401/403:

1. The skill should return a structured error: `{ error: 'token_expired' }`
2. The agent tells the user: "Ta session a expiré, rafraîchis la page."
3. The PWA refreshes the session (`supabase.auth.refreshSession()`) and reconnects the WebSocket with a fresh token.

---

## Database Schema

All tables use the `betc_` prefix. RLS is enabled on all tables. With the user's JWT, RLS automatically scopes all queries to that user's data.

### RLS Policies

| Table | Policy | Rule |
|-------|--------|------|
| `betc_buildings` | `user_buildings` | `auth.uid() = user_id` |
| `betc_missions` | `user_missions` | `auth.uid() = user_id` |
| `betc_observations` | `user_observations` | `EXISTS (SELECT 1 FROM betc_missions WHERE id = mission_id AND user_id = auth.uid())` |
| `betc_photos` | `user_photos` | `EXISTS (SELECT 1 FROM betc_missions WHERE id = mission_id AND user_id = auth.uid())` |
| `betc_messages` | `user_messages` | `EXISTS (SELECT 1 FROM betc_missions WHERE id = mission_id AND user_id = auth.uid())` |
| `betc_reports` | `user_reports` | `EXISTS (SELECT 1 FROM betc_missions WHERE id = mission_id AND user_id = auth.uid())` |

**Key point:** The agent does NOT need to filter by `user_id` manually. RLS handles it. Just query the table.

### Table: `betc_missions`

The central entity. One mission = one field visit.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Unique mission ID |
| `user_id` | UUID (FK → auth.users) | Owner |
| `building_id` | UUID (FK → betc_buildings, nullable) | Linked building |
| `name` | TEXT | Mission name (e.g. "Diagnostic toiture Longjumeau") |
| `type` | TEXT | `diagnostic` \| `suivi_chantier` \| `reception` \| `autre` |
| `status` | TEXT | `active` \| `completed` \| `archived` (default: `active`) |
| `brief` | TEXT | Free-text brief from the engineer (key context for the agent) |
| `checklist` | JSONB | AI-generated checklist (array of strings) |
| `metadata` | JSONB | Flexible: client name, ref_dossier, participants, etc. |
| `visited_at` | DATE | Date of the field visit |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update |

**Indexes:** `(user_id, status)`, `(building_id)`

### Table: `betc_buildings`

Shared building reference. A building can be linked to multiple missions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Unique building ID |
| `user_id` | UUID (FK → auth.users) | Owner |
| `name` | TEXT | Building name (e.g. "La Poste Longjumeau") |
| `address` | TEXT | Street address |
| `city` | TEXT | City |
| `postal_code` | TEXT | Postal code |
| `latitude` | FLOAT | GPS latitude |
| `longitude` | FLOAT | GPS longitude |
| `building_type` | TEXT | `logement_collectif` \| `erp` \| `tertiaire` \| `industriel` \| `other` |
| `construction_year` | INT | Year of construction |
| `floor_count` | INT | Number of floors |
| `surface_area` | FLOAT | Total surface area (m²) |
| `structural_system` | TEXT | `beton_arme` \| `acier` \| `bois` \| `maconnerie` \| `mixte` \| `other` |
| `description` | TEXT | Free-text description |
| `metadata` | JSONB | Additional data |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

### Table: `betc_observations`

Core entity. One observation = one thing noticed on the field (a defect, a zone, a structure element).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Unique observation ID |
| `mission_id` | UUID (FK → betc_missions, CASCADE) | Parent mission |
| `ref` | TEXT | Auto-generated reference: `D1-01` (diagnostic), `V1-01` (visit), etc. |
| `element` | TEXT | Physical element: balcon, poutre, toiture, façade, accès... |
| `description` | TEXT (NOT NULL) | What was observed — the main content |
| `cause` | TEXT | Probable cause (if identified) |
| `action` | TEXT | Recommended action / remediation |
| `metadata` | JSONB | Contains `{ "tag": "<tag>" }` where tag is one of: `structure`, `thermique`, `acces`, `environnement`, `general` |
| `sort_order` | INT | Display order (default 0) |
| `created_at` | TIMESTAMPTZ | When captured on the field |
| `updated_at` | TIMESTAMPTZ | |

**Index:** `(mission_id, sort_order)`

### Table: `betc_photos`

Photos attached to observations (or directly to a mission/message).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Unique photo ID |
| `mission_id` | UUID (FK → betc_missions, CASCADE) | Parent mission |
| `observation_id` | UUID (FK → betc_observations, nullable) | Linked observation |
| `message_id` | UUID (FK → betc_messages, nullable) | Linked chat message |
| `storage_path` | TEXT | Path in Supabase Storage: `{user_id}/{mission_id}/{photo_id}.jpg` |
| `filename` | TEXT | Original filename |
| `size_bytes` | INT | File size |
| `width` | INT | Image width (px) |
| `height` | INT | Image height (px) |
| `metadata` | JSONB | |
| `created_at` | TIMESTAMPTZ | |

**Storage bucket:** `betc-photos` (private). Photos are JPEG, compressed client-side (max ~800px, quality 0.75).

### Table: `betc_messages`

Chat history (for reference — the agent already has its own conversation memory).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | |
| `mission_id` | UUID (FK → betc_missions, CASCADE) | |
| `role` | TEXT | `user` or `assistant` |
| `content` | TEXT | Message text |
| `attachments` | JSONB | |
| `metadata` | JSONB | |
| `created_at` | TIMESTAMPTZ | |

### Table: `betc_reports`

Generated reports metadata.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | |
| `mission_id` | UUID (FK → betc_missions, CASCADE) | |
| `title` | TEXT | |
| `report_type` | TEXT | `diagnostic` \| `suivi` \| `note_calcul` \| `avis_technique` |
| `status` | TEXT | `brouillon` \| `review` \| `valide` \| `envoye` |
| `sections` | JSONB | Structured report content |
| `template_id` | TEXT | |
| `storage_path` | TEXT | DOCX file in `betc-reports` bucket |
| `generated_at` | TIMESTAMPTZ | |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

---

## Relationships

```
betc_buildings ──< betc_missions ──< betc_observations ──< betc_photos
                                  ├──< betc_messages    ──< betc_photos
                                  └──< betc_reports
```

- A **building** has many **missions**
- A **mission** has many **observations**, **messages**, **photos**, **reports**
- An **observation** has many **photos** (via `observation_id`)
- Deleting a mission CASCADEs to observations, messages, photos, reports

---

## Queries for the Skill

All queries use the Supabase REST API (PostgREST) with the user's JWT. Headers:

```
Authorization: Bearer <user_access_token>
apikey: <anon_key>
```

No `user_id` filter needed — RLS handles scoping automatically.

### 1. List all missions

**Use case:** "Quelles sont mes missions ?" / "Liste des missions"

```
GET /rest/v1/betc_missions?select=id,name,type,status,brief,visited_at,created_at,building_id&order=created_at.desc
```

To filter by status:
```
&status=eq.active
```

**Response shape:**
```json
[
  {
    "id": "a1b2c3d4-...",
    "name": "Diagnostic toiture Longjumeau",
    "type": "diagnostic",
    "status": "active",
    "brief": "Affaissement toiture. Comprendre structure porteuse...",
    "visited_at": "2026-03-23",
    "created_at": "2026-03-22T14:30:00Z",
    "building_id": "e5f6g7h8-..."
  }
]
```

### 2. Get a mission with its building

**Use case:** "Détails de la mission Longjumeau" / "C'est quoi comme bâtiment ?"

```
GET /rest/v1/betc_missions?select=*,building:betc_buildings(*)&id=eq.<MISSION_UUID>
```

This uses PostgREST's **resource embedding** — it joins the building in a single request.

**Response shape:**
```json
[
  {
    "id": "a1b2c3d4-...",
    "name": "Diagnostic toiture Longjumeau",
    "type": "diagnostic",
    "status": "active",
    "brief": "Affaissement toiture...",
    "checklist": ["Vue d'ensemble", "Accès toit", "Structure porteuse"],
    "metadata": { "client": "La Poste", "ref_dossier": "2026-LJ-001" },
    "visited_at": "2026-03-23",
    "building": {
      "id": "e5f6g7h8-...",
      "name": "La Poste Longjumeau",
      "address": "9 rue de l'Hôtel des Postes",
      "city": "Longjumeau",
      "postal_code": "91160",
      "building_type": "tertiaire",
      "construction_year": 1975,
      "floor_count": 3,
      "structural_system": "beton_arme"
    }
  }
]
```

### 3. List observations for a mission

**Use case:** "Qu'est-ce que j'ai capturé ?" / "Liste des observations"

```
GET /rest/v1/betc_observations?select=id,ref,element,description,cause,action,metadata,sort_order,created_at&mission_id=eq.<MISSION_UUID>&order=sort_order,created_at
```

**With photo count** (useful for summaries):
```
GET /rest/v1/betc_observations?select=id,ref,element,description,cause,action,metadata,sort_order,created_at,photos:betc_photos(count)&mission_id=eq.<MISSION_UUID>&order=sort_order,created_at
```

**Response shape:**
```json
[
  {
    "id": "obs-uuid-1",
    "ref": "D1-01",
    "element": "Accès toiture",
    "description": "Trappe étage 2, charnières rouillées, ouverture difficile",
    "cause": null,
    "action": "Remplacement charnières avant intervention toiture",
    "metadata": { "tag": "acces" },
    "sort_order": 0,
    "created_at": "2026-03-23T11:15:00Z",
    "photos": [{ "count": 2 }]
  },
  {
    "id": "obs-uuid-2",
    "ref": "D1-02",
    "element": "Zone affaissement",
    "description": "Déformation visible sur ~4m², flèche estimée 8-10cm",
    "cause": "Probable surcharge ou défaut d'étaiement initial",
    "action": "Étude structure détaillée recommandée",
    "metadata": { "tag": "structure" },
    "sort_order": 1,
    "created_at": "2026-03-23T11:22:00Z",
    "photos": [{ "count": 3 }]
  }
]
```

**Tag extraction:** The tag is in `metadata.tag`. Possible values:
- `structure` — structural issues (load-bearing, cracks, deformation)
- `thermique` — thermal / insulation issues
- `acces` — access points, circulation
- `environnement` — surroundings, drainage, vegetation
- `general` — anything else

### 4. Get a specific observation with its photos

**Use case:** "Montre-moi l'observation D1-02" / "Détails sur la zone d'affaissement"

**By UUID:**
```
GET /rest/v1/betc_observations?select=*,photos:betc_photos(id,storage_path,filename,size_bytes,created_at)&id=eq.<OBS_UUID>
```

**By reference code (within a mission):**
```
GET /rest/v1/betc_observations?select=*,photos:betc_photos(id,storage_path,filename,size_bytes,created_at)&mission_id=eq.<MISSION_UUID>&ref=eq.D1-02
```

**Response shape:**
```json
[
  {
    "id": "obs-uuid-2",
    "mission_id": "a1b2c3d4-...",
    "ref": "D1-02",
    "element": "Zone affaissement",
    "description": "Déformation visible sur ~4m², flèche estimée 8-10cm",
    "cause": "Probable surcharge ou défaut d'étaiement initial",
    "action": "Étude structure détaillée recommandée",
    "metadata": { "tag": "structure" },
    "sort_order": 1,
    "created_at": "2026-03-23T11:22:00Z",
    "updated_at": "2026-03-23T11:22:00Z",
    "photos": [
      {
        "id": "photo-uuid-1",
        "storage_path": "user-uuid/a1b2c3d4/photo-uuid-1.jpg",
        "filename": "IMG_20260323_112200.jpg",
        "size_bytes": 184320,
        "created_at": "2026-03-23T11:22:05Z"
      },
      {
        "id": "photo-uuid-2",
        "storage_path": "user-uuid/a1b2c3d4/photo-uuid-2.jpg",
        "filename": "IMG_20260323_112215.jpg",
        "size_bytes": 201450,
        "created_at": "2026-03-23T11:22:15Z"
      }
    ]
  }
]
```

### 5. Get a photo's signed URL (for display or download)

Photos are in a **private bucket**. To get a temporary URL using the user's JWT:

```typescript
const { data } = await supabase.storage
  .from('betc-photos')
  .createSignedUrl(storagePath, 3600); // 1 hour

// data.signedUrl → temporary URL for the photo
```

Or via REST:
```
POST /storage/v1/object/sign/betc-photos/<storage_path>
Content-Type: application/json
Authorization: Bearer <user_access_token>
apikey: <anon_key>

{ "expiresIn": 3600 }
```

The signed URL is valid for 1 hour. The user's JWT must have access to the storage bucket (ensured by the storage RLS policies).

### 6. Full mission context (for report generation)

**Use case:** "Prépare le rapport pour la mission Longjumeau"

This combines queries 2 + 3 + photos. Two requests:

**Request 1 — Mission + building:**
```
GET /rest/v1/betc_missions?select=*,building:betc_buildings(*)&id=eq.<MISSION_UUID>
```

**Request 2 — All observations with their photos:**
```
GET /rest/v1/betc_observations?select=*,photos:betc_photos(id,storage_path,filename,size_bytes,created_at)&mission_id=eq.<MISSION_UUID>&order=sort_order,created_at
```

These two responses give the agent **everything needed** to structure a report: mission brief, building info, all observations with descriptions/causes/actions, and photo references.

---

## Reference Code Format

Observations have an auto-generated `ref` field following this convention:

| Mission type | Prefix | Example sequence |
|-------------|--------|-----------------|
| `diagnostic` | `D1-` | D1-01, D1-02, D1-03... |
| `suivi_chantier` | `V1-` | V1-01, V1-02, V1-03... |
| `reception` | `R1-` | R1-01, R1-02... |
| `autre` | `X1-` | X1-01, X1-02... |

The `1` in `D1` would increment if the same building has multiple diagnostic missions (D2-01, D3-01...). For the MVP, it's always `1`.

---

## Implementation Notes for OpenClaw Skill

### Skill structure (suggestion)

```
~/.openclaw/workspace-betclaw/skills/supabase-reader/
├── SKILL.md          ← this doc (trimmed for token efficiency)
├── index.ts          ← skill entry point
└── queries.ts        ← query helpers
```

### How the agent receives the user's JWT (MVP)

Right after WebSocket connect, the PWA sends a silent message:

```
[system:supabase_auth:eyJhbGciOiJIUzI1NiIs...]
```

The agent detects this pattern, extracts the JWT, and stores it for the session. This message should NOT appear in the conversation UI or be treated as a user question.

**Parsing example:**
```typescript
const match = message.match(/^\[system:supabase_auth:(.+)\]$/);
if (match) {
  const jwt = match[1];
  // Store jwt, create Supabase client, do NOT respond to this message
}
```

**Token refresh:** If the user's session is refreshed (token expires after 1h), the PWA will send a new `[system:supabase_auth:...]` message. The agent should replace the stored JWT silently.

**Post-MVP:** This mechanism will be replaced by a Supabase Edge Function proxy that passes the JWT via `extraSystemPrompt` (see PRD Passe 11).

### How the agent should use this skill

The agent receives natural language from the engineer. It should:

1. **Identify the intent** — list missions? get details? find observations?
2. **Resolve the mission** — by name (fuzzy match on `name`) or by UUID
3. **Execute the right query** from the catalog above
4. **Format the response** in natural French, concise, field-friendly

### Example interactions

**User:** "C'est quoi mes missions en cours ?"
**Agent action:** Query 1 with `status=eq.active`
**Agent response:** "Tu as 2 missions actives : Diagnostic toiture Longjumeau (23/03) et Suivi balcons Aulnay (15/03)."

**User:** "Qu'est-ce que j'ai capturé sur Longjumeau ?"
**Agent action:** Resolve "Longjumeau" → mission UUID (name ILIKE match), then Query 3
**Agent response:** "5 observations sur Longjumeau : D1-01 Accès toiture (2 photos), D1-02 Zone affaissement (3 photos)..."

**User:** "Détails sur D1-02"
**Agent action:** Query 4 by ref within current mission context
**Agent response:** Full observation description + cause + action + photo count

**User:** "On fait le rapport"
**Agent action:** Query 6 (full context), then iterative discussion with the engineer about structure and storytelling

### Fuzzy mission resolution

The agent often receives a partial name. Use PostgREST's `ilike` operator:

```
GET /rest/v1/betc_missions?select=id,name&name=ilike.*longjumeau*&status=eq.active
```

If multiple matches, ask the user to clarify.

---

## Security Considerations

- **Read-only**: The agent should NOT write to the database. All writes come from the PWA only.
- **User-scoped by design**: RLS ensures the agent can only see the authenticated user's data — no manual filtering needed, no risk of cross-user data leak even under prompt injection.
- **Token handling**: Never log or include the user's JWT in responses. Treat it as sensitive.
- **Signed photo URLs are temporary**: Don't cache them beyond their expiry (default 1 hour).
- **Token expiry**: If queries start returning 401/403, tell the user to refresh the page. The PWA will obtain a new token and reconnect.
- **Defense in depth**: Even though RLS handles scoping, avoid crafting queries that select `*` from all tables — only query what's needed for the user's request.
