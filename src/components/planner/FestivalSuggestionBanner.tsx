import React from 'react';
import { Sparkles, Calendar, Plus, X, ChevronRight, Award } from 'lucide-react';
import { CulturalFestival } from '../../data/festivals';

interface FestivalSuggestionBannerProps {
  festival: CulturalFestival;
  targetDayNumber?: number;
  onAddToPlan: (festival: CulturalFestival, targetDay: number) => void;
  onDismiss: () => void;
}

const formatFestivalDateText = (f: CulturalFestival): string => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const startMonth = monthNames[f.startMonth - 1] || '';
  const endMonth = monthNames[f.endMonth - 1] || '';
  const getOrdinal = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  if (f.startMonth === f.endMonth) {
    if (f.startDay === f.endDay) {
      return `on ${startMonth} ${getOrdinal(f.startDay)}`;
    }
    return `from ${startMonth} ${f.startDay} to ${startMonth} ${f.endDay}`;
  }
  return `from ${startMonth} ${f.startDay} to ${endMonth} ${f.endDay}`;
};

export const FestivalSuggestionBanner: React.FC<FestivalSuggestionBannerProps> = ({
  festival,
  targetDayNumber = 1,
  onAddToPlan,
  onDismiss,
}) => {
  const datePhrase = formatFestivalDateText(festival);

  return (
    <div
      role="alert"
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-50 via-yellow-50/70 to-emerald-50 border-2 border-amber-300 shadow-md p-4 sm:p-5 transition-all animate-in slide-in-from-top duration-300 print:hidden"
    >
      {/* Decorative Shimmer Accent */}
      <div
        className="absolute top-0 right-0 w-32 h-32 bg-amber-200/40 rounded-full blur-2xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left: Festival Info */}
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-xl shrink-0 shadow-xs">
            {festival.icon || '🎉'}
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500 text-white shadow-xs">
                <Sparkles className="w-3 h-3 fill-current" />
                Live Festival Collision
              </span>
              <span className="text-xs font-semibold text-amber-900">
                {festival.stateName}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                <Calendar className="w-3 h-3 text-amber-700" />
                {datePhrase}
              </span>
            </div>

            <h3 className="font-serif font-bold text-sm sm:text-base text-[#0A2F25] leading-snug">
              🎉 <em>{festival.name}</em> is happening during your visit {datePhrase}!
            </h3>

            <p className="text-xs text-[#0A2F25]/80 max-w-2xl leading-relaxed">
              {festival.shortDescription} Would you like to add the <strong>cultural showcase ({festival.suggestedDurationMinutes} mins)</strong> to your Day {targetDayNumber} itinerary?
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 justify-end">
          <button
            type="button"
            onClick={onDismiss}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-black/5 transition-colors cursor-pointer"
          >
            Dismiss
          </button>

          <button
            type="button"
            onClick={() => onAddToPlan(festival, targetDayNumber)}
            className="px-4 py-2 rounded-xl bg-[#0A2F25] hover:bg-[#0E3D31] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-950/15 hover:shadow-lg transition-all cursor-pointer group"
          >
            <Plus className="w-3.5 h-3.5 text-[#E5C05C] group-hover:rotate-90 transition-transform" />
            <span>Add to Day {targetDayNumber} Plan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
