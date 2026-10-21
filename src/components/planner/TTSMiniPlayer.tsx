import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Square,
  Volume2,
  VolumeX,
  X,
  Sparkles,
} from 'lucide-react';
import { Itinerary, HeritagePlace } from '../../types';

interface TTSMiniPlayerProps {
  itinerary: Itinerary;
  allPlaces: HeritagePlace[];
  isOpen: boolean;
  onClose: () => void;
  activeDay?: number;
}

export const TTSMiniPlayer: React.FC<TTSMiniPlayerProps> = ({
  itinerary,
  allPlaces,
  isOpen,
  onClose,
  activeDay = 1,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState(false);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isPlayingRef = useRef(false);
  isPlayingRef.current = isPlaying;

  // Filter stops for the active day if multi-day
  const dayStops = React.useMemo(() => {
    if (itinerary.daysStops && itinerary.daysStops[activeDay]) {
      return itinerary.daysStops[activeDay];
    }
    return itinerary.stops || [];
  }, [itinerary, activeDay]);

  const placeMap = React.useMemo(() => {
    return new Map(allPlaces.map((p) => [p.id, p]));
  }, [allPlaces]);

  // Build narration script for a specific stop
  const buildNarrationText = (index: number): string => {
    if (index >= dayStops.length) {
      return 'You have reached the end of your cultural itinerary. Have a memorable and enriching exploration of Malaysia!';
    }

    const stop = dayStops[index];
    const place = placeMap.get(stop.placeId);
    const placeName = place?.name || 'Heritage Stop';
    const locality = place?.locality ? `located in ${place.locality}` : '';
    const duration = stop.visitDurationMinutes || 45;
    const eta = stop.etaTime ? `Expected arrival at ${stop.etaTime}.` : '';

    let text = `Stop ${index + 1}: ${placeName}, ${locality}. Stay duration: ${duration} minutes. ${eta} `;

    if (place?.shortDescription) {
      text += `${place.shortDescription}. `;
    }

    if (index < dayStops.length - 1) {
      const nextStop = dayStops[index + 1];
      const nextPlace = placeMap.get(nextStop.placeId);
      const travelMins = nextStop.travelFromPreviousMinutes || 5;
      const mode = nextStop.segmentTransportMode || itinerary.transportMode || 'walking';
      const modeStr = mode === 'car' ? 'drive' : 'walk';

      text += `Next leg: a ${travelMins}-minute ${modeStr} to Stop ${index + 2}: ${nextPlace?.name || 'next site'}.`;
    }

    return text;
  };

  const speakStop = (index: number) => {
    if (typeof window === 'undefined' || !(window as any).speechSynthesis) {
      return;
    }

    window.speechSynthesis.cancel();

    if (index >= dayStops.length) {
      setIsPlaying(false);
      return;
    }

    const text = buildNarrationText(index);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speechRate;
    utterance.pitch = 1.0;

    // Pick natural English or local voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice =
      voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Enhanced'))) ||
      voices.find((v) => v.lang.startsWith('en')) ||
      voices[0];

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
    };

    utterance.onend = () => {
      if (isPlayingRef.current) {
        if (index + 1 < dayStops.length) {
          setCurrentStopIndex(index + 1);
          speakStop(index + 1);
        } else {
          setIsPlaying(false);
        }
      }
    };

    utterance.onerror = () => {
      setIsPlaying(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Start reading when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStopIndex(0);
      speakStop(0);
    } else {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [isOpen]);

  const handlePlayPause = () => {
    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    } else {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPlaying(true);
      } else {
        speakStop(currentStopIndex);
      }
    }
  };

  const handleNextStop = () => {
    if (currentStopIndex + 1 < dayStops.length) {
      const next = currentStopIndex + 1;
      setCurrentStopIndex(next);
      speakStop(next);
    }
  };

  const handlePrevStop = () => {
    if (currentStopIndex > 0) {
      const prev = currentStopIndex - 1;
      setCurrentStopIndex(prev);
      speakStop(prev);
    }
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    onClose();
  };

  const toggleRate = () => {
    const nextRate = speechRate === 1.0 ? 1.25 : speechRate === 1.25 ? 1.5 : 1.0;
    setSpeechRate(nextRate);
    if (isPlaying) {
      speakStop(currentStopIndex);
    }
  };

  if (!isOpen || dayStops.length === 0) return null;

  const currentStop = dayStops[currentStopIndex];
  const currentPlace = currentStop ? placeMap.get(currentStop.placeId) : null;

  return (
    <div
      role="region"
      aria-label="Itinerary Audio Guide Player"
      className="fixed bottom-6 right-6 z-50 w-full max-w-sm sm:max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-teal-900/15 p-4 animate-in slide-in-from-bottom duration-300 print:hidden"
    >
      {/* Top Bar: Status & Close */}
      <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-teal-900/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#087E83] text-white flex items-center justify-center shadow-xs">
            <Volume2 className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#996F09] block">
              Audio Guide • Day {activeDay}
            </span>
            <span className="text-xs font-bold text-[#0A2F25]">
              {isPlaying ? 'Reading Aloud...' : 'Audio Paused'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleRate}
            className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 hover:bg-slate-200 text-[#0A2F25] transition-colors cursor-pointer"
            title="Speech rate"
          >
            {speechRate}x
          </button>
          <button
            type="button"
            onClick={handleStop}
            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            title="Close Audio Guide"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Current Stop Info */}
      <div className="bg-[#F4F9F6] rounded-xl p-2.5 border border-teal-900/10 mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#0A2F25] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
              {currentStopIndex + 1}
            </span>
            <h4 className="text-xs font-bold text-[#0A2F25] truncate">
              {currentPlace?.name || 'Heritage Destination'}
            </h4>
          </div>
          <p className="text-[10px] text-slate-500 truncate pl-7 mt-0.5">
            {currentPlace?.locality || 'Cultural Monument'} • {currentStop?.visitDurationMinutes || 45} mins visit
          </p>
        </div>

        {/* Animated equalizer waves when playing */}
        <div className="flex items-center gap-0.5 h-4 shrink-0">
          {[60, 100, 40, 80].map((h, i) => (
            <span
              key={i}
              className={`w-0.5 rounded-full bg-[#087E83] transition-all duration-200 ${
                isPlaying ? 'animate-pulse' : 'h-1 opacity-40'
              }`}
              style={{
                height: isPlaying ? `${h}%` : '4px',
              }}
            />
          ))}
        </div>
      </div>

      {/* Playback Controls Row */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold text-slate-400">
          Stop {currentStopIndex + 1} of {dayStops.length}
        </span>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrevStop}
            disabled={currentStopIndex === 0}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-[#0A2F25] transition-colors cursor-pointer disabled:cursor-not-allowed"
            title="Previous Stop"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handlePlayPause}
            className="px-4 py-1.5 rounded-xl bg-[#0A2F25] hover:bg-[#0E3D31] text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-teal-950/20 transition-all cursor-pointer"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleNextStop}
            disabled={currentStopIndex >= dayStops.length - 1}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-[#0A2F25] transition-colors cursor-pointer disabled:cursor-not-allowed"
            title="Next Stop"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleStop}
          className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          title="Stop Audio"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
        </button>
      </div>
    </div>
  );
};
