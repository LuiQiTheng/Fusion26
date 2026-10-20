import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Search,
  Check,
  Plus,
  Clock,
  MapPin,
  Sparkles,
  Filter,
  Utensils,
  ExternalLink,
} from 'lucide-react';
import { HeritagePlace, ItineraryStop, TraditionalFoodVendor } from '../../types';
import {
  allFoodVendors,
  convertFoodVendorToPlace,
  isFoodVendorStopId,
  vendorByPlaceId,
} from '../../lib/foodVendors';

interface AddPlaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDone?: () => void;
  destinationStateId: string;
  destinationStateName?: string;
  allPlaces: HeritagePlace[];
  currentItineraryStops: ItineraryStop[];
  onAddPlace: (place: HeritagePlace) => void;
  onSelectPlaceDetail?: (place: HeritagePlace) => void;
  initialTab?: 'places' | 'food';
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
  onDone,
  destinationStateId,
  destinationStateName,
  allPlaces,
  currentItineraryStops,
  onAddPlace,
  onSelectPlaceDetail,
  initialTab = 'places',
}) => {
  const [activeTab, setActiveTab] = useState<'places' | 'food'>(initialTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [foodStateScope, setFoodStateScope] = useState<'state' | 'all'>('state');
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [addedCount, setAddedCount] = useState<number>(0);

  // Prevent background scroll and reset state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setAddedIds(new Set());
      setAddedCount(0);
      if (initialTab) {
        setActiveTab(initialTab);
      }
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialTab]);

  // Existing stop IDs in itinerary
  const existingStopIds = useMemo(() => {
    const set = new Set<string>();
    currentItineraryStops.forEach((s) => set.add(s.placeId));
    addedIds.forEach((id) => set.add(id));
    return set;
  }, [currentItineraryStops, addedIds]);

  // Food vendors for destination state
  const destinationStateFoodVendors = useMemo(() => {
    return allFoodVendors.filter((v) => v.stateId === destinationStateId);
  }, [destinationStateId]);

  // Filter food vendors based on scope and search
  const filteredFoodVendors = useMemo(() => {
    return allFoodVendors.filter((v) => {
      if (foodStateScope === 'state') {
        if (v.stateId !== destinationStateId) return false;
      }

      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const foodMatch = v.foodName.toLowerCase().includes(query);
        const restMatch = v.restaurantName.toLowerCase().includes(query);
        const addrMatch = v.address.toLowerCase().includes(query);
        const notesMatch = v.notes.toLowerCase().includes(query);
        const stateMatch = v.state.toLowerCase().includes(query);
        if (!foodMatch && !restMatch && !addrMatch && !notesMatch && !stateMatch) {
          return false;
        }
      }

      return true;
    });
  }, [destinationStateId, foodStateScope, searchTerm]);

  // Filter places for destination state
  const statePlaces = useMemo(() => {
    return allPlaces.filter((p) => {
      // Must belong to destination state
      const matchesState =
        p.stateId === destinationStateId ||
        p.state_association?.includes(destinationStateId);
      if (!matchesState) return false;

      // Exclude synthetic vendor IDs from Heritage Attractions list
      if (p.id.match(/^food-\d+$/)) return false;

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

  const handleAddPlace = (place: HeritagePlace) => {
    onAddPlace(place);
    setAddedCount((c) => c + 1);
    setAddedIds((prev) => {
      const next = new Set(prev);
      next.add(place.id);
      const vendor = vendorByPlaceId.get(place.id);
      if (vendor) next.add(vendor.id);
      return next;
    });
  };

  const handleAddFoodVendor = (vendor: TraditionalFoodVendor) => {
    // Locate the authentic original food place record in the dataset
    const originalPlace = vendor.placeId ? allPlaces.find((p) => p.id === vendor.placeId) : null;
    if (originalPlace) {
      onAddPlace(originalPlace);
    } else {
      const place = convertFoodVendorToPlace(vendor);
      onAddPlace(place);
    }
    setAddedCount((c) => c + 1);
    setAddedIds((prev) => {
      const next = new Set(prev);
      next.add(vendor.id);
      if (vendor.placeId) next.add(vendor.placeId);
      return next;
    });
  };

  const isFoodVendorAdded = (v: TraditionalFoodVendor) => {
    return (
      existingStopIds.has(v.id) ||
      (v.placeId ? existingStopIds.has(v.placeId) : false) ||
      addedIds.has(v.id) ||
      (v.placeId ? addedIds.has(v.placeId) : false)
    );
  };

  const handleDoneClick = () => {
    if (onDone) {
      onDone();
    } else {
      onClose();
    }
  };

  const handleCloseClick = () => {
    if (addedCount > 0 && onDone) {
      onDone();
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-teal-950/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleCloseClick();
        }
      }}
    >
      <div className="relative w-full max-w-3xl max-h-[88vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-teal-900/10 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-teal-900/10 flex items-center justify-between bg-gradient-to-r from-[#F4F9F6] to-white">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#C5A028]/15 text-[#996F09] border border-[#C5A028]/30">
                {destinationStateName || destinationStateId}
              </span>
              <span className="text-xs text-[#0A2F25]/60 font-medium">
                {activeTab === 'places'
                  ? `${statePlaces.length} attractions available`
                  : `${destinationStateFoodVendors.length} authentic food stops in state`}
              </span>
            </div>
            <h3 className="font-serif font-bold text-xl text-[#0A2F25] mt-1">
              Add Places & Experiences to Itinerary
            </h3>
            <p className="text-xs text-[#0A2F25]/70">
              Browse authentic heritage monuments, cultural performances, and traditional food vendors.
            </p>
          </div>

          <button
            onClick={handleCloseClick}
            className="p-2 rounded-xl text-[#0A2F25]/60 hover:text-[#0A2F25] hover:bg-black/5 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Master Directory Mode Tabs */}
        <div className="flex border-b border-teal-900/10 px-6 bg-slate-50/70">
          <button
            type="button"
            onClick={() => setActiveTab('places')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'places'
                ? 'border-[#0A2F25] text-[#0A2F25]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#B88E18]" />
            <span>Heritage Attractions ({statePlaces.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('food')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'food'
                ? 'border-rose-600 text-rose-700'
                : 'border-transparent text-slate-500 hover:text-rose-600'
            }`}
          >
            <Utensils className="w-3.5 h-3.5 text-rose-600" />
            <span>Traditional Food Directory ({destinationStateFoodVendors.length})</span>
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
                placeholder={
                  activeTab === 'food'
                    ? 'Search food by dish, restaurant, address or keyword...'
                    : 'Search by place name, dish, locality, or keyword...'
                }
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

            {/* Scope / Category Controls */}
            {activeTab === 'places' ? (
              <div className="flex items-center gap-1.5 shrink-0">
                <Filter className="w-3.5 h-3.5 text-[#B88E18]" />
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    if (e.target.value === 'Food') {
                      setActiveTab('food');
                    } else {
                      setSelectedCategory(e.target.value);
                    }
                  }}
                  className="py-2 px-3 rounded-xl bg-[#F4F9F6] border border-teal-900/15 text-xs font-semibold text-[#0A2F25] focus:outline-hidden focus:border-[#C5A028] cursor-pointer"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setFoodStateScope('state')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    foodStateScope === 'state'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {destinationStateName || destinationStateId} ({destinationStateFoodVendors.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFoodStateScope('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    foodStateScope === 'all'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Malaysia ({allFoodVendors.length})
                </button>
              </div>
            )}
          </div>

          {/* Quick theme chips for Places Tab */}
          {activeTab === 'places' && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {CATEGORY_OPTIONS.map((c) => {
                const isSelected = selectedCategory === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      if (c.id === 'Food') {
                        setActiveTab('food');
                      } else {
                        setSelectedCategory(c.id);
                      }
                    }}
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
          )}
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {activeTab === 'places' ? (
            statePlaces.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <Sparkles className="w-8 h-8 text-[#B88E18]/50 mx-auto" />
                <p className="text-sm font-semibold text-[#0A2F25]">
                  No places match your search or filter
                </p>
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
                const matchedVendor = vendorByPlaceId.get(place.id);
                const isAlreadyAdded =
                  existingStopIds.has(place.id) ||
                  (matchedVendor ? existingStopIds.has(matchedVendor.id) : false);
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
                          <span>Added to Trip</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddPlace(place)}
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
            )
          ) : (
            /* Traditional Food Directory Tab */
            filteredFoodVendors.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <Utensils className="w-8 h-8 text-rose-500/50 mx-auto" />
                <p className="text-sm font-semibold text-[#0A2F25]">
                  No traditional food vendors match your search
                </p>
                <p className="text-xs text-[#0A2F25]/60">
                  Try switching to "All Malaysia" to view verified food stalls across other states.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setFoodStateScope('all');
                  }}
                  className="mt-2 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-700 hover:underline cursor-pointer"
                >
                  View All Malaysian Food Vendors
                </button>
              </div>
            ) : (
              filteredFoodVendors.map((vendor) => {
                const isAdded = isFoodVendorAdded(vendor);
                const isReview = vendor.verificationStatus === 'needs_review';

                return (
                  <div
                    key={vendor.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                      isAdded
                        ? 'bg-[#EBF5F0]/70 border-emerald-500/25'
                        : 'bg-white hover:bg-slate-50/70 border-teal-900/10 hover:border-rose-300 shadow-xs'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                            🍴 {vendor.state} • Traditional Food
                          </span>
                          {isReview ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                              ⚠️ Flagged Review
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                              ✓ Verified Location
                            </span>
                          )}
                        </div>

                        <h4 className="font-serif font-bold text-base text-[#0A2F25]">
                          {vendor.foodName}
                        </h4>
                        <p className="text-xs font-semibold text-rose-700">
                          {vendor.restaurantName}
                        </p>

                        <p className="text-xs text-[#0A2F25]/80 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                          {vendor.notes}
                        </p>

                        <div className="text-[11px] text-[#0A2F25]/70 flex items-start gap-1 pt-1">
                          <MapPin className="w-3.5 h-3.5 text-[#B88E18] shrink-0 mt-0.5" />
                          <span>{vendor.address}</span>
                        </div>

                        {vendor.nearbyAttractionNotes && (
                          <div className="text-[11px] text-emerald-900 bg-emerald-50/80 p-2 rounded-lg border border-emerald-200/60">
                            <strong>🏛️ Nearby Heritage: </strong>
                            {vendor.nearbyAttractionNotes}
                          </div>
                        )}

                        <div className="pt-1">
                          <a
                            href={vendor.googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 hover:text-rose-900 hover:underline"
                          >
                            <span>View on Google Maps</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>

                      <div className="sm:self-center shrink-0">
                        {isAdded ? (
                          <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-100/80 border border-emerald-300 text-emerald-900 text-xs font-bold shadow-xs">
                            <Check className="w-4 h-4 text-emerald-700" />
                            <span>Added to Trip</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddFoodVendor(vendor)}
                            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#0A2F25] hover:bg-[#0E3D31] text-white text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer group"
                          >
                            <Plus className="w-3.5 h-3.5 text-[#E5C05C] group-hover:rotate-90 transition-transform" />
                            <span>Add to Trip</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-teal-900/10 bg-[#F4F9F6] flex items-center justify-between gap-4">
          <p className="text-xs text-[#0A2F25]/70">
            {addedCount > 0
              ? `✨ ${addedCount} stop${addedCount > 1 ? 's' : ''} added! Click "Done" to automatically optimize the route sequence.`
              : activeTab === 'places'
              ? 'Added places automatically integrate into your itinerary and route timeline.'
              : 'Added food vendors place a marker on the map and calculate travel time into your itinerary.'}
          </p>
          <button
            type="button"
            onClick={handleDoneClick}
            className="px-5 py-2.5 rounded-xl bg-[#0A2F25] hover:bg-[#0E3D31] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E5C05C]" />
            <span>{addedCount > 0 ? `Done & Optimize Route (${addedCount})` : 'Done'}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
