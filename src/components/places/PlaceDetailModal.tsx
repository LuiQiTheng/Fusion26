import React from 'react';
import {
  X,
  Bookmark,
  Sparkles,
  MapPin,
  Clock,
  DollarSign,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  BookOpen,
  Compass,
} from 'lucide-react';
import { HeritagePlace } from '../../types';

interface PlaceDetailModalProps {
  place: HeritagePlace | null;
  isOpen: boolean;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onInspectAI: (place: HeritagePlace) => void;
  onAddToItinerary?: (place: HeritagePlace) => void;
}

export const PlaceDetailModal: React.FC<PlaceDetailModalProps> = ({
  place,
  isOpen,
  onClose,
  isFavorite,
  onToggleFavorite,
  onInspectAI,
  onAddToItinerary,
}) => {
  if (!isOpen || !place) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-teal-900/15 text-[#0A2F25]">
        {/* Hero Image Section */}
        <div className="relative h-64 sm:h-72 w-full bg-slate-900 shrink-0">
          <img
            src={place.imageUrl || '/images/places/mlk-stadthuys.jpg'}
            alt={place.imageAlt || place.name}
            className="w-full h-full object-cover opacity-90"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/places/mlk-stadthuys.jpg';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          {/* Close & Action buttons */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={() => onToggleFavorite(place.id)}
              className={`p-2.5 rounded-full backdrop-blur-md transition-colors cursor-pointer ${
                isFavorite
                  ? 'bg-[#C5A028] text-white shadow-md'
                  : 'bg-slate-900/70 text-white/90 hover:bg-slate-900 hover:text-[#C5A028] border border-white/20'
              }`}
            >
              <Bookmark className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-slate-900/70 text-white hover:bg-slate-900 hover:text-[#C5A028] border border-white/20 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Hero text overlay */}
          <div className="absolute bottom-5 left-5 right-5 text-white">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#C5A028] text-white">
                {place.locality || place.stateId}
              </span>

              {place.heritage_status === 'unesco_inscribed' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#C5A028] text-white shadow-xs">
                  ★ UNESCO Inscribed (2008/2018)
                </span>
              )}
              {place.heritage_status === 'unesco_urgent_safeguarding' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-700 text-white shadow-xs">
                  ⚠ UNESCO Urgent Safeguarding (2023)
                </span>
              )}
              {place.heritage_status === 'national_heritage_listed' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/90 text-[#0A2F25] border border-teal-900/15">
                  🏛 National Heritage (JWN)
                </span>
              )}
              {place.heritage_status === 'regional_tradition' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-600/30">
                  🌾 Regional Tradition
                </span>
              )}

              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-900/80 border border-white/20 backdrop-blur-md text-white flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#00F0FF]" />
                {place.verificationStatus === 'verified' ? 'Verified Sourced Record' : 'Under Review'}
              </span>
            </div>
            <h2 className="font-serif font-bold text-2xl sm:text-3xl text-white drop-shadow-xs">
              {place.name}
            </h2>
            {place.malayName && (
              <p className="text-sm text-amber-200/90 italic mt-0.5">
                {place.malayName}
              </p>
            )}
            {place.imageCredit && (
              <p className="text-[10px] text-white/60 mt-1">
                Photo credit: {place.imageCredit}
              </p>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-[#0A2F25]">
          {/* Location Type & Community Heritage Banner */}
          {place.location_type === 'regional_association' ? (
            <div className="p-3.5 rounded-2xl bg-[#EBF5F0] border border-teal-900/15 flex items-start gap-3 text-xs text-[#0A2F25]">
              <Compass className="w-4 h-4 text-[#B88E18] mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-[#B88E18]">Regional Living Tradition: </span>
                This cultural tradition is celebrated across home kitchens, cultural festivals, and community gatherings throughout {place.state_association?.join(', ') || place.stateId}, rather than restricted to a single physical monument.
                {place.community_association && (
                  <span className="block mt-1 font-semibold text-[#B88E18]">
                    Associated Community: {place.community_association.join(', ')}
                  </span>
                )}
              </div>
            </div>
          ) : place.location_type === 'verified_event_site' ? (
            <div className="p-3.5 rounded-2xl bg-[#EBF5F0] border border-teal-600/30 flex items-start gap-3 text-xs text-[#0A2F25]">
              <MapPin className="w-4 h-4 text-[#087E83] mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-[#087E83]">Verified Event Location: </span>
                {place.location_name || place.locality}
                {place.community_association && (
                  <span className="block mt-1 text-[#B88E18] font-medium">
                    Practising Communities: {place.community_association.join(', ')}
                  </span>
                )}
              </div>
            </div>
          ) : null}

          {/* Practical Metrics Pill Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-[#EBF5F0] border border-teal-900/15 flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-[#B88E18] shrink-0" />
              <div>
                <p className="text-[10px] text-[#B88E18] uppercase tracking-wider font-semibold">Suggested Time</p>
                <p className="text-xs font-bold text-[#0A2F25]">{place.visitDurationMinutes || 45} mins</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#EBF5F0] border border-teal-900/15 flex items-center gap-2.5">
              <DollarSign className="w-4 h-4 text-emerald-700 shrink-0" />
              <div>
                <p className="text-[10px] text-[#B88E18] uppercase tracking-wider font-semibold">Estimated Cost</p>
                <p className="text-xs font-bold text-[#0A2F25]">
                  {place.estimatedCostMYR === 0
                    ? 'Free / Public'
                    : place.estimatedCostMYR !== null && place.estimatedCostMYR !== undefined
                    ? `RM ${place.estimatedCostMYR}`
                    : 'Cost unverified'}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#EBF5F0] border border-teal-900/15 flex items-center gap-2.5 sm:col-span-2">
              <Compass className="w-4 h-4 text-[#087E83] shrink-0" />
              <div>
                <p className="text-[10px] text-[#B88E18] uppercase tracking-wider font-semibold">Availability & Hours</p>
                <p className="text-xs font-medium text-[#0A2F25]">
                  {place.openingHoursText || 'Flexible / Seasonal availability'}
                  {!place.openingHoursVerified && (
                    <span className="text-[10px] text-amber-600 ml-1.5 italic">(Pending verification)</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Cultural & Historical Context */}
          <div>
            <h3 className="font-serif font-bold text-lg text-[#0A2F25] mb-2">
              Cultural & Historical Significance
            </h3>
            <p className="text-sm leading-relaxed text-[#0A2F25]/80 whitespace-pre-line">
              {place.culturalContext}
            </p>
          </div>

          {/* Cultural Care & Etiquette Banner */}
          {place.culturalCareNotes && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                  Responsible Cultural Etiquette & Preservation Note
                </h4>
                <p className="text-xs text-amber-900/90 mt-1 leading-relaxed">
                  {place.culturalCareNotes}
                </p>
              </div>
            </div>
          )}

          {/* Categories & Cultural Themes */}
          <div>
            <h4 className="text-xs font-bold text-[#B88E18] uppercase tracking-wider mb-2">
              Cultural Themes & Classification
            </h4>
            <div className="flex flex-wrap gap-2">
              {place.categories.map((c) => (
                <span
                  key={c}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-[#EBF5F0] text-[#0A2F25] border border-teal-900/15"
                >
                  {c}
                </span>
              ))}
              {place.culturalThemes.map((t) => (
                <span
                  key={t}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-white text-[#B88E18] border border-teal-900/15"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Accessibility */}
          {place.accessibilityNotes && (
            <div className="text-xs text-[#0A2F25]/70 border-l-2 border-[#C5A028]/50 pl-3">
              <span className="font-semibold text-[#B88E18]">Accessibility: </span>
              {place.accessibilityNotes}
            </div>
          )}

          {/* Verified Source Citations */}
          <div className="border-t border-teal-900/10 pt-4">
            <h4 className="text-xs font-bold text-[#B88E18] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#B88E18]" /> Sourced References & Citations
            </h4>
            <div className="space-y-1.5">
              {place.sources.map((s, idx) => (
                <div key={idx} className="text-xs text-[#0A2F25]/75 flex items-center justify-between">
                  <span>
                    • <strong className="text-[#0A2F25]">{s.title}</strong> — {s.publisher}
                  </span>
                  {s.url && (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#087E83] hover:underline font-medium inline-flex items-center gap-0.5 ml-2 shrink-0 cursor-pointer"
                    >
                      Source <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#EBF5F0] border-t border-teal-900/10 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => onInspectAI(place)}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#087E83]/10 text-[#087E83] hover:bg-[#087E83]/20 border border-[#087E83]/30 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#087E83]" />
            <span>Inspect AI Reasoning</span>
          </button>

          <div className="flex items-center gap-2">
            {onAddToItinerary && (
              <button
                onClick={() => {
                  onAddToItinerary(place);
                  onClose();
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-[#C5A028] text-white hover:bg-[#B88E18] shadow-xs transition-colors cursor-pointer"
              >
                + Add to Trip Plan
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-xl bg-white text-[#0A2F25] border border-teal-900/15 hover:bg-[#E2EFE9] transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
