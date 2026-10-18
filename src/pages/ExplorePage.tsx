import React, { useState, useMemo, useCallback } from 'react';
import { StateRecord, HeritagePlace, Itinerary } from '../types';
import { PlaceCard } from '../components/places/PlaceCard';
import { FilterBar } from '../components/places/FilterBar';
import { InteractiveMap } from '../components/map/InteractiveMap';
import { PlannerForm } from '../components/planner/PlannerForm';
import { ItineraryTimeline } from '../components/planner/ItineraryTimeline';
import {
  PlannerOptions,
  generateItinerary,
  recalculateItineraryStops,
  applyRouteResultToItinerary,
  optimizeItineraryWithRoadNetwork,
} from '../lib/planner';
import { OSRMRouteResult, getDefaultTransportMode } from '../lib/routing';
import { saveItinerary } from '../lib/persistence';
import { getEnrichedPlacesWithFoodVendors, isFoodVendorStopId } from '../lib/foodVendors';
import { ShieldCheck, Compass, Calendar, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ExplorePageProps {
  states: StateRecord[];
  places: HeritagePlace[];
  selectedStateId: string;
  onSelectState: (stateId: string) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onSelectPlace: (place: HeritagePlace) => void;
  onInspectAI: (place: HeritagePlace) => void;
  currentItinerary: Itinerary | null;
  onUpdateItinerary: (itinerary: Itinerary | null) => void;
  onInspectItineraryAI: (itinerary: Itinerary) => void;
  initialMode?: 'browse' | 'plan';
}

export const ExplorePage: React.FC<ExplorePageProps> = ({
  states,
  places,
  selectedStateId,
  onSelectState,
  favorites,
  onToggleFavorite,
  onSelectPlace,
  onInspectAI,
  currentItinerary,
  onUpdateItinerary,
  onInspectItineraryAI,
  initialMode = 'browse',
}) => {
  // Main view toggle: Browse vs Plan
  const [activeMode, setActiveMode] = useState<'browse' | 'plan'>(initialMode);

  // Browse state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [browseViewMode, setBrowseViewMode] = useState<'grid' | 'map'>('grid');

  // Planner state
  const [isSavedLocally, setIsSavedLocally] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  // Curated core theme filters (7 clean filters including "All Themes")
  const categories = useMemo(() => [
    'Food',
    'Cultural Performance',
    'Cultural Festival',
    'Colonial',
    'Museum',
    'Religious',
  ], []);

  // Current selected state record
  const currentStateRecord = useMemo(() => {
    if (selectedStateId === 'ALL') return null;
    return states.find((s) => s.id === selectedStateId) || null;
  }, [states, selectedStateId]);

  // Filtered places
  const filteredPlaces = useMemo(() => {
    return places.filter((place) => {
      if (
        selectedStateId !== 'ALL' &&
        place.stateId !== selectedStateId &&
        !place.state_association?.includes(selectedStateId)
      ) {
        return false;
      }

      // Streamlined category matching
      if (selectedCategory !== 'ALL') {
        if (selectedCategory === 'Food' || selectedCategory === 'Traditional Food') {
          const isFood =
            place.type === 'food' ||
            place.categories.includes('Food') ||
            place.categories.includes('Traditional Food') ||
            place.categories.includes('Traditional Kuih');
          if (!isFood) return false;
        } else if (selectedCategory === 'Cultural Performance') {
          const isPerf =
            place.type === 'performance' ||
            place.categories.includes('Cultural Performance');
          if (!isPerf) return false;
        } else if (selectedCategory === 'Cultural Festival') {
          const isFest =
            place.type === 'festival' ||
            place.categories.includes('Cultural Festival');
          if (!isFest) return false;
        } else {
          if (!place.categories.includes(selectedCategory)) return false;
        }
      }

      if (verifiedOnly && place.verificationStatus !== 'verified') return false;

      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const nameMatch = place.name.toLowerCase().includes(query);
        const malayMatch = place.malayName?.toLowerCase().includes(query) || false;
        const localityMatch = place.locality?.toLowerCase().includes(query) || false;
        const descMatch = place.shortDescription.toLowerCase().includes(query);
        const themeMatch = place.culturalThemes.some((t) => t.toLowerCase().includes(query));
        const communityMatch =
          place.community_association?.some((c) => c.toLowerCase().includes(query)) || false;
        if (!nameMatch && !malayMatch && !localityMatch && !descMatch && !themeMatch && !communityMatch) {
          return false;
        }
      }

      return true;
    });
  }, [places, selectedStateId, selectedCategory, verifiedOnly, searchTerm]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('ALL');
    onSelectState('ALL');
    setVerifiedOnly(false);
  };

  // Combined places array including all verified traditional food vendors
  const allPlacesWithFoodVendors = useMemo(() => {
    return getEnrichedPlacesWithFoodVendors(places);
  }, [places]);

  // Add place to itinerary and switch to planner view
  const handleAddToItinerary = (place: HeritagePlace) => {
    if (!currentItinerary || currentItinerary.destinationStateId !== place.stateId) {
      const defaultMode = getDefaultTransportMode(allPlacesWithFoodVendors, place.stateId);
      const newItin = generateItinerary(
        {
          destinationStateId: place.stateId,
          availableMinutes: 240,
          interests: place.culturalThemes,
          transportMode: defaultMode,
          budgetLevel: 'flexible',
          startingPlaceId: place.id,
        },
        allPlacesWithFoodVendors
      );
      onUpdateItinerary(newItin);
    } else {
      const alreadyIn = currentItinerary.stops.some((s) => s.placeId === place.id);
      if (!alreadyIn) {
        const isFood = place.type === 'food';
        const rawNewStops = [
          ...currentItinerary.stops,
          {
            placeId: place.id,
            order: currentItinerary.stops.length + 1,
            visitDurationMinutes: place.visitDurationMinutes || 45,
            routeDataStatus: (place.latitude && place.longitude ? 'estimated' : 'geographic_only') as any,
            reasonSelected: isFood
              ? 'Selected by user from Traditional Food Directory.'
              : 'Added by user from explore view.',
          },
        ];
        const { updatedStops, totalVisitMinutes, totalTravelMinutes, totalPlannedMinutes } =
          recalculateItineraryStops(rawNewStops, allPlacesWithFoodVendors, currentItinerary.transportMode);

        const updatedItinerary = {
          ...currentItinerary,
          stops: updatedStops,
          totalVisitMinutes,
          totalTravelMinutes,
          totalPlannedMinutes,
          updatedAt: new Date().toISOString(),
          isCustomized: true,
        };

        onUpdateItinerary(updatedItinerary);

        if (currentItinerary.transportMode === 'car') {
          optimizeItineraryWithRoadNetwork(updatedItinerary, allPlacesWithFoodVendors).then((optimized) => {
            onUpdateItinerary(optimized);
          });
        }
      }
    }
    setActiveMode('plan');
  };

  // Planner handlers
  const handleGenerateItinerary = (options: PlannerOptions) => {
    const newItin = generateItinerary(options, allPlacesWithFoodVendors);
    onUpdateItinerary(newItin);
    setIsSavedLocally(false);

    if (options.transportMode === 'car') {
      optimizeItineraryWithRoadNetwork(newItin, allPlacesWithFoodVendors).then((optimized) => {
        onUpdateItinerary(optimized);
      });
    }
  };

  const handleRemoveStop = (order: number) => {
    if (!currentItinerary) return;
    const remainingStops = currentItinerary.stops.filter((s) => s.order !== order);
    const { updatedStops, totalVisitMinutes, totalTravelMinutes, totalPlannedMinutes } =
      recalculateItineraryStops(remainingStops, allPlacesWithFoodVendors, currentItinerary.transportMode);

    const updatedItinerary = {
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

  const handleSaveItinerary = () => {
    if (!currentItinerary) return;
    const success = saveItinerary(currentItinerary);
    if (success) {
      setIsSavedLocally(true);
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 3000);
    }
  };

  const activePlacesForMap = useMemo(() => {
    const targetStateId =
      currentItinerary?.destinationStateId ||
      (selectedStateId !== 'ALL' ? selectedStateId : 'MLK');
    const statePlaces = allPlacesWithFoodVendors.filter((p) => p.stateId === targetStateId);
    if (statePlaces.length > 0) return statePlaces;
    return allPlacesWithFoodVendors.filter((p) => p.stateId === 'MLK');
  }, [currentItinerary?.destinationStateId, selectedStateId, allPlacesWithFoodVendors]);

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
    currentItinerary && currentItinerary.totalPlannedMinutes > currentItinerary.availableMinutes;

  return (
    <div className="space-y-8">
      {/* Toast */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-emerald-500/30 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold">Itinerary saved to your browser storage!</span>
        </div>
      )}

      {/* Main Header & Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-teal-900/10">
        <div>
          <h1 className="font-serif font-bold text-3xl text-[#0A2F25]">
            Explore States & Plan Trip
          </h1>
          <p className="text-xs text-[#0A2F25]/70 mt-1">
            Browse authentic heritage sites across Malaysia and generate explainable cultural itineraries
          </p>
        </div>

        {/* Master Segmented Switch: Browse vs Plan */}
        <div className="flex bg-white/80 p-1.5 rounded-2xl self-start sm:self-auto border border-teal-900/10 shadow-xs backdrop-blur-md">
          <button
            onClick={() => setActiveMode('browse')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeMode === 'browse'
                ? 'bg-[#0A2F25] text-white shadow-xs'
                : 'text-[#0A2F25]/70 hover:text-[#0A2F25]'
            }`}
          >
            <Compass className={`w-4 h-4 ${activeMode === 'browse' ? 'text-[#E5C05C]' : 'text-[#B88E18]'}`} />
            <span>Explore Places</span>
          </button>
          <button
            onClick={() => setActiveMode('plan')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeMode === 'plan'
                ? 'bg-[#0A2F25] text-white shadow-xs'
                : 'text-[#0A2F25]/70 hover:text-[#0A2F25]'
            }`}
          >
            <Calendar className={`w-4 h-4 ${activeMode === 'plan' ? 'text-[#E5C05C]' : 'text-[#B88E18]'}`} />
            <span>Trip Planner</span>
            {currentItinerary && (
              <span className={`w-2 h-2 rounded-full ${activeMode === 'plan' ? 'bg-[#E5C05C]' : 'bg-[#C5A028]'}`} />
            )}
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODE 1: EXPLORE & BROWSE PLACES
          ───────────────────────────────────────────────────────────── */}
      {activeMode === 'browse' && (
        <div className="space-y-8">
          {/* State Cultural Banner (if specific state selected) */}
          {currentStateRecord && (
            <div className="p-6 rounded-3xl bg-white/80 border border-teal-900/10 text-[#0A2F25] shadow-lg shadow-teal-900/5 backdrop-blur-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full bg-[#C5A028] text-white">
                      {currentStateRecord.region}
                    </span>
                    <span className="text-xs text-[#996F09] font-medium">
                      Capital: {currentStateRecord.capital}
                    </span>
                  </div>
                  <h2 className="font-serif font-bold text-2xl text-[#0A2F25]">
                    {currentStateRecord.name}
                  </h2>
                  <p className="text-xs text-[#0A2F25]/80 max-w-3xl leading-relaxed">
                    {currentStateRecord.shortOverview}
                  </p>
                </div>

                <div className="flex flex-col sm:items-end gap-2 shrink-0">
                  <button
                    onClick={() => onSelectState('ALL')}
                    className="text-xs font-medium text-[#087E83] hover:text-[#0A2F25] underline cursor-pointer"
                  >
                    View All States
                  </button>
                  <button
                    onClick={() => {
                      handleGenerateItinerary({
                        destinationStateId: currentStateRecord.id,
                        availableMinutes: 240,
                        interests: currentStateRecord.culturalThemes,
                        transportMode: getDefaultTransportMode(places, currentStateRecord.id),
                        budgetLevel: 'flexible',
                      });
                      setActiveMode('plan');
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0A2F25] text-white border border-[#0A2F25] hover:bg-[#0E3D31] shadow-xs transition-all cursor-pointer"
                  >
                    Plan Trip for {currentStateRecord.name} →
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-teal-900/10">
                {currentStateRecord.culturalThemes.map((theme) => (
                  <span
                    key={theme}
                    className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#EBF5F0] text-[#0A2F25] border border-teal-900/10"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Filter Bar spanning full width matching other sections */}
          <div className="w-full">
            <FilterBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedStateId={selectedStateId}
              onStateChange={onSelectState}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              verifiedOnly={verifiedOnly}
              onVerifiedOnlyChange={setVerifiedOnly}
              states={states}
              categories={categories}
              totalResults={filteredPlaces.length}
              onResetFilters={handleResetFilters}
              viewMode={browseViewMode}
              onViewModeChange={setBrowseViewMode}
            />
          </div>

          {/* Grid or Map Display */}
          {browseViewMode === 'map' ? (
            <div className="h-[600px] w-full">
              <InteractiveMap
                places={filteredPlaces}
                onSelectPlace={onSelectPlace}
                center={
                  currentStateRecord && filteredPlaces[0]?.latitude
                    ? [filteredPlaces[0].latitude, filteredPlaces[0].longitude!]
                    : [3.1486, 101.6944]
                }
                zoom={selectedStateId === 'MLK' ? 15 : 7}
              />
            </div>
          ) : (
            <div>
              {filteredPlaces.length === 0 ? (
                <div className="p-12 text-center bg-white/80 rounded-3xl border border-teal-900/10 shadow-sm backdrop-blur-md space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#E6F3ED] text-[#B88E18] border border-teal-900/10 flex items-center justify-center mx-auto">
                    <Compass className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif font-bold text-lg text-[#0A2F25]">
                    No matching heritage locations found
                  </h3>
                  <p className="text-xs text-[#0A2F25]/70 max-w-md mx-auto">
                    Try resetting filters to explore places across all 16 states & federal territories.
                  </p>
                  <button
                    onClick={handleResetFilters}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#0A2F25] text-white hover:bg-[#0E3D31] cursor-pointer transition-colors"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPlaces.map((place) => (
                    <PlaceCard
                      key={place.id}
                      place={place}
                      isFavorite={favorites.includes(place.id)}
                      onToggleFavorite={onToggleFavorite}
                      onSelect={onSelectPlace}
                      onInspectAI={onInspectAI}
                      onAddToItinerary={handleAddToItinerary}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODE 2: SMART TRIP PLANNER
          ───────────────────────────────────────────────────────────── */}
      {activeMode === 'plan' && (
        <div className="space-y-8">
          {/* Planner Controls Form */}
          <PlannerForm
            states={states}
            places={allPlacesWithFoodVendors}
            onGenerate={handleGenerateItinerary}
            initialStateId={
              selectedStateId !== 'ALL'
                ? selectedStateId
                : currentItinerary?.destinationStateId || 'MLK'
            }
          />

          {/* Time Budget Warning */}
          {isOverTimeBudget && (
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300 text-amber-900 text-xs flex items-center gap-3 backdrop-blur-md">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Time Budget Warning: </strong> Total planned duration ({currentItinerary.totalPlannedMinutes} mins) slightly exceeds your target budget ({currentItinerary.availableMinutes} mins). Consider removing a stop to maintain a relaxed pace.
              </span>
            </div>
          )}

          {/* Itinerary Timeline & Synchronized Map */}
          {currentItinerary && currentItinerary.stops.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7 space-y-6">
                <ItineraryTimeline
                  itinerary={currentItinerary}
                  allPlaces={allPlacesWithFoodVendors}
                  onSelectPlace={onSelectPlace}
                  onRemoveStop={handleRemoveStop}
                  onSaveItinerary={handleSaveItinerary}
                  onInspectAI={() => onInspectItineraryAI(currentItinerary)}
                  isSaved={isSavedLocally}
                  onUpdateItinerary={onUpdateItinerary}
                  onAddPlace={handleAddToItinerary}
                />
              </div>

              <div className="lg:col-span-5 h-[600px] sticky top-20">
                <InteractiveMap
                  places={activePlacesForMap}
                  routeStops={routeStopsForMap}
                  selectedFoodVendorIds={selectedFoodVendorIds}
                  transportMode={currentItinerary?.transportMode || 'walking'}
                  onSelectPlace={onSelectPlace}
                  onRouteCalculated={handleRouteCalculated}
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
                  zoom={14}
                />
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-white/70 rounded-3xl border border-dashed border-teal-900/15 text-[#0A2F25] backdrop-blur-md space-y-2">
              <p className="text-sm font-semibold text-[#0A2F25]">No active itinerary generated yet</p>
              <p className="text-xs text-[#0A2F25]/70 max-w-sm mx-auto">
                Use Quick Mode above or configure your custom hours and cultural interests.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
