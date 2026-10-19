import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertCircle, Check, MapPin } from 'lucide-react';

// A location the user has named and confirmed. Coordinates always come from a map click
// or from values the user typed; they are never guessed from the name.
export interface ConfirmedLocation {
  name: string;
  lat: number;
  lng: number;
}

interface LocationPickerMapProps {
  initial?: ConfirmedLocation | null;
  onConfirm: (location: ConfirmedLocation) => void;
  onCancel: () => void;
}

const MALAYSIA_CENTER: [number, number] = [4.2105, 101.9758];
const NAME_MAX = 100;

const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00F0FF]';
const INPUT =
  'w-full min-h-[44px] rounded-xl border bg-white px-4 py-2 text-sm text-[#0A2F25] placeholder:text-[#52665F]/70';

function parseCoordinate(text: string, min: number, max: number): number | null {
  const trimmed = text.trim();
  if (trimmed === '') return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < min || value > max) return null;
  return value;
}

export const LocationPickerMap: React.FC<LocationPickerMapProps> = ({ initial, onConfirm, onCancel }) => {
  const [point, setPoint] = useState<{ lat: number; lng: number } | null>(
    initial ? { lat: initial.lat, lng: initial.lng } : null,
  );
  const [latText, setLatText] = useState(initial ? initial.lat.toFixed(6) : '');
  const [lngText, setLngText] = useState(initial ? initial.lng.toFixed(6) : '');
  const [name, setName] = useState(initial?.name ?? '');
  const [error, setError] = useState<string | null>(null);
  const [tileError, setTileError] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const startPointRef = useRef(point);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const ids = useId();
  const nameId = `${ids}-name`;
  const latId = `${ids}-lat`;
  const lngId = `${ids}-lng`;

  // Called when the user clicks or drags on the map. The text fields stay in sync.
  const choose = useCallback((lat: number, lng: number) => {
    setPoint({ lat, lng });
    setLatText(lat.toFixed(6));
    setLngText(lng.toFixed(6));
    setError(null);
  }, []);

  // Create the map once.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    const start = startPointRef.current;
    const map = L.map(container, {
      center: start ? [start.lat, start.lng] : MALAYSIA_CENTER,
      zoom: start ? 15 : 6,
      zoomControl: false,
    });
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    });
    tiles.on('tileerror', () => setTileError(true));
    tiles.addTo(map);

    map.on('click', (event: L.LeafletMouseEvent) => choose(event.latlng.lat, event.latlng.lng));
    mapRef.current = map;

    const timer = window.setTimeout(() => map.invalidateSize(), 0);

    return () => {
      window.clearTimeout(timer);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [choose]);

  // Keep the pin in step with the chosen point.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!point) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    const latlng = L.latLng(point.lat, point.lng);

    if (!markerRef.current) {
      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: '<div class="h-6 w-6 rounded-full border-2 border-white bg-[#D4AF37] shadow-lg ring-4 ring-[#D4AF37]/40"></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      const marker = L.marker(latlng, { icon, draggable: true, keyboard: false }).addTo(map);
      marker.on('dragend', () => {
        const dropped = marker.getLatLng();
        choose(dropped.lat, dropped.lng);
      });
      markerRef.current = marker;
    } else {
      markerRef.current.setLatLng(latlng);
    }

    // Typed coordinates can be far away from the current view.
    if (!map.getBounds().contains(latlng)) {
      map.setView(latlng, Math.max(map.getZoom(), 12), { animate: false });
    }
  }, [point, choose]);

  // The text fields are the source of truth: the pin only shows when both values are valid.
  const handleCoordinateChange = (which: 'lat' | 'lng', value: string) => {
    const nextLat = which === 'lat' ? value : latText;
    const nextLng = which === 'lng' ? value : lngText;
    setLatText(nextLat);
    setLngText(nextLng);
    setError(null);

    const lat = parseCoordinate(nextLat, -90, 90);
    const lng = parseCoordinate(nextLng, -180, 180);
    setPoint(lat !== null && lng !== null ? { lat, lng } : null);
  };

  const handleConfirm = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please enter a name for this place.');
      nameInputRef.current?.focus();
      return;
    }
    if (trimmedName.length > NAME_MAX) {
      setError(`Place names can be at most ${NAME_MAX} characters.`);
      nameInputRef.current?.focus();
      return;
    }

    const lat = parseCoordinate(latText, -90, 90);
    const lng = parseCoordinate(lngText, -180, 180);
    if (lat === null || lng === null) {
      setError('Click the map to place a pin, or enter valid coordinates (latitude -90 to 90, longitude -180 to 180).');
      return;
    }

    setError(null);
    onConfirm({ name: trimmedName, lat, lng });
  };

  // This component can sit inside a larger form, so Enter must not submit that form.
  const handleEnter = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleConfirm();
    }
  };

  const hasPin = point !== null;

  return (
    <section
      aria-labelledby={`${ids}-heading`}
      className="space-y-4 rounded-2xl border border-[#087E83]/20 bg-[#F4F9F6] p-5 sm:p-6"
    >
      <div className="space-y-1">
        <h2 id={`${ids}-heading`} className="flex items-center gap-2 font-serif text-lg font-bold text-[#0A2F25]">
          <MapPin className="h-5 w-5 text-[#D4AF37]" aria-hidden="true" />
          Choose a location on the map
        </h2>
        <p className="text-xs text-[#52665F]">
          Click the map to drop a pin, and drag it to adjust. You can also type the coordinates below.
        </p>
      </div>

      <div
        role="region"
        aria-label="Map. Click to place a pin. Keyboard users can type coordinates in the fields below."
        className="relative isolate h-72 w-full overflow-hidden rounded-xl border border-[#087E83]/25 sm:h-96"
      >
        <div ref={containerRef} className="h-full w-full" />
      </div>

      {tileError && (
        <p className="flex items-start gap-2 rounded-lg border border-[#087E83]/20 bg-white p-3 text-xs text-[#0A2F25]">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#E5C05C]" aria-hidden="true" />
          Map tiles are loading slowly or you are offline. You can still enter the coordinates below.
        </p>
      )}

      <div className="space-y-1.5">
        <label htmlFor={nameId} className="block text-sm font-semibold text-[#0A2F25]">
          Place name <span className="text-[#E5C05C]">*</span>
        </label>
        <input
          ref={nameInputRef}
          id={nameId}
          type="text"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setError(null);
          }}
          onKeyDown={handleEnter}
          maxLength={NAME_MAX + 20}
          aria-required="true"
          autoComplete="off"
          className={`${INPUT} border-[#D4AF37]/30 focus:border-[#00F0FF] ${FOCUS}`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor={latId} className="block text-sm font-semibold text-[#0A2F25]">
            Latitude
          </label>
          <input
            id={latId}
            type="text"
            inputMode="decimal"
            value={latText}
            onChange={(event) => handleCoordinateChange('lat', event.target.value)}
            onKeyDown={handleEnter}
            placeholder="e.g. 3.2374"
            autoComplete="off"
            className={`${INPUT} border-[#D4AF37]/30 focus:border-[#00F0FF] ${FOCUS}`}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor={lngId} className="block text-sm font-semibold text-[#0A2F25]">
            Longitude
          </label>
          <input
            id={lngId}
            type="text"
            inputMode="decimal"
            value={lngText}
            onChange={(event) => handleCoordinateChange('lng', event.target.value)}
            onKeyDown={handleEnter}
            placeholder="e.g. 101.6839"
            autoComplete="off"
            className={`${INPUT} border-[#D4AF37]/30 focus:border-[#00F0FF] ${FOCUS}`}
          />
        </div>
      </div>

      <p role="status" className="text-xs text-[#52665F]">
        {hasPin
          ? `Pin placed at ${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}.`
          : 'No pin yet. Click the map or enter coordinates.'}
      </p>

      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className={`min-h-[44px] rounded-xl border border-[#087E83]/30 bg-white px-5 py-2 text-sm font-bold text-[#0A2F25] hover:border-[#087E83] hover:bg-[#E6F3ED] cursor-pointer ${FOCUS}`}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#ffd447] px-5 py-2 text-sm font-bold text-slate-950 hover:bg-[#E5C05C] cursor-pointer ${FOCUS}`}
        >
          <Check className="h-4 w-4" aria-hidden="true" />
          Confirm location
        </button>
      </div>
    </section>
  );
};