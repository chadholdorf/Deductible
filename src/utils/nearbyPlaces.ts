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

const NAME_PATTERN =
  'Goodwill|Salvation Army|Habitat for Humanity|Thrift|Donate|Donation|Vietnam Veterans|Purple Heart|AmVets|Deseret|Arc |St\\.? Vincent|Savers|Value Village|Oxfam|Scope|Cancer Research|DAV |Volunteers of America|Pickup Please|Dress for Success';

async function queryOverpass(lat: number, lng: number, radiusMeters: number): Promise<NearbyPlace[]> {
  const query = `
[out:json][timeout:25];
(
  node["shop"="charity"](around:${radiusMeters},${lat},${lng});
  way["shop"="charity"](around:${radiusMeters},${lat},${lng});
  node["shop"="second_hand"](around:${radiusMeters},${lat},${lng});
  way["shop"="second_hand"](around:${radiusMeters},${lat},${lng});
  node["shop"="thrift"](around:${radiusMeters},${lat},${lng});
  way["shop"="thrift"](around:${radiusMeters},${lat},${lng});
  node["amenity"="social_facility"](around:${radiusMeters},${lat},${lng});
  way["amenity"="social_facility"](around:${radiusMeters},${lat},${lng});
  node["name"~"${NAME_PATTERN}",i](around:${radiusMeters},${lat},${lng});
  way["name"~"${NAME_PATTERN}",i](around:${radiusMeters},${lat},${lng});
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

  const places: NearbyPlace[] = [];
  for (const el of data.elements ?? []) {
    const name: string | undefined = el.tags?.name;
    if (!name) continue;
    const elLat: number | undefined = el.lat ?? el.center?.lat;
    const elLng: number | undefined = el.lon ?? el.center?.lon;
    const distance = elLat != null && elLng != null ? haversineMiles(lat, lng, elLat, elLng) : undefined;
    const tags = el.tags ?? {};
    const street =
      tags['addr:housenumber'] && tags['addr:street']
        ? `${tags['addr:housenumber']} ${tags['addr:street']}`
        : tags['addr:street'];
    const addressParts = [street, tags['addr:city'], tags['addr:state']].filter(Boolean);
    places.push({ id: el.id, name, distance, address: addressParts.length ? addressParts.join(', ') : undefined });
  }
  return places;
}

async function queryNominatim(lat: number, lng: number, hint: string): Promise<NearbyPlace[]> {
  const delta = 0.4; // ~27 mile bounding box
  const params = new URLSearchParams({
    q: hint,
    format: 'json',
    limit: '8',
    addressdetails: '1',
    bounded: '1',
    viewbox: `${lng - delta},${lat + delta},${lng + delta},${lat - delta}`,
  });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { 'Accept-Language': 'en', 'User-Agent': 'ItsDeductibleApp/1.0' },
  });
  if (!res.ok) return [];
  const data = await res.json();

  const places: NearbyPlace[] = [];
  for (const el of data) {
    const name: string = el.name || el.display_name?.split(',')[0];
    if (!name) continue;
    const elLat = parseFloat(el.lat);
    const elLng = parseFloat(el.lon);
    const distance = haversineMiles(lat, lng, elLat, elLng);
    const addr = el.address ?? {};
    const street = [addr.house_number, addr.road].filter(Boolean).join(' ');
    const addressParts = [street, addr.city || addr.town || addr.village, addr.state].filter(Boolean);
    places.push({
      id: parseInt(el.osm_id ?? '0', 10),
      name,
      distance,
      address: addressParts.length ? addressParts.join(', ') : undefined,
    });
  }
  return places;
}

export async function findNearbyDonationPlaces(
  lat: number,
  lng: number,
  radiusMeters = 15000,
  hint?: string
): Promise<NearbyPlace[]> {
  const [overpassResults, nominatimResults] = await Promise.allSettled([
    queryOverpass(lat, lng, radiusMeters),
    hint && hint.trim().length >= 2 ? queryNominatim(lat, lng, hint.trim()) : Promise.resolve([]),
  ]);

  const overpass = overpassResults.status === 'fulfilled' ? overpassResults.value : [];
  const nominatim = nominatimResults.status === 'fulfilled' ? nominatimResults.value : [];

  // Merge, dedup by normalized name
  const seen = new Set<string>();
  const merged: NearbyPlace[] = [];
  for (const place of [...nominatim, ...overpass]) {
    const key = place.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(place);
  }

  return merged.sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999)).slice(0, 12);
}
