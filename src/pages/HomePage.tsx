import React, { useState, useMemo, useRef } from 'react';
import {
  Sparkles,
  MapPin,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Compass,
  ArrowRight,
} from 'lucide-react';
import { StateRecord, HeritagePlace, CuratedCollection, Itinerary } from '../types';
import { NavTab } from '../components/layout/Navbar';
import { FilterBar } from '../components/places/FilterBar';
import { PlaceCard } from '../components/places/PlaceCard';
import { InteractiveMap } from '../components/map/InteractiveMap';
import { getDefaultTransportMode } from '../lib/routing';
import { generateItinerary, recalculateItineraryStops } from '../lib/planner';

interface HomePageProps {
  states: StateRecord[];
  places?: HeritagePlace[];
  collections?: CuratedCollection[];
  onNavigate: (tab: NavTab) => void;
  onSelectPlace?: (place: HeritagePlace) => void;
  onSelectState: (stateId: string) => void;
  onOpenMelakaShowcase: () => void;
  favorites?: string[];
  onToggleFavorite?: (placeId: string) => void;
  onInspectAI?: (place: HeritagePlace) => void;
  selectedStateId?: string;
  currentItinerary?: Itinerary | null;
  onUpdateItinerary?: (itinerary: Itinerary | null) => void;
}

interface ShowcaseArtifact {
  id: string;
  name: string;
  subtitle: string;
  shaderType: string;
  shaderDesc: string;
  image: string;
  accentColor: string;
  origin: string;
}

const SHOWCASE_ITEMS: ShowcaseArtifact[] = [
  {
    id: 'wayang-kulit',
    name: 'Wayang Kulit Kelantan',
    subtitle: 'Living Shadow Puppetry Tradition',
    shaderType: 'Dual Material Shader',
    shaderDesc: 'Carved buffalo leather × cyber wireframe',
    image: '/images/hero-wayang-isolated.png',
    accentColor: '#087E83',
    origin: 'Kelantan',
  },
  {
    id: 'mak-yong',
    name: 'Mahkota Mak Yong',
    subtitle: 'UNESCO Intangible Cultural Heritage',
    shaderType: 'Volumetric Gold Shader',
    shaderDesc: 'Royal filigree crown × golden songket tunic',
    image: '/images/hero-mak-yong-isolated.png',
    accentColor: '#B88E18',
    origin: 'Kelantan / Terengganu',
  },
  {
    id: 'lion-head',
    name: 'Kepala Singa Kuning',
    subtitle: 'Ceremonial Lion Dance Relic',
    shaderType: 'Dynamic Fur & Particle Shader',
    shaderDesc: 'Handcrafted bamboo frame × mirror forehead',
    image: '/images/hero-lion-head-isolated.png',
    accentColor: '#D97706',
    origin: 'Johor / Selangor / Penang',
  },
];

export const HomePage: React.FC<HomePageProps> = ({
  states,
  places = [],
  onNavigate,
  onSelectPlace,
  onSelectState,
  onOpenMelakaShowcase,
  favorites = [],
  onToggleFavorite = () => {},
  onInspectAI = () => {},
  selectedStateId = 'ALL',
  currentItinerary,
  onUpdateItinerary,
}) => {
  // 3D Showcase Cycling State
  const [activeArtifactIdx, setActiveArtifactIdx] = useState(0);

  // Explore Places States (Relocated to Home Tab)
  const [activeStateFilter, setActiveStateFilter] = useState<string>(selectedStateId);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [browseViewMode, setBrowseViewMode] = useState<'grid' | 'map'>('grid');

  const exploreSectionRef = useRef<HTMLDivElement>(null);

  const categories = useMemo(
    () => [
      'Food',
      'Cultural Performance',
      'Cultural Festival',
      'Colonial',
      'Museum',
      'Religious',
    ],
    []
  );

  const currentArtifact = SHOWCASE_ITEMS[activeArtifactIdx];

  const handleNextArtifact = () => {
    setActiveArtifactIdx((prev) => (prev + 1) % SHOWCASE_ITEMS.length);
  };

  const handlePrevArtifact = () => {
    setActiveArtifactIdx((prev) => (prev - 1 + SHOWCASE_ITEMS.length) % SHOWCASE_ITEMS.length);
  };

  // State selection handler that scrolls smoothly down to Explore Places
  const handleCardStateSelect = (stId: string) => {
    setActiveStateFilter(stId);
    onSelectState(stId);
    if (exploreSectionRef.current) {
      exploreSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Current selected state record
  const currentStateRecord = useMemo(() => {
    if (activeStateFilter === 'ALL') return null;
    return states.find((s) => s.id === activeStateFilter) || null;
  }, [states, activeStateFilter]);

  // Filtered places
  const filteredPlaces = useMemo(() => {
    return places.filter((place) => {
      if (
        activeStateFilter !== 'ALL' &&
        place.stateId !== activeStateFilter &&
        !place.state_association?.includes(activeStateFilter)
      ) {
        return false;
      }

      // Streamlined category matching
      if (selectedCategory !== 'ALL') {
        if (selectedCategory === 'Food' || selectedCategory === 'Traditional Food') {
          const isFood =
            place.type === 'food' ||
            place.categories.includes('Food') ||
            place.categories.includes('Traditional Food') ||
            place.categories.includes('Traditional Kuih');
          if (!isFood) return false;
        } else if (selectedCategory === 'Cultural Performance') {
          const isPerf =
            place.type === 'performance' ||
            place.categories.includes('Cultural Performance');
          if (!isPerf) return false;
        } else if (selectedCategory === 'Cultural Festival') {
          const isFest =
            place.type === 'festival' ||
            place.categories.includes('Cultural Festival');
          if (!isFest) return false;
        } else {
          if (!place.categories.includes(selectedCategory)) return false;
        }
      }

      if (verifiedOnly && place.verificationStatus !== 'verified') return false;

      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const nameMatch = place.name.toLowerCase().includes(query);
        const malayMatch = place.malayName?.toLowerCase().includes(query) || false;
        const localityMatch = place.locality?.toLowerCase().includes(query) || false;
        const descMatch = place.shortDescription.toLowerCase().includes(query);
        const themeMatch = place.culturalThemes.some((t) => t.toLowerCase().includes(query));
        const communityMatch =
          place.community_association?.some((c) => c.toLowerCase().includes(query)) || false;
        if (!nameMatch && !malayMatch && !localityMatch && !descMatch && !themeMatch && !communityMatch) {
          return false;
        }
      }

      return true;
    });
  }, [places, activeStateFilter, selectedCategory, verifiedOnly, searchTerm]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('ALL');
    setActiveStateFilter('ALL');
    onSelectState('ALL');
    setVerifiedOnly(false);
  };

  const handleAddToItinerary = (place: HeritagePlace) => {
    if (!onUpdateItinerary) return;

    if (!currentItinerary || currentItinerary.destinationStateId !== place.stateId) {
      const defaultMode = getDefaultTransportMode(places, place.stateId);
      const newItin = generateItinerary(
        {
          destinationStateId: place.stateId,
          availableMinutes: 240,
          interests: place.culturalThemes,
          transportMode: defaultMode === 'mixed' ? 'walking' : defaultMode,
          budgetLevel: 'flexible',
          startingPlaceId: place.id,
        },
        places
      );
      onUpdateItinerary(newItin);
    } else {
      const alreadyIn = currentItinerary.stops.some((s) => s.placeId === place.id);
      if (!alreadyIn) {
        const rawNewStops = [
          ...currentItinerary.stops,
          {
            placeId: place.id,
            order: currentItinerary.stops.length + 1,
            visitDurationMinutes: place.visitDurationMinutes || 45,
            routeDataStatus: 'estimated' as const,
            reasonSelected: `Added by user from home explore view.`,
          },
        ];
        const { updatedStops, totalVisitMinutes, totalTravelMinutes, totalPlannedMinutes } =
          recalculateItineraryStops(rawNewStops, places, currentItinerary.transportMode);

        onUpdateItinerary({
          ...currentItinerary,
          stops: updatedStops,
          totalVisitMinutes,
          totalTravelMinutes,
          totalPlannedMinutes,
          isCustomized: true,
        });
      }
    }
    onNavigate('explore');
  };

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* Hero Section: Seamless Heritage Reimagined Showcase */}
      <section className="relative py-2 sm:py-4 lg:py-6 text-[#0A2F25]">
        {/* Full-Width Ambient & Texture Layer */}
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-screen pointer-events-none overflow-visible">
          <div
            className="absolute inset-0 bg-songket-mesh opacity-20"
            style={{
              maskImage: 'radial-gradient(circle at center, black 40%, transparent 80%)',
              WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 80%)',
            }}
          />
          <div className="absolute top-1/2 left-[18%] -translate-y-1/2 w-[480px] h-[480px] bg-yellow-100/70 rounded-full blur-[90px] pointer-events-none" />
          <div className="absolute top-1/2 right-[15%] -translate-y-1/2 w-[480px] h-[480px] bg-emerald-200/50 rounded-full blur-[100px] pointer-events-none" />
        </div>

        {/* Unified Hero Container */}
        <div className="relative w-full rounded-3xl bg-white/75 backdrop-blur-md border border-teal-900/10 px-6 sm:px-8 lg:px-10 py-6 sm:py-8 shadow-xl shadow-teal-950/5">
          {/* Balanced Sunlight Gold Glow Orb behind left column */}
          <div
            className="absolute -top-10 -left-10 w-72 h-72 sm:w-80 sm:h-80 rounded-full bg-yellow-100/60 blur-[90px] pointer-events-none"
            aria-hidden="true"
          />

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

              {/* Minimalist Action CTAs (Cleaned & Focused) */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
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
                  <span>Trip Planner</span>
                </button>
              </div>
            </div>

            {/* Right Column: Interactive 3D Cultural Showcase (Multi-Item Cycling with Controls) */}
            <div className="relative w-full flex items-center justify-center lg:justify-center">
              <div className="relative w-auto max-w-sm sm:max-w-md flex flex-col items-center justify-center lg:-translate-x-8 xl:-translate-x-12">
                {/* 3D Artifact Display Container */}
                <div className="relative flex items-center justify-center w-full min-h-[380px] sm:min-h-[420px]">
                  <img
                    key={currentArtifact.id}
                    src={currentArtifact.image}
                    alt={currentArtifact.name}
                    className="w-auto h-auto max-h-[390px] sm:max-h-[430px] max-w-full object-contain filter drop-shadow-[0_15px_25px_rgba(4,47,46,0.15)] animate-artifact-float transition-all duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/hero-wayang-isolated.png';
                    }}
                  />

                  {/* Subtle Holographic Scanner Sweep */}
                  <div
                    className="absolute inset-x-4 h-0.5 bg-gradient-to-r from-transparent via-[#087E83]/40 to-transparent shadow-[0_0_8px_#087E83] animate-hologram-sweep pointer-events-none"
                    aria-hidden="true"
                  />

                  {/* Previous Item Arrow Button */}
                  <button
                    type="button"
                    onClick={handlePrevArtifact}
                    className="absolute -left-3 sm:-left-6 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/85 hover:bg-white text-[#0A2F25] border border-teal-900/10 shadow-md hover:shadow-lg backdrop-blur-md transition-all cursor-pointer z-20 group"
                    aria-label="Previous cultural item"
                  >
                    <ChevronLeft className="w-4 h-4 text-[#0A2F25] group-hover:scale-110 transition-transform" />
                  </button>

                  {/* Next Item Arrow Button */}
                  <button
                    type="button"
                    onClick={handleNextArtifact}
                    className="absolute -right-3 sm:-right-6 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/85 hover:bg-white text-[#0A2F25] border border-teal-900/10 shadow-md hover:shadow-lg backdrop-blur-md transition-all cursor-pointer z-20 group"
                    aria-label="Next cultural item"
                  >
                    <ChevronRight className="w-4 h-4 text-[#0A2F25] group-hover:scale-110 transition-transform" />
                  </button>

                  {/* Sleek Floating Museum Plaque (Crisp & Proportionally Anchored to Bottom-Left) */}
                  <div className="absolute -bottom-1 -left-2 sm:bottom-2 sm:-left-3 max-w-[220px] sm:max-w-[250px] p-2.5 sm:p-3 rounded-2xl bg-white/90 backdrop-blur-xl border border-teal-900/10 shadow-xl shadow-teal-950/10 space-y-0.5 z-10 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-1.5 h-1.5 rounded-full animate-pulse"
                          style={{ backgroundColor: currentArtifact.accentColor }}
                        />
                        <span
                          className="text-[9px] uppercase font-mono tracking-widest font-semibold truncate"
                          style={{ color: currentArtifact.accentColor }}
                        >
                          {currentArtifact.shaderType}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono font-bold text-[#0A2F25]/50">
                        {activeArtifactIdx + 1}/{SHOWCASE_ITEMS.length}
                      </span>
                    </div>

                    <h3 className="font-serif font-bold text-xs sm:text-sm text-[#0A2F25] leading-tight">
                      {currentArtifact.name}
                    </h3>
                    <p className="text-[10px] text-[#0A2F25]/70 leading-tight">
                      {currentArtifact.shaderDesc}
                    </p>
                  </div>
                </div>

                {/* Showcase Item Indicators */}
                <div className="flex items-center gap-1.5 mt-2 z-20">
                  {SHOWCASE_ITEMS.map((item, idx) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveArtifactIdx(idx)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        idx === activeArtifactIdx
                          ? 'w-6 bg-[#087E83]'
                          : 'w-2 bg-[#0A2F25]/20 hover:bg-[#0A2F25]/40'
                      }`}
                      aria-label={`Show ${item.name}`}
                    />
                  ))}
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
              Select any Malaysian state to inspect its distinctive cultural themes, living crafts, and verified monuments below.
            </p>
          </div>

          <button
            onClick={() => {
              if (exploreSectionRef.current) {
                exploreSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            className="text-sm font-bold text-[#0A2F25] hover:text-[#087E83] transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
          >
            Browse All Heritage Places <ArrowRight className="w-4 h-4 text-[#B88E18]" />
          </button>
        </div>

        {/* 16 States Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {states.map((st) => {
            const isSelected = activeStateFilter === st.id;
            return (
              <div
                key={st.id}
                onClick={() => handleCardStateSelect(st.id)}
                className={`group cursor-pointer rounded-2xl p-4 transition-all space-y-2.5 backdrop-blur-sm ${
                  isSelected
                    ? 'bg-[#EBF5F0] border-2 border-[#087E83] shadow-lg shadow-teal-900/10 ring-2 ring-[#087E83]/20'
                    : 'bg-white/80 border border-teal-900/10 shadow-md shadow-teal-900/5 hover:border-[#C5A028] hover:bg-white hover:shadow-xl hover:shadow-teal-900/10'
                }`}
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
                    <p className="text-[11px] text-[#0A2F25]/60">
                      {st.capital} • {st.region}
                    </p>
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
            );
          })}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          EXPLORE PLACES SECTION (RELOCATED COMPLETELY TO HOME TAB)
          ───────────────────────────────────────────────────────────── */}
      <section ref={exploreSectionRef} className="space-y-6 pt-6 border-t border-teal-900/10 scroll-mt-20">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#996F09]">
            <Compass className="w-4 h-4 text-[#B88E18]" /> Heritage Directory
          </div>
          <h2 className="font-serif font-bold text-3xl sm:text-4xl text-[#0A2F25] mt-1">
            Explore Places & Cultural Traditions
          </h2>
          <p className="text-sm text-[#0A2F25]/75 mt-1">
            Search, filter by theme or region, and inspect verified monuments, living crafts, and culinary heritage.
          </p>
        </div>

        {/* State Cultural Banner (When specific state selected) */}
        {currentStateRecord && (
          <div className="p-6 rounded-3xl bg-white/90 border border-teal-900/10 text-[#0A2F25] shadow-lg shadow-teal-900/5 backdrop-blur-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full bg-[#C5A028] text-white">
                    {currentStateRecord.region}
                  </span>
                  <span className="text-xs text-[#996F09] font-medium">
                    Capital: {currentStateRecord.capital}
                  </span>
                </div>
                <h3 className="font-serif font-bold text-2xl text-[#0A2F25]">
                  {currentStateRecord.name}
                </h3>
                <p className="text-xs text-[#0A2F25]/80 max-w-3xl leading-relaxed">
                  {currentStateRecord.shortOverview}
                </p>
              </div>

              <div className="flex flex-col sm:items-end gap-2 shrink-0">
                <button
                  onClick={() => handleCardStateSelect('ALL')}
                  className="text-xs font-medium text-[#087E83] hover:text-[#0A2F25] underline cursor-pointer"
                >
                  View All States
                </button>
                <button
                  onClick={() => {
                    if (onUpdateItinerary) {
                      const newItin = generateItinerary(
                        {
                          destinationStateId: currentStateRecord.id,
                          availableMinutes: 240,
                          interests: currentStateRecord.culturalThemes,
                          transportMode: getDefaultTransportMode(places, currentStateRecord.id) === 'mixed' ? 'walking' : getDefaultTransportMode(places, currentStateRecord.id),
                          budgetLevel: 'flexible',
                        },
                        places
                      );
                      onUpdateItinerary(newItin);
                    }
                    onNavigate('explore');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0A2F25] text-white border border-[#0A2F25] hover:bg-[#0E3D31] shadow-xs transition-all cursor-pointer"
                >
                  Plan Trip for {currentStateRecord.name} →
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-teal-900/10">
              {currentStateRecord.culturalThemes.map((theme) => (
                <span
                  key={theme}
                  className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#EBF5F0] text-[#0A2F25] border border-teal-900/10 font-medium"
                >
                  {theme}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div className="w-full">
          <FilterBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedStateId={activeStateFilter}
            onStateChange={setActiveStateFilter}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            verifiedOnly={verifiedOnly}
            onVerifiedOnlyChange={setVerifiedOnly}
            states={states}
            categories={categories}
            totalResults={filteredPlaces.length}
            onResetFilters={handleResetFilters}
            viewMode={browseViewMode}
            onViewModeChange={setBrowseViewMode}
          />
        </div>

        {/* Grid or Map Display */}
        {browseViewMode === 'map' ? (
          <div className="h-[600px] w-full rounded-3xl overflow-hidden border border-teal-900/10 shadow-md">
            <InteractiveMap
              places={filteredPlaces}
              onSelectPlace={onSelectPlace || (() => {})}
              center={
                currentStateRecord && filteredPlaces[0]?.latitude
                  ? [filteredPlaces[0].latitude, filteredPlaces[0].longitude!]
                  : [3.1486, 101.6944]
              }
              zoom={activeStateFilter === 'MLK' ? 15 : activeStateFilter !== 'ALL' ? 10 : 7}
            />
          </div>
        ) : (
          <div>
            {filteredPlaces.length === 0 ? (
              <div className="p-12 text-center bg-white/80 rounded-3xl border border-teal-900/10 shadow-sm backdrop-blur-md space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#E6F3ED] text-[#B88E18] border border-teal-900/10 flex items-center justify-center mx-auto">
                  <Compass className="w-6 h-6" />
                </div>
                <h3 className="font-serif font-bold text-lg text-[#0A2F25]">
                  No matching heritage locations found
                </h3>
                <p className="text-xs text-[#0A2F25]/70 max-w-md mx-auto">
                  Try resetting filters to explore places across all 16 states & federal territories.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#0A2F25] text-white hover:bg-[#0E3D31] cursor-pointer transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPlaces.map((place) => (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    isFavorite={favorites.includes(place.id)}
                    onToggleFavorite={onToggleFavorite}
                    onSelect={onSelectPlace || (() => {})}
                    onInspectAI={onInspectAI}
                    onAddToItinerary={handleAddToItinerary}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
