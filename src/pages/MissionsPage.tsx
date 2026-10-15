import React, { useState, useEffect, useRef } from 'react';
import { CulturalMission, HeritagePlace, MissionProof, ExplorerBadge } from '../types';
import { MissionCard } from '../components/missions/MissionCard';
import { BadgeShowcaseBar } from '../components/missions/BadgeShowcaseBar';
import { BadgeCelebrationModal } from '../components/missions/BadgeCelebrationModal';
import { Award, RotateCcw } from 'lucide-react';
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
        onClose={() => setIsCelebrationOpen(false)}
      />

      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#04100E] via-[#0A1F1C] to-[#082622] text-[#F5F5F0] p-8 sm:p-12 border border-[#D4AF37]/35 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0E2925] border border-[#D4AF37]/40 text-[#E5C05C] text-xs font-semibold backdrop-blur-md">
              <Award className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span>Conscious Cultural Missions</span>
            </div>
            <h1 className="font-serif font-bold text-3xl sm:text-4xl text-[#F5F5F0]">
              Heritage in Action: Learn, Notice, Reflect
            </h1>
            <p className="text-xs sm:text-sm text-[#F5F5F0]/80 max-w-2xl leading-relaxed">
              Visit heritage monuments in person, upload your photo proof of visit, or test your architectural knowledge. Unlock bronze, silver, and gold explorer badges!
            </p>
          </div>

          {/* Progress Card */}
          <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-[#D4AF37]/30 sm:w-64 space-y-2 shrink-0">
            <div className="flex items-center justify-between text-xs font-semibold text-[#F5F5F0]">
              <span>Missions Verified</span>
              <span>{completedCount} / {totalCount} Done</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#00F0FF] via-[#E5C05C] to-[#D4AF37] rounded-full transition-all duration-500 shadow-[0_0_8px_#00F0FF]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[10px] text-[#00F0FF]/90">
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
        <div className="text-xs text-[#F5F5F0]/70">
          Showing {missions.length} curated educational missions with photo verification
        </div>
        {completedCount > 0 && (
          <button
            onClick={onResetMissions}
            className="text-xs font-medium text-[#F5F5F0]/60 hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Mission Progress
          </button>
        )}
      </div>

      {/* Missions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {missions.map((mission) => (
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
    </div>
  );
};
