import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { AlertCircle, MapPin, Pencil, Plus, Search } from 'lucide-react';
import { HeritagePlace } from '../../types';
import { CustomPlace } from '../types';
import { PlaceInput } from '../profileRepository';
import { LocationPickerMap } from './LocationPickerMap';

interface PlaceSelectorProps {
  places: HeritagePlace[]; // existing Fusion26 places
  customPlaces: CustomPlace[]; // custom places already saved in the profile
  value: PlaceInput | null;
  onChange: (value: PlaceInput) => void;
  error?: string | null;
  disabled?: boolean;
}

const MAX_RESULTS = 8;

const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00F0FF]';

function hasValidCoordinates(place: HeritagePlace): boolean {
  const { latitude, longitude } = place;
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

interface SelectedInfo {
  name: string;
  detail: string;
  problem?: string;
}

function describeSelection(
  value: PlaceInput,
  places: HeritagePlace[],
  customPlaces: CustomPlace[],
): SelectedInfo {
  if (value.kind === 'existing') {
    const place = places.find((item) => item.id === value.placeId);
    if (!place) return { name: 'Unknown place', detail: '', problem: 'This place could not be found.' };
    return {
      name: place.name,
      detail: place.locality ?? 'Fusion26 place',
      problem: hasValidCoordinates(place)
        ? undefined
        : 'This place has no valid map location. Choose another place or set a confirmed location.',
    };
  }
  if (value.kind === 'custom') {
    const custom = customPlaces.find((item) => item.id === value.customPlaceId);
    if (!custom) {
      return { name: 'Unknown place', detail: '', problem: 'This custom place no longer exists. Please choose again.' };
    }
    return {
      name: custom.name,
      detail: `Custom place · ${custom.lat.toFixed(4)}, ${custom.lng.toFixed(4)}`,
    };
  }
  return {
    name: value.name,
    detail: `Custom place · ${value.lat.toFixed(4)}, ${value.lng.toFixed(4)}`,
  };
}

export const PlaceSelector: React.FC<PlaceSelectorProps> = ({
  places,
  customPlaces,
  value,
  onChange,
  error,
  disabled = false,
}) => {
  const [search, setSearch] = useState('');
  const [changing, setChanging] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const changeButtonRef = useRef<HTMLButtonElement>(null);

  const ids = useId();
  const searchId = `${ids}-search`;
  const errorId = `${ids}-error`;

  const isChoosing = value === null || changing;
  const wasChoosing = useRef(isChoosing);

  // Move focus when the selector switches between "choosing" and "chosen",
  // because the element that had focus disappears.
  useEffect(() => {
    if (wasChoosing.current !== isChoosing) {
      if (isChoosing) searchRef.current?.focus();
      else changeButtonRef.current?.focus();
    }
    wasChoosing.current = isChoosing;
  }, [isChoosing]);

  const query = search.trim().toLowerCase();

  const matchingPlaces = useMemo(() => {
    if (!query) return [];
    return places
      .filter((place) =>
        [place.name, place.malayName, place.locality].some(
          (field) => field !== undefined && field.toLowerCase().includes(query),
        ),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [places, query]);

  const matchingCustom = useMemo(
    () => customPlaces.filter((place) => !query || place.name.toLowerCase().includes(query)),
    [customPlaces, query],
  );

  const visiblePlaces = matchingPlaces.slice(0, MAX_RESULTS);
  const hiddenCount = matchingPlaces.length - visiblePlaces.length;

  const finishChoosing = () => {
    setChanging(false);
    setMapOpen(false);
    setSearch('');
  };

  const chooseExisting = (place: HeritagePlace) => {
    onChange({ kind: 'existing', placeId: place.id });
    finishChoosing();
  };

  const chooseCustom = (place: CustomPlace) => {
    onChange({ kind: 'custom', customPlaceId: place.id });
    finishChoosing();
  };

  const selected = value ? describeSelection(value, places, customPlaces) : null;

  // ---------- Map picker ----------

  if (mapOpen) {
    return (
      <LocationPickerMap
        initial={value?.kind === 'newCustom' ? { name: value.name, lat: value.lat, lng: value.lng } : null}
        onConfirm={(location) => {
          onChange({ kind: 'newCustom', name: location.name, lat: location.lat, lng: location.lng });
          finishChoosing();
        }}
        onCancel={() => setMapOpen(false)}
      />
    );
  }

  // ---------- Place chosen ----------

  if (!isChoosing && value && selected) {
    return (
      <div className="space-y-2">
        <p className="block text-sm font-semibold text-[#F5F5F0]">
          Place <span className="text-[#E5C05C]">*</span>
        </p>
        <div className="flex items-center gap-3 rounded-xl border border-[#D4AF37]/35 bg-[#04100E] p-4">
          <MapPin className="h-5 w-5 shrink-0 text-[#D4AF37]" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="break-words font-semibold text-[#F5F5F0]">{selected.name}</p>
            {selected.detail && <p className="text-xs text-[#F5F5F0]/60">{selected.detail}</p>}
          </div>
          <button
            ref={changeButtonRef}
            type="button"
            onClick={() => setChanging(true)}
            disabled={disabled}
            className={`inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-lg border border-[#D4AF37]/40 px-3 text-sm font-semibold text-[#F5F5F0] hover:border-[#00F0FF] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${FOCUS}`}
          >
            <Pencil className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
            Change
          </button>
        </div>
        {(selected.problem || error) && (
          <p role="alert" className="flex items-start gap-2 text-xs text-red-300">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {selected.problem ?? error}
          </p>
        )}
      </div>
    );
  }

  // ---------- Choosing ----------

  const noResults = query !== '' && visiblePlaces.length === 0 && matchingCustom.length === 0;

  return (
    <div className="space-y-3">
      <label htmlFor={searchId} className="block text-sm font-semibold text-[#F5F5F0]">
        Place <span className="text-[#E5C05C]">*</span>
      </label>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#F5F5F0]/50"
          aria-hidden="true"
        />
        <input
          ref={searchRef}
          id={searchId}
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => {
            // This sits inside a larger form, so Enter must not submit it.
            if (event.key === 'Enter') event.preventDefault();
          }}
          placeholder="Search Fusion26 places by name or area"
          disabled={disabled}
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`w-full min-h-[44px] rounded-xl border bg-[#04100E] py-2 pl-10 pr-4 text-sm text-[#F5F5F0] placeholder:text-[#F5F5F0]/40 ${
            error ? 'border-red-400' : 'border-[#D4AF37]/30 focus:border-[#00F0FF]'
          } ${FOCUS}`}
        />
      </div>

      {error && (
        <p id={errorId} role="alert" className="text-xs text-red-300">
          {error}
        </p>
      )}

      <p role="status" className="sr-only">
        {query === ''
          ? ''
          : `${matchingPlaces.length + matchingCustom.length} ${
              matchingPlaces.length + matchingCustom.length === 1 ? 'result' : 'results'
            } found`}
      </p>

      {query === '' && matchingCustom.length === 0 && (
        <p className="text-xs text-[#F5F5F0]/60">Start typing to find a place.</p>
      )}

      {matchingCustom.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[#F5F5F0]/70">Your custom places</p>
          <ul className="space-y-2">
            {matchingCustom.map((place) => (
              <li key={place.id}>
                <button
                  type="button"
                  onClick={() => chooseCustom(place)}
                  disabled={disabled}
                  className={`flex min-h-[44px] w-full items-center gap-3 rounded-xl border border-[#D4AF37]/25 bg-[#0A1F1C]/70 px-4 py-2 text-left hover:border-[#D4AF37]/60 hover:bg-[#0E2925]/80 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${FOCUS}`}
                >
                  <MapPin className="h-4 w-4 shrink-0 text-[#D4AF37]" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block break-words text-sm font-semibold text-[#F5F5F0]">{place.name}</span>
                    <span className="block text-xs text-[#F5F5F0]/60">
                      Custom place · {place.lat.toFixed(4)}, {place.lng.toFixed(4)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {visiblePlaces.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[#F5F5F0]/70">Fusion26 places</p>
          <ul className="space-y-2">
            {visiblePlaces.map((place) => {
              const valid = hasValidCoordinates(place);
              return (
                <li key={place.id}>
                  <button
                    type="button"
                    onClick={() => chooseExisting(place)}
                    disabled={disabled || !valid}
                    className={`flex min-h-[44px] w-full items-center gap-3 rounded-xl border border-[#D4AF37]/25 bg-[#0A1F1C]/70 px-4 py-2 text-left hover:border-[#D4AF37]/60 hover:bg-[#0E2925]/80 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer ${FOCUS}`}
                  >
                    <MapPin className="h-4 w-4 shrink-0 text-[#D4AF37]" aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block break-words text-sm font-semibold text-[#F5F5F0]">{place.name}</span>
                      <span className="block text-xs text-[#F5F5F0]/60">
                        {valid ? place.locality ?? 'Fusion26 place' : 'No valid map location, so it cannot be used'}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {hiddenCount > 0 && (
            <p className="text-xs text-[#F5F5F0]/60">
              Showing the first {MAX_RESULTS} of {matchingPlaces.length} places. Keep typing to narrow the list.
            </p>
          )}
        </div>
      )}

      {noResults && <p className="text-sm text-[#F5F5F0]/70">No places match "{search.trim()}".</p>}

      <div className="flex flex-wrap items-center gap-3 border-t border-[#D4AF37]/15 pt-3">
        <button
          type="button"
          onClick={() => setMapOpen(true)}
          disabled={disabled}
          className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#D4AF37]/40 px-4 py-2 text-sm font-bold text-[#F5F5F0] hover:border-[#00F0FF] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${FOCUS}`}
        >
          <Plus className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
          Can't find it? Choose a location on the map
        </button>
        {value && (
          <button
            type="button"
            onClick={() => {
              setChanging(false);
              setSearch('');
            }}
            className={`min-h-[44px] rounded-lg px-3 text-sm font-semibold text-[#E5C05C] hover:text-[#D4AF37] cursor-pointer ${FOCUS}`}
          >
            Keep current place
          </button>
        )}
      </div>
    </div>
  );
};