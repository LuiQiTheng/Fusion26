import React, { useState, useEffect, useRef } from 'react';
import { CulturalMission, HeritagePlace, MissionProof, ExplorerBadge } from '../types';
import { MissionCard } from '../components/missions/MissionCard';
import { BadgeShowcaseBar } from '../components/missions/BadgeShowcaseBar';
import { BadgeCelebrationModal } from '../components/missions/BadgeCelebrationModal';
import { Award, RotateCcw, ChevronDown } from 'lucide-react';
import { checkNewlyUnlockedBadge } from '../lib/badges';

interface MissionsPageProps {
  missions: CulturalMission[];
  completedMissionIds: string[];
  onCompleteMission: (missionId: string) => void;
  places: HeritagePlace[];
  onSelectPlace: (place: HeritagePlace) => void;
  onResetMissions: () => void;
  proofs: Record<string, MissionProof>;
  onUploadProof: (proof: MissionProof) => void;
}

export const MissionsPage: React.FC<MissionsPageProps> = ({
  missions,
  completedMissionIds,
  onCompleteMission,
  places,
  onSelectPlace,
  onResetMissions,
  proofs,
  onUploadProof,
}) => {
  const completedCount = completedMissionIds.length;
  const totalCount = missions.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  // Pagination state: By default, show first 2 mission cards
  const [isMissionsExpanded, setIsMissionsExpanded] = useState(false);
  const displayedMissions = isMissionsExpanded ? missions : missions.slice(0, 2);

  // Badge Celebration modal state
  const [celebrationBadge, setCelebrationBadge] = useState<ExplorerBadge | null>(null);
  const [isCelebrationOpen, setIsCelebrationOpen] = useState(false);

  // Track previous completed count to detect badge unlock transition
  const prevCountRef = useRef(completedCount);

  useEffect(() => {
    const prevCount = prevCountRef.current;
    if (completedCount > prevCount) {
      const unlocked = checkNewlyUnlockedBadge(prevCount, completedCount);
      if (unlocked) {
        setCelebrationBadge(unlocked);
        setIsCelebrationOpen(true);
      }
    }
    prevCountRef.current = completedCount;
  }, [completedCount]);

  const handleBadgeClick = (badge: ExplorerBadge) => {
    setCelebrationBadge(badge);
    setIsCelebrationOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Celebration Modal */}
      <BadgeCelebrationModal
        badge={celebrationBadge}
        isOpen={isCelebrationOpen}
        onClose={() => {
          setIsCelebrationOpen(false);
          setCelebrationBadge(null);
        }}
      />

      {/* Header Banner */}
      <div className="rounded-3xl bg-white/80 border border-teal-900/10 text-[#0A2F25] p-8 sm:p-12 shadow-xl shadow-teal-900/5 backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF5F0] border border-teal-900/10 text-[#0A2F25] text-xs font-semibold backdrop-blur-md">
              <Award className="w-3.5 h-3.5 text-[#B88E18]" />
              <span>Conscious Cultural Missions</span>
            </div>
            <h1 className="font-serif font-bold text-3xl sm:text-4xl text-[#0A2F25]">
              Heritage in Action: Learn, Notice, Reflect
            </h1>
            <p className="text-xs sm:text-sm text-[#0A2F25]/80 max-w-2xl leading-relaxed">
              Visit heritage monuments in person, upload your photo proof of visit, or test your architectural knowledge. Unlock bronze, silver, and gold explorer badges!
            </p>
          </div>

          {/* Progress Card */}
          <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-teal-900/10 sm:w-64 space-y-2 shrink-0 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-[#0A2F25]">
              <span>Missions Verified</span>
              <span>{completedCount} / {totalCount} Done</span>
            </div>
            <div className="w-full h-2 rounded-full bg-teal-900/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#087E83] to-[#C5A028] rounded-full transition-all duration-500 shadow-xs"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[10px] text-[#087E83] font-medium">
              {progressPercent === 100
                ? '🎉 All cultural missions unlocked!'
                : 'Upload photo proof to level up your badge'}
            </p>
          </div>
        </div>
      </div>

      {/* Explorer Badges Progression Bar */}
      <BadgeShowcaseBar
        completedCount={completedCount}
        totalMissions={totalCount}
        onBadgeClick={handleBadgeClick}
      />

      {/* Controls & Reset */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-xs text-[#0A2F25]/70">
          Showing {displayedMissions.length} of {missions.length} curated educational missions with photo verification
        </div>
        {completedCount > 0 && (
          <button
            onClick={onResetMissions}
            className="text-xs font-medium text-[#0A2F25]/60 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Mission Progress
          </button>
        )}
      </div>

      {/* Missions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayedMissions.map((mission) => (
          <MissionCard
            key={mission.id}
            mission={mission}
            isCompleted={completedMissionIds.includes(mission.id)}
            onComplete={onCompleteMission}
            places={places}
            onSelectPlace={onSelectPlace}
            proof={proofs[mission.id]}
            onUploadProof={onUploadProof}
          />
        ))}
      </div>

      {/* Show More / Show Less Missions Button */}
      {missions.length > 2 && (
        <div className="flex justify-center pt-3 pb-2">
          <button
            type="button"
            onClick={() => setIsMissionsExpanded((prev) => !prev)}
            className="px-5 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-[#0A2F25] border border-teal-900/15 shadow-xs hover:shadow-md transition-all font-bold text-xs flex items-center gap-2 cursor-pointer group"
          >
            <span>{isMissionsExpanded ? 'Show Less Missions' : `Show More Missions (${missions.length - 2} more)`}</span>
            <ChevronDown
              className={`w-4 h-4 text-[#087E83] transition-transform duration-200 ${
                isMissionsExpanded ? 'rotate-180' : 'group-hover:translate-y-0.5'
              }`}
            />
          </button>
        </div>
      )}
    </div>
  );
};
