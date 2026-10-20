import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { HeritagePlace, RouteDataStatus, TransportMode, TraditionalFoodVendor } from '../../types';
import { fetchOSRMRoute, OSRMRouteResult } from '../../lib/routing';
import { searchCuratedDirectory } from '../../lib/geocoding';
import { AlertCircle, Layers, Navigation, Loader2, Footprints, Utensils } from 'lucide-react';
import {
  allFoodVendors as defaultFoodVendors,
  isFoodVendorStopId,
  vendorByPlaceId,
} from '../../lib/foodVendors';

export interface MapStartingPoint {
  name: string;
  coordinates?: [number, number];
  placeId?: string;
}

interface InteractiveMapProps {
  places: HeritagePlace[];
  selectedPlaceId?: string;
  onSelectPlace: (place: HeritagePlace) => void;
  routeStops?: { placeId: string; order: number; routeDataStatus: RouteDataStatus }[];
  transportMode?: TransportMode;
  center?: [number, number];
  zoom?: number;
  onRouteCalculated?: (result: OSRMRouteResult) => void;
  startingPoint?: MapStartingPoint;
  foodVendors?: TraditionalFoodVendor[];
  selectedFoodVendorIds?: string[];
  initialShowFood?: boolean;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  places,
  selectedPlaceId,
  onSelectPlace,
  routeStops,
  transportMode = 'walking',
  center = [2.1950, 102.2490], // Default Melaka center
  zoom = 15,
  onRouteCalculated,
  startingPoint,
  foodVendors,
  selectedFoodVendorIds,
  initialShowFood = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const foodMarkersGroupRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const lastRouteKeyRef = useRef<string>('');
  const [tileError, setTileError] = useState(false);
  const [routeStatusText, setRouteStatusText] = useState<string | null>(null);
  const [isRoutingLoading, setIsRoutingLoading] = useState(false);
  const [isFallbackRoute, setIsFallbackRoute] = useState(false);
  const [showFood, setShowFood] = useState<boolean>(initialShowFood);

  const allFoodCatalogue = useMemo(() => {
    return foodVendors || defaultFoodVendors;
  }, [foodVendors]);

  // STRICT REQUIREMENT: Only display food vendor markers when those vendors
  // are present in the current itinerary's selected food stops!
  const selectedFoodVendors = useMemo(() => {
    if (selectedFoodVendorIds !== undefined) {
      if (selectedFoodVendorIds.length === 0) return [];
      const set = new Set(selectedFoodVendorIds);
      return allFoodCatalogue.filter((v) => set.has(v.id) || (v.placeId && set.has(v.placeId)));
    }

    if (routeStops && routeStops.length > 0) {
      const stopPlaceIds = new Set(routeStops.map((s) => s.placeId));
      return allFoodCatalogue.filter(
        (v) => stopPlaceIds.has(v.id) || (v.placeId && stopPlaceIds.has(v.placeId))
      );
    }

    // No food stops added to itinerary -> 0 food markers
    return [];
  }, [allFoodCatalogue, selectedFoodVendorIds, routeStops]);

  const pinnedFoodCount = useMemo(() => {
    return selectedFoodVendors.filter(
      (v) => typeof v.latitude === 'number' && typeof v.longitude === 'number'
    ).length;
  }, [selectedFoodVendors]);

  const selectedFoodPlaceIds = useMemo(() => {
    const set = new Set<string>();
    selectedFoodVendors.forEach((v) => {
      set.add(v.id);
      if (v.placeId) set.add(v.placeId);
    });
    return set;
  }, [selectedFoodVendors]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // OpenStreetMap Tile Layer
      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      });

      tileLayer.on('tileerror', () => {
        setTileError(true);
      });

      tileLayer.addTo(map);

      markersGroupRef.current = L.layerGroup().addTo(map);
      foodMarkersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      // Map cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Center update when center prop changes and no markers/route override
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if ((!places || places.length === 0) && center) {
      map.setView(center, zoom, { animate: true });
    }
  }, [center, zoom, places]);

  // Update Food Vendor Markers (ONLY for vendors added to the itinerary)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const foodGroup = foodMarkersGroupRef.current;
    if (!map || !foodGroup) return;

    foodGroup.clearLayers();

    if (!showFood) return;

    selectedFoodVendors.forEach((vendor) => {
      if (typeof vendor.latitude !== 'number' || typeof vendor.longitude !== 'number') {
        return;
      }

      const isReview = vendor.verificationStatus === 'needs_review';
      const markerHtml = `
        <div class="relative flex items-center justify-center transition-transform hover:scale-125 cursor-pointer z-20 group">
          <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-lg border-2 border-white ${
            isReview ? 'bg-amber-600 text-white ring-2 ring-amber-300' : 'bg-rose-600 text-white ring-2 ring-rose-300'
          }">
            <span style="font-size: 13px; line-height: 1;">🍴</span>
          </div>
          <div class="absolute -bottom-1 w-2 h-2 ${isReview ? 'bg-amber-600' : 'bg-rose-600'} rotate-45"></div>
        </div>
      `;

      const foodIcon = L.divIcon({
        className: 'custom-food-div-icon',
        html: markerHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18],
      });

      const marker = L.marker([vendor.latitude, vendor.longitude], { icon: foodIcon });

      const popupHtml = `
        <div style="font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; font-size: 12px; line-height: 1.4; color: #1e293b; max-width: 290px; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; gap: 8px;">
            <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; background: #ffe4e6; color: #9f1239; padding: 2px 8px; border-radius: 9999px;">
              ${escapeHtml(vendor.state)} • Traditional Food Stop
            </span>
            ${
              vendor.verificationStatus === 'needs_review'
                ? '<span style="font-size: 9px; font-weight: 700; background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 4px; border: 1px solid #fde68a;">Flagged Review</span>'
                : '<span style="font-size: 9px; font-weight: 700; background: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 4px; border: 1px solid #bbf7d0;">Verified Spot</span>'
            }
          </div>
          <div style="margin-bottom: 6px;">
            <h4 style="font-family: serif; font-size: 15px; font-weight: 700; color: #0f172a; margin: 0 0 2px 0; line-height: 1.2;">
              ${escapeHtml(vendor.foodName)}
            </h4>
            <p style="font-size: 11px; font-weight: 600; color: #e11d48; margin: 0;">
              ${escapeHtml(vendor.restaurantName)}
            </p>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 8px; margin-bottom: 6px; font-size: 11px; color: #334155;">
            ${escapeHtml(vendor.notes)}
          </div>
          <div style="margin-bottom: 6px; font-size: 11px; color: #64748b;">
            <strong style="color: #334155;">📍 Address / Directions:</strong>
            <div style="margin-top: 2px; color: #475569;">${escapeHtml(vendor.address)}</div>
          </div>
          ${
            vendor.reviewReason
              ? `<div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; padding: 6px; margin-bottom: 6px; font-size: 10px; color: #b45309;">
                  <strong>⚠️ Note: </strong>${escapeHtml(vendor.reviewReason)}
                </div>`
              : ''
          }
          ${
            vendor.nearbyAttractionNotes
              ? `<div style="background: #f0fdf4; border: 1px solid #dcfce7; border-radius: 6px; padding: 6px; margin-bottom: 6px; font-size: 10px; color: #166534;">
                  <strong>🏛️ Nearby Heritage: </strong>${escapeHtml(vendor.nearbyAttractionNotes)}
                </div>`
              : ''
          }
          <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #f1f5f9;">
            <a href="${vendor.googleMapsUrl}" target="_blank" rel="noopener noreferrer"
               style="display: inline-flex; align-items: center; justify-content: center; gap: 4px; width: 100%; box-sizing: border-box; text-decoration: none; font-size: 11px; font-weight: 700; color: #ffffff; background: #e11d48; padding: 7px 12px; border-radius: 8px; text-align: center;">
              <span>Open in Google Maps ↗</span>
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 300 });
      marker.bindTooltip(
        `<strong>${escapeHtml(vendor.foodName)}</strong><br/><span style="font-size:10px;color:#e11d48;">${escapeHtml(vendor.restaurantName)}</span>`,
        {
          direction: 'top',
          offset: [0, -16],
        }
      );

      foodGroup.addLayer(marker);
    });
  }, [showFood, selectedFoodVendors]);

  // Update Heritage Markers & Routes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    // Map consecutive physical pin numbers (1, 2, 3...) for mapped HERITAGE route stops
    const physicalPinMap = new Map<string, number>();
    let physicalCounter = 1;
    if (routeStops) {
      routeStops
        .slice()
        .sort((a, b) => a.order - b.order)
        .forEach((s) => {
          const p = places.find((x) => x.id === s.placeId);
          if (p && typeof p.latitude === 'number' && typeof p.longitude === 'number') {
            // Only assign numbered pins to heritage attractions, not food stalls
            if (!selectedFoodPlaceIds.has(s.placeId) && p.type !== 'food') {
              physicalPinMap.set(s.placeId, physicalCounter++);
            }
          }
        });
    }

    const validCoordinates: L.LatLngExpression[] = [];

    places.forEach((place) => {
      if (place.latitude === undefined || place.longitude === undefined) return;

      // Food stops are rendered exclusively as location references by foodMarkersGroup
      const isFood = place.type === 'food' || place.categories.includes('Food') || isFoodVendorStopId(place.id);
      if (isFood) {
        return;
      }

      const isSelected = place.id === selectedPlaceId;
      const pinNumber = physicalPinMap.get(place.id);
      const isRouteStop = pinNumber !== undefined;

      // Custom HTML Marker Icon for Heritage Places
      const markerHtml = `
        <div class="relative flex items-center justify-center transition-transform hover:scale-110 cursor-pointer">
          <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-lg border-2 ${
            isSelected
              ? 'bg-amber-600 border-white text-white ring-4 ring-amber-400/50 scale-125 z-30'
              : isRouteStop
              ? 'bg-indigo-600 border-white text-white z-20'
              : 'bg-white border-amber-600 text-amber-900 z-10'
          }">
            ${isRouteStop ? pinNumber : '★'}
          </div>
          ${
            isSelected
              ? `<div class="absolute -bottom-1 w-2 h-2 bg-amber-600 rotate-45"></div>`
              : ''
          }
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: markerHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([place.latitude, place.longitude], { icon: customIcon });

      marker.on('click', () => {
        onSelectPlace(place);
      });

      // Bind simple tooltip
      marker.bindTooltip(
        `<strong>${isRouteStop ? `Pin ${pinNumber}: ` : ''}${place.name}</strong><br/><span style="font-size:10px;color:#64748b;">${place.locality || ''}</span>`,
        {
          direction: 'top',
          offset: [0, -16],
        }
      );

      markersGroup.addLayer(marker);
      validCoordinates.push([place.latitude, place.longitude]);
    });

    // Render Starting Point Marker (Labelled "S")
    let startCoord: [number, number] | undefined = undefined;
    if (
      startingPoint?.coordinates &&
      startingPoint.coordinates.length === 2 &&
      typeof startingPoint.coordinates[0] === 'number' &&
      !isNaN(startingPoint.coordinates[0])
    ) {
      startCoord = [startingPoint.coordinates[0], startingPoint.coordinates[1]];
    } else if (startingPoint?.placeId) {
      const sp = places.find((p) => p.id === startingPoint.placeId);
      if (sp && typeof sp.latitude === 'number' && typeof sp.longitude === 'number') {
        startCoord = [sp.latitude, sp.longitude];
      }
    }

    // Fallback: check curated directory if coordinates missing but name exists
    if (!startCoord && startingPoint?.name) {
      const curated = searchCuratedDirectory(startingPoint.name);
      if (curated.length > 0) {
        startCoord = curated[0].coordinates;
      }
    }

    if (startCoord) {
      const startMarkerHtml = `
        <div class="relative flex items-center justify-center transition-transform hover:scale-125 cursor-pointer">
          <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-xl border-2 bg-emerald-600 border-white text-white z-50 ring-4 ring-emerald-400/70">
            S
          </div>
          <div class="absolute -bottom-1 w-2.5 h-2.5 bg-emerald-600 rotate-45 border-r-2 border-b-2 border-white"></div>
        </div>
      `;

      const startCustomIcon = L.divIcon({
        className: 'custom-div-icon starting-point-marker',
        html: startMarkerHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 20],
      });

      const startMarker = L.marker(startCoord, {
        icon: startCustomIcon,
        zIndexOffset: 2500, // Always render on top of destination pins
      });
      startMarker.bindTooltip(
        `<strong>🚩 Starting Point: ${startingPoint?.name || 'Tour Origin'}</strong><br/><span style="font-size:10px;color:#059669;font-weight:700;">Starting Point (S)</span>`,
        {
          direction: 'top',
          offset: [0, -18],
        }
      );
      startMarker.on('click', () => {
        if (startCoord) {
          map.setView(startCoord, 15, { animate: true });
        }
      });
      markersGroup.addLayer(startMarker);
      validCoordinates.push(startCoord);
    }

    let isSubscribed = true;

    // Draw route polyline via OSRM if route stops exist
    if (routeStops && routeStops.length > 0) {
      const placeMap = new Map<string, HeritagePlace>();
      places.forEach((p) => {
        placeMap.set(p.id, p);
        const vendor = vendorByPlaceId.get(p.id);
        if (vendor) {
          placeMap.set(vendor.id, p);
        }
      });
      const waypoints: { latitude: number; longitude: number }[] = [];

      // Prepend Starting Point to route waypoints if available
      if (startCoord) {
        waypoints.push({ latitude: startCoord[0], longitude: startCoord[1] });
      }

      routeStops
        .slice()
        .sort((a, b) => a.order - b.order)
        .forEach((s) => {
          // EXCLUDE food vendors from itinerary route line waypoints
          if (isFoodVendorStopId(s.placeId)) return;

          const p = placeMap.get(s.placeId);
          if (p && p.type === 'food') return;

          if (p && typeof p.latitude === 'number' && typeof p.longitude === 'number' && !isNaN(p.latitude) && !isNaN(p.longitude)) {
            // Avoid duplicate point if starting point is at the exact same location as stop 1
            if (
              waypoints.length === 1 &&
              Math.abs(waypoints[0].latitude - p.latitude) < 0.0001 &&
              Math.abs(waypoints[0].longitude - p.longitude) < 0.0001
            ) {
              // Same location, don't duplicate
            } else {
              waypoints.push({ latitude: p.latitude, longitude: p.longitude });
            }
          }
        });

      if (waypoints.length >= 2) {
        const waypointsKey =
          waypoints.map((w) => `${w.latitude.toFixed(6)},${w.longitude.toFixed(6)}`).join('->') +
          `::${transportMode}`;

        if (lastRouteKeyRef.current !== waypointsKey) {
          lastRouteKeyRef.current = waypointsKey;
          setIsRoutingLoading(true);
          fetchOSRMRoute(waypoints, transportMode)
            .then((result) => {
              if (!isSubscribed) return;
              setIsRoutingLoading(false);
              setRouteStatusText(result.statusMessage);
              setIsFallbackRoute(result.isFallback);
              onRouteCalculated?.(result);

              if (routeLayerRef.current) {
                map.removeLayer(routeLayerRef.current);
                routeLayerRef.current = null;
              }

              if (result.coordinates.length > 0) {
                const isWalk = transportMode === 'walking';
                const polyline = L.polyline(result.coordinates, {
                  color: isWalk ? '#0284c7' : '#4f46e5', // Sky-600 for pedestrian, Indigo-600 for vehicular road
                  weight: isWalk ? 3.5 : 5,
                  opacity: 0.85,
                  dashArray: isWalk ? '6, 8' : (result.isFallback ? '8, 8' : undefined),
                }).addTo(map);

                routeLayerRef.current = polyline;

                if (!selectedPlaceId) {
                  try {
                    map.fitBounds(polyline.getBounds(), { padding: [50, 50], maxZoom: 16 });
                  } catch {
                    // Fallback
                  }
                }
              }
            })
            .catch(() => {
              if (!isSubscribed) return;
              setIsRoutingLoading(false);
              setRouteStatusText('Route calculation unavailable');
              setIsFallbackRoute(true);
            });
        }
      } else if (waypoints.length === 1) {
        lastRouteKeyRef.current = '';
        if (routeLayerRef.current) {
          map.removeLayer(routeLayerRef.current);
          routeLayerRef.current = null;
        }
        setIsRoutingLoading(false);
        setIsFallbackRoute(false);
        setRouteStatusText('Single mapped stop. Add another stop to calculate a road route.');

        if (!selectedPlaceId) {
          map.setView([waypoints[0].latitude, waypoints[0].longitude], 15, { animate: true });
        }
      } else {
        lastRouteKeyRef.current = '';
        if (routeLayerRef.current) {
          map.removeLayer(routeLayerRef.current);
          routeLayerRef.current = null;
        }
        setIsRoutingLoading(false);
        setRouteStatusText(null);
      }
    } else {
      lastRouteKeyRef.current = '';
      if (routeLayerRef.current) {
        map.removeLayer(routeLayerRef.current);
        routeLayerRef.current = null;
      }
      setIsRoutingLoading(false);
      setRouteStatusText(null);

      // Pan or fit overview bounds when no itinerary route stops exist
      if (selectedPlaceId) {
        const selected = places.find((p) => p.id === selectedPlaceId);
        if (selected && selected.latitude && selected.longitude) {
          map.panTo([selected.latitude, selected.longitude], { animate: true });
        }
      } else if (validCoordinates.length > 1) {
        try {
          map.fitBounds(L.latLngBounds(validCoordinates), { padding: [40, 40], maxZoom: 16 });
        } catch {
          // Fallback
        }
      } else if (validCoordinates.length === 1) {
        map.setView(validCoordinates[0], 14, { animate: true });
      }
    }

    // Pan map to selected place if explicitly selected
    if (selectedPlaceId) {
      const selected = places.find((p) => p.id === selectedPlaceId);
      if (selected && selected.latitude && selected.longitude) {
        map.panTo([selected.latitude, selected.longitude], { animate: true });
      }
    }

    return () => {
      isSubscribed = false;
    };
  }, [places, selectedPlaceId, routeStops, transportMode, startingPoint, selectedFoodPlaceIds, selectedFoodVendors]);

  const pinnedHeritageCount = places.filter(
    (p) =>
      p.latitude !== undefined &&
      p.longitude !== undefined &&
      !selectedFoodPlaceIds.has(p.id) &&
      p.type !== 'food'
  ).length;
  const regionalCount = places.length - pinnedHeritageCount - selectedFoodVendors.length;

  return (
    <div className="flex flex-col w-full h-full min-h-0">
      {/* Map Canvas Container */}
      <div className="relative flex-1 w-full min-h-[300px] rounded-3xl overflow-hidden shadow-md border border-teal-900/10">
        <div ref={mapContainerRef} className="w-full h-full z-0 min-h-[300px]" />

        {/* Route Status Pill */}
        {(routeStatusText || isRoutingLoading) && (
          <div className="absolute bottom-4 left-3 z-10 max-w-[92%] sm:max-w-md bg-white/95 backdrop-blur-md px-3 py-2 rounded-2xl shadow-md border border-indigo-200 text-xs flex items-center gap-2.5">
            {isRoutingLoading ? (
              <Loader2 className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />
            ) : transportMode === 'walking' ? (
              <Footprints className="w-4 h-4 text-sky-600 shrink-0" />
            ) : (
              <Navigation className={`w-4 h-4 shrink-0 ${isFallbackRoute ? 'text-amber-600' : 'text-indigo-600'}`} />
            )}
            <span className="text-slate-800 font-medium truncate">
              {isRoutingLoading
                ? transportMode === 'car'
                  ? 'Calculating vehicular road route via OSRM...'
                  : 'Calculating pedestrian route estimate...'
                : routeStatusText}
            </span>
          </div>
        )}

        {/* Tile Fallback Notice */}
        {tileError && (
          <div className="absolute bottom-3 left-3 z-10 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-xs text-amber-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>Map tiles loading slowly or offline. Place list and planning remain fully functional.</span>
          </div>
        )}
      </div>

      {/* Re-styled Map Legend: Clean White Card Component */}
      <div className="bg-white rounded-xl shadow-xs border border-teal-900/10 p-3 sm:p-3.5 mt-3 w-full flex flex-col gap-2 shrink-0">
        {/* Row 1: Interactive Cultural Map Title & Pin Count */}
        <div className="flex items-center justify-between pb-1.5 border-b border-teal-900/10">
          <div className="flex items-center gap-1.5 font-bold text-xs text-[#0A2F25]">
            <Layers className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Interactive Cultural Map</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50 text-[10px]">
              {pinnedHeritageCount} Heritage Pins
            </span>
            {regionalCount > 0 && (
              <span className="hidden sm:inline font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/50 text-[10px]">
                {regionalCount} Regional
              </span>
            )}
          </div>
        </div>

        {/* Row 2: Legend Pins and Food Filter Toggle */}
        <div className="flex flex-row flex-wrap items-center gap-2 text-[11px] text-slate-700">
          {startingPoint && (
            <span className="flex items-center gap-1.5 font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 text-white font-black text-[9px] flex items-center justify-center shadow-xs">
                S
              </span>
              <span>Starting Point</span>
            </span>
          )}

          <span className="flex items-center gap-1.5 font-semibold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/60">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
            <span>Route Stop</span>
          </span>

          {/* Traditional Food Toggle Button */}
          {pinnedFoodCount > 0 && (
            <button
              type="button"
              onClick={() => setShowFood((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer border ${
                showFood
                  ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
              }`}
              title={showFood ? 'Click to hide food stops' : 'Click to show food stops'}
            >
              <Utensils className={`w-3 h-3 ${showFood ? 'text-rose-600' : 'text-slate-400'}`} />
              <span>Food Stops ({pinnedFoodCount})</span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${showFood ? 'bg-rose-600' : 'bg-slate-400'}`}
              />
            </button>
          )}

          {showFood && pinnedFoodCount > 0 && (
            <span className="flex items-center gap-1.5 text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/60">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" />
              <span>Food Stop</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
