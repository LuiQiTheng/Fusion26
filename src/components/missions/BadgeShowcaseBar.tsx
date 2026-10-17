import React, { useState, useEffect } from 'react';
import { Award, ShieldCheck, Crown, Lock, CheckCircle2, Sparkles, Plus, Minus, RotateCcw } from 'lucide-react';
import { ExplorerBadge } from '../../types';
import { EXPLORER_BADGES, getNextBadge, checkNewlyUnlockedBadge } from '../../lib/badges';

const DEMO_STORAGE_KEY = 'fusion2026_demo_badge_counter';

const readInitialCount = (fallback: number): number => {
  try {
    const saved = localStorage.getItem(DEMO_STORAGE_KEY);
    if (saved !== null) {
      const num = parseInt(saved, 10);
      if (!isNaN(num) && num >= 0) return num;
    }
  } catch (e) {
    // ignore
  }
  return fallback || 0;
};

interface BadgeShowcaseBarProps {
  completedCount: number;
  totalMissions: number;
  onBadgeClick?: (badge: ExplorerBadge) => void;
  onCountChange?: (count: number) => void;
}

export const BadgeShowcaseBar: React.FC<BadgeShowcaseBarProps> = ({
  completedCount: externalCompletedCount,
  totalMissions,
  onBadgeClick,
  onCountChange,
}) => {
  const [demoCount, setDemoCount] = useState<number>(() => readInitialCount(externalCompletedCount));

  // Sync with external count if higher
  useEffect(() => {
    if (externalCompletedCount > 0 && externalCompletedCount > demoCount) {
      setDemoCount(externalCompletedCount);
    }
  }, [externalCompletedCount]);

  // Sync across component instances & windows
  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<number>;
      if (typeof customEvent.detail === 'number') {
        setDemoCount(customEvent.detail);
      }
    };
    window.addEventListener('fusion_demo_counter_changed', handleSync);
    return () => window.removeEventListener('fusion_demo_counter_changed', handleSync);
  }, []);

  const effectiveCount = demoCount;
  const nextInfo = getNextBadge(effectiveCount);

  const handleSetCount = (newCount: number) => {
    const validCount = Math.max(0, newCount);
    const prev = demoCount;
    setDemoCount(validCount);
    try {
      localStorage.setItem(DEMO_STORAGE_KEY, String(validCount));
    } catch (e) {
      // ignore
    }
    window.dispatchEvent(new CustomEvent('fusion_demo_counter_changed', { detail: validCount }));
    onCountChange?.(validCount);

    if (validCount > prev) {
      const unlocked = checkNewlyUnlockedBadge(prev, validCount);
      if (unlocked) {
        onBadgeClick?.(unlocked);
      }
    }
  };

  const handleIncrement = () => {
    handleSetCount(demoCount + 1);
  };

  const handleDecrement = () => {
    if (demoCount <= 0) return;
    handleSetCount(demoCount - 1);
  };

  const handleReset = () => {
    handleSetCount(0);
  };

  const getBadgeVisuals = (badge: ExplorerBadge, isUnlocked: boolean) => {
    switch (badge.id) {
      case 'bronze':
        return {
          icon: <Award className="w-6 h-6 text-amber-800" />,
          activeBg: 'bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 text-white shadow-amber-900/30',
          lockedBg: 'bg-slate-50 border-slate-200 text-slate-400',
          ringColor: 'ring-amber-600/40',
          accentText: 'text-amber-800',
          tag: 'Bronze Tier',
        };
      case 'silver':
        return {
          icon: <ShieldCheck className="w-6 h-6 text-slate-700" />,
          activeBg: 'bg-gradient-to-br from-slate-200 via-slate-100 to-slate-400 text-slate-900 shadow-slate-500/30',
          lockedBg: 'bg-slate-50 border-slate-200 text-slate-400',
          ringColor: 'ring-slate-400/40',
          accentText: 'text-slate-700',
          tag: 'Silver Tier',
        };
      case 'gold':
      default:
        return {
          icon: <Crown className="w-6 h-6 text-amber-900" />,
          activeBg: 'bg-gradient-to-br from-amber-300 via-yellow-200 to-amber-500 text-amber-950 shadow-amber-400/40',
          lockedBg: 'bg-slate-50 border-slate-200 text-slate-400',
          ringColor: 'ring-amber-400/50',
          accentText: 'text-amber-900',
          tag: 'Gold Tier',
        };
    }
  };

  return (
    <div className="rounded-3xl bg-white/80 backdrop-blur-md border border-teal-900/10 p-6 shadow-sm space-y-6">
      {/* Title & Next Level Summary */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#B88E18]">
            <Sparkles className="w-4 h-4 text-[#C5A028]" />
            <span>Heritage Progression</span>
          </div>
          <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#0A2F25] mt-0.5">
            Explorer Badges & Proof-of-Visit
          </h2>
          <p className="text-xs text-[#0A2F25]/70 mt-0.5">
            Visit heritage landmarks, upload photo proof, and complete cultural missions to unlock certified explorer ranks.
          </p>
        </div>

        {/* Top Right: Demo Visits Counter & Next badge pill */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
          {/* Interactive Demo Counter (Just counter and +- symbol) */}
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white border border-[#C5A028]/60 shadow-xs text-xs">
            <span className="font-semibold text-[#0A2F25]">
              Counter = <span className="text-sm font-extrabold text-[#087E83]">{demoCount}</span>
            </span>
            <div className="flex items-center gap-1 pl-2 border-l border-teal-900/15">
              <button
                type="button"
                onClick={handleDecrement}
                disabled={demoCount <= 0}
                className="w-6 h-6 rounded-md bg-[#EBF5F0] hover:bg-[#D5EDE2] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-[#0A2F25] transition-all cursor-pointer active:scale-95"
                title="Minus 1 visit"
                aria-label="Decrease counter"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleIncrement}
                className="w-6 h-6 rounded-md bg-[#0A2F25] hover:bg-[#087E83] flex items-center justify-center text-white transition-all cursor-pointer active:scale-95"
                title="Add 1 visit"
                aria-label="Increase counter"
              >
                <Plus className="w-3.5 h-3.5 text-[#E5C05C]" />
              </button>
            </div>
          </div>

          {/* Next milestone pill */}
          <div className="px-3.5 py-1.5 rounded-full bg-[#EBF5F0] border border-teal-900/15 text-xs shadow-2xs">
            {nextInfo ? (
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-[#0A2F25]/70">Next:</span>
                <span className="font-bold text-[#B88E18]">
                  {nextInfo.nextBadge.name} ({nextInfo.remaining} to go)
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 font-bold text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
                <span>All Badges Unlocked!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {EXPLORER_BADGES.map((badge) => {
          const isUnlocked = effectiveCount >= badge.minRequired;
          const displayedCount = Math.min(effectiveCount, badge.minRequired);
          const visuals = getBadgeVisuals(badge, isUnlocked);
          const progressPercent = Math.min(100, Math.round((displayedCount / badge.minRequired) * 100));

          return (
            <div
              key={badge.id}
              onClick={() => isUnlocked && onBadgeClick?.(badge)}
              className={`relative rounded-2xl p-5 border transition-all duration-300 flex flex-col justify-between overflow-hidden ${
                isUnlocked
                  ? 'bg-white border-[#C5A028]/60 shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer ring-1 ring-[#C5A028]/20'
                  : 'bg-white/60 border-teal-900/10 opacity-75'
              }`}
            >
              {/* Top Row: Medal Icon & Status */}
              <div className="flex items-start justify-between mb-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md font-bold text-2xl transition-transform ${
                    isUnlocked ? visuals.activeBg + ' scale-105' : 'bg-[#EBF5F0] text-slate-400'
                  }`}
                >
                  {isUnlocked ? badge.icon : <Lock className="w-5 h-5 text-slate-400" />}
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full ${
                      isUnlocked
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-600/30 font-extrabold'
                        : 'bg-[#EBF5F0] text-[#0A2F25]/60 border border-teal-900/15'
                    }`}
                  >
                    {isUnlocked ? '✓ Unlocked' : `Requires ${badge.minRequired} Visits`}
                  </span>
                </div>
              </div>

              {/* Title & Level */}
              <div className="space-y-1.5 my-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-[#B88E18] uppercase tracking-wide">
                    {badge.level} Tier
                  </span>
                  {isUnlocked && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
                <h3 className="font-serif font-bold text-base text-[#0A2F25]">
                  {badge.name}
                </h3>
                <p className="text-xs text-[#0A2F25]/70 leading-relaxed">
                  {badge.description}
                </p>
              </div>

              {/* Bottom Progress Bar */}
              <div className="pt-3 mt-2 border-t border-teal-900/10 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-medium text-[#0A2F25]/70">
                  <span>Requirement:</span>
                  <span className={isUnlocked ? 'font-bold text-emerald-700' : 'font-semibold text-[#0A2F25]/80'}>
                    {displayedCount} / {badge.minRequired} Verified
                  </span>
                </div>

                <div className="w-full h-1.5 rounded-full bg-teal-900/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isUnlocked
                        ? 'bg-gradient-to-r from-emerald-500 via-[#087E83] to-[#C5A028]'
                        : 'bg-[#C5A028]'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
