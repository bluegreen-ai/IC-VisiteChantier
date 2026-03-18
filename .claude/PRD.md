# PRD — Outil CR Visite de Chantier IC Ingénieurs Conseils

## Statut : En cours — Phase 1 livrée

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

## 3. Phase 2 — Outil terrain (à développer)

### 3.1 Problème à résoudre

Sur le chantier, Renaud prend des notes rapides : un commentaire court + 1-2 photos par observation, avec une localisation (bâtiment, étage, façade). Ces notes sont actuellement dans Google Docs, ce qui est fonctionnel mais pas structuré — il faut ensuite tout réorganiser manuellement pour le CR.

**Citation Renaud :** "La difficulté est plutôt de pouvoir avoir un moyen rapide d'écrire un commentaire, ajouter des photos sur un endroit précis du bâtiment (bâtiment A, 10ème étage, façade ouest) et faire en sorte que le rapport [se génère]. Car les commentaires sont courts."

### 3.2 Flux cible

```
[Terrain]                    [Bureau]
Ouvrir l'outil mobile    →   Les données arrivent structurées
Sélectionner Bât/Étage/Façade
Écrire 1 ligne            →   = observation
Prendre 1-2 photos        →   = illustration
Taper "action" suggérée   →   = action corrective
         ↓
   Export JSON + photos
         ↓
   render_cr_visite.py → DOCX final
```

### 3.3 Options d'implémentation

| Option | Avantages | Inconvénients |
|--------|-----------|---------------|
| **A. Google Sheet + Google Form** | Zéro dev, photos via form, export CSV facile | UX limitée, pas de sélecteur bâtiment/étage fluide |
| **B. Web app PWA** | UX optimale, fonctionne hors-ligne, camera native | Temps de dev, hébergement |
| **C. Google Apps Script + Sheet** | Compromis : UI custom dans Sheet, zéro hébergement | Limité en UX, dépendance Google |

**Recommandation :** Option B (PWA) pour le meilleur rapport UX/pérennité. Peut être ultra-simple : une seule page, 3 selects (Bât/Étage/Façade) + champ texte + bouton photo + bouton "Ajouter". Export JSON en un clic.

### 3.4 Specs fonctionnelles de l'outil terrain

**Écran principal :**
- Sélecteur : Bâtiment (A, B, C...) / Étage (RDC à 10ème) / Façade (Nord, Sud, Est, Ouest)
- Champ texte : observation (1-2 lignes max)
- Champ texte : action corrective (optionnel, suggestions auto)
- Bouton photo : accès caméra, 1-2 photos max
- Bouton "Ajouter" : ajoute l'observation à la liste
- Liste scrollable des observations déjà saisies (éditable, supprimable)

**Écran récap / export :**
- Vue tableau de toutes les observations
- Pré-remplissage : date, participants (configurables)
- Bouton "Exporter JSON + photos" → zip téléchargeable
- (Optionnel) Bouton "Générer CR" si le rendu est intégré côté serveur

**Données par observation :**
```json
{
    "ref": "auto-incrémenté (V{n_visite}-{nn})",
    "batiment": "A",
    "etage": "10",
    "facade": "Ouest",
    "observation": "Cale à reprendre",
    "action": "Recaler correctement",
    "photos": ["IMG_001.jpg", "IMG_002.jpg"],
    "timestamp": "2026-02-27T14:32:00"
}
```

### 3.5 Intégration avec le skill Claude

Le skill `document-generator` (ou un nouveau skill dédié) pourrait :
1. Recevoir le JSON exporté par l'outil terrain
2. Extraire les photos du zip
3. Appeler `render_cr_visite.py` avec le contexte
4. Livrer le DOCX final

Commande type dans Claude :
> "Génère le CR de la visite d'aujourd'hui à Aulnay" → Claude lit le JSON exporté, génère le CR.

---

## 4. Phase 3 — Évolutions futures

- **Suivi inter-visites :** comparer les observations entre V1 et V2 (résolu/persistant/nouveau)
- **Dashboard :** vue synthétique de toutes les observations par bâtiment/étage
- **Export PDF :** conversion automatique DOCX → PDF
- **Multi-projets :** adapter le template pour d'autres résidences IC
- **Historique photos :** avant/après par observation

---

## 5. Stack technique

| Composant | Technologie |
|-----------|-------------|
| Template DOCX | `python-docx` + template maison (pas docxtpl, trop limité pour les tableaux dynamiques) |
| Rendu CR | `render_cr_visite.py` (Python, ~200 lignes) |
| Photos | `Pillow` pour redimensionnement, extraction PDF via `PyMuPDF` |
| Outil terrain (Phase 2) | PWA (HTML/JS) ou Google Sheet + Apps Script |
| Stockage | Synology Drive, vault Obsidian pour le suivi projet |

---

## 6. Arborescence projet

```
bluegreen/Projets/ICIngenieursConseils/Aulnay/
├── template/
│   ├── template_cr_visite_aulnay.docx    # Template réutilisable
│   ├── render_cr_visite.py               # Script de rendu
│   └── context_visite_27022026.json      # Exemple de contexte
├── CR Visite Aulnay 27022026 Bat A V2.docx   # Version Renaud (référence)
├── CR Visite Aulnay 27022026 Bat A V3.docx   # Version template (finale)
├── CR Visite Aulnay 04022026 Bat A et B V1.pdf  # CR Laurent (historique)
└── PRD.md                                 # Ce document
```
