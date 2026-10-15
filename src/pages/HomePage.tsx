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
  places: HeritagePlace[];
  collections: CuratedCollection[];
  onNavigate: (tab: NavTab) => void;
  onSelectPlace: (place: HeritagePlace) => void;
  onSelectState: (stateId: string) => void;
  onOpenMelakaShowcase: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  states,
  places,
  collections,
  onNavigate,
  onSelectPlace,
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

      {/* Featured Melaka Journey Section (Clicking opens showcase modal directly) */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700">
              <Sparkles className="w-4 h-4" /> Featured Showcase Destination
            </div>
            <h2 className="font-serif font-bold text-3xl text-slate-900 mt-1">
              Melaka: UNESCO World Heritage Historic City
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              500 years of global crossroads where Malay Sultanate origins, Portuguese bastions, Dutch civic red brick, and Baba-Nyonya living heritage converge.
            </p>
          </div>

          <button
            onClick={onOpenMelakaShowcase}
            className="text-sm font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 shrink-0"
          >
            Open Interactive Map & Sites <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Curated Journey Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {collections.map((col) => (
            <div
              key={col.id}
              onClick={onOpenMelakaShowcase}
              className="group cursor-pointer rounded-3xl bg-white border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md hover:border-amber-400/80 transition-all flex flex-col justify-between"
            >
              <div className="relative h-48 w-full bg-slate-900 overflow-hidden">
                <img
                  src={col.imageUrl}
                  alt={col.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/places/mlk-stadthuys.jpg';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                <span className="absolute bottom-3 left-3 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500 text-slate-950">
                  {col.theme}
                </span>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <h3 className="font-serif font-bold text-lg text-slate-900 group-hover:text-amber-700 transition-colors">
                    {col.title}
                  </h3>
                  <p className="text-xs font-semibold text-amber-800 italic">
                    {col.tagline}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {col.description}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
                  <span>⏱ ~{col.recommendedDurationMinutes} mins total</span>
                  <span className="font-semibold text-amber-700 flex items-center gap-1">
                    Explore Showcase →
                  </span>
                </div>
              </div>
            </div>
          ))}
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

      {/* How the Explainable Planner Works */}
      <section className="rounded-3xl bg-slate-50 border border-slate-200/90 p-8 sm:p-12 space-y-8">
        <div className="max-w-2xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700">
            <ShieldCheck className="w-4 h-4" /> Responsible Design
          </div>
          <h2 className="font-serif font-bold text-2xl sm:text-3xl text-slate-900">
            Explainable Intelligence: No Black Boxes, Zero Speculation
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            In compliance with the FUSION 2026 Responsible AI framework, our itinerary planner does not rely on opaque generative guessing. Instead, it uses transparent constraint heuristics grounded in real travel physics and verified archival data.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 space-y-2 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 font-bold flex items-center justify-center font-serif text-lg">
              1
            </div>
            <h4 className="font-bold text-base text-slate-900">Time-Budget Feasibility</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every stop strictly respects physical visit durations and walking speeds (4.5 km/h) to prevent visitor exhaustion and site overcrowding.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 space-y-2 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 font-bold flex items-center justify-center font-serif text-lg">
              2
            </div>
            <h4 className="font-bold text-base text-slate-900">Cultural Diversity Scoring</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              The engine rewards multi-faith and cross-cultural representation (e.g. balancing Islamic, Peranakan, and Colonial traditions without monocultural bias).
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 space-y-2 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 font-bold flex items-center justify-center font-serif text-lg">
              3
            </div>
            <h4 className="font-bold text-base text-slate-900">Data Status Transparency</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every route and cost is explicitly labelled as <em>Verified</em>, <em>Estimated</em>, or <em>Simulated</em>. Unknown values are never fabricated as zero.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
