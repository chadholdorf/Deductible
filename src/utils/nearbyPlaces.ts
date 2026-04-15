export interface NearbyPlace {
  id: number;
  name: string;
  distance?: number; // miles
  address?: string;
}

function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

export async function findNearbyDonationPlaces(
  lat: number,
  lng: number,
  radiusMeters = 8000
): Promise<NearbyPlace[]> {
  const query = `
[out:json][timeout:20];
(
  node["shop"="charity"](around:${radiusMeters},${lat},${lng});
  way["shop"="charity"](around:${radiusMeters},${lat},${lng});
  node["amenity"="social_facility"](around:${radiusMeters},${lat},${lng});
  way["amenity"="social_facility"](around:${radiusMeters},${lat},${lng});
  node["name"~"Goodwill|Salvation Army|Habitat for Humanity|Thrift|Donate|Donation|Vietnam Veterans|Purple Heart|AmVets|Deseret|Arc |St\\.? Vincent|Savers|Value Village|Oxfam|Scope|Cancer Research",i](around:${radiusMeters},${lat},${lng});
  way["name"~"Goodwill|Salvation Army|Habitat for Humanity|Thrift|Donate|Donation|Vietnam Veterans|Purple Heart|AmVets|Deseret|Arc |St\\.? Vincent|Savers|Value Village|Oxfam|Scope|Cancer Research",i](around:${radiusMeters},${lat},${lng});
);
out center tags;
  `.trim();

  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!res.ok) throw new Error('Overpass API error');
  const data = await res.json();

  const seen = new Set<string>();
  const places: NearbyPlace[] = [];

  for (const el of data.elements ?? []) {
    const name: string | undefined = el.tags?.name;
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const elLat: number | undefined = el.lat ?? el.center?.lat;
    const elLng: number | undefined = el.lon ?? el.center?.lon;
    const distance =
      elLat != null && elLng != null
        ? haversineMiles(lat, lng, elLat, elLng)
        : undefined;

    const tags = el.tags ?? {};
    const street =
      tags['addr:housenumber'] && tags['addr:street']
        ? `${tags['addr:housenumber']} ${tags['addr:street']}`
        : tags['addr:street'];
    const addressParts = [street, tags['addr:city'], tags['addr:state']].filter(Boolean);
    const address = addressParts.length ? addressParts.join(', ') : undefined;

    places.push({ id: el.id, name, distance, address });
  }

  return places.sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999)).slice(0, 12);
}
