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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-amber-500/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 text-white p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 text-amber-300 backdrop-blur-xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-lg text-white">
                  Responsible AI Reasoning & Grounding
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Grounded
                </span>
              </div>
              <p className="text-xs text-amber-200/80 mt-0.5">
                Target: {subjectTitle} • FUSION 2026 Heritage-in-the-Loop Transparency
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700">
          {/* Grounding Status Card */}
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-semibold text-emerald-900">
                100% Sourced Citation Verification (Zero Hallucination)
              </h4>
              <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                This response is strictly constrained to historical archives from the National Heritage Department (Jabatan Warisan Negara) and UNESCO dossiers. The AI agent is prohibited from generating speculative folklore or unverified opening schedules.
              </p>
            </div>
          </div>

          {/* Sources Cited */}
          <div>
            <h4 className="font-semibold text-slate-900 flex items-center gap-2 text-xs uppercase tracking-wider text-amber-800 mb-2">
              <BookOpen className="w-4 h-4 text-amber-600" /> Grounding Archival Sources
            </h4>
            <div className="space-y-2">
              {inspection.groundingSources.map((source, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <span className="font-medium text-slate-900">{source.title}</span>
                    <span className="text-slate-500 block sm:inline sm:ml-2">
                      — {source.publisher}
                    </span>
                  </div>
                  {source.url && (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-700 hover:text-amber-800 font-semibold underline text-[11px] shrink-0"
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
              <h4 className="font-semibold text-slate-900 flex items-center gap-2 text-xs uppercase tracking-wider text-amber-800 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" /> Cultural Care & Sacred Boundaries Enforced
              </h4>
              <ul className="space-y-1.5">
                {inspection.culturalCareGuidelines.map((guide, idx) => (
                  <li
                    key={idx}
                    className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900 flex items-start gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                    <span>{guide}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Prompt & Negative Constraints */}
          <div>
            <h4 className="font-semibold text-slate-900 flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500 mb-2">
              <FileText className="w-4 h-4 text-slate-500" /> Exact System Guardrails & Prompt Inspection
            </h4>
            <pre className="p-3.5 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] leading-relaxed whitespace-pre-wrap overflow-x-auto border border-slate-800">
              {inspection.promptUsed}
            </pre>
          </div>

          {/* Negative Constraints / What was explicitly excluded */}
          <div>
            <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider text-slate-500 mb-2">
              Excluded Assumptions (Responsible Guardrails)
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {inspection.excludedAssumptions.map((item, idx) => (
                <li
                  key={idx}
                  className="p-2.5 rounded-lg bg-slate-100 text-slate-700 text-xs flex items-center gap-2"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
