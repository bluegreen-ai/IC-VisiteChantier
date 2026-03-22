# PRD — BETClaw

**Version :** 0.3 — MVP week-end 22-23 mars 2026
**Statut :** En cours de développement
**Repo :** IC-VisiteChantier (évolution in-place)
**Deadline MVP :** Test terrain Longjumeau, lundi 23 mars 2026

---

## 1. Vision et problème

### Le problème

Les ingénieurs BET passent sur le terrain avec leur téléphone, leur stylo, et une checklist parfois inexistante. Ils rentrent au bureau avec des photos dans la pellicule, des notes éparpillées, et des heures de mise en forme devant eux.

Le vrai problème : **chaque mission a sa propre structure**. Un suivi de balcons n'a rien à voir avec un diagnostic toiture. Les outils génériques ne cadrent pas. Les outils spécialisés sont soit inexistants, soit trop rigides, soit trop chers.

### La solution BETClaw

Un assistant IA personnel pour les ingénieurs BET, qui les accompagne à **3 étapes** :

1. **Préparation** — L'ingénieur dit à BETClaw "je vais à Longjumeau lundi, affaissement toiture" → BETClaw crée la mission, génère une checklist contextuelle, prépare le brief
2. **Terrain** — L'ingénieur capture ses observations (photos + texte) dans la PWA. S'il a des questions, il les pose à BETClaw via le chat intégré
3. **Bureau** — L'ingénieur discute avec BETClaw pour construire le rapport. Échange itératif sur la stratégie, le storytelling, les recommandations. Quand c'est calé, BETClaw génère le Word

**Le rapport n'est PAS un bouton one-click.** C'est un échange collaboratif entre l'ingénieur et l'assistant, comme un binôme junior/senior.

### Cible marché

- **3 000 BET en France** (source CINOV/SYNTEC) — cabinets de 1 à 50 ingénieurs
- Potentiel **1–5M€ ARR** à 200–500€/mois/BET
- Entrée de marché : IC Ingénieurs Conseils (validation interne, 0 risque)

---

## 2. Cas d'usage de référence

### Cas 1 — Suivi balcons Aulnay (IC Ingénieurs)

**Type :** suivi chantier réfection balcons, Résidence Savigny Impair, Aulnay-sous-Bois
**Structure de données :** Bâtiment / Étage / Façade / Observation + action + photo
**Brief :** "Je visite le Bâtiment A, étage par étage, façade par façade. Je note ce qui reste à reprendre."

### Cas 2 — Diagnostic toiture Longjumeau (IC Ingénieurs)

**Type :** diagnostic structure, toiture La Poste, Longjumeau
**Structure de données :** zones libres (vue d'ensemble, accès toit, sous-toiture, structure porteuse, zone affaissement)
**Brief Laurent :** "Comprendre la structure porteuse. Vérifier accès sous toit. Photographier accès + cheminement. Documenter zone d'affaissement."
**Contexte business :** Greenta (BE thermique) sera là. Possibilité de proposer un projet global structure + isolation. Le rapport devra peut-être inclure une section recommandations élargie — décision à prendre au bureau après discussion avec Greenta.

→ Ces deux missions ont la même structure de workflow, mais des données totalement différentes. **JSONB + chat = la seule approche qui marche pour les deux.**

---

## 3. Architecture technique

### Vue d'ensemble

```
┌─────────────────────────────────────────────────────────┐
│              PWA BETClaw (le canal unique)               │
│                                                           │
│  ┌─────────┐  ┌──────────────┐  ┌─────────────────────┐ │
│  │ Missions │  │ Capture      │  │ Chat                │ │
│  │ (liste)  │  │ (photos +    │  │ (webchat OpenClaw)  │ │
│  │          │  │  observations│  │                     │ │
│  │          │  │  + galerie)  │  │ Prépa + terrain +   │ │
│  │          │  │              │  │ rapport = même chat │ │
│  └─────────┘  └──────────────┘  └─────────────────────┘ │
└──────────────────────┬──────────────────┬────────────────┘
                       │                  │
            ┌──────────▼──────┐  ┌────────▼─────────────┐
            │    Supabase     │  │  OpenClaw Gateway     │
            │                 │  │  (VPS existant)       │
            │  Auth (magic    │  │                       │
            │   link)         │  │  Agent "betclaw"      │
            │  DB (6 tables   │  │  ├── SOUL.md (BET)    │
            │   betc_*)       │  │  ├── Skills:          │
            │  Storage        │  │  │   ├── supabase-    │
            │   (photos)      │  │  │   │   reader       │
            │                 │  │  │   └── report-      │
            │                 │  │  │       generator    │
            │                 │  │  └── Mémoire propre   │
            └─────────────────┘  └──────────────────────┘
```

### Comment ça tourne

**Un seul gateway OpenClaw** sur le VPS de Renaud (celui qui fait déjà tourner Oclaw).
Un **nouvel agent `betclaw`** est ajouté dans la config `openclaw.json` :

```json5
{
  agents: {
    list: [
      {
        id: "main",        // Oclaw (assistant perso Renaud)
        default: true,
        workspace: "~/.openclaw/workspace"
      },
      {
        id: "betclaw",     // BETClaw (assistant BET)
        workspace: "~/.openclaw/workspace-betclaw"
      }
    ]
  },
  bindings: [
    // Le webchat de la PWA est routé vers l'agent betclaw
    // (binding par peer/channel/token — à configurer)
  ]
}
```

**Chaque agent est isolé :**
- Workspace séparé (SOUL.md, skills, mémoire)
- Sessions séparées (historique chat)
- Skills séparés (BETClaw a le skill Supabase, pas Oclaw)
- Un seul processus, un seul port, un seul reverse proxy Caddy

**La PWA se connecte au gateway via WebSocket** (protocole webchat OpenClaw) :
- `chat.send` — envoyer un message
- `chat.history` — récupérer l'historique
- Streaming des réponses en temps réel
- Le gateway route vers l'agent `betclaw`

**BETClaw (l'agent) a un skill qui lit Supabase** → il connaît les missions, les observations, les photos. Quand l'ingénieur dit "prépare le rapport Longjumeau", BETClaw a tout le contexte.

### PinchChat — UI chat de référence

**Repo :** https://github.com/MarlBurroW/pinchchat (MIT, Nicolas Varrot)

PinchChat est un client chat standalone pour OpenClaw. Stack : React 19 + Vite 7 + Tailwind v4.

**Options d'intégration dans la PWA BETClaw :**

1. **iframe** (le plus rapide) — Déployer PinchChat séparément, l'embarquer dans un onglet de la PWA. Config via env vars (`VITE_AGENT_SESSION=agent:betclaw:main`, `VITE_CLIENT_ID=webchat`).

2. **Port du protocole WebSocket** (le plus propre) — Copier `lib/gateway.ts` (pur TypeScript, pas de dépendance React) dans notre projet Preact et construire notre propre UI chat. Le protocole est simple : `auth`, `subscribe`, `send` côté client ; `authenticated`, `sessions`, `delta` (streaming) côté serveur.

3. **Fork Preact** (ambitieux) — Fork PinchChat, swap React → Preact via `preact/compat`. Possible car pas de Redux ni d'infra React-specific lourde.

**Fichier clé à étudier :** `src/lib/gateway.ts` — protocole WebSocket pur TS.

### Stack

| Couche | Technologie | Rôle |
|--------|-------------|------|
| Frontend | Preact 10 + Vite 7 + Tailwind v4 | PWA capture + chat |
| Stockage offline | IndexedDB (Dexie.js) | Queue de sync, mode offline |
| Backend données | Supabase (Auth + Postgres + Storage) | Missions, observations, photos |
| Agent IA | OpenClaw (agent `betclaw`) | Chat, guidance, rapport |
| Chat PWA ↔ Agent | WebSocket (protocole webchat OpenClaw) via PinchChat | Temps réel, streaming |
| Export backup | JSZip | ZIP de secours |
| PWA | vite-plugin-pwa + Workbox | Installable, offline |
| Rapport DOCX | python-docx + Pillow (skill `report-generator`) | Word structuré avec template |

### Principe de sync offline

```
Action terrain (photo/observation)
        │
        ▼
  IndexedDB (immédiat, toujours dispo)
        │
        ├─── [online] ──→ Supabase sync (upsert)
        │
        └─── [offline] ─→ Queue locale → sync au retour réseau
```

Le chat (webchat OpenClaw) nécessite une connexion réseau. Si pas de réseau, l'ingénieur capture ses observations dans la partie "Capture" (offline), et pose ses questions au chat quand le réseau revient.

---

## 4. Schéma Supabase

### Conventions

- Préfixe `betc_` pour toutes les tables (6 tables)
- JSONB pour les données métier (structure variable selon le type de mission)
- Row Level Security (RLS) activé — chaque utilisateur ne voit que ses données
- **Observations = entité centrale** — ce qui alimente le rapport

### Tables

```sql
-- Bâtiments (référentiel — partageable entre missions)
CREATE TABLE betc_buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  latitude FLOAT,
  longitude FLOAT,
  building_type TEXT,       -- logement_collectif | erp | tertiaire | industriel | other
  construction_year INT,
  floor_count INT,
  surface_area FLOAT,
  structural_system TEXT,   -- beton_arme | acier | bois | maconnerie | mixte | other
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE betc_buildings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_buildings" ON betc_buildings FOR ALL USING (auth.uid() = user_id);
CREATE INDEX ON betc_buildings(user_id);

-- Missions (une mission = une visite terrain)
CREATE TABLE betc_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  building_id UUID REFERENCES betc_buildings(id),
  name TEXT NOT NULL,
  type TEXT,                -- suivi_chantier | diagnostic | reception | autre
  status TEXT DEFAULT 'active',  -- active | completed | archived
  brief TEXT,               -- texte libre du brief initial
  checklist JSONB,          -- checklist générée par BETClaw
  metadata JSONB,           -- client, ref_dossier, participants...
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  visited_at DATE
);
ALTER TABLE betc_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_missions" ON betc_missions FOR ALL USING (auth.uid() = user_id);
CREATE INDEX ON betc_missions(user_id, status);
CREATE INDEX ON betc_missions(building_id);

-- Messages du chat (historique conversation — pour référence)
CREATE TABLE betc_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES betc_missions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  attachments JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE betc_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_messages" ON betc_messages FOR ALL USING (
  EXISTS (SELECT 1 FROM betc_missions WHERE id = betc_messages.mission_id AND user_id = auth.uid())
);
CREATE INDEX ON betc_messages(mission_id, created_at);

-- Observations (entité centrale — alimente le rapport)
CREATE TABLE betc_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES betc_missions(id) ON DELETE CASCADE,
  ref TEXT,                 -- référence auto-générée (V1-01, D1-01...)
  element TEXT,             -- élément concerné : balcon, poutre, façade...
  description TEXT NOT NULL,
  cause TEXT,
  action TEXT,              -- recommandation
  metadata JSONB,           -- champs spécifiques au type de mission
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE betc_observations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_observations" ON betc_observations FOR ALL USING (
  EXISTS (SELECT 1 FROM betc_missions WHERE id = betc_observations.mission_id AND user_id = auth.uid())
);
CREATE INDEX ON betc_observations(mission_id, sort_order);

-- Photos
CREATE TABLE betc_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES betc_missions(id) ON DELETE CASCADE,
  observation_id UUID REFERENCES betc_observations(id),
  message_id UUID REFERENCES betc_messages(id),
  storage_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  size_bytes INT,
  width INT,
  height INT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE betc_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_photos" ON betc_photos FOR ALL USING (
  EXISTS (SELECT 1 FROM betc_missions WHERE id = betc_photos.mission_id AND user_id = auth.uid())
);
CREATE INDEX ON betc_photos(mission_id);

-- Rapports
CREATE TABLE betc_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES betc_missions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  report_type TEXT,         -- diagnostic | suivi | note_calcul | avis_technique
  status TEXT DEFAULT 'brouillon',  -- brouillon | review | valide | envoye
  sections JSONB,           -- contenu structuré
  template_id TEXT,
  storage_path TEXT,        -- chemin DOCX dans Supabase Storage
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE betc_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_reports" ON betc_reports FOR ALL USING (
  EXISTS (SELECT 1 FROM betc_missions WHERE id = betc_reports.mission_id AND user_id = auth.uid())
);
CREATE INDEX ON betc_reports(mission_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER betc_buildings_updated_at BEFORE UPDATE ON betc_buildings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER betc_missions_updated_at BEFORE UPDATE ON betc_missions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER betc_observations_updated_at BEFORE UPDATE ON betc_observations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER betc_reports_updated_at BEFORE UPDATE ON betc_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Buckets Supabase Storage

```
betc-photos/{user_id}/{mission_id}/{photo_id}.jpg
betc-reports/{user_id}/{mission_id}/{report_id}.docx
```

---

## 5. Le concept d'observation — pourquoi c'est central

Dans tous les projets BET, on consigne des éléments avec :
- Un **élément** physique (balcon, poutre, toiture, façade...)
- Une **description** de ce qui est constaté
- Une ou plusieurs **photos**
- Souvent une **cause** et une **action** recommandée

**Résidence Aulnay** → observation = un balcon + ce qui reste à reprendre + photo + action corrective

**Toiture Longjumeau** → observation = une zone (accès, structure, affaissement) + constat + photo + cause

Le JSONB `metadata` permet d'ajouter des champs spécifiques sans changer le schéma.

---

## 6. User Stories MVP

### Gestion des missions

- **US-01** : Créer une mission (nom, date, brief libre, bâtiment)
- **US-02** : Consulter la liste des missions (nom + date + statut)
- **US-03** : Ouvrir une mission existante
- **US-03b** : Rattacher une mission à un bâtiment (existant ou nouveau)

### Capture terrain

- **US-04** : Capturer une observation (photo caméra/galerie + texte + tag)
- **US-05** : Voir la liste des observations d'une mission
- **US-06** : Voir toutes les photos dans une galerie swipable
- **US-06b** : Éditer / enrichir une observation existante

### Export

- **US-08** : Exporter un ZIP (context.json + photos + README)
- **US-09** : Auth magic link (sans mot de passe)

### Chat IA (stretch goal week-end / post-MVP)

- **US-07** : Poser une question à BETClaw depuis le chat intégré (via PinchChat / WebSocket OpenClaw)
- **US-07b** : BETClaw rappelle les points de checklist non couverts
- **US-07c** : Discuter du rapport au bureau (stratégie, angle, storytelling)
- **US-07d** : BETClaw génère le rapport Word après l'échange

---

## 7. Plan des passes — MVP week-end 22-23 mars

**Scope MVP garanti :** Passes 1-8 (capture terrain + export).
**Stretch goal :** Passe 9 (chat OpenClaw via PinchChat iframe) si le temps le permet.

### Passe 1 — Supabase setup complet (2-3h)

**Objectif :** Backend Supabase opérationnel + rebranding.

- [ ] Créer les 6 tables `betc_*` avec RLS
- [ ] Configurer Supabase Auth magic link
- [ ] Créer les buckets `betc-photos` et `betc-reports` avec policies
- [ ] Variables d'env (`.env.local` + `.env.example`)
- [ ] Rebranding : titre "BETClaw", favicon, meta PWA
- [ ] Générer types TypeScript

**Variables d'env MVP :**
```bash
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

**Critères de done :**
- Auth magic link fonctionne
- INSERT dans `betc_buildings` puis `betc_missions` réussit
- Photo uploadable dans le bucket

### Passe 2 — Écran Missions (2-3h)

**Objectif :** Liste missions + création avec sélection de bâtiment.

- [ ] `MissionList` : cards (nom + date + statut + bâtiment)
- [ ] `BuildingSelect` : dropdown avec search + "Créer un bâtiment"
- [ ] `MissionCreate` : formulaire (nom + brief + date + bâtiment)
- [ ] Navigation : `MissionList` → `MissionCreate` → `MissionDetail`
- [ ] Persistance IndexedDB + sync Supabase

**Critères de done :**
- Créer "La Poste Longjumeau" (bâtiment) puis "Diagnostic toiture V1" (mission)
- Tout fonctionne offline

### Passe 3 — Capture observations (3-4h)

**Objectif :** Capturer photos + texte + tags, liés à la mission.

**C'est la passe clé.**

- [ ] `ObservationCapture` : bouton photo (caméra/galerie) + champ texte + sélecteur de tag
- [ ] Tags : `structure` | `thermique` | `acces` | `environnement` | `general`
- [ ] Liste des observations dans la mission (scrollable, triable par timestamp)
- [ ] Chaque observation : description + N photos + tag + timestamp
- [ ] Tap sur observation → éditer / ajouter photo / changer tag
- [ ] Compression photo côté client (max 800px, qualité 0.75, < 2MB)
- [ ] Upload photos → Supabase Storage en background
- [ ] Référence auto-générée (D1-01, D1-02... pour diagnostic, V1-01 pour visite)

**UX terrain :** gros boutons, utilisable d'une main, feedback immédiat.

**Critères de done :**
- Prendre 5 photos avec descriptions en < 3 minutes
- Tout persisté en IndexedDB + sync Supabase
- Photos compressées et uploadées

### Passe 4 — Sync offline (2-3h)

- [ ] Queue de sync IndexedDB → Supabase (flush au retour réseau)
- [ ] Service Worker : cache assets + network-first pour l'API
- [ ] Mise à jour `db/schema.ts` : buildings + missions + observations + photos

**Critères de done :**
- Saisie complète en mode avion → sync auto au retour réseau
- Zéro perte de données

### Passe 5 — Galerie photos (1-2h)

- [ ] `PhotoGallery` : grille en haut de l'écran mission
- [ ] Tap → plein écran avec navigation précédent/suivant
- [ ] Lien photo → observation associée

### Passe 6 — Export ZIP (2-3h)

**Objectif :** Export complet pour traitement bureau.

- [ ] Adapter `export-zip.ts` pour le format BETClaw
- [ ] ZIP contient : `context.json` + `photos/` + `README.md`

**Format `context.json` :**
```json
{
  "betclaw_version": "1.0",
  "mission": {
    "name": "Diagnostic toiture Longjumeau",
    "type": "diagnostic",
    "brief": "Affaissement toiture. Comprendre structure porteuse...",
    "visited_at": "2026-03-23",
    "checklist": ["Vue d'ensemble", "Accès toit", "..."]
  },
  "building": {
    "name": "La Poste Longjumeau",
    "address": "9 rue de l'Hôtel des Postes",
    "city": "Longjumeau",
    "building_type": "tertiaire"
  },
  "observations": [
    {
      "ref": "D1-01",
      "element": "Accès toiture",
      "description": "Trappe étage 2, charnières rouillées",
      "tag": "acces",
      "photos": ["photos/D1-01_001.jpg"],
      "timestamp": "2026-03-23T11:15:00"
    }
  ]
}
```

### Passe 7 — Polish UX (2h)

- [ ] Loading states (skeleton cards)
- [ ] Toasts d'erreur
- [ ] Build prod clean
- [ ] Auth magic link testée sur mobile

### Passe 8 — Test flow Longjumeau (2h)

- [ ] Créer bâtiment "La Poste Longjumeau"
- [ ] Créer mission "Diagnostic toiture V1" avec brief Laurent
- [ ] Simuler 8 observations terrain
- [ ] Tester offline → sync
- [ ] Exporter ZIP
- [ ] Installer PWA sur mobile
- [ ] Commit + push + déploiement

### Passe 9 — Chat OpenClaw via PinchChat (stretch goal week-end)

**Objectif :** Intégrer le chat BETClaw dans la PWA via PinchChat.

**Repo PinchChat :** https://github.com/MarlBurroW/pinchchat (MIT)
**Stack :** React 19 + Vite 7 + Tailwind v4 — même stack que BETClaw.

**Option A — iframe (rapide, ~2h) :**
- [ ] Déployer PinchChat (Docker ou static) avec env vars : `VITE_AGENT_SESSION=agent:betclaw:main`, `VITE_CLIENT_ID=webchat`, `VITE_LOCALE=fr`
- [ ] Ajouter un onglet "Chat" dans la PWA avec `<iframe src="...">` vers PinchChat
- [ ] Passer le contexte mission via URL params ou post-message

**Option B — port du protocole WebSocket (propre, ~4h) :**
- [ ] Copier `src/lib/gateway.ts` de PinchChat (pur TS, pas de dépendance React)
- [ ] Créer `useOpenClawChat` hook Preact (connect + send + receive + streaming)
- [ ] Composant `ChatWindow` (bulles user/assistant)
- [ ] Composant `ChatInput` (textarea + envoi)
- [ ] Variable d'env : `VITE_BETCLAW_WS_URL=wss://betclaw.bluegreen.ai`

**Pré-requis :** Agent `betclaw` configuré sur le gateway OpenClaw (workspace + SOUL.md + bindings).

---

## 8. Post-MVP — Agent BETClaw sur le gateway

### Passe 10 — Agent BETClaw complet (post-MVP)

- [ ] Créer `~/.openclaw/workspace-betclaw/` avec SOUL.md, AGENTS.md
- [ ] SOUL.md BETClaw : ton pro, spécialisé BET, français
- [ ] Skill `supabase-reader` : lire missions, observations, photos depuis Supabase
- [ ] Skill `report-generator` : générer un DOCX avec template IC
- [ ] Ajouter l'agent dans `openclaw.json` + binding webchat

---

## 9. Flux produit final (post-MVP)

### Préparation (chat)
Laurent → BETClaw : *"Lundi je vais à Longjumeau, La Poste, affaissement toiture. Greenta sera là pour la thermique."*

BETClaw crée la mission dans Supabase + génère la checklist :
1. Vue d'ensemble — 4 façades
2. Accès toiture — photos
3. Accès sous-toiture
4. Structure porteuse
5. Zone d'affaissement
6. Désordres associés
7. Environnement toiture
8. Couverture / étanchéité

### Terrain (capture + chat si besoin)
Laurent ouvre la PWA → la mission Longjumeau est là (créée par BETClaw via Supabase).
Il capture ses observations : photos + descriptions + tags.
S'il a une question → onglet Chat → BETClaw répond avec le contexte de la mission.

### Bureau (chat collaboratif → rapport)
Laurent → BETClaw : *"On fait un rapport structure. Mais ajoute une section recommandations : si le client refait le toit, proposer isolation thermique avec Greenta."*

Échange itératif. BETClaw propose une structure de rapport, Laurent ajuste, valide section par section. Quand c'est calé → BETClaw génère le Word avec le template IC.

---

## 10. Hors scope MVP

| Fonctionnalité | Raison |
|----------------|--------|
| Génération rapport dans l'app | Post-MVP (skill report-generator) |
| Checklist auto-générée par IA | Post-MVP |
| Multi-utilisateurs / équipes | Post-pilote |
| Dashboard analytics | Pas nécessaire pour valider |
| App native iOS/Android | PWA suffit |
| Facturation / abonnements | Après validation |

---

## 11. Monétisation

| Modèle | Prix indicatif | Cible |
|--------|---------------|-------|
| SaaS mensuel | 200-500€/mois | BET avec missions régulières |
| À la mission | 30-50€/rapport | BET occasionnels |
| Setup + licence | 2 000€ setup + 300€/mois | Grands BET |

**Blue Green commercialise BETClaw.** Le client voit une app + un assistant. Il ne voit pas OpenClaw, Claude, ou Supabase.

---

## 12. Risques MVP

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Pas de réseau sur le chantier | Moyen | Moyen | Offline-first (IndexedDB), sync au retour |
| Photos trop lourdes | Faible | Faible | Compression existante (< 2MB) |
| Magic link bloquée par spam | Faible | Élevé | Tester avant lundi |
| Sync offline complexe | Moyen | Moyen | Sync naïf pour le MVP |

---

## 13. Critères de succès MVP

- [ ] Renaud utilise BETClaw à Longjumeau lundi sans revenir à l'ancien système
- [ ] Au moins 5 observations capturées (photo + texte + tag)
- [ ] Export ZIP fonctionnel avec context.json + photos
- [ ] 0 perte de données (offline → sync)
- [ ] PWA installable sur mobile
- [ ] Rapport généré via Claude Code/Cowork à partir du ZIP (temporaire, en attendant le chat intégré)
- [ ] **Bonus :** chat BETClaw fonctionnel dans la PWA (via PinchChat)

---

## 14. Évolutions post-MVP (backlog)

Par ordre de priorité :

1. **Chat OpenClaw intégré** — l'ingénieur parle à BETClaw dans l'app (si pas fait ce week-end)
2. **Rapport collaboratif** — échange itératif dans le chat → Word généré
3. **Checklist IA** — BETClaw génère la checklist à partir du brief
4. **Mission pré-créée** — BETClaw crée la mission dans Supabase, visible dans la PWA
5. **Suivi inter-visites** — comparer V1 et V2 (résolu / persistant / nouveau)
6. **Multi-tenant** — plusieurs BET sur la même infrastructure
7. **Templates rapport par client** — mapping auto selon le type de mission
8. **Dashboard** — vue synthétique par bâtiment / mission / client
