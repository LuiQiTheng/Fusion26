export type SupportedLanguage = 'en' | 'zh' | 'ms' | 'fr' | 'es';

export interface LanguageMeta {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  sampleGreeting: string;
}

export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, LanguageMeta> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    sampleGreeting: 'Hello',
  },
  zh: {
    code: 'zh',
    name: 'Chinese (Mandarin)',
    nativeName: '中文 (普通话)',
    flag: '🇨🇳',
    sampleGreeting: '你好',
  },
  ms: {
    code: 'ms',
    name: 'Malay',
    nativeName: 'Bahasa Melayu',
    flag: '🇲🇾',
    sampleGreeting: 'Apa khabar',
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    sampleGreeting: 'Bonjour',
  },
  es: {
    code: 'es',
    name: 'Spanish (Easter Egg)',
    nativeName: 'Español',
    flag: '🇪🇸',
    sampleGreeting: 'Hola',
  },
};

export const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    // Nav
    navHome: 'Home',
    navPlanner: 'Trip Planner',
    navMissions: 'Missions',
    navProfile: 'Profile',

    // Hero
    heroTag: 'FUSION 2026 • Heritage Reimagined',
    heroTitlePrefix: 'Discover the Stories Behind ',
    heroTitleHighlight: 'Malaysia',
    heroDesc:
      'Explore authentic cultural heritage across all 13 Malaysian states and 3 federal territories. Discover living traditions, regional crafts, and architectural monuments reimagined through modern digital technology and explainable AI.',
    btnMelakaShowcase: 'Explore Melaka Showcase',
    btnPlanTrip: 'Plan Cultural Trip',
    voiceButtonTitle: 'Find your language • Voice Switcher',
    voiceButtonLabel: 'Find your language',

    // Nationwide Coverage Section
    nationwideCoverageTag: 'Nationwide Coverage',
    nationwideTitle: 'Explore All 13 States & 3 Federal Territories',
    nationwideSub: 'Select any Malaysian state to inspect its distinctive cultural themes, living crafts, and verified monuments below.',
    browseAllHeritagePlaces: 'Browse All Heritage Places',

    // Explore Places
    exploreHeritageSection: 'Explore Malaysia Heritage Places',
    exploreHeritageSub: 'Curated cultural sites, intangible living traditions, and living monuments across all Malaysian states.',
    searchPlaceholder: 'Search by site name, cultural tradition, or town...',
    filterAllStates: 'All States & Territories',
    filterAllCategories: 'All Heritage Categories',
    verifiedOnly: 'Verified Records Only',
    viewGrid: 'Grid',
    viewMap: 'Interactive Map',
    statesSectionTitle: 'Explore Malaysian States & Territories',
    statesSectionSub: '13 States and 3 Federal Territories across Peninsular and Malaysian Borneo',
    showMore: 'Show More',
    showLess: 'Show Less',
    livingHeritageShowcase: 'Living Heritage Showcase',
    previousArtifact: 'Previous Artifact',
    nextArtifact: 'Next Artifact',
    activeLangBadge: 'Language: English',
  },
  zh: {
    // Nav
    navHome: '首页',
    navPlanner: '行程规划',
    navMissions: '文化任务',
    navProfile: '个人档案',

    // Hero
    heroTag: 'FUSION 2026 • 文化遗产重塑',
    heroTitlePrefix: '探索蕴藏在深处的魅力 ',
    heroTitleHighlight: '马来西亚',
    heroDesc:
      '探索马来西亚13个州及3个联邦直辖区的地道文化遗产。通过现代数字科技与可解释性AI，重塑非物质文化遗产、传统工艺与历史建筑的永恒魅力。',
    btnMelakaShowcase: '探索马六甲文化特展',
    btnPlanTrip: '规划文化之旅',
    voiceButtonTitle: '寻找您的语言 • 语音切换',
    voiceButtonLabel: 'Find your language',

    // Nationwide Coverage Section
    nationwideCoverageTag: '全国文化覆盖',
    nationwideTitle: '探索全部13个州与3个联邦直辖区',
    nationwideSub: '选择任意马来西亚州属，浏览其独特的文化主题、传统手工艺与核验文物古迹。',
    browseAllHeritagePlaces: '浏览所有文化古迹',

    // Explore Places
    exploreHeritageSection: '探索马来西亚文化古迹与遗址',
    exploreHeritageSub: '汇聚马来西亚各州的精选文化遗迹、非物质生活传统与历史纪念碑。',
    searchPlaceholder: '按景点名称、文化传统或城镇搜索...',
    filterAllStates: '所有州属与联邦直辖区',
    filterAllCategories: '所有文化类别',
    verifiedOnly: '仅显示官方核验',
    viewGrid: '网格视图',
    viewMap: '交互地图',
    statesSectionTitle: '探索马来西亚各州与领地',
    statesSectionSub: '横跨马来半岛与东马婆罗洲的13个州和3个联邦直辖区',
    showMore: '展开更多',
    showLess: '收起列表',
    livingHeritageShowcase: '活态文化遗产特展',
    previousArtifact: '上一个文物',
    nextArtifact: '下一个文物',
    activeLangBadge: '系统语言：中文 (普通话)',
  },
  ms: {
    // Nav
    navHome: 'Laman Utama',
    navPlanner: 'Perancang Perjalanan',
    navMissions: 'Misi Budaya',
    navProfile: 'Profil',

    // Hero
    heroTag: 'FUSION 2026 • Warisan Diberi Nafas Baharu',
    heroTitlePrefix: 'Terokai Kisah-Kisah Di Sebalik ',
    heroTitleHighlight: 'Malaysia',
    heroDesc:
      'Menjelajahi warisan budaya autentik merentasi 13 buah negeri dan 3 wilayah persekutuan Malaysia. Saksikan tradisi hidup, kraf serantau, dan monumen seni bina yang dihidupkan semula melalui teknologi digital dan AI pintar.',
    btnMelakaShowcase: 'Teroka Pameran Melaka',
    btnPlanTrip: 'Rancang Perjalanan Warisan',
    voiceButtonTitle: 'Cari bahasa anda • Penukar Suara',
    voiceButtonLabel: 'Find your language',

    // Nationwide Coverage Section
    nationwideCoverageTag: 'Liputan Seluruh Negara',
    nationwideTitle: 'Terokai Kesemua 13 Buah Negeri & 3 Wilayah Persekutuan',
    nationwideSub: 'Pilih mana-mana negeri Malaysia untuk melihat tema budaya khas, kraf hidup, dan monumen warisan yang disahkan di bawah.',
    browseAllHeritagePlaces: 'Lihat Semua Tapak Warisan',

    // Explore Places
    exploreHeritageSection: 'Terokai Tapak Warisan Malaysia',
    exploreHeritageSub: 'Tapak budaya terpilih, tradisi hidup tidak ketara, dan monumen bersejarah di seluruh negeri Malaysia.',
    searchPlaceholder: 'Cari mengikut nama tapak, tradisi budaya, atau bandar...',
    filterAllStates: 'Semua Negeri & Wilayah',
    filterAllCategories: 'Semua Kategori Warisan',
    verifiedOnly: 'Rekod Disahkan Sahaja',
    viewGrid: 'Grid',
    viewMap: 'Peta Interaktif',
    statesSectionTitle: 'Terokai Negeri-Negeri di Malaysia',
    statesSectionSub: '13 Negeri dan 3 Wilayah Persekutuan merentasi Semenanjung dan Borneo Malaysia',
    showMore: 'Papar Lagi',
    showLess: 'Papar Sedikit',
    livingHeritageShowcase: 'Pameran Warisan Hidup',
    previousArtifact: 'Artifak Sebelum',
    nextArtifact: 'Artifak Seterusnya',
    activeLangBadge: 'Bahasa Sistem: Bahasa Melayu',
  },
  fr: {
    // Nav
    navHome: 'Accueil',
    navPlanner: 'Planificateur',
    navMissions: 'Missions',
    navProfile: 'Profil',

    // Hero
    heroTag: 'FUSION 2026 • Le Patrimoine Réinventé',
    heroTitlePrefix: 'Découvrez les Récits Fascinants de la ',
    heroTitleHighlight: 'Malaisie',
    heroDesc:
      'Explorez le patrimoine culturel authentique à travers les 13 États et 3 territoires fédéraux de Malaisie. Découvrez les traditions vivantes, l’artisanat d’art et les monuments sublimés par le numérique et l’intelligence artificielle.',
    btnMelakaShowcase: 'Découvrir Malacca',
    btnPlanTrip: 'Planifier un Itinéraire',
    voiceButtonTitle: 'Trouver votre langue • Sélecteur Vocal',
    voiceButtonLabel: 'Find your language',

    // Nationwide Coverage Section
    nationwideCoverageTag: 'Couverture Nationale',
    nationwideTitle: 'Explorer les 13 États et 3 Territoires Fédéraux',
    nationwideSub: 'Sélectionnez un État malaisien pour explorer ses thèmes culturels, son artisanat vivant et ses monuments répertoriés ci-dessous.',
    browseAllHeritagePlaces: 'Parcourir Tous les Lieux du Patrimoine',

    // Explore Places
    exploreHeritageSection: 'Explorer les Trésors Culturels de Malaisie',
    exploreHeritageSub: 'Sites patrimoniaux d’exception, traditions vivantes immatérielles et monuments historiques à travers toute la Malaisie.',
    searchPlaceholder: 'Rechercher par lieu, tradition culturelle ou ville...',
    filterAllStates: 'Tous les États & Territoires',
    filterAllCategories: 'Toutes les Catégories',
    verifiedOnly: 'Données Vérifiées Uniquement',
    viewGrid: 'Grille',
    viewMap: 'Carte Interactive',
    statesSectionTitle: 'Explorer les États et Territoires de Malaisie',
    statesSectionSub: '13 États et 3 Territoires fédéraux entre la péninsule et Bornéo',
    showMore: 'Voir Plus',
    showLess: 'Voir Moins',
    livingHeritageShowcase: 'Vitrines du Patrimoine Vivant',
    previousArtifact: 'Artefact Précédent',
    nextArtifact: 'Artefact Suivant',
    activeLangBadge: 'Langue: Français',
  },
  es: {
    // Nav
    navHome: 'Inicio',
    navPlanner: 'Planificador',
    navMissions: 'Misiones',
    navProfile: 'Perfil',

    // Hero
    heroTag: 'FUSION 2026 • Patrimonio Reinventado',
    heroTitlePrefix: 'Descubre las Historias Detrás de ',
    heroTitleHighlight: 'Malasia',
    heroDesc:
      '¡Bienvenido! Explora el auténtico patrimonio cultural de los 13 estados y 3 territorios federales de Malasia. Tradiciones vivas, artesanía y arquitectura con tecnología digital e IA explicable.',
    btnMelakaShowcase: 'Explorar Escaparate de Malaca',
    btnPlanTrip: 'Planear Viaje Cultural',
    voiceButtonTitle: 'Encuentra tu idioma • Selector de Voz',
    voiceButtonLabel: 'Find your language',

    // Nationwide Coverage Section
    nationwideCoverageTag: 'Cobertura Nacional',
    nationwideTitle: 'Explora los 13 Estados y 3 Territorios Federales',
    nationwideSub: 'Selecciona cualquier estado malasio para conocer sus temas culturales distintivos, artesanía viva y monumentos verificados a continuación.',
    browseAllHeritagePlaces: 'Explorar Todos los Lugares del Patrimonio',

    // Explore Places
    exploreHeritageSection: 'Explorar Lugares Patrimoniales de Malasia',
    exploreHeritageSub: 'Lugares culturales seleccionados, tradiciones inmateriales vivas y monumentos en toda Malasia.',
    searchPlaceholder: 'Buscar por nombre, tradición o ciudad...',
    filterAllStates: 'Todos los Estados',
    filterAllCategories: 'Todas las Categorías',
    verifiedOnly: 'Solo Registros Verificados',
    viewGrid: 'Cuadrícula',
    viewMap: 'Mapa Interactivo',
    statesSectionTitle: 'Explora los Estados de Malasia',
    statesSectionSub: '13 Estados y 3 Territorios Federales en la Península y Borneo',
    showMore: 'Mostrar Más',
    showLess: 'Mostrar Menos',
    livingHeritageShowcase: 'Galería de Patrimonio Vivo',
    previousArtifact: 'Artefacto Anterior',
    nextArtifact: 'Siguiente Artefacto',
    activeLangBadge: 'Idioma: Español (¡Huevo de Pascua!)',
  },
};

/**
 * Matches detected voice speech / greeting string to corresponding SupportedLanguage
 * with robust case-insensitive substring and fuzzy token matching.
 */
export function detectLanguageFromGreeting(phrase: string): { lang: SupportedLanguage; matchedPhrase: string } | null {
  if (!phrase) return null;

  // Clean and normalize input: lower-case, remove punctuation, collapse whitespaces
  const clean = phrase
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?'"!\n\r]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 1. Malay ("apa khabar", "apakhabar", "khabar", "hai", "selamat", "salam")
  if (
    clean.includes('apa khabar') ||
    clean.includes('apakhabar') ||
    clean.includes('apa kabar') ||
    clean.includes('khabar') ||
    clean.includes('kabar') ||
    clean.includes('selamat') ||
    clean.includes('salam') ||
    clean === 'hai' ||
    clean.startsWith('hai ') ||
    clean.endsWith(' hai') ||
    clean.includes(' hai ')
  ) {
    return { lang: 'ms', matchedPhrase: 'Apa khabar' };
  }

  // 2. Chinese (Mandarin) ("你好", "您好", "ni hao", "nihao", "早安", "哈喽")
  if (
    clean.includes('你好') ||
    clean.includes('您好') ||
    clean.includes('早安') ||
    clean.includes('哈喽') ||
    clean.includes('ni hao') ||
    clean.includes('nihao') ||
    clean.includes('ni hǎo') ||
    clean.includes('nǐ hǎo')
  ) {
    return { lang: 'zh', matchedPhrase: '你好' };
  }

  // 3. French ("bonjour", "salut", "bonsoir", "coucou")
  if (
    clean.includes('bonjour') ||
    clean.includes('salut') ||
    clean.includes('bonsoir') ||
    clean.includes('coucou') ||
    clean.includes('ca va') ||
    clean.includes('ça va')
  ) {
    return { lang: 'fr', matchedPhrase: 'Bonjour' };
  }

  // 4. Spanish Easter Egg ("hola", "buenos dias", "buenas", "ole")
  if (
    clean.includes('hola') ||
    clean.includes('buenos dias') ||
    clean.includes('buenas') ||
    clean.includes('qué tal') ||
    clean.includes('que tal') ||
    clean.includes('ole')
  ) {
    return { lang: 'es', matchedPhrase: 'Hola' };
  }

  // 5. English default ("hello", "hi", "hey", "morning")
  if (
    clean.includes('hello') ||
    clean === 'hi' ||
    clean.startsWith('hi ') ||
    clean.endsWith(' hi') ||
    clean.includes(' hi ') ||
    clean.includes('hey') ||
    clean.includes('morning')
  ) {
    return { lang: 'en', matchedPhrase: 'Hello' };
  }

  return null;
}
