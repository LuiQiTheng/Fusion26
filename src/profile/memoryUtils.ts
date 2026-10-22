// Pure helpers for the Memories page: search, filters, sorting and date formatting.
// No React and no storage access, so the rules are easy to read and test.

import { ProfileData, TravelRecord } from './types';
import { placeKeyOf, resolvePlace } from './profileRepository';

// ---------- View state (kept by ProfilePage so it survives navigation) ----------

export type MemoryViewMode = 'grid' | 'timeline';
export type MemorySort = 'created-desc' | 'created-asc' | 'visit-desc' | 'visit-asc';
export type PhotoFilter = 'all' | 'with' | 'without';

export const SORT_LABELS: Record<MemorySort, string> = {
  'created-desc': 'Newest added first',
  'created-asc': 'Oldest added first',
  'visit-desc': 'Latest visit date first',
  'visit-asc': 'Earliest visit date first',
};

export interface MemoryFilters {
  search: string;
  dateFrom: string; // "" or "YYYY-MM-DD"
  dateTo: string; // "" or "YYYY-MM-DD"
  placeKey: string; // "" means all places
  photos: PhotoFilter;
}

export const DEFAULT_FILTERS: MemoryFilters = {
  search: '',
  dateFrom: '',
  dateTo: '',
  placeKey: '',
  photos: 'all',
};

export interface MemoriesViewState {
  mode: MemoryViewMode;
  sort: MemorySort;
  filters: MemoryFilters;
}

// Default sort: newest record creation first.
export const DEFAULT_MEMORIES_VIEW: MemoriesViewState = {
  mode: 'grid',
  sort: 'created-desc',
  filters: DEFAULT_FILTERS,
};

// Number of filters currently narrowing the list (the search box counts as one).
export function countActiveFilters(filters: MemoryFilters): number {
  let count = 0;
  if (filters.search.trim() !== '') count += 1;
  if (filters.dateFrom !== '' || filters.dateTo !== '') count += 1;
  if (filters.placeKey !== '') count += 1;
  if (filters.photos !== 'all') count += 1;
  return count;
}

// A start date after the end date cannot match anything, so it is reported and not applied.
export function getDateRangeError(filters: MemoryFilters): string | null {
  if (filters.dateFrom !== '' && filters.dateTo !== '' && filters.dateFrom > filters.dateTo) {
    return 'The start date is after the end date, so the date filter is not applied.';
  }
  return null;
}

// ---------- Items ----------

export interface MemoryItem {
  record: TravelRecord;
  placeKey: string;
  placeName: string;
}

// Active records only. Recycled records are never part of this list.
export function buildMemoryItems(data: ProfileData): MemoryItem[] {
  return data.records.map((record) => ({
    record,
    placeKey: placeKeyOf(record.place),
    placeName: resolvePlace(data, record.place)?.name ?? 'Unknown place',
  }));
}

export interface PlaceOption {
  key: string;
  name: string;
  count: number; // number of active records at this place
}

// Distinct places that have at least one active record, sorted by name.
export function listPlaceOptions(items: MemoryItem[]): PlaceOption[] {
  const byKey = new Map<string, PlaceOption>();
  for (const item of items) {
    const existing = byKey.get(item.placeKey);
    if (existing) existing.count += 1;
    else byKey.set(item.placeKey, { key: item.placeKey, name: item.placeName, count: 1 });
  }
  return [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name));
}

// ---------- Filtering and sorting ----------

function compareCreated(a: MemoryItem, b: MemoryItem): number {
  return a.record.createdAt.localeCompare(b.record.createdAt) || a.record.id.localeCompare(b.record.id);
}

// Records without a visit date always go last, in either direction.
function compareVisit(a: MemoryItem, b: MemoryItem, direction: 1 | -1): number {
  const aDate = a.record.visitDate;
  const bDate = b.record.visitDate;
  if (aDate === bDate) return compareCreated(b, a);
  if (aDate === null) return 1;
  if (bDate === null) return -1;
  return aDate.localeCompare(bDate) * direction;
}

export function sortMemories(items: MemoryItem[], sort: MemorySort): MemoryItem[] {
  const sorted = [...items];
  switch (sort) {
    case 'created-asc':
      return sorted.sort(compareCreated);
    case 'visit-desc':
      return sorted.sort((a, b) => compareVisit(a, b, -1));
    case 'visit-asc':
      return sorted.sort((a, b) => compareVisit(a, b, 1));
    case 'created-desc':
    default:
      return sorted.sort((a, b) => compareCreated(b, a));
  }
}

// All active filters are combined with AND.
// - Search: every word must appear in the place name or the notes.
// - Date range: uses the actual visit date; records without one never match a selected range.
export function filterAndSortMemories(
  items: MemoryItem[],
  filters: MemoryFilters,
  sort: MemorySort,
): MemoryItem[] {
  const terms = filters.search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const rangeUsable = getDateRangeError(filters) === null;
  const from = rangeUsable ? filters.dateFrom : '';
  const to = rangeUsable ? filters.dateTo : '';

  const matched = items.filter((item) => {
    const { record } = item;

    if (terms.length > 0) {
      const haystack = `${item.placeName} ${record.notes}`.toLowerCase();
      if (!terms.every((term) => haystack.includes(term))) return false;
    }

    if (filters.placeKey !== '' && item.placeKey !== filters.placeKey) return false;

    if (filters.photos === 'with' && record.photoIds.length === 0) return false;
    if (filters.photos === 'without' && record.photoIds.length > 0) return false;

    if (from !== '' || to !== '') {
      if (record.visitDate === null) return false;
      if (from !== '' && record.visitDate < from) return false;
      if (to !== '' && record.visitDate > to) return false;
    }

    return true;
  });

  return sortMemories(matched, sort);
}

// ---------- Date formatting ----------

// "2025-03-14" -> "14 Mar 2025". Built from the parts so time zones cannot shift the day.
export function formatVisitDate(value: string | null): string {
  if (!value) return 'Date not set';
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return 'Date not set';
  return date.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ISO timestamp -> "14 Mar 2025" (empty string if the timestamp is unreadable).
export function formatTimestampDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });
}


// ---------- Memory privacy ----------

// How the person looking at a memory relates to its owner.
export type MemoryViewerRelation = 'owner' | 'friend' | 'other';

// The one place that decides who may see a memory. Owners always can. Everyone else follows the
// memory's visibility: public = anyone, friends = accepted friends only. Private, and any value
// that is not recognised, is hidden from everyone but the owner.
export function canViewMemory(record: TravelRecord, relation: MemoryViewerRelation): boolean {
  if (relation === 'owner') return true;
  switch (record.visibility) {
    case 'public':
      return true;
    case 'friends':
      return relation === 'friend';
    default:
      return false;
  }
}