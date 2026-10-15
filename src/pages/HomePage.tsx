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
      <section className="relative py-2 sm:py-4 lg:py-6 text-[#F5F5F0]">
        
        {/* 1. Full-Width Ambient & Texture Layer (Spans full viewport width, unclipped) */}
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-screen pointer-events-none overflow-visible">
          {/* Full-Width Songket Diamond Grid Mesh with Radial Edge Fade */}
          <div
            className="absolute inset-0 bg-songket-mesh opacity-15"
            style={{
              maskImage: 'radial-gradient(circle at center, black 40%, transparent 80%)',
              WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 80%)',
            }}
          />

          {/* Unclipped Ambient Glowing Orbs that bleed into global rainforest space */}
          {/* Gold glowing orb behind left column to balance visual weight */}
          <div className="absolute top-1/2 left-[18%] -translate-y-1/2 w-[480px] h-[480px] bg-[#D4AF37]/10 rounded-full blur-[90px] pointer-events-none" />
          {/* Cyan holographic glow behind right 3D centerpiece */}
          <div className="absolute top-1/2 right-[15%] -translate-y-1/2 w-[480px] h-[480px] bg-[#00F0FF]/15 rounded-full blur-[100px] pointer-events-none" />
        </div>

        {/* 2. Unified Hero Container (Matched to Global Layout Width w-full, Compact py-8 Vertical Padding) */}
        <div className="relative w-full rounded-3xl bg-white/[0.03] backdrop-blur-md border border-white/10 px-6 sm:px-8 lg:px-10 py-6 sm:py-8 shadow-2xl">
          
          {/* Balanced Gold/Brass Glow Orb behind left column */}
          <div
            className="absolute -top-10 -left-10 w-72 h-72 sm:w-80 sm:h-80 rounded-full bg-[#D4AF37]/10 blur-[90px] pointer-events-none"
            aria-hidden="true"
          />

          {/* Framing: Top-Right Glassmorphic Tropical Foliage */}
          <div className="absolute -top-6 -right-6 w-52 h-52 pointer-events-none opacity-25 mix-blend-screen filter blur-[1px]">
            <svg viewBox="0 0 200 200" fill="none" className="w-full h-full">
              <path d="M100 10C70 40 50 80 50 120C50 160 80 190 100 190C120 190 150 160 150 120C150 80 130 40 100 10Z" fill="url(#palmGrad1)" fillOpacity="0.45" />
              <path d="M120 30C95 55 80 90 85 125C90 160 115 180 135 175C155 170 175 140 170 105C165 70 145 45 120 30Z" fill="url(#palmGrad2)" fillOpacity="0.35" />
              <defs>
                <linearGradient id="palmGrad1" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#00F0FF" />
                  <stop offset="1" stopColor="#0A1F1C" />
                </linearGradient>
                <linearGradient id="palmGrad2" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#D4AF37" />
                  <stop offset="1" stopColor="#04100E" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Framing: Bottom-Left Glassmorphic Tropical Foliage */}
          <div className="absolute -bottom-8 -left-8 w-52 h-52 pointer-events-none opacity-20 mix-blend-screen filter blur-[1px]">
            <svg viewBox="0 0 200 200" fill="none" className="w-full h-full">
              <path d="M10 100C40 70 80 50 120 50C160 50 190 80 190 100C190 120 160 150 120 150C80 150 40 130 10 100Z" fill="url(#monsteraGrad1)" fillOpacity="0.4" />
              <defs>
                <linearGradient id="monsteraGrad1" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#174B4D" />
                  <stop offset="0.6" stopColor="#087E83" />
                  <stop offset="1" stopColor="#04100E" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Two-Column Cohesive Layout Grid with Perfect Vertical Centering */}
          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-center">
            
            {/* Left Column (Content) */}
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0E2925]/90 border border-[#D4AF37]/50 text-[#E5C05C] text-xs font-semibold backdrop-blur-md shadow-[0_0_15px_rgba(212,175,55,0.18)]">
                <Sparkles className="w-3.5 h-3.5 text-[#00F0FF]" />
                <span>FUSION 2026 • Heritage Reimagined</span>
              </div>

              <h1 className="font-serif font-extrabold text-3xl sm:text-4xl lg:text-5xl text-[#F5F5F0] tracking-tight leading-[1.15]">
                Discover the Stories Behind{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFF5D0] via-[#E5C05C] to-[#C79822] drop-shadow-[0_0_24px_rgba(212,175,55,0.45)]">
                  Malaysia
                </span>.
              </h1>

              <p className="text-sm text-[#F5F5F0]/90 leading-relaxed max-w-lg font-normal">
                Explore authentic cultural heritage across all 13 Malaysian states and 3 federal territories.
                Discover living traditions, regional crafts, and architectural monuments reimagined through modern digital technology and explainable AI.
              </p>

              {/* Action CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={onOpenMelakaShowcase}
                  className="px-5 py-3 rounded-2xl bg-[#0A1F1C]/80 hover:bg-[#0E2925] text-[#F5F5F0] text-sm font-bold border border-[#D4AF37] backdrop-blur-md shadow-[0_0_18px_rgba(212,175,55,0.25)] hover:border-[#00F0FF] hover:shadow-[0_0_25px_rgba(0,240,255,0.45)] hover:text-white transition-all flex items-center gap-2 cursor-pointer group"
                >
                  <Sparkles className="w-4 h-4 text-[#D4AF37] group-hover:text-[#00F0FF] transition-colors" />
                  <span>Explore Melaka Showcase</span>
                </button>
                
                <button
                  onClick={() => onNavigate('explore')}
                  className="px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-[#F5F5F0] text-sm font-semibold border border-[#D4AF37]/40 hover:border-[#D4AF37] backdrop-blur-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-[#D4AF37]" />
                  <span>Explore States & Plan Trip</span>
                </button>

                <button
                  onClick={() => onNavigate('missions')}
                  className="px-3.5 py-3 rounded-2xl text-[#F5F5F0]/80 hover:text-[#00F0FF] text-sm font-medium transition-colors flex items-center gap-1.5"
                >
                  <span>Cultural Missions</span>
                  <ChevronRight className="w-4 h-4 text-[#00F0FF]" />
                </button>
              </div>

              {/* Value Props row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 border-t border-white/10 text-xs text-[#F5F5F0]/85">
                <div className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                  <span>16 States & FT</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#00F0FF] shrink-0" />
                  <span>100% Sourced</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                  <span>Heritage AI</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-[#E5C05C] shrink-0" />
                  <span>Missions</span>
                </div>
              </div>
            </div>

            {/* Right Column: 3D Holographic Artifact Centerpiece (Streamlined DOM, Scaled Up & Shifted Right) */}
            <div className="relative w-full flex items-center justify-center lg:justify-end">
              {/* Depth & Lighting: Soft Glowing Holographic Aura */}
              <div
                className="absolute w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-gradient-to-tr from-[#00F0FF]/25 via-[#D4AF37]/20 to-[#00F0FF]/15 blur-3xl opacity-75 pointer-events-none animate-pulse lg:translate-x-4"
                aria-hidden="true"
              />
              <div
                className="absolute w-52 h-52 sm:w-64 sm:h-64 rounded-full bg-[#00F0FF]/20 blur-3xl pointer-events-none -translate-y-2 lg:translate-x-4"
                aria-hidden="true"
              />

              {/* Floating 3D Wayang Kulit Artifact Container */}
              <div className="relative w-full max-w-[420px] sm:max-w-[460px] lg:max-w-[490px] aspect-square max-h-[400px] sm:max-h-[425px] lg:mr-4 lg:ml-auto flex items-center justify-center">
                {/* Masked 3D Image with horizontal and radial edge blending */}
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{
                    maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
                    WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
                  }}
                >
                  <img
                    src="/images/hero-wayang-hologram.jpg"
                    alt="Wayang Kulit Kelantan - Dual Material Shader"
                    className="w-full h-full object-contain max-h-[390px] sm:max-h-[420px] filter drop-shadow-[0_18px_40px_rgba(0,240,255,0.28)] animate-artifact-float"
                    style={{
                      maskImage: 'radial-gradient(ellipse 49% 49% at 50% 50%, black 42%, transparent 92%)',
                      WebkitMaskImage: 'radial-gradient(ellipse 49% 49% at 50% 50%, black 42%, transparent 92%)',
                    }}
                  />

                  {/* Subtle Holographic Scanner Sweep */}
                  <div
                    className="absolute inset-x-8 h-0.5 bg-gradient-to-r from-transparent via-[#00F0FF]/80 to-transparent shadow-[0_0_12px_#00F0FF] animate-hologram-sweep pointer-events-none"
                    aria-hidden="true"
                  />
                </div>

                {/* Sleek Floating Museum Plaque (Crisp & Proportionally Anchored to Bottom-Left of Artifact) */}
                <div className="absolute bottom-1.5 left-1.5 sm:bottom-3 sm:left-3 max-w-[220px] sm:max-w-[250px] p-2.5 sm:p-3 rounded-2xl bg-[#04100E]/90 backdrop-blur-xl border border-white/10 shadow-2xl space-y-0.5 z-10">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-pulse" />
                    <span className="text-[9px] uppercase font-mono tracking-widest text-[#00F0FF]/90 font-semibold">
                      Dual Material Shader
                    </span>
                  </div>
                  <h3 className="font-serif font-bold text-xs sm:text-sm text-[#F5F5F0] leading-tight">
                    Wayang Kulit Kelantan
                  </h3>
                  <p className="text-[10px] text-[#F5F5F0]/65 leading-tight">
                    Carved buffalo leather × cyber wireframe
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Nationwide State Overview Grid */}
      <section className="space-y-6 pt-4 border-t border-[#D4AF37]/20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#E5C05C]">
              <MapPin className="w-4 h-4 text-[#D4AF37]" /> Nationwide Coverage
            </div>
            <h2 className="font-serif font-bold text-3xl sm:text-4xl text-[#F5F5F0] mt-1">
              Explore All 13 States & 3 Federal Territories
            </h2>
            <p className="text-sm text-[#F5F5F0]/75 mt-1">
              Select any Malaysian state to inspect its distinctive cultural themes, living crafts, and verified monuments.
            </p>
          </div>

          <button
            onClick={() => onNavigate('explore')}
            className="text-sm font-bold text-[#E5C05C] hover:text-[#00F0FF] transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
          >
            View State Catalog & Plan <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
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
              className="group cursor-pointer rounded-2xl bg-[#0A1F1C]/85 border border-[#D4AF37]/25 p-4 shadow-lg hover:border-[#D4AF37] hover:bg-[#0E2925] hover:shadow-[0_4px_24px_rgba(0,240,255,0.18)] transition-all space-y-2.5 backdrop-blur-sm"
            >
              {st.imageUrl && (
                <div className="h-28 w-full rounded-xl overflow-hidden mb-2 bg-[#020706] border border-white/10">
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
                  <h4 className="font-serif font-bold text-base text-[#F5F5F0] group-hover:text-[#E5C05C] transition-colors">
                    {st.name}
                  </h4>
                  <p className="text-[11px] text-[#F5F5F0]/60">{st.capital} • {st.region}</p>
                </div>
                {st.id === 'MLK' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D4AF37]/20 text-[#E5C05C] border border-[#D4AF37]/40">
                    ★ Showcase
                  </span>
                )}
              </div>

              <p className="text-xs text-[#F5F5F0]/75 line-clamp-2 leading-relaxed">
                {st.shortOverview}
              </p>

              <div className="pt-2 flex flex-wrap gap-1">
                {st.culturalThemes.slice(0, 2).map((t) => (
                  <span
                    key={t}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-[#04100E] text-[#E5C05C] border border-[#D4AF37]/25"
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
