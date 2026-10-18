import { HeritagePlace, RouteDataStatus, TransportMode, TimeWindow, ItineraryStop } from '../types';

/**
 * Calculates straight line distance (Haversine formula) in kilometers
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
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
 * Determines whether physical heritage monuments in a state form a compact walkable district (<= 4.0 km spread)
 */
export function isCompactDistrict(places: HeritagePlace[], stateId: string): boolean {
  const physical = places.filter(
    (p) =>
      p.stateId === stateId &&
      typeof p.latitude === 'number' &&
      typeof p.longitude === 'number' &&
      !isNaN(p.latitude) &&
      !isNaN(p.longitude)
  );

  if (physical.length <= 1) return true; // Single site / local center

  let maxDist = 0;
  for (let i = 0; i < physical.length; i++) {
    for (let j = i + 1; j < physical.length; j++) {
      const d = calculateHaversineDistanceKm(
        physical[i].latitude!,
        physical[i].longitude!,
        physical[j].latitude!,
        physical[j].longitude!
      );
      if (d > maxDist) maxDist = d;
    }
  }

  return maxDist <= 4.0;
}

/**
 * Returns sensible default transport mode based on geographic dispersion of attractions
 */
export function getDefaultTransportMode(places: HeritagePlace[], stateId: string): TransportMode {
  return isCompactDistrict(places, stateId) ? 'walking' : 'car';
}

export interface RouteSegmentEstimate {
  distanceKm: number;
  travelMinutes: number;
  routeDataStatus: RouteDataStatus;
  statusLabel: string;
  explanation: string;
}

/**
 * Estimates travel duration between two heritage places
 */
export function estimateSegment(
  from: HeritagePlace,
  to: HeritagePlace,
  mode: TransportMode = 'walking'
): RouteSegmentEstimate {
  if (
    from.latitude === undefined ||
    from.longitude === undefined ||
    to.latitude === undefined ||
    to.longitude === undefined
  ) {
    return {
      distanceKm: 0,
      travelMinutes: 0,
      routeDataStatus: 'geographic_only',
      statusLabel: 'Cultural Experience Context',
      explanation: 'Intangible cultural heritage (regional food/practice). No road transit required.',
    };
  }

  const directKm = calculateHaversineDistanceKm(
    from.latitude,
    from.longitude,
    to.latitude,
    to.longitude
  );

  // Urban street network winding coefficient (1.2x for pedestrian footpaths, 1.35x for vehicular roads)
  const streetDistanceKm = mode === 'walking' ? directKm * 1.2 : directKm * 1.35;

  let assumedSpeedKmh = 4.5; // Walking speed
  let routeStatus: RouteDataStatus = 'estimated';
  let explanation = '';

  switch (mode) {
    case 'walking':
      assumedSpeedKmh = 4.5;
      routeStatus = 'estimated';
      explanation = `Estimated walking time at 4.5 km/h pedestrian pace based on geographic proximity.`;
      break;
    case 'car':
      assumedSpeedKmh = 25.0; // Historic city center / regional traffic
      routeStatus = 'estimated';
      explanation = `Estimated road travel time based on 25 km/h traffic with 1.35x road factor.`;
      break;
    case 'public_transport':
      assumedSpeedKmh = 14.0;
      routeStatus = 'simulated';
      explanation = `Simulated transit estimate (14 km/h + 8 min wait headway). Real-time schedule API not integrated.`;
      break;
    case 'mixed':
      assumedSpeedKmh = 7.0;
      routeStatus = 'estimated';
      explanation = `Combined cycling/pedestrian and localized transport estimate.`;
      break;
  }

  let travelMinutes = Math.ceil((streetDistanceKm / assumedSpeedKmh) * 60);

  // If public transport, add transit wait time
  if (mode === 'public_transport') {
    travelMinutes += 8;
  }

  // Minimum buffer: 2 min for walking, 3 min for driving
  travelMinutes = Math.max(mode === 'walking' ? 2 : 3, travelMinutes);

  return {
    distanceKm: Number(streetDistanceKm.toFixed(2)),
    travelMinutes,
    routeDataStatus: routeStatus,
    statusLabel:
      routeStatus === 'estimated'
        ? 'Estimated Travel Time'
        : routeStatus === 'simulated'
        ? 'Simulated Transit Model'
        : 'Geographic Approximation',
    explanation,
  };
}

export interface Waypoint {
  latitude: number;
  longitude: number;
}

export interface RouteLeg {
  distanceKm: number;
  durationMinutes: number;
}

export interface OSRMRouteResult {
  coordinates: [number, number][]; // [lat, lng] for Leaflet
  distanceKm: number;
  durationMinutes: number;
  routeDataStatus: RouteDataStatus;
  isFallback: boolean;
  statusMessage: string;
  legs: RouteLeg[];
}

export interface OSRMTableResult {
  durations: number[][]; // in seconds
  distances: number[][]; // in meters
}

/**
 * Fetches pairwise distance and duration matrix for driving mode using OSRM Table Service
 */
export async function fetchOSRMDrivingTable(
  waypoints: Waypoint[]
): Promise<OSRMTableResult | null> {
  const validPoints = waypoints.filter(
    (pt) =>
      typeof pt.latitude === 'number' &&
      typeof pt.longitude === 'number' &&
      !isNaN(pt.latitude) &&
      !isNaN(pt.longitude)
  );

  if (validPoints.length < 2) return null;

  const coordString = validPoints
    .map((pt) => `${pt.longitude.toFixed(6)},${pt.latitude.toFixed(6)}`)
    .join(';');

  const url = `https://router.project-osrm.org/table/v1/driving/${coordString}?annotations=distance,duration`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = await response.json();
    if (data.code === 'Ok' && data.durations && data.distances) {
      return {
        durations: data.durations,
        distances: data.distances,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetches actual road network route from OSRM Route Service (driving)
 * Or calculates honest geographic pedestrian corridor estimates (walking)
 */
export async function fetchOSRMRoute(
  waypoints: Waypoint[],
  mode: TransportMode = 'walking'
): Promise<OSRMRouteResult> {
  const validPoints = waypoints.filter(
    (pt) =>
      typeof pt.latitude === 'number' &&
      typeof pt.longitude === 'number' &&
      !isNaN(pt.latitude) &&
      !isNaN(pt.longitude) &&
      pt.latitude >= -90 &&
      pt.latitude <= 90 &&
      pt.longitude >= -180 &&
      pt.longitude <= 180
  );

  if (validPoints.length < 2) {
    return {
      coordinates: validPoints.map((p) => [p.latitude, p.longitude]),
      distanceKm: 0,
      durationMinutes: 0,
      routeDataStatus: 'geographic_only',
      isFallback: true,
      statusMessage:
        validPoints.length === 1
          ? 'Single location selected; route calculation requires at least two points.'
          : 'No valid coordinates available for routing.',
      legs: [],
    };
  }

  // Deduplicate consecutive points that are at identical or virtually identical locations (<100m)
  const distinctPoints: Waypoint[] = [];
  for (const pt of validPoints) {
    if (distinctPoints.length === 0) {
      distinctPoints.push(pt);
    } else {
      const prev = distinctPoints[distinctPoints.length - 1];
      const dist = calculateHaversineDistanceKm(
        prev.latitude,
        prev.longitude,
        pt.latitude,
        pt.longitude
      );
      if (dist >= 0.10) {
        distinctPoints.push(pt);
      }
    }
  }

  if (distinctPoints.length < 2) {
    return {
      coordinates: validPoints.map((p) => [p.latitude, p.longitude]),
      distanceKm: 0,
      durationMinutes: 0,
      routeDataStatus: 'geographic_only',
      isFallback: true,
      statusMessage:
        'Selected stops are at virtually the same location (<100m); road routing requires distinct geographic destinations.',
      legs: [],
    };
  }

  // WALKING MODE: Calculate honest pedestrian heritage corridor estimates
  if (mode === 'walking') {
    const speedKmh = 4.5;
    const legs: RouteLeg[] = [];
    let totalDirectKm = 0;
    for (let i = 0; i < distinctPoints.length - 1; i++) {
      const direct = calculateHaversineDistanceKm(
        distinctPoints[i].latitude,
        distinctPoints[i].longitude,
        distinctPoints[i + 1].latitude,
        distinctPoints[i + 1].longitude
      );
      totalDirectKm += direct;
      const legDist = Number((direct * 1.2).toFixed(2));
      const legDur = Math.max(2, Math.ceil((legDist / speedKmh) * 60));
      legs.push({ distanceKm: legDist, durationMinutes: legDur });
    }
    const totalDistKm = Number((totalDirectKm * 1.2).toFixed(2));
    const totalDurMin = legs.reduce((s, l) => s + l.durationMinutes, 0);

    return {
      coordinates: distinctPoints.map((p) => [p.latitude, p.longitude]),
      distanceKm: totalDistKm,
      durationMinutes: totalDurMin,
      routeDataStatus: 'estimated',
      isFallback: true,
      statusMessage: `Pedestrian walking corridor estimate (${totalDistKm} km, ~${totalDurMin} mins at 4.5 km/h)`,
      legs,
    };
  }

  // DRIVING / VEHICULAR MODE: Use real OSRM driving profile
  const profile = mode === 'mixed' ? 'bike' : 'driving';

  // OSRM coordinates specification: {lon1},{lat1};{lon2},{lat2}
  const coordString = distinctPoints
    .map((pt) => `${pt.longitude.toFixed(6)},${pt.latitude.toFixed(6)}`)
    .join(';');

  const url = `https://router.project-osrm.org/route/v1/${profile}/${coordString}?overview=full&geometries=geojson&steps=false`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OSRM HTTP error: ${response.status}`);
    }

    const data = await response.json();

    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const primaryRoute = data.routes[0];
      // Invert GeoJSON [longitude, latitude] to Leaflet [latitude, longitude]
      const leafletCoords: [number, number][] = primaryRoute.geometry.coordinates.map(
        ([lon, lat]: [number, number]) => [lat, lon]
      );

      const legs: RouteLeg[] = (primaryRoute.legs || []).map((leg: any) => {
        const distKm = Number((leg.distance / 1000).toFixed(2));
        let durMin = Math.round(leg.duration / 60);
        if (mode === 'mixed') {
          durMin = Math.max(1, Math.ceil((distKm / 12) * 60));
        } else if (mode === 'public_transport') {
          durMin = Math.max(3, Math.round(leg.duration / 60) + 8);
        } else {
          durMin = Math.max(1, Math.round(leg.duration / 60));
        }
        return {
          distanceKm: distKm,
          durationMinutes: durMin,
        };
      });

      const distanceKm = Number((primaryRoute.distance / 1000).toFixed(2));
      if (distanceKm === 0) {
        return {
          coordinates: leafletCoords,
          distanceKm: 0,
          durationMinutes: 0,
          routeDataStatus: 'geographic_only',
          isFallback: true,
          statusMessage: 'Waypoints are too close to compute a road route.',
          legs: [],
        };
      }

      const totalDur = legs.reduce((sum, l) => sum + l.durationMinutes, 0);
      let durationMinutes =
        totalDur > 0 ? totalDur : Math.max(1, Math.round(primaryRoute.duration / 60));

      if (mode === 'public_transport' && legs.length === 0) {
        durationMinutes += 8 * (distinctPoints.length - 1);
      }

      let resolvedStatus: RouteDataStatus = 'real_service';
      let statusMessage = `OSRM Driving Route (${distanceKm} km, ~${durationMinutes} mins)`;

      if (mode === 'public_transport') {
        resolvedStatus = 'simulated';
        statusMessage = `Simulated Transit Model (${distanceKm} km, ~${durationMinutes} mins)`;
      } else if (mode === 'mixed') {
        resolvedStatus = 'estimated';
        statusMessage = `Mixed Route Estimate (${distanceKm} km, ~${durationMinutes} mins)`;
      }

      return {
        coordinates: leafletCoords,
        distanceKm,
        durationMinutes,
        routeDataStatus: resolvedStatus,
        isFallback: false,
        statusMessage,
        legs,
      };
    } else {
      throw new Error(`OSRM returned code: ${data.code || 'unknown'}`);
    }
  } catch (err: any) {
    // Graceful fallback to Haversine straight-line approximation if OSRM service is unavailable
    const fallbackLegs: RouteLeg[] = [];
    let totalDirectKm = 0;
    const speed =
      mode === 'car' ? 22 : mode === 'public_transport' ? 14 : mode === 'mixed' ? 7 : 4.5;

    for (let i = 0; i < distinctPoints.length - 1; i++) {
      const direct = calculateHaversineDistanceKm(
        distinctPoints[i].latitude,
        distinctPoints[i].longitude,
        distinctPoints[i + 1].latitude,
        distinctPoints[i + 1].longitude
      );
      totalDirectKm += direct;
      const legKm = Number((direct * 1.35).toFixed(2));
      let legMin = Math.max(2, Math.ceil((legKm / speed) * 60));
      if (mode === 'public_transport') legMin += 8;
      fallbackLegs.push({ distanceKm: legKm, durationMinutes: legMin });
    }

    const streetKm = Number((totalDirectKm * 1.35).toFixed(2));
    let fallbackMinutes = fallbackLegs.reduce((sum, l) => sum + l.durationMinutes, 0);
    if (fallbackMinutes === 0) {
      fallbackMinutes = Math.max(3, Math.ceil((streetKm / speed) * 60));
      if (mode === 'public_transport') fallbackMinutes += 8;
    }

    return {
      coordinates: distinctPoints.map((p) => [p.latitude, p.longitude]),
      distanceKm: streetKm,
      durationMinutes: fallbackMinutes,
      routeDataStatus: 'estimated',
      isFallback: true,
      statusMessage: `Estimated path (${streetKm} km) via Haversine calculation (OSRM offline or fallback).`,
      legs: fallbackLegs,
    };
  }
}

/**
 * Checks whether two places qualify as an adjacent leg inside a dense heritage zone
 * where eco-friendly options (Pedestrian Walk) should be prioritized.
 */
export function isHeritageZoneLeg(from?: HeritagePlace, to?: HeritagePlace): boolean {
  if (!from || !to) return false;
  if (
    typeof from.latitude !== 'number' ||
    typeof from.longitude !== 'number' ||
    typeof to.latitude !== 'number' ||
    typeof to.longitude !== 'number'
  ) {
    return false;
  }
  const dist = calculateHaversineDistanceKm(from.latitude, from.longitude, to.latitude, to.longitude);
  if (dist > 1.5) return false;

  const isHeritageLocality =
    from.stateId === 'MLK' ||
    to.stateId === 'MLK' ||
    from.stateId === 'PNG' ||
    to.stateId === 'PNG' ||
    (from.locality && /melaka|jonker|bandar hilir|george town|penang/i.test(from.locality)) ||
    (to.locality && /melaka|jonker|bandar hilir|george town|penang/i.test(to.locality));

  return Boolean(isHeritageLocality);
}

/**
 * Converts cumulative offset minutes from a start time (default 09:00 AM) to a formatted 12-hour ETA string.
 */
export function formatOffsetToTime(startTime: string = '09:00', offsetMinutes: number): string {
  const parts = startTime.split(':').map((s) => parseInt(s, 10));
  const baseHour = isNaN(parts[0]) ? 9 : parts[0];
  const baseMin = isNaN(parts[1]) ? 0 : parts[1];

  const totalMin = baseHour * 60 + baseMin + offsetMinutes;
  const wrappedMin = totalMin % (24 * 60);
  const hour24 = Math.floor(wrappedMin / 60);
  const mins = wrappedMin % 60;

  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const minStr = mins < 10 ? `0${mins}` : `${mins}`;

  return `${hour12}:${minStr} ${period}`;
}

/**
 * Generates dynamic contextual triggers based on ETA (e.g. sunset golden hour photography trigger).
 */
export function getContextualTriggerForETA(
  place: HeritagePlace,
  etaTime: string,
  offsetMinutes: number,
  startTime: string = '09:00'
): string | undefined {
  const parts = startTime.split(':').map((s) => parseInt(s, 10));
  const baseHour = isNaN(parts[0]) ? 9 : parts[0];
  const baseMin = isNaN(parts[1]) ? 0 : parts[1];
  const totalMin = (baseHour * 60 + baseMin + offsetMinutes) % (24 * 60);
  const hourDec = totalMin / 60; // 18.5 = 6:30 PM

  const text = `${place.name} ${place.shortDescription || ''} ${(place.culturalThemes || []).join(' ')} ${(place.categories || []).join(' ')}`.toLowerCase();
  const isScenicOrWaterfront =
    text.includes('mosque') ||
    text.includes('river') ||
    text.includes('straits') ||
    text.includes('waterfront') ||
    text.includes('hill') ||
    text.includes('bridge') ||
    text.includes('scenic') ||
    text.includes('sunset') ||
    text.includes('panoramic') ||
    text.includes('sea');

  // Sunset trigger: 5:45 PM to 7:15 PM (17.75 - 19.25)
  if (hourDec >= 17.75 && hourDec <= 19.25) {
    if (isScenicOrWaterfront) {
      return `🌅 Estimated arrival (${etaTime}) aligns with sunset—perfect for silhouette photography & golden hour reflections.`;
    }
    return `🌅 Estimated arrival (${etaTime}) aligns with sunset—perfect for golden hour photography.`;
  }

  // Morning light: 8:30 AM to 10:30 AM
  if (hourDec >= 8.5 && hourDec <= 10.5) {
    return `☀️ Cool morning breeze & gentle daylight—ideal for relaxed outdoor exploration.`;
  }

  // Midday heat shelter: 12:00 PM to 2:30 PM
  if (hourDec >= 12.0 && hourDec <= 14.5) {
    const isIndoor =
      text.includes('museum') ||
      text.includes('gallery') ||
      text.includes('hall') ||
      text.includes('food') ||
      text.includes('restaurant');
    if (isIndoor) {
      return `🏛️ Midday climate shelter: Indoor air-conditioned galleries during peak tropical heat.`;
    }
  }

  // Evening / Night atmosphere: 7:30 PM onwards
  if (hourDec >= 19.5 && hourDec <= 22.5) {
    return `🏮 Vibrant evening illumination & bustling night heritage atmosphere.`;
  }

  return undefined;
}

/**
 * Infers human-intuitive soft time windows (Morning, Afternoon, Night, Anytime)
 * without hard-limiting operating hours.
 */
export function inferTimeWindow(place: HeritagePlace): TimeWindow {
  if (place.preferredTimeWindow) return place.preferredTimeWindow;
  const idLower = place.id.toLowerCase();
  const nameLower = place.name.toLowerCase();
  const text = `${place.name} ${place.shortDescription || ''} ${place.openingHoursText || ''} ${(place.culturalThemes || []).join(' ')}`.toLowerCase();
  if (
    idLower.includes('jonker') ||
    nameLower.includes('jonker') ||
    text.includes('night market') ||
    text.includes('pasar malam') ||
    text.includes('night') ||
    text.includes('pasar') ||
    text.includes('dinner') ||
    text.includes('evening') ||
    text.includes('6 pm - 11 pm')
  ) {
    return 'night';
  }
  if (text.includes('breakfast') || text.includes('morning') || text.includes('sunrise') || text.includes('hill')) {
    return 'morning';
  }
  if (text.includes('museum') || text.includes('indoor') || text.includes('gallery')) {
    return 'afternoon';
  }
  return 'anytime';
}

/**
 * Local Recalculation: Recalculates ONLY adjacent travel segments and cumulative ETAs
 * when stops are reordered via drag-and-drop or updated via modals.
 * Executes in O(N) synchronously with zero network lag.
 */
export function recalculateItineraryLocally(
  stops: ItineraryStop[],
  allPlaces: HeritagePlace[],
  defaultMode: TransportMode,
  startTime: string = '09:00'
): {
  updatedStops: ItineraryStop[];
  totalVisitMinutes: number;
  totalTravelMinutes: number;
  totalPlannedMinutes: number;
} {
  const placeMap = new Map<string, HeritagePlace>(allPlaces.map((p) => [p.id, p]));
  let currentOffset = 0;
  let totalVisit = 0;
  let totalTravel = 0;

  const updatedStops: ItineraryStop[] = [];
  let lastPhysicalPlace: HeritagePlace | null = null;

  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i];
    const place = placeMap.get(stop.placeId);
    const isPhys = Boolean(
      place &&
      place.type !== 'food' &&
      typeof place.latitude === 'number' &&
      typeof place.longitude === 'number' &&
      !isNaN(place.latitude) &&
      !isNaN(place.longitude)
    );
    const visit = place?.visitDurationMinutes || stop.visitDurationMinutes || 45;

    let travel = 0;
    let status: RouteDataStatus = stop.routeDataStatus;
    const modeForSegment = stop.segmentTransportMode || defaultMode;

    if (i === 0) {
      travel = 0;
      status = isPhys ? 'real_service' : 'geographic_only';
    } else {
      if (isPhys && place) {
        if (lastPhysicalPlace) {
          const seg = estimateSegment(lastPhysicalPlace, place, modeForSegment);
          travel = seg.travelMinutes;
          status = seg.routeDataStatus;
        } else {
          travel = 0;
          status = 'geographic_only';
        }
      } else {
        travel = 0;
        status = 'geographic_only';
      }
    }

    if (isPhys && place) {
      lastPhysicalPlace = place;
    }

    currentOffset += travel;
    totalTravel += travel;
    totalVisit += visit;

    const arrivalOffset = currentOffset;
    const etaTime = formatOffsetToTime(startTime, arrivalOffset);
    const contextualTrigger = place ? getContextualTriggerForETA(place, etaTime, arrivalOffset, startTime) : undefined;
    const timeWin = stop.preferredTimeWindow || (place ? inferTimeWindow(place) : 'anytime');

    updatedStops.push({
      ...stop,
      order: i + 1,
      visitDurationMinutes: visit,
      arrivalOffsetMinutes: arrivalOffset,
      travelFromPreviousMinutes: travel,
      routeDataStatus: status,
      preferredTimeWindow: timeWin,
      etaTime,
      contextualTrigger,
    });

    currentOffset += visit;
  }

  return {
    updatedStops,
    totalVisitMinutes: totalVisit,
    totalTravelMinutes: totalTravel,
    totalPlannedMinutes: totalVisit + totalTravel,
  };
}

/**
 * Computes a multi-mode pairwise distance (km) and duration (minutes) matrix
 * across an array of heritage places without relying on Euclidean straight lines.
 */
export async function fetchMultiModeMatrix(
  places: HeritagePlace[],
  mode: TransportMode = 'walking'
): Promise<{ distances: number[][]; durations: number[][] }> {
  const n = places.length;
  const distances: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  const durations: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

  if (mode === 'car' && n >= 2 && n <= 10) {
    const waypoints: Waypoint[] = places.map((p) => ({
      latitude: p.latitude || 0,
      longitude: p.longitude || 0,
    }));
    const osrmTable = await fetchOSRMDrivingTable(waypoints);
    if (osrmTable && osrmTable.durations && osrmTable.distances) {
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          distances[i][j] = Number((osrmTable.distances[i][j] / 1000).toFixed(2));
          durations[i][j] = Math.ceil(osrmTable.durations[i][j] / 60);
        }
      }
      return { distances, durations };
    }
  }

  // Realistic network winding factor fallback for walking, transit, and car
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        const seg = estimateSegment(places[i], places[j], mode);
        distances[i][j] = seg.distanceKm;
        durations[i][j] = seg.travelMinutes;
      }
    }
  }

  return { distances, durations };
}

/**
 * Lightweight TSP solver using Nearest-Neighbor (greedy) algorithm + 2-Opt tour optimization,
 * anchored from a user-defined starting point / hotel to eliminate backtracking loops.
 */
export function solveNearestNeighborTSP(
  places: HeritagePlace[],
  startPlaceId?: string,
  mode: TransportMode = 'walking'
): HeritagePlace[] {
  if (places.length <= 2) return places;

  const valid = places.filter(
    (p) =>
      typeof p.latitude === 'number' &&
      typeof p.longitude === 'number' &&
      !isNaN(p.latitude) &&
      !isNaN(p.longitude)
  );
  const intangibles = places.filter((p) => !valid.includes(p));

  if (valid.length <= 2) return places;

  const n = valid.length;
  // Build exact pairwise distance matrix in km using street network factors
  const distMatrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        distMatrix[i][j] = estimateSegment(valid[i], valid[j], mode).distanceKm;
      }
    }
  }

  // Anchor to user-defined start place (or first place)
  let startIdx = 0;
  if (startPlaceId) {
    const foundIdx = valid.findIndex((p) => p.id === startPlaceId);
    if (foundIdx !== -1) startIdx = foundIdx;
  }

  // For small counts (N <= 8), evaluate exact permutations starting from startIdx (fast: < 2ms)
  const remainingIndices: number[] = [];
  for (let i = 0; i < n; i++) {
    if (i !== startIdx) remainingIndices.push(i);
  }

  const evaluateCost = (indices: number[]) => {
    let cost = 0;
    for (let i = 0; i < indices.length - 1; i++) {
      cost += distMatrix[indices[i]][indices[i + 1]];
    }
    return cost;
  };

  let bestTour: number[] = [];

  if (remainingIndices.length <= 6) {
    // Exact permutation evaluation
    const getPerms = <T>(arr: T[]): T[][] => {
      if (arr.length <= 1) return [arr];
      const res: T[][] = [];
      for (let i = 0; i < arr.length; i++) {
        const curr = arr[i];
        const rem = arr.slice(0, i).concat(arr.slice(i + 1));
        const sub = getPerms(rem);
        for (const s of sub) res.push([curr, ...s]);
      }
      return res;
    };

    let minCost = Infinity;
    const perms = getPerms(remainingIndices);
    for (const p of perms) {
      const candidate = [startIdx, ...p];
      const cost = evaluateCost(candidate);
      if (cost < minCost) {
        minCost = cost;
        bestTour = candidate;
      }
    }
  } else {
    // Nearest-Neighbor greedy construction starting at startIdx
    const unvisited = new Set(remainingIndices);
    bestTour = [startIdx];
    let curr = startIdx;

    while (unvisited.size > 0) {
      let nearestIdx = -1;
      let minDistance = Infinity;

      for (const candidate of unvisited) {
        const d = distMatrix[curr][candidate];
        if (d < minDistance) {
          minDistance = d;
          nearestIdx = candidate;
        }
      }

      if (nearestIdx !== -1) {
        bestTour.push(nearestIdx);
        unvisited.delete(nearestIdx);
        curr = nearestIdx;
      } else {
        break;
      }
    }

    // 2-Opt improvement pass on [1 .. n-1] to untangle crossing paths while anchoring startIdx
    let minCost = evaluateCost(bestTour);
    let improved = true;
    let iterations = 0;

    while (improved && iterations < 60) {
      improved = false;
      iterations++;
      for (let i = 1; i < bestTour.length - 1; i++) {
        for (let k = i + 1; k < bestTour.length; k++) {
          const candidate = [
            ...bestTour.slice(0, i),
            ...bestTour.slice(i, k + 1).reverse(),
            ...bestTour.slice(k + 1),
          ];
          const cost = evaluateCost(candidate);
          if (cost < minCost - 0.001) {
            minCost = cost;
            bestTour = candidate;
            improved = true;
          }
        }
      }
    }
  }

  const sortedPhysical = bestTour.map((i) => valid[i]);
  return [...sortedPhysical, ...intangibles];
}

/**
 * Soft Time Windows TSP Optimizer:
 * Respects user's starting point, prevents artificial fragmentation of adjacent heritage clusters,
 * arranges places using 2-Opt TSP to eliminate backtracking, and sequences evening activities appropriately.
 */
export function solveSoftTimeWindowTSP(
  places: HeritagePlace[],
  startPlaceId?: string,
  mode: TransportMode = 'walking'
): {
  sortedPlaces: HeritagePlace[];
  xaiRationale: string;
} {
  if (places.length <= 2) {
    return {
      sortedPlaces: places,
      xaiRationale: '💡 Route sequence maintained with minimal transitions between attractions.',
    };
  }

  // Separate genuine evening/night events (e.g. Jonker Walk, night markets) from daytime heritage monuments
  const daytimePlaces: HeritagePlace[] = [];
  const nightPlaces: HeritagePlace[] = [];

  places.forEach((p) => {
    if (!p) return;
    // If the user explicitly designated this place as their starting anchor, it always stays at the start!
    if (startPlaceId && p.id === startPlaceId) {
      daytimePlaces.push(p);
      return;
    }

    const idLower = p.id.toLowerCase();
    const nameLower = p.name.toLowerCase();
    const descLower = (p.shortDescription || '').toLowerCase();
    const hoursLower = (p.openingHoursText || '').toLowerCase();

    const isNightOnly =
      (p.preferredTimeWindow === 'night' ||
        idLower.includes('jonker') ||
        nameLower.includes('jonker') ||
        nameLower.includes('night market') ||
        nameLower.includes('pasar malam') ||
        descLower.includes('night market') ||
        descLower.includes('pasar malam') ||
        hoursLower.includes('night market') ||
        hoursLower.includes('6 pm - 11 pm') ||
        hoursLower.includes('evening') ||
        nameLower.includes('night')) &&
      !nameLower.includes('a famosa') &&
      !nameLower.includes('church') &&
      !nameLower.includes('stadthuys') &&
      !nameLower.includes('palace') &&
      !nameLower.includes('museum') &&
      !nameLower.includes('temple') &&
      !nameLower.includes('mosque');

    if (isNightOnly) {
      nightPlaces.push(p);
    } else {
      daytimePlaces.push(p);
    }
  });

  // Optimize daytime places using 2-Opt TSP anchored from the user's starting point
  const sortedDaytime = solveNearestNeighborTSP(daytimePlaces, startPlaceId, mode);

  // If there are night places, optimize them anchored from the last daytime stop
  let sortedNight: HeritagePlace[] = [];
  if (nightPlaces.length > 0) {
    const lastDayStop = sortedDaytime[sortedDaytime.length - 1];
    sortedNight = solveNearestNeighborTSP(nightPlaces, lastDayStop?.id, mode);
  }

  const result = [...sortedDaytime, ...sortedNight];
  const startName = places.find((p) => p.id === startPlaceId)?.name || places[0]?.name || 'chosen origin';
  const nightNames = nightPlaces.map((p) => p.name).join(', ');
  const rationale = `💡 AI Optimization Reasoning: Sequenced starting from ${startName} via 2-Opt TSP. Daytime heritage monuments & museums are clustered contiguously to eliminate backtracking (saving walking distance), with evening highlights (${nightPlaces.length > 0 ? nightNames : 'night markets'}) scheduled as the final destination when street activity, night markets, and lantern illumination peak.`;

  return {
    sortedPlaces: result.length > 0 ? result : places,
    xaiRationale: rationale,
  };
}
