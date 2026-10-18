import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, Footprints, Car, Clock, AlertCircle, MapPin, Navigation, Search, X, Loader2 } from 'lucide-react';
import { StateRecord, HeritagePlace, TransportMode, BudgetLevel } from '../../types';
import { PlannerOptions, HOTELS_BY_STATE, resolveStartingAnchor } from '../../lib/planner';
import { isCompactDistrict, getDefaultTransportMode, calculateHaversineDistanceKm } from '../../lib/routing';
import {
  searchCuratedDirectory,
  searchLiveNominatim,
  reverseGeocode,
  checkStartingPointState,
  StateValidationResult,
  GeocodeLocation,
} from '../../lib/geocoding';
import { StartingPointMismatchModal } from './StartingPointMismatchModal';

interface PlannerFormProps {
  states: StateRecord[];
  places: HeritagePlace[];
  onGenerate: (options: PlannerOptions) => void;
  isLoading?: boolean;
  initialStateId?: string;
  initialTransportMode?: TransportMode;
}

export const PlannerForm: React.FC<PlannerFormProps> = ({
  states,
  places,
  onGenerate,
  isLoading = false,
  initialStateId,
  initialTransportMode,
}) => {
  // Destination State
  const [destinationStateId, setDestinationStateId] = useState(() => {
    return initialStateId && initialStateId !== 'ALL' ? initialStateId : 'MLK';
  });

  // Starting Point & Departure Time
  const [startingInputText, setStartingInputText] = useState<string>('');
  const [startingPlaceId, setStartingPlaceId] = useState<string>('');
  const [startingPointName, setStartingPointName] = useState<string>('');
  const [startingCoordinates, setStartingCoordinates] = useState<[number, number] | undefined>(undefined);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState<boolean>(false);
  const [departureTime, setDepartureTime] = useState<string>('09:00');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [liveSuggestions, setLiveSuggestions] = useState<GeocodeLocation[]>([]);
  const [isLiveSearching, setIsLiveSearching] = useState<boolean>(false);

  // Mismatch Notification Modal State
  const [isMismatchModalOpen, setIsMismatchModalOpen] = useState<boolean>(false);
  const [mismatchValidation, setMismatchValidation] = useState<StateValidationResult | null>(null);
  const [pendingSubmitOptions, setPendingSubmitOptions] = useState<PlannerOptions | null>(null);
  const startingInputRef = React.useRef<HTMLInputElement | null>(null);

  // Track whether the user has explicitly selected a transport mode
  const [userSelectedMode, setUserSelectedMode] = useState<boolean>(false);

  // Initialize transport mode based on geographic spread of physical attractions (Walking or Car / Ride)
  const [transportMode, setTransportMode] = useState<TransportMode>(() => {
    if (initialTransportMode === 'car') return 'car';
    const targetState = initialStateId && initialStateId !== 'ALL' ? initialStateId : 'MLK';
    const def = getDefaultTransportMode(places, targetState);
    return def === 'car' ? 'car' : 'walking';
  });

  // When initialStateId changes from external controls
  useEffect(() => {
    if (initialStateId && initialStateId !== 'ALL') {
      setDestinationStateId(initialStateId);
      // Only adjust mode if user has NOT explicitly made an active selection
      if (!userSelectedMode) {
        const def = getDefaultTransportMode(places, initialStateId);
        setTransportMode(def === 'car' ? 'car' : 'walking');
      }
    }
  }, [initialStateId, places, userSelectedMode]);

  const handleDestinationStateChange = (newStateId: string) => {
    setDestinationStateId(newStateId);
    // Keep user's explicit choice if set; otherwise default based on state's geographic density
    if (!userSelectedMode) {
      const def = getDefaultTransportMode(places, newStateId);
      setTransportMode(def === 'car' ? 'car' : 'walking');
    }
  };

  const handleSelectMode = (mode: TransportMode) => {
    setTransportMode(mode);
    setUserSelectedMode(true);
  };

  const [availableHours, setAvailableHours] = useState(3.5);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'Living Tradition',
    'Architecture',
    'Colonial',
  ]);
  const [budgetLevel, setBudgetLevel] = useState<BudgetLevel>('flexible');
  const [showAllInterests, setShowAllInterests] = useState<boolean>(false);

  const activeState = states.find((s) => s.id === destinationStateId) || states[0];
  const isCompact = isCompactDistrict(places, destinationStateId);

  // Exactly 6 prominent cultural themes displayed initially
  const prominentInterestOptions = [
    'Living Tradition',
    'Architecture',
    'Colonial',
    'Religious',
    'Peranakan Heritage',
    'Craftsmanship',
  ];

  // All 9 underlying themes preserved in data
  const availableInterestOptions = [
    'Living Tradition',
    'Architecture',
    'Colonial',
    'Religious',
    'Peranakan Heritage',
    'Craftsmanship',
    'Maritime Trade',
    'Malay Sultanate',
    'Culinary Heritage',
  ];

  const displayedInterestOptions = showAllInterests
    ? availableInterestOptions
    : prominentInterestOptions;

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      if (selectedInterests.length > 1) {
        setSelectedInterests(selectedInterests.filter((i) => i !== interest));
      }
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  // Accurate time budget formatting helper
  const formatTimeBudget = (hours: number) => {
    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (m === 0) {
      return `${h} ${h === 1 ? 'hour' : 'hours'} (${totalMinutes} mins)`;
    }
    return `${h} ${h === 1 ? 'hr' : 'hrs'} ${m} mins (${totalMinutes} mins)`;
  };

  // Map between hours and slider percentage (0 to 100) so that 4.0h is exactly at the middle (50%) of the bar
  const hoursToSliderPos = (h: number): number => {
    if (h <= 1.5) return 0;
    if (h <= 4.0) {
      return ((h - 1.5) / 2.5) * 50;
    }
    return 50 + ((h - 4.0) / 4.0) * 50;
  };

  const sliderPosToHours = (pos: number): number => {
    if (pos <= 0) return 1.5;
    if (pos >= 100) return 8.0;
    if (pos <= 50) {
      const raw = 1.5 + (pos / 50) * 2.5;
      return Math.round(raw * 2) / 2;
    } else {
      const raw = 4.0 + ((pos - 50) / 50) * 4.0;
      return Math.round(raw * 2) / 2;
    }
  };

  const stateHotels = HOTELS_BY_STATE[destinationStateId] || [];
  const stateHeritagePlaces = places.filter(
    (p) => p.stateId === destinationStateId && p.latitude && p.longitude
  );

  // Debounced live geocoding search using OpenStreetMap Nominatim for any arbitrary Malaysian location
  useEffect(() => {
    const q = startingInputText.trim();
    if (q.length < 2) {
      setLiveSuggestions([]);
      setIsLiveSearching(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsLiveSearching(true);
      try {
        const results = await searchLiveNominatim(q, controller.signal);
        setLiveSuggestions(results);
      } catch {
        // Ignore aborted requests
      } finally {
        setIsLiveSearching(false);
      }
    }, 320);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [startingInputText]);

  const matchingSuggestions = useMemo(() => {
    const q = startingInputText.trim().toLowerCase();
    const results: GeocodeLocation[] = [];
    const seenCoords = new Set<string>();

    const addUnique = (item: GeocodeLocation) => {
      const key = `${item.coordinates[0].toFixed(4)},${item.coordinates[1].toFixed(4)}`;
      if (!seenCoords.has(key)) {
        seenCoords.add(key);
        results.push(item);
      }
    };

    // If query is empty, show top curated starting recommendations for this state
    if (!q) {
      stateHotels.slice(0, 3).forEach((h) => {
        if (h.latitude && h.longitude) {
          addUnique({
            name: h.name,
            subtitle: `${h.locality || 'Starting Location'} • ${h.category === 'transit' ? 'Transit Hub' : 'Accommodation'}`,
            placeId: h.placeId,
            category: (h.category as any) || 'stay',
            coordinates: [h.latitude, h.longitude],
          });
        }
      });
      stateHeritagePlaces.slice(0, 2).forEach((p) => {
        addUnique({
          name: p.name,
          subtitle: `${p.locality || 'Central Core'} • Heritage Landmark`,
          placeId: p.id,
          category: 'landmark',
          coordinates: [p.latitude!, p.longitude!],
        });
      });
      return results;
    }

    // 1. Instant Curated Directory (UTeM, UPM, UKM, UM, airports, major hubs)
    const curated = searchCuratedDirectory(q);
    curated.forEach((c) => addUnique(c));

    // 2. Filter state hotels
    stateHotels.forEach((h) => {
      if (h.latitude && h.longitude) {
        if (
          h.name.toLowerCase().includes(q) ||
          h.id.includes(q) ||
          (h.locality && h.locality.toLowerCase().includes(q))
        ) {
          addUnique({
            name: h.name,
            subtitle: `${h.locality || 'Starting Location'} • ${h.category === 'transit' ? 'Transit Hub' : 'Accommodation'}`,
            placeId: h.placeId,
            category: (h.category as any) || 'stay',
            coordinates: [h.latitude, h.longitude],
          });
        }
      }
    });

    // 3. Filter state heritage places
    stateHeritagePlaces.forEach((p) => {
      if (
        p.name.toLowerCase().includes(q) ||
        (p.locality && p.locality.toLowerCase().includes(q)) ||
        (p.malayName && p.malayName.toLowerCase().includes(q))
      ) {
        addUnique({
          name: p.name,
          subtitle: `${p.locality || 'Heritage Area'} • Historic Site`,
          placeId: p.id,
          category: 'landmark',
          coordinates: [p.latitude!, p.longitude!],
        });
      }
    });

    // 4. Live OpenStreetMap Nominatim Geocoding results
    liveSuggestions.forEach((item) => addUnique(item));

    return results.slice(0, 8);
  }, [startingInputText, stateHotels, stateHeritagePlaces, liveSuggestions]);

  const handleUseGPS = () => {
    if ('geolocation' in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          setIsLocating(false);
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          let closestId = '';
          let minDist = Infinity;
          stateHeritagePlaces.forEach((p) => {
            if (p.latitude && p.longitude) {
              const d = calculateHaversineDistanceKm(lat, lng, p.latitude, p.longitude);
              if (d < minDist) {
                minDist = d;
                closestId = p.id;
              }
            }
          });
          const pickedId = closestId || stateHeritagePlaces[0]?.id || '';
          setStartingPlaceId(pickedId);
          setStartingCoordinates([lat, lng]);

          // Reverse-geocode coordinates to real Malaysian address
          let displayName = 'My Current Location (GPS)';
          let addressFull = 'My Current Location (GPS Detected)';
          try {
            const geo = await reverseGeocode(lat, lng);
            if (geo) {
              displayName = geo.primaryName;
              addressFull = geo.fullAddress;
            }
          } catch {}

          setStartingInputText(displayName);
          setStartingPointName(addressFull);
          setIsSuggestionsOpen(false);

          // Check if detected GPS location is outside the destination state
          const validation = checkStartingPointState(
            [lat, lng],
            displayName,
            destinationStateId,
            stateHeritagePlaces
          );
          if (validation.isOutsideState) {
            setMismatchValidation(validation);
            setIsMismatchModalOpen(true);
          }
        },
        () => {
          setIsLocating(false);
          const fallback = stateHeritagePlaces[0];
          const fallbackId = fallback?.id || '';
          setStartingPlaceId(fallbackId);
          if (fallback?.latitude && fallback?.longitude) {
            setStartingCoordinates([fallback.latitude, fallback.longitude]);
          }
          setStartingInputText('Current Location');
          setStartingPointName('Current Location (Central Core)');
          setIsSuggestionsOpen(false);
        },
        { timeout: 8000 }
      );
    }
  };

  const handleReselectStartingPoint = () => {
    setIsMismatchModalOpen(false);
    setStartingInputText('');
    setStartingPlaceId('');
    setStartingPointName('');
    setStartingCoordinates(undefined);
    setTimeout(() => {
      startingInputRef.current?.focus();
      setIsSuggestionsOpen(true);
    }, 100);
  };

  const handleSwitchStateFromMismatch = (newStateId: string) => {
    handleDestinationStateChange(newStateId);
    setIsMismatchModalOpen(false);
  };

  const handleProceedAnyway = () => {
    setIsMismatchModalOpen(false);
    if (pendingSubmitOptions) {
      onGenerate(pendingSubmitOptions);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalStartId = startingPlaceId;
    let finalStartName = startingPointName || startingInputText.trim();
    let finalCoords = startingCoordinates;

    // If user typed freely without clicking a dropdown recommendation:
    if (!finalCoords && startingInputText.trim()) {
      const curated = searchCuratedDirectory(startingInputText.trim());
      if (curated.length > 0) {
        finalStartId = curated[0].placeId;
        finalStartName = curated[0].name;
        finalCoords = curated[0].coordinates;
      } else {
        const resolved = resolveStartingAnchor(startingInputText, destinationStateId, places);
        finalStartId = finalStartId || resolved.placeId;
        finalStartName = finalStartName || resolved.displayName;
        finalCoords = finalCoords || resolved.coordinates;
      }
    }

    const options: PlannerOptions = {
      destinationStateId,
      availableMinutes: Math.round(availableHours * 60),
      interests: selectedInterests,
      transportMode,
      budgetLevel,
      startingPlaceId: finalStartId || undefined,
      startingPointName: finalStartName || undefined,
      startingCoordinates: finalCoords,
      startTime: departureTime,
    };

    // Verify if selected starting point is outside destination state
    if (finalStartName && finalStartName !== 'Default State Core') {
      const validation = checkStartingPointState(
        finalCoords,
        finalStartName,
        destinationStateId,
        stateHeritagePlaces
      );

      if (validation.isOutsideState) {
        setMismatchValidation(validation);
        setPendingSubmitOptions(options);
        setIsMismatchModalOpen(true);
        return;
      }
    }

    onGenerate(options);
  };

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-teal-900/10 shadow-md shadow-teal-900/5">
      {/* Header */}
      <div className="pb-6 border-b border-teal-900/10 mb-6">
        <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#0A2F25]">
          Smart Cultural Itinerary Planner
        </h2>
        <p className="text-xs text-[#0A2F25]/70 mt-1">
          Explainable constraint-based routing adhering to authentic heritage time budgets
        </p>
      </div>

      {/* Custom Planning Form */}
      <form onSubmit={handleCustomSubmit} className="space-y-6">
        {/* Row 1: Destination State & Departure Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
          <div>
            <label className="block text-xs font-bold text-[#0A2F25] uppercase tracking-wider mb-2">
              Destination State
            </label>
            <select
              value={destinationStateId}
              onChange={(e) => handleDestinationStateChange(e.target.value)}
              className="w-full h-11 px-3.5 py-2.5 rounded-xl border border-teal-900/15 text-xs sm:text-sm font-semibold text-[#0A2F25] bg-white focus:outline-hidden focus:border-[#C5A028] focus:ring-1 focus:ring-[#C5A028] cursor-pointer shadow-xs transition-colors"
            >
              <option value="MLK">Melaka (Primary Showcase)</option>
              {states
                .filter((s) => s.id !== 'MLK')
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.region})
                  </option>
                ))}
            </select>
          </div>

          {/* Departure Time */}
          <div>
            <label className="block text-xs font-bold text-[#0A2F25] uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#087E83]" /> Departure Time
              </span>
              <span className="text-[10px] text-[#087E83] font-semibold">Start Hour</span>
            </label>
            <select
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              className="w-full h-11 px-3.5 py-2.5 rounded-xl border border-teal-900/15 text-xs sm:text-sm font-semibold text-[#0A2F25] bg-white focus:outline-hidden focus:border-[#C5A028] focus:ring-1 focus:ring-[#C5A028] cursor-pointer shadow-xs transition-colors"
            >
              <option value="07:00">07:00 AM (Early Explorer)</option>
              <option value="08:00">08:00 AM (Cool Morning)</option>
              <option value="08:30">08:30 AM</option>
              <option value="09:00">09:00 AM (Standard Departure)</option>
              <option value="09:30">09:30 AM</option>
              <option value="10:00">10:00 AM (Mid-Morning)</option>
              <option value="10:30">10:30 AM</option>
              <option value="11:00">11:00 AM (Late Morning)</option>
              <option value="12:00">12:00 PM (Noon / Lunch Start)</option>
              <option value="13:00">01:00 PM (Afternoon Tour)</option>
              <option value="14:00">02:00 PM</option>
              <option value="15:00">03:00 PM (Late Afternoon)</option>
              <option value="17:00">05:00 PM (Sunset / Night Showcase)</option>
            </select>
          </div>
        </div>

        {/* Row 2: Starting Point & Time Budget */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
          {/* Starting Point (Free Input with Live Recommendations) */}
          <div className="relative">
            <label className="block text-xs font-bold text-[#0A2F25] uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#B88E18]" /> Starting Point
              </span>
              <span className="text-[10px] text-[#087E83] font-semibold">
                {isLocating ? 'Locating...' : 'Tour Origin (S)'}
              </span>
            </label>

            <div className="relative">
              <div className="flex items-center h-11 rounded-xl border border-teal-900/15 bg-white overflow-hidden shadow-xs focus-within:border-[#C5A028] focus-within:ring-1 focus-within:ring-[#C5A028] transition-colors">
                <div className="pl-3.5 pr-2 text-slate-400 shrink-0">
                  <Search className="w-4 h-4 text-[#087E83]" />
                </div>
                <input
                  ref={startingInputRef}
                  type="text"
                  value={startingInputText}
                  onChange={(e) => {
                    setStartingInputText(e.target.value);
                    setIsSuggestionsOpen(true);
                    setStartingPlaceId('');
                    setStartingPointName('');
                    setStartingCoordinates(undefined);
                  }}
                  onFocus={() => setIsSuggestionsOpen(true)}
                  placeholder="Type campus, hotel, or address (e.g. UTeM, Hatten, Sentral)..."
                  className="w-full h-full pr-2 text-xs sm:text-sm font-medium text-[#0A2F25] bg-transparent focus:outline-hidden truncate"
                />
                {startingInputText && (
                  <button
                    type="button"
                    onClick={() => {
                      setStartingInputText('');
                      setStartingPlaceId('');
                      setStartingPointName('');
                      setStartingCoordinates(undefined);
                      setIsSuggestionsOpen(false);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-600 mr-1 cursor-pointer transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleUseGPS}
                  title="Use my current GPS location as starting point"
                  className="h-full px-3.5 text-[#087E83] hover:bg-[#EBF5F0] border-l border-teal-900/10 flex items-center gap-1.5 text-xs font-bold cursor-pointer shrink-0 transition-colors"
                >
                  <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">GPS</span>
                </button>
              </div>

              {/* Inline Mismatch Hint if recognized outside destination state */}
              {startingInputText && !isSuggestionsOpen && (() => {
                const check = checkStartingPointState(
                  startingCoordinates,
                  startingPointName || startingInputText,
                  destinationStateId,
                  stateHeritagePlaces
                );
                if (check.isOutsideState) {
                  return (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-amber-800 bg-amber-50 border border-amber-200/90 px-2 py-1 rounded-lg">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>
                        Outside {check.destinationStateName}{' '}
                        {check.detectedStateName ? `(in ${check.detectedStateName})` : ''} • ~{check.distanceKm} km away
                      </span>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Autocomplete Suggestions dropdown */}
              {isSuggestionsOpen && matchingSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl border border-teal-900/15 shadow-xl max-h-56 overflow-y-auto z-50 py-1 divide-y divide-teal-900/5">
                  <div className="px-3 py-1 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>{startingInputText ? 'Recommendations' : 'Suggested Starting Points'}</span>
                    {isLiveSearching && (
                      <span className="flex items-center gap-1 text-[10px] text-[#087E83] font-normal normal-case">
                        <Loader2 className="w-3 h-3 animate-spin" /> Searching...
                      </span>
                    )}
                  </div>
                  {matchingSuggestions.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setStartingInputText(item.name);
                        setStartingPlaceId(item.placeId);
                        setStartingPointName(item.name);
                        setStartingCoordinates(item.coordinates);
                        setIsSuggestionsOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-xs text-[#0A2F25] hover:bg-[#EBF5F0] flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <div className="w-6 h-6 rounded-lg bg-teal-900/5 flex items-center justify-center shrink-0">
                        {item.category === 'campus' && <span className="text-xs" title="University / Campus">🎓</span>}
                        {item.category === 'stay' && <span className="text-xs" title="Accommodation">🏢</span>}
                        {item.category === 'transit' && <span className="text-xs" title="Transit Station">🚆</span>}
                        {item.category === 'landmark' && <span className="text-xs" title="Heritage Landmark">🏛️</span>}
                        {item.category === 'address' && <span className="text-xs" title="Address Location">📍</span>}
                        {item.category === 'gps' && <span className="text-xs" title="GPS Location">🛰️</span>}
                      </div>
                      <div className="min-w-0 flex-1 truncate">
                        <span className="font-semibold block truncate text-[#0A2F25]">{item.name}</span>
                        <span className="text-[10px] text-slate-400 block truncate">{item.subtitle}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Time Budget */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-[#0A2F25] uppercase tracking-wider">
                Time Budget
              </label>
              <span className="text-xs font-bold text-[#087E83] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {formatTimeBudget(availableHours)}
              </span>
            </div>
            <div className="h-11 flex flex-col justify-center px-1">
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={hoursToSliderPos(availableHours)}
                onChange={(e) => setAvailableHours(sliderPosToHours(parseFloat(e.target.value)))}
                className="w-full accent-[#0A2F25] cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-[#0A2F25]/60 mt-1 font-medium">
                <span>1.5h</span>
                <span>4.0h</span>
                <span>8.0h</span>
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Cultural Interests & Themes */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-[#0A2F25] uppercase tracking-wider">
              Cultural Interests & Themes
            </label>
            <button
              type="button"
              onClick={() => setShowAllInterests(!showAllInterests)}
              className="text-[11px] font-semibold text-[#087E83] hover:text-[#0A2F25] transition-colors cursor-pointer"
            >
              {showAllInterests ? 'Show Fewer (6)' : '+3 More Themes'}
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {displayedInterestOptions.map((interest) => {
              const isChecked = selectedInterests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-medium transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                    isChecked
                      ? 'bg-[#0A2F25] text-white shadow-xs font-semibold ring-1 ring-[#0A2F25]'
                      : 'bg-white text-[#0A2F25]/80 hover:bg-[#EBF5F0] hover:text-[#0A2F25] border border-teal-900/15'
                  }`}
                >
                  <span>{isChecked ? '✓' : '+'}</span>
                  <span className="truncate">{interest}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 4: Transport Mode & Budget Sensitivity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6 pt-1">
          {/* Transport Mode */}
          <div>
            <label className="block text-xs font-bold text-[#0A2F25] uppercase tracking-wider mb-2">
              Transport Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSelectMode('walking')}
                className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-medium border flex items-center justify-center gap-2 transition-all cursor-pointer text-center ${
                  transportMode === 'walking'
                    ? 'border-[#0A2F25] bg-[#EBF5F0] text-[#0A2F25] font-semibold ring-1 ring-[#0A2F25]/30 shadow-xs'
                    : 'border-teal-900/15 bg-white text-[#0A2F25]/70 hover:bg-[#EBF5F0]'
                }`}
              >
                <Footprints className="w-4 h-4 text-[#B88E18] shrink-0" />
                <span>Walking</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectMode('car')}
                className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-medium border flex items-center justify-center gap-2 transition-all cursor-pointer text-center ${
                  transportMode === 'car'
                    ? 'border-[#0A2F25] bg-[#EBF5F0] text-[#0A2F25] font-semibold ring-1 ring-[#0A2F25]/30 shadow-xs'
                    : 'border-teal-900/15 bg-white text-[#0A2F25]/70 hover:bg-[#EBF5F0]'
                }`}
              >
                <Car className="w-4 h-4 text-[#B88E18] shrink-0" />
                <span>Car / Ride</span>
              </button>
            </div>

            {/* Contextual Guidance Notes */}
            {isCompact && transportMode === 'car' && (
              <div className="mt-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Compact Heritage District: </strong> Sights in {activeState?.name || 'this state'} are clustered within walking distance (&le; 4 km). Driving may encounter one-way streets, pedestrian zones, and limited parking around historic monuments. Walking is recommended.
                </p>
              </div>
            )}

            {!isCompact && transportMode === 'walking' && (
              <div className="mt-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Dispersed Heritage Sites: </strong> Attractions in {activeState?.name || 'this state'} span wider road distances (&gt; 4 km). Walking between distant locations is not practical; driving or ride-hailing is recommended.
                </p>
              </div>
            )}

            {transportMode === 'walking' && (
              <p className="text-[11px] text-[#0A2F25]/60 mt-1.5 flex items-center gap-1">
                <Footprints className="w-3.5 h-3.5 text-[#B88E18]" />
                Walking times calibrated at a realistic 4.5 km/h pedestrian pace.
              </p>
            )}
          </div>

          {/* Budget Sensitivity */}
          <div>
            <label className="block text-xs font-bold text-[#0A2F25] uppercase tracking-wider mb-2">
              Budget Sensitivity
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setBudgetLevel('low')}
                className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-medium border transition-all text-center cursor-pointer ${
                  budgetLevel === 'low'
                    ? 'border-[#0A2F25] bg-[#EBF5F0] text-[#0A2F25] font-semibold ring-1 ring-[#0A2F25]/30 shadow-xs'
                    : 'border-teal-900/15 bg-white text-[#0A2F25]/70 hover:bg-[#EBF5F0]'
                }`}
              >
                Free / Low
              </button>
              <button
                type="button"
                onClick={() => setBudgetLevel('flexible')}
                className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-medium border transition-all text-center cursor-pointer ${
                  budgetLevel === 'flexible'
                    ? 'border-[#0A2F25] bg-[#EBF5F0] text-[#0A2F25] font-semibold ring-1 ring-[#0A2F25]/30 shadow-xs'
                    : 'border-teal-900/15 bg-white text-[#0A2F25]/70 hover:bg-[#EBF5F0]'
                }`}
              >
                Flexible
              </button>
            </div>
            <p className="text-[11px] text-[#0A2F25]/50 mt-2">
              *Unknown entry fees are preserved rather than assumed zero.
            </p>
          </div>
        </div>

        {/* Row 5: Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 px-6 rounded-2xl bg-[#0A2F25] hover:bg-[#0E3D31] text-white font-bold text-sm sm:text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#E5C05C]" />
          <span>{isLoading ? 'Optimizing Itinerary...' : 'Generate Customized Itinerary'}</span>
        </button>
      </form>

      {/* Starting Point State Mismatch Modal Notification */}
      <StartingPointMismatchModal
        isOpen={isMismatchModalOpen}
        validation={mismatchValidation}
        onReselect={handleReselectStartingPoint}
        onSwitchState={handleSwitchStateFromMismatch}
        onProceedAnyway={handleProceedAnyway}
        onClose={() => setIsMismatchModalOpen(false)}
      />
    </div>
  );
};
