import React, { useState, useMemo } from 'react';
import { StateRecord, HeritagePlace, Itinerary } from '../types';
import { PlaceCard } from '../components/places/PlaceCard';
import { FilterBar } from '../components/places/FilterBar';
import { InteractiveMap } from '../components/map/InteractiveMap';
import { PlannerForm } from '../components/planner/PlannerForm';
import { ItineraryTimeline } from '../components/planner/ItineraryTimeline';
import { PlannerOptions, generateItinerary, recalculateItineraryStops } from '../lib/planner';
import { saveItinerary } from '../lib/persistence';
import { Map, Grid, ShieldCheck, ExternalLink, Compass, Calendar, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';

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

  // Collect unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    places.forEach((p) => p.categories.forEach((c) => set.add(c)));
    return Array.from(set);
  }, [places]);

  // Current selected state record
  const currentStateRecord = useMemo(() => {
    if (selectedStateId === 'ALL') return null;
    return states.find((s) => s.id === selectedStateId) || null;
  }, [states, selectedStateId]);

  // Filtered places
  const filteredPlaces = useMemo(() => {
    return places.filter((place) => {
      if (selectedStateId !== 'ALL' && place.stateId !== selectedStateId) return false;
      if (selectedCategory !== 'ALL' && !place.categories.includes(selectedCategory)) return false;
      if (verifiedOnly && place.verificationStatus !== 'verified') return false;

      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const nameMatch = place.name.toLowerCase().includes(query);
        const malayMatch = place.malayName?.toLowerCase().includes(query) || false;
        const localityMatch = place.locality?.toLowerCase().includes(query) || false;
        const descMatch = place.shortDescription.toLowerCase().includes(query);
        const themeMatch = place.culturalThemes.some((t) => t.toLowerCase().includes(query));
        if (!nameMatch && !malayMatch && !localityMatch && !descMatch && !themeMatch) return false;
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

  // Add place to itinerary and switch to planner view
  const handleAddToItinerary = (place: HeritagePlace) => {
    if (!currentItinerary) {
      const newItin = generateItinerary(
        {
          destinationStateId: place.stateId,
          availableMinutes: 240,
          interests: place.culturalThemes,
          transportMode: 'walking',
          budgetLevel: 'flexible',
          startingPlaceId: place.id,
        },
        places
      );
      onUpdateItinerary(newItin);
    } else {
      const alreadyIn = currentItinerary.stops.some((s) => s.placeId === place.id);
      if (!alreadyIn) {
        const updatedStops = [
          ...currentItinerary.stops,
          {
            placeId: place.id,
            order: currentItinerary.stops.length + 1,
            visitDurationMinutes: place.visitDurationMinutes || 45,
            routeDataStatus: 'estimated' as const,
            reasonSelected: `Added by user from explore view.`,
          },
        ];
        onUpdateItinerary({
          ...currentItinerary,
          stops: updatedStops,
          totalPlannedMinutes: currentItinerary.totalPlannedMinutes + (place.visitDurationMinutes || 45) + 10,
          totalVisitMinutes: currentItinerary.totalVisitMinutes + (place.visitDurationMinutes || 45),
          totalTravelMinutes: currentItinerary.totalTravelMinutes + 10,
          isCustomized: true,
        });
      }
    }
    setActiveMode('plan');
  };

  // Planner handlers
  const handleGenerateItinerary = (options: PlannerOptions) => {
    const newItin = generateItinerary(options, places);
    onUpdateItinerary(newItin);
    setIsSavedLocally(false);
  };

  const handleRemoveStop = (order: number) => {
    if (!currentItinerary) return;
    const remainingStops = currentItinerary.stops.filter((s) => s.order !== order);
    const { updatedStops, totalVisitMinutes, totalTravelMinutes, totalPlannedMinutes } =
      recalculateItineraryStops(remainingStops, places, currentItinerary.transportMode);

    onUpdateItinerary({
      ...currentItinerary,
      stops: updatedStops,
      totalVisitMinutes,
      totalTravelMinutes,
      totalPlannedMinutes,
      updatedAt: new Date().toISOString(),
      isCustomized: true,
    });
    setIsSavedLocally(false);
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

  const activePlacesForMap = currentItinerary
    ? places.filter((p) => currentItinerary.stops.some((s) => s.placeId === p.id))
    : places.filter((p) => p.stateId === 'MLK');

  const routeStopsForMap = currentItinerary?.stops.map((s) => ({
    placeId: s.placeId,
    order: s.order,
    routeDataStatus: s.routeDataStatus,
  }));

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="font-serif font-bold text-3xl text-slate-900">
            Explore States & Plan Trip
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse authentic heritage sites across Malaysia and generate explainable cultural itineraries
          </p>
        </div>

        {/* Master Segmented Switch: Browse vs Plan */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl self-start sm:self-auto border border-slate-200/80 shadow-xs">
          <button
            onClick={() => setActiveMode('browse')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeMode === 'browse'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="w-4 h-4 text-amber-600" />
            <span>Explore Places</span>
          </button>
          <button
            onClick={() => setActiveMode('plan')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeMode === 'plan'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4 text-amber-600" />
            <span>Trip Planner</span>
            {currentItinerary && (
              <span className="w-2 h-2 rounded-full bg-amber-600" />
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
            <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950 via-slate-900 to-amber-900 text-white shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950">
                      {currentStateRecord.region}
                    </span>
                    <span className="text-xs text-amber-200/80 font-medium">
                      Capital: {currentStateRecord.capital}
                    </span>
                  </div>
                  <h2 className="font-serif font-bold text-2xl text-white">
                    {currentStateRecord.name}
                  </h2>
                  <p className="text-xs text-slate-200 max-w-3xl leading-relaxed">
                    {currentStateRecord.shortOverview}
                  </p>
                </div>

                <div className="flex flex-col sm:items-end gap-2 shrink-0">
                  <button
                    onClick={() => onSelectState('ALL')}
                    className="text-xs font-medium text-amber-200 hover:text-white underline"
                  >
                    View All States
                  </button>
                  <button
                    onClick={() => {
                      handleGenerateItinerary({
                        destinationStateId: currentStateRecord.id,
                        availableMinutes: 240,
                        interests: currentStateRecord.culturalThemes,
                        transportMode: 'walking',
                        budgetLevel: 'flexible',
                      });
                      setActiveMode('plan');
                    }}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors"
                  >
                    Plan Trip for {currentStateRecord.name} →
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
                {currentStateRecord.culturalThemes.map((theme) => (
                  <span
                    key={theme}
                    className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/10 text-amber-200 border border-white/20"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Filter Bar with Grid/Map switch */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex-1">
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
              />
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl self-end shrink-0 border border-slate-200">
              <button
                onClick={() => setBrowseViewMode('grid')}
                className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  browseViewMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setBrowseViewMode('map')}
                className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  browseViewMode === 'map'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Map View"
              >
                <Map className="w-4 h-4" />
              </button>
            </div>
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
                <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
                    <Compass className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif font-bold text-lg text-slate-900">
                    No matching heritage locations found
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Try resetting filters to explore places across all 16 states & federal territories.
                  </p>
                  <button
                    onClick={handleResetFilters}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800"
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
          <PlannerForm states={states} onGenerate={handleGenerateItinerary} />

          {/* Time Budget Warning */}
          {isOverTimeBudget && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-3">
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
                  allPlaces={places}
                  onSelectPlace={onSelectPlace}
                  onRemoveStop={handleRemoveStop}
                  onSaveItinerary={handleSaveItinerary}
                  onInspectAI={() => onInspectItineraryAI(currentItinerary)}
                  isSaved={isSavedLocally}
                />
              </div>

              <div className="lg:col-span-5 h-[600px] sticky top-20">
                <InteractiveMap
                  places={activePlacesForMap}
                  routeStops={routeStopsForMap}
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
            <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-2">
              <p className="text-sm font-semibold text-slate-700">No active itinerary generated yet</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Use Quick Mode above or configure your custom hours and cultural interests.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
