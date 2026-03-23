export interface AddressSuggestion {
  id: string;
  label: string;
  housenumber?: string;
  street?: string;
  postcode: string;
  city: string;
  citycode: string;
  coordinates: [number, number]; // [lon, lat]
}

export async function searchAddress(
  query: string,
  signal?: AbortSignal,
): Promise<AddressSuggestion[]> {
  if (query.length < 3) return [];

  try {
    const res = await fetch(
      `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5&autocomplete=1`,
      { signal },
    );
    if (!res.ok) return [];

    const data = await res.json();
    return (data.features ?? []).map(
      (f: { properties: Record<string, string>; geometry: { coordinates: [number, number] } }) => ({
        id: f.properties.id,
        label: f.properties.label,
        housenumber: f.properties.housenumber,
        street: f.properties.street,
        postcode: f.properties.postcode,
        city: f.properties.city,
        citycode: f.properties.citycode,
        coordinates: f.geometry.coordinates,
      }),
    );
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') return [];
    return [];
  }
}
