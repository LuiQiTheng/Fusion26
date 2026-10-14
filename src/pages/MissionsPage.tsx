import React from 'react';
import { CulturalMission, HeritagePlace } from '../types';
import { MissionCard } from '../components/missions/MissionCard';
import { Award, ShieldCheck, Sparkles, RotateCcw } from 'lucide-react';

interface MissionsPageProps {
  missions: CulturalMission[];
  completedMissionIds: string[];
  onCompleteMission: (missionId: string) => void;
  places: HeritagePlace[];
  onSelectPlace: (place: HeritagePlace) => void;
  onResetMissions: () => void;
}

export const MissionsPage: React.FC<MissionsPageProps> = ({
  missions,
  completedMissionIds,
  onCompleteMission,
  places,
  onSelectPlace,
  onResetMissions,
}) => {
  const completedCount = completedMissionIds.length;
  const totalCount = missions.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-amber-950 text-white p-8 sm:p-12 border border-emerald-500/20 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold backdrop-blur-md">
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              <span>Conscious Cultural Missions</span>
            </div>
            <h1 className="font-serif font-bold text-3xl sm:text-4xl text-white">
              Heritage in Action: Learn, Notice, Reflect
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Engage with historical stories and architectural craftsmanship. These missions encourage thoughtful observation and preservation awareness rather than superficial tourism.
            </p>
          </div>

          {/* Progress Card */}
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 sm:w-64 space-y-2 shrink-0">
            <div className="flex items-center justify-between text-xs font-semibold text-white">
              <span>Overall Progress</span>
              <span>{completedCount} / {totalCount} Done</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[10px] text-emerald-200">
              {progressPercent === 100 ? '🎉 All cultural missions unlocked!' : 'Complete challenges to earn heritage badges'}
            </p>
          </div>
        </div>
      </div>

      {/* Controls & Reset */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500">
          Showing {missions.length} curated educational missions
        </div>
        {completedCount > 0 && (
          <button
            onClick={onResetMissions}
            className="text-xs font-medium text-slate-500 hover:text-red-600 flex items-center gap-1 transition-colors"
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
          />
        ))}
      </div>
    </div>
  );
};
