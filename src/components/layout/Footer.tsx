import React from 'react';
import { Heart, FileText } from 'lucide-react';

interface FooterProps {
  onOpenEthicsModal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenEthicsModal }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-5 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
          <span className="font-serif font-bold text-white text-sm">
            Malaysia Heritage Explorer
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Track B
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
              className="text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1 font-medium cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Responsible Design (D3)</span>
            </button>
          )}
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="flex items-center gap-1 text-slate-400">
            © 2026 <Heart className="w-3 h-3 text-amber-500 fill-amber-500 inline" />
          </span>
        </div>
      </div>
    </footer>
  );
};

