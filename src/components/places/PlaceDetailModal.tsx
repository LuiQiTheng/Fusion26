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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-amber-500/20">
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
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />

          {/* Close & Action buttons */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={() => onToggleFavorite(place.id)}
              className={`p-2.5 rounded-full backdrop-blur-md transition-colors ${
                isFavorite
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-white/80 text-slate-800 hover:bg-white'
              }`}
            >
              <Bookmark className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-white/80 text-slate-800 hover:bg-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Hero text overlay */}
          <div className="absolute bottom-5 left-5 right-5 text-white">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500 text-slate-950">
                {place.locality || place.stateId}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md text-white flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                {place.verificationStatus === 'verified' ? 'Verified Heritage Record' : 'Under Community Review'}
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
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700">
          {/* Practical Metrics Pill Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Suggested Visit</p>
                <p className="text-xs font-bold text-slate-900">{place.visitDurationMinutes || 45} mins</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5">
              <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Admission Fee</p>
                <p className="text-xs font-bold text-slate-900">
                  {place.estimatedCostMYR === 0
                    ? 'Free Admission'
                    : place.estimatedCostMYR !== null && place.estimatedCostMYR !== undefined
                    ? `RM ${place.estimatedCostMYR}`
                    : 'Price not verified'}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5 sm:col-span-2">
              <Compass className="w-4 h-4 text-indigo-600 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Opening Hours</p>
                <p className="text-xs font-medium text-slate-900">
                  {place.openingHoursText || 'Hours variable / outdoor monument'}
                  {!place.openingHoursVerified && (
                    <span className="text-[10px] text-amber-600 ml-1.5 italic">(Pending verification)</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Cultural & Historical Context */}
          <div>
            <h3 className="font-serif font-bold text-lg text-slate-900 mb-2">
              Cultural & Historical Significance
            </h3>
            <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">
              {place.culturalContext}
            </p>
          </div>

          {/* Cultural Care & Etiquette Banner */}
          {place.culturalCareNotes && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                  Responsible Cultural Etiquette & Preservation Note
                </h4>
                <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                  {place.culturalCareNotes}
                </p>
              </div>
            </div>
          )}

          {/* Categories & Cultural Themes */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Cultural Themes & Classification
            </h4>
            <div className="flex flex-wrap gap-2">
              {place.categories.map((c) => (
                <span
                  key={c}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800"
                >
                  {c}
                </span>
              ))}
              {place.culturalThemes.map((t) => (
                <span
                  key={t}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100/70 text-amber-900 border border-amber-200"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Accessibility */}
          {place.accessibilityNotes && (
            <div className="text-xs text-slate-600 border-l-2 border-slate-300 pl-3">
              <span className="font-semibold text-slate-800">Accessibility: </span>
              {place.accessibilityNotes}
            </div>
          )}

          {/* Verified Source Citations */}
          <div className="border-t border-slate-100 pt-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-amber-700" /> Sourced References & Citations
            </h4>
            <div className="space-y-1.5">
              {place.sources.map((s, idx) => (
                <div key={idx} className="text-xs text-slate-600 flex items-center justify-between">
                  <span>
                    • <strong className="text-slate-800">{s.title}</strong> — {s.publisher}
                  </span>
                  {s.url && (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-700 hover:text-amber-800 font-medium inline-flex items-center gap-0.5 ml-2 shrink-0"
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
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => onInspectAI(place)}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-amber-500/15 text-amber-900 hover:bg-amber-500/25 border border-amber-300/50 flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Inspect AI Reasoning</span>
          </button>

          <div className="flex items-center gap-2">
            {onAddToItinerary && (
              <button
                onClick={() => {
                  onAddToItinerary(place);
                  onClose();
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-amber-600 text-white hover:bg-amber-700 shadow-xs transition-colors"
              >
                + Add to Trip Plan
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-xl bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
