import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { HeritagePlace, RouteDataStatus, TransportMode } from '../../types';
import { fetchOSRMRoute, OSRMRouteResult } from '../../lib/routing';
import { AlertCircle, Layers, Navigation, Loader2, Footprints } from 'lucide-react';

interface InteractiveMapProps {
  places: HeritagePlace[];
  selectedPlaceId?: string;
  onSelectPlace: (place: HeritagePlace) => void;
  routeStops?: { placeId: string; order: number; routeDataStatus: RouteDataStatus }[];
  transportMode?: TransportMode;
  center?: [number, number];
  zoom?: number;
  onRouteCalculated?: (result: OSRMRouteResult) => void;
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
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const lastRouteKeyRef = useRef<string>('');
  const [tileError, setTileError] = useState(false);
  const [routeStatusText, setRouteStatusText] = useState<string | null>(null);
  const [isRoutingLoading, setIsRoutingLoading] = useState(false);
  const [isFallbackRoute, setIsFallbackRoute] = useState(false);

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

  // Update Markers & Routes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    // Map consecutive physical pin numbers (1, 2, 3...) for mapped route stops
    const physicalPinMap = new Map<string, number>();
    let physicalCounter = 1;
    if (routeStops) {
      routeStops
        .slice()
        .sort((a, b) => a.order - b.order)
        .forEach((s) => {
          const p = places.find((x) => x.id === s.placeId);
          if (p && typeof p.latitude === 'number' && typeof p.longitude === 'number') {
            physicalPinMap.set(s.placeId, physicalCounter++);
          }
        });
    }

    const validCoordinates: L.LatLngExpression[] = [];

    places.forEach((place) => {
      if (place.latitude === undefined || place.longitude === undefined) return;

      const isSelected = place.id === selectedPlaceId;
      const pinNumber = physicalPinMap.get(place.id);
      const isRouteStop = pinNumber !== undefined;

      // Custom HTML Marker Icon
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

      // Bind simple popup
      marker.bindTooltip(`<strong>${isRouteStop ? `Pin ${pinNumber}: ` : ''}${place.name}</strong><br/><span style="font-size:10px;color:#64748b;">${place.locality || ''}</span>`, {
        direction: 'top',
        offset: [0, -16],
      });

      markersGroup.addLayer(marker);
      validCoordinates.push([place.latitude, place.longitude]);
    });

    let isSubscribed = true;

    // Draw route polyline via OSRM if route stops exist
    if (routeStops && routeStops.length > 0) {
      const placeMap = new Map<string, HeritagePlace>(places.map((p) => [p.id, p]));
      const waypoints: { latitude: number; longitude: number }[] = [];

      routeStops
        .slice()
        .sort((a, b) => a.order - b.order)
        .forEach((s) => {
          const p = placeMap.get(s.placeId);
          if (p && typeof p.latitude === 'number' && typeof p.longitude === 'number') {
            waypoints.push({ latitude: p.latitude, longitude: p.longitude });
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
                  color: isWalk ? '#0284c7' : '#4f46e5', // Sky-600 for pedestrian corridor, Indigo-600 for vehicular road
                  weight: isWalk ? 3.5 : 5,
                  opacity: isWalk ? 0.85 : 0.85,
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
        setRouteStatusText('Single mapped heritage stop. Add another stop to calculate a road route.');

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
  }, [places, selectedPlaceId, routeStops, transportMode]);

  const pinnedCount = places.filter((p) => p.latitude !== undefined && p.longitude !== undefined).length;
  const regionalCount = places.length - pinnedCount;

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-3xl overflow-hidden shadow-md border border-slate-200">
      <div ref={mapContainerRef} className="w-full h-full z-0 min-h-[420px]" />

      {/* Floating Status & Legend Bar */}
      <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-sm border border-slate-200 text-xs flex flex-wrap items-center gap-3 max-w-[90%]">
        <span className="flex items-center gap-1.5 font-semibold text-slate-800">
          <Layers className="w-3.5 h-3.5 text-amber-600" />
          <span>Interactive Cultural Map</span>
        </span>
        <div className="flex items-center gap-2 border-l border-slate-200 pl-2 text-[11px] text-slate-600 flex-wrap">
          <span className="font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50">
            {pinnedCount} Verified Pins
          </span>
          {regionalCount > 0 && (
            <span className="hidden sm:inline font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/50">
              {regionalCount} Regional Traditions in Grid View
            </span>
          )}
          <span className="hidden md:flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block" /> Selected
          </span>
          <span className="hidden md:flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" /> Route Stop
          </span>
        </div>
      </div>

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
  );
};
