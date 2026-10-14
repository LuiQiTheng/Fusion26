import { Itinerary } from '../types';

const STORAGE_KEYS = {
  ITINERARY: 'mhe_saved_itinerary_v1',
  FAVOURITES: 'mhe_saved_favourites_v1',
  MISSIONS: 'mhe_completed_missions_v1',
  PREFERENCES: 'mhe_user_preferences_v1',
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

export function clearAllSavedData(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.ITINERARY);
    localStorage.removeItem(STORAGE_KEYS.FAVOURITES);
    localStorage.removeItem(STORAGE_KEYS.MISSIONS);
    localStorage.removeItem(STORAGE_KEYS.PREFERENCES);
  } catch (err) {
    console.error('Failed to clear storage:', err);
  }
}
