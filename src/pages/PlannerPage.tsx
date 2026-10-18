import React, { useState, useCallback, useMemo } from 'react';
import { StateRecord, HeritagePlace, Itinerary } from '../types';
import { PlannerForm } from '../components/planner/PlannerForm';
import { ItineraryTimeline } from '../components/planner/ItineraryTimeline';
import { InteractiveMap } from '../components/map/InteractiveMap';
import {
  PlannerOptions,
  generateItinerary,
  recalculateItineraryStops,
  applyRouteResultToItinerary,
  optimizeItineraryWithRoadNetwork,
} from '../lib/planner';
import { OSRMRouteResult } from '../lib/routing';
import { saveItinerary } from '../lib/persistence';
import { getEnrichedPlacesWithFoodVendors, isFoodVendorStopId } from '../lib/foodVendors';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface PlannerPageProps {
  states: StateRecord[];
  places: HeritagePlace[];
  currentItinerary: Itinerary | null;
  onUpdateItinerary: (itinerary: Itinerary | null) => void;
  onSelectPlace: (place: HeritagePlace) => void;
  onInspectItineraryAI: (itinerary: Itinerary) => void;
}

export const PlannerPage: React.FC<PlannerPageProps> = ({
  states,
  places,
  currentItinerary,
  onUpdateItinerary,
  onSelectPlace,
  onInspectItineraryAI,
}) => {
  const [isSavedLocally, setIsSavedLocally] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  // Combined places array including all verified traditional food vendors
  const allPlacesWithFoodVendors = useMemo(() => {
    return getEnrichedPlacesWithFoodVendors(places);
  }, [places]);

  // Generate Itinerary Handler
  const handleGenerate = (options: PlannerOptions) => {
    const newItin = generateItinerary(options, allPlacesWithFoodVendors);
    onUpdateItinerary(newItin);
    setIsSavedLocally(false);

    if (options.transportMode === 'car') {
      optimizeItineraryWithRoadNetwork(newItin, allPlacesWithFoodVendors).then((optimized) => {
        onUpdateItinerary(optimized);
      });
    }
  };

  // Add Place to Itinerary Handler (Supports both heritage places and food vendors)
  const handleAddPlace = (place: HeritagePlace) => {
    if (!currentItinerary) return;
    if (currentItinerary.stops.some((s) => s.placeId === place.id)) return;

    const visit = place.visitDurationMinutes || 45;
    const isFood = place.type === 'food';
    const rawStops = [
      ...currentItinerary.stops,
      {
        placeId: place.id,
        order: currentItinerary.stops.length + 1,
        visitDurationMinutes: visit,
        routeDataStatus: (place.latitude && place.longitude ? 'estimated' : 'geographic_only') as any,
        reasonSelected: isFood
          ? 'Selected by user from Traditional Food Directory.'
          : 'Added by user via Add Places modal.',
      },
    ];

    const { updatedStops, totalVisitMinutes, totalTravelMinutes, totalPlannedMinutes } =
      recalculateItineraryStops(rawStops, allPlacesWithFoodVendors, currentItinerary.transportMode);

    const updatedItinerary: Itinerary = {
      ...currentItinerary,
      stops: updatedStops,
      totalVisitMinutes,
      totalTravelMinutes,
      totalPlannedMinutes,
      updatedAt: new Date().toISOString(),
      isCustomized: true,
    };

    onUpdateItinerary(updatedItinerary);
    setIsSavedLocally(false);

    if (currentItinerary.transportMode === 'car') {
      optimizeItineraryWithRoadNetwork(updatedItinerary, allPlacesWithFoodVendors).then((optimized) => {
        onUpdateItinerary(optimized);
      });
    }
  };

  // Remove Stop Handler (Removes food stop immediately and cleans up markers)
  const handleRemoveStop = (order: number) => {
    if (!currentItinerary) return;

    const remainingStops = currentItinerary.stops.filter((s) => s.order !== order);
    const { updatedStops, totalVisitMinutes, totalTravelMinutes, totalPlannedMinutes } =
      recalculateItineraryStops(remainingStops, allPlacesWithFoodVendors, currentItinerary.transportMode);

    const updatedItinerary: Itinerary = {
      ...currentItinerary,
      stops: updatedStops,
      totalVisitMinutes,
      totalTravelMinutes,
      totalPlannedMinutes,
      updatedAt: new Date().toISOString(),
      isCustomized: true,
    };

    onUpdateItinerary(updatedItinerary);
    setIsSavedLocally(false);
  };

  // Save Itinerary Handler
  const handleSave = () => {
    if (!currentItinerary) return;
    const success = saveItinerary(currentItinerary);
    if (success) {
      setIsSavedLocally(true);
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 3000);
    }
  };

  // Active places for map: destination state places for geographic and cultural context
  const activePlacesForMap = useMemo(() => {
    const targetStateId = currentItinerary?.destinationStateId || 'MLK';
    const statePlaces = allPlacesWithFoodVendors.filter((p) => p.stateId === targetStateId);
    if (statePlaces.length > 0) return statePlaces;
    return allPlacesWithFoodVendors.filter((p) => p.stateId === 'MLK');
  }, [currentItinerary?.destinationStateId, allPlacesWithFoodVendors]);

  const routeStopsForMap = currentItinerary?.stops.map((s) => ({
    placeId: s.placeId,
    order: s.order,
    routeDataStatus: s.routeDataStatus,
  }));

  const selectedFoodVendorIds = useMemo(() => {
    if (!currentItinerary || !currentItinerary.stops) return [];
    return currentItinerary.stops
      .filter(
        (s) =>
          isFoodVendorStopId(s.placeId) ||
          allPlacesWithFoodVendors.find((p) => p.id === s.placeId)?.type === 'food'
      )
      .map((s) => s.placeId);
  }, [currentItinerary?.stops, allPlacesWithFoodVendors]);

  const handleRouteCalculated = useCallback(
    (result: OSRMRouteResult) => {
      if (!currentItinerary) return;
      const { updatedItinerary, hasChanges } = applyRouteResultToItinerary(
        currentItinerary,
        allPlacesWithFoodVendors,
        result
      );
      if (hasChanges) {
        onUpdateItinerary(updatedItinerary);
      }
    },
    [currentItinerary, allPlacesWithFoodVendors, onUpdateItinerary]
  );

  const isOverTimeBudget =
    currentItinerary &&
    currentItinerary.totalPlannedMinutes > currentItinerary.availableMinutes;

  return (
    <div className="space-y-8">
      {/* Toast */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-emerald-500/30 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold">Itinerary safely saved to your browser storage!</span>
        </div>
      )}

      {/* Page Header */}
      <div>
        <h1 className="font-serif font-bold text-3xl text-[#0A2F25]">
          Smart Cultural Trip Planner
        </h1>
        <p className="text-xs text-[#0A2F25]/70 mt-1">
          Constraint-driven cultural route generation balancing user interests, visit feasibility, and transit transparency
        </p>
      </div>

      {/* Planner Controls Form */}
      <PlannerForm states={states} places={allPlacesWithFoodVendors} onGenerate={handleGenerate} />

      {/* Over-Budget Warning Banner if applicable */}
      {isOverTimeBudget && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Time Budget Warning: </strong> Total planned duration ({currentItinerary.totalPlannedMinutes} mins) slightly exceeds your target budget ({currentItinerary.availableMinutes} mins). Consider removing a stop to maintain a relaxed pace.
            </span>
          </div>
        </div>
      )}

      {/* Generated Itinerary & Map Layout */}
      {currentItinerary && currentItinerary.stops.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Itinerary Timeline */}
          <div className="lg:col-span-7 space-y-6">
            <ItineraryTimeline
              itinerary={currentItinerary}
              allPlaces={allPlacesWithFoodVendors}
              onSelectPlace={onSelectPlace}
              onRemoveStop={handleRemoveStop}
              onSaveItinerary={handleSave}
              onInspectAI={() => onInspectItineraryAI(currentItinerary)}
              isSaved={isSavedLocally}
              onAddPlace={handleAddPlace}
              onUpdateItinerary={onUpdateItinerary}
            />
          </div>

          {/* Right Column: Route Map */}
          <div className="lg:col-span-5 h-[600px] sticky top-20">
            <InteractiveMap
              places={activePlacesForMap}
              routeStops={routeStopsForMap}
              selectedFoodVendorIds={selectedFoodVendorIds}
              transportMode={currentItinerary?.transportMode || 'walking'}
              onRouteCalculated={handleRouteCalculated}
              onSelectPlace={onSelectPlace}
              startingPoint={
                currentItinerary?.startingPointName || currentItinerary?.startingCoordinates || currentItinerary?.startingPlaceId
                  ? {
                      name: (currentItinerary.startingPointName || 'Starting Point').replace(/^(🏨|📍|🏠|🚩)\s*/, ''),
                      placeId: currentItinerary.startingPlaceId,
                      coordinates: currentItinerary.startingCoordinates,
                    }
                  : undefined
              }
              center={
                currentItinerary?.startingCoordinates
                  ? currentItinerary.startingCoordinates
                  : activePlacesForMap.find((p) => p.latitude && p.longitude)
                  ? [
                      activePlacesForMap.find((p) => p.latitude && p.longitude)!.latitude!,
                      activePlacesForMap.find((p) => p.latitude && p.longitude)!.longitude!,
                    ]
                  : [2.1950, 102.2490]
              }
              zoom={15}
            />
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-white/80 backdrop-blur-md rounded-3xl border border-dashed border-teal-900/20 space-y-2">
          <p className="text-sm font-semibold text-[#0A2F25]">
            No active itinerary generated yet
          </p>
          <p className="text-xs text-[#0A2F25]/60 max-w-sm mx-auto">
            Configure your destination, time budget, and cultural interests above to generate a custom itinerary.
          </p>
        </div>
      )}
    </div>
  );
};
