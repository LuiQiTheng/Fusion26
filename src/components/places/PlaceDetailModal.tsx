import React from 'react';
import {
  X,
  Bookmark,
  Clock,
  DollarSign,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  BookOpen,
  Compass,
  Box,
} from 'lucide-react';
import { HeritagePlace } from '../../types';
import { BuildingModelViewer } from './BuildingModelViewer';

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
  const modelViewerRef = React.useRef<HTMLDivElement>(null);

  if (!isOpen || !place) return null;

  const modelUrl =
    place.modelUrl ||
    (place.id === 'mlk-stadthuys'
      ? '/models/stadthuys.glb'
      : place.id === 'mlk-baba-nyonya'
      ? '/models/baba-nyonya.glb'
      : place.id === 'food-melaka-kuih-keria'
      ? '/models/kuih-keria.glb'
      : place.id === 'food-melaka-kari-debal'
      ? '/models/kari-debal.glb'
      : undefined);
  const has3DModel = Boolean(modelUrl);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 lg:p-8 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Unified modal with white background and photo on front layer with 14% transparency */}
      <div
        className={`relative bg-white rounded-[2.5rem] shadow-[0_25px_70px_rgba(0,0,0,0.25)] w-full ${
          has3DModel ? 'max-w-6xl 2xl:max-w-7xl flex flex-col xl:flex-row' : 'max-w-3xl flex flex-col'
        } max-h-[92vh] overflow-hidden border border-slate-200/60 text-[#0A2F25] transition-all my-auto`}
      >
        {/* Floating Close & Bookmark buttons on top-right (z-30) */}
        <div className="absolute top-5 right-5 z-30 flex items-center gap-2">
          <button
            onClick={() => onToggleFavorite(place.id)}
            className={`p-2.5 rounded-full backdrop-blur-md transition-colors cursor-pointer ${
              isFavorite
                ? 'bg-[#C5A028] text-white shadow-md'
                : 'bg-white/70 hover:bg-white text-[#0A2F25]/80 hover:text-[#C5A028] border border-white/80 shadow-xs'
            }`}
          >
            <Bookmark className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/70 hover:bg-white text-[#0A2F25]/80 hover:text-black border border-white/80 shadow-xs transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Left Column: Place Detail Information */}
        <div className="relative z-10 flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Scrollable content body */}
          <div className="p-6 sm:p-8 overflow-y-auto space-y-5 text-[#0A2F25]">
            {/* Header Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#D4A346] text-white shadow-xs">
                {place.locality || place.stateId}
              </span>

              {place.heritage_status === 'unesco_inscribed' && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#D4A346] text-white shadow-xs">
                  ★ UNESCO Inscribed (2008/2018)
                </span>
              )}
              {place.heritage_status === 'unesco_urgent_safeguarding' && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-700 text-white shadow-xs">
                  ⚠ UNESCO Urgent Safeguarding (2023)
                </span>
              )}
              {place.heritage_status === 'national_heritage_listed' && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/90 text-[#0A2F25] border border-teal-900/15 shadow-xs">
                  🏛 National Heritage (JWN)
                </span>
              )}
              {place.heritage_status === 'regional_tradition' && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-600/30">
                  🌾 Regional Tradition
                </span>
              )}

              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#6BA8B8] text-white shadow-xs flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                {place.verificationStatus === 'verified' ? 'Verified Sourced Record' : 'Under Review'}
              </span>
            </div>

            {/* 3D Model badge pill */}
            {has3DModel && (
              <div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#009E96] text-white shadow-xs inline-flex items-center gap-1.5">
                  <Box className="w-3.5 h-3.5" />
                  <span>3D Model</span>
                </span>
              </div>
            )}

            {/* Title & Malay name */}
            <div className="space-y-0.5">
              <h2 className="font-serif font-bold text-2xl sm:text-3xl lg:text-4xl text-[#1a2e26] tracking-tight">
                {place.name}
              </h2>
              {place.malayName && (
                <p className="text-base text-[#6b624c] italic font-serif">
                  {place.malayName}
                </p>
              )}
              {place.imageCredit && (
                <p className="text-xs text-[#788880] pt-0.5">
                  Photo credit: {place.imageCredit}
                </p>
              )}
            </div>

            {/* Practical Metrics Frosted Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="p-3 rounded-2xl bg-white/50 backdrop-blur-md border border-white/70 shadow-xs flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#B88E18] shrink-0" />
                <div>
                  <p className="text-[10px] text-[#8a7040] uppercase tracking-wider font-semibold">Suggested Time</p>
                  <p className="text-xs font-bold text-[#0A2F25]">{place.visitDurationMinutes || 45} mins</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/50 backdrop-blur-md border border-white/70 shadow-xs flex items-center gap-2.5">
                <DollarSign className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <p className="text-[10px] text-[#8a7040] uppercase tracking-wider font-semibold">Estimated Cost</p>
                  <p className="text-xs font-bold text-[#0A2F25]">
                    {place.estimatedCostMYR === 0
                      ? 'Free / Public'
                      : place.estimatedCostMYR !== null && place.estimatedCostMYR !== undefined
                      ? `RM ${place.estimatedCostMYR}`
                      : 'Cost unverified'}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/50 backdrop-blur-md border border-white/70 shadow-xs flex items-center gap-2.5">
                <Compass className="w-4 h-4 text-[#087E83] shrink-0" />
                <div>
                  <p className="text-[10px] text-[#8a7040] uppercase tracking-wider font-semibold">Availability & Hours</p>
                  <p className="text-xs font-medium text-[#0A2F25] truncate">
                    {place.openingHoursText || 'Flexible / Seasonal availability'}
                  </p>
                </div>
              </div>
            </div>

            {/* Cultural & Historical Significance */}
            <div className="pt-2">
              <h3 className="font-serif font-bold text-xl text-[#0A2F25] mb-2">
                Cultural & Historical Significance
              </h3>
              <p className="text-sm leading-relaxed text-[#1d3b32]/90 whitespace-pre-line">
                {place.culturalContext}
              </p>
            </div>

            {/* Cultural Care Notes */}
            {place.culturalCareNotes && (
              <div className="p-4 rounded-2xl bg-amber-50/80 backdrop-blur-md border border-amber-300/80 flex items-start gap-3">
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

            {/* Themes & Classifications */}
            <div>
              <h4 className="text-xs font-bold text-[#8a7040] uppercase tracking-wider mb-2">
                Cultural Themes & Classification
              </h4>
              <div className="flex flex-wrap gap-2">
                {place.categories.map((c) => (
                  <span
                    key={c}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-white/70 text-[#0A2F25] border border-white/80 shadow-xs"
                  >
                    {c}
                  </span>
                ))}
                {place.culturalThemes.map((t) => (
                  <span
                    key={t}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-white/70 text-[#8a7040] border border-white/80 shadow-xs"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Accessibility */}
            {place.accessibilityNotes && (
              <div className="text-xs text-[#0A2F25]/80 border-l-2 border-[#C5A028]/60 pl-3">
                <span className="font-semibold text-[#8a7040]">Accessibility: </span>
                {place.accessibilityNotes}
              </div>
            )}

            {/* Sourced References */}
            <div className="border-t border-teal-900/10 pt-4">
              <h4 className="text-xs font-bold text-[#8a7040] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#B88E18]" /> Sourced References & Citations
              </h4>
              <div className="space-y-1.5">
                {place.sources.map((s, idx) => (
                  <div key={idx} className="text-xs text-[#0A2F25]/80 flex items-center justify-between">
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
        </div>

        {/* Right Column: 3D Model brought to the most front layer (z-[25]) with 100% transparent background */}
        {has3DModel && modelUrl && (
          <div
            ref={modelViewerRef}
            className="relative z-[25] w-full xl:w-[480px] 2xl:w-[560px] shrink-0 flex items-center justify-center p-4 xl:p-6 pb-16 xl:pb-20 min-h-[380px] sm:min-h-[460px] xl:min-h-0 pointer-events-none"
          >
            <BuildingModelViewer
              modelUrl={modelUrl}
              isFood={
                place.type === 'food' ||
                place.id.startsWith('food-') ||
                place.id === 'food-melaka-kuih-keria' ||
                place.id === 'food-melaka-kari-debal'
              }
              className="w-full h-full min-h-[380px] sm:min-h-[440px]"
            />
          </div>
        )}

        {/* Right bottom corner buttons */}
        <div className="absolute bottom-5 right-5 sm:bottom-6 sm:right-6 z-30 flex items-center gap-2.5">
          {onAddToItinerary && (
            <button
              onClick={() => {
                onAddToItinerary(place);
                onClose();
              }}
              className="px-5 py-2.5 text-xs font-bold rounded-2xl bg-[#C5A028] hover:bg-[#b5901c] text-white shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              + Add to Trip Plan
            </button>
          )}
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-medium rounded-2xl bg-white/80 hover:bg-white text-[#0A2F25] border border-white/80 shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* FRONT LAYER: Photo overlay with 14% transparency across entire modal */}
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-[2.5rem]">
          <img
            src={place.imageUrl || '/images/places/mlk-stadthuys.jpg'}
            alt=""
            className="w-full h-full object-cover object-center opacity-[0.14]"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/places/mlk-stadthuys.jpg';
            }}
          />
        </div>
      </div>
    </div>
  );
};
