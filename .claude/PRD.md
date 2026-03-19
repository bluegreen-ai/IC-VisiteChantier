# PRD — Outil CR Visite de Chantier IC Ingénieurs Conseils

## Statut : Phase 1 et 2 livrées — prêt pour tests terrain

---

## 1. Contexte

IC Ingénieurs Conseils assure le suivi de chantier de la réfection des balcons de la résidence Savigny Impair à Aulnay-sous-Bois (SDC Le Gros Saule). Des visites bimensuelles sont réalisées par Renaud Laborbe.

**Problème actuel :** Les notes terrain sont prises sur Google Docs (photos + commentaires courts, organisés par étage/façade). La rédaction du CR formel en DOCX prend trop de temps et implique beaucoup de copier-coller manuel.

**Objectif :** Automatiser la génération du CR à partir des notes terrain, tout en gardant le branding IC Ingénieurs Conseils.

---

## 2. Ce qui a été livré (Phase 1)

### 2.1 Template DOCX réutilisable

**Fichier :** `template/template_cr_visite_aulnay.docx`

Basé sur le template IC Ingénieurs Conseils, simplifié par Renaud. Structure :

| Section | Contenu |
|---------|---------|
| **Page de garde** | Logo IC, titre projet, client, résidence, bâtiment(s), adresse, référence dossier, date visite, table des participants (dynamique) |
| **1. Objet de la visite** | Paragraphe libre (contexte mission) |
| **2. Synthèse des observations** | Paragraphe libre (résumé + points de vigilance en bullet points) |
| **3. Observations détaillées** | Tableau 3 colonnes (voir ci-dessous) |
| **4. Conclusions** | Paragraphe libre |

### 2.2 Tableau des observations — Format 3 colonnes

| Colonne | Largeur | Contenu |
|---------|---------|---------|
| **Étage / Façade** | ~3.5 cm | Référence (V1-01) en bleu gras + localisation (ex: "10ème — Façade Est") |
| **Observation / Action** | ~7 cm | Description courte + retour à la ligne + "→ Action" en italique orange |
| **Illustration** | ~6.5 cm | Photo terrain redimensionnée (max 5cm largeur, 6.5cm hauteur) |

Alternance de fond gris clair (#F0F4F8) une ligne sur deux. Header bleu foncé (#1F3A5F) texte blanc.

### 2.3 Script de rendu

**Fichier :** `template/render_cr_visite.py`

```bash
python render_cr_visite.py context.json --photos-dir ./photos --output cr.docx
```

**Dépendances :** `python-docx`, `Pillow`

**Entrée :** Un fichier JSON de contexte + un dossier de photos.

### 2.4 Format du JSON de contexte

```json
{
    "titre_service": "Suivi de réfection des balcons - Lot 12",
    "client": "SDC Le Gros Saule",
    "residence": "Résidence Savigny Impair",
    "batiments_visites": "Bâtiment A",
    "adresse": "1-50 avenue de Savigny",
    "code_postal_ville": "93600 Aulnay-sous-Bois",
    "ref_dossier": "DE0328",
    "date_visite": "27 février 2026",
    "participants": [
        {
            "nom": "R. Laborbe",
            "fonction": "M.O Lot 12",
            "entreprise": "IC Ingénieurs Conseils",
            "contact": "06 50 96 61 98"
        }
    ],
    "objet_visite": "Texte libre...",
    "synthese": "Texte libre avec • bullets...",
    "observations": [
        {
            "ref": "V1-01",
            "etage_facade": "10ème — Façade Est",
            "observation": "Traces de truelle sur revêtement balcon",
            "action": "Reprendre les traces de truelle",
            "photo": "photo_filename.jpeg"
        }
    ],
    "conclusion": "Texte libre..."
}
```

### 2.5 Fichiers de référence

| Fichier | Rôle |
|---------|------|
| `template/template_cr_visite_aulnay.docx` | Template DOCX avec variables Jinja |
| `template/render_cr_visite.py` | Script de rendu Python |
| `template/context_visite_27022026.json` | Exemple complet (visite 27/02/2026) |
| `CR Visite Aulnay 27022026 Bat A V2.docx` | Version modifiée par Renaud (référence style) |
| `CR Visite Aulnay 27022026 Bat A V3.docx` | Version générée par le template (17 obs + photos) |
| `Compte rendu Aulnay 04022026 Bat A et B V1.pdf` | CR Laurent du 04/02 (référence historique) |

---

## 3. Ce qui a été livré (Phase 2) — PWA Outil terrain

### 3.1 Problème résolu

Sur le chantier, Renaud prenait des notes rapides sur Google Docs : un commentaire court + 1-2 photos par observation, avec une localisation (bâtiment, étage, façade). Pas structuré → réorganisation manuelle pour le CR.

**Solution livrée :** PWA offline-first (Option B retenue) — Preact + Vite + Tailwind v4, stockage IndexedDB via Dexie.js.

### 3.2 Flux implémenté

```
[Terrain — PWA mobile]              [Bureau]
Ouvrir la PWA (installable)     →   Données structurées en IndexedDB
Sélectionner Bât/Étage/Façade
Écrire 1 ligne (observation)
Prendre photo (caméra/galerie)
Écrire action corrective
Bouton "Ajouter"
         ↓
   Export ZIP (JSON + photos)
         ↓
   render_cr_visite.py → DOCX final
```

### 3.3 Stack technique

| Composant | Technologie |
|-----------|------------|
| Framework | Preact 10 + Signals |
| Build | Vite 7 + TypeScript 5.9 |
| CSS | Tailwind v4 |
| Storage | IndexedDB (Dexie.js 4) |
| Export | JSZip |
| PWA | vite-plugin-pwa + Workbox |
| Hosting | GitHub Pages |

### 3.4 Architecture PWA

3 onglets de navigation :
1. **Ajouter** — VisitHeader (métadonnées visite) + ObservationForm (saisie observation)
2. **Observations** — ObservationList avec ObservationCards (édition/suppression)
3. **Export** — ExportView avec récap + téléchargement ZIP

Composants réutilisables : SelectField, TextField, PhotoCapture (caméra + galerie + compression).

### 3.5 Données par observation (IndexedDB)

```json
{
    "id": 1,
    "visiteId": 1,
    "batiment": "A",
    "cage": null,
    "etage": "10ème",
    "facade": "Ouest",
    "observation": "Cale à reprendre",
    "action": "Recaler correctement",
    "photoIds": [1, 2],
    "createdAt": "2026-02-27T14:32:00.000Z"
}
```

Photos stockées séparément comme Blobs dans IndexedDB, liées par `photoIds`.

### 3.6 Format d'export ZIP

Le ZIP contient :
- `context.json` — format compatible `render_cr_visite.py` (voir section 2.4)
- `photos/` — photos JPEG compressées
- `render_cr_visite.py` — copie du script de rendu
- `template_cr_visite_aulnay.docx` — copie du template
- `README.md` — instructions d'utilisation

### 3.7 Intégration avec le skill Claude

Le skill `document-generator` (ou un nouveau skill dédié) pourrait :
1. Recevoir le JSON exporté par l'outil terrain
2. Extraire les photos du zip
3. Appeler `render_cr_visite.py` avec le contexte
4. Livrer le DOCX final

Commande type dans Claude :
> "Génère le CR de la visite d'aujourd'hui à Aulnay" → Claude lit le JSON exporté, génère le CR.

---

## 4. Phase 3 — Prochaines étapes et évolutions futures

### Priorité immédiate
- **Tests terrain** — utiliser la PWA sur un vrai chantier, identifier les friction points
- **Polish UX** — ajustements basés sur le retour terrain

### Évolutions futures
- **Suivi inter-visites :** comparer les observations entre V1 et V2 (résolu/persistant/nouveau)
- **Dashboard :** vue synthétique de toutes les observations par bâtiment/étage
- **Export PDF :** conversion automatique DOCX → PDF
- **Multi-projets :** adapter le template pour d'autres résidences IC
- **Historique photos :** avant/après par observation

---

## 5. Stack technique

| Composant | Technologie |
|-----------|-------------|
| PWA (outil terrain) | Preact 10 + Vite 7 + Tailwind v4 + TypeScript 5.9 |
| Stockage offline | IndexedDB (Dexie.js 4) |
| Export terrain | JSZip |
| PWA / Service Worker | vite-plugin-pwa + Workbox |
| Template DOCX | `python-docx` + template maison (pas docxtpl, trop limité pour les tableaux dynamiques) |
| Rendu CR | `render_cr_visite.py` (Python, ~200 lignes) |
| Photos | `Pillow` pour redimensionnement |
| Hébergement | GitHub Pages |

---

## 6. Arborescence projet

```
IC-VisiteChantier/
├── src/                                # PWA Preact
│   ├── main.tsx                        # Entry point
│   ├── app.tsx                         # Root component, 3-tab navigation
│   ├── types.ts                        # Interfaces TypeScript
│   ├── db/                             # IndexedDB (Dexie)
│   ├── lib/                            # Export ZIP, ref generator
│   └── components/                     # UI components
├── template/
│   ├── template_cr_visite_aulnay.docx  # Template réutilisable
│   ├── render_cr_visite.py             # Script de rendu
│   └── context_visite_27022026.json    # Exemple de contexte
├── package.json                        # Dependencies + scripts
├── vite.config.ts                      # Vite + PWA config
├── CR Visite Aulnay 27022026 Bat A V3.docx   # Version générée (référence)
└── Compte rendu Aulnay 04022026 Bat A et B V1.pdf  # CR historique
```
