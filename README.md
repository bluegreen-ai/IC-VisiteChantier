# IC-VisiteChantier

Site visit report generator for IC Ingénieurs Conseils. Automates the creation of construction site inspection reports (CR Visite de Chantier) from field notes and photos.

## Current Project: Résidence Savigny Impair, Aulnay-sous-Bois

Balcony refurbishment monitoring (Lot 12) for SDC Le Gros Saule, contractor Bouygues Bâtiment.

## What's Working (Phase 1)

Generate a branded DOCX report from a JSON context file + photos:

```bash
cd template
python render_cr_visite.py context_visite_27022026.json --photos-dir ./photos --output cr.docx
```

**Dependencies:** `python-docx`, `Pillow`

```bash
pip install python-docx Pillow
```

## What's Next (Phase 2)

PWA mobile app for field data capture:
- Select Building / Floor / Facade
- Add observation + photo
- Export JSON + photos as ZIP
- Feed into `render_cr_visite.py` for report generation

## Project Structure

```
├── .claude/PRD.md                               # Full product requirements
├── template/
│   ├── template_cr_visite_aulnay.docx           # DOCX template (IC branding)
│   ├── render_cr_visite.py                      # Report generation script
│   └── context_visite_27022026.json             # Example context (17 observations)
├── CR Visite Aulnay 27022026 Bat A V3.docx      # Generated report (reference)
└── Compte rendu Aulnay 04022026 Bat A et B V1.pdf  # Historical report
```

## Documentation

- **[PRD](.claude/PRD.md)** - Full specifications and roadmap
- **[Status](.claude/STATUS.md)** - Current sprint and priorities
- **[Workflow Guide](docs/workflow-guide.md)** - Development methodology

## Development

Built with Claude Code using PRD-first methodology with [3-tier context engineering](docs/workflow-guide.md).

```bash
/core_piv_loop:prime          # Load project context
/core_piv_loop:plan-feature   # Plan a new feature
/core_piv_loop:execute        # Execute with task tracking
/handoff                      # Capture session state
/commit                       # Clean commit with context tracking
```
