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
      travelMinutes: 15,
      routeDataStatus: 'geographic_only',
      statusLabel: 'Geographic Context Only',
      explanation: 'Exact coordinates unavailable for one or both stops. Using baseline buffer.',
    };
  }

  const directKm = calculateHaversineDistanceKm(
    from.latitude,
    from.longitude,
    to.latitude,
    to.longitude
  );

  // Urban street network winding coefficient (approx 1.35x direct straight-line)
  const streetDistanceKm = directKm * 1.35;

  let assumedSpeedKmh = 4.5; // Walking speed
  let routeStatus: RouteDataStatus = 'estimated';
  let explanation = '';

  switch (mode) {
    case 'walking':
      assumedSpeedKmh = 4.5;
      routeStatus = 'estimated';
      explanation = `Calculated using 4.5 km/h pedestrian pace with 1.35x urban street factor.`;
      break;
    case 'car':
      assumedSpeedKmh = 22.0; // Historic city center traffic
      routeStatus = 'estimated';
      explanation = `Calculated using 22 km/h average heritage city center traffic with 1.35x road factor.`;
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

  // Minimum 3 min travel buffer
  travelMinutes = Math.max(3, travelMinutes);

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
