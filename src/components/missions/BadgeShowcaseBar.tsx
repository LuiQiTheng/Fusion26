import React from 'react';
import { Award, ShieldCheck, Crown, Lock, CheckCircle2, Sparkles } from 'lucide-react';
import { ExplorerBadge } from '../../types';
import { EXPLORER_BADGES, getNextBadge } from '../../lib/badges';

interface BadgeShowcaseBarProps {
  completedCount: number;
  totalMissions: number;
  onBadgeClick?: (badge: ExplorerBadge) => void;
}

export const BadgeShowcaseBar: React.FC<BadgeShowcaseBarProps> = ({
  completedCount,
  totalMissions,
  onBadgeClick,
}) => {
  const nextInfo = getNextBadge(completedCount);

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
    <div className="rounded-3xl bg-[#0A1F1C]/90 border border-[#D4AF37]/25 p-6 shadow-lg space-y-6">
      {/* Title & Next Level Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#E5C05C]">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <span>Heritage Progression</span>
          </div>
          <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#F5F5F0] mt-0.5">
            Explorer Badges & Proof-of-Visit
          </h2>
          <p className="text-xs text-[#F5F5F0]/70 mt-0.5">
            Visit heritage landmarks, upload photo proof, and complete cultural missions to unlock certified explorer ranks.
          </p>
        </div>

        {/* Next badge pill */}
        <div className="self-start sm:self-auto px-4 py-2 rounded-2xl bg-[#04100E] border border-[#D4AF37]/25 text-xs">
          {nextInfo ? (
            <div className="flex items-center gap-2">
              <span className="font-medium text-[#F5F5F0]/70">Next milestone:</span>
              <span className="font-bold text-[#E5C05C]">
                {nextInfo.nextBadge.name} ({nextInfo.remaining} more to go)
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 font-bold text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>All Explorer Badges Unlocked!</span>
            </div>
          )}
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {EXPLORER_BADGES.map((badge) => {
          const isUnlocked = completedCount >= badge.minRequired;
          const visuals = getBadgeVisuals(badge, isUnlocked);
          const progressPercent = Math.min(100, Math.round((completedCount / badge.minRequired) * 100));

          return (
            <div
              key={badge.id}
              onClick={() => isUnlocked && onBadgeClick?.(badge)}
              className={`relative rounded-2xl p-5 border transition-all duration-300 flex flex-col justify-between overflow-hidden ${
                isUnlocked
                  ? 'bg-[#04100E] border-[#D4AF37] shadow-lg hover:shadow-[0_0_15px_rgba(212,175,55,0.25)] hover:-translate-y-0.5 cursor-pointer ring-2 ring-[#D4AF37]/30'
                  : 'bg-[#04100E]/50 border-[#D4AF37]/15 opacity-60'
              }`}
            >
              {/* Top Row: Medal Icon & Status */}
              <div className="flex items-start justify-between mb-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md font-bold text-2xl transition-transform ${
                    isUnlocked ? visuals.activeBg + ' scale-105' : 'bg-[#0A1F1C] text-slate-500'
                  }`}
                >
                  {isUnlocked ? badge.icon : <Lock className="w-5 h-5 text-slate-500" />}
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                      isUnlocked
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                        : 'bg-[#0E2925] text-[#F5F5F0]/60 border border-[#D4AF37]/20'
                    }`}
                  >
                    {isUnlocked ? 'Unlocked' : `Requires ${badge.minRequired} Visits`}
                  </span>
                </div>
              </div>

              {/* Title & Level */}
              <div className="space-y-1 my-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-[#E5C05C] uppercase tracking-wide">
                    {badge.level} Tier
                  </span>
                  {isUnlocked && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <h3 className="font-serif font-bold text-base text-[#F5F5F0]">
                  {badge.name}
                </h3>
                <p className="text-xs text-[#F5F5F0]/70 leading-relaxed">
                  {badge.description}
                </p>
              </div>

              {/* Bottom Progress Bar */}
              <div className="pt-3 mt-2 border-t border-[#D4AF37]/15 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-medium text-[#F5F5F0]/70">
                  <span>Requirement:</span>
                  <span className={isUnlocked ? 'font-bold text-emerald-400' : 'font-semibold text-[#F5F5F0]/80'}>
                    {completedCount} / {badge.minRequired} Verified
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#0A1F1C] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isUnlocked
                        ? 'bg-gradient-to-r from-emerald-400 via-[#00F0FF] to-[#D4AF37]'
                        : 'bg-[#D4AF37]'
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
