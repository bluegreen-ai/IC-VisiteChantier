# BETClaw - Current Status

**Last Updated**: 2026-03-24
**Current Phase**: Post field-test iteration — bugs + UX simplification
**Field test**: Longjumeau (La Poste), 2026-03-23 morning — first real use

---

## Field Test Debrief (2026-03-23)

### What worked
- App works on the field, data captured, sync in real-time over 4G (1-3s latency confirmed via Supabase Storage timestamps)
- 20 observations + 32 photos captured for Longjumeau diagnostic mission

### Critical insight
**If BETClaw isn't drastically simpler than photo + Google Docs, engineers won't use it.**
On site: climbing ladders, talking to building managers, measuring, one hand free at best. Every tap counts.

### Bugs found (all fixed)

| Bug | Severity | Fix |
|-----|----------|-----|
| **Photos not linked to observations** | Critical | `linkPhotosToObservation()` back-links photoIds after observation save (operations.ts) — ca3b351 |
| **Mission not linked to building** | Important | Chain sync: building synced before mission upsert + building now mandatory at creation — ca3b351 |
| **Sync badge stuck on "en attente"** | Cosmetic | Root cause: FK errors from above bugs cascading `syncStatus: 'error'`. Sync itself worked fine on 4G (1-3s latency). Fixed by chain sync eliminating FK errors — ca3b351 |
| **Building type CHECK violation** | Blocker | BETClaw sent `logement_collectif`/`erp`/`tertiaire` but Edifice expects `apartment_building`/`commercial`/`industrial`. Added mapping in `supabase-sync.ts` — e9434fd |

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

#### P0 — Bugs (all fixed)
- [x] Fix photo sync: `linkPhotosToObservation()` back-links photos after obs save ✓
- [x] Fix building linkage: chain sync + mandatory building at creation ✓
- [x] Sync badge: not a WiFi issue — FK cascade errors from above bugs. 4G sync confirmed working (1-3s latency) ✓
- [x] Fix building_type mapping: BETClaw → Edifice CHECK constraint values ✓ (2026-03-24)

#### P1 — UX Simplification (field adoption)
- [ ] Simplify observation form: title + photos + note only (remove tag, cause, action from field UI)
- [ ] Remove photo re-compression — store raw JPEG from phone
- [ ] Make save non-blocking — no ZIP, no notification, instant return to list
- [ ] Persist chat history — load betc_messages on chat mount

#### P2 — Enhancements
- [ ] Add photo crop (reference: Edifice project approach)
- [ ] Office mode: allow adding tag/cause/action to observations after the fact
- [ ] Building deduplication: search existing buildings before creating new ones
- [ ] Observation vs disorder: clarify mapping between BETClaw "observations" and Edifice "disorders"

---

## What's DONE

| Passe | Scope | Status |
|-------|-------|--------|
| 1 | Supabase setup (6 tables + auth + storage + RLS) + rebranding | **Done** |
| 2 | Auth email/password + Chat OpenClaw | **Done** |
| 3 | Capture observations (photos + text + tags) | **Done** |
| 4 | Supabase sync (upsert on save + photo upload + offline queue) | **Done** — E2E validated 2026-03-24: BETClaw → Supabase → Edifice webapp (building + mission + observations + photos) |
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
