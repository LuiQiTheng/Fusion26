import { Itinerary, MissionProof } from '../types';

const STORAGE_KEYS = {
  ITINERARY: 'mhe_saved_itinerary_v1',
  FAVOURITES: 'mhe_saved_favourites_v1',
  MISSIONS: 'mhe_completed_missions_v1',
  PREFERENCES: 'mhe_user_preferences_v1',
  PROOFS: 'mhe_mission_proofs_v1',
  BADGES: 'mhe_unlocked_badges_v1',
};

export function saveItinerary(itinerary: Itinerary): boolean {
  try {
    localStorage.setItem(STORAGE_KEYS.ITINERARY, JSON.stringify(itinerary));
    return true;
  } catch (err) {
    console.error('Failed to save itinerary to localStorage:', err);
    return false;
  }
}

export function loadItinerary(): Itinerary | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ITINERARY);
    if (!raw) return null;
    return JSON.parse(raw) as Itinerary;
  } catch (err) {
    console.error('Failed to load itinerary from localStorage:', err);
    return null;
  }
}

export function saveFavourites(ids: string[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEYS.FAVOURITES, JSON.stringify(ids));
    return true;
  } catch (err) {
    console.error('Failed to save favourites to localStorage:', err);
    return false;
  }
}

export function loadFavourites(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FAVOURITES);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch (err) {
    console.error('Failed to load favourites:', err);
    return [];
  }
}

export function toggleFavourite(placeId: string): string[] {
  const current = loadFavourites();
  const exists = current.includes(placeId);
  const updated = exists ? current.filter((id) => id !== placeId) : [...current, placeId];
  saveFavourites(updated);
  return updated;
}

export function saveCompletedMissions(missionIds: string[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEYS.MISSIONS, JSON.stringify(missionIds));
    return true;
  } catch (err) {
    console.error('Failed to save completed missions:', err);
    return false;
  }
}

export function loadCompletedMissions(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MISSIONS);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch (err) {
    console.error('Failed to load completed missions:', err);
    return [];
  }
}

export function completeMission(missionId: string): string[] {
  const current = loadCompletedMissions();
  if (!current.includes(missionId)) {
    const updated = [...current, missionId];
    saveCompletedMissions(updated);
    return updated;
  }
  return current;
}

export function saveMissionProofs(proofs: Record<string, MissionProof>): boolean {
  try {
    localStorage.setItem(STORAGE_KEYS.PROOFS, JSON.stringify(proofs));
    return true;
  } catch (err) {
    console.error('Failed to save mission proofs:', err);
    return false;
  }
}

export function loadMissionProofs(): Record<string, MissionProof> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROOFS);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, MissionProof>;
  } catch (err) {
    console.error('Failed to load mission proofs:', err);
    return {};
  }
}

export function addMissionProof(proof: MissionProof): Record<string, MissionProof> {
  const current = loadMissionProofs();
  const updated = { ...current, [proof.missionId]: proof };
  saveMissionProofs(updated);
  return updated;
}

export function saveUnlockedBadges(badgeIds: string[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(badgeIds));
    return true;
  } catch (err) {
    console.error('Failed to save unlocked badges:', err);
    return false;
  }
}

export function loadUnlockedBadges(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BADGES);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch (err) {
    console.error('Failed to load unlocked badges:', err);
    return [];
  }
}

export function clearAllSavedData(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.ITINERARY);
    localStorage.removeItem(STORAGE_KEYS.FAVOURITES);
    localStorage.removeItem(STORAGE_KEYS.MISSIONS);
    localStorage.removeItem(STORAGE_KEYS.PREFERENCES);
    localStorage.removeItem(STORAGE_KEYS.PROOFS);
    localStorage.removeItem(STORAGE_KEYS.BADGES);
  } catch (err) {
    console.error('Failed to clear storage:', err);
  }
}

