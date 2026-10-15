import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { HeritagePlace, RouteDataStatus } from '../../types';
import { AlertCircle, Layers } from 'lucide-react';

interface InteractiveMapProps {
  places: HeritagePlace[];
  selectedPlaceId?: string;
  onSelectPlace: (place: HeritagePlace) => void;
  routeStops?: { placeId: string; order: number; routeDataStatus: RouteDataStatus }[];
  center?: [number, number];
  zoom?: number;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  places,
  selectedPlaceId,
  onSelectPlace,
  routeStops,
  center = [2.1950, 102.2490], // Default Melaka center
  zoom = 15,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const [tileError, setTileError] = useState(false);

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

  // Update Markers & Routes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    // Map order for route stops
    const routeOrderMap = new Map<string, number>();
    if (routeStops) {
      routeStops.forEach((s) => routeOrderMap.set(s.placeId, s.order));
    }

    const validCoordinates: L.LatLngExpression[] = [];

    places.forEach((place) => {
      if (place.latitude === undefined || place.longitude === undefined) return;

      const isSelected = place.id === selectedPlaceId;
      const order = routeOrderMap.get(place.id);
      const isRouteStop = order !== undefined;

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
            ${isRouteStop ? order : '★'}
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
      marker.bindTooltip(`<strong>${place.name}</strong><br/><span style="font-size:10px;color:#64748b;">${place.locality || ''}</span>`, {
        direction: 'top',
        offset: [0, -16],
      });

      markersGroup.addLayer(marker);
      validCoordinates.push([place.latitude, place.longitude]);
    });

    // Draw route polyline if multiple route stops exist
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    if (routeStops && routeStops.length > 1) {
      const routePoints: [number, number][] = [];
      const placeMap = new Map<string, HeritagePlace>(places.map((p) => [p.id, p]));

      routeStops
        .slice()
        .sort((a, b) => a.order - b.order)
        .forEach((s) => {
          const p = placeMap.get(s.placeId);
          if (p && p.latitude && p.longitude) {
            routePoints.push([p.latitude, p.longitude]);
          }
        });

      if (routePoints.length > 1) {
        const polyline = L.polyline(routePoints, {
          color: '#4f46e5', // Indigo-600
          weight: 4,
          opacity: 0.8,
          dashArray: '8, 8', // Schematic/estimated indicator
        }).addTo(map);

        routeLayerRef.current = polyline;
      }
    }

    // Pan map to selected place if coordinates exist
    if (selectedPlaceId) {
      const selected = places.find((p) => p.id === selectedPlaceId);
      if (selected && selected.latitude && selected.longitude) {
        map.panTo([selected.latitude, selected.longitude], { animate: true });
      }
    } else if (validCoordinates.length > 1 && !routeStops) {
      // Fit bounds if overview
      try {
        map.fitBounds(L.latLngBounds(validCoordinates), { padding: [40, 40], maxZoom: 16 });
      } catch {
        // Fallback
      }
    }
  }, [places, selectedPlaceId, routeStops]);

  const pinnedCount = places.filter((p) => p.latitude !== undefined && p.longitude !== undefined).length;
  const regionalCount = places.length - pinnedCount;

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-3xl overflow-hidden shadow-md border border-slate-200">
      <div ref={mapContainerRef} className="w-full h-full z-0 min-h-[420px]" />

      {/* Floating Status & Legend Bar */}
      <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-sm border border-slate-200 text-xs flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-1.5 font-semibold text-slate-800">
          <Layers className="w-3.5 h-3.5 text-amber-600" />
          <span>Interactive Cultural Map</span>
        </span>
        <div className="flex items-center gap-2 border-l border-slate-200 pl-2 text-[11px] text-slate-600">
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
