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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-teal-900/15 text-[#0A2F25]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#EBF5F0] via-white to-[#E8F3EE] border-b border-teal-900/10 text-[#0A2F25] p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#EBF5F0] text-[#087E83] border border-teal-600/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-lg text-[#0A2F25]">
                  Responsible AI Reasoning & Grounding
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-600/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Grounded
                </span>
              </div>
              <p className="text-xs text-[#B88E18] mt-0.5">
                Target: {subjectTitle} • FUSION 2026 Heritage-in-the-Loop Transparency
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#0A2F25]/70 hover:text-[#0A2F25] p-1 rounded-lg hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-[#0A2F25]">
          {/* Explainable AI (XAI) Route Optimization Rationale */}
          {inspection.xaiRationale && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-[#EBF5F0] to-teal-50 border border-teal-900/15">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[#087E83] mt-0.5 shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h4 className="font-bold text-[#0A2F25] text-xs uppercase tracking-wider">
                      Explainable AI (XAI) Route Optimization Rationale
                    </h4>
                    <span className="text-[10px] font-bold text-[#087E83] bg-[#087E83]/10 px-2 py-0.5 rounded-full border border-[#087E83]/20">
                      Smart TSP Engine
                    </span>
                  </div>
                  <p className="text-xs text-[#0A2F25]/85 leading-relaxed font-medium">
                    {inspection.xaiRationale}
                  </p>
                  {inspection.xaiDetails && inspection.xaiDetails.length > 0 && (
                    <div className="mt-2.5 pt-2.5 border-t border-teal-900/10 text-xs text-[#0A2F25]/80 space-y-1.5">
                      {inspection.xaiDetails.map((detail, idx) => (
                        <p key={idx} className="flex items-start gap-1.5">
                          <span className="text-[#087E83] font-bold shrink-0">•</span>
                          <span>{detail}</span>
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Grounding Status Card */}
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-600/30 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#087E83] mt-0.5 shrink-0" />
            <div>
              <h4 className="font-semibold text-emerald-900">
                100% Sourced Citation Verification (Zero Hallucination)
              </h4>
              <p className="text-xs text-[#0A2F25]/80 mt-1 leading-relaxed">
                This response is strictly constrained to historical archives from the National Heritage Department (Jabatan Warisan Negara) and UNESCO dossiers. The AI agent is prohibited from generating speculative folklore or unverified opening schedules.
              </p>
            </div>
          </div>

          {/* Sources Cited */}
          <div>
            <h4 className="font-semibold text-[#B88E18] flex items-center gap-2 text-xs uppercase tracking-wider mb-2">
              <BookOpen className="w-4 h-4 text-[#C5A028]" /> Grounding Archival Sources
            </h4>
            <div className="space-y-2">
              {inspection.groundingSources.map((source, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-[#EBF5F0] border border-teal-900/15 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <span className="font-medium text-[#0A2F25]">{source.title}</span>
                    <span className="text-[#0A2F25]/60 block sm:inline sm:ml-2">
                      — {source.publisher}
                    </span>
                  </div>
                  {source.url && (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#087E83] hover:underline font-semibold text-[11px] shrink-0 cursor-pointer"
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
              <h4 className="font-semibold text-[#B88E18] flex items-center gap-2 text-xs uppercase tracking-wider mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" /> Cultural Care & Sacred Boundaries Enforced
              </h4>
              <ul className="space-y-1.5">
                {inspection.culturalCareGuidelines.map((guide, idx) => (
                  <li
                    key={idx}
                    className="p-2.5 rounded-lg bg-amber-50 border border-amber-300 text-xs text-amber-900 flex items-start gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C5A028] mt-1.5 shrink-0" />
                    <span>{guide}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Prompt & Negative Constraints */}
          <div>
            <h4 className="font-semibold text-[#B88E18] flex items-center gap-2 text-xs uppercase tracking-wider mb-2">
              <FileText className="w-4 h-4 text-[#C5A028]" /> Exact System Guardrails & Prompt Inspection
            </h4>
            <pre className="p-3.5 rounded-xl bg-[#0A2F25] text-emerald-200 font-mono text-[11px] leading-relaxed whitespace-pre-wrap overflow-x-auto border border-teal-900/20">
              {inspection.promptUsed}
            </pre>
          </div>

          {/* Negative Constraints / What was explicitly excluded */}
          <div>
            <h4 className="font-semibold text-[#B88E18] text-xs uppercase tracking-wider mb-2">
              Excluded Assumptions (Responsible Guardrails)
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {inspection.excludedAssumptions.map((item, idx) => (
                <li
                  key={idx}
                  className="p-2.5 rounded-lg bg-[#EBF5F0] border border-teal-900/15 text-[#0A2F25]/80 text-xs flex items-center gap-2"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#EBF5F0] border-t border-teal-900/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-bold rounded-xl bg-[#C5A028] text-white hover:bg-[#B88E18] transition-colors shadow-xs cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
