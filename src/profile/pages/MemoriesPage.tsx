
import React, { useId, useMemo } from 'react';
import { Calendar, Camera, LayoutGrid, List, MapPin, Plus, Search, Trash2, X } from 'lucide-react';
import { ProfileData } from '../types';
import { StoredImage } from '../components/StoredImage';
import {
  DEFAULT_FILTERS,
  MemoriesViewState,
  MemoryFilters,
  MemoryItem,
  MemorySort,
  PhotoFilter,
  SORT_LABELS,
  buildMemoryItems,
  countActiveFilters,
  filterAndSortMemories,
  formatTimestampDate,
  formatVisitDate,
  getDateRangeError,
  listPlaceOptions,
} from '../memoryUtils';

interface MemoriesPageProps {
  data: ProfileData;
  // The search, filters, sort and display mode live in ProfilePage so they survive navigation.
  view: MemoriesViewState;
  onViewChange: (next: MemoriesViewState) => void;
  recycleBinCount: number;
  onOpenMemory: (recordId: string) => void;
  onAddMemory: () => void;
  onOpenRecycleBin: () => void;
}

const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087E83]';
const CARD = 'rounded-2xl border border-[#087E83]/20 bg-white shadow-sm';
const FIELD =
  'w-full min-h-[44px] rounded-xl border border-[#087E83]/30 bg-white px-4 py-2 text-sm text-[#0A2F25] placeholder:text-[#0A2F25]/50 focus:border-[#087E83]';

const PHOTO_FILTER_LABELS: Record<PhotoFilter, string> = {
  all: 'All memories',
  with: 'With photos',
  without: 'Without photos',
};

// "March 2025" for a visit date ("YYYY-MM-DD") or a creation timestamp.
function monthLabel(item: MemoryItem, sort: MemorySort): string {
  if (sort === 'visit-desc' || sort === 'visit-asc') {
    const value = item.record.visitDate;
    if (!value) return 'No visit date';
    const [year, month] = value.split('-').map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString('en-MY', { month: 'long', year: 'numeric' });
  }
  const created = new Date(item.record.createdAt);
  if (Number.isNaN(created.getTime())) return 'Unknown date';
  return created.toLocaleDateString('en-MY', { month: 'long', year: 'numeric' });
}

function groupForTimeline(items: MemoryItem[], sort: MemorySort): { label: string; items: MemoryItem[] }[] {
  const groups: { label: string; items: MemoryItem[] }[] = [];
  for (const item of items) {
    const label = monthLabel(item, sort);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(item);
    else groups.push({ label, items: [item] });
  }
  return groups;
}

const PhotoCount: React.FC<{ count: number }> = ({ count }) =>
  count > 0 ? (
    <span>
      {' '}
      · {count} {count === 1 ? 'photo' : 'photos'}
    </span>
  ) : null;

// ---------- Cards ----------

const GridCard: React.FC<{ item: MemoryItem; onOpen: () => void }> = ({ item, onOpen }) => {
  const { record, placeName } = item;
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`${CARD} flex h-full w-full flex-col overflow-hidden text-left transition-all hover:border-[#087E83]/50 hover:bg-[#E6F3ED]/80 cursor-pointer ${FOCUS}`}
    >
      <StoredImage
        photoId={record.photoIds[0]}
        alt={`Cover photo for your memory at ${placeName}`}
        className="h-44 w-full shrink-0"
      />
      <div className="flex-1 space-y-1.5 p-4">
        <h3 className="flex items-center gap-1.5 font-semibold text-[#0A2F25]">
          <MapPin className="h-4 w-4 shrink-0 text-[#087E83]" aria-hidden="true" />
          <span className="truncate">{placeName}</span>
        </h3>
        <p className="flex items-center gap-1.5 text-xs text-[#0A2F25]/65">
          <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {formatVisitDate(record.visitDate)}
          <PhotoCount count={record.photoIds.length} />
        </p>
        {record.notes && <p className="line-clamp-2 text-sm text-[#0A2F25]/80">{record.notes}</p>}
      </div>
    </button>
  );
};

const TimelineCard: React.FC<{ item: MemoryItem; onOpen: () => void }> = ({ item, onOpen }) => {
  const { record, placeName } = item;
  const added = formatTimestampDate(record.createdAt);
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`${CARD} flex w-full items-stretch gap-4 overflow-hidden text-left transition-all hover:border-[#087E83]/50 hover:bg-[#E6F3ED]/80 cursor-pointer ${FOCUS}`}
    >
      <StoredImage
        photoId={record.photoIds[0]}
        alt={`Cover photo for your memory at ${placeName}`}
        className="h-auto min-h-[96px] w-24 shrink-0 sm:w-32"
      />
      <div className="min-w-0 flex-1 space-y-1 py-3 pr-4">
        <h4 className="flex items-center gap-1.5 font-semibold text-[#0A2F25]">
          <MapPin className="h-4 w-4 shrink-0 text-[#087E83]" aria-hidden="true" />
          <span className="truncate">{placeName}</span>
        </h4>
        <p className="flex flex-wrap items-center gap-x-1 text-xs text-[#0A2F25]/65">
          <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {formatVisitDate(record.visitDate)}
          <PhotoCount count={record.photoIds.length} />
          {added && <span> · Added {added}</span>}
        </p>
        {record.notes && <p className="line-clamp-2 text-sm text-[#0A2F25]/80">{record.notes}</p>}
      </div>
    </button>
  );
};

// ---------- Page ----------

export const MemoriesPage: React.FC<MemoriesPageProps> = ({
  data,
  view,
  onViewChange,
  recycleBinCount,
  onOpenMemory,
  onAddMemory,
  onOpenRecycleBin,
}) => {
  const ids = useId();
  const searchId = `${ids}-search`;
  const fromId = `${ids}-from`;
  const toId = `${ids}-to`;
  const placeId = `${ids}-place`;
  const photosId = `${ids}-photos`;
  const sortId = `${ids}-sort`;

  const allItems = useMemo(() => buildMemoryItems(data), [data]);
  const placeOptions = useMemo(() => listPlaceOptions(allItems), [allItems]);

  // If the chosen place no longer has any memories (for example it was deleted),
  // treat the place filter as unset instead of showing an empty list.
  const placeStillExists = view.filters.placeKey === '' || placeOptions.some((option) => option.key === view.filters.placeKey);
  const filters: MemoryFilters = placeStillExists ? view.filters : { ...view.filters, placeKey: '' };

  const results = useMemo(
    () => filterAndSortMemories(allItems, filters, view.sort),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allItems, view.filters, view.sort, placeStillExists],
  );
  const timelineGroups = useMemo(
    () => (view.mode === 'timeline' ? groupForTimeline(results, view.sort) : []),
    [results, view.mode, view.sort],
  );

  const activeFilterCount = countActiveFilters(filters);
  const dateRangeError = getDateRangeError(filters);

  const setFilters = (patch: Partial<MemoryFilters>) =>
    onViewChange({ ...view, filters: { ...filters, ...patch } });
  const clearFilters = () => onViewChange({ ...view, filters: DEFAULT_FILTERS });

  const resultSummary =
    activeFilterCount > 0
      ? `Showing ${results.length} of ${allItems.length} ${allItems.length === 1 ? 'memory' : 'memories'}`
      : `${allItems.length} ${allItems.length === 1 ? 'memory' : 'memories'}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-2xl font-bold text-[#0A2F25] sm:text-3xl">Memories</h1>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onOpenRecycleBin}
            className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#087E83]/30 bg-white px-4 py-2 text-sm font-bold text-[#0A2F25] hover:border-[#087E83] cursor-pointer ${FOCUS}`}
          >
            <Trash2 className="h-4 w-4 text-[#087E83]" aria-hidden="true" />
            Recycle Bin
            {recycleBinCount > 0 && (
              <span className="rounded-full bg-[#E6F3ED] px-2 py-0.5 text-[10px] font-bold text-[#0A2F25]">
                <span className="sr-only">{recycleBinCount} items: </span>
                {recycleBinCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={onAddMemory}
            className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#087E83] px-4 py-2 text-sm font-bold text-white hover:bg-[#0A2F25] cursor-pointer ${FOCUS}`}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Memory
          </button>
        </div>
      </div>

      {allItems.length === 0 ? (
        <div className={`${CARD} flex flex-col items-center gap-4 px-6 py-12 text-center`}>
          <Camera className="h-10 w-10 text-[#087E83]/60" aria-hidden="true" />
          <div className="space-y-1">
            <p className="font-semibold text-[#0A2F25]">No memories yet</p>
            <p className="text-sm text-[#0A2F25]/65">
              Record a place you have visited, with an optional date, notes and photos.
            </p>
          </div>
          <button
            type="button"
            onClick={onAddMemory}
            className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#087E83] px-5 py-2 text-sm font-bold text-white hover:bg-[#0A2F25] cursor-pointer ${FOCUS}`}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add First Memory
          </button>
        </div>
      ) : (
        <>
          {/* Search and filters */}
          <section aria-label="Search and filters" className={`${CARD} space-y-4 p-5`}>
            <div className="space-y-1.5">
              <label htmlFor={searchId} className="block text-sm font-semibold text-[#0A2F25]">
                Search place names and notes
              </label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0A2F25]/60"
                  aria-hidden="true"
                />
                <input
                  id={searchId}
                  type="search"
                  value={view.filters.search}
                  onChange={(event) => setFilters({ search: event.target.value })}
                  placeholder="e.g. mosque, sunset, with family"
                  autoComplete="off"
                  className={`${FIELD} pl-10 ${FOCUS}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <label htmlFor={fromId} className="block text-sm font-semibold text-[#0A2F25]">
                  Visited from
                </label>
                <input
                  id={fromId}
                  type="date"
                  value={view.filters.dateFrom}
                  onChange={(event) => setFilters({ dateFrom: event.target.value })}
                  aria-describedby={dateRangeError ? `${ids}-range-error` : undefined}
                  className={`${FIELD} ${FOCUS}`}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor={toId} className="block text-sm font-semibold text-[#0A2F25]">
                  Visited to
                </label>
                <input
                  id={toId}
                  type="date"
                  value={view.filters.dateTo}
                  onChange={(event) => setFilters({ dateTo: event.target.value })}
                  aria-describedby={dateRangeError ? `${ids}-range-error` : undefined}
                  className={`${FIELD} ${FOCUS}`}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor={placeId} className="block text-sm font-semibold text-[#0A2F25]">
                  Place
                </label>
                <select
                  id={placeId}
                  value={filters.placeKey}
                  onChange={(event) => setFilters({ placeKey: event.target.value })}
                  className={`${FIELD} ${FOCUS}`}
                >
                  <option value="">All places</option>
                  {placeOptions.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.name} ({option.count})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor={photosId} className="block text-sm font-semibold text-[#0A2F25]">
                  Photos
                </label>
                <select
                  id={photosId}
                  value={filters.photos}
                  onChange={(event) => setFilters({ photos: event.target.value as PhotoFilter })}
                  className={`${FIELD} ${FOCUS}`}
                >
                  {(Object.keys(PHOTO_FILTER_LABELS) as PhotoFilter[]).map((key) => (
                    <option key={key} value={key}>
                      {PHOTO_FILTER_LABELS[key]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {dateRangeError && (
              <p id={`${ids}-range-error`} role="alert" className="text-xs text-red-700">
                {dateRangeError}
              </p>
            )}
            {(filters.dateFrom !== '' || filters.dateTo !== '') && !dateRangeError && (
              <p className="text-xs text-[#0A2F25]/65">
                Memories without a visit date do not match a date range.
              </p>
            )}

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className={`inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-[#087E83]/30 bg-white px-4 text-sm font-semibold text-[#087E83] hover:border-[#087E83] hover:bg-[#E6F3ED] cursor-pointer ${FOCUS}`}
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Clear Filters ({activeFilterCount})
              </button>
            )}
          </section>

          {/* Display mode, sort and result count */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div role="group" aria-label="Display mode" className="inline-flex overflow-hidden rounded-xl border border-[#087E83]/30 bg-white">
              <button
                type="button"
                onClick={() => onViewChange({ ...view, mode: 'grid' })}
                aria-pressed={view.mode === 'grid'}
                className={`inline-flex min-h-[44px] items-center gap-2 px-4 text-sm font-semibold cursor-pointer ${FOCUS} ${
                  view.mode === 'grid' ? 'bg-[#E6F3ED] text-[#0A2F25]' : 'text-[#0A2F25]/80 hover:bg-[#F4F9F6]'
                }`}
              >
                <LayoutGrid className="h-4 w-4" aria-hidden="true" />
                Photo Grid
              </button>
              <button
                type="button"
                onClick={() => onViewChange({ ...view, mode: 'timeline' })}
                aria-pressed={view.mode === 'timeline'}
                className={`inline-flex min-h-[44px] items-center gap-2 border-l border-[#087E83]/30 px-4 text-sm font-semibold cursor-pointer ${FOCUS} ${
                  view.mode === 'timeline' ? 'bg-[#E6F3ED] text-[#0A2F25]' : 'text-[#0A2F25]/80 hover:bg-[#F4F9F6]'
                }`}
              >
                <List className="h-4 w-4" aria-hidden="true" />
                Timeline
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <p role="status" className="text-sm text-[#0A2F25]/75">
                {resultSummary}
              </p>
              <div className="flex items-center gap-2">
                <label htmlFor={sortId} className="text-sm font-semibold text-[#0A2F25]">
                  Sort
                </label>
                <select
                  id={sortId}
                  value={view.sort}
                  onChange={(event) => onViewChange({ ...view, sort: event.target.value as MemorySort })}
                  className={`${FIELD} w-auto ${FOCUS}`}
                >
                  {(Object.keys(SORT_LABELS) as MemorySort[]).map((key) => (
                    <option key={key} value={key}>
                      {SORT_LABELS[key]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Results */}
          {results.length === 0 ? (
            <div className={`${CARD} flex flex-col items-center gap-4 px-6 py-10 text-center`}>
              <Search className="h-8 w-8 text-[#087E83]/60" aria-hidden="true" />
              <div className="space-y-1">
                <p className="font-semibold text-[#0A2F25]">No memories match your filters</p>
                <p className="text-sm text-[#0A2F25]/65">Try removing a filter or searching for something else.</p>
              </div>
              <button
                type="button"
                onClick={clearFilters}
                className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#087E83] px-5 py-2 text-sm font-bold text-white hover:bg-[#0A2F25] cursor-pointer ${FOCUS}`}
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Clear Filters
              </button>
            </div>
          ) : view.mode === 'grid' ? (
            <ul aria-label="Memories" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((item) => (
                <li key={item.record.id}>
                  <GridCard item={item} onOpen={() => onOpenMemory(item.record.id)} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="space-y-8">
              {timelineGroups.map((group) => (
                <section key={group.label} aria-label={group.label} className="space-y-3">
                  <h2 className="font-serif text-lg font-bold text-[#0A2F25]">{group.label}</h2>
                  <ul className="space-y-3 border-l-2 border-[#087E83]/30 pl-4 sm:pl-6">
                    {group.items.map((item) => (
                      <li key={item.record.id} className="relative">
                        <span
                          className="absolute -left-[1.35rem] top-6 h-3 w-3 rounded-full border-2 border-[#F4F9F6] bg-[#087E83] sm:-left-[1.85rem]"
                          aria-hidden="true"
                        />
                        <TimelineCard item={item} onOpen={() => onOpenMemory(item.record.id)} />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
