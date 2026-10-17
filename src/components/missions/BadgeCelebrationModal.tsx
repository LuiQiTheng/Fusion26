import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import confetti from 'canvas-confetti';
import { X, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { ExplorerBadge } from '../../types';

interface BadgeCelebrationModalProps {
  badge: ExplorerBadge | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BadgeCelebrationModal: React.FC<BadgeCelebrationModalProps> = ({
  badge,
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    if (isOpen && badge) {
      // Fire multi-stage celebratory fireworks confetti
      const end = Date.now() + 1500;
      const colors = ['#f59e0b', '#10b981', '#6366f1', '#ec4899', '#eab308'];

      (function frame() {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    }
  }, [isOpen, badge]);

  // Support closing with Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !badge) return null;

  const getTierVisuals = () => {
    switch (badge.id) {
      case 'bronze':
        return {
          bannerBg: 'from-amber-900 via-amber-800 to-slate-950',
          badgeBg: 'bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 text-amber-100 ring-amber-500/40',
          glowColor: 'bg-amber-600/30',
          label: 'Bronze Rank Achieved',
        };
      case 'silver':
        return {
          bannerBg: 'from-slate-800 via-slate-700 to-slate-950',
          badgeBg: 'bg-gradient-to-br from-slate-200 via-slate-100 to-slate-400 text-slate-900 ring-slate-300/60',
          glowColor: 'bg-slate-300/30',
          label: 'Silver Rank Achieved',
        };
      case 'gold':
      default:
        return {
          bannerBg: 'from-amber-950 via-yellow-900 to-slate-950',
          badgeBg: 'bg-gradient-to-br from-amber-300 via-yellow-200 to-amber-500 text-amber-950 ring-amber-400/70',
          glowColor: 'bg-yellow-400/40',
          label: 'Gold Master Rank Achieved',
        };
    }
  };

  const visuals = getTierVisuals();

  return createPortal(
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-teal-900/15 text-center animate-in zoom-in-95 duration-200 text-[#0A2F25] my-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="badge-celebration-title"
      >
        {/* Glow ambient circle */}
        <div className={`absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl pointer-events-none ${visuals.glowColor}`} />

        {/* Top Header Banner */}
        <div className={`p-6 bg-gradient-to-br ${visuals.bannerBg} text-white relative`}>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-amber-300 text-xs font-semibold backdrop-blur-md mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{visuals.label}</span>
          </div>

          {/* Central Shining Badge Emblem */}
          <div className="relative mx-auto my-2 w-28 h-28 flex items-center justify-center">
            <div className={`absolute inset-0 rounded-full animate-ping opacity-25 ${visuals.glowColor}`} />
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center text-5xl shadow-2xl ring-8 ${visuals.badgeBg} transform hover:scale-105 transition-transform`}
            >
              {badge.icon}
            </div>
          </div>

          <h2 id="badge-celebration-title" className="font-serif font-extrabold text-2xl sm:text-3xl text-white mt-3">
            {badge.name}
          </h2>
          <p className="text-xs text-amber-200/90 font-medium mt-1">
            Official Heritage Explorer Tier: {badge.level}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 bg-white">
          <div className="p-4 rounded-2xl bg-[#EBF5F0] border border-teal-900/15 text-xs text-[#0A2F25]/80 leading-relaxed text-left space-y-2">
            <div className="flex items-center gap-2 font-bold text-[#B88E18]">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Cultural Milestone Certified</span>
            </div>
            <p className="text-[#0A2F25]/85">{badge.description}</p>
            <p className="text-[11px] text-[#B88E18] italic">
              "Your photographic proof and field engagement contribute to preserving living Malaysian cultural memories for future generations."
            </p>
          </div>

          {/* Action CTAs */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3.5 px-5 rounded-2xl bg-[#C5A028] hover:bg-[#B88E18] text-white font-bold text-sm shadow-md shadow-[#C5A028]/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <span>Awesome! Keep Exploring</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
