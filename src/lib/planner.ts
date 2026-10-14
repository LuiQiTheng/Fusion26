import {
  HeritagePlace,
  Itinerary,
  ItineraryStop,
  TransportMode,
  BudgetLevel,
  RouteDataStatus,
} from '../types';
import { scorePlace } from './scoring';
import { estimateSegment } from './routing';

export interface PlannerOptions {
  destinationStateId: string;
  availableMinutes: number;
  interests: string[];
  transportMode: TransportMode;
  budgetLevel: BudgetLevel;
  startingPlaceId?: string;
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

  // Find candidate starting place
  let currentPlace: HeritagePlace | null = null;
  if (startingPlaceId) {
    currentPlace = destinationPlaces.find((p) => p.id === startingPlaceId) || null;
  }

  // If no starting place, select highest scoring place overall
  if (!currentPlace) {
    let topScore = -1;
    destinationPlaces.forEach((p) => {
      const { totalScore } = scorePlace(p, interests, activeThemes, null, budgetLevel);
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
      routeDataStatus: 'estimated',
      reasonSelected: `Starting heritage anchor: ${firstPlace.shortDescription.slice(0, 70)}...`,
    });

    remainingTime -= initialVisit;
    currentOffsetMinutes += initialVisit;
    totalVisitMinutes += initialVisit;

    // Iteratively select next best place that fits in remaining time
    let previousPlace: HeritagePlace = firstPlace;

    while (remainingTime > 25 && visitedPlaceIds.size < destinationPlaces.length) {
      let bestCandidate: HeritagePlace | null = null;
      let highestScore = -Infinity;
      let bestSegmentTravel = 0;
      let bestSegmentReason = '';
      let bestRouteStatus: RouteDataStatus = 'estimated';

      for (const candidate of destinationPlaces) {
        if (visitedPlaceIds.has(candidate.id)) continue;

        const segment = estimateSegment(previousPlace, candidate, transportMode);
        const candidateVisit = candidate.visitDurationMinutes || 45;
        const totalStopCostTime = segment.travelMinutes + candidateVisit;

        // Check if candidate fits in remaining time budget
        if (totalStopCostTime <= remainingTime + 15) { // allow 15m soft buffer
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

      previousPlace = confirmedCandidate;
    }
  }

  const assumptions: string[] = [
    `Travel estimates calculated for ${transportMode} mode using verified coordinates and city street factor.`,
    'Opening hours and admission fees reflect documented source records as of review date.',
    'Itinerary accommodates resting buffers between major cultural sights.',
  ];

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
    stops: selectedStops,
    assumptions,
    totalVisitMinutes,
    totalTravelMinutes,
    totalPlannedMinutes: totalVisitMinutes + totalTravelMinutes,
  };
}

/**
 * Re-estimates times when stops are reordered or removed
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

  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i];
    const place = placeMap.get(stop.placeId);
    const visit = place?.visitDurationMinutes || stop.visitDurationMinutes || 45;

    let travel = 0;
    let status = stop.routeDataStatus;

    if (i > 0) {
      const prevStop = stops[i - 1];
      const prevPlace = placeMap.get(prevStop.placeId);
      if (prevPlace && place) {
        const seg = estimateSegment(prevPlace, place, mode);
        travel = seg.travelMinutes;
        status = seg.routeDataStatus;
      } else {
        travel = 15;
      }
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
