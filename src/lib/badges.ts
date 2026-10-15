import { ExplorerBadge, BadgeTierId } from '../types';

export const EXPLORER_BADGES: ExplorerBadge[] = [
  {
    id: 'bronze',
    name: 'Beginner Explorer',
    level: 'Beginner',
    minRequired: 1,
    color: 'bronze',
    icon: '🥉',
    description: 'Verified your first heritage site on-site with authentic photographic proof.'
  },
  {
    id: 'silver',
    name: 'Intermediate Explorer',
    level: 'Intermediate',
    minRequired: 4,
    color: 'silver',
    icon: '🥈',
    description: 'Deepened cultural engagement across multi-ethnic living traditions and monuments.'
  },
  {
    id: 'gold',
    name: 'Expert Explorer',
    level: 'Expert',
    minRequired: 9,
    color: 'gold',
    icon: '🥇',
    description: 'Mastered Malaysian living heritage, sacred architecture, and mindful preservation.'
  }
];

export function getUnlockedBadges(completedCount: number): ExplorerBadge[] {
  return EXPLORER_BADGES.filter((b) => completedCount >= b.minRequired);
}

export function getNextBadge(completedCount: number): { nextBadge: ExplorerBadge; remaining: number } | null {
  const next = EXPLORER_BADGES.find((b) => completedCount < b.minRequired);
  if (!next) return null;
  return {
    nextBadge: next,
    remaining: next.minRequired - completedCount
  };
}

export function checkNewlyUnlockedBadge(
  previousCount: number,
  newCount: number
): ExplorerBadge | null {
  for (const badge of EXPLORER_BADGES) {
    if (previousCount < badge.minRequired && newCount >= badge.minRequired) {
      return badge;
    }
  }
  return null;
}
