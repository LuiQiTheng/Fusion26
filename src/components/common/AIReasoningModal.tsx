import React from 'react';
import { X, Sparkles, ShieldCheck, CheckCircle2, AlertTriangle, BookOpen, FileText } from 'lucide-react';
import { AIReasoningInspection } from '../../types';

interface AIReasoningModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspection: AIReasoningInspection | null;
  subjectTitle: string;
}

export const AIReasoningModal: React.FC<AIReasoningModalProps> = ({
  isOpen,
  onClose,
  inspection,
  subjectTitle,
}) => {
  if (!isOpen || !inspection) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-[#0A1F1C] rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-[#D4AF37]/35 text-[#F5F5F0]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#04100E] via-[#0A1F1C] to-[#0E2925] border-b border-[#D4AF37]/25 text-[#F5F5F0] p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#0E2925] text-[#00F0FF] border border-cyan-400/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-lg text-[#F5F5F0]">
                  Responsible AI Reasoning & Grounding
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Grounded
                </span>
              </div>
              <p className="text-xs text-[#E5C05C]/80 mt-0.5">
                Target: {subjectTitle} • FUSION 2026 Heritage-in-the-Loop Transparency
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#F5F5F0]/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-[#F5F5F0]">
          {/* Grounding Status Card */}
          <div className="p-4 rounded-xl bg-[#0E2925] border border-emerald-500/40 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#00F0FF] mt-0.5 shrink-0" />
            <div>
              <h4 className="font-semibold text-emerald-300">
                100% Sourced Citation Verification (Zero Hallucination)
              </h4>
              <p className="text-xs text-[#F5F5F0]/80 mt-1 leading-relaxed">
                This response is strictly constrained to historical archives from the National Heritage Department (Jabatan Warisan Negara) and UNESCO dossiers. The AI agent is prohibited from generating speculative folklore or unverified opening schedules.
              </p>
            </div>
          </div>

          {/* Sources Cited */}
          <div>
            <h4 className="font-semibold text-[#E5C05C] flex items-center gap-2 text-xs uppercase tracking-wider mb-2">
              <BookOpen className="w-4 h-4 text-[#D4AF37]" /> Grounding Archival Sources
            </h4>
            <div className="space-y-2">
              {inspection.groundingSources.map((source, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-[#04100E] border border-[#D4AF37]/20 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <span className="font-medium text-[#F5F5F0]">{source.title}</span>
                    <span className="text-[#F5F5F0]/60 block sm:inline sm:ml-2">
                      — {source.publisher}
                    </span>
                  </div>
                  {source.url && (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#00F0FF] hover:underline font-semibold text-[11px] shrink-0 cursor-pointer"
                    >
                      Verify Document →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Cultural Care Guidelines Triggered */}
          {inspection.culturalCareGuidelines.length > 0 && (
            <div>
              <h4 className="font-semibold text-[#E5C05C] flex items-center gap-2 text-xs uppercase tracking-wider mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Cultural Care & Sacred Boundaries Enforced
              </h4>
              <ul className="space-y-1.5">
                {inspection.culturalCareGuidelines.map((guide, idx) => (
                  <li
                    key={idx}
                    className="p-2.5 rounded-lg bg-[#04100E] border border-amber-500/40 text-xs text-amber-200 flex items-start gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] mt-1.5 shrink-0" />
                    <span>{guide}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Prompt & Negative Constraints */}
          <div>
            <h4 className="font-semibold text-[#E5C05C] flex items-center gap-2 text-xs uppercase tracking-wider mb-2">
              <FileText className="w-4 h-4 text-[#D4AF37]" /> Exact System Guardrails & Prompt Inspection
            </h4>
            <pre className="p-3.5 rounded-xl bg-[#04100E] text-cyan-300 font-mono text-[11px] leading-relaxed whitespace-pre-wrap overflow-x-auto border border-[#D4AF37]/30">
              {inspection.promptUsed}
            </pre>
          </div>

          {/* Negative Constraints / What was explicitly excluded */}
          <div>
            <h4 className="font-semibold text-[#E5C05C] text-xs uppercase tracking-wider mb-2">
              Excluded Assumptions (Responsible Guardrails)
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {inspection.excludedAssumptions.map((item, idx) => (
                <li
                  key={idx}
                  className="p-2.5 rounded-lg bg-[#04100E] border border-[#D4AF37]/20 text-[#F5F5F0]/80 text-xs flex items-center gap-2"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#04100E] border-t border-[#D4AF37]/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-bold rounded-xl bg-[#D4AF37] text-[#04100E] hover:bg-[#E5C05C] transition-colors shadow-xs cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
