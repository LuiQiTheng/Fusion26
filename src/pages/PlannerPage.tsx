import React, { useState, useCallback } from 'react';
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

  // Generate Itinerary Handler
  const handleGenerate = (options: PlannerOptions) => {
    const newItin = generateItinerary(options, places);
    onUpdateItinerary(newItin);
    setIsSavedLocally(false);

    if (options.transportMode === 'car') {
      optimizeItineraryWithRoadNetwork(newItin, places).then((optimized) => {
        onUpdateItinerary(optimized);
      });
    }
  };

  // Remove Stop Handler
  const handleRemoveStop = (order: number) => {
    if (!currentItinerary) return;

    const remainingStops = currentItinerary.stops.filter((s) => s.order !== order);
    const { updatedStops, totalVisitMinutes, totalTravelMinutes, totalPlannedMinutes } =
      recalculateItineraryStops(remainingStops, places, currentItinerary.transportMode);

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

  // Active places for map
  const activePlacesForMap = currentItinerary
    ? places.filter((p) => currentItinerary.stops.some((s) => s.placeId === p.id))
    : places.filter((p) => p.stateId === 'MLK');

  const routeStopsForMap = currentItinerary?.stops.map((s) => ({
    placeId: s.placeId,
    order: s.order,
    routeDataStatus: s.routeDataStatus,
  }));

  const handleRouteCalculated = useCallback(
    (result: OSRMRouteResult) => {
      if (!currentItinerary) return;
      const { updatedItinerary, hasChanges } = applyRouteResultToItinerary(
        currentItinerary,
        places,
        result
      );
      if (hasChanges) {
        onUpdateItinerary(updatedItinerary);
      }
    },
    [currentItinerary, places, onUpdateItinerary]
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
      <PlannerForm states={states} places={places} onGenerate={handleGenerate} />

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
              allPlaces={places}
              onSelectPlace={onSelectPlace}
              onRemoveStop={handleRemoveStop}
              onSaveItinerary={handleSave}
              onInspectAI={() => onInspectItineraryAI(currentItinerary)}
              isSaved={isSavedLocally}
            />
          </div>

          {/* Right Column: Route Map */}
          <div className="lg:col-span-5 h-[600px] sticky top-20">
            <InteractiveMap
              places={activePlacesForMap}
              routeStops={routeStopsForMap}
              transportMode={currentItinerary?.transportMode || 'walking'}
              onRouteCalculated={handleRouteCalculated}
              onSelectPlace={onSelectPlace}
              center={
                activePlacesForMap[0]?.latitude
                  ? [activePlacesForMap[0].latitude, activePlacesForMap[0].longitude!]
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
            Use Quick Mode for an instant 3.5-hour Melaka trail or configure your custom time budget and interests above.
          </p>
        </div>
      )}
    </div>
  );
};
