# CR Visite de Chantier — Export PWA

## Quick Start

This archive contains everything needed to generate a branded DOCX site visit report.

### 1. Review and improve observations

Open `context.json` — it contains the raw field notes. Key sections to review:

- **objet_visite**: Purpose and context of the visit (write 2-3 sentences)
- **synthese**: Executive summary + bullet points of key concerns
- **observations[].observation**: Short description of each issue found
- **observations[].action**: Corrective action required
- **conclusion**: Wrap-up paragraph + key takeaways

**Tips for professional writing (IC Ingénieurs tone):**
- Use formal French, third person ("IC Ingénieurs Conseils constate que...")
- Be precise and factual — describe what was observed, not opinions
- Actions should start with an infinitive verb ("Reprendre", "Vérifier", "Assurer")
- Reference specific locations (floor, facade) in observations

### 2. Generate the DOCX report

```bash
pip install python-docx Pillow
python render_cr_visite.py context.json --photos-dir ./photos --output cr_visite.docx
```

### 3. Files in this archive

| File | Description |
|------|-------------|
| `context.json` | Visit data (metadata + observations) — **edit this** |
| `photos/` | Observation photos referenced in context.json |
| `render_cr_visite.py` | Python script to generate the DOCX report |
| `template_cr_visite_aulnay.docx` | IC Ingénieurs branded Word template |

### JSON format reference

Each observation in `context.json` has:
- **ref**: Reference code (e.g., "V2-01" for visit 2, observation 1)
- **etage_facade**: Location (e.g., "10ème — Façade Est")
- **observation**: What was found (1-2 sentences)
- **action**: Corrective action (starts with infinitive verb)
- **photo**: Filename in photos/ folder
