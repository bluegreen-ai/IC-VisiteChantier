import JSZip from 'jszip';
import { db } from '../db/schema';
import type { ExportContext, ExportObservation } from '../types';
import { generateRef } from './ref-generator';
import renderScript from '../../template/render_cr_visite.py?raw';
import readmeContent from '../../template/README.md?raw';
import templateDocxUrl from '../../template/template_cr_visite_aulnay.docx?url';

async function fetchTemplateDocx(): Promise<Blob> {
  const response = await fetch(templateDocxUrl);
  if (!response.ok) throw new Error('Failed to fetch DOCX template');
  return response.blob();
}

export async function exportVisiteZip(visiteId: number): Promise<Blob> {
  const visite = await db.visites.get(visiteId);
  if (!visite) throw new Error(`Visite ${visiteId} not found`);

  const observations = await db.observations
    .where('visiteId')
    .equals(visiteId)
    .sortBy('createdAt');

  const zip = new JSZip();
  const photosFolder = zip.folder('photos')!;

  const exportObs: ExportObservation[] = [];
  for (let i = 0; i < observations.length; i++) {
    const obs = observations[i];
    let photoFilename = '';

    if (obs.photoIds?.length) {
      const photo = await db.photos.get(obs.photoIds[0]);
      if (photo) {
        photoFilename = `obs-${String(i + 1).padStart(3, '0')}.jpg`;
        photosFolder.file(photoFilename, photo.blob, { compression: 'STORE' });
      }
    }

    exportObs.push({
      ref: generateRef(visite.visitNumber, i),
      etage_facade: buildEtageFacade(obs.etage, obs.facade, obs.cage),
      observation: obs.observation,
      action: obs.action,
      photo: photoFilename,
    });
  }

  const context: ExportContext = {
    titre_service: visite.titre_service,
    client: visite.client,
    residence: visite.residence,
    batiments_visites: visite.batiments_visites,
    adresse: visite.adresse,
    code_postal_ville: visite.code_postal_ville,
    ref_dossier: visite.ref_dossier,
    date_visite: visite.date_visite.toISOString().split('T')[0],
    participants: visite.participants,
    objet_visite: visite.objet_visite,
    synthese: visite.synthese,
    observations: exportObs,
    conclusion: visite.conclusion,
  };

  zip.file('context.json', JSON.stringify(context, null, 2), { compression: 'DEFLATE' });
  zip.file('README.md', readmeContent, { compression: 'DEFLATE' });
  zip.file('render_cr_visite.py', renderScript, { compression: 'DEFLATE' });

  try {
    const templateBlob = await fetchTemplateDocx();
    zip.file('template_cr_visite_aulnay.docx', templateBlob, { compression: 'STORE' });
  } catch {
    // Template fetch may fail offline — ZIP is still usable without it
    console.warn('Could not bundle DOCX template — fetch failed (offline?)');
  }

  return zip.generateAsync({ type: 'blob' });
}

function buildEtageFacade(etage: string, facade: string, cage?: string): string {
  const parts: string[] = [];
  if (cage) parts.push(cage);
  if (etage) parts.push(etage);
  if (facade) parts.push(`Façade ${facade}`);
  return parts.join(' — ');
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
