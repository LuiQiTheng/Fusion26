import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Sparkles,
  MapPin,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Compass,
  ArrowRight,
  Mic,
} from 'lucide-react';
import { StateRecord, HeritagePlace, CuratedCollection, Itinerary } from '../types';
import { NavTab } from '../components/layout/Navbar';
import { FilterBar } from '../components/places/FilterBar';
import { PlaceCard } from '../components/places/PlaceCard';
import { InteractiveMap } from '../components/map/InteractiveMap';
import { getDefaultTransportMode } from '../lib/routing';
import { generateItinerary, recalculateItineraryStops } from '../lib/planner';
import {
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
  TRANSLATIONS,
} from '../lib/i18n';
import { VoiceLanguageModal } from '../components/home/VoiceLanguageModal';

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
  scrollToExplore?: boolean;
  onExploreScrollComplete?: () => void;
  currentLanguage?: SupportedLanguage;
  onLanguageChange?: (lang: SupportedLanguage) => void;
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
  category: string;
  description: string;
  stateId: string;
  visualType?: 'isolated' | 'framed';
}

const SHOWCASE_ITEMS: ShowcaseArtifact[] = [
  {
    id: 'gamelan-melayu',
    name: 'Gamelan Melayu Diraja',
    subtitle: 'Royal Bronze Percussion Ensemble',
    category: 'Royal Court Music & Percussion',
    stateId: 'TRG',
    origin: 'Terengganu & Pahang',
    shaderType: 'Interactive Virtual Acoustics',
    shaderDesc: 'Resonant bronze alloy × carved Istana woodwork',
    description: 'An interactive virtual gamelan featuring gong ageng, keromong bonang kettles, and saron metallophone keys tuned to the royal Malay pentatonic scale.',
    image: '/images/cultural/perf-gamelan-melayu.jpg',
    accentColor: '#C5A028',
    visualType: 'framed',
  },
  {
    id: 'wayang-kulit',
    name: 'Wayang Kulit Kelantan',
    subtitle: 'Living Shadow Puppetry Tradition',
    category: 'Performing Arts & Puppetry',
    stateId: 'KTN',
    origin: 'Kelantan',
    shaderType: 'Dual Material Shader',
    shaderDesc: 'Carved buffalo leather × cyber wireframe',
    description: 'Master puppeteers (Tok Dalang) animate perforated buffalo-hide figures against a backlit screen to narrate ancestral moral epics.',
    image: '/images/hero-wayang-isolated.png',
    accentColor: '#087E83',
    visualType: 'isolated',
  },
  {
    id: 'mak-yong',
    name: 'Mahkota Mak Yong',
    subtitle: 'UNESCO Intangible Cultural Heritage',
    category: 'Royal Regalia & Sacred Costumes',
    stateId: 'KTN',
    origin: 'Kelantan / Terengganu',
    shaderType: 'Volumetric Gold Shader',
    shaderDesc: 'Royal filigree crown × golden songket tunic',
    description: 'Ancient royal ritual theatre crown adorned with gilded filigree, worn by the Pak Yong prima donna in sacred court dramas.',
    image: '/images/hero-mak-yong-isolated.png',
    accentColor: '#B88E18',
    visualType: 'isolated',
  },
  {
    id: 'lion-head',
    name: 'Kepala Singa Kuning',
    subtitle: 'Ceremonial Lion Dance Relic',
    category: 'Ceremonial Objects & Performing Arts',
    stateId: 'JHR',
    origin: 'Johor / Selangor / Penang',
    shaderType: 'Dynamic Fur & Particle Shader',
    shaderDesc: 'Handcrafted bamboo frame × mirror forehead',
    description: 'World-renowned Malaysian high-stilt acrobatic lion head, sculpted from pliable bamboo ribs, paper mache, and iridescent sheep wool.',
    image: '/images/hero-lion-head-isolated.png',
    accentColor: '#D97706',
    visualType: 'isolated',
  },
  {
    id: 'kuda-kepang-johor',
    name: 'Kuda Kepang Anyaman Buluh Johor',
    subtitle: 'Ceremonial Woven Bamboo Equine Art',
    category: 'Traditional Crafts & Folk Regalia',
    stateId: 'JHR',
    origin: 'Johor',
    shaderType: 'Split-Bamboo Weave & Gilt Shader',
    shaderDesc: 'Handwoven bamboo body × painted floral saddle & bells',
    description: 'Iconic flat equine figure handwoven from split bamboo and adorned with vibrant floral pigments, gilded bridles, and brass bells, central to Johor folk performances.',
    image: '/images/cultural/showcase-kuda-kepang-johor.png',
    accentColor: '#0A5C43',
    visualType: 'isolated',
  },
  {
    id: 'songket-terengganu',
    name: 'Songket Tenun Diraja Terengganu',
    subtitle: 'Living Heritage of Metallic Gold Brocade',
    category: 'Sacred Textiles & Handcrafts',
    stateId: 'TRG',
    origin: 'Terengganu',
    shaderType: 'Holographic Warp & Weft Shader',
    shaderDesc: 'Pure gold weft brocade × hand-loomed silk warp',
    description: 'Regal handwoven textile crafted on traditional floor looms, interweaving pure silk with supplementary gold threads in time-honoured geometric motifs.',
    image: '/images/cultural/showcase-songket-terengganu.png',
    accentColor: '#C5A028',
    visualType: 'isolated',
  },
  {
    id: 'perahu-lepa-sabah',
    name: 'Perahu Tradisional Lepa Bajau Semporna',
    subtitle: 'Masterpiece of Maritime Woodcarving & Regatta Heritage',
    category: 'Maritime Heritage & Traditional Watercraft',
    stateId: 'SBH',
    origin: 'Sabah',
    shaderType: 'Carved Okir Timber & Silk Sail Shader',
    shaderDesc: 'Intricate okir floral woodwork × ceremonial sambulayang sails',
    description: 'Celebrated single-masted wooden boat crafted by the Bajau Laut of Semporna, renowned for its ornate floral okir prow carvings and vibrant ceremonial sambulayang sails.',
    image: '/images/cultural/showcase-perahu-lepa-sabah.png',
    accentColor: '#087E83',
    visualType: 'isolated',
  },
  {
    id: 'terabai-iban-sarawak',
    name: 'Terabai Perisai Kayu Dayak Iban',
    subtitle: 'Sacred Ancestral War Shield of the Rainforest',
    category: 'Indigenous Weaponry & Sacred Woodcraft',
    stateId: 'SWK',
    origin: 'Sarawak',
    shaderType: 'Hardwood Grain & Spirit Totem Shader',
    shaderDesc: 'Carved pelai timber × Aso dragon-dog pigments',
    description: 'Hexagonal hardwood warrior shield intricately carved with ancestral spirit faces and swirling Aso dragon-dog motifs, representing the warrior courage of Sarawak Iban heritage.',
    image: '/images/cultural/showcase-terabai-iban-sarawak.png',
    accentColor: '#991B1B',
    visualType: 'isolated',
  },
  {
    id: 'sapeh-ngajat',
    name: 'Sapeh Dayak & Tarian Ngajat',
    subtitle: 'Borneo Boat Lute of the Rainforest',
    category: 'Musical Instruments & Performing Arts',
    stateId: 'SWK',
    origin: 'Sarawak',
    shaderType: 'Carved Cedar Acoustic Shader',
    shaderDesc: 'Hollowed adau hardwood body × brass wire melody',
    description: 'Four-stringed boat lute carved from a single block of wood, generating meditative plucked tones that accompany the graceful warrior Ngajat dance.',
    image: '/images/cultural/showcase-sapeh-sarawak.png',
    accentColor: '#0E7490',
    visualType: 'isolated',
  },
  {
    id: 'rumah-lentik-nsn',
    name: 'Rumah Bumbung Lentik Minangkabau',
    subtitle: 'Soaring Buffalo-Horn Royal Architecture',
    category: 'Traditional Architecture & Joinery',
    stateId: 'NSN',
    origin: 'Negeri Sembilan',
    shaderType: 'Mortise-and-Tenon Timber Shader',
    shaderDesc: 'Sweeping buffalo-horn gables × carved tebuk timbul floral veranda',
    description: 'Distinguished Malay-Minangkabau timber dwelling featuring dramatic soaring curved roof gables (Bumbung Lentik) and mortise-and-tenon stilt joinery, celebrating Adat Perpatih customs.',
    image: '/images/cultural/showcase-rumah-lentik-nsn.png',
    accentColor: '#047857',
    visualType: 'isolated',
  },
  {
    id: 'kebaya-nyonya',
    name: 'Kebaya Nyonya & Kasut Manik',
    subtitle: 'Peranakan Straits Chinese Splendour',
    category: 'Traditional Costumes & Embroidery',
    stateId: 'MLK',
    origin: 'Melaka',
    shaderType: 'Delicate Sulam Cutwork Shader',
    shaderDesc: 'Translucent Swiss voile × faceted glass rocaille beads',
    description: 'Iconic Straits Chinese formal attire showcasing delicate needlework cutouts (sulam tebuk) paired with hand-sewn beaded slipper embroidery.',
    image: '/images/cultural/showcase-kebaya-nyonya.png',
    accentColor: '#BE185D',
    visualType: 'isolated',
  },
  {
    id: 'khoo-kongsi-penang',
    name: 'Leong San Tong Khoo Kongsi',
    subtitle: 'Straits Chinese Clan Temple Heritage',
    category: 'Traditional Architecture & Woodcarving',
    stateId: 'PNG',
    origin: 'Pulau Pinang',
    shaderType: 'Carved Dragon Crest Shader',
    shaderDesc: 'Ceramic dragon ridges × gold-leaf timber filigree',
    description: 'Masterpiece of 19th-century Hokkien clan architecture in George Town, renowned for its sweeping dragon-crested ceramic roofs and ornate gold-leaf guild halls.',
    image: '/images/cultural/showcase-khoo-kongsi-penang.png',
    accentColor: '#2563EB',
    visualType: 'isolated',
  },
  {
    id: 'labu-sayong',
    name: 'Labu Sayong Kuala Kangsar',
    subtitle: 'Carbon-Smoked Cooling Earthenware',
    category: 'Traditional Pottery & Handicrafts',
    stateId: 'PRK',
    origin: 'Perak',
    shaderType: 'Porous Smoked Clay Shader',
    shaderDesc: 'Sayong river clay × rice husk smoke carbonization',
    description: 'Iconic calabash-shaped black clay pitcher hand-shaped on turning wheels and smoked in burning paddy husks to naturally chill drinking water.',
    image: '/images/cultural/showcase-labu-sayong.png',
    accentColor: '#475569',
    visualType: 'isolated',
  },
  {
    id: 'mek-mulung',
    name: 'Teater Tradisional Mek Mulung',
    subtitle: 'Rare Agrarian Folk Opera of Wang Tepus',
    category: 'Folk Theatre & Performing Arts',
    stateId: 'KDH',
    origin: 'Kedah',
    shaderType: 'Ritual Folk Headdress Shader',
    shaderDesc: 'Ceremonial masks × rebana chorus and serunai reed',
    description: 'Centuries-old community folk theatre unique to rural Kedah, weaving stylized slapstick comedy, classical royal court drama, and ancestral songs.',
    image: '/images/cultural/showcase-mek-mulung.png',
    accentColor: '#B45309',
    visualType: 'isolated',
  },
  {
    id: 'gamelan-pahang',
    name: 'Gamelan Melayu Diraja Pahang',
    subtitle: 'Court Metallophone Symphony of Pekan',
    category: 'Musical Instruments & Royal Court Music',
    stateId: 'PHG',
    origin: 'Pahang',
    shaderType: 'Polished Bronze Chime Shader',
    shaderDesc: 'Tuned gong ageng bells × gambang xylophone wood',
    description: 'Classical Malay gamelan ensemble nurtured within the Royal Court of Pekan, playing sophisticated melodic cycles for royal ceremonies and dances.',
    image: '/images/cultural/showcase-gamelan-pahang.png',
    accentColor: '#B88E18',
    visualType: 'isolated',
  },
  {
    id: 'terinai-kuku-emas-perlis',
    name: 'Regalia Diraja Tarian Terinai Perlis',
    subtitle: 'Gilded Fingernail Guards & Royal Barrel Drum',
    category: 'Royal Regalia & Traditional Performing Arts',
    stateId: 'PLS',
    origin: 'Perlis',
    shaderType: 'Gilded Brass Filigree & Hardwood Shader',
    shaderDesc: 'Curved Kuku Emas sheaths × laced Gendang Terinai barrel',
    description: 'Sacred royal court dance regalia of the Istana Arau in Perlis, featuring elongated curved brass fingernail guards (Kuku Emas) paired with the carved Gendang Terinai.',
    image: '/images/cultural/showcase-terinai-kuku-emas-perlis.png',
    accentColor: '#B88E18',
    visualType: 'isolated',
  },
  {
    id: 'topeng-mah-meri',
    name: 'Topeng Semangat Orang Asli Mah Meri',
    subtitle: 'Indigenous Woodcarving of Pulau Carey',
    category: 'Indigenous Woodcarving & Spiritual Relics',
    stateId: 'SGR',
    origin: 'Selangor',
    shaderType: 'Nyireh Batu Hardwood Grain Shader',
    shaderDesc: 'Tough coastal swamp timber × ancestral spirit likeness',
    description: 'Masterfully sculpted spirit masks carved from rare coastal Nyireh Batu wood by the Mah Meri people, worn during sacred mask dances to honor guardian spirits.',
    image: '/images/cultural/showcase-mah-meri-mask.png',
    accentColor: '#92400E',
    visualType: 'isolated',
  },
  {
    id: 'stesen-keretapi-kl',
    name: 'Stesen Keretapi Warisan Kuala Lumpur',
    subtitle: 'Moorish & Indo-Saracenic Railway Palace (1910)',
    category: 'Historic Architecture & National Monuments',
    stateId: 'KUL',
    origin: 'Kuala Lumpur',
    shaderType: 'Indo-Saracenic Masonry & Minaret Shader',
    shaderDesc: 'Keyhole Moorish arches × octagonal minarets & domed chhatris',
    description: 'Arthur Benison Hubback’s 1910 architectural masterpiece showcasing radiant white-and-cream Moorish arches, octagonal minaret spires, and chhatri domes in the historic heart of Kuala Lumpur.',
    image: '/images/cultural/showcase-stesen-keretapi-kl.png',
    accentColor: '#0E7490',
    visualType: 'isolated',
  },
  {
    id: 'perdana-putra-putrajaya',
    name: 'Kompleks Perdana Putra & Kubah Hijau',
    subtitle: 'Emerald-Domed Monument of the Administrative Capital',
    category: 'Contemporary Architecture & Civic Monuments',
    stateId: 'PJY',
    origin: 'Putrajaya',
    shaderType: 'Emerald Glaze Dome & Granite Colonnade Shader',
    shaderDesc: 'Mongol-Persian green central dome × Malay timber woodcarving eaves',
    description: 'Monumental civic complex overlooking the Putrajaya Lake, fusing Mogul-inspired emerald-green onion domes, classical Islamic stone colonnades, and intricate indigenous Malay timber motifs.',
    image: '/images/cultural/showcase-perdana-putra-putrajaya.png',
    accentColor: '#059669',
    visualType: 'isolated',
  },
  {
    id: 'rumah-api-kuraman-labuan',
    name: 'Rumah Api Bersejarah Pulau Kuraman',
    subtitle: '1897 Victorian Maritime Beacon of Labuan',
    category: 'Maritime Heritage & Historic Landmarks',
    stateId: 'LBN',
    origin: 'Labuan',
    shaderType: 'Victorian Masonry & Optical Fresnel Shader',
    shaderDesc: 'White masonry tower × iron gallery catwalk & glowing Fresnel lens',
    description: 'Historic 1897 British colonial maritime lighthouse situated on Pulau Kuraman, guiding maritime vessels through the strategic Brunei Bay and South China Sea channels of Labuan.',
    image: '/images/cultural/showcase-rumah-api-kuraman-labuan.png',
    accentColor: '#475569',
    visualType: 'isolated',
  },
  {
    id: 'sumazau-kadazan',
    name: 'Sompoton & Sigah Kadazan-Dusun',
    subtitle: 'Sacred Bamboo Organ & Ceremonial Headdress',
    category: 'Musical Instruments & Traditional Costumes',
    stateId: 'SBH',
    origin: 'Sabah',
    shaderType: 'Acoustic Bamboo Resonance Shader',
    shaderDesc: 'Eight slender bamboo pipes in calabash gourd × gold-embroidered Sigah',
    description: 'Authentic Momogun bamboo mouth organ and intricately folded gold-threaded ceremonial Sigah headpiece, celebrating Sabah agrarian heritage.',
    image: '/images/cultural/showcase-sompoton-kadazan.png',
    accentColor: '#D97706',
    visualType: 'isolated',
  },
];

interface SectionExpandButtonProps {
  isExpanded: boolean;
  onToggle: () => void;
  collapsedLabel?: string;
  expandedLabel?: string;
  ariaLabel?: string;
}

const SectionExpandButton: React.FC<SectionExpandButtonProps> = ({
  isExpanded,
  onToggle,
  collapsedLabel = 'Show More',
  expandedLabel = 'Show Less',
  ariaLabel,
}) => {
  return (
    <div className="flex items-center justify-center gap-2.5 sm:gap-3 pt-1 sm:pt-1.5">
      {/* Decorative Hairline Accent Left */}
      <div
        className="hidden sm:block h-px w-12 sm:w-20 bg-gradient-to-r from-transparent via-[#C5A028]/25 to-[#C5A028]/40"
        aria-hidden="true"
      />

      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-label={ariaLabel || (isExpanded ? expandedLabel : collapsedLabel)}
        className="group relative inline-flex items-center justify-center gap-2.5 px-5 sm:px-6 py-2 sm:py-2.5 min-w-[148px] sm:min-w-[156px] rounded-2xl bg-gradient-to-b from-white via-[#F9FBF9] to-[#EDF5F1] hover:from-white hover:to-[#E2EEE7] text-[#0A2F25] text-sm font-semibold border border-teal-900/15 hover:border-[#C5A028]/70 shadow-xs hover:shadow-md hover:shadow-teal-950/10 backdrop-blur-md transition-all duration-300 ease-out cursor-pointer hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#087E83] focus-visible:ring-offset-2 select-none overflow-hidden"
      >
        {/* Subtle Top Gold Highlight Shimmer Line */}
        <span
          className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#C5A028]/40 to-transparent group-hover:via-[#C5A028]/80 transition-all duration-500"
          aria-hidden="true"
        />

        {/* Subtle Gold Accent Dot */}
        <span
          className="w-1.5 h-1.5 rounded-full bg-[#C5A028] shrink-0 transition-transform duration-300 group-hover:scale-125"
          aria-hidden="true"
        />

        {/* Button Label */}
        <span className="tracking-wide">
          {isExpanded ? expandedLabel : collapsedLabel}
        </span>

        {/* Animated Rotating Downward Chevron */}
        <ChevronDown
          className={`w-4 h-4 text-[#B88E18] group-hover:text-[#996F09] shrink-0 transition-transform duration-300 ease-out ${
            isExpanded ? 'rotate-180' : 'rotate-0'
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Decorative Hairline Accent Right */}
      <div
        className="hidden sm:block h-px w-16 sm:w-24 bg-gradient-to-l from-transparent via-[#C5A028]/25 to-[#C5A028]/40"
        aria-hidden="true"
      />
    </div>
  );
};

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
  scrollToExplore = false,
  onExploreScrollComplete,
  currentLanguage: externalLanguage,
  onLanguageChange,
}) => {
  // 3D Showcase Cycling State
  const [activeArtifactIdx, setActiveArtifactIdx] = useState(0);

  // Voice-Activated Language Switcher State (Home Tab Only)
  const [internalLanguage, setInternalLanguage] = useState<SupportedLanguage>('en');
  const currentLanguage = externalLanguage !== undefined ? externalLanguage : internalLanguage;
  const handleSelectLanguage = (lang: SupportedLanguage) => {
    if (onLanguageChange) onLanguageChange(lang);
    setInternalLanguage(lang);
  };
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const t = TRANSLATIONS[currentLanguage];

  // Explore Places States (Relocated to Home Tab)
  const [activeStateFilter, setActiveStateFilter] = useState<string>(selectedStateId);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [browseViewMode, setBrowseViewMode] = useState<'grid' | 'map'>('grid');

  // Section Expansion States (Show More / Show Less)
  const [isStatesExpanded, setIsStatesExpanded] = useState(false);
  const [isPlacesExpanded, setIsPlacesExpanded] = useState(false);

  const statesSectionRef = useRef<HTMLElement>(null);
  const exploreSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollToExplore) return;

    const handle = window.setTimeout(() => {
      exploreSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });

      onExploreScrollComplete?.();
    }, 150);

    return () => window.clearTimeout(handle);
  }, [scrollToExplore, onExploreScrollComplete]);

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

  // Toggle handlers with independent smooth collapse
  const handleToggleStatesExpanded = () => {
    if (isStatesExpanded) {
      setIsStatesExpanded(false);
      statesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      setIsStatesExpanded(true);
    }
  };

  const handleTogglePlacesExpanded = () => {
    if (isPlacesExpanded) {
      setIsPlacesExpanded(false);
      exploreSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      setIsPlacesExpanded(true);
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

  // Reset places expansion to initial 6 cards whenever search or filter criteria change
  useEffect(() => {
    setIsPlacesExpanded(false);
  }, [searchTerm, activeStateFilter, selectedCategory, verifiedOnly]);

  // Visible items based on independent expansion states
  const visibleStates = useMemo(() => {
    return isStatesExpanded ? states : states.slice(0, 4);
  }, [states, isStatesExpanded]);

  const visiblePlaces = useMemo(() => {
    return isPlacesExpanded ? filteredPlaces : filteredPlaces.slice(0, 6);
  }, [filteredPlaces, isPlacesExpanded]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('ALL');
    setActiveStateFilter('ALL');
    onSelectState('ALL');
    setVerifiedOnly(false);
    setIsPlacesExpanded(false);
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
    <div className="space-y-8 sm:space-y-10">
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
                <span>{t.heroTag}</span>
              </div>

              <h1 className="font-serif font-extrabold text-3xl sm:text-4xl lg:text-5xl text-[#0A2F25] tracking-tight leading-[1.15]">
                {t.heroTitlePrefix}{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B88E18] via-[#C5A028] to-[#996F09] drop-shadow-xs">
                  {t.heroTitleHighlight}
                </span>.
              </h1>

              <p className="text-sm text-[#0A2F25]/85 leading-relaxed max-w-lg font-normal">
                {t.heroDesc}
              </p>

              {/* Minimalist Action CTAs (Cleaned & Focused) + Voice-Activated Language Switcher */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={onOpenMelakaShowcase}
                  className="px-5 py-3 rounded-2xl bg-[#0A2F25] hover:bg-[#0E3D31] text-white text-sm font-bold border border-[#0A2F25] shadow-md shadow-teal-950/15 hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer group"
                >
                  <Sparkles className="w-4 h-4 text-[#E5C05C] group-hover:rotate-12 transition-transform" />
                  <span>{t.btnMelakaShowcase}</span>
                </button>

                <button
                  onClick={() => onNavigate('explore')}
                  className="px-5 py-3 rounded-2xl bg-white hover:bg-white/80 text-[#0A2F25] text-sm font-semibold border border-teal-900/15 hover:border-[#C5A028] shadow-xs backdrop-blur-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-[#B88E18]" />
                  <span>{t.btnPlanTrip}</span>
                </button>

                {/* Voice-Activated Language Switcher (Home Tab ONLY) */}
                <button
                  type="button"
                  onClick={() => setIsVoiceModalOpen(true)}
                  className="px-4 py-3 rounded-2xl bg-white/90 hover:bg-[#EBF5F0] text-[#0A2F25] text-sm font-bold border border-teal-900/15 hover:border-[#C5A028] shadow-xs backdrop-blur-md transition-all flex items-center gap-2 cursor-pointer group"
                  title={t.voiceButtonTitle}
                >
                  <div className="w-6 h-6 rounded-xl bg-gradient-to-tr from-[#E6F3ED] to-[#D5EDE2] border border-[#087E83]/30 flex items-center justify-center text-[#087E83] group-hover:scale-110 transition-transform shadow-xs">
                    <Mic className="w-3.5 h-3.5 animate-pulse" />
                  </div>
                  <span>{t.voiceButtonLabel}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-[#087E83] border border-teal-900/10">
                    {SUPPORTED_LANGUAGES[currentLanguage].flag} {SUPPORTED_LANGUAGES[currentLanguage].sampleGreeting}
                  </span>
                </button>
              </div>
            </div>

            {/* Right Column: Interactive 3D Cultural Showcase (Multi-Item Cycling with Controls) */}
            <div className="relative w-full flex items-center justify-center lg:justify-center">
              <div className="relative w-full max-w-[340px] sm:max-w-[420px] lg:max-w-[460px] flex flex-col items-center justify-center">
                {/* 3D Artifact Display Container */}
                <div className="relative flex items-center justify-center w-full h-[390px] sm:h-[430px]">
                  {/* Glowing Ambient Backdrop Aura */}
                  <div
                    className="absolute w-64 h-64 sm:w-72 sm:h-72 rounded-full blur-3xl opacity-35 transition-all duration-700 pointer-events-none"
                    style={{ backgroundColor: currentArtifact.accentColor }}
                    aria-hidden="true"
                  />

                  {currentArtifact.visualType === 'framed' ? (
                    <div className="relative z-10 w-full max-w-[300px] sm:max-w-[340px] h-[300px] sm:h-[340px] rounded-3xl overflow-hidden border-2 border-white/80 shadow-2xl shadow-teal-950/20 backdrop-blur-sm transition-all duration-300 group">
                      <img
                        key={currentArtifact.id}
                        src={currentArtifact.image}
                        alt={currentArtifact.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/hero-wayang-isolated.png';
                        }}
                      />
                      {/* Gradient Vignette Overlay for Holographic Feel */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0A2F25]/85 via-black/10 to-transparent pointer-events-none" />
                      {/* Region Tag Pill Top-Right */}
                      <div className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-full bg-[#0A2F25]/85 backdrop-blur-md text-white text-[10px] font-bold border border-white/20 shadow-xs flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#E5C05C]" />
                        <span>{currentArtifact.origin}</span>
                      </div>
                    </div>
                  ) : (
                    <img
                      key={currentArtifact.id}
                      src={currentArtifact.image}
                      alt={currentArtifact.name}
                      className="w-auto h-auto max-h-[380px] sm:max-h-[420px] max-w-[90%] object-contain rounded-2xl filter drop-shadow-[0_15px_25px_rgba(4,47,46,0.15)] animate-artifact-float transition-all duration-300 z-10 select-none pointer-events-none"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/hero-wayang-isolated.png';
                      }}
                    />
                  )}

                  {/* Subtle Holographic Scanner Sweep */}
                  <div
                    className="absolute inset-x-4 h-0.5 bg-gradient-to-r from-transparent via-[#087E83]/40 to-transparent shadow-[0_0_8px_#087E83] animate-hologram-sweep pointer-events-none z-20"
                    aria-hidden="true"
                  />

                  {/* Previous Item Arrow Button (Consistent & Fixed Position) */}
                  <button
                    type="button"
                    onClick={handlePrevArtifact}
                    className="absolute -left-3 sm:-left-5 lg:-left-6 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/95 hover:bg-white text-[#0A2F25] border border-teal-900/15 shadow-md hover:shadow-lg backdrop-blur-md transition-all cursor-pointer z-30 group hover:scale-105 active:scale-95 focus:outline-hidden focus:ring-2 focus:ring-[#087E83]/40"
                    aria-label="Previous cultural item"
                  >
                    <ChevronLeft className="w-4 h-4 text-[#0A2F25] group-hover:-translate-x-0.5 transition-transform" />
                  </button>

                  {/* Next Item Arrow Button (Consistent & Fixed Position) */}
                  <button
                    type="button"
                    onClick={handleNextArtifact}
                    className="absolute -right-3 sm:-right-5 lg:-right-6 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/95 hover:bg-white text-[#0A2F25] border border-teal-900/15 shadow-md hover:shadow-lg backdrop-blur-md transition-all cursor-pointer z-30 group hover:scale-105 active:scale-95 focus:outline-hidden focus:ring-2 focus:ring-[#087E83]/40"
                    aria-label="Next cultural item"
                  >
                    <ChevronRight className="w-4 h-4 text-[#0A2F25] group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  {/* Sleek Floating Museum Plaque (Crisp & Proportionally Anchored to Bottom-Left) */}
                  <div className="absolute -bottom-2 left-0 sm:bottom-1 sm:-left-3 max-w-[240px] sm:max-w-[270px] p-3 rounded-2xl bg-white/95 backdrop-blur-xl border border-teal-900/10 shadow-xl shadow-teal-950/15 space-y-1 z-30 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
                          style={{ backgroundColor: currentArtifact.accentColor }}
                        />
                        <span
                          className="text-[9px] uppercase font-mono tracking-wider font-bold truncate"
                          style={{ color: currentArtifact.accentColor }}
                        >
                          {currentArtifact.category}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono font-bold text-[#0A2F25]/60 shrink-0 ml-1">
                        {activeArtifactIdx + 1}/{SHOWCASE_ITEMS.length}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-serif font-bold text-xs sm:text-sm text-[#0A2F25] leading-snug">
                        {currentArtifact.name}
                      </h3>
                      <div className="flex items-center gap-1 text-[9px] font-semibold text-[#B88E18] mt-0.5">
                        <MapPin className="w-2.5 h-2.5 shrink-0" />
                        <span>{currentArtifact.origin}</span>
                      </div>
                    </div>

                    <p className="text-[10px] text-[#0A2F25]/75 leading-tight line-clamp-2">
                      {currentArtifact.description}
                    </p>

                    <div className="pt-1 border-t border-teal-900/5 flex items-center justify-between text-[8px] font-mono text-[#0A2F25]/60">
                      <span className="truncate">{currentArtifact.shaderType}</span>
                      <button
                        type="button"
                        onClick={() => handleCardStateSelect(currentArtifact.stateId)}
                        className="text-[#087E83] hover:underline font-bold shrink-0 ml-1 cursor-pointer"
                      >
                        Explore →
                      </button>
                    </div>
                  </div>
                </div>

                {/* Showcase Item Indicators (Responsive Multi-Item Grid) */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 max-w-[260px] sm:max-w-sm z-20">
                  {SHOWCASE_ITEMS.map((item, idx) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveArtifactIdx(idx)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        idx === activeArtifactIdx
                          ? 'w-6 bg-[#087E83]'
                          : 'w-1.5 bg-[#0A2F25]/20 hover:bg-[#0A2F25]/40'
                      }`}
                      aria-label={`Show ${item.name}`}
                      title={`${item.name} (${item.origin})`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Nationwide State Overview Grid */}
      <section ref={statesSectionRef} className="space-y-4 pt-3.5 sm:pt-4 border-t border-teal-900/10 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#996F09]">
              <MapPin className="w-4 h-4 text-[#B88E18]" /> {t.nationwideCoverageTag}
            </div>
            <h2 className="font-serif font-bold text-3xl sm:text-4xl text-[#0A2F25] mt-1">
              {t.nationwideTitle}
            </h2>
            <p className="text-sm text-[#0A2F25]/75 mt-1">
              {t.nationwideSub}
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
            {t.browseAllHeritagePlaces} <ArrowRight className="w-4 h-4 text-[#B88E18]" />
          </button>
        </div>

        {/* 16 States Cards Grid (Initial 4 cards with Show More / Show Less toggle) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {visibleStates.map((st) => {
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

        {/* Show More / Show Less Toggle for States */}
        {states.length > 4 && (
          <SectionExpandButton
            isExpanded={isStatesExpanded}
            onToggle={handleToggleStatesExpanded}
            collapsedLabel="Show More"
            expandedLabel="Show Less"
            ariaLabel="Toggle full list of states and federal territories"
          />
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────
          EXPLORE PLACES SECTION (RELOCATED COMPLETELY TO HOME TAB)
          ───────────────────────────────────────────────────────────── */}
      <section ref={exploreSectionRef} className="space-y-4 sm:space-y-5 pt-4 sm:pt-5 border-t border-teal-900/10 scroll-mt-20">
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
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {visiblePlaces.map((place) => (
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

                {/* Show More / Show Less Toggle for Heritage Directory */}
                {filteredPlaces.length > 6 && (
                  <SectionExpandButton
                    isExpanded={isPlacesExpanded}
                    onToggle={handleTogglePlacesExpanded}
                    collapsedLabel="Show More"
                    expandedLabel="Show Less"
                    ariaLabel="Toggle full list of heritage places"
                  />
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Voice-Activated Language Switcher Modal (Home Tab ONLY) */}
      <VoiceLanguageModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        currentLanguage={currentLanguage}
        onSelectLanguage={handleSelectLanguage}
      />
    </div>
  );
};
