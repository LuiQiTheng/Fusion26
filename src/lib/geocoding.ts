/**
 * OpenStreetMap Nominatim Geocoding and Malaysian Landmark / Campus Directory
 * Enables instant, zero-latency matching for major Malaysian universities (UTeM, UPM, UKM, UM, etc.),
 * transit hubs, and towns, alongside live Nominatim geocoding for any arbitrary address.
 */

export interface GeocodeLocation {
  name: string;
  subtitle: string;
  placeId: string;
  category: 'campus' | 'stay' | 'transit' | 'landmark' | 'address' | 'gps';
  coordinates: [number, number]; // [lat, lng]
  aliases?: string[];
  stateId?: string;
}

/**
 * Built-in directory of major Malaysian universities, campuses, transit terminals,
 * airports, and key districts across Malaysia.
 * Guarantees 0ms instant matching for UTeM, UPM, and popular student/traveler origins.
 */
export const MALAYSIAN_DIRECTORY: GeocodeLocation[] = [
  // --- Universiti Teknikal Malaysia Melaka (UTeM) ---
  {
    name: 'Universiti Teknikal Malaysia Melaka (UTeM) - Main Campus',
    subtitle: 'Durian Tunggal / Ayer Keroh, Melaka',
    placeId: 'loc-utem-main',
    category: 'campus',
    coordinates: [2.3106585, 102.3204162],
    aliases: ['utem', 'utem main', 'utem durian tunggal', 'universiti teknikal malaysia melaka', 'utem melaka'],
    stateId: 'MLK',
  },
  {
    name: 'UTeM Kampus Teknologi',
    subtitle: 'Hang Tuah Jaya, Ayer Keroh, Melaka',
    placeId: 'loc-utem-teknologi',
    category: 'campus',
    coordinates: [2.2741, 102.2798],
    aliases: ['utem teknologi', 'utem ayer keroh'],
    stateId: 'MLK',
  },
  {
    name: 'UTeM Kampus Bandar',
    subtitle: 'Jalan Hang Tuah, Melaka City',
    placeId: 'loc-utem-bandar',
    category: 'campus',
    coordinates: [2.2023, 102.2495],
    aliases: ['utem bandar', 'utem city campus'],
    stateId: 'MLK',
  },

  // --- Universiti Putra Malaysia (UPM) ---
  {
    name: 'Universiti Putra Malaysia (UPM)',
    subtitle: 'Serdang, Selangor',
    placeId: 'loc-upm-serdang',
    category: 'campus',
    coordinates: [2.9918365, 101.720677],
    aliases: ['upm', 'upm serdang', 'universiti putra malaysia', 'upm selangor'],
    stateId: 'SGR',
  },

  // --- Other Major Malaysian Universities ---
  {
    name: 'Universiti Malaya (UM)',
    subtitle: 'Lembah Pantai, Kuala Lumpur',
    placeId: 'loc-um-kl',
    category: 'campus',
    coordinates: [3.1199, 101.6645],
    aliases: ['um', 'universiti malaya', 'university of malaya'],
    stateId: 'KUL',
  },
  {
    name: 'Universiti Kebangsaan Malaysia (UKM)',
    subtitle: 'Bangi, Selangor',
    placeId: 'loc-ukm-bangi',
    category: 'campus',
    coordinates: [2.9288, 101.7797],
    aliases: ['ukm', 'ukm bangi', 'universiti kebangsaan malaysia'],
    stateId: 'SGR',
  },
  {
    name: 'Multimedia University (MMU Melaka)',
    subtitle: 'Bukit Beruang, Melaka',
    placeId: 'loc-mmu-melaka',
    category: 'campus',
    coordinates: [2.2486, 102.2778],
    aliases: ['mmu', 'mmu melaka', 'multimedia university melaka', 'mmu bukit beruang'],
    stateId: 'MLK',
  },
  {
    name: 'Multimedia University (MMU Cyberjaya)',
    subtitle: 'Cyberjaya, Selangor',
    placeId: 'loc-mmu-cyberjaya',
    category: 'campus',
    coordinates: [2.9278, 101.6418],
    aliases: ['mmu cyberjaya', 'multimedia university cyberjaya'],
    stateId: 'SGR',
  },
  {
    name: 'UiTM Melaka Kampus Alor Gajah',
    subtitle: 'Alor Gajah, Melaka',
    placeId: 'loc-uitm-alor-gajah',
    category: 'campus',
    coordinates: [2.3822, 102.1895],
    aliases: ['uitm alor gajah', 'uitm melaka', 'uitm lendu'],
    stateId: 'MLK',
  },
  {
    name: 'UiTM Melaka Kampus Bandaraya',
    subtitle: 'Jalan Hang Tuah, Melaka City',
    placeId: 'loc-uitm-bandaraya',
    category: 'campus',
    coordinates: [2.2045, 102.253],
    aliases: ['uitm bandar melaka', 'uitm bandaraya melaka'],
    stateId: 'MLK',
  },
  {
    name: 'UiTM Melaka Kampus Jasin',
    subtitle: 'Jasin, Melaka',
    placeId: 'loc-uitm-jasin',
    category: 'campus',
    coordinates: [2.2272, 102.4533],
    aliases: ['uitm jasin'],
    stateId: 'MLK',
  },
  {
    name: 'Universiti Sains Malaysia (USM)',
    subtitle: 'Gelugor, Penang',
    placeId: 'loc-usm-penang',
    category: 'campus',
    coordinates: [5.3559, 100.3018],
    aliases: ['usm', 'usm penang', 'universiti sains malaysia'],
    stateId: 'PNG',
  },
  {
    name: 'Universiti Teknologi Malaysia (UTM Skudai)',
    subtitle: 'Skudai, Johor Bahru',
    placeId: 'loc-utm-skudai',
    category: 'campus',
    coordinates: [1.5593, 103.6378],
    aliases: ['utm', 'utm skudai', 'utm johor', 'universiti teknologi malaysia'],
    stateId: 'JHR',
  },
  {
    name: 'Universiti Teknologi Malaysia (UTM Kuala Lumpur)',
    subtitle: 'Jalan Sultan Yahya Petra, Kuala Lumpur',
    placeId: 'loc-utm-kl',
    category: 'campus',
    coordinates: [3.1725, 101.721],
    aliases: ['utm kl', 'utm jalan semarak'],
    stateId: 'KUL',
  },
  {
    name: 'Asia Pacific University (APU)',
    subtitle: 'Technology Park Malaysia, Bukit Jalil, KL',
    placeId: 'loc-apu-kl',
    category: 'campus',
    coordinates: [3.0555, 101.7003],
    aliases: ['apu', 'apiit', 'asia pacific university'],
    stateId: 'KUL',
  },
  {
    name: 'Sunway University',
    subtitle: 'Bandar Sunway, Subang Jaya, Selangor',
    placeId: 'loc-sunway-uni',
    category: 'campus',
    coordinates: [3.0678, 101.6038],
    aliases: ['sunway', 'sunway university', 'sunway college'],
    stateId: 'SGR',
  },
  {
    name: 'Monash University Malaysia',
    subtitle: 'Bandar Sunway, Selangor',
    placeId: 'loc-monash-my',
    category: 'campus',
    coordinates: [3.0645, 101.6008],
    aliases: ['monash', 'monash university'],
    stateId: 'SGR',
  },
  {
    name: "Taylor's University Lakeside Campus",
    subtitle: 'Subang Jaya, Selangor',
    placeId: 'loc-taylors-lakeside',
    category: 'campus',
    coordinates: [3.0628, 101.6169],
    aliases: ['taylors', 'taylors university', 'taylor'],
    stateId: 'SGR',
  },
  {
    name: 'Universiti Tunku Abdul Rahman (UTAR Sg Long)',
    subtitle: 'Bandar Sungai Long, Kajang, Selangor',
    placeId: 'loc-utar-sglong',
    category: 'campus',
    coordinates: [3.0402, 101.7944],
    aliases: ['utar', 'utar sungai long', 'utar sg long'],
    stateId: 'SGR',
  },
  {
    name: 'Universiti Tunku Abdul Rahman (UTAR Kampar)',
    subtitle: 'Kampar, Perak',
    placeId: 'loc-utar-kampar',
    category: 'campus',
    coordinates: [4.3387, 101.1412],
    aliases: ['utar kampar'],
    stateId: 'PRK',
  },
  {
    name: 'TAR UMT (Tunku Abdul Rahman UMT)',
    subtitle: 'Setapak, Kuala Lumpur',
    placeId: 'loc-tar-umt',
    category: 'campus',
    coordinates: [3.2152, 101.7289],
    aliases: ['tarc', 'tar umt', 'tunku abdul rahman university'],
    stateId: 'KUL',
  },

  // --- Transit Terminals & Airports ---
  {
    name: 'Melaka Sentral Bus Terminal',
    subtitle: 'Peringgit, Melaka (Central Transit Hub)',
    placeId: 'loc-melaka-sentral',
    category: 'transit',
    coordinates: [2.2223, 102.2488],
    aliases: ['melaka sentral', 'malacca sentral', 'stesen bas melaka sentral', 'sentral bus terminal'],
    stateId: 'MLK',
  },
  {
    name: 'Melaka Airport (Batu Berendam)',
    subtitle: 'Batu Berendam, Melaka (MKZ)',
    placeId: 'loc-melaka-airport',
    category: 'transit',
    coordinates: [2.2633, 102.252],
    aliases: ['melaka airport', 'batu berendam airport', 'lapangan terbang melaka', 'mkz'],
    stateId: 'MLK',
  },
  {
    name: 'KL Sentral Transit Hub',
    subtitle: 'Brickfields, Kuala Lumpur (LRT / MRT / KTM / ERL)',
    placeId: 'loc-kl-sentral',
    category: 'transit',
    coordinates: [3.1342, 101.6865],
    aliases: ['kl sentral', 'kuala lumpur sentral', 'stesen kl sentral'],
    stateId: 'KUL',
  },
  {
    name: 'TBS (Terminal Bersepadu Selatan)',
    subtitle: 'Bandar Tasik Selatan, Kuala Lumpur',
    placeId: 'loc-tbs-kl',
    category: 'transit',
    coordinates: [3.0772, 101.7107],
    aliases: ['tbs', 'terminal bersepadu selatan', 'bandar tasik selatan'],
    stateId: 'KUL',
  },
  {
    name: 'KLIA (Kuala Lumpur International Airport T1)',
    subtitle: 'Sepang, Selangor (Main Terminal)',
    placeId: 'loc-klia-t1',
    category: 'transit',
    coordinates: [2.7448046, 101.707448],
    aliases: ['klia', 'klia1', 'klia t1', 'kuala lumpur international airport'],
    stateId: 'SGR',
  },
  {
    name: 'KLIA Terminal 2 (klia2)',
    subtitle: 'Sepang, Selangor (Budget Terminal)',
    placeId: 'loc-klia-t2',
    category: 'transit',
    coordinates: [2.7433, 101.6865],
    aliases: ['klia2', 'klia 2', 'klia terminal 2'],
    stateId: 'SGR',
  },
  {
    name: 'KTM Pulau Sebang / Tampin Station',
    subtitle: 'Alor Gajah Border (Melaka Rail Gateway)',
    placeId: 'loc-ktm-tampin',
    category: 'transit',
    coordinates: [2.4781, 102.2307],
    aliases: ['ktm tampin', 'pulau sebang', 'stesen tampin'],
    stateId: 'MLK',
  },
  {
    name: 'KTM Batang Melaka Station',
    subtitle: 'Jasin, Melaka (ETS / KTM Intercity)',
    placeId: 'loc-ktm-batang-melaka',
    category: 'transit',
    coordinates: [2.4682, 102.4173],
    aliases: ['ktm batang melaka', 'stesen batang melaka'],
    stateId: 'MLK',
  },
  {
    name: 'Penang Sentral Hub',
    subtitle: 'Butterworth, Penang (Bus / Train / Ferry)',
    placeId: 'loc-penang-sentral',
    category: 'transit',
    coordinates: [5.3965, 100.3662],
    aliases: ['penang sentral', 'butterworth sentral'],
    stateId: 'PNG',
  },

  // --- Melaka Accommodations & Popular Clusters ---
  {
    name: 'The Majestic Malacca',
    subtitle: 'Jalan Bunga Raya, Melaka Riverside',
    placeId: 'loc-majestic-melaka',
    category: 'stay',
    coordinates: [2.2023, 102.2514],
    aliases: ['majestic malacca', 'the majestic malacca'],
    stateId: 'MLK',
  },
  {
    name: 'Hatten Hotel Melaka',
    subtitle: 'Bandar Hilir, Melaka (Near Dataran Pahlawan)',
    placeId: 'loc-hatten-melaka',
    category: 'stay',
    coordinates: [2.1896, 102.253],
    aliases: ['hatten', 'hatten hotel', 'hatten melaka', 'bandar hilir'],
    stateId: 'MLK',
  },
  {
    name: 'Casa del Rio Melaka',
    subtitle: 'Jalan Kota Laksamana, Melaka River',
    placeId: 'loc-casa-del-rio',
    category: 'stay',
    coordinates: [2.1947, 102.2464],
    aliases: ['casa del rio', 'casa hotel'],
    stateId: 'MLK',
  },
  {
    name: 'Courtyard by Marriott Melaka',
    subtitle: 'Lorong Hang Jebat, Melaka',
    placeId: 'loc-courtyard-melaka',
    category: 'stay',
    coordinates: [2.2062, 102.2505],
    aliases: ['courtyard marriott', 'courtyard melaka'],
    stateId: 'MLK',
  },
  {
    name: 'DoubleTree by Hilton Melaka',
    subtitle: 'Hatten City, Jalan Melaka Raya 23',
    placeId: 'loc-doubletree-melaka',
    category: 'stay',
    coordinates: [2.1848, 102.2612],
    aliases: ['doubletree', 'doubletree melaka', 'doubletree hilton'],
    stateId: 'MLK',
  },
  {
    name: 'The Shore Hotel & Residences',
    subtitle: 'Bunga Raya Pantai, Melaka River',
    placeId: 'loc-the-shore',
    category: 'stay',
    coordinates: [2.202, 102.2498],
    aliases: ['the shore', 'the shore melaka', 'shore hotel'],
    stateId: 'MLK',
  },
  {
    name: 'Atlantis Residences Melaka',
    subtitle: 'Kota Laksamana, Melaka',
    placeId: 'loc-atlantis-melaka',
    category: 'stay',
    coordinates: [2.1985, 102.229],
    aliases: ['atlantis', 'atlantis residences', 'kota laksamana'],
    stateId: 'MLK',
  },

  // --- Prominent Districts & Towns ---
  {
    name: 'Ayer Keroh Town',
    subtitle: 'Hang Tuah Jaya, Melaka',
    placeId: 'loc-ayer-keroh',
    category: 'landmark',
    coordinates: [2.2741, 102.2825],
    aliases: ['ayer keroh', 'air keroh'],
    stateId: 'MLK',
  },
  {
    name: 'Alor Gajah Town',
    subtitle: 'Alor Gajah District, Melaka',
    placeId: 'loc-alor-gajah',
    category: 'landmark',
    coordinates: [2.3804, 102.2089],
    aliases: ['alor gajah', 'pekan alor gajah'],
    stateId: 'MLK',
  },
  {
    name: 'Durian Tunggal Town',
    subtitle: 'Alor Gajah District, Melaka',
    placeId: 'loc-durian-tunggal',
    category: 'landmark',
    coordinates: [2.3129, 102.3121],
    aliases: ['durian tunggal'],
    stateId: 'MLK',
  },
  {
    name: 'Jasin Town',
    subtitle: 'Jasin District, Melaka',
    placeId: 'loc-jasin-town',
    category: 'landmark',
    coordinates: [2.3106, 102.4284],
    aliases: ['jasin', 'pekan jasin'],
    stateId: 'MLK',
  },
  {
    name: 'Pantai Klebang',
    subtitle: 'Klebang, Melaka (Sand Dunes & Coastal Walk)',
    placeId: 'loc-klebang',
    category: 'landmark',
    coordinates: [2.2173, 102.1925],
    aliases: ['klebang', 'pantai klebang', 'klebang beach'],
    stateId: 'MLK',
  },
  {
    name: 'Putrajaya Sentral / Core',
    subtitle: 'Wilayah Persekutuan Putrajaya',
    placeId: 'loc-putrajaya',
    category: 'landmark',
    coordinates: [2.9264, 101.6964],
    aliases: ['putrajaya', 'putrajaya sentral'],
    stateId: 'PJY',
  },
  {
    name: 'Cyberjaya Central District',
    subtitle: 'Sepang, Selangor',
    placeId: 'loc-cyberjaya',
    category: 'landmark',
    coordinates: [2.9213, 101.6559],
    aliases: ['cyberjaya'],
    stateId: 'SGR',
  },
  {
    name: 'Serdang / Sri Kembangan',
    subtitle: 'Subang Jaya City Council, Selangor',
    placeId: 'loc-serdang',
    category: 'landmark',
    coordinates: [3.0232, 101.7118],
    aliases: ['serdang', 'seri kembangan'],
    stateId: 'SGR',
  },
  {
    name: 'Seremban Town',
    subtitle: 'Negeri Sembilan',
    placeId: 'loc-seremban',
    category: 'landmark',
    coordinates: [2.7258, 101.9378],
    aliases: ['seremban'],
    stateId: 'NSN',
  },
  {
    name: 'Muar Town (Bandar Maharani)',
    subtitle: 'Muar District, Johor',
    placeId: 'loc-muar',
    category: 'landmark',
    coordinates: [2.0442, 102.5689],
    aliases: ['muar', 'bandar maharani'],
    stateId: 'JHR',
  },
  {
    name: 'Batu Pahat Town',
    subtitle: 'Batu Pahat District, Johor',
    placeId: 'loc-batu-pahat',
    category: 'landmark',
    coordinates: [1.8494, 102.9288],
    aliases: ['batu pahat'],
    stateId: 'JHR',
  },
];

// In-memory cache for live Nominatim search results
const nominatimCache = new Map<string, GeocodeLocation[]>();

/**
 * Searches the curated Malaysian directory instantly (0ms)
 */
export function searchCuratedDirectory(query: string): GeocodeLocation[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const cleanQ = q.replace(/[^a-z0-9]/g, '');

  return MALAYSIAN_DIRECTORY.filter((item) => {
    const nameMatch = item.name.toLowerCase().includes(q);
    const subMatch = item.subtitle.toLowerCase().includes(q);
    const aliasMatch = item.aliases?.some(
      (a) => a.toLowerCase().includes(q) || (cleanQ.length >= 3 && cleanQ.includes(a.replace(/[^a-z0-9]/g, '')))
    );
    return nameMatch || subMatch || aliasMatch;
  });
}

/**
 * Live geocode lookup using OpenStreetMap Nominatim with caching
 */
/**
 * Retrieves the Mapbox access token if configured in Vite or CRA environment variables
 */
function getMapboxToken(): string | undefined {
  try {
    // Vite standard
    if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_MAPBOX_TOKEN) {
      return (import.meta as any).env.VITE_MAPBOX_TOKEN;
    }
  } catch {}
  try {
    // Process env fallback
    if (typeof process !== 'undefined' && process.env?.REACT_APP_MAPBOX_TOKEN) {
      return process.env.REACT_APP_MAPBOX_TOKEN;
    }
  } catch {}
  return undefined;
}

/**
 * Live geocode lookup with Mapbox Search API (if token provided) or
 * 100% Free OpenStreetMap Nominatim fallback (restricted to Malaysia).
 */
export async function searchLiveNominatim(query: string, signal?: AbortSignal): Promise<GeocodeLocation[]> {
  const q = query.trim();
  if (!q || q.length < 2) return [];

  const cacheKey = q.toLowerCase();
  if (nominatimCache.has(cacheKey)) {
    return nominatimCache.get(cacheKey)!;
  }

  const token = getMapboxToken();

  // 1. If Mapbox Token is present, query Mapbox Geocoding API (100,000 free requests/mo)
  if (token) {
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        q
      )}.json?country=my&limit=5&access_token=${token}`;
      const res = await fetch(url, { signal });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.features) && data.features.length > 0) {
          const parsed: GeocodeLocation[] = [];
          for (let idx = 0; idx < data.features.length; idx++) {
            const feat = data.features[idx];
            const [lon, lat] = feat.center ?? feat.geometry?.coordinates ?? [];
            if (typeof lat !== 'number' || typeof lon !== 'number') continue;
            const placeName: string = feat.place_name || q;
            const text: string = feat.text || q;
            const parts = placeName.split(',').map((p: string) => p.trim());
            const primaryTitle = text || parts[0] || q;
            const subParts = parts.filter((p: string) => p !== primaryTitle).slice(0, 3);
            const subtitle = subParts.join(', ') || 'Malaysia';

            const lower = placeName.toLowerCase();
            let cat: GeocodeLocation['category'] = 'address';
            if (/universiti|university|kolej|college|kampus|campus|sekolah|school/.test(lower)) {
              cat = 'campus';
            } else if (/hotel|resort|suites|inn|homestay|stay/.test(lower)) {
              cat = 'stay';
            } else if (/terminal|stesen|station|sentral|airport|lapangan terbang|ktm|lrt|mrt/.test(lower)) {
              cat = 'transit';
            } else if (/masjid|mosque|temple|kuil|church|gereja|museum|muzium/.test(lower)) {
              cat = 'landmark';
            }

            parsed.push({
              name: primaryTitle,
              subtitle,
              placeId: `mbx-${feat.id || idx}`,
              category: cat,
              coordinates: [lat, lon],
            });
          }
          if (parsed.length > 0) {
            nominatimCache.set(cacheKey, parsed);
            return parsed;
          }
        }
      }
    } catch {
      // Fall through to OpenStreetMap Nominatim
    }
  }

  // 2. OpenStreetMap Nominatim (100% Free, FOC, no token or credit card required)
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      q
    )}&countrycodes=my&limit=5&addressdetails=1`;

    const res = await fetch(url, {
      signal,
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    const parsed: GeocodeLocation[] = [];
    for (let idx = 0; idx < data.length; idx++) {
      const item = data[idx];
      const lat = parseFloat(item.lat);
      const lon = parseFloat(item.lon);
      if (isNaN(lat) || isNaN(lon)) continue;

      const displayName = item.display_name || '';
      const parts = displayName.split(',').map((p: string) => p.trim());
      const primaryTitle = parts[0] || q;
      const subParts = parts.slice(1, 4).filter(Boolean);
      const subtitle = subParts.join(', ') || 'Malaysia';

      const lower = displayName.toLowerCase();
      let cat: GeocodeLocation['category'] = 'address';
      if (/universiti|university|kolej|college|kampus|campus|sekolah|school/.test(lower)) {
        cat = 'campus';
      } else if (/hotel|resort|suites|inn|homestay|stay/.test(lower)) {
        cat = 'stay';
      } else if (/terminal|stesen|station|sentral|airport|lapangan terbang|ktm|lrt|mrt/.test(lower)) {
        cat = 'transit';
      } else if (/masjid|mosque|temple|kuil|church|gereja|museum|muzium/.test(lower)) {
        cat = 'landmark';
      }

      parsed.push({
        name: primaryTitle,
        subtitle,
        placeId: `nom-${item.osm_id || idx}-${Math.round(lat * 1000)}`,
        category: cat,
        coordinates: [lat, lon],
      });
    }

    nominatimCache.set(cacheKey, parsed);
    return parsed;
  } catch {
    return [];
  }
}

/**
 * Reverse geocodes coordinates (lat, lon) to a human-readable Malaysian address.
 * 100% Free of Charge (uses Mapbox if token present, or OpenStreetMap Nominatim).
 */
export async function reverseGeocode(
  lat: number,
  lon: number,
  signal?: AbortSignal
): Promise<{ primaryName: string; fullAddress: string } | null> {
  const token = getMapboxToken();

  // 1. Try Mapbox Reverse Geocoding if token provided
  if (token) {
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?country=my&limit=1&access_token=${token}`;
      const res = await fetch(url, { signal });
      if (res.ok) {
        const data = await res.json();
        const feat = data?.features?.[0];
        if (feat) {
          const parts = (feat.place_name || '').split(',').map((s: string) => s.trim());
          const primaryName = feat.text || parts[0] || 'Current Location';
          const fullAddress = feat.place_name || primaryName;
          return { primaryName, fullAddress };
        }
      }
    } catch {}
  }

  // 2. OpenStreetMap Reverse Geocoding (100% Free, no token needed)
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
    const res = await fetch(url, {
      signal,
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.display_name) {
        const parts = data.display_name.split(',').map((s: string) => s.trim());
        const primaryName = parts[0] || 'Current Location';
        const fullAddress = data.display_name;
        return { primaryName, fullAddress };
      }
    }
  } catch {}

  return null;
}

/**
 * Resolves any starting location query asynchronously, guaranteeing real coordinates.
 * Tries:
 * 1. Curated directory (instant match for UTeM, UPM, MMU, etc.)
 * 2. Live Nominatim geocoding
 * 3. Fallback coordinates
 */
export async function resolveStartingCoordinatesAsync(
  query: string,
  fallbackCoords?: [number, number]
): Promise<{ name: string; coordinates: [number, number]; placeId: string; category: string } | null> {
  const q = query.trim();
  if (!q) return null;

  // 1. Check curated directory
  const curated = searchCuratedDirectory(q);
  if (curated.length > 0) {
    return {
      name: curated[0].name,
      coordinates: curated[0].coordinates,
      placeId: curated[0].placeId,
      category: curated[0].category,
    };
  }

  // 2. Try Nominatim live geocode
  try {
    const live = await searchLiveNominatim(q);
    if (live.length > 0) {
      return {
        name: live[0].name,
        coordinates: live[0].coordinates,
        placeId: live[0].placeId,
        category: live[0].category,
      };
    }
  } catch {
    // Ignore and fallback
  }

  // 3. Fallback to provided coordinates if available
  if (fallbackCoords && !isNaN(fallbackCoords[0]) && !isNaN(fallbackCoords[1])) {
    return {
      name: q,
      coordinates: fallbackCoords,
      placeId: 'fallback-origin',
      category: 'landmark',
    };
  }

  return null;
}

/**
 * Metadata for Malaysian states including primary names, common town aliases,
 * geographic centers, and reasonable bounding radii (in km) from heritage cores.
 */
export const MALAYSIAN_STATES_META: Record<
  string,
  { name: string; aliases: string[]; maxRadiusKm: number; center: [number, number] }
> = {
  MLK: {
    name: 'Melaka',
    aliases: ['melaka', 'malacca', 'durian tunggal', 'ayer keroh', 'alor gajah', 'jasin', 'klebang', 'bandar hilir', 'merlimau', 'masjid tanah', 'utem'],
    maxRadiusKm: 45,
    center: [2.22, 102.25],
  },
  PNG: {
    name: 'Penang',
    aliases: ['penang', 'pulau pinang', 'george town', 'butterworth', 'bayan lepas', 'bukit mertajam', 'seberang perai', 'usm'],
    maxRadiusKm: 48,
    center: [5.41, 100.33],
  },
  KUL: {
    name: 'Kuala Lumpur',
    aliases: ['kuala lumpur', 'kl', 'bangsar', 'cheras', 'bukit bintang', 'setapak', 'kepong', 'kl sentral', 'brickfields', 'mont kiara', 'tbs'],
    maxRadiusKm: 30,
    center: [3.14, 101.69],
  },
  SGR: {
    name: 'Selangor',
    aliases: ['selangor', 'shah alam', 'petaling jaya', 'pj', 'subang jaya', 'subang', 'serdang', 'bangi', 'cyberjaya', 'sepang', 'klia', 'klang', 'kajang', 'rawang', 'gombak', 'puchong', 'sunway', 'upm', 'ukm'],
    maxRadiusKm: 95,
    center: [3.07, 101.52],
  },
  JHR: {
    name: 'Johor',
    aliases: ['johor', 'johor bahru', 'jb', 'skudai', 'muar', 'batu pahat', 'kluang', 'segamat', 'pontian', 'kota tinggi', 'mersing', 'iskandar puteri', 'utm'],
    maxRadiusKm: 160,
    center: [1.49, 103.74],
  },
  NSN: {
    name: 'Negeri Sembilan',
    aliases: ['negeri sembilan', 'n9', 'seremban', 'port dickson', 'nilai', 'rembau', 'kuala pilah', 'bahau'],
    maxRadiusKm: 75,
    center: [2.73, 101.94],
  },
  PRK: {
    name: 'Perak',
    aliases: ['perak', 'ipoh', 'taiping', 'teluk intan', 'kuala kangsar', 'kampar', 'lumut', 'manjung', 'batu gajah', 'utar kampar'],
    maxRadiusKm: 130,
    center: [4.59, 101.09],
  },
  KDH: {
    name: 'Kedah',
    aliases: ['kedah', 'alor setar', 'sungai petani', 'kulim', 'langkawi', 'jitra', 'baling'],
    maxRadiusKm: 110,
    center: [6.12, 100.37],
  },
  KTN: {
    name: 'Kelantan',
    aliases: ['kelantan', 'kota bharu', 'pasir mas', 'tumpat', 'tanah merah', 'machang', 'kuala krai', 'gua musang'],
    maxRadiusKm: 120,
    center: [6.13, 102.24],
  },
  TRG: {
    name: 'Terengganu',
    aliases: ['terengganu', 'kuala terengganu', 'cukai', 'kemaman', 'dungun', 'marang', 'besut', 'setiu'],
    maxRadiusKm: 130,
    center: [5.33, 103.14],
  },
  PHG: {
    name: 'Pahang',
    aliases: ['pahang', 'kuantan', 'temerloh', 'bentong', 'cameron highlands', 'pekan', 'raub', 'jerantut'],
    maxRadiusKm: 160,
    center: [3.81, 103.32],
  },
  PLS: {
    name: 'Perlis',
    aliases: ['perlis', 'kangar', 'arau', 'kuala perlis', 'padang besar'],
    maxRadiusKm: 35,
    center: [6.44, 100.20],
  },
  PJY: {
    name: 'Putrajaya',
    aliases: ['putrajaya'],
    maxRadiusKm: 20,
    center: [2.93, 101.69],
  },
  SBH: {
    name: 'Sabah',
    aliases: ['sabah', 'kota kinabalu', 'sandakan', 'tawau', 'keningau', 'lahad datu', 'kundasang'],
    maxRadiusKm: 250,
    center: [5.98, 116.07],
  },
  SWK: {
    name: 'Sarawak',
    aliases: ['sarawak', 'kuching', 'miri', 'sibu', 'bintulu', 'samarahan', 'sri aman'],
    maxRadiusKm: 350,
    center: [1.55, 110.36],
  },
  LBN: {
    name: 'Labuan',
    aliases: ['labuan', 'victoria'],
    maxRadiusKm: 20,
    center: [5.28, 115.24],
  },
};

export interface StateValidationResult {
  isOutsideState: boolean;
  destinationStateId: string;
  destinationStateName: string;
  locationName: string;
  detectedStateId?: string;
  detectedStateName?: string;
  distanceKm?: number;
}

function haversineSimple(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Checks whether a starting point location is within the intended destination state.
 * Returns detailed mismatch info if outside the state.
 */
export function checkStartingPointState(
  coords: [number, number] | undefined,
  locationName: string,
  destinationStateId: string,
  statePlaces?: Array<{ latitude?: number; longitude?: number }>
): StateValidationResult {
  const destMeta = MALAYSIAN_STATES_META[destinationStateId] || {
    name: destinationStateId,
    aliases: [],
    maxRadiusKm: 50,
    center: [2.2, 102.25] as [number, number],
  };

  const raw = locationName.trim();
  const q = raw.toLowerCase();

  // 1. Curated directory check
  const curated = searchCuratedDirectory(raw);
  let detectedStateId: string | undefined = curated[0]?.stateId;

  // 2. Check text aliases across all states if curated match didn't define stateId
  if (!detectedStateId) {
    for (const [sId, meta] of Object.entries(MALAYSIAN_STATES_META)) {
      if (meta.aliases.some((alias) => q.includes(alias))) {
        detectedStateId = sId;
        break;
      }
    }
  }

  // 3. Compute distance to destination state places or state center
  let distanceKm = 0;
  if (coords && !isNaN(coords[0]) && !isNaN(coords[1])) {
    const validPlaces = (statePlaces || []).filter((p) => p.latitude && p.longitude);
    if (validPlaces.length > 0) {
      let minDist = Infinity;
      for (const p of validPlaces) {
        const d = haversineSimple(coords[0], coords[1], p.latitude!, p.longitude!);
        if (d < minDist) minDist = d;
      }
      distanceKm = Math.round(minDist);
    } else {
      distanceKm = Math.round(
        haversineSimple(coords[0], coords[1], destMeta.center[0], destMeta.center[1])
      );
    }

    // If detectedStateId is still not determined and coords are outside dest state radius,
    // find the closest Malaysian state by distance to center
    if (!detectedStateId && distanceKm > destMeta.maxRadiusKm) {
      let minStateDist = Infinity;
      let closestId: string | undefined;
      for (const [sId, meta] of Object.entries(MALAYSIAN_STATES_META)) {
        const d = haversineSimple(coords[0], coords[1], meta.center[0], meta.center[1]);
        if (d < minStateDist) {
          minStateDist = d;
          closestId = sId;
        }
      }
      detectedStateId = closestId;
    }
  }

  const detectedMeta = detectedStateId ? MALAYSIAN_STATES_META[detectedStateId] : undefined;

  // Determine if it is outside state:
  // - If detectedStateId is known and doesn't match destination state
  // - Or if coordinate distance exceeds the state's maximum bounding radius
  const isOutside =
    (Boolean(detectedStateId) && detectedStateId !== destinationStateId) ||
    (distanceKm > destMeta.maxRadiusKm);

  return {
    isOutsideState: isOutside,
    destinationStateId,
    destinationStateName: destMeta.name,
    locationName: raw,
    detectedStateId,
    detectedStateName: detectedMeta?.name,
    distanceKm,
  };
}
