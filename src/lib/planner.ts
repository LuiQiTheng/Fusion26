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
} from './routing';

export interface PlannerOptions {
  destinationStateId: string;
  availableMinutes: number;
  interests: string[];
  transportMode: TransportMode;
  budgetLevel: BudgetLevel;
  startingPlaceId?: string;
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

/**
 * Re-estimates times when stops are reordered or removed, preserving
 * legitimate transit times between physical stops even when intangible stops intervene.
 */
export function recalculateItineraryStops(
  stops: ItineraryStop[],
  allPlaces: HeritagePlace[],
  mode: TransportMode
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
      typeof place.latitude === 'number' &&
      typeof place.longitude === 'number' &&
      !isNaN(place.latitude) &&
      !isNaN(place.longitude)
    );
    const visit = place?.visitDurationMinutes || stop.visitDurationMinutes || 45;

    let travel = 0;
    let status: RouteDataStatus = stop.routeDataStatus;

    if (i === 0) {
      travel = 0;
      status = isPhys ? 'real_service' : 'geographic_only';
    } else {
      if (isPhys && place) {
        if (lastPhysicalPlace) {
          const seg = estimateSegment(lastPhysicalPlace, place, mode);
          travel = seg.travelMinutes;
          status = seg.routeDataStatus;
        } else {
          travel = 0;
          status = 'geographic_only';
        }
      } else {
        // Intangible stop (regional food tasting, living craft, performance)
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

    updatedStops.push({
      ...stop,
      order: i + 1,
      visitDurationMinutes: visit,
      arrivalOffsetMinutes: currentOffset,
      travelFromPreviousMinutes: travel,
      routeDataStatus: status,
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

  const placeMap = new Map<string, HeritagePlace>(allPlaces.map((p) => [p.id, p]));
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

  const updatedStops = itinerary.stops.map((stop, i) => {
    let travel = stop.travelFromPreviousMinutes || 0;
    let status = stop.routeDataStatus;

    const physIdx = physicalStopIndices.indexOf(i);
    if (physIdx === 0) {
      travel = 0;
      status = result.isFallback ? 'estimated' : 'real_service';
    } else if (physIdx > 0) {
      const legIdx = physIdx - 1;
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

  const physicalStops = physicalIndices.map((idx) => stops[idx]);
  const n = physicalStops.length;

  // Build cost matrix if not provided
  let costMatrix: number[][] = [];
  if (
    externalCostMatrix &&
    externalCostMatrix.length === n &&
    externalCostMatrix[0] &&
    externalCostMatrix[0].length === n
  ) {
    costMatrix = externalCostMatrix;
  } else {
    costMatrix = Array.from({ length: n }, () => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          const p1 = placeMap.get(physicalStops[i].placeId);
          const p2 = placeMap.get(physicalStops[j].placeId);
          if (p1 && p2) {
            costMatrix[i][j] = estimateSegment(p1, p2, mode).distanceKm;
          }
        }
      }
    }
  }

  const evaluateRouteCost = (routeIndices: number[]) => {
    let cost = 0;
    for (let i = 0; i < routeIndices.length - 1; i++) {
      cost += costMatrix[routeIndices[i]][routeIndices[i + 1]];
    }
    return cost;
  };

  const initialIndices = Array.from({ length: n }, (_, i) => i);
  let bestIndices = [...initialIndices];
  let minCost = evaluateRouteCost(initialIndices);

  if (anchorFirstStop) {
    const remaining = initialIndices.slice(1);
    if (remaining.length <= 6) {
      const perms = getPermutations(remaining);
      for (const p of perms) {
        const candidate = [0, ...p];
        const cost = evaluateRouteCost(candidate);
        if (cost < minCost - 0.001) {
          minCost = cost;
          bestIndices = candidate;
        }
      }
    } else {
      // Nearest-neighbour starting from 0
      const unvisited = new Set(remaining);
      const tour = [0];
      let curr = 0;
      while (unvisited.size > 0) {
        let bestNext = -1;
        let bestNextCost = Infinity;
        for (const candidate of unvisited) {
          const c = costMatrix[curr][candidate];
          if (c < bestNextCost) {
            bestNextCost = c;
            bestNext = candidate;
          }
        }
        tour.push(bestNext);
        unvisited.delete(bestNext);
        curr = bestNext;
      }

      // 2-opt improvement on [1 .. n-1]
      let improved = true;
      let iterations = 0;
      while (improved && iterations < 50) {
        improved = false;
        iterations++;
        for (let i = 1; i < tour.length - 1; i++) {
          for (let k = i + 1; k < tour.length; k++) {
            const newTour = twoOptSwap(tour, i, k);
            const newCost = evaluateRouteCost(newTour);
            if (newCost < minCost - 0.001) {
              tour.splice(0, tour.length, ...newTour);
              minCost = newCost;
              improved = true;
            }
          }
        }
      }
      bestIndices = tour;
    }
  } else {
    if (n <= 6) {
      const perms = getPermutations(initialIndices);
      for (const p of perms) {
        const cost = evaluateRouteCost(p);
        if (cost < minCost - 0.001) {
          minCost = cost;
          bestIndices = p;
        }
      }
    } else {
      // Run NN from each node, then 2-opt
      for (let s = 0; s < n; s++) {
        const unvisited = new Set(initialIndices);
        unvisited.delete(s);
        const tour = [s];
        let curr = s;
        while (unvisited.size > 0) {
          let bestNext = -1;
          let bestNextCost = Infinity;
          for (const candidate of unvisited) {
            const c = costMatrix[curr][candidate];
            if (c < bestNextCost) {
              bestNextCost = c;
              bestNext = candidate;
            }
          }
          tour.push(bestNext);
          unvisited.delete(bestNext);
          curr = bestNext;
        }

        let improved = true;
        let iter = 0;
        while (improved && iter < 30) {
          improved = false;
          iter++;
          for (let i = 0; i < tour.length - 1; i++) {
            for (let k = i + 1; k < tour.length; k++) {
              const newTour = twoOptSwap(tour, i, k);
              const newCost = evaluateRouteCost(newTour);
              if (newCost < minCost - 0.001) {
                tour.splice(0, tour.length, ...newTour);
                minCost = newCost;
                improved = true;
              }
            }
          }
        }

        if (evaluateRouteCost(tour) < minCost - 0.001) {
          minCost = evaluateRouteCost(tour);
          bestIndices = tour;
        }
      }
    }
  }

  // Construct reordered physical stops
  const reorderedPhysical = bestIndices.map((idx) => physicalStops[idx]);

  // Slot the reordered physical stops back into original array positions
  const newStops = [...stops];
  physicalIndices.forEach((slotIdx, i) => {
    newStops[slotIdx] = reorderedPhysical[i];
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
            return dist >= 0.10;
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
    Boolean(startingPlaceId)
  );

  // Recalculate arrival offsets, travel minutes, and totals accurately
  const recalculation = recalculateItineraryStops(optimizedStops, allPlaces, transportMode);

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
  };
}

