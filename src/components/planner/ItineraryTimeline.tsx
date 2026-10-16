import React from 'react';
import {
  Clock,
  Sparkles,
  Bookmark,
  Trash2,
  Footprints,
  Car,
  Bus,
  Bike,
  ShieldCheck,
  AlertCircle,
  Printer,
} from 'lucide-react';
import { Itinerary, HeritagePlace } from '../../types';

interface ItineraryTimelineProps {
  itinerary: Itinerary;
  allPlaces: HeritagePlace[];
  onSelectPlace: (place: HeritagePlace) => void;
  onRemoveStop: (order: number) => void;
  onSaveItinerary: () => void;
  onInspectAI: () => void;
  isSaved?: boolean;
}

export const ItineraryTimeline: React.FC<ItineraryTimelineProps> = ({
  itinerary,
  allPlaces,
  onSelectPlace,
  onRemoveStop,
  onSaveItinerary,
  onInspectAI,
  isSaved = false,
}) => {
  const placeMap = new Map<string, HeritagePlace>(allPlaces.map((p) => [p.id, p]));

  // Calculate estimated admission total
  let totalAdmissionCost = 0;
  let hasUnverifiedFees = false;

  itinerary.stops.forEach((stop) => {
    const place = placeMap.get(stop.placeId);
    if (place) {
      if (place.estimatedCostMYR !== null && place.estimatedCostMYR !== undefined) {
        totalAdmissionCost += place.estimatedCostMYR;
      } else {
        hasUnverifiedFees = true;
      }
    }
  });

  const getTransportIcon = (mode: string) => {
    switch (mode) {
      case 'car':
        return <Car className="w-4 h-4 text-amber-600" />;
      case 'public_transport':
        return <Bus className="w-4 h-4 text-amber-600" />;
      case 'mixed':
        return <Bike className="w-4 h-4 text-amber-600" />;
      default:
        return <Footprints className="w-4 h-4 text-amber-600" />;
    }
  };

  const formatMinutes = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-teal-900/10 shadow-md shadow-teal-900/5 space-y-8">
      {/* Top Header & Metrics Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-teal-900/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EBF5F0] text-[#0A2F25] border border-teal-900/10">
              {itinerary.destinationStateId} Cultural Plan
            </span>
            <span className="flex items-center gap-1 text-xs text-[#087E83] font-semibold bg-[#087E83]/10 px-2 py-0.5 rounded-full border border-[#087E83]/20">
              <ShieldCheck className="w-3.5 h-3.5 text-[#087E83]" /> Explainable Constraints
            </span>
          </div>
          <h2 className="font-serif font-bold text-2xl text-[#0A2F25]">
            {itinerary.title}
          </h2>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onInspectAI}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#087E83]/10 text-[#087E83] hover:bg-[#087E83]/20 border border-[#087E83]/30 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#087E83]" />
            Inspect AI Logic
          </button>

          <button
            onClick={onSaveItinerary}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isSaved
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-[#0A2F25] text-white hover:bg-[#0E3D31] shadow-xs'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            {isSaved ? 'Saved Locally' : 'Save Itinerary'}
          </button>

          <button
            onClick={() => window.print()}
            className="p-2 rounded-xl text-[#0A2F25]/70 hover:text-[#0A2F25] hover:bg-[#EBF5F0] border border-teal-900/10 bg-white transition-colors cursor-pointer"
            title="Print Itinerary"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-white border border-teal-900/10 shadow-xs">
        <div>
          <p className="text-[10px] text-[#996F09] uppercase font-bold tracking-wider">Total Duration</p>
          <p className="text-base font-extrabold text-[#0A2F25]">
            {formatMinutes(itinerary.totalPlannedMinutes)}
          </p>
          <span className="text-[11px] text-[#0A2F25]/60">Target: {formatMinutes(itinerary.availableMinutes)}</span>
        </div>

        <div>
          <p className="text-[10px] text-[#996F09] uppercase font-bold tracking-wider">Monument Visits</p>
          <p className="text-base font-extrabold text-[#B88E18]">
            {formatMinutes(itinerary.totalVisitMinutes)}
          </p>
          <span className="text-[11px] text-[#0A2F25]/60">{itinerary.stops.length} cultural sites</span>
        </div>

        <div>
          <p className="text-[10px] text-[#996F09] uppercase font-bold tracking-wider">Transit Time</p>
          <p className="text-base font-extrabold text-[#087E83] flex items-center gap-1">
            {getTransportIcon(itinerary.transportMode)}
            {formatMinutes(itinerary.totalTravelMinutes)}
          </p>
          <span className="text-[11px] text-[#0A2F25]/60 capitalize">{itinerary.transportMode} mode</span>
        </div>

        <div>
          <p className="text-[10px] text-[#996F09] uppercase font-bold tracking-wider">Est. Entry Cost</p>
          <p className="text-base font-extrabold text-emerald-700">
            {totalAdmissionCost === 0 ? 'Free Entry' : `RM ${totalAdmissionCost}`}
          </p>
          <span className="text-[11px] text-[#0A2F25]/60">
            {hasUnverifiedFees ? 'Excludes unlisted' : 'All fees verified'}
          </span>
        </div>
      </div>

      {/* Timeline Stops */}
      <div className="space-y-6 relative before:absolute before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-teal-900/15">
        {itinerary.stops.map((stop, idx) => {
          const place = placeMap.get(stop.placeId);
          if (!place) return null;

          return (
            <div key={stop.placeId} className="relative pl-12">
              {/* Stop Number Circle */}
              <div className="absolute left-0 top-1 w-10 h-10 rounded-2xl bg-[#0A2F25] text-white font-serif font-bold text-sm flex items-center justify-center shadow-xs z-10">
                {stop.order}
              </div>

              {/* Stop Card */}
              <div className="p-5 rounded-2xl bg-white border border-teal-900/10 shadow-xs hover:border-[#C5A028] transition-all">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#0A2F25]/60 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#B88E18]" />
                        Offset: +{formatMinutes(stop.arrivalOffsetMinutes || 0)}
                      </span>
                      <span className="text-teal-900/20">•</span>
                      <span className="text-xs font-semibold text-[#996F09]">
                        Visit: {stop.visitDurationMinutes} mins
                      </span>
                    </div>

                    <h3
                      onClick={() => onSelectPlace(place)}
                      className="font-serif font-bold text-lg text-[#0A2F25] hover:text-[#087E83] cursor-pointer transition-colors"
                    >
                      {place.name}
                    </h3>
                    <p className="text-xs text-[#0A2F25]/60">{place.locality}</p>

                    {/* Selection Reasoning pill */}
                    <div className="mt-2 p-2.5 rounded-xl bg-[#F4F9F6] border border-teal-900/10 text-xs text-[#0A2F25]/85">
                      <strong className="text-[#996F09]">Why Recommended: </strong>
                      {stop.reasonSelected}
                    </div>
                  </div>

                  {/* Thumbnail & Actions */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                    <img
                      src={place.imageUrl}
                      alt={place.name}
                      className="w-16 h-16 rounded-xl object-cover cursor-pointer hover:opacity-90 border border-teal-900/10"
                      onClick={() => onSelectPlace(place)}
                    />
                    {itinerary.stops.length > 1 && (
                      <button
                        onClick={() => onRemoveStop(stop.order)}
                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Remove stop from plan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Transit Connector between stops */}
              {idx < itinerary.stops.length - 1 && (
                <div className="my-3 py-1.5 px-3 rounded-xl bg-[#EBF5F0] text-[#0A2F25] text-xs flex items-center justify-between border border-teal-900/10">
                  <div className="flex items-center gap-2">
                    {getTransportIcon(itinerary.transportMode)}
                    <span className="font-semibold text-[#0A2F25]">
                      {itinerary.stops[idx + 1].travelFromPreviousMinutes || 8} min transfer
                    </span>
                    <span className="text-[11px] text-[#0A2F25]/60">
                      to Stop {stop.order + 1}
                    </span>
                  </div>

                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white border border-teal-900/10 text-[#0A2F25]">
                    {itinerary.stops[idx + 1].routeDataStatus === 'estimated'
                      ? 'Estimated Urban Walk'
                      : itinerary.stops[idx + 1].routeDataStatus === 'simulated'
                      ? 'Simulated Transit Model'
                      : 'Geographic Context'}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Assumptions and Transparency Footer */}
      <div className="p-4 rounded-2xl bg-white/90 border border-teal-900/10 text-xs space-y-1.5 text-[#0A2F25]">
        <h4 className="font-bold flex items-center gap-1.5 text-[#0A2F25]">
          <AlertCircle className="w-3.5 h-3.5 text-[#B88E18]" />
          Planning Assumptions & Data Transparency
        </h4>
        <ul className="list-disc list-inside space-y-0.5 text-[#0A2F25]/70">
          {itinerary.assumptions.map((assump, idx) => (
            <li key={idx}>{assump}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};
