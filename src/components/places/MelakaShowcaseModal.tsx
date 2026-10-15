import React, { useState } from 'react';
import { X, Sparkles, MapPin, ShieldCheck, ArrowRight } from 'lucide-react';
import { HeritagePlace, CuratedCollection } from '../../types';
import { InteractiveMap } from '../map/InteractiveMap';
import { PlaceCard } from './PlaceCard';

interface MelakaShowcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  places: HeritagePlace[];
  collections: CuratedCollection[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onSelectPlace: (place: HeritagePlace) => void;
  onInspectAI: (place: HeritagePlace) => void;
  onAddToItinerary: (place: HeritagePlace) => void;
  onLoadCollectionIntoPlanner: (collection: CuratedCollection) => void;
}

export const MelakaShowcaseModal: React.FC<MelakaShowcaseModalProps> = ({
  isOpen,
  onClose,
  places,
  collections,
  favorites,
  onToggleFavorite,
  onSelectPlace,
  onInspectAI,
  onAddToItinerary,
  onLoadCollectionIntoPlanner,
}) => {
  if (!isOpen) return null;

  const melakaPlaces = places.filter((p) => p.stateId === 'MLK');
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | undefined>(melakaPlaces[0]?.id);

  const handleMarkerOrCardSelect = (place: HeritagePlace) => {
    setSelectedPlaceId(place.id);
    onSelectPlace(place);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-[#0A1F1C] rounded-3xl shadow-2xl max-w-6xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-[#D4AF37]/35 text-[#F5F5F0]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#04100E] via-[#0A1F1C] to-[#0E2925] border-b border-[#D4AF37]/25 text-[#F5F5F0] p-5 sm:p-6 flex items-start justify-between shrink-0">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#0E2925] border border-[#D4AF37]/40 text-[#E5C05C] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span>UNESCO World Heritage Showcase</span>
            </div>
            <h2 className="font-serif font-bold text-2xl sm:text-3xl text-[#F5F5F0]">
              Melaka: Historic City of the Straits
            </h2>
            <p className="text-xs sm:text-sm text-[#F5F5F0]/80 max-w-2xl">
              500 years of living multicultural heritage connecting Malay Sultanate timber palaces, Portuguese fortresses, Dutch administrative squares, and Peranakan shophouse culture.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#04100E]/80 text-[#F5F5F0]/80 hover:text-white hover:bg-[#0E2925] border border-[#D4AF37]/25 transition-colors shrink-0 cursor-pointer"
            aria-label="Close Showcase"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Curated Thematic Trails Row */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#E5C05C] mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" /> Curated Thematic Trails
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {collections.map((col) => (
                <div
                  key={col.id}
                  className="p-4 rounded-2xl bg-[#04100E] border border-[#D4AF37]/25 hover:border-[#D4AF37] hover:bg-[#0E2925] flex flex-col justify-between space-y-2 transition-all shadow-md"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#0E2925] text-[#E5C05C] border border-[#D4AF37]/30">
                      {col.theme}
                    </span>
                    <h4 className="font-serif font-bold text-sm text-[#F5F5F0] mt-1">{col.title}</h4>
                    <p className="text-[11px] text-[#F5F5F0]/70 line-clamp-2 mt-0.5">{col.description}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-[#D4AF37]/15 text-xs">
                    <span className="text-[#F5F5F0]/60 font-medium">⏱ ~{col.recommendedDurationMinutes} mins</span>
                    <button
                      onClick={() => {
                        onLoadCollectionIntoPlanner(col);
                        onClose();
                      }}
                      className="font-bold text-[#E5C05C] hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      Plan Trail <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Map & Sites Split Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#E5C05C] flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#D4AF37]" /> Interactive Melaka Map & Sites ({melakaPlaces.length})
              </h3>
              <span className="text-[11px] text-[#F5F5F0]/60">
                Click any marker or card to view cultural significance
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Map Column */}
              <div className="lg:col-span-7 h-[420px] rounded-2xl overflow-hidden border border-[#D4AF37]/30 shadow-md">
                <InteractiveMap
                  places={melakaPlaces}
                  selectedPlaceId={selectedPlaceId}
                  onSelectPlace={handleMarkerOrCardSelect}
                  center={[2.1950, 102.2490]}
                  zoom={15}
                />
              </div>

              {/* Cards Column */}
              <div className="lg:col-span-5 space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {melakaPlaces.map((place) => (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    isFavorite={favorites.includes(place.id)}
                    onToggleFavorite={onToggleFavorite}
                    onSelect={handleMarkerOrCardSelect}
                    onInspectAI={onInspectAI}
                    onAddToItinerary={(p) => {
                      onAddToItinerary(p);
                      onClose();
                    }}
                    isSelected={place.id === selectedPlaceId}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#04100E] border-t border-[#D4AF37]/20 flex justify-between items-center text-xs">
          <span className="text-[#F5F5F0]/70 flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-[#00F0FF]" /> 100% Sourced Records from Jabatan Warisan Negara & UNESCO
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#E5C05C] text-[#04100E] font-bold transition-colors shadow-xs cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
