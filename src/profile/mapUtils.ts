// Pure helpers for the Travel Map: one entry per visited place, plus the date filter.
// No React and no storage access.

import { ProfileData, TravelRecord } from './types';
import { resolvePlace } from './profileRepository';

// ---------- View state (kept by ProfilePage so it survives navigation) ----------

export interface MapViewport {
  lat: number;
  lng: number;
  zoom: number;
}

export interface TravelMapViewState {
  dateFrom: string; // "" or "YYYY-MM-DD"
  dateTo: string; // "" or "YYYY-MM-DD"
  viewport: MapViewport | null; // null means "fit all pins" the first time
  selectedPlaceKey: string | null;
  panelExpanded: boolean; // the mobile bottom panel
}

export const DEFAULT_TRAVEL_MAP_VIEW: TravelMapViewState = {
  dateFrom: '',
  dateTo: '',
  viewport: null,
  selectedPlaceKey: null,
  panelExpanded: false,
};

// ---------- Visited places ----------

export interface VisitedPlace {
  key: string; // stable id for the place, shared by all its records
  name: string;
  lat: number;
  lng: number;
  isCustom: boolean;
  records: TravelRecord[]; // every active record at this place, newest visit first
  matchingRecords: TravelRecord[]; // the records that match the current date filter
}

export interface VisitedPlacesResult {
  places: VisitedPlace[];
  // Active records whose place or coordinates could not be resolved. They are not on the map.
  unmappedRecordCount: number;
}

// Newest visit first. Records without a visit date go last, newest added first.
function compareRecords(a: TravelRecord, b: TravelRecord): number {
  if (a.visitDate !== b.visitDate) {
    if (a.visitDate === null) return 1;
    if (b.visitDate === null) return -1;
    return b.visitDate.localeCompare(a.visitDate);
  }
  return b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id);
}

// One entry per distinct place, even when it has several records.
// Only active records are used, so Recycle Bin items never create pins.
// Wishlist places and itinerary stops are not part of the profile data, so they never appear.
export function buildVisitedPlaces(data: ProfileData): VisitedPlacesResult {
  const byKey = new Map<string, VisitedPlace>();
  let unmappedRecordCount = 0;

  for (const record of data.records) {
    const resolved = resolvePlace(data, record.place);
    if (!resolved) {
      unmappedRecordCount += 1;
      continue;
    }
    const existing = byKey.get(resolved.key);
    if (existing) {
      existing.records.push(record);
    } else {
      byKey.set(resolved.key, {
        key: resolved.key,
        name: resolved.name,
        lat: resolved.lat,
        lng: resolved.lng,
        isCustom: resolved.isCustom,
        records: [record],
        matchingRecords: [],
      });
    }
  }

  const places = [...byKey.values()];
  for (const place of places) {
    place.records.sort(compareRecords);
    place.matchingRecords = place.records;
  }
  places.sort((a, b) => a.name.localeCompare(b.name));

  return { places, unmappedRecordCount };
}

// ---------- Date filter ----------

// A start date after the end date cannot match anything, so it is reported and not applied.
export function getMapDateRangeError(dateFrom: string, dateTo: string): string | null {
  if (dateFrom !== '' && dateTo !== '' && dateFrom > dateTo) {
    return 'The start date is after the end date, so the date filter is not applied.';
  }
  return null;
}

// True when a usable date range is selected.
export function isDateFilterActive(dateFrom: string, dateTo: string): boolean {
  return (dateFrom !== '' || dateTo !== '') && getMapDateRangeError(dateFrom, dateTo) === null;
}

// With no range, every place is shown. With a range, a place is shown only if at least one
// of its records has a visit date inside it. Records without a visit date never match.
// Records at the same place stay independent: each one is tested on its own.
export function applyDateFilter(places: VisitedPlace[], dateFrom: string, dateTo: string): VisitedPlace[] {
  if (!isDateFilterActive(dateFrom, dateTo)) {
    return places.map((place) => ({ ...place, matchingRecords: place.records }));
  }

  const result: VisitedPlace[] = [];
  for (const place of places) {
    const matching = place.records.filter(
      (record) =>
        record.visitDate !== null &&
        (dateFrom === '' || record.visitDate >= dateFrom) &&
        (dateTo === '' || record.visitDate <= dateTo),
    );
    if (matching.length > 0) result.push({ ...place, matchingRecords: matching });
  }
  return result;
}