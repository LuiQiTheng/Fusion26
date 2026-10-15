import React from 'react';
import { Clock, DollarSign, Bookmark, Sparkles, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import { HeritagePlace } from '../../types';

interface PlaceCardProps {
  place: HeritagePlace;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onSelect: (place: HeritagePlace) => void;
  onInspectAI: (place: HeritagePlace) => void;
  onAddToItinerary?: (place: HeritagePlace) => void;
  isSelected?: boolean;
}

export const PlaceCard: React.FC<PlaceCardProps> = ({
  place,
  isFavorite,
  onToggleFavorite,
  onSelect,
  onInspectAI,
  onAddToItinerary,
  isSelected = false,
}) => {
  return (
    <div
      className={`group rounded-2xl bg-white border transition-all duration-200 overflow-hidden flex flex-col shadow-xs hover:shadow-md ${
        isSelected
          ? 'border-amber-600 ring-2 ring-amber-500/30'
          : 'border-slate-200/80 hover:border-amber-500/50'
      }`}
    >
      {/* Image container */}
      <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
        <img
          src={place.imageUrl || '/images/places/mlk-stadthuys.jpg'}
          alt={place.imageAlt || place.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/places/mlk-stadthuys.jpg';
          }}
        />

        {/* Verification & Heritage status badge row */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-md shadow-xs bg-white/90 text-slate-800">
            {place.verificationStatus === 'verified' ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-800">Source Verified</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-amber-800">Needs Review</span>
              </>
            )}
          </div>

          {place.heritage_status === 'unesco_inscribed' && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-slate-950 shadow-xs">
              ★ UNESCO Inscribed
            </span>
          )}
          {place.heritage_status === 'unesco_urgent_safeguarding' && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-600 text-white shadow-xs">
              ⚠ UNESCO Urgent Safeguarding
            </span>
          )}
          {place.heritage_status === 'national_heritage_listed' && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-900 text-amber-300 shadow-xs">
              🏛 National Heritage
            </span>
          )}
        </div>

        {/* Bookmark button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(place.id);
          }}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-colors ${
            isFavorite
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-white/80 text-slate-600 hover:bg-white hover:text-amber-600'
          }`}
          aria-label={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
        >
          <Bookmark className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        {/* State / locality / regional tradition pill */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1 text-[11px] font-medium text-white px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs">
          <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
          <span className="truncate max-w-[220px]">
            {place.location_type === 'regional_association'
              ? `${place.stateId} • Regional Tradition`
              : place.locality || place.stateId}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Category Chips and Community association */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            {place.categories.slice(0, 2).map((cat) => (
              <span
                key={cat}
                className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/50"
              >
                {cat}
              </span>
            ))}
            {place.community_association && place.community_association[0] && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {place.community_association[0]}
              </span>
            )}
          </div>

          {/* Place Title */}
          <h3
            onClick={() => onSelect(place)}
            className="font-serif font-bold text-lg text-slate-900 hover:text-amber-700 cursor-pointer line-clamp-1 transition-colors"
          >
            {place.name}
          </h3>
          {place.malayName && (
            <p className="text-xs text-slate-500 italic mb-2 line-clamp-1">
              {place.malayName}
            </p>
          )}

          {/* Short description */}
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
            {place.shortDescription}
          </p>
        </div>

        {/* Metadata & Actions */}
        <div>
          {/* Quick Metrics */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100 mb-4">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {place.visitDurationMinutes ? `${place.visitDurationMinutes} mins` : 'Flexible'}
            </span>
            <span className="flex items-center gap-1 font-medium">
              <DollarSign className="w-3.5 h-3.5 text-slate-400" />
              {place.estimatedCostMYR === 0
                ? 'Free Entry'
                : place.estimatedCostMYR !== null && place.estimatedCostMYR !== undefined
                ? `RM ${place.estimatedCostMYR}`
                : 'Fees unverified'}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onSelect(place)}
              className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors text-center"
            >
              Explore Story
            </button>
            <button
              onClick={() => onInspectAI(place)}
              className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-amber-500/10 text-amber-900 hover:bg-amber-500/20 border border-amber-300/40 flex items-center justify-center gap-1 transition-colors"
              title="Inspect AI Reasoning & Source Grounding"
            >
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>Inspect AI</span>
            </button>
          </div>

          {onAddToItinerary && (
            <button
              onClick={() => onAddToItinerary(place)}
              className="mt-2 w-full py-1.5 px-3 text-[11px] font-medium rounded-lg text-amber-800 hover:bg-amber-50 border border-dashed border-amber-300 transition-colors"
            >
              + Add to Itinerary
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
