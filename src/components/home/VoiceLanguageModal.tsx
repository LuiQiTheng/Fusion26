import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Mic, MicOff, Volume2, Sparkles, X, Check, Globe } from 'lucide-react';
import {
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
  detectLanguageFromGreeting,
} from '../../lib/i18n';

interface VoiceLanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage: SupportedLanguage;
  onSelectLanguage: (lang: SupportedLanguage) => void;
}

export const VoiceLanguageModal: React.FC<VoiceLanguageModalProps> = ({
  isOpen,
  onClose,
  currentLanguage,
  onSelectLanguage,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [detectedText, setDetectedText] = useState<string>('');
  const [detectedLang, setDetectedLang] = useState<SupportedLanguage | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);

  const recognitionRef = useRef<any>(null);

  // Initialize or stop speech recognition
  useEffect(() => {
    if (!isOpen) {
      setIsListening(false);
      setDetectedText('');
      setDetectedLang(null);
      setFeedbackMessage('');
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      return;
    }

    // Auto-start listening on open
    startListening();

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, [isOpen]);

  const startListening = () => {
    setIsListening(true);
    setFeedbackMessage('Listening... Speak a greeting in any language:');

    // Attempt native browser Web Speech API
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setHasMicPermission(true);
        };

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((res: any) => res[0].transcript)
            .join(' ');
          setDetectedText(transcript);

          const matched = detectLanguageFromGreeting(transcript);
          if (matched) {
            handleGreetingMatched(matched.lang, matched.matchedPhrase);
          }
        };

        recognition.onerror = () => {
          setFeedbackMessage('Say or choose a greeting below to switch language:');
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch {
        setFeedbackMessage('Say or choose a greeting below to switch language:');
      }
    } else {
      setFeedbackMessage('Say or choose a greeting below to switch language:');
    }
  };

  const stopListening = () => {
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
  };

  const handleGreetingMatched = (lang: SupportedLanguage, phrase: string) => {
    stopListening();
    setDetectedLang(lang);
    setDetectedText(phrase);
    const meta = SUPPORTED_LANGUAGES[lang];
    setFeedbackMessage(
      `✨ Detected greeting "${phrase}"! Switching system language to ${meta.nativeName}...`
    );

    // Apply language after brief delightful animation
    setTimeout(() => {
      onSelectLanguage(lang);
      onClose();
    }, 1100);
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Voice-Activated Language Switcher"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-teal-900/15 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-[#0A2F25] via-[#0E3D31] to-[#0A2F25] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E5C05C]/20 border border-[#E5C05C]/40 flex items-center justify-center text-[#E5C05C]">
              <Mic className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-base tracking-tight text-white">
                  Voice Language Switcher
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#E5C05C] text-[#0A2F25]">
                  Live Voice UI
                </span>
              </div>
              <p className="text-xs text-emerald-100/70">
                Speak a greeting to switch the platform language
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close voice modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Center Listening Simulation Area */}
        <div className="p-6 text-center space-y-5 bg-radial from-emerald-50/60 to-white">
          {/* Animated Soundwave & Mic Visualizer */}
          <div className="relative flex flex-col items-center justify-center py-4">
            {/* Pulsing Concentric Sound Waves */}
            <div className="relative flex items-center justify-center">
              {isListening && (
                <>
                  <span className="absolute w-36 h-36 rounded-full bg-teal-400/20 animate-ping duration-1000" />
                  <span className="absolute w-28 h-28 rounded-full bg-[#C5A028]/20 animate-pulse duration-700" />
                </>
              )}
              <button
                type="button"
                onClick={() => (isListening ? stopListening() : startListening())}
                className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-xl cursor-pointer ${
                  isListening
                    ? 'bg-gradient-to-tr from-[#0A2F25] to-[#087E83] text-[#E5C05C] ring-4 ring-[#E5C05C]/40 scale-105'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
                title={isListening ? 'Click to pause listening' : 'Click to start listening'}
              >
                {isListening ? (
                  <Mic className="w-8 h-8 animate-bounce" />
                ) : (
                  <MicOff className="w-8 h-8" />
                )}
              </button>
            </div>

            {/* Sound Wave Bars */}
            <div className="flex items-center gap-1.5 h-8 mt-5">
              {[40, 70, 95, 60, 85, 100, 75, 45, 90, 60, 30].map((h, i) => (
                <span
                  key={i}
                  className={`w-1 rounded-full transition-all duration-300 ${
                    isListening
                      ? 'bg-gradient-to-t from-[#087E83] to-[#C5A028]'
                      : 'bg-slate-200 h-2'
                  }`}
                  style={{
                    height: isListening ? `${Math.max(8, (h * (0.5 + Math.random() * 0.5)))}%` : '6px',
                  }}
                />
              ))}
            </div>

            <p className="mt-3 text-xs font-semibold text-[#0A2F25]">
              {feedbackMessage}
            </p>

            {detectedText && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold animate-in fade-in">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Heard: "{detectedText}"</span>
              </div>
            )}
          </div>

          {/* Quick Voice Simulation Triggers */}
          <div className="pt-2 border-t border-teal-900/10 text-left">
            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              Or Click a Greeting to Simulate Voice:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Chinese */}
              <button
                type="button"
                onClick={() => handleGreetingMatched('zh', '你好')}
                className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  currentLanguage === 'zh'
                    ? 'border-[#087E83] bg-[#EBF5F0] ring-1 ring-[#087E83]'
                    : 'border-teal-900/10 hover:border-[#C5A028] bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🇨🇳</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-extrabold text-[#0A2F25]">"你好"</span>
                      <span className="text-[10px] text-slate-500 font-medium">(Nǐ hǎo)</span>
                    </div>
                    <span className="text-[10px] text-[#087E83] font-semibold block">
                      Chinese (Mandarin)
                    </span>
                  </div>
                </div>
                {currentLanguage === 'zh' && (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
              </button>

              {/* Malay */}
              <button
                type="button"
                onClick={() => handleGreetingMatched('ms', 'Apa khabar')}
                className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  currentLanguage === 'ms'
                    ? 'border-[#087E83] bg-[#EBF5F0] ring-1 ring-[#087E83]'
                    : 'border-teal-900/10 hover:border-[#C5A028] bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🇲🇾</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-extrabold text-[#0A2F25]">"Apa khabar"</span>
                      <span className="text-[10px] text-slate-500 font-medium">/ "Hai"</span>
                    </div>
                    <span className="text-[10px] text-[#087E83] font-semibold block">
                      Bahasa Melayu
                    </span>
                  </div>
                </div>
                {currentLanguage === 'ms' && (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
              </button>

              {/* French */}
              <button
                type="button"
                onClick={() => handleGreetingMatched('fr', 'Bonjour')}
                className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  currentLanguage === 'fr'
                    ? 'border-[#087E83] bg-[#EBF5F0] ring-1 ring-[#087E83]'
                    : 'border-teal-900/10 hover:border-[#C5A028] bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🇫🇷</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-extrabold text-[#0A2F25]">"Bonjour"</span>
                    </div>
                    <span className="text-[10px] text-[#087E83] font-semibold block">
                      French (Français)
                    </span>
                  </div>
                </div>
                {currentLanguage === 'fr' && (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
              </button>

              {/* Spanish Easter Egg */}
              <button
                type="button"
                onClick={() => handleGreetingMatched('es', 'Hola')}
                className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  currentLanguage === 'es'
                    ? 'border-[#087E83] bg-[#EBF5F0] ring-1 ring-[#087E83]'
                    : 'border-teal-900/10 hover:border-[#C5A028] bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🇪🇸</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-extrabold text-[#0A2F25]">"Hola"</span>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 rounded-full">
                        Easter Egg 🎉
                      </span>
                    </div>
                    <span className="text-[10px] text-[#087E83] font-semibold block">
                      Spanish (Español)
                    </span>
                  </div>
                </div>
                {currentLanguage === 'es' && (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
              </button>

              {/* English Default */}
              <button
                type="button"
                onClick={() => handleGreetingMatched('en', 'Hello')}
                className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer sm:col-span-2 ${
                  currentLanguage === 'en'
                    ? 'border-[#087E83] bg-[#EBF5F0] ring-1 ring-[#087E83]'
                    : 'border-teal-900/10 hover:border-[#C5A028] bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🇬🇧</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-extrabold text-[#0A2F25]">"Hello"</span>
                      <span className="text-[10px] text-slate-500 font-medium">(Default)</span>
                    </div>
                    <span className="text-[10px] text-[#087E83] font-semibold block">
                      English (International)
                    </span>
                  </div>
                </div>
                {currentLanguage === 'en' && (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-teal-900/10 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-[#087E83]" />
            <span>Active: <strong>{SUPPORTED_LANGUAGES[currentLanguage].name}</strong></span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-bold text-[#0A2F25] hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
