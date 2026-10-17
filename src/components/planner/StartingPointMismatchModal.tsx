import React from 'react';
import { AlertTriangle, MapPin, ArrowRightLeft, Check, X, Compass, ExternalLink } from 'lucide-react';
import { StateValidationResult } from '../../lib/geocoding';

interface StartingPointMismatchModalProps {
  isOpen: boolean;
  validation: StateValidationResult | null;
  onReselect: () => void;
  onSwitchState?: (newStateId: string) => void;
  onProceedAnyway: () => void;
  onClose: () => void;
}

export const StartingPointMismatchModal: React.FC<StartingPointMismatchModalProps> = ({
  isOpen,
  validation,
  onReselect,
  onSwitchState,
  onProceedAnyway,
  onClose,
}) => {
  if (!isOpen || !validation) return null;

  const {
    destinationStateName,
    locationName,
    detectedStateId,
    detectedStateName,
    distanceKm = 0,
  } = validation;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-amber-300/60 overflow-hidden transform transition-all scale-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Warning Banner / Header */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            title="Dismiss notification"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/25 backdrop-blur-md flex items-center justify-center flex-shrink-0 shadow-inner">
              <AlertTriangle className="w-6 h-6 text-white drop-shadow" />
            </div>
            <div>
              <span className="text-[11px] font-bold tracking-wider uppercase bg-black/20 px-2.5 py-0.5 rounded-full text-amber-100">
                Location Mismatch Detected
              </span>
              <h3 className="text-xl font-bold font-serif text-white mt-1 leading-tight">
                Starting Point Outside {destinationStateName}
              </h3>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-700 leading-relaxed">
            The starting location you entered appears to be outside of{' '}
            <strong className="text-slate-900 font-semibold">{destinationStateName}</strong>.
          </p>

          {/* Location Comparison Card */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 space-y-2.5 text-xs text-slate-700">
            <div className="flex items-start justify-between gap-2">
              <span className="text-slate-500 font-medium">Selected Starting Point:</span>
              <span className="font-bold text-slate-900 text-right max-w-[240px] truncate" title={locationName}>
                📍 {locationName}
              </span>
            </div>

            {detectedStateName && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500 font-medium">Detected Location State:</span>
                <span className="font-semibold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-md">
                  {detectedStateName}
                </span>
              </div>
            )}

            {distanceKm > 0 && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500 font-medium">Distance to {destinationStateName}:</span>
                <span className="font-bold text-orange-700">
                  Approx. {distanceKm} km away
                </span>
              </div>
            )}

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-amber-200/60 text-slate-600">
              <span className="text-slate-500 font-medium">Target Itinerary State:</span>
              <span className="font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md">
                🏛️ {destinationStateName}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-600 space-y-1">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-emerald-700" />
              Why does this matter?
            </div>
            <p className="text-[11px] leading-relaxed text-slate-600">
              Heritage site opening hours, walking routes, and time budgets are optimized for travel inside{' '}
              <strong>{destinationStateName}</strong>. Starting from another state adds substantial transit time to your day tour.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 pt-0 space-y-2.5">
          {/* Action 1: Reselect (Primary Recommendation) */}
          <button
            type="button"
            onClick={onReselect}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-emerald-700 hover:bg-emerald-800 text-white shadow-md shadow-emerald-700/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <MapPin className="w-4 h-4 text-emerald-200" />
            Reselect Starting Point in {destinationStateName}
          </button>

          {/* Action 2: Switch State (if detected state exists and is available) */}
          {detectedStateId && onSwitchState && (
            <button
              type="button"
              onClick={() => onSwitchState(detectedStateId)}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300/80 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowRightLeft className="w-4 h-4 text-amber-700" />
              Switch Tour State to {detectedStateName || detectedStateId}
            </button>
          )}

          {/* Action 3: Proceed anyway */}
          <button
            type="button"
            onClick={onProceedAnyway}
            className="w-full py-2 px-4 rounded-xl text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            Proceed anyway (Cross-state travel from {locationName})
          </button>
        </div>
      </div>
    </div>
  );
};
