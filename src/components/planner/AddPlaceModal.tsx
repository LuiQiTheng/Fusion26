import React, { useState, useMemo } from 'react';
import { X, Search, Check, Plus, Clock, MapPin, Sparkles, Filter } from 'lucide-react';
import { HeritagePlace, ItineraryStop } from '../../types';

interface AddPlaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  destinationStateId: string;
  destinationStateName?: string;
  allPlaces: HeritagePlace[];
  currentItineraryStops: ItineraryStop[];
  onAddPlace: (place: HeritagePlace) => void;
  onSelectPlaceDetail?: (place: HeritagePlace) => void;
}

const CATEGORY_OPTIONS = [
  { id: 'ALL', label: 'All Categories' },
  { id: 'Food', label: 'Traditional Food' },
  { id: 'Monument', label: 'Heritage Monuments' },
  { id: 'Cultural Performance', label: 'Performances' },
  { id: 'Cultural Festival', label: 'Festivals' },
  { id: 'Museum', label: 'Museums' },
  { id: 'Religious', label: 'Religious Sites' },
];

export const AddPlaceModal: React.FC<AddPlaceModalProps> = ({
  isOpen,
  onClose,
  destinationStateId,
  destinationStateName,
  allPlaces,
  currentItineraryStops,
  onAddPlace,
  onSelectPlaceDetail,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  // Existing stop IDs in itinerary
  const existingStopIds = useMemo(() => {
    const set = new Set<string>();
    currentItineraryStops.forEach((s) => set.add(s.placeId));
    addedIds.forEach((id) => set.add(id));
    return set;
  }, [currentItineraryStops, addedIds]);

  // Filter places for destination state
  const statePlaces = useMemo(() => {
    return allPlaces.filter((p) => {
      // Must belong to destination state
      const matchesState =
        p.stateId === destinationStateId ||
        p.state_association?.includes(destinationStateId);
      if (!matchesState) return false;

      // Category filter
      if (selectedCategory !== 'ALL') {
        if (selectedCategory === 'Food') {
          const isFood =
            p.type === 'food' ||
            p.categories.includes('Food') ||
            p.categories.includes('Traditional Food') ||
            p.categories.includes('Traditional Kuih');
          if (!isFood) return false;
        } else if (selectedCategory === 'Monument') {
          const isMonument =
            p.type === 'monument' ||
            p.categories.includes('Colonial') ||
            p.categories.includes('Architecture') ||
            p.categories.includes('Historic Site');
          if (!isMonument) return false;
        } else if (selectedCategory === 'Cultural Performance') {
          const isPerf =
            p.type === 'performance' ||
            p.categories.includes('Cultural Performance') ||
            p.categories.includes('Living Tradition');
          if (!isPerf) return false;
        } else if (selectedCategory === 'Cultural Festival') {
          const isFest =
            p.type === 'festival' ||
            p.categories.includes('Cultural Festival');
          if (!isFest) return false;
        } else {
          if (!p.categories.includes(selectedCategory)) return false;
        }
      }

      // Search term
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const nameMatch = p.name.toLowerCase().includes(query);
        const malayMatch = p.malayName?.toLowerCase().includes(query) || false;
        const localityMatch = p.locality?.toLowerCase().includes(query) || false;
        const descMatch = p.shortDescription.toLowerCase().includes(query);
        const themeMatch = p.culturalThemes.some((t) => t.toLowerCase().includes(query));
        if (!nameMatch && !malayMatch && !localityMatch && !descMatch && !themeMatch) {
          return false;
        }
      }

      return true;
    });
  }, [allPlaces, destinationStateId, selectedCategory, searchTerm]);

  const handleAdd = (place: HeritagePlace) => {
    onAddPlace(place);
    setAddedIds((prev) => new Set(prev).add(place.id));
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal-950/40 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-3xl max-h-[88vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-teal-900/10 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-teal-900/10 flex items-center justify-between bg-gradient-to-r from-[#F4F9F6] to-white">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#C5A028]/15 text-[#996F09] border border-[#C5A028]/30">
                {destinationStateName || destinationStateId}
              </span>
              <span className="text-xs text-[#0A2F25]/60 font-medium">
                {statePlaces.length} places available
              </span>
            </div>
            <h3 className="font-serif font-bold text-xl text-[#0A2F25] mt-1">
              Add Places & Experiences to Itinerary
            </h3>
            <p className="text-xs text-[#0A2F25]/70">
              Browse authentic attractions, culinary stops, and living crafts to add directly to your route.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#0A2F25]/60 hover:text-[#0A2F25] hover:bg-black/5 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 sm:p-5 border-b border-teal-900/10 bg-white space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#0A2F25]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by place name, dish, locality, or keyword..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#F4F9F6] border border-teal-900/15 text-xs text-[#0A2F25] placeholder-[#0A2F25]/45 focus:outline-hidden focus:border-[#C5A028]"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#0A2F25]/50 hover:text-[#0A2F25]"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category Dropdown */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Filter className="w-3.5 h-3.5 text-[#B88E18]" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="py-2 px-3 rounded-xl bg-[#F4F9F6] border border-teal-900/15 text-xs font-semibold text-[#0A2F25] focus:outline-hidden focus:border-[#C5A028] cursor-pointer"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick theme chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {CATEGORY_OPTIONS.map((c) => {
              const isSelected = selectedCategory === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#0A2F25] text-white shadow-xs'
                      : 'bg-[#F4F9F6] text-[#0A2F25]/70 hover:bg-[#EBF5F0] hover:text-[#0A2F25] border border-teal-900/10'
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Places List (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {statePlaces.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Sparkles className="w-8 h-8 text-[#B88E18]/50 mx-auto" />
              <p className="text-sm font-semibold text-[#0A2F25]">No places match your search or filter</p>
              <p className="text-xs text-[#0A2F25]/60">
                Try selecting "All Categories" or clearing the search query.
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('ALL');
                }}
                className="mt-2 px-3 py-1.5 rounded-lg text-xs font-bold text-[#087E83] hover:underline"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            statePlaces.map((place) => {
              const isAlreadyAdded = existingStopIds.has(place.id);
              const visitMins = place.visitDurationMinutes || 45;

              return (
                <div
                  key={place.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl border transition-all ${
                    isAlreadyAdded
                      ? 'bg-[#EBF5F0]/70 border-emerald-500/25'
                      : 'bg-white hover:bg-[#F4F9F6] border-teal-900/10 hover:border-[#C5A028]/40 shadow-xs'
                  }`}
                >
                  {/* Left: Thumbnail & Info */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div
                      onClick={() => onSelectPlaceDetail && onSelectPlaceDetail(place)}
                      className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden bg-[#E6F3ED] border border-teal-900/10 shrink-0 cursor-pointer group"
                    >
                      <img
                        src={place.imageUrl || '/images/places/mlk-stadthuys.jpg'}
                        alt={place.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/places/mlk-stadthuys.jpg';
                        }}
                      />
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#EBF5F0] text-[#0A2F25] border border-teal-900/10">
                          {place.type === 'food'
                            ? 'Food & Delicacy'
                            : place.type === 'performance'
                            ? 'Performance'
                            : place.type === 'festival'
                            ? 'Festival'
                            : 'Monument'}
                        </span>
                        {place.locality && (
                          <span className="text-[11px] text-[#0A2F25]/60 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#B88E18]" /> {place.locality}
                          </span>
                        )}
                      </div>

                      <h4
                        onClick={() => onSelectPlaceDetail && onSelectPlaceDetail(place)}
                        className="font-serif font-bold text-sm sm:text-base text-[#0A2F25] hover:text-[#087E83] cursor-pointer truncate"
                      >
                        {place.name}
                      </h4>

                      <p className="text-xs text-[#0A2F25]/75 line-clamp-1">
                        {place.shortDescription}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-[#0A2F25]/60 pt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#087E83]" /> {visitMins} mins
                        </span>
                        <span>•</span>
                        <span>
                          {place.estimatedCostMYR === 0 || !place.estimatedCostMYR
                            ? 'Free Entry'
                            : `RM ${place.estimatedCostMYR}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Add Action or Added Indicator */}
                  <div className="sm:self-center shrink-0 flex items-center gap-2">
                    {isAlreadyAdded ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100/80 border border-emerald-300 text-emerald-900 text-xs font-bold shadow-xs">
                        <Check className="w-4 h-4 text-emerald-700" />
                        <span>Already Added</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAdd(place)}
                        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#0A2F25] hover:bg-[#0E3D31] text-white text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer group"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#E5C05C] group-hover:rotate-90 transition-transform" />
                        <span>Add to Trip</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-teal-900/10 bg-[#F4F9F6] flex items-center justify-between">
          <p className="text-xs text-[#0A2F25]/70">
            Added places automatically integrate into your itinerary and route timeline.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white hover:bg-black/5 text-[#0A2F25] text-xs font-bold border border-teal-900/15 shadow-xs cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
