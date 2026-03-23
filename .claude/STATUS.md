# BETClaw - Current Status

**Last Updated**: 2026-03-23
**Current Phase**: Post field-test iteration — bugs + UX simplification
**Field test**: Longjumeau (La Poste), 2026-03-23 morning — first real use

---

## Field Test Debrief (2026-03-23)

### What worked
- App works on the field, data captured, sync happened (on WiFi)
- 10 observations + 15 photos captured for Longjumeau diagnostic mission

### Critical insight
**If BETClaw isn't drastically simpler than photo + Google Docs, engineers won't use it.**
On site: climbing ladders, talking to building managers, measuring, one hand free at best. Every tap counts.

### Bugs found

| Bug | Severity | Detail |
|-----|----------|--------|
| **Photos not linked to observations** | Critical | `observation_id = null` on all 15 photos in Supabase — sync code doesn't pass observation_id |
| **Mission not linked to building** | Important | Longjumeau mission has `building_id = null` despite "LA POSTE LONGJUMEAU" building existing |
| **Sync only on WiFi?** | Investigate | All photos synced at once (10h43-11h08), likely when back on WiFi |

### UX changes needed

| Issue | Current | Target |
|-------|---------|--------|
| **Observation form too complex** | 6 fields (element, tag, description, cause, action, photos) | **3 fields**: title (optional), photos, free-text note |
| **Photo re-compression** | Double lossy JPEG compression (canvas 0.85) + resize 1920px | **Store raw JPEG** from phone — no re-compression |
| **Photo crop** | None | **Add easy crop** so engineer can frame what matters |
| **ZIP export blocks UI** | Notification + blocking on save | **All background** — save = instant return to list |
| **Chat history lost** | Blank page on every chat open | **Persist messages** — reload from betc_messages on mount |

### Philosophy: "everything is a note"
On the field, no distinction between building context, disorder, history. Capture everything as observations. BETClaw (AI) helps reorganize at the office: building context vs structured observations vs recommendations.

---

## Action Plan — Passe 12: Post Field-Test

### Priority order

#### P0 — Bugs (must fix)
- [ ] Fix photo sync: pass `observation_id` when upserting to `betc_photos`
- [ ] Fix building linkage: ensure `building_id` propagates to mission in Supabase
- [ ] Investigate WiFi-only sync — check if sync triggers on `navigator.onLine` or needs fetch-level check

#### P1 — UX Simplification (field adoption)
- [ ] Simplify observation form: title + photos + note only (remove tag, cause, action from field UI)
- [ ] Remove photo re-compression — store raw JPEG from phone
- [ ] Make save non-blocking — no ZIP, no notification, instant return to list
- [ ] Persist chat history — load betc_messages on chat mount

#### P2 — Enhancements
- [ ] Add photo crop (reference: Edifice project approach)
- [ ] Office mode: allow adding tag/cause/action to observations after the fact

---

## What's DONE

| Passe | Scope | Status |
|-------|-------|--------|
| 1 | Supabase setup (6 tables + auth + storage + RLS) + rebranding | **Done** |
| 2 | Auth email/password + Chat OpenClaw | **Done** |
| 3 | Capture observations (photos + text + tags) | **Done** |
| 4 | Supabase sync (upsert on save + photo upload + offline queue) | **Done** (with bugs) |
| 4b | Agent skill: supabase-reader + JWT passthrough | **Done** |
| 9 | Chat OpenClaw integrated in PWA | **Done** |
| 8 | Field test Longjumeau | **Done** — bugs and UX feedback captured |

### Post-MVP (unchanged)

| Passe | Scope | Priority |
|-------|-------|----------|
| 10 | Agent BETClaw complet (SOUL.md, skills, report-generator) | P1 |
| 11 | Auth propre: Edge Function proxy + extraSystemPrompt + mission context | P1 |

---

## Key References

- **Skill doc**: `betclaw-skill-supabase-reader.md`
- **PinchChat** (webchat OpenClaw): https://github.com/MarlBurroW/pinchchat
- **Supabase project**: `zgkvbjqlvebttbnkklpo` (buildingInspection)

---

**Current Task**: Passe 12 — Post field-test bugs + UX simplification
**Next milestone**: Laurent adoption — app must beat photo + Google Docs in simplicity
