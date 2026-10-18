import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  Sparkles,
  Bookmark,
  Trash2,
  Footprints,
  Car,
  Bus,
  Bike,
  ShieldCheck,
  AlertCircle,
  Printer,
  Plus,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Sun,
  Sunset,
  Moon,
  Leaf,
  RotateCcw,
  Compass,
  Camera,
  Check,
  MapPin,
  Search,
  Navigation,
  X,
  Loader2,
  Utensils,
} from 'lucide-react';
import { Itinerary, HeritagePlace, TransportMode, TimeWindow } from '../../types';
import {
  isCompactDistrict,
  calculateHaversineDistanceKm,
  isHeritageZoneLeg,
  recalculateItineraryLocally,
  solveSoftTimeWindowTSP,
} from '../../lib/routing';
import { reorderItineraryStops, HOTELS_BY_STATE, resolveStartingAnchor } from '../../lib/planner';
import {
  searchCuratedDirectory,
  searchLiveNominatim,
  reverseGeocode,
  checkStartingPointState,
  StateValidationResult,
  GeocodeLocation,
} from '../../lib/geocoding';
import { AddPlaceModal } from './AddPlaceModal';
import { StartingPointMismatchModal } from './StartingPointMismatchModal';
import { isFoodVendorStopId, vendorByPlaceId } from '../../lib/foodVendors';

interface ItineraryTimelineProps {
  itinerary: Itinerary;
  allPlaces: HeritagePlace[];
  onSelectPlace: (place: HeritagePlace) => void;
  onRemoveStop: (order: number) => void;
  onSaveItinerary: () => void;
  onInspectAI: () => void;
  isSaved?: boolean;
  onAddPlace?: (place: HeritagePlace) => void;
  onUpdateItinerary?: (itinerary: Itinerary) => void;
}

export const ItineraryTimeline: React.FC<ItineraryTimelineProps> = ({
  itinerary,
  allPlaces,
  onSelectPlace,
  onRemoveStop,
  onSaveItinerary,
  onInspectAI,
  isSaved = false,
  onAddPlace,
  onUpdateItinerary,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [initialAddModalTab, setInitialAddModalTab] = useState<'places' | 'food'>('places');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [timelineStartingInput, setTimelineStartingInput] = useState<string>(
    itinerary.startingPointName || ''
  );
  const [isTimelineSuggestionsOpen, setIsTimelineSuggestionsOpen] = useState(false);
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [timelineLiveSuggestions, setTimelineLiveSuggestions] = useState<GeocodeLocation[]>([]);
  const [isTimelineSearching, setIsTimelineSearching] = useState(false);

  // Mismatch Modal State
  const [isMismatchModalOpen, setIsMismatchModalOpen] = useState(false);
  const [mismatchValidation, setMismatchValidation] = useState<StateValidationResult | null>(null);
  const [pendingLocation, setPendingLocation] = useState<{
    anchorId: string;
    displayName: string;
    coords?: [number, number];
  } | null>(null);
  const timelineInputRef = React.useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (itinerary.startingPointName) {
      setTimelineStartingInput(itinerary.startingPointName);
    }
  }, [itinerary.startingPointName]);

  // Debounced live geocoding search using OpenStreetMap Nominatim for arbitrary timeline starting locations
  useEffect(() => {
    const q = timelineStartingInput.trim();
    if (q.length < 2) {
      setTimelineLiveSuggestions([]);
      setIsTimelineSearching(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsTimelineSearching(true);
      try {
        const results = await searchLiveNominatim(q, controller.signal);
        setTimelineLiveSuggestions(results);
      } catch {
        // Ignore aborted requests
      } finally {
        setIsTimelineSearching(false);
      }
    }, 320);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [timelineStartingInput]);

  const placeMap = useMemo(() => {
    const map = new Map<string, HeritagePlace>();
    allPlaces.forEach((p) => {
      map.set(p.id, p);
      const vendor = vendorByPlaceId.get(p.id);
      if (vendor) {
        map.set(vendor.id, p);
      }
    });
    return map;
  }, [allPlaces]);
  const startTime = itinerary.startTime || '09:00';

  // Map physical places to consecutive 1-indexed pin numbers matching map markers
  const physicalPinMap = new Map<string, number>();
  let physicalPinCounter = 1;
  itinerary.stops.forEach((stop) => {
    const p = placeMap.get(stop.placeId);
    if (
      p &&
      typeof p.latitude === 'number' &&
      typeof p.longitude === 'number' &&
      !isNaN(p.latitude) &&
      !isNaN(p.longitude)
    ) {
      const isFood = isFoodVendorStopId(stop.placeId) || p.type === 'food';
      if (!isFood) {
        if (!physicalPinMap.has(p.id)) {
          physicalPinMap.set(p.id, physicalPinCounter++);
        }
      }
    }
  });

  // Calculate admission total
  let totalAdmissionCost = 0;
  let hasUnverifiedFees = false;
  itinerary.stops.forEach((stop) => {
    const place = placeMap.get(stop.placeId);
    if (place) {
      if (place.estimatedCostMYR !== null && place.estimatedCostMYR !== undefined) {
        totalAdmissionCost += place.estimatedCostMYR;
      } else {
        hasUnverifiedFees = true;
      }
    }
  });

  // Time format helper
  const formatMinutes = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const getTransportIcon = (mode: string) => {
    switch (mode) {
      case 'car':
        return <Car className="w-4 h-4 text-emerald-700" />;
      case 'public_transport':
        return <Bus className="w-4 h-4 text-purple-700" />;
      case 'mixed':
        return <Bike className="w-4 h-4 text-amber-700" />;
      default:
        return <Footprints className="w-4 h-4 text-[#087E83]" />;
    }
  };

  const getTimeWindowBadge = (win?: TimeWindow) => {
    switch (win) {
      case 'morning':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Sun className="w-3 h-3 text-amber-600" /> Morning
          </span>
        );
      case 'afternoon':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <Sun className="w-3 h-3 text-blue-600" /> Afternoon
          </span>
        );
      case 'night':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-900 border border-indigo-200">
            <Moon className="w-3 h-3 text-indigo-600" /> Evening / Night
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Clock className="w-3 h-3 text-emerald-600" /> Anytime
          </span>
        );
    }
  };

  // Local reorder handler via HTML5 Drag and Drop (No global TSP recalculation - Zero Lag)
  const handleDrop = (targetIdx: number) => {
    if (draggedIndex === null || draggedIndex === targetIdx) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    const updated = reorderItineraryStops(itinerary, allPlaces, draggedIndex, targetIdx);
    if (onUpdateItinerary) {
      onUpdateItinerary(updated);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Move Up / Move Down buttons for accessible / touch reordering
  const handleMoveStop = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= itinerary.stops.length) return;
    const updated = reorderItineraryStops(itinerary, allPlaces, fromIdx, toIdx);
    if (onUpdateItinerary) {
      onUpdateItinerary(updated);
    }
  };

  // Global Transport Mode change handler (Local recalculation)
  const handleGlobalTransportModeChange = (newMode: TransportMode) => {
    const { updatedStops, totalVisitMinutes, totalTravelMinutes, totalPlannedMinutes } =
      recalculateItineraryLocally(itinerary.stops, allPlaces, newMode, startTime);

    if (onUpdateItinerary) {
      onUpdateItinerary({
        ...itinerary,
        transportMode: newMode,
        stops: updatedStops,
        totalVisitMinutes,
        totalTravelMinutes,
        totalPlannedMinutes,
        updatedAt: new Date().toISOString(),
        isCustomized: true,
      });
    }
  };

  // Segment-specific Transport Mode override (e.g., Walk or Drive for a heritage leg)
  const handleSegmentModeChange = (stopIndex: number, mode: TransportMode) => {
    const newStops = [...itinerary.stops];
    newStops[stopIndex] = {
      ...newStops[stopIndex],
      segmentTransportMode: mode,
    };

    const { updatedStops, totalVisitMinutes, totalTravelMinutes, totalPlannedMinutes } =
      recalculateItineraryLocally(newStops, allPlaces, itinerary.transportMode, startTime);

    if (onUpdateItinerary) {
      onUpdateItinerary({
        ...itinerary,
        stops: updatedStops,
        totalVisitMinutes,
        totalTravelMinutes,
        totalPlannedMinutes,
        updatedAt: new Date().toISOString(),
        isCustomized: true,
      });
    }
  };

  // Handle start / departure time change with zero-lag local recalculation
  const handleStartTimeChange = (newStartTime: string) => {
    const { updatedStops, totalVisitMinutes, totalTravelMinutes, totalPlannedMinutes } =
      recalculateItineraryLocally(itinerary.stops, allPlaces, itinerary.transportMode, newStartTime);

    if (onUpdateItinerary) {
      onUpdateItinerary({
        ...itinerary,
        startTime: newStartTime,
        stops: updatedStops,
        totalVisitMinutes,
        totalTravelMinutes,
        totalPlannedMinutes,
        updatedAt: new Date().toISOString(),
        isCustomized: true,
      });
    }
  };

  // Set / Change Tour Starting Point
  const handleSetStartingPoint = (targetPlaceId: string, customName?: string, customCoords?: [number, number]) => {
    const itineraryPlaces = itinerary.stops
      .map((s) => placeMap.get(s.placeId))
      .filter((p): p is HeritagePlace => !!p);

    if (itineraryPlaces.length <= 1) return;

    const { sortedPlaces, xaiRationale } = solveSoftTimeWindowTSP(
      itineraryPlaces,
      targetPlaceId,
      itinerary.transportMode
    );

    const reorderedStops = sortedPlaces.map((p, idx) => {
      const existing = itinerary.stops.find((s) => s.placeId === p.id);
      return {
        placeId: p.id,
        order: idx + 1,
        visitDurationMinutes: p.visitDurationMinutes || existing?.visitDurationMinutes || 45,
        routeDataStatus: existing?.routeDataStatus || 'estimated',
        reasonSelected: existing?.reasonSelected || 'Sequenced from starting point.',
        preferredTimeWindow: p.preferredTimeWindow || existing?.preferredTimeWindow,
        segmentTransportMode: existing?.segmentTransportMode,
      };
    });

    const { updatedStops, totalVisitMinutes, totalTravelMinutes, totalPlannedMinutes } =
      recalculateItineraryLocally(reorderedStops, allPlaces, itinerary.transportMode, startTime);

    const displayName = customName || placeMap.get(targetPlaceId)?.name || 'Starting Point';
    const coords: [number, number] | undefined =
      customCoords ||
      (() => {
        const p = placeMap.get(targetPlaceId);
        return p && typeof p.latitude === 'number' && typeof p.longitude === 'number'
          ? [p.latitude, p.longitude]
          : undefined;
      })();

    if (onUpdateItinerary) {
      onUpdateItinerary({
        ...itinerary,
        startingPlaceId: targetPlaceId,
        startingPointName: displayName,
        startingCoordinates: coords,
        stops: updatedStops,
        totalVisitMinutes,
        totalTravelMinutes,
        totalPlannedMinutes,
        xaiRationale,
        updatedAt: new Date().toISOString(),
        isCustomized: true,
      });
    }
  };

  // GPS Current Location Anchor Handler
  const handleUseGPSAnchor = () => {
    if ('geolocation' in navigator) {
      setIsLocatingGPS(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          setIsLocatingGPS(false);
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          let closestId = itinerary.stops[0]?.placeId || '';
          let minDist = Infinity;
          itinerary.stops.forEach((s) => {
            const p = placeMap.get(s.placeId);
            if (p && p.latitude && p.longitude) {
              const d = calculateHaversineDistanceKm(lat, lng, p.latitude, p.longitude);
              if (d < minDist) {
                minDist = d;
                closestId = p.id;
              }
            }
          });

          let displayName = 'My Current Location (GPS)';
          try {
            const geo = await reverseGeocode(lat, lng);
            if (geo) {
              displayName = geo.primaryName;
            }
          } catch {}

          // Check if outside destination state
          const validation = checkStartingPointState(
            [lat, lng],
            displayName,
            itinerary.destinationStateId,
            allPlaces
          );

          if (validation.isOutsideState) {
            setMismatchValidation(validation);
            setPendingLocation({
              anchorId: closestId,
              displayName,
              coords: [lat, lng],
            });
            setIsMismatchModalOpen(true);
            return;
          }

          handleSetStartingPoint(closestId, displayName, [lat, lng]);
          setTimelineStartingInput(displayName);
          setIsTimelineSuggestionsOpen(false);
        },
        () => {
          setIsLocatingGPS(false);
          const fallback = itinerary.stops[0];
          const fallbackPlace = fallback ? placeMap.get(fallback.placeId) : undefined;
          const fallbackCoords = fallbackPlace?.latitude && fallbackPlace?.longitude ? [fallbackPlace.latitude, fallbackPlace.longitude] as [number, number] : undefined;
          handleSetStartingPoint(fallback?.placeId || '', 'Current Location', fallbackCoords);
          setTimelineStartingInput('Current Location');
          setIsTimelineSuggestionsOpen(false);
        },
        { timeout: 8000 }
      );
    }
  };

  const stateHotels = HOTELS_BY_STATE[itinerary.destinationStateId] || [];

  // Autocomplete recommendations as user types or focuses their starting point
  const timelineSuggestions = useMemo(() => {
    const q = timelineStartingInput.trim().toLowerCase();
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
      allPlaces
        .filter((p) => p.stateId === itinerary.destinationStateId && p.latitude && p.longitude)
        .slice(0, 2)
        .forEach((p) => {
          addUnique({
            name: p.name,
            subtitle: `${p.locality || 'Central Core'} • Landmark`,
            placeId: p.id,
            category: 'landmark',
            coordinates: [p.latitude!, p.longitude!],
          });
        });
      return results;
    }

    // 1. Instant curated directory (UTeM, UPM, UKM, UM, airports, major hubs)
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
    allPlaces.forEach((p) => {
      if (
        p.stateId === itinerary.destinationStateId &&
        p.latitude &&
        p.longitude &&
        (p.name.toLowerCase().includes(q) ||
          (p.locality && p.locality.toLowerCase().includes(q)) ||
          (p.malayName && p.malayName.toLowerCase().includes(q)))
      ) {
        addUnique({
          name: p.name,
          subtitle: `${p.locality || 'Heritage Site'} • Landmark`,
          placeId: p.id,
          category: 'landmark',
          coordinates: [p.latitude!, p.longitude!],
        });
      }
    });

    // 4. Live OpenStreetMap Nominatim suggestions
    timelineLiveSuggestions.forEach((item) => addUnique(item));

    return results.slice(0, 8);
  }, [timelineStartingInput, stateHotels, allPlaces, itinerary.destinationStateId, timelineLiveSuggestions]);

  // Apply typed starting location
  const handleApplyTimelineStartingInput = (
    typedText: string,
    specificPlaceId?: string,
    specificCoordinates?: [number, number]
  ) => {
    if (!typedText.trim()) return;
    let anchorId = specificPlaceId;
    let displayName = typedText.trim();
    let coords = specificCoordinates;

    if (!anchorId || !coords) {
      const curated = searchCuratedDirectory(typedText);
      if (curated.length > 0) {
        anchorId = curated[0].placeId;
        displayName = curated[0].name;
        coords = curated[0].coordinates;
      } else {
        const resolved = resolveStartingAnchor(typedText, itinerary.destinationStateId, allPlaces);
        if (!anchorId) anchorId = resolved.placeId;
        if (!displayName || displayName === typedText.trim()) displayName = resolved.displayName;
        if (!coords) coords = resolved.coordinates;
      }
    }

    // Validate if outside destination state
    const validation = checkStartingPointState(
      coords,
      displayName,
      itinerary.destinationStateId,
      allPlaces
    );

    if (validation.isOutsideState) {
      setMismatchValidation(validation);
      setPendingLocation({
        anchorId: anchorId || itinerary.stops[0]?.placeId || '',
        displayName,
        coords,
      });
      setIsMismatchModalOpen(true);
      return;
    }

    handleSetStartingPoint(anchorId || itinerary.stops[0]?.placeId || '', displayName, coords);
    setTimelineStartingInput(displayName);
    setIsTimelineSuggestionsOpen(false);
  };

  const handleReselectTimelineStartingPoint = () => {
    setIsMismatchModalOpen(false);
    setTimelineStartingInput('');
    setTimeout(() => {
      timelineInputRef.current?.focus();
      setIsTimelineSuggestionsOpen(true);
    }, 100);
  };

  const handleProceedAnywayTimeline = () => {
    setIsMismatchModalOpen(false);
    if (pendingLocation) {
      handleSetStartingPoint(
        pendingLocation.anchorId,
        pendingLocation.displayName,
        pendingLocation.coords
      );
      setTimelineStartingInput(pendingLocation.displayName);
      setIsTimelineSuggestionsOpen(false);
    }
  };

  // 2-Opt TSP Auto-Optimization starting from anchored location
  const handleAutoOptimizeTSP = () => {
    const itineraryPlaces = itinerary.stops
      .map((s) => placeMap.get(s.placeId))
      .filter((p): p is HeritagePlace => !!p);

    if (itineraryPlaces.length <= 1) return;

    const startId = itinerary.startingPlaceId || itinerary.stops[0]?.placeId || itineraryPlaces[0].id;
    const { sortedPlaces, xaiRationale } = solveSoftTimeWindowTSP(
      itineraryPlaces,
      startId,
      itinerary.transportMode
    );

    // Map sorted places back into ItineraryStop objects
    const reorderedStops = sortedPlaces.map((p, idx) => {
      const existing = itinerary.stops.find((s) => s.placeId === p.id);
      return {
        placeId: p.id,
        order: idx + 1,
        visitDurationMinutes: p.visitDurationMinutes || existing?.visitDurationMinutes || 45,
        routeDataStatus: existing?.routeDataStatus || 'estimated',
        reasonSelected: existing?.reasonSelected || 'Optimized by 2-Opt TSP.',
        preferredTimeWindow: p.preferredTimeWindow || existing?.preferredTimeWindow,
        segmentTransportMode: existing?.segmentTransportMode,
      };
    });

    const { updatedStops, totalVisitMinutes, totalTravelMinutes, totalPlannedMinutes } =
      recalculateItineraryLocally(reorderedStops, allPlaces, itinerary.transportMode, startTime);

    if (onUpdateItinerary) {
      onUpdateItinerary({
        ...itinerary,
        startingPlaceId: startId,
        startingPointName: placeMap.get(startId)?.name,
        stops: updatedStops,
        totalVisitMinutes,
        totalTravelMinutes,
        totalPlannedMinutes,
        xaiRationale,
        updatedAt: new Date().toISOString(),
        isCustomized: true,
      });
    }
  };

  // Dynamic Time Budget metrics
  const budgetRatio = itinerary.availableMinutes > 0
    ? Math.min(100, Math.round((itinerary.totalPlannedMinutes / itinerary.availableMinutes) * 100))
    : 100;
  const isOverBudget = itinerary.totalPlannedMinutes > itinerary.availableMinutes;
  const visitRatio = itinerary.availableMinutes > 0
    ? Math.min(100, Math.round((itinerary.totalVisitMinutes / itinerary.availableMinutes) * 100))
    : 50;
  const travelRatio = itinerary.availableMinutes > 0
    ? Math.min(100 - visitRatio, Math.round((itinerary.totalTravelMinutes / itinerary.availableMinutes) * 100))
    : 20;

  return (
    <div className="bg-white/85 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-teal-900/10 shadow-md shadow-teal-900/5 space-y-6">
      {/* Top Header & Metrics Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-teal-900/10">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EBF5F0] text-[#0A2F25] border border-teal-900/10">
              {itinerary.destinationStateId} Cultural Plan
            </span>
            <span className="flex items-center gap-1 text-xs text-[#087E83] font-semibold bg-[#087E83]/10 px-2 py-0.5 rounded-full border border-[#087E83]/20">
              <ShieldCheck className="w-3.5 h-3.5 text-[#087E83]" /> Smart TSP Engine
            </span>
            {itinerary.isCustomized && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100/70 text-amber-800 border border-amber-300">
                Customized Order
              </span>
            )}
          </div>
          <h2 className="font-serif font-bold text-2xl text-[#0A2F25]">
            {itinerary.title}
          </h2>
          <p className="text-xs text-[#0A2F25]/70 mt-1">
            Optimized route balancing cultural authenticity, visit depth, and road transit feasibility
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Auto-Optimize Route Action */}
          <button
            onClick={handleAutoOptimizeTSP}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#EBF5F0] text-[#0A2F25] hover:bg-emerald-100/80 border border-teal-900/15 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer group"
            title="Sort places using Nearest Neighbor TSP & Soft Time Windows (Morning → Afternoon → Night)"
          >
            <Compass className="w-4 h-4 text-[#087E83] group-hover:rotate-45 transition-transform" />
            <span>Auto-Optimize Route</span>
          </button>
          <button
            onClick={onInspectAI}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#087E83]/10 text-[#087E83] hover:bg-[#087E83]/20 border border-[#087E83]/30 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Inspect cultural constraints and excluded assumptions"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#087E83]" />
            <span>Inspect AI Reasoning</span>
          </button>

          <button
            onClick={() => window.print()}
            className="p-2 text-xs font-semibold rounded-xl bg-white hover:bg-black/5 text-[#0A2F25] border border-teal-900/15 transition-colors cursor-pointer"
            title="Print Itinerary"
          >
            <Printer className="w-4 h-4 text-[#0A2F25]/70" />
          </button>

          <button
            onClick={onSaveItinerary}
            className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
              isSaved
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                : 'bg-[#0A2F25] text-white hover:bg-[#0E3D31]'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'text-emerald-700' : 'text-[#E5C05C]'}`} />
            <span>{isSaved ? 'Saved to Browser' : 'Save Itinerary'}</span>
          </button>
        </div>
      </div>

      {/* Dynamic Time Budgeting & Multi-Mode Transport Bar */}
      <div className="p-5 rounded-2xl bg-white border border-teal-900/10 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#996F09]">
                Dynamic Time Budget
              </span>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  isOverBudget
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}
              >
                {isOverBudget
                  ? `+${formatMinutes(itinerary.totalPlannedMinutes - itinerary.availableMinutes)} Over Budget`
                  : `${formatMinutes(itinerary.availableMinutes - itinerary.totalPlannedMinutes)} Buffer Remaining`}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-extrabold text-[#0A2F25]">
                {formatMinutes(itinerary.totalPlannedMinutes)}
              </span>
              <span className="text-xs text-[#0A2F25]/60 font-semibold">
                of {formatMinutes(itinerary.availableMinutes)} target budget ({budgetRatio}%)
              </span>
            </div>
          </div>

          {/* Real-Time Transport Mode Selector */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#F4F9F6] border border-teal-900/10 self-start sm:self-center">
            <span className="text-[10px] font-bold text-[#0A2F25]/60 px-2 uppercase tracking-wider hidden sm:inline">
              Mode:
            </span>
            <button
              type="button"
              onClick={() => handleGlobalTransportModeChange('walking')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                itinerary.transportMode === 'walking'
                  ? 'bg-[#0A2F25] text-white shadow-xs'
                  : 'text-[#0A2F25]/70 hover:text-[#0A2F25] hover:bg-white'
              }`}
              title="Pedestrian Pace (4.5 km/h, 1.2x road network)"
            >
              <Footprints className="w-3.5 h-3.5" />
              <span>Walk</span>
            </button>

            <button
              type="button"
              onClick={() => handleGlobalTransportModeChange('car')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                itinerary.transportMode === 'car'
                  ? 'bg-[#0A2F25] text-white shadow-xs'
                  : 'text-[#0A2F25]/70 hover:text-[#0A2F25] hover:bg-white'
              }`}
              title="Vehicular Road Transit / E-Hailing"
            >
              <Car className="w-3.5 h-3.5" />
              <span>Car</span>
            </button>

            <button
              type="button"
              onClick={() => handleGlobalTransportModeChange('public_transport')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                itinerary.transportMode === 'public_transport'
                  ? 'bg-[#0A2F25] text-white shadow-xs'
                  : 'text-[#0A2F25]/70 hover:text-[#0A2F25] hover:bg-white'
              }`}
              title="Public Transit (14 km/h + 8 min wait headway)"
            >
              <Bus className="w-3.5 h-3.5" />
              <span>Transit</span>
            </button>
          </div>
        </div>

        {/* Dynamic Progress Indicator Bar */}
        <div className="space-y-1.5">
          <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex shadow-inner border border-teal-900/10">
            <div
              style={{ width: `${visitRatio}%` }}
              className="bg-[#C5A028] h-full transition-all duration-300"
              title={`Visit Time: ${formatMinutes(itinerary.totalVisitMinutes)}`}
            />
            <div
              style={{ width: `${travelRatio}%` }}
              className="bg-[#087E83] h-full transition-all duration-300"
              title={`Transit Time: ${formatMinutes(itinerary.totalTravelMinutes)}`}
            />
            {isOverBudget && (
              <div
                style={{ width: '10%' }}
                className="bg-rose-500 h-full animate-pulse transition-all duration-300"
                title="Overtime"
              />
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#0A2F25]/70 pt-0.5">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C5A028] inline-block" />
                Cultural Stays: {formatMinutes(itinerary.totalVisitMinutes)}
              </span>
              <span className="flex items-center gap-1 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-[#087E83] inline-block" />
                Transit: {formatMinutes(itinerary.totalTravelMinutes)}
              </span>
            </div>
            <span className="font-semibold text-emerald-800">
              Admission: {totalAdmissionCost === 0 ? 'Free Entry' : `RM ${totalAdmissionCost}`}
            </span>
          </div>
        </div>
      </div>

      {/* Contextual Guidance Advice */}
      {(() => {
        const isCompact = isCompactDistrict(allPlaces, itinerary.destinationStateId);
        if (isCompact && itinerary.transportMode === 'car') {
          return (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Historic District Advice: </strong> Attractions in this heritage core are clustered within short walking distance. Driving routes may encounter one-way streets, pedestrianized zones, and parking constraints. Walking is recommended for this area.
              </span>
            </div>
          );
        }
        if (!isCompact && itinerary.transportMode === 'walking') {
          return (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Regional Distances Advice: </strong> Attractions in this state are geographically dispersed. Driving or ride-hailing is strongly recommended over long-distance walking between towns.
              </span>
            </div>
          );
        }
        return null;
      })()}

      {/* Starting Point Bar */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-[#F4F9F6] border border-teal-900/15 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-800 flex items-center justify-center shrink-0 border border-amber-300/60">
            <MapPin className="w-4 h-4 text-amber-700" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#996F09] block">
              Starting Point
            </span>
            <span className="text-xs font-bold text-[#0A2F25] truncate block max-w-[200px] sm:max-w-[280px]">
              {itinerary.startingPointName || placeMap.get(itinerary.stops[0]?.placeId)?.name || 'First Stop'}
            </span>
          </div>
        </div>

        {/* Free-Text Search Input with Live Recommendations */}
        <div className="relative w-full md:w-auto md:min-w-[320px] max-w-full">
          <div className="flex items-center rounded-xl border border-teal-900/20 bg-white overflow-hidden shadow-xs focus-within:border-[#C5A028] focus-within:ring-1 focus-within:ring-[#C5A028]">
            <div className="pl-3 pr-2 text-slate-400 shrink-0">
              <Search className="w-3.5 h-3.5 text-[#087E83]" />
            </div>
            <input
              ref={timelineInputRef}
              type="text"
              value={timelineStartingInput}
              onChange={(e) => {
                setTimelineStartingInput(e.target.value);
                setIsTimelineSuggestionsOpen(true);
              }}
              onFocus={() => setIsTimelineSuggestionsOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleApplyTimelineStartingInput(timelineStartingInput);
                }
              }}
              placeholder="Type starting point or address..."
              className="w-full py-1.5 pr-2 text-xs font-semibold text-[#0A2F25] bg-transparent focus:outline-hidden"
            />
            {timelineStartingInput && (
              <button
                type="button"
                onClick={() => {
                  setTimelineStartingInput('');
                  setIsTimelineSuggestionsOpen(false);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 mr-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={handleUseGPSAnchor}
              title="Use current GPS location as starting point"
              className="px-2.5 py-1.5 text-[#087E83] hover:bg-[#EBF5F0] border-l border-teal-900/10 flex items-center gap-1 text-[11px] font-bold cursor-pointer shrink-0"
            >
              <Navigation className={`w-3.5 h-3.5 ${isLocatingGPS ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">GPS</span>
            </button>
            <button
              type="button"
              onClick={() => handleApplyTimelineStartingInput(timelineStartingInput)}
              className="px-3 py-1.5 bg-[#0A2F25] hover:bg-[#0E3D31] text-white text-xs font-bold cursor-pointer shrink-0"
            >
              Set
            </button>
          </div>

          {/* Inline Mismatch Tag if outside state */}
          {timelineStartingInput && !isTimelineSuggestionsOpen && (() => {
            const check = checkStartingPointState(
              itinerary.startingCoordinates,
              timelineStartingInput,
              itinerary.destinationStateId,
              allPlaces
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
          {isTimelineSuggestionsOpen && timelineSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl border border-teal-900/15 shadow-xl max-h-56 overflow-y-auto z-50 py-1 divide-y divide-teal-900/5">
              <div className="px-3 py-1 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>{timelineStartingInput ? 'Recommendations' : 'Suggested Starting Points'}</span>
                {isTimelineSearching && (
                  <span className="flex items-center gap-1 text-[10px] text-[#087E83] font-normal normal-case">
                    <Loader2 className="w-3 h-3 animate-spin" /> Searching...
                  </span>
                )}
              </div>
              {timelineSuggestions.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    handleApplyTimelineStartingInput(item.name, item.placeId, item.coordinates);
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

      {/* Drag & Drop Instructions Helper & Interactive Departure Time */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#0A2F25]/60 px-1">
        <span className="flex items-center gap-1.5 font-medium">
          <GripVertical className="w-3.5 h-3.5 text-[#087E83]" />
          Drag stops to reorder • Times recalculate instantly with zero lag
        </span>

        {/* Departure Time Selector */}
        <div className="flex items-center gap-1.5 bg-[#EBF5F0] px-2.5 py-1 rounded-xl border border-teal-900/10 self-start sm:self-auto">
          <Clock className="w-3.5 h-3.5 text-[#087E83]" />
          <span className="text-[11px] font-bold text-[#0A2F25]">Trip Start:</span>
          <select
            value={startTime}
            onChange={(e) => handleStartTimeChange(e.target.value)}
            className="text-[11px] font-extrabold text-[#087E83] bg-transparent border-none cursor-pointer focus:outline-hidden"
            title="Choose departure time (recalculates all ETAs instantly)"
          >
            <option value="07:00">07:00 AM</option>
            <option value="07:30">07:30 AM</option>
            <option value="08:00">08:00 AM</option>
            <option value="08:30">08:30 AM</option>
            <option value="09:00">09:00 AM</option>
            <option value="09:30">09:30 AM</option>
            <option value="10:00">10:00 AM</option>
            <option value="10:30">10:30 AM</option>
            <option value="11:00">11:00 AM</option>
            <option value="11:30">11:30 AM</option>
            <option value="12:00">12:00 PM</option>
            <option value="13:00">01:00 PM</option>
            <option value="14:00">02:00 PM</option>
            <option value="15:00">03:00 PM</option>
            <option value="16:00">04:00 PM</option>
            <option value="17:00">05:00 PM</option>
          </select>
        </div>
      </div>

      {/* Timeline Stops with Drag-and-Drop */}
      <div className="space-y-6 relative before:absolute before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-teal-900/15">
        {itinerary.stops.map((stop, idx) => {
          const place = placeMap.get(stop.placeId);
          if (!place) return null;

          const isFood = isFoodVendorStopId(stop.placeId) || place.type === 'food';
          const isPhys = Boolean(
            place &&
            typeof place.latitude === 'number' &&
            typeof place.longitude === 'number' &&
            !isNaN(place.latitude) &&
            !isNaN(place.longitude)
          );
          const pinNumber = physicalPinMap.get(place.id);
          const isDragging = draggedIndex === idx;
          const isDropTarget = dragOverIndex === idx;

          return (
            <div
              key={stop.placeId}
              draggable
              onDragStart={(e) => {
                setDraggedIndex(idx);
                e.dataTransfer.setData('text/plain', idx.toString());
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragOverIndex !== idx) {
                  setDragOverIndex(idx);
                }
              }}
              onDragLeave={() => {
                if (dragOverIndex === idx) {
                  setDragOverIndex(null);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(idx);
              }}
              onDragEnd={() => {
                setDraggedIndex(null);
                setDragOverIndex(null);
              }}
              className={`relative pl-12 transition-all duration-200 ${
                isDragging ? 'opacity-40 scale-[0.98]' : ''
              } ${isDropTarget ? 'pt-3' : ''}`}
            >
              {/* Drop Target Indicator Line */}
              {isDropTarget && (
                <div className="absolute top-0 left-12 right-0 h-1 bg-[#087E83] rounded-full shadow-sm animate-pulse z-20" />
              )}

              {/* Stop Icon / Number Badge */}
              {isFood ? (
                <div
                  className="absolute left-0 top-1 w-10 h-10 rounded-2xl bg-rose-600 text-white flex flex-col items-center justify-center shadow-xs z-10 ring-2 ring-rose-200"
                  title="Traditional Food Stop"
                >
                  <span className="text-base leading-none">🍴</span>
                </div>
              ) : isPhys && pinNumber ? (
                <div
                  className="absolute left-0 top-2 w-10 h-10 rounded-2xl bg-[#0A2F25] text-white flex flex-col items-center justify-center shadow-xs z-10 cursor-grab active:cursor-grabbing hover:scale-105 transition-transform"
                  title={`Map Pin ${pinNumber} (Drag to reorder)`}
                >
                  <span className="text-[8px] uppercase tracking-wider text-amber-300 font-sans font-extrabold leading-none">
                    Pin
                  </span>
                  <span className="text-sm font-bold font-serif leading-none mt-0.5">
                    {pinNumber}
                  </span>
                </div>
              ) : (
                <div
                  className="absolute left-0 top-2 w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-xs z-10 cursor-grab active:cursor-grabbing"
                  title="Cultural & Culinary Experience"
                >
                  <Sparkles className="w-5 h-5 text-amber-100" />
                </div>
              )}

              {/* Stop Card */}
              <div
                className={`p-5 rounded-2xl bg-white border transition-all ${
                  isDropTarget
                    ? 'border-[#087E83] ring-2 ring-[#087E83]/20 shadow-md'
                    : isFood
                    ? 'border-rose-200 hover:border-rose-400 shadow-xs'
                    : 'border-teal-900/10 shadow-xs hover:border-[#C5A028]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    {/* Header Pills: Map Pin, Time Window, ETA, Visit duration */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center text-slate-400 hover:text-slate-700 cursor-grab active:cursor-grabbing p-0.5 -ml-1">
                        <GripVertical className="w-4 h-4 text-[#087E83]/60" />
                      </div>

                      {isFood ? (
                        <>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1">
                            <Utensils className="w-3 h-3 text-rose-600" /> Traditional Food Stop
                          </span>
                          {isPhys && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
                              Food Marker on Map
                            </span>
                          )}
                        </>
                      ) : isPhys && pinNumber ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#EBF5F0] text-[#0A2F25] border border-teal-900/10">
                          Pin {pinNumber} on Map
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          Living Heritage
                        </span>
                      )}

                      {/* Soft Time Window Tag */}
                      {getTimeWindowBadge(stop.preferredTimeWindow)}

                      {/* Calculated Dynamic ETA */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-[#087E83] border border-teal-200">
                        <Clock className="w-3 h-3 text-[#087E83]" />
                        ETA: {stop.etaTime || `+${formatMinutes(stop.arrivalOffsetMinutes || 0)}`}
                      </span>

                      <span className="text-xs font-semibold text-[#996F09]">
                        Stay: {stop.visitDurationMinutes} mins
                      </span>
                    </div>

                    {/* Place Name and Locality */}
                    <div>
                      <h3
                        onClick={() => onSelectPlace(place)}
                        className={`font-serif font-bold text-lg hover:text-[#087E83] cursor-pointer transition-colors ${
                          isFood ? 'text-rose-950' : 'text-[#0A2F25]'
                        }`}
                      >
                        {place.name}
                      </h3>
                      {place.locality && (
                        <p className="text-xs text-[#0A2F25]/60">{place.locality}</p>
                      )}
                    </div>

                    {/* Contextual Time Trigger (e.g., Sunset Golden Hour Photography) */}
                    {stop.contextualTrigger && (
                      <div className="mt-2 p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-amber-300 text-xs text-amber-950 flex items-start gap-2 shadow-xs">
                        <Camera className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-amber-900 block font-bold text-[11px]">
                            Contextual Time Trigger:
                          </strong>
                          <span>{stop.contextualTrigger}</span>
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-[#0A2F25]/80 pt-1 leading-relaxed">
                      {place.shortDescription}
                    </p>

                    {/* Why this stop is included */}
                    <div className="pt-2 text-[11px] text-[#0A2F25]/60 flex items-center gap-1.5">
                      <span className="font-semibold text-[#996F09]">Planning Reason:</span>
                      <span>{stop.reasonSelected}</span>
                    </div>
                  </div>

                  {/* Thumbnail, Quick Move Buttons, and Remove Action */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                    <img
                      src={place.imageUrl}
                      alt={place.name}
                      className="w-16 h-16 rounded-xl object-cover cursor-pointer hover:opacity-90 border border-teal-900/10"
                      onClick={() => onSelectPlace(place)}
                    />

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onSelectPlace(place)}
                        className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-[#F4F9F6] text-[#0A2F25] hover:bg-[#EBF5F0] transition-colors cursor-pointer border border-teal-900/10"
                      >
                        Details
                      </button>

                      {/* Set as Start Anchor Button */}
                      {idx > 0 ? (
                        <button
                          type="button"
                          onClick={() => handleSetStartingPoint(stop.placeId)}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
                          title="Set as Tour Starting Anchor & Re-Sequence from here"
                        >
                          <MapPin className="w-3 h-3 text-amber-700" />
                          <span className="hidden sm:inline">Start Here</span>
                        </button>
                      ) : (
                        <span className="px-2 py-1 rounded-lg text-[10px] font-extrabold text-emerald-900 bg-emerald-100 border border-emerald-300 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-700" />
                          <span>Start</span>
                        </span>
                      )}

                      {/* Move Up Button */}
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => handleMoveStop(idx, idx - 1)}
                          className="p-1 rounded-lg text-[#0A2F25]/70 hover:text-[#0A2F25] hover:bg-[#EBF5F0] border border-teal-900/10 cursor-pointer"
                          title="Move stop up"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Move Down Button */}
                      {idx < itinerary.stops.length - 1 && (
                        <button
                          type="button"
                          onClick={() => handleMoveStop(idx, idx + 1)}
                          className="p-1 rounded-lg text-[#0A2F25]/70 hover:text-[#0A2F25] hover:bg-[#EBF5F0] border border-teal-900/10 cursor-pointer"
                          title="Move stop down"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {(itinerary.stops.length > 1 || isFood) && (
                        <button
                          onClick={() => onRemoveStop(stop.order)}
                          className="p-1 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                          title="Remove stop from plan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Transit Connector between stops */}
              {idx < itinerary.stops.length - 1 && (() => {
                const nextStop = itinerary.stops[idx + 1];
                const fromPlace = allPlaces.find((p) => p.id === stop.placeId);
                const toPlace = allPlaces.find((p) => p.id === nextStop.placeId);
                if (!toPlace) return null;

                const toIsPhys = Boolean(
                  typeof toPlace.latitude === 'number' &&
                  typeof toPlace.longitude === 'number' &&
                  !isNaN(toPlace.latitude) &&
                  !isNaN(toPlace.longitude)
                );
                const toPin = physicalPinMap.get(toPlace.id);
                const toIsFood = isFoodVendorStopId(nextStop.placeId) || toPlace.type === 'food';

                if (toIsPhys && toPin) {
                  // Find previous physical heritage place for geographic distance calculation
                  let originPhys: HeritagePlace | null =
                    fromPlace &&
                    fromPlace.type !== 'food' &&
                    !isFoodVendorStopId(fromPlace.id) &&
                    typeof fromPlace.latitude === 'number' &&
                    typeof fromPlace.longitude === 'number'
                      ? fromPlace
                      : null;
                  if (!originPhys) {
                    for (let j = idx - 1; j >= 0; j--) {
                      const p = allPlaces.find((x) => x.id === itinerary.stops[j].placeId);
                      if (
                        p &&
                        p.type !== 'food' &&
                        !isFoodVendorStopId(p.id) &&
                        typeof p.latitude === 'number' &&
                        typeof p.longitude === 'number'
                      ) {
                        originPhys = p;
                        break;
                      }
                    }
                  }

                  let distLabel = '';
                  let isHeritageDenseLeg = false;
                  if (originPhys) {
                    const directKm = calculateHaversineDistanceKm(
                      originPhys.latitude!,
                      originPhys.longitude!,
                      toPlace.latitude!,
                      toPlace.longitude!
                    );
                    const walkKm = directKm * 1.2;
                    distLabel = walkKm < 1 ? `~${Math.round(walkKm * 1000)} m` : `~${walkKm.toFixed(1)} km`;
                    isHeritageDenseLeg = isHeritageZoneLeg(originPhys, toPlace);
                  }

                  const activeSegmentMode = nextStop.segmentTransportMode || itinerary.transportMode;
                  const travelMins = nextStop.travelFromPreviousMinutes || 4;

                  return (
                    <div className="my-3 space-y-2">
                      {/* Standard Transit Bar */}
                      <div className="py-2 px-3.5 rounded-xl bg-[#EBF5F0] text-[#0A2F25] text-xs flex flex-wrap items-center justify-between gap-2 border border-teal-900/10">
                        <div className="flex items-center gap-2">
                          {getTransportIcon(activeSegmentMode)}
                          <span className="font-semibold text-[#0A2F25]">
                            {travelMins} min {activeSegmentMode === 'walking' ? 'walk' : activeSegmentMode === 'car' ? 'drive' : 'transfer'}
                          </span>
                          <span className="text-[11px] text-[#0A2F25]/70">
                            to {toIsFood ? 'Food Stop: ' : `Pin ${toPin}: `}{toPlace.name} {distLabel && `(${distLabel})`}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {activeSegmentMode === 'walking' && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-300">
                              🚶 Pedestrian Walk • 0g CO2
                            </span>
                          )}
                          {activeSegmentMode === 'car' && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                              🚗 Vehicular Drive
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Heritage Transit Integration: Revealed when stops are < 1.5 km in historic zones */}
                      {isHeritageDenseLeg && (
                        <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 border border-amber-300/80 text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-amber-900 font-bold text-[11px]">
                              <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Heritage Transit Zone Detected (&lt; 1.5 km in UNESCO Core)</span>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full border border-emerald-200">
                              Cultural Eco-Transit
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-0.5">
                            <span className="text-[11px] text-[#0A2F25]/75">
                              Switch this leg:
                            </span>

                            {/* Walking Option */}
                            <button
                              type="button"
                              onClick={() => handleSegmentModeChange(idx + 1, 'walking')}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                activeSegmentMode === 'walking'
                                  ? 'bg-[#087E83] text-white shadow-xs'
                                  : 'bg-white text-[#087E83] hover:bg-teal-50 border border-teal-300'
                              }`}
                            >
                              <Footprints className="w-3 h-3" />
                              <span>Scenic Walk</span>
                            </button>

                            {/* Car Option */}
                            <button
                              type="button"
                              onClick={() => handleSegmentModeChange(idx + 1, 'car')}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                activeSegmentMode === 'car'
                                  ? 'bg-[#0A2F25] text-white shadow-xs'
                                  : 'bg-white text-[#0A2F25] hover:bg-slate-100 border border-slate-300'
                              }`}
                            >
                              <Car className="w-3 h-3" />
                              <span>Car</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                } else {
                  return (
                    <div className="my-3 py-1.5 px-3 rounded-xl bg-amber-50/70 text-amber-950 text-xs flex items-center justify-between border border-amber-200/60">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span className="font-semibold text-amber-900">
                          Cultural & Culinary Experience
                        </span>
                        <span className="text-[11px] text-amber-800/70">
                          (Local tasting & living tradition near {fromPlace?.name || 'heritage quarter'})
                        </span>
                      </div>

                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-amber-900 border border-amber-200">
                        Intangible Heritage
                      </span>
                    </div>
                  );
                }
              })()}
            </div>
          );
        })}

        {/* Add More Places to Route Action Card */}
        {onAddPlace && (
          <div className="pt-2 pl-12">
            <button
              type="button"
              onClick={() => {
                setInitialAddModalTab('places');
                setIsAddModalOpen(true);
              }}
              className="w-full py-3.5 px-4 rounded-2xl border-2 border-dashed border-[#087E83]/30 hover:border-[#087E83] bg-white/70 hover:bg-[#EBF5F0] text-[#0A2F25] text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer group shadow-xs"
            >
              <Plus className="w-4 h-4 text-[#087E83] group-hover:scale-125 transition-transform" />
              <span>Add More Places & Culinary Stops to Itinerary</span>
            </button>
          </div>
        )}
      </div>

      {/* Assumptions and Transparency Footer */}
      <div className="p-4 rounded-2xl bg-white/90 border border-teal-900/10 text-xs space-y-1.5 text-[#0A2F25]">
        <h4 className="font-bold flex items-center gap-1.5 text-[#0A2F25]">
          <AlertCircle className="w-3.5 h-3.5 text-[#B88E18]" />
          Planning Assumptions & Data Transparency
        </h4>
        <ul className="list-disc list-inside space-y-0.5 text-[#0A2F25]/70">
          {itinerary.assumptions.map((assump, idx) => (
            <li key={idx}>{assump}</li>
          ))}
        </ul>
      </div>

      {/* Add Place Modal */}
      <AddPlaceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        destinationStateId={itinerary.destinationStateId}
        allPlaces={allPlaces}
        currentItineraryStops={itinerary.stops}
        onAddPlace={(place) => {
          if (onAddPlace) {
            onAddPlace(place);
          }
        }}
        onSelectPlaceDetail={onSelectPlace}
        initialTab={initialAddModalTab}
      />

      {/* Starting Point State Mismatch Modal Notification */}
      <StartingPointMismatchModal
        isOpen={isMismatchModalOpen}
        validation={mismatchValidation}
        onReselect={handleReselectTimelineStartingPoint}
        onProceedAnyway={handleProceedAnywayTimeline}
        onClose={() => setIsMismatchModalOpen(false)}
      />
    </div>
  );
};
