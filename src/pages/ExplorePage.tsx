import React, { useState, useMemo } from 'react';
import { StateRecord, HeritagePlace } from '../types';
import { PlaceCard } from '../components/places/PlaceCard';
import { FilterBar } from '../components/places/FilterBar';
import { InteractiveMap } from '../components/map/InteractiveMap';
import { Map, Grid, ShieldCheck, ExternalLink, Compass } from 'lucide-react';

interface ExplorePageProps {
  states: StateRecord[];
  places: HeritagePlace[];
  selectedStateId: string;
  onSelectState: (stateId: string) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onSelectPlace: (place: HeritagePlace) => void;
  onInspectAI: (place: HeritagePlace) => void;
  onAddToItinerary: (place: HeritagePlace) => void;
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
  onAddToItinerary,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

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
      // State filter
      if (selectedStateId !== 'ALL' && place.stateId !== selectedStateId) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'ALL' && !place.categories.includes(selectedCategory)) {
        return false;
      }

      // Verification filter
      if (verifiedOnly && place.verificationStatus !== 'verified') {
        return false;
      }

      // Search term
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const nameMatch = place.name.toLowerCase().includes(query);
        const malayMatch = place.malayName?.toLowerCase().includes(query) || false;
        const localityMatch = place.locality?.toLowerCase().includes(query) || false;
        const descMatch = place.shortDescription.toLowerCase().includes(query);
        const themeMatch = place.culturalThemes.some((t) => t.toLowerCase().includes(query));

        if (!nameMatch && !malayMatch && !localityMatch && !descMatch && !themeMatch) {
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

  return (
    <div className="space-y-8">
      {/* Page Title & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif font-bold text-3xl text-slate-900">
            Nationwide Heritage Explorer
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Discover verified monuments, shrines, living crafts, and archaeological sites across 16 states & federal territories
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'grid'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Grid className="w-3.5 h-3.5" /> Grid View
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'map'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Map className="w-3.5 h-3.5" /> Interactive Map
          </button>
        </div>
      </div>

      {/* State Cultural Banner (if specific state selected) */}
      {currentStateRecord && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-900 via-amber-800 to-slate-900 text-white shadow-lg space-y-4">
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

            <button
              onClick={() => onSelectState('ALL')}
              className="text-xs font-medium text-amber-200 hover:text-white underline shrink-0"
            >
              Show All States
            </button>
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

          {/* Sourced References */}
          {currentStateRecord.sourceReferences.length > 0 && (
            <div className="pt-2 text-[11px] text-amber-200/70 flex flex-wrap items-center gap-3">
              <span className="font-semibold text-white flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Sourced Archives:
              </span>
              {currentStateRecord.sourceReferences.map((ref, idx) => (
                <a
                  key={idx}
                  href={ref.url}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline text-amber-200 flex items-center gap-0.5"
                >
                  {ref.title} ({ref.publisher}) <ExternalLink className="w-2.5 h-2.5" />
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
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

      {/* Main View: Grid or Map */}
      {viewMode === 'map' ? (
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
        /* Grid View */
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
                Try clearing your search query or selecting another cultural theme to explore broader entries.
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
                  onAddToItinerary={onAddToItinerary}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
