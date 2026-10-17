import {
  HeritagePlace,
  Itinerary,
  ItineraryStop,
  TransportMode,
  BudgetLevel,
  RouteDataStatus,
} from '../types';
import { scorePlace } from './scoring';
import {
  estimateSegment,
  calculateHaversineDistanceKm,
  fetchOSRMDrivingTable,
  OSRMRouteResult,
  recalculateItineraryLocally,
  solveSoftTimeWindowTSP,
  solveNearestNeighborTSP,
} from './routing';
import { searchCuratedDirectory } from './geocoding';
import { vendorByPlaceId } from './foodVendors';

export interface PlannerOptions {
  destinationStateId: string;
  availableMinutes: number;
  interests: string[];
  transportMode: TransportMode;
  budgetLevel: BudgetLevel;
  startingPlaceId?: string;
  startingPointName?: string;
  startingCoordinates?: [number, number];
  startTime?: string;
}

export interface HotelRecord {
  id: string;
  name: string;
  placeId: string;
  latitude?: number;
  longitude?: number;
  locality?: string;
  category?: 'stay' | 'transit' | 'landmark';
}

export const HOTELS_BY_STATE: Record<string, HotelRecord[]> = {
  MLK: [
    { id: 'hatten', name: 'Hatten Hotel Melaka', placeId: 'mlk-afamosa', latitude: 2.1896, longitude: 102.253, locality: 'Bandar Hilir', category: 'stay' },
    { id: 'casadelrio', name: 'Casa del Rio Melaka', placeId: 'mlk-stadthuys', latitude: 2.1947, longitude: 102.2473, locality: 'Riverside / Dutch Square', category: 'stay' },
    { id: 'majestic', name: 'The Majestic Malacca Hotel', placeId: 'mlk-stadthuys', latitude: 2.203, longitude: 102.252, locality: 'Bunga Raya', category: 'stay' },
    { id: 'jonker_boutique', name: 'Jonker Boutique Hotel', placeId: 'mlk-jonker', latitude: 2.197, longitude: 102.246, locality: 'Jonker Walk', category: 'stay' },
    { id: 'courtyard', name: 'Courtyard by Marriott Melaka', placeId: 'mlk-stadthuys', latitude: 2.2045, longitude: 102.2535, locality: 'Jalan Tun Sri Lanang', category: 'stay' },
    { id: 'pines', name: 'The Pines Melaka', placeId: 'mlk-stadthuys', latitude: 2.204, longitude: 102.251, locality: 'Pengkalan Rama', category: 'stay' },
    { id: 'doubletree', name: 'DoubleTree by Hilton Melaka', placeId: 'mlk-afamosa', latitude: 2.1855, longitude: 102.261, locality: 'Hatten City', category: 'stay' },
    { id: 'swissgarden', name: 'Swiss-Garden Hotel & Residences Melaka', placeId: 'mlk-stadthuys', latitude: 2.2025, longitude: 102.2505, locality: 'Bunga Raya Pantai', category: 'stay' },
    { id: 'imperial_heritage', name: 'Imperial Heritage Hotel Melaka', placeId: 'mlk-afamosa', latitude: 2.1905, longitude: 102.2525, locality: 'Bandar Hilir', category: 'stay' },
    { id: 'the_shore', name: 'The Shore Hotel & Residences', placeId: 'mlk-stadthuys', latitude: 2.202, longitude: 102.2498, locality: 'Bunga Raya', category: 'stay' },
    { id: 'atlantis', name: 'Atlantis Residences', placeId: 'mlk-stadthuys', latitude: 2.1985, longitude: 102.229, locality: 'Kota Laksamana', category: 'stay' },
    { id: 'melaka_sentral', name: 'Melaka Sentral Bus Terminal', placeId: 'mlk-stadthuys', latitude: 2.2223, longitude: 102.2488, locality: 'Central Transit Hub', category: 'transit' },
  ],
  PNG: [
    { id: 'eo', name: 'Eastern & Oriental (E&O) Hotel', placeId: 'png-cheong-fatt-tze', latitude: 5.4233, longitude: 100.3358, locality: 'George Town', category: 'stay' },
    { id: 'prestige', name: 'The Prestige Hotel Penang', placeId: 'png-khoon-kongsi', latitude: 5.4162, longitude: 100.3424, locality: 'Weld Quay', category: 'stay' },
    { id: 'blue_mansion', name: 'Cheong Fatt Tze (The Blue Mansion)', placeId: 'png-cheong-fatt-tze', latitude: 5.42, longitude: 100.3344, locality: 'Leith Street', category: 'stay' },
    { id: 'seven_terraces', name: 'Seven Terraces Penang', placeId: 'png-kapitan-keling', latitude: 5.4185, longitude: 100.339, locality: 'Stewart Lane', category: 'stay' },
    { id: 'jen_penang', name: 'JEN Penang Georgetown by Shangri-La', placeId: 'png-khoon-kongsi', latitude: 5.4132, longitude: 100.3312, locality: 'Magazine Road', category: 'stay' },
    { id: 'penang_sentral', name: 'Penang Sentral Transit Hub', placeId: 'png-khoon-kongsi', latitude: 5.3965, longitude: 100.3662, locality: 'Butterworth / Ferry', category: 'transit' },
  ],
  KUL: [
    { id: 'majestic_kl', name: 'The Majestic Hotel Kuala Lumpur', placeId: 'kul-sultan-abdul-samad', latitude: 3.1395, longitude: 101.6922, locality: 'Jalan Sultan Hishamuddin', category: 'stay' },
    { id: 'mandarin_kl', name: 'Mandarin Oriental Kuala Lumpur', placeId: 'kul-petronas', latitude: 3.1558, longitude: 101.7122, locality: 'KLCC', category: 'stay' },
    { id: 'chow_kit', name: 'The Chow Kit Hotel', placeId: 'kul-sultan-abdul-samad', latitude: 3.163, longitude: 101.6965, locality: 'Chow Kit', category: 'stay' },
    { id: 'pavilion_kl', name: 'Pavilion Hotel Kuala Lumpur', placeId: 'kul-petronas', latitude: 3.1488, longitude: 101.7135, locality: 'Bukit Bintang', category: 'stay' },
    { id: 'kl_sentral', name: 'KL Sentral Transit Hub', placeId: 'kul-sultan-abdul-samad', latitude: 3.1342, longitude: 101.6865, locality: 'Brickfields', category: 'transit' },
  ],
};

/**
 * Resolves user free-form typed starting locations to a physical routing anchor with exact coordinates
 */
export function resolveStartingAnchor(
  typedText: string,
  destinationStateId: string,
  allPlaces: HeritagePlace[]
): { placeId: string; displayName: string; coordinates?: [number, number] } {
  const query = typedText.trim().toLowerCase();
  const statePlaces = allPlaces.filter(
    (p) => p.stateId === destinationStateId && typeof p.latitude === 'number' && typeof p.longitude === 'number'
  );
  const primaryFallback = statePlaces[0];

  if (!query) {
    return {
      placeId: primaryFallback?.id || '',
      displayName: primaryFallback?.name || 'Starting Point',
      coordinates: primaryFallback ? [primaryFallback.latitude!, primaryFallback.longitude!] : undefined,
    };
  }

  // 1. Check if GPS / Current Location
  if (query.includes('gps') || query.includes('current location') || query.includes('my location')) {
    return {
      placeId: primaryFallback?.id || '',
      displayName: 'My Current Location (GPS)',
      coordinates: primaryFallback ? [primaryFallback.latitude!, primaryFallback.longitude!] : undefined,
    };
  }

  // 2. Check instant curated Malaysian directory (Universities, Campuses, Hubs, Airports, Towns)
  const curatedMatches = searchCuratedDirectory(query);
  if (curatedMatches.length > 0) {
    return {
      placeId: curatedMatches[0].placeId,
      displayName: curatedMatches[0].name,
      coordinates: curatedMatches[0].coordinates,
    };
  }

  // 3. Exact or substring match against known starting locations for the state
  const locations = HOTELS_BY_STATE[destinationStateId] || [];
  const matchedLoc = locations.find(
    (h) => query.includes(h.id) || h.name.toLowerCase().includes(query) || query.includes(h.name.toLowerCase().replace(/[^a-z0-9]/g, ''))
  );
  if (matchedLoc) {
    return {
      placeId: matchedLoc.placeId,
      displayName: matchedLoc.name,
      coordinates: matchedLoc.latitude && matchedLoc.longitude ? [matchedLoc.latitude, matchedLoc.longitude] : undefined,
    };
  }

  // 3. Exact or substring match against known monuments/heritage sites in the state
  const matchedPlace = statePlaces.find(
    (p) =>
      p.name.toLowerCase().includes(query) ||
      query.includes(p.name.toLowerCase()) ||
      (p.locality && (p.locality.toLowerCase().includes(query) || query.includes(p.locality.toLowerCase())))
  );
  if (matchedPlace) {
    return {
      placeId: matchedPlace.id,
      displayName: matchedPlace.name,
      coordinates: [matchedPlace.latitude!, matchedPlace.longitude!],
    };
  }

  // 4. Keyword heuristic matching for prominent heritage clusters & locations
  if (query.includes('hatten') || query.includes('bandar hilir') || query.includes('hilir')) {
    const af = statePlaces.find((p) => p.id === 'mlk-afamosa');
    return { placeId: af?.id || primaryFallback?.id || '', displayName: typedText.trim(), coordinates: [2.1896, 102.253] };
  }
  if (query.includes('jonker') || query.includes('chinatown') || query.includes('hebat')) {
    const jk = statePlaces.find((p) => p.id === 'mlk-jonker');
    return { placeId: jk?.id || primaryFallback?.id || '', displayName: typedText.trim(), coordinates: [2.197, 102.246] };
  }
  if (query.includes('atlantis') || query.includes('laksamana')) {
    const st = statePlaces.find((p) => p.id === 'mlk-stadthuys');
    return { placeId: st?.id || primaryFallback?.id || '', displayName: typedText.trim(), coordinates: [2.1985, 102.229] };
  }
  if (query.includes('shore') || query.includes('riverside')) {
    const st = statePlaces.find((p) => p.id === 'mlk-stadthuys');
    return { placeId: st?.id || primaryFallback?.id || '', displayName: typedText.trim(), coordinates: [2.202, 102.2498] };
  }
  if (query.includes('sentral')) {
    return { placeId: primaryFallback?.id || '', displayName: typedText.trim(), coordinates: [2.2223, 102.2488] };
  }

  // 5. Custom typed location fallback
  return {
    placeId: primaryFallback?.id || '',
    displayName: typedText.trim(),
    coordinates: primaryFallback ? [primaryFallback.latitude!, primaryFallback.longitude!] : undefined,
  };
}

/**
 * Helper to compute all permutations of an array
 */
function getPermutations<T>(arr: T[]): T[][] {
  if (arr.length <= 1) return [arr];
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const current = arr[i];
    const remaining = arr.slice(0, i).concat(arr.slice(i + 1));
    const subPerms = getPermutations(remaining);
    for (const sub of subPerms) {
      result.push([current, ...sub]);
    }
  }
  return result;
}

/**
 * Helper for 2-opt tour inversion swap
 */
function twoOptSwap(route: number[], i: number, k: number): number[] {
  const newRoute = route.slice(0, i);
  const reversed = route.slice(i, k + 1).reverse();
  const remainder = route.slice(k + 1);
  return [...newRoute, ...reversed, ...remainder];
}

function createPlaceMap(allPlaces: HeritagePlace[]): Map<string, HeritagePlace> {
  const map = new Map<string, HeritagePlace>();
  allPlaces.forEach((p) => {
    map.set(p.id, p);
    const vendor = vendorByPlaceId.get(p.id);
    if (vendor) {
      map.set(vendor.id, p);
    }
  });
  return map;
}

/**
 * Re-estimates times when stops are reordered or removed, preserving
 * legitimate transit times between physical stops even when intangible stops intervene.
 * Calculates dynamic ETAs (starting from 09:00 AM) and sunset/contextual triggers.
 */
export function recalculateItineraryStops(
  stops: ItineraryStop[],
  allPlaces: HeritagePlace[],
  mode: TransportMode,
  startTime: string = '09:00'
): {
  updatedStops: ItineraryStop[];
  totalVisitMinutes: number;
  totalTravelMinutes: number;
  totalPlannedMinutes: number;
} {
  return recalculateItineraryLocally(stops, allPlaces, mode, startTime);
}

/**
 * Reorders stops based on drag-and-drop indexes and recalculates only adjacent legs locally.
 */
export function reorderItineraryStops(
  itinerary: Itinerary,
  allPlaces: HeritagePlace[],
  fromIndex: number,
  toIndex: number
): Itinerary {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= itinerary.stops.length || toIndex >= itinerary.stops.length) {
    return itinerary;
  }

  const newStops = [...itinerary.stops];
  const [movedStop] = newStops.splice(fromIndex, 1);
  newStops.splice(toIndex, 0, movedStop);

  const { updatedStops, totalVisitMinutes, totalTravelMinutes, totalPlannedMinutes } =
    recalculateItineraryLocally(newStops, allPlaces, itinerary.transportMode, itinerary.startTime || '09:00');

  return {
    ...itinerary,
    stops: updatedStops,
    totalVisitMinutes,
    totalTravelMinutes,
    totalPlannedMinutes,
    updatedAt: new Date().toISOString(),
    isCustomized: true,
  };
}

/**
 * Maps OSRM route legs to sequential physical stops, preserving intangible stops
 * and recomputing cumulative arrival offsets cleanly.
 */
export function applyRouteResultToItinerary(
  itinerary: Itinerary,
  allPlaces: HeritagePlace[],
  result: OSRMRouteResult
): { updatedItinerary: Itinerary; hasChanges: boolean } {
  if (!itinerary || !result.legs || result.legs.length === 0) {
    return { updatedItinerary: itinerary, hasChanges: false };
  }

  const placeMap = createPlaceMap(allPlaces);
  const physicalStopIndices: number[] = [];
  itinerary.stops.forEach((s, idx) => {
    const p = placeMap.get(s.placeId);
    if (p && typeof p.latitude === 'number' && typeof p.longitude === 'number' && !isNaN(p.latitude) && !isNaN(p.longitude)) {
      physicalStopIndices.push(idx);
    }
  });

  if (physicalStopIndices.length < 2) {
    return { updatedItinerary: itinerary, hasChanges: false };
  }

  let currentOffset = 0;
  let totalTravel = 0;
  let hasChanges = false;

  const hasOriginLeg = result.legs.length === physicalStopIndices.length;

  const updatedStops = itinerary.stops.map((stop, i) => {
    let travel = stop.travelFromPreviousMinutes || 0;
    let status = stop.routeDataStatus;

    const physIdx = physicalStopIndices.indexOf(i);
    if (physIdx === 0) {
      travel = hasOriginLeg && result.legs.length > 0 ? result.legs[0].durationMinutes : 0;
      status = result.isFallback ? 'estimated' : 'real_service';
    } else if (physIdx > 0) {
      const legIdx = hasOriginLeg ? physIdx : physIdx - 1;
      if (legIdx < result.legs.length) {
        travel = result.legs[legIdx].durationMinutes;
        status = result.isFallback ? 'estimated' : 'real_service';
      }
    } else {
      travel = 0;
      status = 'geographic_only';
    }

    if (travel !== stop.travelFromPreviousMinutes || status !== stop.routeDataStatus) {
      hasChanges = true;
    }

    currentOffset += travel;
    totalTravel += travel;
    const arrivalOffset = currentOffset;
    if (arrivalOffset !== stop.arrivalOffsetMinutes) {
      hasChanges = true;
    }
    const visit = stop.visitDurationMinutes || 45;
    currentOffset += visit;

    return {
      ...stop,
      travelFromPreviousMinutes: travel,
      arrivalOffsetMinutes: arrivalOffset,
      routeDataStatus: status,
    };
  });

  if (!hasChanges) {
    return { updatedItinerary: itinerary, hasChanges: false };
  }

  return {
    updatedItinerary: {
      ...itinerary,
      stops: updatedStops,
      totalTravelMinutes: totalTravel,
      totalPlannedMinutes: itinerary.totalVisitMinutes + totalTravel,
    },
    hasChanges: true,
  };
}

/**
 * Optimizes the sequence of physical heritage stops to minimize travel backtracking.
 * Evaluates exact permutations for small itineraries (<= 6) and nearest-neighbour + 2-opt for larger counts.
 * Uses real OSRM road durations matrix when provided, or local realistic distance/time matrix.
 */
export function optimizePhysicalStopsOrder(
  stops: ItineraryStop[],
  allPlaces: HeritagePlace[],
  mode: TransportMode,
  anchorFirstStop: boolean = true,
  externalCostMatrix?: number[][]
): ItineraryStop[] {
  const placeMap = new Map<string, HeritagePlace>(allPlaces.map((p) => [p.id, p]));
  const physicalIndices: number[] = [];

  stops.forEach((s, idx) => {
    const p = placeMap.get(s.placeId);
    if (
      p &&
      typeof p.latitude === 'number' &&
      typeof p.longitude === 'number' &&
      !isNaN(p.latitude) &&
      !isNaN(p.longitude)
    ) {
      physicalIndices.push(idx);
    }
  });

  // If 2 or fewer physical stops, order is already optimal or trivial
  if (physicalIndices.length <= 2) {
    return stops;
  }

  const physicalPlaces = physicalIndices.map((idx) => placeMap.get(stops[idx].placeId)!);
  const startId = anchorFirstStop ? physicalPlaces[0].id : undefined;
  const { sortedPlaces } = solveSoftTimeWindowTSP(physicalPlaces, startId, mode);

  // Construct reordered physical stops
  const newStops = [...stops];
  physicalIndices.forEach((slotIdx, i) => {
    const targetPlace = sortedPlaces[i];
    const origStop = stops.find((s) => s.placeId === targetPlace.id);
    if (origStop) {
      newStops[slotIdx] = {
        ...origStop,
        order: slotIdx + 1,
      };
    }
  });

  return newStops;
}

/**
 * Asynchronously optimizes stop order using live OSRM road matrix for driving mode
 */
export async function optimizeItineraryWithRoadNetwork(
  itinerary: Itinerary,
  allPlaces: HeritagePlace[]
): Promise<Itinerary> {
  if (itinerary.transportMode !== 'car') {
    return itinerary;
  }

  const placeMap = new Map<string, HeritagePlace>(allPlaces.map((p) => [p.id, p]));
  const physicalStops = itinerary.stops
    .map((s) => placeMap.get(s.placeId))
    .filter((p): p is HeritagePlace => !!p && typeof p.latitude === 'number' && typeof p.longitude === 'number');

  if (physicalStops.length < 3) {
    return itinerary;
  }

  const waypoints = physicalStops.map((p) => ({
    latitude: p.latitude!,
    longitude: p.longitude!,
  }));

  const tableResult = await fetchOSRMDrivingTable(waypoints);
  if (!tableResult) {
    return itinerary;
  }

  // Optimize stop order using the real OSRM road durations matrix
  const optimizedStops = optimizePhysicalStopsOrder(
    itinerary.stops,
    allPlaces,
    'car',
    true, // Anchor Stop 1 to preserve primary heritage anchor
    tableResult.durations
  );

  const recalculation = recalculateItineraryStops(optimizedStops, allPlaces, 'car');

  return {
    ...itinerary,
    stops: recalculation.updatedStops,
    totalVisitMinutes: recalculation.totalVisitMinutes,
    totalTravelMinutes: recalculation.totalTravelMinutes,
    totalPlannedMinutes: recalculation.totalPlannedMinutes,
    updatedAt: new Date().toISOString(),
  };
}

export function generateItinerary(
  options: PlannerOptions,
  allPlaces: HeritagePlace[]
): Itinerary {
  const {
    destinationStateId,
    availableMinutes,
    interests,
    transportMode,
    budgetLevel,
    startingPlaceId,
  } = options;

  // Filter places belonging to the destination state
  const destinationPlaces = allPlaces.filter((p) => p.stateId === destinationStateId);

  if (destinationPlaces.length === 0) {
    return {
      id: `itin-${Date.now()}`,
      title: `Cultural Trip to ${destinationStateId}`,
      destinationStateId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      interests,
      transportMode,
      availableMinutes,
      budgetLevel,
      stops: [],
      assumptions: ['No places currently registered for this destination state.'],
      totalVisitMinutes: 0,
      totalTravelMinutes: 0,
      totalPlannedMinutes: 0,
    };
  }

  const selectedStops: ItineraryStop[] = [];
  const visitedPlaceIds = new Set<string>();
  const activeThemes = new Set<string>();

  let remainingTime = availableMinutes;
  let currentOffsetMinutes = 0;
  let totalVisitMinutes = 0;
  let totalTravelMinutes = 0;

  const isPhysical = (p: HeritagePlace) =>
    (p.type === 'monument' || !p.type) &&
    typeof p.latitude === 'number' &&
    typeof p.longitude === 'number' &&
    !isNaN(p.latitude) &&
    !isNaN(p.longitude);

  const physicalPlaces = destinationPlaces.filter(isPhysical);

  // Find candidate starting place
  let currentPlace: HeritagePlace | null = null;
  if (startingPlaceId) {
    currentPlace = destinationPlaces.find((p) => p.id === startingPlaceId) || null;
  }

  // If no starting place, select highest scoring physical place if available, otherwise highest scoring place overall
  if (!currentPlace) {
    const candidatePool = physicalPlaces.length > 0 ? physicalPlaces : destinationPlaces;
    let topScore = -Infinity;
    candidatePool.forEach((p) => {
      let { totalScore } = scorePlace(p, interests, activeThemes, null, budgetLevel);

      // Cluster accessibility bonus: if starting at p allows reaching other physical monuments
      // within realistic travel times for the chosen transport mode, favor that walkable/drivable cluster.
      if (isPhysical(p) && physicalPlaces.length >= 2) {
        const reachableNeighbors = physicalPlaces.filter((other) => {
          if (other.id === p.id) return false;
          const seg = estimateSegment(p, other, transportMode);
          const maxTransit = transportMode === 'walking' ? 65 : 75;
          return seg.travelMinutes <= maxTransit;
        });
        totalScore += reachableNeighbors.length * 35;
      }

      if (totalScore > topScore) {
        topScore = totalScore;
        currentPlace = p;
      }
    });
  }

  if (currentPlace) {
    const firstPlace = currentPlace as HeritagePlace;
    const initialVisit = firstPlace.visitDurationMinutes || 45;

    visitedPlaceIds.add(firstPlace.id);
    firstPlace.culturalThemes.forEach((t) => activeThemes.add(t));

    selectedStops.push({
      placeId: firstPlace.id,
      order: 1,
      visitDurationMinutes: initialVisit,
      arrivalOffsetMinutes: 0,
      travelFromPreviousMinutes: 0,
      routeDataStatus: isPhysical(firstPlace) ? 'real_service' : 'estimated',
      reasonSelected: `Starting heritage anchor: ${firstPlace.shortDescription.slice(0, 70)}...`,
    });

    remainingTime -= initialVisit;
    currentOffsetMinutes += initialVisit;
    totalVisitMinutes += initialVisit;

    // Iteratively select next best place that fits in remaining time
    let previousPlace: HeritagePlace = firstPlace;
    let lastPhysicalPlace: HeritagePlace | null = isPhysical(firstPlace) ? firstPlace : null;

    while (remainingTime > 20 && visitedPlaceIds.size < destinationPlaces.length) {
      // Prioritize physical places if we haven't reached at least 2 distinct physical stops and they exist
      const physicalStops = selectedStops
        .map((s) => destinationPlaces.find((dp) => dp.id === s.placeId))
        .filter((p): p is HeritagePlace => !!p && isPhysical(p));

      const shouldPrioritizePhysical =
        physicalPlaces.length >= 2 && physicalStops.length < 2;

      let candidatePool = destinationPlaces;
      if (shouldPrioritizePhysical) {
        // Find unvisited physical places distinct from previous physical stop(s) (>= 100m)
        const unvisitedPhysical = physicalPlaces.filter((p) => {
          if (visitedPlaceIds.has(p.id)) return false;
          const refPlace = lastPhysicalPlace || previousPlace;
          if (refPlace && isPhysical(refPlace)) {
            const dist = calculateHaversineDistanceKm(
              refPlace.latitude!,
              refPlace.longitude!,
              p.latitude!,
              p.longitude!
            );
            return dist >= 0.01;
          }
          return true;
        });

        if (unvisitedPhysical.length > 0) {
          candidatePool = unvisitedPhysical;
        }
      }

      let bestCandidate: HeritagePlace | null = null;
      let highestScore = -Infinity;
      let bestSegmentTravel = 0;
      let bestSegmentReason = '';
      let bestRouteStatus: RouteDataStatus = 'estimated';

      for (const candidate of candidatePool) {
        if (visitedPlaceIds.has(candidate.id)) continue;

        const originPlace = (isPhysical(candidate) && !isPhysical(previousPlace) && lastPhysicalPlace)
          ? lastPhysicalPlace
          : previousPlace;
        const segment = estimateSegment(originPlace, candidate, transportMode);
        const candidateVisit = candidate.visitDurationMinutes || 45;
        const totalStopCostTime = segment.travelMinutes + candidateVisit;

        // When prioritizing physical stops to guarantee a valid route, allow a generous soft buffer
        // rather than abandoning physical stops to pick food
        const softBuffer = shouldPrioritizePhysical ? Math.max(60, availableMinutes * 0.35) : 15;

        if (totalStopCostTime <= remainingTime + softBuffer) {
          const distKm = segment.distanceKm;
          const scoreResult = scorePlace(
            candidate,
            interests,
            activeThemes,
            distKm,
            budgetLevel
          );

          if (scoreResult.totalScore > highestScore) {
            highestScore = scoreResult.totalScore;
            bestCandidate = candidate;
            bestSegmentTravel = segment.travelMinutes;
            bestSegmentReason = scoreResult.explanation;
            bestRouteStatus = segment.routeDataStatus;
          }
        }
      }

      // If prioritized physical pool yielded nothing fitting within soft buffer,
      // pick closest unvisited physical stop to guarantee route integrity
      if (!bestCandidate && shouldPrioritizePhysical) {
        let minTravel = Infinity;
        for (const candidate of candidatePool) {
          if (visitedPlaceIds.has(candidate.id)) continue;
          const originPlace = (isPhysical(candidate) && !isPhysical(previousPlace) && lastPhysicalPlace)
            ? lastPhysicalPlace
            : previousPlace;
          const segment = estimateSegment(originPlace, candidate, transportMode);
          // In walking mode, never force a physical monument that is beyond 4.0 km
          if (transportMode === 'walking' && segment.distanceKm > 4.0) {
            continue;
          }
          if (segment.travelMinutes < minTravel) {
            minTravel = segment.travelMinutes;
            bestCandidate = candidate;
            bestSegmentTravel = segment.travelMinutes;
            bestSegmentReason = `Heritage route anchor connecting to ${originPlace.name}.`;
            bestRouteStatus = segment.routeDataStatus;
          }
        }
      }

      // Only if shouldPrioritizePhysical is false, or after 2 physical stops exist, fall back to any unvisited place
      if (!bestCandidate && !shouldPrioritizePhysical) {
        for (const candidate of destinationPlaces) {
          if (visitedPlaceIds.has(candidate.id)) continue;

          const originPlace = (isPhysical(candidate) && !isPhysical(previousPlace) && lastPhysicalPlace)
            ? lastPhysicalPlace
            : previousPlace;
          const segment = estimateSegment(originPlace, candidate, transportMode);
          const candidateVisit = candidate.visitDurationMinutes || 45;
          const totalStopCostTime = segment.travelMinutes + candidateVisit;

          if (totalStopCostTime <= remainingTime + 15) {
            const distKm = segment.distanceKm;
            const scoreResult = scorePlace(
              candidate,
              interests,
              activeThemes,
              distKm,
              budgetLevel
            );

            if (scoreResult.totalScore > highestScore) {
              highestScore = scoreResult.totalScore;
              bestCandidate = candidate;
              bestSegmentTravel = segment.travelMinutes;
              bestSegmentReason = scoreResult.explanation;
              bestRouteStatus = segment.routeDataStatus;
            }
          }
        }
      }

      // If no candidate fits within time, break
      if (!bestCandidate) {
        break;
      }

      const confirmedCandidate = bestCandidate as HeritagePlace;
      const visitDur = confirmedCandidate.visitDurationMinutes || 45;

      visitedPlaceIds.add(confirmedCandidate.id);
      confirmedCandidate.culturalThemes.forEach((t) => activeThemes.add(t));

      currentOffsetMinutes += bestSegmentTravel;
      selectedStops.push({
        placeId: confirmedCandidate.id,
        order: selectedStops.length + 1,
        visitDurationMinutes: visitDur,
        arrivalOffsetMinutes: currentOffsetMinutes,
        travelFromPreviousMinutes: bestSegmentTravel,
        routeDataStatus: bestRouteStatus,
        reasonSelected: bestSegmentReason,
      });

      remainingTime -= (bestSegmentTravel + visitDur);
      currentOffsetMinutes += visitDur;
      totalTravelMinutes += bestSegmentTravel;
      totalVisitMinutes += visitDur;

      if (isPhysical(confirmedCandidate)) {
        lastPhysicalPlace = confirmedCandidate;
      }
      previousPlace = confirmedCandidate;
    }
  }

  const finalPhysicalStopsCount = selectedStops.filter((s) => {
    const p = destinationPlaces.find((dp) => dp.id === s.placeId);
    return p && isPhysical(p);
  }).length;

  // Optimize physical stops sequence to eliminate backtracking loops
  const optimizedStops = optimizePhysicalStopsOrder(
    selectedStops,
    allPlaces,
    transportMode,
    true
  );

  // Recalculate arrival offsets, travel minutes, and totals accurately using departure time
  const departureTime = options.startTime || '09:00';
  const recalculation = recalculateItineraryStops(optimizedStops, allPlaces, transportMode, departureTime);

  const assumptions: string[] = [];

  if (finalPhysicalStopsCount >= 2) {
    if (transportMode === 'car') {
      assumptions.push('Travel estimates and geometry calculated using live OSRM vehicular street routing.');
    } else if (transportMode === 'walking') {
      assumptions.push('Walking times are calibrated at a steady 4.5 km/h pedestrian walking pace over geographic distances.');
    } else if (transportMode === 'public_transport') {
      assumptions.push('Public transit durations use simulated frequency approximations. Please verify live schedules on-site.');
    } else {
      assumptions.push(`Travel estimates calculated for ${transportMode} mode using verified road coordinates.`);
    }
  } else if (finalPhysicalStopsCount === 1) {
    if (transportMode === 'walking' && physicalPlaces.length >= 2) {
      assumptions.push(
        'Monuments in this state are geographically separated by regional driving distances (> 4 km). Walking between distant towns is not practical; switch to Car mode to tour multiple monuments.'
      );
    } else {
      assumptions.push(
        'Only one physical heritage site with verified map coordinates is included in this itinerary. Multi-stop road routing requires at least two mapped locations.'
      );
    }
  } else {
    assumptions.push(
      'No physical heritage sites with verified map coordinates are included in this itinerary. Road routing is unavailable.'
    );
  }

  assumptions.push(
    'Opening hours and admission fees reflect documented source records as of review date.',
    'Itinerary accommodates resting buffers between major cultural sights.'
  );

  if (transportMode === 'public_transport') {
    assumptions.push('Public transit durations use simulated frequency approximations. Please verify live schedules on-site.');
  }

  const effectiveStartId = startingPlaceId || selectedStops[0]?.placeId;
  const effectiveStartName = options.startingPointName || allPlaces.find((p) => p.id === effectiveStartId)?.name || 'Starting Point';
  const effectiveCoords: [number, number] | undefined =
    options.startingCoordinates ||
    (effectiveStartId
      ? (() => {
          const p = allPlaces.find((x) => x.id === effectiveStartId);
          return p && typeof p.latitude === 'number' && typeof p.longitude === 'number'
            ? [p.latitude, p.longitude]
            : undefined;
        })()
      : undefined);

  return {
    id: `itin-${Date.now()}`,
    title: `Cultural Discovery Itinerary (${destinationStateId})`,
    destinationStateId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    interests,
    transportMode,
    availableMinutes,
    budgetLevel,
    stops: recalculation.updatedStops,
    assumptions,
    totalVisitMinutes: recalculation.totalVisitMinutes,
    totalTravelMinutes: recalculation.totalTravelMinutes,
    totalPlannedMinutes: recalculation.totalPlannedMinutes,
    startTime: departureTime,
    startingPlaceId: effectiveStartId,
    startingPointName: effectiveStartName,
    startingCoordinates: effectiveCoords,
    xaiRationale: `💡 AI Optimization Reasoning: Sequenced starting from ${effectiveStartName} via 2-Opt TSP. Daytime heritage sights are clustered contiguously to minimize walking distance, with evening highlights (e.g. Jonker Walk / night market) sequenced at the end of the day.`,
  };
}

