export interface CulturalFestival {
  id: string;
  name: string;
  malayName?: string;
  stateId: string;
  stateName: string;
  startMonth: number; // 1-12
  startDay: number;   // 1-31
  endMonth: number;   // 1-12
  endDay: number;     // 1-31
  category: 'harvest' | 'religious' | 'cultural' | 'heritage';
  icon: string;
  bannerImage?: string;
  shortDescription: string;
  culturalSignificance: string;
  suggestedActivity: string;
  suggestedDurationMinutes: number;
}

export const MALAYSIAN_FESTIVALS: CulturalFestival[] = [
  {
    id: 'fest-gawai-dayak',
    name: 'Hari Gawai Dayak',
    malayName: 'Perayaan Gawai Dayak',
    stateId: 'SWK',
    stateName: 'Sarawak',
    startMonth: 6,
    startDay: 1,
    endMonth: 6,
    endDay: 2,
    category: 'harvest',
    icon: '🌾',
    shortDescription: 'The premier harvest festival of the Dayak communities (Iban, Bidayuh, Orang Ulu), marking the culmination of the rice harvesting season.',
    culturalSignificance: 'Sacred thanksgiving rituals, tuak rice wine sharing, and traditional Ngajat warrior dances performed across communal longhouses.',
    suggestedActivity: 'Join the grand Gawai cultural parade, watch authentic Ngajat performances, and sample artisanal Tuak in the heritage longhouse.',
    suggestedDurationMinutes: 90,
  },
  {
    id: 'fest-kaamatan',
    name: 'Pesta Kaamatan (Tadau Kaamatan)',
    malayName: 'Pesta Menuai Kaamatan',
    stateId: 'SBH',
    stateName: 'Sabah',
    startMonth: 5,
    startDay: 30,
    endMonth: 5,
    endDay: 31,
    category: 'harvest',
    icon: '🌾',
    shortDescription: 'Month-long harvest thanksgiving celebrated by the Kadazan-Dusun and Murut communities honoring Bambaazon (the spirit of the paddy).',
    culturalSignificance: 'Culminates in grand rituals at Hongkod Koisaan, the Unduk Ngadau cultural pageant, and Magavau ancestral blessings.',
    suggestedActivity: 'Experience the Magavau ritual ceremony, Sumazau gong dancing, and indigenous Sompoton musical showcases.',
    suggestedDurationMinutes: 75,
  },
  {
    id: 'fest-san-pedro',
    name: 'Festa San Pedro',
    malayName: 'Pesta Santo Pedro Melaka',
    stateId: 'MLK',
    stateName: 'Melaka',
    startMonth: 6,
    startDay: 28,
    endMonth: 6,
    endDay: 29,
    category: 'heritage',
    icon: '⛵',
    shortDescription: 'Vibrant feast day of Saint Peter, patron saint of fishermen, celebrated in the Portuguese Settlement of Melaka.',
    culturalSignificance: 'Over 500 years of Kristang-Portuguese heritage, featuring intricately decorated fishing boats, Branyo dances, and authentic Debal curry feasts.',
    suggestedActivity: 'Witness the ceremonial blessing of adorned fishing boats and join lively evening Kristang folk dancing at the Portuguese Square.',
    suggestedDurationMinutes: 60,
  },
  {
    id: 'fest-melaka-river',
    name: 'Melaka River International Festival',
    malayName: 'Pesta Sungai Melaka',
    stateId: 'MLK',
    stateName: 'Melaka',
    startMonth: 11,
    startDay: 20,
    endMonth: 11,
    endDay: 27,
    category: 'cultural',
    icon: '🏮',
    shortDescription: 'Annual international heritage and arts celebration along the historic riverbanks of the Melaka River.',
    culturalSignificance: 'Commemorates Melaka’s golden maritime sultanate era with illuminated dragon boat flotillas, water sports, and riverside arts.',
    suggestedActivity: 'Watch the illuminated cultural flotilla parade along the historic waterfront and attend heritage street busking.',
    suggestedDurationMinutes: 60,
  },
  {
    id: 'fest-georgetown-heritage',
    name: 'George Town Heritage Day Festival',
    malayName: 'Hari Warisan George Town',
    stateId: 'PNG',
    stateName: 'Pulau Pinang',
    startMonth: 7,
    startDay: 7,
    endMonth: 7,
    endDay: 9,
    category: 'heritage',
    icon: '🏛️',
    shortDescription: 'Celebrates George Town’s UNESCO World Heritage inscription with open clan houses, street craft workshops, and living tradition showcases.',
    culturalSignificance: 'Living synthesis of Chinese, Malay, Peranakan, Chulia, and Eurasian heritage across the historic inner city.',
    suggestedActivity: 'Take part in open guild house walking trails, woodblock printmaking workshops, and nighttime heritage street food showcases.',
    suggestedDurationMinutes: 90,
  },
  {
    id: 'fest-johor-chingay',
    name: 'Johor Bahru Chingay Street Parade',
    malayName: 'Perarakan Chingay Johor Bahru',
    stateId: 'JHR',
    stateName: 'Johor',
    startMonth: 2,
    startDay: 18,
    endMonth: 2,
    endDay: 22,
    category: 'cultural',
    icon: '🐉',
    shortDescription: 'National Intangible Cultural Heritage parade uniting Johor’s five dialect clans in a massive street deity procession.',
    culturalSignificance: 'A 150-year-old living tradition embodying harmonious co-existence with dynamic high-stilt acrobatic lion and dragon dances.',
    suggestedActivity: 'Watch the vibrant high-stilt dragon acrobatics and the sacred five-clan street procession along Jalan Wong Ah Fook.',
    suggestedDurationMinutes: 75,
  },
  {
    id: 'fest-thaipusam',
    name: 'Thaipusam Pilgrimage at Batu Caves',
    malayName: 'Perayaan Thaipusam Batu Caves',
    stateId: 'SGR',
    stateName: 'Selangor',
    startMonth: 1,
    startDay: 23,
    endMonth: 1,
    endDay: 26,
    category: 'religious',
    icon: '🦚',
    shortDescription: 'One of the largest Hindu devotional gatherings in the world, taking place at the limestone temple caves of Sri Subramaniar Swamy.',
    culturalSignificance: 'Celebration of devotion, faith, and vow-fulfillment through the carrying of Paal Kudam milk pots and ornate floral Kavadis.',
    suggestedActivity: 'Observe the colorful Kavadi processions ascending the 272 rainbow steps accompanied by traditional Urumi Melam percussion.',
    suggestedDurationMinutes: 90,
  },
  {
    id: 'fest-citrawarna',
    name: 'Citrawarna Colours of Malaysia',
    malayName: 'Citrawarna Malaysia',
    stateId: 'KUL',
    stateName: 'Kuala Lumpur',
    startMonth: 5,
    startDay: 15,
    endMonth: 5,
    endDay: 18,
    category: 'cultural',
    icon: '🎭',
    shortDescription: 'Malaysia’s flagship national street choreography extravaganza showcasing the dances, costumes, and music of all Malaysian ethnic groups.',
    culturalSignificance: 'Staged at Dataran Merdeka against the historic backdrop of the Sultan Abdul Samad Building.',
    suggestedActivity: 'Experience synchronized ethnic choreography, multi-tiered cultural float displays, and illuminated evening musical showcases.',
    suggestedDurationMinutes: 60,
  },
];

/**
 * Checks if a given date range (YYYY-MM-DD to YYYY-MM-DD) collides with any festival in the given state.
 */
export function findOverlappingFestivals(
  stateId: string,
  startDateStr: string,
  endDateStr: string
): CulturalFestival[] {
  if (!startDateStr || !endDateStr || !stateId) return [];

  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];

  return MALAYSIAN_FESTIVALS.filter((fest) => {
    // Check state match (or national festivals if state is KUL/ALL)
    if (fest.stateId !== stateId && fest.stateId !== 'ALL') {
      return false;
    }

    // Evaluate overlap across years
    const tripStartYear = start.getFullYear();
    const tripEndYear = end.getFullYear();

    for (let yr = tripStartYear; yr <= tripEndYear; yr++) {
      const festStart = new Date(yr, fest.startMonth - 1, fest.startDay, 0, 0, 0);
      const festEnd = new Date(yr, fest.endMonth - 1, fest.endDay, 23, 59, 59);

      // Overlap condition: start <= festEnd && end >= festStart
      if (start <= festEnd && end >= festStart) {
        return true;
      }
    }

    return false;
  });
}
