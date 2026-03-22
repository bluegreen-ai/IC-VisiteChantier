# @supabase/supabase-js — Implementation Patterns

**Version:** 2.99.3 (latest stable as of 2026-03-21)
**Install:** `npm install @supabase/supabase-js`

---

## 1. Client Initialization (with TypeScript types + Vite)

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../database.types'

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

```env
# .env.local
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

The `<Database>` generic enables full type inference on all queries. Generate it once (see section 8) and import everywhere.

---

## 2. Auth — Magic Link (signInWithOtp)

```typescript
const { data, error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com',
  options: {
    emailRedirectTo: 'https://yourapp.com/auth/callback',
  },
})
// On success: data = {}, error = null
// The user receives an email with a magic link — no password needed
```

**Gotcha:** `emailRedirectTo` must be whitelisted in Supabase Dashboard > Auth > URL Configuration > Redirect URLs. Wildcards supported (e.g., `http://localhost:*`).

---

## 3. Auth — Session Management

### Initial load + subscribe to changes

```typescript
import { Session } from '@supabase/supabase-js'

// Get current session on app boot
const { data: { session } } = await supabase.auth.getSession()

// Subscribe to all auth events
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  (event, session) => {
    // event: INITIAL_SESSION | SIGNED_IN | SIGNED_OUT | TOKEN_REFRESHED | USER_UPDATED
    console.log(event, session)
    // Update your app state here (signal, store, etc.)
    // DO NOT call other supabase methods directly here — use setTimeout(fn, 0)
  }
)

// Cleanup on unmount
subscription.unsubscribe()
```

### Preact signal pattern

```typescript
import { signal } from '@preact/signals'
import type { Session } from '@supabase/supabase-js'

export const sessionSignal = signal<Session | null>(null)

// On app init:
supabase.auth.getSession().then(({ data }) => {
  sessionSignal.value = data.session
})

supabase.auth.onAuthStateChange((_event, session) => {
  sessionSignal.value = session
})
```

**getSession vs getUser:**
- `getSession()` — fast, reads from localStorage, may be stale. Use for UI state.
- `getUser()` — hits the Supabase server to verify JWT. Use for security-sensitive checks.

**Token storage:** Automatically stored in `localStorage` by default. Auto-refreshed in background before expiry.

**Sign out:**
```typescript
await supabase.auth.signOut()
```

---

## 4. CRUD Operations with TypeScript Types

Assuming generated types with a `visits` table:

### SELECT

```typescript
// All rows
const { data, error } = await supabase
  .from('visits')
  .select('*')

// Specific columns + filter
const { data, error } = await supabase
  .from('visits')
  .select('id, site_name, created_at')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })

// Single row (throws if 0 or >1 rows)
const { data, error } = await supabase
  .from('visits')
  .select('*')
  .eq('id', visitId)
  .single()

// With joined relation
const { data, error } = await supabase
  .from('visits')
  .select(`*, photos (id, url, caption)`)
```

### INSERT

```typescript
const { data, error } = await supabase
  .from('visits')
  .insert({
    site_name: 'Chantier A',
    visited_at: new Date().toISOString(),
    user_id: session.user.id,
  })
  .select()  // returns inserted row(s)
  .single()
```

### UPDATE

```typescript
const { data, error } = await supabase
  .from('visits')
  .update({ status: 'completed' })
  .eq('id', visitId)
  .select()
  .single()
```

### DELETE

```typescript
const { error } = await supabase
  .from('visits')
  .delete()
  .eq('id', visitId)
```

### Typing query results without generated types

```typescript
import { QueryData } from '@supabase/supabase-js'

const visitsQuery = supabase
  .from('visits')
  .select(`*, photos (id, url)`)

type VisitWithPhotos = QueryData<typeof visitsQuery>
```

### Row/Insert/Update helper types

```typescript
import type { Tables, TablesInsert, TablesUpdate } from './database.types'

type Visit = Tables<'visits'>           // SELECT shape
type NewVisit = TablesInsert<'visits'>  // INSERT shape (required fields only)
type VisitPatch = TablesUpdate<'visits'> // UPDATE shape (all optional)
```

---

## 5. Storage — File Upload

```typescript
// Upload a photo to the 'visit-photos' bucket
async function uploadPhoto(file: File, visitId: string): Promise<string> {
  const path = `${visitId}/${Date.now()}-${file.name}`

  const { data, error } = await supabase.storage
    .from('visit-photos')
    .upload(path, file, {
      contentType: file.type,   // e.g., 'image/jpeg'
      upsert: false,            // fail if file already exists
    })

  if (error) throw error

  // Get public URL (only works if bucket is public)
  const { data: { publicUrl } } = supabase.storage
    .from('visit-photos')
    .getPublicUrl(data.path)

  return publicUrl
}
```

**Bucket setup in dashboard:**
- Public bucket: anyone can read via `getPublicUrl()`
- Private bucket: generate signed URLs via `.createSignedUrl(path, expiresIn)`

**RLS on storage:** The `objects` table in the `storage` schema must have policies. Example:
```sql
-- Allow authenticated users to upload to their own folder
create policy "Users upload own photos"
on storage.objects for insert to authenticated
with check (bucket_id = 'visit-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## 6. Row Level Security (RLS)

### How it works with the client

- The client always sends the **anon key** in the `apikey` header.
- When a user is signed in, the client **also** sends the **JWT** in the `Authorization: Bearer <token>` header — automatically, no manual setup needed.
- Postgres uses `auth.uid()` (from JWT claims) to evaluate RLS policies.
- If not signed in: `auth.uid()` returns `null` → policies requiring authentication silently fail (return empty set, not error).

### Policy roles

| Situation | Postgres role | `auth.uid()` |
|-----------|--------------|--------------|
| Not signed in | `anon` | `null` |
| Signed in | `authenticated` | UUID of user |

### Common policy patterns

```sql
-- Anyone can read
create policy "Public read"
on visits for select to anon, authenticated
using (true);

-- Only owner can read their rows
create policy "Owner read"
on visits for select to authenticated
using (auth.uid() = user_id);

-- Only owner can insert
create policy "Owner insert"
on visits for insert to authenticated
with check (auth.uid() = user_id);

-- Only owner can update/delete
create policy "Owner update"
on visits for update to authenticated
using (auth.uid() = user_id);
```

**Critical:** The service role key (secret, server-side only) **bypasses RLS entirely**. Never expose it in frontend code.

---

## 7. Generating TypeScript Types

### One-time setup

```bash
# Install CLI
npm install --save-dev supabase

# Login + link project
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_ID
```

### Generate types

```bash
# From linked remote project
npx supabase gen types --linked --lang typescript > src/database.types.ts

# From project ID directly (no link needed)
npx supabase gen types --project-id YOUR_PROJECT_ID --lang typescript > src/database.types.ts

# With specific schemas
npx supabase gen types --linked --lang typescript --schema public,auth > src/database.types.ts
```

### Add to package.json for convenience

```json
{
  "scripts": {
    "gen:types": "supabase gen types --linked --lang typescript > src/database.types.ts"
  }
}
```

Run after every schema migration: `npm run gen:types`

---

## 8. Offline Considerations

**The client does NOT queue requests.** When offline:

- `supabase.from(...).select()` — throws a network error (fetch failure)
- `supabase.auth.getSession()` — succeeds (reads from localStorage, no network needed)
- `supabase.auth.onAuthStateChange` — `TOKEN_REFRESHED` may fail silently when offline; auto-retry occurs on reconnect
- `supabase.storage.from(...).upload()` — fails immediately

**Realtime subscriptions** drop when offline and have known issues reconnecting in some environments (Expo/React Native primarily; browser reconnect is more reliable).

### Recommended pattern for a PWA

```typescript
// Wrap all data calls in try/catch and handle offline gracefully
async function saveVisit(visit: NewVisit) {
  try {
    const { data, error } = await supabase.from('visits').insert(visit).select().single()
    if (error) throw error
    return { ok: true, data }
  } catch (err) {
    if (!navigator.onLine) {
      // Queue in IndexedDB for later sync
      await localDb.pendingSync.add({ type: 'insert', table: 'visits', payload: visit })
      return { ok: false, queued: true }
    }
    throw err
  }
}

// Sync on reconnect
window.addEventListener('online', async () => {
  const pending = await localDb.pendingSync.toArray()
  for (const item of pending) {
    // replay operations
  }
})
```

**Key insight:** Supabase does not provide built-in offline sync. For offline-first PWAs, use IndexedDB (Dexie.js) as the primary store and treat Supabase as a sync target.

---

## 9. Error Handling Pattern

```typescript
const { data, error } = await supabase.from('visits').select('*')

if (error) {
  // error.message — human-readable
  // error.code    — Postgres error code (e.g., '42501' = permission denied)
  // error.details — additional context
  // error.hint    — Postgres hint
  console.error(`[supabase] ${error.code}: ${error.message}`)
  throw error
}
```

**Common error codes:**
- `42501` — RLS policy violation (permission denied)
- `23505` — unique constraint violation
- `PGRST116` — `.single()` returned 0 or multiple rows

---

## Quick Reference

| Operation | Method |
|-----------|--------|
| Init client | `createClient<Database>(url, anonKey)` |
| Magic link | `auth.signInWithOtp({ email })` |
| Session | `auth.getSession()` / `auth.onAuthStateChange()` |
| Sign out | `auth.signOut()` |
| Select | `.from(t).select(cols).eq(col, val)` |
| Insert | `.from(t).insert(row).select().single()` |
| Update | `.from(t).update(patch).eq(col, val)` |
| Delete | `.from(t).delete().eq(col, val)` |
| Upload | `storage.from(bucket).upload(path, file, opts)` |
| Public URL | `storage.from(bucket).getPublicUrl(path)` |
| Gen types | `supabase gen types --linked --lang typescript` |
