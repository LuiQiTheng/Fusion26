import React from 'react';
import { ShieldCheck, Heart, Sparkles, ExternalLink, FileText } from 'lucide-react';

interface FooterProps {
  onOpenEthicsModal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenEthicsModal }) => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 pt-12 pb-8 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1 */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-xl text-white">
                Malaysia Heritage Explorer
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Track B
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              Developed for the <strong>FUSION 2026 Student Design Challenge</strong> under the theme <em>Heritage in the Loop: Designing AI That Remembers and Cares</em>.
              Connecting verified archives, physical travel constraints, and respectful cultural exploration.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-amber-400 font-medium">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" /> 100% Sourced Citations
              </span>
              <span className="flex items-center gap-1">
                <Sparkles className="w-4 h-4" /> Zero-Hallucination Guardian
              </span>
              <span>SDG 11.4 Heritage Protection</span>
            </div>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-3">
              Core Showcases
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>13 States & 3 Federal Territories Baseline</li>
              <li>Deep Melaka UNESCO Heritage Trail</li>
              <li>Vernacular Architecture on Harmony Street</li>
              <li>Mortise-and-Tenon Sultanate Joinery</li>
              <li>Interactive Cultural Missions</li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-3">
              Competition Governance
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                {onOpenEthicsModal && (
                  <button
                    onClick={onOpenEthicsModal}
                    className="text-amber-400 hover:text-amber-300 font-semibold underline flex items-center gap-1 text-xs"
                  >
                    <FileText className="w-3.5 h-3.5" /> Responsible Design Canvas (D3)
                  </button>
                )}
              </li>
              <li>AI Tool Disclosure & Human Verification</li>
              <li>Sacred Space Etiquette Protocols</li>
              <li>
                <a
                  href="https://whc.unesco.org/en/list/1223"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-slate-400 hover:text-white"
                >
                  UNESCO Registry <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.heritage.gov.my"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-slate-400 hover:text-white"
                >
                  Jabatan Warisan Negara <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>
            © 2026 Malaysia Heritage Explorer • Built for FUSION 2026 Design Challenge
          </p>
          <p className="flex items-center gap-1">
            Crafted for cultural preservation & conscious exploration <Heart className="w-3 h-3 text-red-400" />
          </p>
        </div>
      </div>
    </footer>
  );
};
