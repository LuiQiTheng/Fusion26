import React, { useMemo, useState } from 'react';
import { ArrowRight, Bookmark, Clock, Compass, Info, MapPin } from 'lucide-react';
import { HeritagePlace, Itinerary, ItineraryStop } from '../../types';
import { loadItinerary } from '../../lib/persistence';

interface MyTripsPageProps {
  places: HeritagePlace[]; // existing Fusion26 places, used to look up stop names
  onOpenSavedTrips: () => void; // opens the existing Saved Trips tab
  onExplore: () => void; // opens the existing Explore tab
}

const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087E83]';
const CARD = 'rounded-2xl border border-[#087E83]/20 bg-white shadow-sm';
const BTN =
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-bold cursor-pointer';

function isUsableNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

// 45 -> "45 min", 90 -> "1 h 30 min". Returns null when the value is missing or unusable.
function formatMinutes(value: unknown): string | null {
  if (!isUsableNumber(value)) return null;
  const total = Math.round(value);
  if (total < 60) return `${total} min`;
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}

function formatSavedDate(iso: unknown): string | null {
  if (typeof iso !== 'string') return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });
}

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

export const MyTripsPage: React.FC<MyTripsPageProps> = ({ places, onOpenSavedTrips, onExplore }) => {
  // Read once when the page opens. This is the trip stored with Save, not unsaved planner changes.
  const [itinerary] = useState<Itinerary | null>(() => loadItinerary());

  const placesById = useMemo(() => new Map(places.map((place) => [place.id, place])), [places]);

  // Stored data comes from localStorage, so guard against missing or odd values.
  const stops: ItineraryStop[] = useMemo(() => {
    if (!itinerary || !Array.isArray(itinerary.stops)) return [];
    return [...itinerary.stops].sort((a, b) => {
      const aOrder = typeof a.order === 'number' ? a.order : 0;
      const bOrder = typeof b.order === 'number' ? b.order : 0;
      return aOrder - bOrder;
    });
  }, [itinerary]);

  // ---------- Empty state ----------

  if (!itinerary) {
    return (
      <div className="space-y-6">
        <h1 className="font-serif text-2xl font-bold text-[#0A2F25] sm:text-3xl">My Trips</h1>

        <div className={`${CARD} flex flex-col items-center gap-4 px-6 py-12 text-center`}>
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E6F3ED] text-[#087E83]">
            <Bookmark className="h-8 w-8" aria-hidden="true" />
          </span>
          <div className="space-y-1">
            <p className="font-semibold text-[#0A2F25]">No saved trip yet</p>
            <p className="text-sm text-[#0A2F25]/70">
              Plan a trip in Explore and press Save. It will appear here.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={onExplore}
              className={`${BTN} bg-[#087E83] text-white hover:bg-[#066468] ${FOCUS}`}
            >
              <Compass className="h-4 w-4" aria-hidden="true" />
              Explore Places
            </button>
            <button
              type="button"
              onClick={onOpenSavedTrips}
              className={`${BTN} border border-[#087E83] bg-white text-[#0A2F25] hover:bg-[#E6F3ED] ${FOCUS}`}
            >
              Open Saved Trips
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Saved trip ----------

  const title =
    typeof itinerary.title === 'string' && itinerary.title.trim() !== '' ? itinerary.title : 'Untitled trip';
  const savedDate = formatSavedDate(itinerary.updatedAt);

  const summaryItems = [
    { label: 'Stops', value: String(stops.length) },
    { label: 'Total planned time', value: formatMinutes(itinerary.totalPlannedMinutes) },
    { label: 'Time at places', value: formatMinutes(itinerary.totalVisitMinutes) },
    { label: 'Travel time', value: formatMinutes(itinerary.totalTravelMinutes) },
  ].filter((item): item is { label: string; value: string } => item.value !== null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-2xl font-bold text-[#0A2F25] sm:text-3xl">My Trips</h1>
        <button
          type="button"
          onClick={onOpenSavedTrips}
          className={`${BTN} bg-[#087E83] text-white hover:bg-[#066468] ${FOCUS}`}
        >
          Open in Saved Trips
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-[#087E83]/20 bg-[#E6F3ED] p-4 text-sm text-[#0A2F25]">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#087E83]" aria-hidden="true" />
        <p>
          This is a read-only summary of the trip you saved. To change it, open Saved Trips or the trip planner.
          Changes you have not saved there are not shown here.
        </p>
      </div>

      <section aria-labelledby="my-trip-title" className={`${CARD} space-y-5 border-l-4 border-l-[#B88E18] p-5 sm:p-6`}>
        <div className="space-y-1">
          <h2 id="my-trip-title" className="break-words font-serif text-xl font-bold text-[#0A2F25]">
            {title}
          </h2>
          {savedDate && <p className="text-xs text-[#0A2F25]/70">Last saved {savedDate}</p>}
        </div>

        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {summaryItems.map((item) => (
            <div key={item.label} className="rounded-xl bg-[#E6F3ED] p-3 text-center">
              <dd className="font-serif text-lg font-bold text-[#0A2F25]">{item.value}</dd>
              <dt className="flex items-center justify-center gap-1 text-xs text-[#0A2F25]/70">
                {item.label === 'Total planned time' && <Clock className="h-3 w-3" aria-hidden="true" />}
                {item.label}
              </dt>
            </div>
          ))}
        </dl>

        {stops.length === 0 ? (
          <p className="text-sm text-[#0A2F25]/70">This saved trip has no stops yet.</p>
        ) : (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#0A2F25]">
              {plural(stops.length, 'stop', 'stops')} in order
            </h3>
            <ol aria-label="Trip stops" className="space-y-3">
              {stops.map((stop, index) => {
                const place = placesById.get(stop.placeId);
                const visit = formatMinutes(stop.visitDurationMinutes);

                return (
                  <li
                    key={`${stop.placeId}-${index}`}
                    className="flex items-start gap-4 rounded-xl border border-[#087E83]/15 bg-[#F4F9F6] p-4"
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[#B88E18] bg-white text-sm font-bold text-[#0A2F25]"
                      aria-hidden="true"
                    >
                      {index + 1}
                    </span>

                    <div className="min-w-0 flex-1 space-y-1">
                      {place ? (
                        <>
                          <h4 className="break-words font-semibold text-[#0A2F25]">
                            <span className="sr-only">Stop {index + 1}: </span>
                            {place.name}
                          </h4>
                          {place.locality && (
                            <p className="flex items-center gap-1.5 text-xs text-[#0A2F25]/70">
                              <MapPin className="h-3.5 w-3.5 shrink-0 text-[#087E83]" aria-hidden="true" />
                              {place.locality}
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <h4 className="font-semibold text-[#0A2F25]">
                            <span className="sr-only">Stop {index + 1}: </span>
                            Place no longer available
                          </h4>
                          <p className="break-all text-xs text-[#0A2F25]/70">Saved as: {String(stop.placeId)}</p>
                        </>
                      )}
                      <p className="text-xs font-semibold text-[#087E83]">
                        {visit ? `Visit time: ${visit}` : 'Visit time not set'}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </section>
    </div>
  );
};