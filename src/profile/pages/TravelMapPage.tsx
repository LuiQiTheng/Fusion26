import React, { useId, useMemo } from 'react';
import { AlertTriangle, Calendar, ChevronDown, ChevronUp, MapPin, Plus, X } from 'lucide-react';
import { ProfileData } from '../types';
import { TravelMapView } from '../components/TravelMapView';
import { StoredImage } from '../components/StoredImage';
import { formatVisitDate } from '../memoryUtils';
import {
  MapViewport,
  TravelMapViewState,
  VisitedPlace,
  applyDateFilter,
  buildVisitedPlaces,
  getMapDateRangeError,
  isDateFilterActive,
} from '../mapUtils';

interface TravelMapPageProps {
  data: ProfileData;
  // The date filter, viewport, selected pin and panel state live in ProfilePage
  // so they survive opening a memory and coming back.
  view: TravelMapViewState;
  onViewChange: (patch: Partial<TravelMapViewState>) => void;
  onOpenMemory: (recordId: string) => void;
  onAddMemory: () => void;
}

const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00F0FF]';
const CARD = 'rounded-2xl border border-[#D4AF37]/25 bg-[#0A1F1C]/70';
const FIELD =
  'w-full min-h-[44px] rounded-xl border border-[#D4AF37]/30 bg-[#04100E] px-4 py-2 text-sm text-[#F5F5F0] focus:border-[#00F0FF]';

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

export const TravelMapPage: React.FC<TravelMapPageProps> = ({
  data,
  view,
  onViewChange,
  onOpenMemory,
  onAddMemory,
}) => {
  const ids = useId();
  const fromId = `${ids}-from`;
  const toId = `${ids}-to`;
  const panelId = `${ids}-panel`;
  const rangeErrorId = `${ids}-range-error`;

  // One entry per distinct place, built from active records only.
  const visited = useMemo(() => buildVisitedPlaces(data), [data]);
  // Must stay a stable array: the map rebuilds its pins whenever this changes.
  const visiblePlaces = useMemo(
    () => applyDateFilter(visited.places, view.dateFrom, view.dateTo),
    [visited.places, view.dateFrom, view.dateTo],
  );

  const hasRecords = data.records.length > 0;
  const rangeError = getMapDateRangeError(view.dateFrom, view.dateTo);
  const filterActive = isDateFilterActive(view.dateFrom, view.dateTo);
  const hasDateInput = view.dateFrom !== '' || view.dateTo !== '';

  // If the selected place is no longer visible (for example a new date filter), treat it as unselected.
  const selectedPlace: VisitedPlace | null =
    view.selectedPlaceKey !== null
      ? (visiblePlaces.find((place) => place.key === view.selectedPlaceKey) ?? null)
      : null;
  const selectedKey = selectedPlace ? selectedPlace.key : null;

  const matchingMemoryCount = visiblePlaces.reduce((sum, place) => sum + place.matchingRecords.length, 0);

  const handleSelect = (key: string | null) => {
    // Selecting a place also opens the mobile bottom panel so its records are visible.
    onViewChange(key === null ? { selectedPlaceKey: null } : { selectedPlaceKey: key, panelExpanded: true });
  };

  const handleViewportChange = (viewport: MapViewport) => onViewChange({ viewport });

  const clearDates = () => onViewChange({ dateFrom: '', dateTo: '' });

  const summary =
    visiblePlaces.length === 0
      ? ''
      : `${plural(visiblePlaces.length, 'visited place', 'visited places')} · ${plural(
          matchingMemoryCount,
          'memory',
          'memories',
        )}${filterActive ? ' in this date range' : ''}`;

  // ---------- Panel content ----------

  const renderPanelBody = () => {
    if (selectedPlace) {
      const hidden = selectedPlace.records.length - selectedPlace.matchingRecords.length;
      return (
        <div className="space-y-4">
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className={`inline-flex min-h-[44px] items-center gap-1 rounded-lg px-2 text-sm font-semibold text-[#E5C05C] hover:text-[#D4AF37] cursor-pointer ${FOCUS}`}
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Back to all places
            </button>
            <h2 className="flex items-start gap-2 break-words font-serif text-lg font-bold text-[#F5F5F0]">
              <MapPin className="mt-1 h-5 w-5 shrink-0 text-[#D4AF37]" aria-hidden="true" />
              {selectedPlace.name}
            </h2>
            <p className="text-xs text-[#F5F5F0]/60">
              {plural(selectedPlace.matchingRecords.length, 'memory', 'memories')}
              {selectedPlace.isCustom ? ' · Custom place' : ''}
            </p>
          </div>

          <ul aria-label={`Memories at ${selectedPlace.name}`} className="space-y-3">
            {selectedPlace.matchingRecords.map((record) => (
              <li key={record.id}>
                <button
                  type="button"
                  onClick={() => onOpenMemory(record.id)}
                  className={`flex w-full items-stretch gap-3 overflow-hidden rounded-xl border border-[#D4AF37]/25 bg-[#04100E]/60 text-left hover:border-[#D4AF37]/60 hover:bg-[#0E2925]/80 cursor-pointer ${FOCUS}`}
                >
                  <StoredImage
                    photoId={record.photoIds[0]}
                    alt={`Cover photo for your memory at ${selectedPlace.name}`}
                    className="h-auto min-h-[72px] w-20 shrink-0"
                  />
                  <span className="min-w-0 flex-1 space-y-1 py-2 pr-3">
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-[#F5F5F0]">
                      <Calendar className="h-3.5 w-3.5 shrink-0 text-[#D4AF37]" aria-hidden="true" />
                      {formatVisitDate(record.visitDate)}
                    </span>
                    {record.photoIds.length > 0 && (
                      <span className="block text-xs text-[#F5F5F0]/60">
                        {plural(record.photoIds.length, 'photo', 'photos')}
                      </span>
                    )}
                    {record.notes && (
                      <span className="line-clamp-2 block text-xs text-[#F5F5F0]/75">{record.notes}</span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {filterActive && hidden > 0 && (
            <p className="text-xs text-[#F5F5F0]/60">
              {plural(hidden, 'other memory', 'other memories')} at this place{' '}
              {hidden === 1 ? 'is' : 'are'} outside the selected dates or {hidden === 1 ? 'has' : 'have'} no visit
              date.
            </p>
          )}
        </div>
      );
    }

    if (visiblePlaces.length === 0) {
      return (
        <div className="space-y-3 text-sm text-[#F5F5F0]/70">
          {hasRecords && filterActive ? (
            <>
              <p>No visited places in this date range.</p>
              <p className="text-xs text-[#F5F5F0]/60">Memories without a visit date do not match a date range.</p>
              <button
                type="button"
                onClick={clearDates}
                className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2 text-sm font-bold text-slate-950 hover:bg-[#E5C05C] cursor-pointer ${FOCUS}`}
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Clear dates
              </button>
            </>
          ) : (
            <p>Your visited places will appear here.</p>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <p className="text-xs text-[#F5F5F0]/60">Select a pin on the map or a place below to see its memories.</p>
        <ul aria-label="Visited places" className="space-y-2">
          {visiblePlaces.map((place) => (
            <li key={place.key}>
              <button
                type="button"
                onClick={() => handleSelect(place.key)}
                className={`flex min-h-[44px] w-full items-center gap-3 rounded-xl border border-[#D4AF37]/25 bg-[#04100E]/60 px-4 py-2 text-left hover:border-[#D4AF37]/60 hover:bg-[#0E2925]/80 cursor-pointer ${FOCUS}`}
              >
                <MapPin className="h-4 w-4 shrink-0 text-[#D4AF37]" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#F5F5F0]">{place.name}</span>
                <span className="shrink-0 text-xs text-[#F5F5F0]/60">
                  {plural(place.matchingRecords.length, 'memory', 'memories')}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold text-[#F5F5F0] sm:text-3xl">Travel Map</h1>

      {/* Empty state: the normal map is still shown below */}
      {!hasRecords && (
        <div className={`${CARD} flex flex-col items-center gap-4 px-6 py-8 text-center`}>
          <MapPin className="h-10 w-10 text-[#D4AF37]/50" aria-hidden="true" />
          <div className="space-y-1">
            <p className="font-semibold text-[#F5F5F0]">No visited places yet</p>
            <p className="text-sm text-[#F5F5F0]/60">
              Add a memory for a place you have visited and it will get a pin on this map. Wishlist places and
              planned trip stops are not counted as visited.
            </p>
          </div>
          <button
            type="button"
            onClick={onAddMemory}
            className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-2 text-sm font-bold text-slate-950 hover:bg-[#E5C05C] cursor-pointer ${FOCUS}`}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add First Memory
          </button>
        </div>
      )}

      {visited.unmappedRecordCount > 0 && (
        <div role="status" className="flex items-start gap-3 rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 p-4 text-sm text-[#F5F5F0]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#E5C05C]" aria-hidden="true" />
          <p>
            {plural(visited.unmappedRecordCount, 'memory', 'memories')} could not be placed on the map because{' '}
            {visited.unmappedRecordCount === 1 ? 'its' : 'their'} location could not be found.{' '}
            {visited.unmappedRecordCount === 1 ? 'It is' : 'They are'} still in Memories.
          </p>
        </div>
      )}

      {/* Date filter */}
      {hasRecords && (
        <section aria-label="Date filter" className={`${CARD} space-y-3 p-5`}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:items-end">
            <div className="space-y-1.5">
              <label htmlFor={fromId} className="block text-sm font-semibold text-[#F5F5F0]">
                Visited from
              </label>
              <input
                id={fromId}
                type="date"
                value={view.dateFrom}
                onChange={(event) => onViewChange({ dateFrom: event.target.value })}
                aria-describedby={rangeError ? rangeErrorId : undefined}
                className={`${FIELD} ${FOCUS}`}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor={toId} className="block text-sm font-semibold text-[#F5F5F0]">
                Visited to
              </label>
              <input
                id={toId}
                type="date"
                value={view.dateTo}
                onChange={(event) => onViewChange({ dateTo: event.target.value })}
                aria-describedby={rangeError ? rangeErrorId : undefined}
                className={`${FIELD} ${FOCUS}`}
              />
            </div>
            {hasDateInput && (
              <button
                type="button"
                onClick={clearDates}
                className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-[#D4AF37]/40 px-4 text-sm font-semibold text-[#E5C05C] hover:border-[#00F0FF] cursor-pointer ${FOCUS}`}
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Clear dates
              </button>
            )}
          </div>
          {rangeError && (
            <p id={rangeErrorId} role="alert" className="text-xs text-red-300">
              {rangeError}
            </p>
          )}
          {filterActive && (
            <p className="text-xs text-[#F5F5F0]/60">
              Memories without a visit date do not match a date range.
            </p>
          )}
        </section>
      )}

      {summary && (
        <p role="status" className="text-sm text-[#F5F5F0]/70">
          {summary}
        </p>
      )}

      {/* Map and panel. On large screens the panel sits beside the map; on small screens it sits below as an expandable panel. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <TravelMapView
          places={visiblePlaces}
          selectedKey={selectedKey}
          onSelect={handleSelect}
          initialViewport={view.viewport}
          onViewportChange={handleViewportChange}
          className="h-[50vh] min-h-[320px] lg:h-[600px]"
        />

        {hasRecords && (
          <section aria-label="Places and memories" className={`${CARD} overflow-hidden`}>
            <button
              type="button"
              onClick={() => onViewChange({ panelExpanded: !view.panelExpanded })}
              aria-expanded={view.panelExpanded}
              aria-controls={panelId}
              className={`flex min-h-[48px] w-full items-center justify-between gap-3 px-5 py-3 text-left lg:hidden cursor-pointer ${FOCUS}`}
            >
              <span className="min-w-0">
                <span className="block font-semibold text-[#F5F5F0]">
                  {selectedPlace ? selectedPlace.name : 'Places and memories'}
                </span>
                <span className="block text-xs text-[#F5F5F0]/60">
                  {view.panelExpanded ? 'Tap to collapse' : 'Tap to expand'}
                </span>
              </span>
              {view.panelExpanded ? (
                <ChevronDown className="h-5 w-5 shrink-0 text-[#D4AF37]" aria-hidden="true" />
              ) : (
                <ChevronUp className="h-5 w-5 shrink-0 text-[#D4AF37]" aria-hidden="true" />
              )}
            </button>

            <div
              id={panelId}
              className={`${view.panelExpanded ? 'block' : 'hidden'} max-h-[60vh] overflow-y-auto border-t border-[#D4AF37]/15 p-5 lg:block lg:max-h-[600px] lg:border-t-0`}
            >
              {renderPanelBody()}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};