// Fixed, fictional demo users for the Friends demo.
// Written in code and never saved to storage, so damaged storage can never change them.
// Their sample memories are demo data only and are separate from the real user's memories.

import { PRESET_AVATAR_IDS } from '../types';
import { DemoUser, ME_ID } from './friendsTypes';

// Only two place ids are used (taken from your places.json sample entries). Every other memory
// has placeId null and shows its place name instead. If a listed id is ever removed from
// places.json, the screens fall back to placeName, so nothing breaks.
const PUTRA_MOSQUE_ID = 'pjy-putra-mosque';
const BATU_CAVES_ID = 'sgr-batu-caves';

export const DEMO_USERS: readonly DemoUser[] = [
  {
    id: 'demo-aisyah',
    displayName: 'Aisyah Rahman',
    username: 'aisyah_roams',
    bio: 'Weekend explorer who photographs old buildings and writes down the stories behind them.',
    interests: ['Heritage', 'Photography', 'Museums'],
    avatarId: PRESET_AVATAR_IDS[1],
    sampleMemories: [
      {
        id: 'demo-aisyah-m1',
        placeId: PUTRA_MOSQUE_ID,
        placeName: 'Putra Mosque',
        visitDate: '2025-11-08',
        note: 'Went early to catch the morning light on the pink dome.',
      },
      {
        id: 'demo-aisyah-m2',
        placeId: null,
        placeName: 'Muzium Negara, Kuala Lumpur',
        visitDate: '2026-02-14',
        note: 'Spent a rainy afternoon in the gallery halls.',
      },
    ],
  },
  {
    id: 'demo-daniel',
    displayName: 'Daniel Lim',
    username: 'daniel_lim',
    bio: 'Chasing the best hawker stalls and the temples nearby.',
    interests: ['Food', 'Culture', 'Temples'],
    avatarId: PRESET_AVATAR_IDS[2],
    sampleMemories: [
      {
        id: 'demo-daniel-m1',
        placeId: BATU_CAVES_ID,
        placeName: 'Batu Caves Temple Sanctuary',
        visitDate: '2025-12-20',
        note: 'Climbed the rainbow stairs before the crowds arrived.',
      },
      {
        id: 'demo-daniel-m2',
        placeId: null,
        placeName: 'Gurney Drive Hawker Centre, Penang',
        visitDate: '2026-03-07',
        note: 'Tried five dishes in one evening.',
      },
      {
        id: 'demo-daniel-m3',
        placeId: null,
        placeName: 'Kek Lok Si Temple, Penang',
        visitDate: '2026-03-08',
        note: 'The lanterns at dusk were worth the climb.',
      },
    ],
  },
  {
    id: 'demo-priya',
    displayName: 'Priya Nair',
    username: 'priya_nair',
    bio: 'Happiest outdoors with a camera and a pair of muddy boots.',
    interests: ['Nature', 'Photography', 'Beaches'],
    avatarId: PRESET_AVATAR_IDS[3],
    sampleMemories: [
      {
        id: 'demo-priya-m1',
        placeId: null,
        placeName: 'Taman Negara',
        visitDate: '2025-09-13',
        note: 'A slow walk along the canopy trail.',
      },
      {
        id: 'demo-priya-m2',
        placeId: null,
        placeName: 'Langkawi Sky Bridge',
        visitDate: '2026-01-18',
        note: 'Windy, clear and very high up.',
      },
    ],
  },
  {
    id: 'demo-farid',
    displayName: 'Farid Hassan',
    username: 'farid_hassan',
    bio: 'History student collecting stories from old trading towns.',
    interests: ['Heritage', 'Culture', 'Museums'],
    avatarId: PRESET_AVATAR_IDS[4],
    sampleMemories: [
      {
        id: 'demo-farid-m1',
        placeId: null,
        placeName: 'A Famosa, Melaka',
        visitDate: '2025-10-04',
        note: 'Read every sign around the old gate.',
      },
      {
        id: 'demo-farid-m2',
        placeId: PUTRA_MOSQUE_ID,
        placeName: 'Putra Mosque',
        visitDate: '2026-05-02',
        note: 'Visited with my study group after a lecture in Putrajaya.',
      },
      {
        id: 'demo-farid-m3',
        placeId: null,
        placeName: 'Jonker Street, Melaka',
        visitDate: '2026-05-03',
        note: 'Night market snacks and street music.',
      },
    ],
  },
  {
    id: 'demo-mei',
    displayName: 'Mei Ling Tan',
    username: 'meiling_tan',
    bio: 'Riverside walks, local food and a new city every season.',
    interests: ['Food', 'Beaches', 'Nature'],
    avatarId: PRESET_AVATAR_IDS[5],
    sampleMemories: [
      {
        id: 'demo-mei-m1',
        placeId: null,
        placeName: 'Kuching Waterfront',
        visitDate: '2026-04-11',
        note: 'Watched the sun go down over the river.',
      },
      {
        id: 'demo-mei-m2',
        placeId: null,
        placeName: 'Semenggoh Nature Reserve',
        visitDate: '2026-04-12',
        note: 'Saw the orangutans at feeding time.',
      },
    ],
  },
  {
    id: 'demo-nurul',
    displayName: 'Nurul Huda',
    username: 'nurul_huda',
    bio: 'Collecting heritage trails across Borneo, one town at a time.',
    interests: ['Culture', 'Heritage', 'Food'],
    avatarId: PRESET_AVATAR_IDS[0],
    sampleMemories: [
      {
        id: 'demo-nurul-m1',
        placeId: null,
        placeName: 'Kota Kinabalu City Mosque',
        visitDate: '2025-08-23',
        note: 'Quiet and beautiful, right by the water.',
      },
      {
        id: 'demo-nurul-m2',
        placeId: null,
        placeName: 'Mari Mari Cultural Village, Sabah',
        visitDate: '2026-06-06',
        note: 'Learned how traditional tapai is made.',
      },
    ],
  },
];

const DEMO_USERS_BY_ID = new Map<string, DemoUser>(DEMO_USERS.map((user) => [user.id, user]));

export function getDemoUser(id: string): DemoUser | undefined {
  return DEMO_USERS_BY_ID.get(id);
}

export function isDemoUserId(id: string): boolean {
  return DEMO_USERS_BY_ID.has(id);
}

// "me" or one of the demo users. Anything else is an unknown id and is rejected.
export function isKnownUserId(id: string): boolean {
  return id === ME_ID || DEMO_USERS_BY_ID.has(id);
}