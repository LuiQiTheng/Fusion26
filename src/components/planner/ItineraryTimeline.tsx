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
    <div className="bg-[#0A1F1C]/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-[#D4AF37]/25 shadow-lg space-y-8">
      {/* Top Header & Metrics Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#D4AF37]/15">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#04100E] text-[#E5C05C] border border-[#D4AF37]/30">
              {itinerary.destinationStateId} Cultural Plan
            </span>
            <span className="flex items-center gap-1 text-xs text-cyan-300 font-semibold bg-[#0E2925] px-2 py-0.5 rounded-full border border-cyan-400/30">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00F0FF]" /> Explainable Constraints
            </span>
          </div>
          <h2 className="font-serif font-bold text-2xl text-[#F5F5F0]">
            {itinerary.title}
          </h2>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onInspectAI}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#00F0FF]/10 text-cyan-300 hover:bg-[#00F0FF]/20 border border-cyan-400/30 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#00F0FF]" />
            Inspect AI Logic
          </button>

          <button
            onClick={onSaveItinerary}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isSaved
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-[#D4AF37] text-[#04100E] hover:bg-[#E5C05C] shadow-xs'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            {isSaved ? 'Saved Locally' : 'Save Itinerary'}
          </button>

          <button
            onClick={() => window.print()}
            className="p-2 rounded-xl text-[#F5F5F0]/70 hover:text-white hover:bg-[#0E2925] border border-[#D4AF37]/25 bg-[#04100E] transition-colors cursor-pointer"
            title="Print Itinerary"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-[#04100E] border border-[#D4AF37]/20">
        <div>
          <p className="text-[10px] text-[#E5C05C] uppercase font-bold tracking-wider">Total Duration</p>
          <p className="text-base font-extrabold text-[#F5F5F0]">
            {formatMinutes(itinerary.totalPlannedMinutes)}
          </p>
          <span className="text-[11px] text-[#F5F5F0]/60">Target: {formatMinutes(itinerary.availableMinutes)}</span>
        </div>

        <div>
          <p className="text-[10px] text-[#E5C05C] uppercase font-bold tracking-wider">Monument Visits</p>
          <p className="text-base font-extrabold text-[#D4AF37]">
            {formatMinutes(itinerary.totalVisitMinutes)}
          </p>
          <span className="text-[11px] text-[#F5F5F0]/60">{itinerary.stops.length} cultural sites</span>
        </div>

        <div>
          <p className="text-[10px] text-[#E5C05C] uppercase font-bold tracking-wider">Transit Time</p>
          <p className="text-base font-extrabold text-cyan-400 flex items-center gap-1">
            {getTransportIcon(itinerary.transportMode)}
            {formatMinutes(itinerary.totalTravelMinutes)}
          </p>
          <span className="text-[11px] text-[#F5F5F0]/60 capitalize">{itinerary.transportMode} mode</span>
        </div>

        <div>
          <p className="text-[10px] text-[#E5C05C] uppercase font-bold tracking-wider">Est. Entry Cost</p>
          <p className="text-base font-extrabold text-emerald-400">
            {totalAdmissionCost === 0 ? 'Free Entry' : `RM ${totalAdmissionCost}`}
          </p>
          <span className="text-[11px] text-[#F5F5F0]/60">
            {hasUnverifiedFees ? 'Excludes unlisted' : 'All fees verified'}
          </span>
        </div>
      </div>

      {/* Timeline Stops */}
      <div className="space-y-6 relative before:absolute before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-[#D4AF37]/30">
        {itinerary.stops.map((stop, idx) => {
          const place = placeMap.get(stop.placeId);
          if (!place) return null;

          return (
            <div key={stop.placeId} className="relative pl-12">
              {/* Stop Number Circle */}
              <div className="absolute left-0 top-1 w-10 h-10 rounded-2xl bg-[#D4AF37] text-[#04100E] font-serif font-bold text-sm flex items-center justify-center shadow-md shadow-[#D4AF37]/20 z-10">
                {stop.order}
              </div>

              {/* Stop Card */}
              <div className="p-5 rounded-2xl bg-[#04100E] border border-[#D4AF37]/25 shadow-md hover:border-[#D4AF37] transition-all">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#F5F5F0]/60 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                        Offset: +{formatMinutes(stop.arrivalOffsetMinutes || 0)}
                      </span>
                      <span className="text-[#D4AF37]/40">•</span>
                      <span className="text-xs font-semibold text-[#E5C05C]">
                        Visit: {stop.visitDurationMinutes} mins
                      </span>
                    </div>

                    <h3
                      onClick={() => onSelectPlace(place)}
                      className="font-serif font-bold text-lg text-[#F5F5F0] hover:text-[#E5C05C] cursor-pointer transition-colors"
                    >
                      {place.name}
                    </h3>
                    <p className="text-xs text-[#F5F5F0]/60">{place.locality}</p>

                    {/* Selection Reasoning pill */}
                    <div className="mt-2 p-2.5 rounded-xl bg-[#0A1F1C] border border-[#D4AF37]/20 text-xs text-[#F5F5F0]/85">
                      <strong className="text-[#E5C05C]">Why Recommended: </strong>
                      {stop.reasonSelected}
                    </div>
                  </div>

                  {/* Thumbnail & Actions */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                    <img
                      src={place.imageUrl}
                      alt={place.name}
                      className="w-16 h-16 rounded-xl object-cover cursor-pointer hover:opacity-90 border border-[#D4AF37]/30"
                      onClick={() => onSelectPlace(place)}
                    />
                    {itinerary.stops.length > 1 && (
                      <button
                        onClick={() => onRemoveStop(stop.order)}
                        className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
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
                <div className="my-3 py-1.5 px-3 rounded-xl bg-[#0A1F1C] text-[#F5F5F0] text-xs flex items-center justify-between border border-[#D4AF37]/20">
                  <div className="flex items-center gap-2">
                    {getTransportIcon(itinerary.transportMode)}
                    <span className="font-semibold text-[#F5F5F0]">
                      {itinerary.stops[idx + 1].travelFromPreviousMinutes || 8} min transfer
                    </span>
                    <span className="text-[11px] text-[#F5F5F0]/60">
                      to Stop {stop.order + 1}
                    </span>
                  </div>

                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#04100E] border border-[#D4AF37]/30 text-[#E5C05C]">
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
      <div className="p-4 rounded-2xl bg-[#04100E] border border-[#D4AF37]/20 text-xs space-y-1.5 text-[#F5F5F0]">
        <h4 className="font-bold flex items-center gap-1.5 text-[#E5C05C]">
          <AlertCircle className="w-3.5 h-3.5 text-[#D4AF37]" />
          Planning Assumptions & Data Transparency
        </h4>
        <ul className="list-disc list-inside space-y-0.5 text-[#F5F5F0]/70">
          {itinerary.assumptions.map((assump, idx) => (
            <li key={idx}>{assump}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};
