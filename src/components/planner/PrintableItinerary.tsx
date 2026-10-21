import React from 'react';
import { Itinerary, HeritagePlace } from '../../types';

interface PrintableItineraryProps {
  itinerary: Itinerary;
  allPlaces: HeritagePlace[];
}

export const PrintableItinerary: React.FC<PrintableItineraryProps> = ({
  itinerary,
  allPlaces,
}) => {
  const placeMap = React.useMemo(() => {
    return new Map(allPlaces.map((p) => [p.id, p]));
  }, [allPlaces]);

  // Group stops by day if multi-day, or single day
  const days = React.useMemo(() => {
    if (itinerary.daysStops && Object.keys(itinerary.daysStops).length > 0) {
      return Object.entries(itinerary.daysStops).map(([dayNum, stops]) => ({
        dayNumber: parseInt(dayNum, 10),
        date: itinerary.startDate
          ? (() => {
              const d = new Date(itinerary.startDate);
              d.setDate(d.getDate() + (parseInt(dayNum, 10) - 1));
              return d.toLocaleDateString('en-MY', {
                weekday: 'long',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              });
            })()
          : `Day ${dayNum}`,
        stops,
      }));
    }

    // Default single day
    return [
      {
        dayNumber: 1,
        date: itinerary.startDate
          ? new Date(itinerary.startDate).toLocaleDateString('en-MY', {
              weekday: 'long',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })
          : new Date().toLocaleDateString('en-MY', {
              weekday: 'long',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            }),
        stops: itinerary.stops || [],
      },
    ];
  }, [itinerary]);

  return (
    <div className="hidden print:block print:w-full print:p-8 print:text-black print:bg-white">
      {/* Hyper-Minimalist Print Header */}
      <div className="border-b-2 border-black pb-4 mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-black mb-1">
          {itinerary.title || 'Cultural Discovery Itinerary'}
        </h1>
        <p className="text-sm text-gray-700">
          Generated via Malaysia Heritage Explorer • {itinerary.stops?.length || 0} Cultural Stops
        </p>
      </div>

      {/* Days & Stops Table / List */}
      <div className="space-y-8">
        {days.map((dayGroup) => (
          <div key={dayGroup.dayNumber} className="space-y-3">
            <div className="bg-gray-100 p-2.5 border-l-4 border-black">
              <h2 className="text-base font-bold uppercase tracking-wider text-black">
                Day {dayGroup.dayNumber} — {dayGroup.date}
              </h2>
            </div>

            <ol className="divide-y divide-gray-300">
              {dayGroup.stops.map((stop, idx) => {
                const place = placeMap.get(stop.placeId);
                const placeName = place?.name || 'Heritage Destination';
                const locality = place?.locality ? `(${place.locality})` : '';
                const stayDuration = stop.visitDurationMinutes || 45;
                const mapsQuery = encodeURIComponent(
                  `${placeName} ${place?.locality || ''} Malaysia`
                );
                const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

                return (
                  <li
                    key={stop.placeId || idx}
                    className="py-3.5 flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-sm text-black">
                          {idx + 1}. {placeName}
                        </span>
                        {locality && (
                          <span className="text-xs text-gray-600 font-medium">
                            {locality}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-gray-700">
                        <span>Stay Duration: <strong>{stayDuration} minutes</strong></span>
                        {stop.etaTime && (
                          <span className="ml-3 text-gray-600">ETA: {stop.etaTime}</span>
                        )}
                      </div>
                    </div>

                    {/* Clear Hyperlinked Google Maps Link */}
                    <div className="text-right shrink-0 pt-0.5">
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-blue-800 underline hover:text-blue-950"
                      >
                        Open in Google Maps ↗
                      </a>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </div>

      {/* Minimal Footer */}
      <div className="mt-10 pt-4 border-t border-gray-400 text-[11px] text-gray-600 flex justify-between items-center">
        <span>Malaysia Heritage Explorer • FUSION 2026</span>
        <span>Printed on {new Date().toLocaleDateString()}</span>
      </div>
    </div>
  );
};
