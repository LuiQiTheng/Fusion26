import { HeritagePlace, RouteDataStatus, TransportMode } from '../types';

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

  // WALKING MODE: Calculate honest approximate walking distance and duration from geographic distances.
  // The public OSRM server only provides a driving vehicular graph and does not serve real pedestrian footpaths.
  // We do NOT draw a driving-road loop on one-way streets and pretend it is a pedestrian path.
  if (mode === 'walking') {
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
      const legDur = Math.max(2, Math.ceil((legDist / 4.5) * 60));
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
