
import React, { useMemo, useRef, useState } from 'react';
import { AlertTriangle, Check, Compass, Heart, Info, MapPin, Plus, RefreshCw, X } from 'lucide-react';
import { HeritagePlace } from '../../types';
import { ToastTone } from '../components/Toast';

// What the parent returns after trying an action. The parent decides the success message,
// so this page never claims something happened that did not.
export type WishlistActionResult = { ok: true; message: string } | { ok: false; error: string };

interface WishlistPageProps {
  places: HeritagePlace[]; // existing Fusion26 places
  favorites: string[]; // existing Favorites; the Wishlist is this same list
  tripPlaceIds: string[]; // places already in the current trip
  onRemove: (placeId: string) => WishlistActionResult;
  onAddToTrip: (place: HeritagePlace) => WishlistActionResult;
  onViewPlace: (place: HeritagePlace) => void;
  onExplore: () => void;
  onOpenTrips: () => void;
  onNotify: (tone: ToastTone, text: string) => void;
}

interface Failure {
  text: string;
  retry: () => void;
}

const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087E83]';
const CARD = 'rounded-2xl border border-[#087E83]/25 bg-white';
const BTN =
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer';

// Shows the place photo, or a plain icon if there is none or it fails to load.
const PlaceThumb: React.FC<{ place: HeritagePlace | null }> = ({ place }) => {
  const [failed, setFailed] = useState(false);

  return (
    <div className="flex h-28 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#E6F3ED] sm:w-36">
      {place?.imageUrl && !failed ? (
        <img
          src={place.imageUrl}
          alt={place.imageAlt ?? place.name}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <MapPin className="h-8 w-8 text-[#B88E18]/70" role="img" aria-label="No photo" />
      )}
    </div>
  );
};

export const WishlistPage: React.FC<WishlistPageProps> = ({
  places,
  favorites,
  tripPlaceIds,
  onRemove,
  onAddToTrip,
  onViewPlace,
  onExplore,
  onOpenTrips,
  onNotify,
}) => {
  const [failure, setFailure] = useState<Failure | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const placesById = useMemo(() => new Map(places.map((place) => [place.id, place])), [places]);
  const tripIds = useMemo(() => new Set(tripPlaceIds), [tripPlaceIds]);

  // Newest favorite first, without duplicates.
  const wishlistIds = useMemo(() => Array.from(new Set(favorites)).reverse(), [favorites]);

  // Runs one action. A failure keeps the item exactly where it was and offers Retry.
  const runAction = (label: string, action: () => WishlistActionResult) => {
    setFailure(null);

    let result: WishlistActionResult;
    try {
      result = action();
    } catch (err) {
      console.error('Wishlist action failed unexpectedly:', err);
      result = { ok: false, error: 'Something went wrong. Nothing was changed.' };
    }

    if (result.ok) {
      onNotify('success', result.message);
      // The clicked card usually disappears, so move focus somewhere stable.
      headingRef.current?.focus();
    } else {
      setFailure({ text: `${label} ${result.error}`, retry: () => runAction(label, action) });
    }
  };

  const handleRemove = (placeId: string, name: string) =>
    runAction(`"${name}" was not removed from your Wishlist.`, () => onRemove(placeId));

  const handleAddToTrip = (place: HeritagePlace) =>
    runAction(`"${place.name}" was not added to your trip.`, () => onAddToTrip(place));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="font-serif text-2xl font-bold text-[#0A2F25] focus:outline-none sm:text-3xl"
        >
          Wishlist
        </h1>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onOpenTrips}
            className={`${BTN} border border-[#087E83]/40 bg-white text-[#0A2F25] hover:border-[#087E83] hover:bg-[#E6F3ED] ${FOCUS}`}
          >
            My Trips
          </button>
          <button
            type="button"
            onClick={onExplore}
            className={`${BTN} bg-[#087E83] text-white hover:bg-[#0A2F25] ${FOCUS}`}
          >
            <Compass className="h-4 w-4" aria-hidden="true" />
            Explore Places
          </button>
        </div>
      </div>

      <p className="text-sm text-[#0A2F25]/75">
        Places you want to visit. This is the same list as your favorite places on Home and Explore, so removing
        a place here removes it everywhere.
      </p>

      <div className="flex items-start gap-3 rounded-xl border border-[#087E83]/25 bg-[#E6F3ED] p-4 text-sm text-[#0A2F25]">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#087E83]" aria-hidden="true" />
        <p>
          Adding a place to your trip changes your current trip only. Press Save in the trip planner to keep the
          change.
        </p>
      </div>

      {failure && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
            <span>{failure.text} Your Wishlist has not been changed.</span>
          </p>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={failure.retry}
              className={`${BTN} border border-red-300 text-red-800 hover:bg-red-100 ${FOCUS}`}
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Retry
            </button>
            <button
              type="button"
              onClick={() => setFailure(null)}
              aria-label="Dismiss error"
              className={`flex h-11 w-11 items-center justify-center rounded-lg text-red-700 hover:bg-red-100 cursor-pointer ${FOCUS}`}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {wishlistIds.length === 0 ? (
        <div className={`${CARD} flex flex-col items-center gap-4 px-6 py-12 text-center`}>
          <Heart className="h-10 w-10 text-[#B88E18]/70" aria-hidden="true" />
          <div className="space-y-1">
            <p className="font-semibold text-[#0A2F25]">Your Wishlist is empty</p>
            <p className="text-sm text-[#0A2F25]/65">
              Favorite a place in Explore and it will appear here.
            </p>
          </div>
          <button
            type="button"
            onClick={onExplore}
            className={`${BTN} bg-[#087E83] px-5 text-white hover:bg-[#0A2F25] ${FOCUS}`}
          >
            <Compass className="h-4 w-4" aria-hidden="true" />
            Explore Places
          </button>
        </div>
      ) : (
        <>
          <p role="status" className="text-sm text-[#0A2F25]/75">
            {wishlistIds.length} {wishlistIds.length === 1 ? 'place' : 'places'}
          </p>

          <ul aria-label="Wishlist places" className="space-y-3">
            {wishlistIds.map((placeId) => {
              const place = placesById.get(placeId) ?? null;

              // A saved favorite whose place is no longer in the data can still be removed.
              if (!place) {
                return (
                  <li key={placeId} className={`${CARD} flex flex-col gap-4 p-4 sm:flex-row sm:items-center`}>
                    <PlaceThumb place={null} />
                    <div className="min-w-0 flex-1 space-y-1">
                      <h2 className="font-semibold text-[#0A2F25]">Place no longer available</h2>
                      <p className="break-all text-xs text-[#0A2F25]/65">Saved as: {placeId}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(placeId, 'This place')}
                      aria-label="Remove unavailable place from Wishlist"
                      className={`${BTN} border border-red-300 text-red-700 hover:bg-red-50 ${FOCUS}`}
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                      Remove
                    </button>
                  </li>
                );
              }

              const inTrip = tripIds.has(place.id);

              return (
                <li key={placeId} className={`${CARD} flex flex-col gap-4 p-4 sm:flex-row sm:items-center`}>
                  <PlaceThumb place={place} />

                  <div className="min-w-0 flex-1 space-y-1">
                    <h2 className="break-words font-semibold text-[#0A2F25]">{place.name}</h2>
                    {place.locality && (
                      <p className="flex items-center gap-1.5 text-xs text-[#0A2F25]/65">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-[#087E83]" aria-hidden="true" />
                        {place.locality}
                      </p>
                    )}
                    {place.shortDescription && (
                      <p className="line-clamp-2 text-sm text-[#0A2F25]/75">{place.shortDescription}</p>
                    )}
                    {inTrip && (
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-[#087E83]">
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        Already in your current trip
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 sm:w-44 sm:flex-col">
                    <button
                      type="button"
                      onClick={() => onViewPlace(place)}
                      aria-label={`View details for ${place.name}`}
                      className={`${BTN} border border-[#087E83]/40 bg-white text-[#0A2F25] hover:border-[#087E83] hover:bg-[#E6F3ED] ${FOCUS}`}
                    >
                      View details
                    </button>
                    {!inTrip && (
                      <button
                        type="button"
                        onClick={() => handleAddToTrip(place)}
                        aria-label={`Add ${place.name} to your trip`}
                        className={`${BTN} bg-[#087E83] text-white hover:bg-[#0A2F25] ${FOCUS}`}
                      >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        Add to Trip
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemove(place.id, place.name)}
                      aria-label={`Remove ${place.name} from your Wishlist`}
                      className={`${BTN} border border-red-300 text-red-700 hover:bg-red-50 ${FOCUS}`}
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                      Remove
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
};
