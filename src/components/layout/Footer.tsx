import React from 'react';
import { Heart, FileText } from 'lucide-react';

interface FooterProps {
  onOpenEthicsModal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenEthicsModal }) => {
  return (
    <footer className="bg-white/60 text-[#0A2F25]/70 border-t border-teal-900/10 py-5 backdrop-blur-md print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
          <span className="font-serif font-bold text-[#0A2F25] text-sm">
            Malaysia Heritage Explorer
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#C5A028]/15 text-[#996F09] border border-[#C5A028]/30">
            Track B • Heritage Reimagined
          </span>
          <span className="text-teal-900/30 hidden sm:inline">•</span>
          <span className="text-[#0A2F25]/70">
            FUSION 2026 Student Design Challenge
          </span>
        </div>

        <div className="flex items-center gap-4 text-[#0A2F25]/70">
          {onOpenEthicsModal && (
            <button
              onClick={onOpenEthicsModal}
              className="text-[#087E83] hover:text-[#0A2F25] transition-colors flex items-center gap-1 font-medium cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-[#087E83]" />
              <span>Responsible Design (D3)</span>
            </button>
          )}
          <span className="text-teal-900/30 hidden sm:inline">•</span>
          <span className="flex items-center gap-1 text-[#0A2F25]/70">
            © 2026 <Heart className="w-3 h-3 text-[#C5A028] fill-[#C5A028] inline" />
          </span>
        </div>
      </div>
    </footer>
  );
};

