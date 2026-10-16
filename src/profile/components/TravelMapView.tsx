import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertCircle } from 'lucide-react';
import { MapViewport, VisitedPlace } from '../mapUtils';

interface TravelMapViewProps {
  places: VisitedPlace[]; // places to show (already filtered by the page; keep the array stable)
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
  // Used only when the map first opens. null means "fit all pins".
  initialViewport: MapViewport | null;
  // Called whenever the user (or a fit) moves the map, so the page can remember the view.
  onViewportChange: (viewport: MapViewport) => void;
  className?: string;
}

const MALAYSIA_CENTER: [number, number] = [4.2105, 101.9758];

const PIN_SVG =
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';

// The icon only contains a number or a fixed SVG, never user text.
function buildIcon(place: VisitedPlace, selected: boolean): L.DivIcon {
  const count = place.matchingRecords.length;
  const content = count > 1 ? String(count) : PIN_SVG;
  const look = selected
    ? 'scale-125 border-white bg-[#D4AF37] text-slate-950 ring-4 ring-[#00F0FF]/70'
    : 'border-[#04100E] bg-[#D4AF37] text-slate-950';
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold shadow-lg ${look}">${content}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function markerTitle(place: VisitedPlace): string {
  const count = place.matchingRecords.length;
  return `${place.name}, ${count} ${count === 1 ? 'memory' : 'memories'}`;
}

function fitToPlaces(map: L.Map, places: VisitedPlace[]): void {
  map.invalidateSize();
  if (places.length === 0) {
    map.setView(MALAYSIA_CENTER, 6, { animate: false });
    return;
  }
  if (places.length === 1) {
    map.setView([places[0].lat, places[0].lng], 14, { animate: false });
    return;
  }
  const bounds = L.latLngBounds(places.map((place) => [place.lat, place.lng] as L.LatLngTuple));
  map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15, animate: false });
}

export const TravelMapView: React.FC<TravelMapViewProps> = ({
  places,
  selectedKey,
  onSelect,
  initialViewport,
  onViewportChange,
  className = '',
}) => {
  const [tileError, setTileError] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef(new Map<string, L.Marker>());
  const placesByKeyRef = useRef(new Map<string, VisitedPlace>());

  const initialViewportRef = useRef(initialViewport);
  const isFirstFitRef = useRef(true);
  const selectedKeyRef = useRef(selectedKey);
  const prevSelectedRef = useRef<string | null>(null);

  // Keep the latest callbacks without re-running the effects below.
  const onSelectRef = useRef(onSelect);
  const onViewportChangeRef = useRef(onViewportChange);
  useEffect(() => {
    onSelectRef.current = onSelect;
    onViewportChangeRef.current = onViewportChange;
  });

  // ---------- Create the map once ----------

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    const start = initialViewportRef.current;
    const map = L.map(container, {
      center: start ? [start.lat, start.lng] : MALAYSIA_CENTER,
      zoom: start ? start.zoom : 6,
      zoomControl: false,
    });
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    });
    tiles.on('tileerror', () => setTileError(true));
    tiles.addTo(map);

    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    // Clicking empty map clears the selection. Marker clicks do not reach this handler.
    map.on('click', () => onSelectRef.current(null));
    map.on('moveend', () => {
      const center = map.getCenter();
      onViewportChangeRef.current({ lat: center.lat, lng: center.lng, zoom: map.getZoom() });
    });

    // The page layout can change size (for example the mobile bottom panel), so keep Leaflet in step.
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => map.invalidateSize());
      observer.observe(container);
    }
    const timer = window.setTimeout(() => map.invalidateSize(), 0);

    return () => {
      window.clearTimeout(timer);
      observer?.disconnect();
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      // A fresh map should treat its first fit as a first fit again.
      isFirstFitRef.current = true;
      prevSelectedRef.current = null;
    };
  }, []);

  // ---------- Pins: one marker per distinct place ----------

  useEffect(() => {
    const layer = layerRef.current;
    if (!mapRef.current || !layer) return;

    const markers = markersRef.current;
    layer.clearLayers();
    markers.clear();
    placesByKeyRef.current = new Map(places.map((place) => [place.key, place]));

    for (const place of places) {
      const marker = L.marker([place.lat, place.lng], {
        icon: buildIcon(place, place.key === selectedKeyRef.current),
        title: markerTitle(place), // also gives keyboard and screen-reader users a name
        keyboard: true,
        riseOnHover: true,
      });
      marker.on('click', () => onSelectRef.current(place.key));
      layer.addLayer(marker);
      markers.set(place.key, marker);
    }

    return () => {
      layer.clearLayers();
      markers.clear();
    };
  }, [places]);

  // ---------- Selection highlight (updates only the pins that changed) ----------

  useEffect(() => {
    selectedKeyRef.current = selectedKey;
    const previous = prevSelectedRef.current;
    prevSelectedRef.current = selectedKey;

    const refresh = (key: string, selected: boolean) => {
      const marker = markersRef.current.get(key);
      const place = placesByKeyRef.current.get(key);
      if (!marker || !place) return;
      // Replacing the icon replaces the element, so give focus back if it was on this pin.
      const hadFocus = marker.getElement() !== undefined && marker.getElement() === document.activeElement;
      marker.setIcon(buildIcon(place, selected));
      marker.setZIndexOffset(selected ? 1000 : 0);
      if (hadFocus) marker.getElement()?.focus();
    };

    if (previous && previous !== selectedKey) refresh(previous, false);
    if (selectedKey) {
      refresh(selectedKey, true);
      // Selecting from the list should bring the pin into view.
      const map = mapRef.current;
      const marker = markersRef.current.get(selectedKey);
      if (map && marker && !map.getBounds().contains(marker.getLatLng())) {
        map.panTo(marker.getLatLng());
      }
    }
  }, [selectedKey]);

  // ---------- Fit the view when the set of pins changes ----------

  const signature = places.map((place) => place.key).join('|');

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (isFirstFitRef.current) {
      isFirstFitRef.current = false;
      // Coming back to the map: keep the viewport the user left.
      if (initialViewportRef.current) return;
    }
    fitToPlaces(map, places);
    // Re-fit only when the set of places changes (for example a new date filter).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  const label =
    places.length === 0
      ? 'Travel map. No visited places to show.'
      : `Travel map showing ${places.length} visited ${places.length === 1 ? 'place' : 'places'}. ` +
        'Pins can be reached with Tab and opened with Enter. The same places are listed next to the map.';

  return (
    <div
      role="region"
      aria-label={label}
      className={`relative isolate z-0 overflow-hidden rounded-2xl border border-[#D4AF37]/30 ${className}`}
    >
      <div ref={containerRef} className="h-full w-full" />

      {tileError && (
        <div className="absolute bottom-3 left-3 z-[1000] flex max-w-[80%] items-center gap-2 rounded-xl border border-[#D4AF37]/40 bg-[#0A1F1C]/95 px-3 py-1.5 text-xs text-[#F5F5F0]">
          <AlertCircle className="h-4 w-4 shrink-0 text-[#E5C05C]" aria-hidden="true" />
          <span>Map tiles are loading slowly or you are offline. The list still works.</span>
        </div>
      )}
    </div>
  );
};