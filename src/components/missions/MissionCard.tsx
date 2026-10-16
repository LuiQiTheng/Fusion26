import React, { useState, useRef } from 'react';
import {
  Award,
  CheckCircle2,
  HelpCircle,
  Eye,
  BookOpen,
  MessageSquare,
  AlertTriangle,
  Sparkles,
  Camera,
  Upload,
  RefreshCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CulturalMission, HeritagePlace, MissionProof } from '../../types';

interface MissionCardProps {
  mission: CulturalMission;
  isCompleted: boolean;
  onComplete: (missionId: string) => void;
  places: HeritagePlace[];
  onSelectPlace: (place: HeritagePlace) => void;
  proof?: MissionProof;
  onUploadProof?: (proof: MissionProof) => void;
}

// Utility to resize and compress user uploaded photo to ~60-100KB for localStorage compatibility
function compressImage(file: File, maxWidth = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const MissionCard: React.FC<MissionCardProps> = ({
  mission,
  isCompleted,
  onComplete,
  places,
  onSelectPlace,
  proof,
  onUploadProof,
}) => {
  // Verification mode tab: 'photo' (Proof of Visit) vs 'quiz' (Knowledge Challenge)
  const [activeTab, setActiveTab] = useState<'photo' | 'quiz'>('photo');

  // Photo upload states
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState<string | null>(null);

  // Quiz / Reflection states
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [reflectionText, setReflectionText] = useState('');
  const [hasQuizError, setHasQuizError] = useState(false);

  const placeMap = new Map<string, HeritagePlace>(places.map((p) => [p.id, p]));
  const primaryPlace = mission.placeIds.length > 0 ? placeMap.get(mission.placeIds[0]) : null;

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

  // Handle Photo Proof Upload
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingPhoto(true);
    setVerificationFeedback('Analyzing landmark visual characteristics...');

    try {
      const compressedDataUrl = await compressImage(file);
      const verifiedLabel = primaryPlace
        ? `Field Visit Verified: ${primaryPlace.name}`
        : 'Field Visit Verified';

      const newProof: MissionProof = {
        missionId: mission.id,
        placeId: primaryPlace?.id,
        placeName: primaryPlace?.name,
        photoDataUrl: compressedDataUrl,
        uploadedAt: new Date().toLocaleDateString('en-MY', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        verifiedLabel,
      };

      setTimeout(() => {
        setIsProcessingPhoto(false);
        setVerificationFeedback(`✓ Landmark matched! Verified for ${primaryPlace?.name || 'Heritage Monument'}.`);
        onUploadProof?.(newProof);

        if (!isCompleted) {
          onComplete(mission.id);
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.7 },
          });
        }
      }, 700);
    } catch (err) {
      console.error('Failed to process image:', err);
      setIsProcessingPhoto(false);
      setVerificationFeedback('Could not read image. Please try a different photo.');
    }
  };

  // Handle Knowledge Quiz Submit
  const handleQuizSubmit = () => {
    if (selectedOption === null) return;

    if (mission.quizCorrectIndex !== undefined) {
      if (selectedOption === mission.quizCorrectIndex) {
        setHasQuizError(false);
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
        setHasQuizError(true);
      }
    }
  };

  // Handle Reflection Submit
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
          ? 'bg-emerald-50/70 border-emerald-500/30 shadow-sm'
          : 'bg-white/80 backdrop-blur-md border-teal-900/10 shadow-sm hover:border-[#C5A028]'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-[#EBF5F0] border border-teal-900/15 flex items-center justify-center">
            {getTypeIcon(mission.type)}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#EBF5F0] text-[#B88E18] border border-teal-900/15">
                Mission: {mission.type}
              </span>
              {isCompleted && (
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-600/30">
                  <CheckCircle2 className="w-3 h-3" /> Completed
                </span>
              )}
            </div>
            <h3 className="font-serif font-bold text-lg text-[#0A2F25] mt-1">
              {mission.title}
            </h3>
          </div>
        </div>

        <div className="shrink-0">
          <Award className={`w-6 h-6 ${isCompleted ? 'text-emerald-600' : 'text-[#C5A028]/50'}`} />
        </div>
      </div>

      {/* Instructions */}
      <p className="text-xs text-[#0A2F25]/75 leading-relaxed mb-4">
        {mission.instructions}
      </p>

      {/* Related Places Chips */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-[11px] font-semibold text-[#B88E18]">Target Location:</span>
        {mission.placeIds.map((pid) => {
          const p = placeMap.get(pid);
          if (!p) return null;
          return (
            <button
              key={pid}
              onClick={() => onSelectPlace(p)}
              className="text-xs px-2.5 py-1 rounded-lg bg-[#EBF5F0] hover:bg-[#E2EFE9] text-[#0A2F25] border border-teal-900/15 font-medium transition-colors cursor-pointer"
            >
              🏛 {p.name}
            </button>
          );
        })}
      </div>

      {/* Cultural Sensitivity Warning */}
      {mission.sensitivityNote && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 flex items-start gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <span>{mission.sensitivityNote}</span>
        </div>
      )}

      {/* Verification Method Sub-Tabs */}
      <div className="flex bg-[#EBF5F0] p-1 rounded-xl mb-4 border border-teal-900/15 text-xs">
        <button
          onClick={() => setActiveTab('photo')}
          className={`flex-1 py-1.5 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'photo'
              ? 'bg-[#C5A028] text-white shadow-xs'
              : 'text-[#0A2F25]/70 hover:text-[#0A2F25]'
          }`}
        >
          <Camera className={`w-3.5 h-3.5 ${activeTab === 'photo' ? 'text-white' : 'text-[#B88E18]'}`} />
          <span>Proof of Visit (Photo)</span>
          {proof && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
        </button>

        <button
          onClick={() => setActiveTab('quiz')}
          className={`flex-1 py-1.5 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'quiz'
              ? 'bg-[#C5A028] text-white shadow-xs'
              : 'text-[#0A2F25]/70 hover:text-[#0A2F25]'
          }`}
        >
          <HelpCircle className={`w-3.5 h-3.5 ${activeTab === 'quiz' ? 'text-white' : 'text-[#087E83]'}`} />
          <span>Knowledge Check</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: PHOTO PROOF OF VISIT
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'photo' && (
        <div className="space-y-3 p-4 rounded-2xl bg-[#EBF5F0] border border-teal-900/15">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoSelect}
          />

          {proof ? (
            /* Uploaded Photo Preview Card */
            <div className="space-y-3">
              <div className="relative h-44 w-full rounded-xl overflow-hidden border border-emerald-500/50 shadow-sm bg-slate-900">
                <img
                  src={proof.photoDataUrl}
                  alt="Proof of Visit"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold shadow-md flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>On-Site Visit Verified</span>
                </div>
                <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white text-[11px]">
                  <p className="font-semibold">{proof.placeName || 'Heritage Monument'}</p>
                  <p className="text-[10px] text-white/80">Recorded: {proof.uploadedAt}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Badge Progress Counted
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[#B88E18] hover:text-[#0A2F25] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  Replace Photo
                </button>
              </div>
            </div>
          ) : (
            /* Upload Action Area */
            <div className="space-y-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-teal-900/20 hover:border-[#C5A028] rounded-2xl p-6 text-center bg-white cursor-pointer transition-all hover:bg-[#F4F9F6] flex flex-col items-center justify-center space-y-2"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#EBF5F0] text-[#B88E18] border border-teal-900/15 flex items-center justify-center">
                  <Camera className="w-6 h-6" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-[#0A2F25]">
                    Take or Upload Photo of {primaryPlace?.name || 'this Heritage Site'}
                  </p>
                  <p className="text-[11px] text-[#0A2F25]/65">
                    Click to snap a picture on mobile or upload a photo from your camera roll
                  </p>
                </div>
                <button
                  type="button"
                  className="mt-2 px-4 py-1.5 rounded-xl bg-[#C5A028] hover:bg-[#B88E18] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Select / Take Photo</span>
                </button>
              </div>

              {isProcessingPhoto && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[#EBF5F0] border border-teal-500/30 text-xs text-teal-800 animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#087E83]" />
                  <span>{verificationFeedback}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: KNOWLEDGE QUIZ & REFLECTION
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'quiz' && (
        <div className="space-y-4">
          {/* Interactive Quiz Mode */}
          {mission.quizQuestion && (
            <div className="p-4 rounded-2xl bg-[#EBF5F0] border border-teal-900/15 space-y-3">
              <p className="text-xs font-bold text-[#0A2F25] flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-[#087E83]" />
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
                        setHasQuizError(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-[#C5A028] text-white font-semibold shadow-xs'
                          : 'bg-white text-[#0A2F25] hover:bg-[#E2EFE9] border border-teal-900/15'
                      }`}
                    >
                      <span>{opt}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>
                  );
                })}
              </div>

              {hasQuizError && (
                <p className="text-xs text-rose-600 font-medium">
                  Not quite! Check the historical records and try another option.
                </p>
              )}

              {!showExplanation && (
                <button
                  type="button"
                  onClick={handleQuizSubmit}
                  disabled={selectedOption === null}
                  className="w-full py-2 px-4 rounded-xl bg-[#C5A028] text-white text-xs font-bold hover:bg-[#B88E18] disabled:opacity-40 transition-colors cursor-pointer"
                >
                  Submit Answer
                </button>
              )}
            </div>
          )}

          {/* Reflection Mode */}
          {mission.reflectionPrompt && (
            <div className="p-4 rounded-2xl bg-[#EBF5F0] border border-teal-900/15 space-y-3">
              <p className="text-xs font-bold text-[#0A2F25]">
                {mission.reflectionPrompt}
              </p>
              <textarea
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
                placeholder="Share your conscious reflection (min 10 characters)..."
                rows={2}
                className="w-full p-2.5 rounded-xl border border-teal-900/20 text-xs text-[#0A2F25] focus:outline-hidden focus:border-[#C5A028] bg-white"
              />
              {!showExplanation && (
                <button
                  type="button"
                  onClick={handleReflectionSubmit}
                  disabled={reflectionText.trim().length < 10}
                  className="w-full py-2 px-4 rounded-xl bg-[#C5A028] text-white text-xs font-bold hover:bg-[#B88E18] disabled:opacity-40 transition-colors cursor-pointer"
                >
                  Complete Reflection
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Sourced Explanation upon completion */}
      {(showExplanation || isCompleted) && (
        <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-600/30 text-xs text-[#0A2F25] space-y-2 animate-in fade-in">
          <h4 className="font-bold flex items-center gap-1.5 text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            Curator's Learning Insight
          </h4>
          <p className="leading-relaxed text-[#0A2F25]/90">{mission.explanation}</p>
          <div className="text-[11px] text-[#B88E18] italic border-t border-teal-900/15 pt-2">
            Verified Source: {mission.sourceIds.join(', ')}
          </div>
        </div>
      )}
    </div>
  );
};
