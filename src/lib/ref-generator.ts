/** Generate observation reference: V{visitNumber}-{nn} (zero-padded) */
export function generateRef(visitNumber: number, observationIndex: number): string {
  const nn = String(observationIndex + 1).padStart(2, '0');
  return `V${visitNumber}-${nn}`;
}
