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

export async function exportMissionZip(missionId: number): Promise<Blob> {
  const mission = await db.missions.get(missionId);
  if (!mission) throw new Error(`Mission ${missionId} not found`);

  const building = mission.buildingId
    ? await db.buildings.get(mission.buildingId)
    : undefined;

  const observations = await db.observations
    .where('missionId')
    .equals(missionId)
    .sortBy('createdAt');

  const zip = new JSZip();
  const photosFolder = zip.folder('photos')!;

  const exportObs: ExportObservation[] = [];
  for (let i = 0; i < observations.length; i++) {
    const obs = observations[i];
    const ref = generateRef(mission.type, i);
    const photoFilenames: string[] = [];

    if (obs.photoIds?.length) {
      for (let j = 0; j < obs.photoIds.length; j++) {
        const photo = await db.photos.get(obs.photoIds[j]);
        if (photo) {
          const filename = `${ref}_${String(j + 1).padStart(3, '0')}.jpg`;
          photosFolder.file(filename, photo.blob, { compression: 'STORE' });
          photoFilenames.push(`photos/${filename}`);
        }
      }
    }

    exportObs.push({
      ref,
      element: obs.element,
      description: obs.description,
      cause: obs.cause,
      action: obs.action,
      tag: obs.tag,
      photos: photoFilenames,
      timestamp: obs.createdAt,
    });
  }

  const context: ExportContext = {
    betclaw_version: '1.0',
    mission: {
      name: mission.name,
      type: mission.type,
      brief: mission.brief,
      visited_at: mission.visitedAt,
      status: mission.status,
    },
    building: building ? {
      name: building.name,
      address: building.address,
      city: building.city,
      building_type: building.buildingType,
    } : undefined,
    observations: exportObs,
  };

  zip.file('context.json', JSON.stringify(context, null, 2), { compression: 'DEFLATE' });
  zip.file('README.md', readmeContent, { compression: 'DEFLATE' });
  zip.file('render_cr_visite.py', renderScript, { compression: 'DEFLATE' });

  try {
    const templateBlob = await fetchTemplateDocx();
    zip.file('template_cr_visite_aulnay.docx', templateBlob, { compression: 'STORE' });
  } catch {
    console.warn('Could not bundle DOCX template — fetch failed (offline?)');
  }

  return zip.generateAsync({ type: 'blob' });
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export async function shareFile(blob: Blob, filename: string): Promise<boolean> {
  const file = new File([blob], filename, { type: 'application/zip' });
  if (!navigator.canShare?.({ files: [file] })) return false;
  await navigator.share({ files: [file], title: filename });
  return true;
}
