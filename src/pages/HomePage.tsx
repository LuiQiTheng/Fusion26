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
    <div className="space-y-16 sm:space-y-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-amber-950 to-slate-900 text-white p-8 sm:p-14 border border-amber-500/20 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>FUSION 2026 • Heritage in the Loop</span>
          </div>

          <h1 className="font-serif font-extrabold text-4xl sm:text-6xl text-white tracking-tight leading-[1.15]">
            Discover the Stories Behind <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-orange-300">Malaysia</span>.
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
            Explore authentic cultural heritage across all 13 Malaysian states and 3 federal territories.
            Learn the historical narratives behind meaningful monuments and craft practical, conscious itineraries powered by explainable intelligence.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-4">
            <button
              onClick={onOpenMelakaShowcase}
              className="px-6 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold shadow-lg shadow-amber-600/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Explore Melaka Showcase
            </button>
            <button
              onClick={() => onNavigate('explore')}
              className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold border border-white/20 backdrop-blur-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-amber-400" />
              Explore States & Plan Trip
            </button>
            <button
              onClick={() => onNavigate('missions')}
              className="px-5 py-3.5 rounded-2xl text-slate-300 hover:text-white text-sm font-medium transition-colors flex items-center gap-1.5"
            >
              Cultural Missions <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Value Props pill row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-white/10 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-amber-400 shrink-0" />
              <span>16 States & Territories</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>100% Sourced Records</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Heritage-in-the-Loop AI</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Cultural Missions</span>
            </div>
          </div>
        </div>
      </section>

      {/* Nationwide State Overview Grid */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700">
              <MapPin className="w-4 h-4" /> Nationwide Coverage
            </div>
            <h2 className="font-serif font-bold text-3xl text-slate-900 mt-1">
              Explore All 13 States & 3 Federal Territories
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Select any Malaysian state to inspect its distinctive cultural themes, living crafts, and verified monuments.
            </p>
          </div>

          <button
            onClick={() => onNavigate('explore')}
            className="text-sm font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 shrink-0"
          >
            View State Catalog & Plan <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
          {states.map((st) => (
            <div
              key={st.id}
              onClick={() => {
                onSelectState(st.id);
                onNavigate('explore');
              }}
              className="group cursor-pointer rounded-2xl bg-white p-4 border border-slate-200/90 shadow-xs hover:shadow-md hover:border-amber-400/80 transition-all space-y-2"
            >
              {st.imageUrl && (
                <div className="h-28 w-full rounded-xl overflow-hidden mb-2 bg-slate-100">
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
                  <h4 className="font-serif font-bold text-base text-slate-900 group-hover:text-amber-700 transition-colors">
                    {st.name}
                  </h4>
                  <p className="text-[11px] text-slate-500">{st.capital} • {st.region}</p>
                </div>
                {st.id === 'MLK' && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                    ★
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {st.shortOverview}
              </p>

              <div className="pt-2 flex flex-wrap gap-1">
                {st.culturalThemes.slice(0, 2).map((t) => (
                  <span
                    key={t}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700"
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
