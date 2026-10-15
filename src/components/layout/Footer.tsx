import React from 'react';
import { Heart, FileText } from 'lucide-react';

interface FooterProps {
  onOpenEthicsModal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenEthicsModal }) => {
  return (
    <footer className="bg-[#04100E] text-slate-400 border-t border-[#D4AF37]/20 py-5 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
          <span className="font-serif font-bold text-[#F5F5F0] text-sm">
            Malaysia Heritage Explorer
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#E5C05C] border border-[#D4AF37]/35">
            Track B • Heritage Reimagined
          </span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="text-slate-400">
            FUSION 2026 Student Design Challenge
          </span>
        </div>

        <div className="flex items-center gap-4 text-slate-400">
          {onOpenEthicsModal && (
            <button
              onClick={onOpenEthicsModal}
              className="text-[#E5C05C] hover:text-[#00F0FF] transition-colors flex items-center gap-1 font-medium cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span>Responsible Design (D3)</span>
            </button>
          )}
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="flex items-center gap-1 text-slate-400">
            © 2026 <Heart className="w-3 h-3 text-[#D4AF37] fill-[#D4AF37] inline" />
          </span>
        </div>
      </div>
    </footer>
  );
};

