import React, { useState } from 'react';
import { Award, CheckCircle2, HelpCircle, Eye, BookOpen, MessageSquare, AlertTriangle, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CulturalMission, HeritagePlace } from '../../types';

interface MissionCardProps {
  mission: CulturalMission;
  isCompleted: boolean;
  onComplete: (missionId: string) => void;
  places: HeritagePlace[];
  onSelectPlace: (place: HeritagePlace) => void;
}

export const MissionCard: React.FC<MissionCardProps> = ({
  mission,
  isCompleted,
  onComplete,
  places,
  onSelectPlace,
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [reflectionText, setReflectionText] = useState('');
  const [hasError, setHasError] = useState(false);

  const placeMap = new Map<string, HeritagePlace>(places.map((p) => [p.id, p]));

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'notice':
        return <Eye className="w-4 h-4 text-amber-600" />;
      case 'learn':
        return <BookOpen className="w-4 h-4 text-indigo-600" />;
      case 'reflect':
        return <MessageSquare className="w-4 h-4 text-emerald-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-purple-600" />;
    }
  };

  const handleQuizSubmit = () => {
    if (selectedOption === null) return;

    if (mission.quizCorrectIndex !== undefined) {
      if (selectedOption === mission.quizCorrectIndex) {
        setHasError(false);
        setShowExplanation(true);
        if (!isCompleted) {
          onComplete(mission.id);
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.7 },
          });
        }
      } else {
        setHasError(true);
      }
    }
  };

  const handleReflectionSubmit = () => {
    if (reflectionText.trim().length > 10) {
      setShowExplanation(true);
      if (!isCompleted) {
        onComplete(mission.id);
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.7 },
        });
      }
    }
  };

  return (
    <div
      className={`rounded-3xl p-6 border transition-all ${
        isCompleted
          ? 'bg-emerald-50/40 border-emerald-300/80 shadow-xs'
          : 'bg-white border-slate-200/90 shadow-md hover:border-amber-400/80'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-slate-100 flex items-center justify-center">
            {getTypeIcon(mission.type)}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                Mission: {mission.type}
              </span>
              {isCompleted && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Completed
                </span>
              )}
            </div>
            <h3 className="font-serif font-bold text-lg text-slate-900 mt-1">
              {mission.title}
            </h3>
          </div>
        </div>

        <div className="shrink-0">
          <Award className={`w-6 h-6 ${isCompleted ? 'text-emerald-600' : 'text-slate-300'}`} />
        </div>
      </div>

      {/* Instructions */}
      <p className="text-xs text-slate-600 leading-relaxed mb-4">
        {mission.instructions}
      </p>

      {/* Related Places Chips */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-[11px] font-semibold text-slate-500">Related Locations:</span>
        {mission.placeIds.map((pid) => {
          const p = placeMap.get(pid);
          if (!p) return null;
          return (
            <button
              key={pid}
              onClick={() => onSelectPlace(p)}
              className="text-xs px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-medium transition-colors"
            >
              🏛 {p.name}
            </button>
          );
        })}
      </div>

      {/* Cultural Sensitivity Warning */}
      {mission.sensitivityNote && (
        <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900 flex items-start gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <span>{mission.sensitivityNote}</span>
        </div>
      )}

      {/* Interactive Quiz Mode */}
      {mission.quizQuestion && (
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
          <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-amber-600" />
            {mission.quizQuestion}
          </p>

          <div className="space-y-1.5">
            {mission.quizOptions?.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedOption(idx);
                    setHasError(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-600 text-white font-semibold shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span>{opt}</span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>

          {hasError && (
            <p className="text-xs text-red-600 font-medium">
              Not quite! Check the historical records and try another option.
            </p>
          )}

          {!showExplanation && (
            <button
              type="button"
              onClick={handleQuizSubmit}
              disabled={selectedOption === null}
              className="w-full py-2 px-4 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
            >
              Submit Answer
            </button>
          )}
        </div>
      )}

      {/* Reflection Mode */}
      {mission.reflectionPrompt && (
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
          <p className="text-xs font-bold text-slate-900">
            {mission.reflectionPrompt}
          </p>
          <textarea
            value={reflectionText}
            onChange={(e) => setReflectionText(e.target.value)}
            placeholder="Share your conscious reflection (min 10 characters)..."
            rows={2}
            className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:border-amber-600 bg-white"
          />
          {!showExplanation && (
            <button
              type="button"
              onClick={handleReflectionSubmit}
              disabled={reflectionText.trim().length < 10}
              className="w-full py-2 px-4 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
            >
              Complete Reflection
            </button>
          )}
        </div>
      )}

      {/* Sourced Explanation upon completion */}
      {(showExplanation || isCompleted) && (
        <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-2 animate-in fade-in">
          <h4 className="font-bold flex items-center gap-1.5 text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Curator's Learning Insight
          </h4>
          <p className="leading-relaxed text-emerald-900">{mission.explanation}</p>
          <div className="text-[11px] text-emerald-700 italic border-t border-emerald-200/70 pt-2">
            Verified Source: {mission.sourceIds.join(', ')}
          </div>
        </div>
      )}
    </div>
  );
};
