import React, { useState } from 'react';
import { HeritagePlace, CuratedCollection } from '../types';
import { InteractiveMap } from '../components/map/InteractiveMap';
import { PlaceCard } from '../components/places/PlaceCard';
import { Sparkles, Compass, ShieldCheck, MapPin, ArrowRight, Calendar } from 'lucide-react';
import { NavTab } from '../components/layout/Navbar';

interface MelakaPageProps {
  places: HeritagePlace[];
  collections: CuratedCollection[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onSelectPlace: (place: HeritagePlace) => void;
  onInspectAI: (place: HeritagePlace) => void;
  onAddToItinerary: (place: HeritagePlace) => void;
  onNavigate: (tab: NavTab) => void;
  onLoadCollectionIntoPlanner: (collection: CuratedCollection) => void;
}

export const MelakaPage: React.FC<MelakaPageProps> = ({
  places,
  collections,
  favorites,
  onToggleFavorite,
  onSelectPlace,
  onInspectAI,
  onAddToItinerary,
  onNavigate,
  onLoadCollectionIntoPlanner,
}) => {
  const melakaPlaces = places.filter((p) => p.stateId === 'MLK');
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | undefined>(
    melakaPlaces[0]?.id
  );

  const handlePlaceSelect = (place: HeritagePlace) => {
    setSelectedPlaceId(place.id);
    onSelectPlace(place);
  };

  return (
    <div className="space-y-10">
      {/* Melaka UNESCO Showcase Header */}
      <div className="relative rounded-3xl bg-gradient-to-r from-red-950 via-amber-950 to-slate-900 text-white p-8 sm:p-12 overflow-hidden shadow-xl border border-red-500/20">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/30 border border-red-500/40 text-amber-200 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>FUSION 2026 Primary Demonstration Showcase</span>
          </div>

          <h1 className="font-serif font-extrabold text-3xl sm:text-5xl text-white tracking-tight">
            Melaka: Historic City of the Straits
          </h1>

          <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
            Co-inscribed as a <strong>UNESCO World Heritage Site</strong> in 2008. Melaka presents 500 years of trading history where Malay, Chinese, Indian, Portuguese, Dutch, and British civilizations created a unique architectural and intangible living synthesis.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-amber-300/90 font-medium">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> 9 Verified Monuments
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-amber-400" /> Compact Walkable Core
            </span>
            <span>Jalan Tukang Emas Multi-Faith Coexistence</span>
          </div>

          <div className="pt-4 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('planner')}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <Calendar className="w-4 h-4" />
              Generate Melaka Itinerary
            </button>
            <button
              onClick={() => onNavigate('missions')}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-all flex items-center gap-1.5"
            >
              Complete Melaka Missions
            </button>
          </div>
        </div>
      </div>

      {/* Curated Thematic Journeys */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif font-bold text-2xl text-slate-900">
              Curated Thematic Trails
            </h2>
            <p className="text-xs text-slate-500">
              Select a pre-calculated historical theme to load into the smart planning engine
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {collections.map((col) => (
            <div
              key={col.id}
              className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-amber-400 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 text-amber-900">
                  {col.theme}
                </span>
                <h3 className="font-serif font-bold text-base text-slate-900">
                  {col.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                  {col.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-500">
                  ⏱ ~{col.recommendedDurationMinutes} mins
                </span>
                <button
                  onClick={() => onLoadCollectionIntoPlanner(col)}
                  className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
                >
                  Load into Planner <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Showcase Explorer: Split Map & Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif font-bold text-2xl text-slate-900">
              Explore Melaka Heritage Sites
            </h2>
            <p className="text-xs text-slate-500">
              Click any map marker or card to inspect its sourced cultural significance and responsible visitor guidelines
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500">
            {melakaPlaces.length} Curated Sites
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Interactive Map */}
          <div className="lg:col-span-7 h-[550px] sticky top-20">
            <InteractiveMap
              places={melakaPlaces}
              selectedPlaceId={selectedPlaceId}
              onSelectPlace={handlePlaceSelect}
              center={[2.1950, 102.2490]}
              zoom={15}
            />
          </div>

          {/* Right Column: Place Cards List */}
          <div className="lg:col-span-5 space-y-4 max-h-[550px] overflow-y-auto pr-1">
            {melakaPlaces.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                isFavorite={favorites.includes(place.id)}
                onToggleFavorite={onToggleFavorite}
                onSelect={handlePlaceSelect}
                onInspectAI={onInspectAI}
                onAddToItinerary={onAddToItinerary}
                isSelected={place.id === selectedPlaceId}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
