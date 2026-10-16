import React from 'react';
import {
  Sparkles,
  MapPin,
  Calendar,
  ShieldCheck,
  ChevronRight,
  Award,
  Globe,
  ArrowRight,
} from 'lucide-react';
import { StateRecord, HeritagePlace, CuratedCollection } from '../types';
import { NavTab } from '../components/layout/Navbar';

interface HomePageProps {
  states: StateRecord[];
  places?: HeritagePlace[];
  collections?: CuratedCollection[];
  onNavigate: (tab: NavTab) => void;
  onSelectPlace?: (place: HeritagePlace) => void;
  onSelectState: (stateId: string) => void;
  onOpenMelakaShowcase: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  states,
  onNavigate,
  onSelectState,
  onOpenMelakaShowcase,
}) => {
  return (
    <div className="space-y-12 sm:space-y-16">
      {/* Hero Section: Seamless Heritage Reimagined Showcase */}
      <section className="relative py-2 sm:py-4 lg:py-6 text-[#0A2F25]">
        
        {/* 1. Full-Width Ambient & Texture Layer (Spans full viewport width, unclipped) */}
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-screen pointer-events-none overflow-visible">
          {/* Full-Width Songket Diamond Grid Mesh with Radial Edge Fade */}
          <div
            className="absolute inset-0 bg-songket-mesh opacity-20"
            style={{
              maskImage: 'radial-gradient(circle at center, black 40%, transparent 80%)',
              WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 80%)',
            }}
          />

          {/* Unclipped Ambient Glowing Orbs: Soft daylight colors */}
          {/* Warm sunlight yellow glowing orb behind left column */}
          <div className="absolute top-1/2 left-[18%] -translate-y-1/2 w-[480px] h-[480px] bg-yellow-100/70 rounded-full blur-[90px] pointer-events-none" />
          {/* Soft pastel mint glow behind right 3D centerpiece */}
          <div className="absolute top-1/2 right-[15%] -translate-y-1/2 w-[480px] h-[480px] bg-emerald-200/50 rounded-full blur-[100px] pointer-events-none" />
        </div>

        {/* 2. Unified Hero Container (Matched to Global Layout Width w-full, Compact py-8 Vertical Padding) */}
        <div className="relative w-full rounded-3xl bg-white/75 backdrop-blur-md border border-teal-900/10 px-6 sm:px-8 lg:px-10 py-6 sm:py-8 shadow-xl shadow-teal-950/5">
          
          {/* Balanced Sunlight Gold Glow Orb behind left column */}
          <div
            className="absolute -top-10 -left-10 w-72 h-72 sm:w-80 sm:h-80 rounded-full bg-yellow-100/60 blur-[90px] pointer-events-none"
            aria-hidden="true"
          />

          {/* Framing: Top-Right Glassmorphic Tropical Foliage */}
          <div className="absolute -top-6 -right-6 w-52 h-52 pointer-events-none opacity-20 filter blur-[1px]">
            <svg viewBox="0 0 200 200" fill="none" className="w-full h-full">
              <path d="M100 10C70 40 50 80 50 120C50 160 80 190 100 190C120 190 150 160 150 120C150 80 130 40 100 10Z" fill="url(#palmGrad1)" fillOpacity="0.45" />
              <path d="M120 30C95 55 80 90 85 125C90 160 115 180 135 175C155 170 175 140 170 105C165 70 145 45 120 30Z" fill="url(#palmGrad2)" fillOpacity="0.35" />
              <defs>
                <linearGradient id="palmGrad1" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#087E83" />
                  <stop offset="1" stopColor="#E6F3ED" />
                </linearGradient>
                <linearGradient id="palmGrad2" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#C5A028" />
                  <stop offset="1" stopColor="#F4F9F6" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Framing: Bottom-Left Glassmorphic Tropical Foliage */}
          <div className="absolute -bottom-8 -left-8 w-52 h-52 pointer-events-none opacity-15 filter blur-[1px]">
            <svg viewBox="0 0 200 200" fill="none" className="w-full h-full">
              <path d="M10 100C40 70 80 50 120 50C160 50 190 80 190 100C190 120 160 150 120 150C80 150 40 130 10 100Z" fill="url(#monsteraGrad1)" fillOpacity="0.4" />
              <defs>
                <linearGradient id="monsteraGrad1" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#0A2F25" />
                  <stop offset="0.6" stopColor="#087E83" />
                  <stop offset="1" stopColor="#F4F9F6" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Two-Column Cohesive Layout Grid with Perfect Vertical Centering */}
          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">
            
            {/* Left Column (Content) */}
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-[#C5A028]/35 text-[#996F09] text-xs font-semibold backdrop-blur-md shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-[#B88E18]" />
                <span>FUSION 2026 • Heritage Reimagined</span>
              </div>

              <h1 className="font-serif font-extrabold text-3xl sm:text-4xl lg:text-5xl text-[#0A2F25] tracking-tight leading-[1.15]">
                Discover the Stories Behind{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B88E18] via-[#C5A028] to-[#996F09] drop-shadow-xs">
                  Malaysia
                </span>.
              </h1>

              <p className="text-sm text-[#0A2F25]/85 leading-relaxed max-w-lg font-normal">
                Explore authentic cultural heritage across all 13 Malaysian states and 3 federal territories.
                Discover living traditions, regional crafts, and architectural monuments reimagined through modern digital technology and explainable AI.
              </p>

              {/* Action CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={onOpenMelakaShowcase}
                  className="px-5 py-3 rounded-2xl bg-[#0A2F25] hover:bg-[#0E3D31] text-white text-sm font-bold border border-[#0A2F25] shadow-md shadow-teal-950/15 hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer group"
                >
                  <Sparkles className="w-4 h-4 text-[#E5C05C] group-hover:rotate-12 transition-transform" />
                  <span>Explore Melaka Showcase</span>
                </button>
                
                <button
                  onClick={() => onNavigate('explore')}
                  className="px-5 py-3 rounded-2xl bg-white hover:bg-white/80 text-[#0A2F25] text-sm font-semibold border border-teal-900/15 hover:border-[#C5A028] shadow-xs backdrop-blur-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-[#B88E18]" />
                  <span>Explore States & Plan Trip</span>
                </button>

                <button
                  onClick={() => onNavigate('missions')}
                  className="px-3.5 py-3 rounded-2xl text-[#0A2F25]/80 hover:text-[#087E83] text-sm font-semibold transition-colors flex items-center gap-1.5"
                >
                  <span>Cultural Missions</span>
                  <ChevronRight className="w-4 h-4 text-[#087E83]" />
                </button>
              </div>

              {/* Value Props row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 border-t border-teal-900/10 text-xs text-[#0A2F25]/85">
                <div className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#B88E18] shrink-0" />
                  <span>16 States & FT</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#087E83] shrink-0" />
                  <span>100% Sourced</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#B88E18] shrink-0" />
                  <span>Heritage AI</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-[#B88E18] shrink-0" />
                  <span>Missions</span>
                </div>
              </div>
            </div>

            {/* Right Column: 3D Holographic Artifact Centerpiece (Shifted Inward to Balance Composition) */}
            <div className="relative w-full flex items-center justify-center lg:justify-center">
              {/* Floating 3D Wayang Kulit Artifact Container */}
              <div className="relative w-auto max-w-sm sm:max-w-md flex items-center justify-center lg:-translate-x-8 xl:-translate-x-12">
                <img
                  src="/images/hero-wayang-isolated.png"
                  alt="Wayang Kulit Kelantan - Dual Material Shader"
                  className="w-auto h-auto max-h-[420px] sm:max-h-[450px] max-w-full object-contain filter drop-shadow-[0_15px_25px_rgba(4,47,46,0.15)] animate-artifact-float"
                />

                {/* Subtle Holographic Scanner Sweep */}
                <div
                  className="absolute inset-x-4 h-0.5 bg-gradient-to-r from-transparent via-[#087E83]/40 to-transparent shadow-[0_0_8px_#087E83] animate-hologram-sweep pointer-events-none"
                  aria-hidden="true"
                />

                {/* Sleek Floating Museum Plaque (Crisp & Proportionally Anchored to Bottom-Left of Artifact) */}
                <div className="absolute -bottom-1 -left-2 sm:bottom-2 sm:-left-3 max-w-[220px] sm:max-w-[250px] p-2.5 sm:p-3 rounded-2xl bg-white/90 backdrop-blur-xl border border-teal-900/10 shadow-xl shadow-teal-950/10 space-y-0.5 z-10">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#087E83] animate-pulse" />
                    <span className="text-[9px] uppercase font-mono tracking-widest text-[#087E83] font-semibold">
                      Dual Material Shader
                    </span>
                  </div>
                  <h3 className="font-serif font-bold text-xs sm:text-sm text-[#0A2F25] leading-tight">
                    Wayang Kulit Kelantan
                  </h3>
                  <p className="text-[10px] text-[#0A2F25]/70 leading-tight">
                    Carved buffalo leather × cyber wireframe
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Nationwide State Overview Grid */}
      <section className="space-y-6 pt-4 border-t border-teal-900/10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#996F09]">
              <MapPin className="w-4 h-4 text-[#B88E18]" /> Nationwide Coverage
            </div>
            <h2 className="font-serif font-bold text-3xl sm:text-4xl text-[#0A2F25] mt-1">
              Explore All 13 States & 3 Federal Territories
            </h2>
            <p className="text-sm text-[#0A2F25]/75 mt-1">
              Select any Malaysian state to inspect its distinctive cultural themes, living crafts, and verified monuments.
            </p>
          </div>

          <button
            onClick={() => onNavigate('explore')}
            className="text-sm font-bold text-[#0A2F25] hover:text-[#087E83] transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
          >
            View State Catalog & Plan <ArrowRight className="w-4 h-4 text-[#B88E18]" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {states.map((st) => (
            <div
              key={st.id}
              onClick={() => {
                onSelectState(st.id);
                onNavigate('explore');
              }}
              className="group cursor-pointer rounded-2xl bg-white/80 border border-teal-900/10 p-4 shadow-md shadow-teal-900/5 hover:border-[#C5A028] hover:bg-white hover:shadow-xl hover:shadow-teal-900/10 transition-all space-y-2.5 backdrop-blur-sm"
            >
              {st.imageUrl && (
                <div className="h-28 w-full rounded-xl overflow-hidden mb-2 bg-[#E6F3ED] border border-teal-900/10">
                  <img
                    src={st.imageUrl}
                    alt={st.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/places/mlk-stadthuys.jpg';
                    }}
                  />
                </div>
              )}
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-serif font-bold text-base text-[#0A2F25] group-hover:text-[#087E83] transition-colors">
                    {st.name}
                  </h4>
                  <p className="text-[11px] text-[#0A2F25]/60">{st.capital} • {st.region}</p>
                </div>
                {st.id === 'MLK' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#C5A028]/15 text-[#996F09] border border-[#C5A028]/35">
                    ★ Showcase
                  </span>
                )}
              </div>

              <p className="text-xs text-[#0A2F25]/75 line-clamp-2 leading-relaxed">
                {st.shortOverview}
              </p>

              <div className="pt-2 flex flex-wrap gap-1">
                {st.culturalThemes.slice(0, 2).map((t) => (
                  <span
                    key={t}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-[#EBF5F0] text-[#0A2F25] border border-teal-900/10"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
