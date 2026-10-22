// Profile-owned types, limits and defaults for the My Profile feature (Phase 1).
// Nothing here touches existing Fusion26 data or storage keys.

// ---------- Storage identifiers ----------

// Namespaced differently from the existing "mhe_*" keys.
export const PROFILE_STORAGE_KEY = 'fusion26_profile_data_v1';
export const PROFILE_DB_NAME = 'fusion26_profile_db';
export const PROFILE_DB_VERSION = 1;
export const PHOTO_STORE_NAME = 'photos';

// ---------- Limits ----------

export const LIMITS = {
  DISPLAY_NAME_MAX: 50,
  USERNAME_MIN: 3,
  USERNAME_MAX: 20,
  BIO_MAX: 300,
  NOTES_MAX: 2000,
  INTERESTS_MAX: 10,
  INTEREST_LABEL_MAX: 24,
  PHOTOS_PER_RECORD: 10,
  PHOTO_MAX_BYTES: 10 * 1024 * 1024, // 10 MB
} as const;

export const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,20}$/;

export const ACCEPTED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type AcceptedPhotoType = (typeof ACCEPTED_PHOTO_TYPES)[number];

// ---------- Profile ----------

export interface UserProfile {
  displayName: string;
  username: string;
  bio: string;
  interests: string[];
  avatarId: string; // one of PRESET_AVATAR_IDS
  updatedAt: string; // ISO timestamp
}

export const PRESET_AVATAR_IDS = [
  'avatar-1',
  'avatar-2',
  'avatar-3',
  'avatar-4',
  'avatar-5',
  'avatar-6',
] as const;

export const PRESET_INTERESTS = [
  'Heritage',
  'Food',
  'Nature',
  'Culture',
  'Temples',
  'Museums',
  'Beaches',
  'Photography',
] as const;

export function createDefaultProfile(): UserProfile {
  return {
    displayName: 'Traveller',
    username: 'traveller',
    bio: '',
    interests: [...PRESET_INTERESTS],
    avatarId: PRESET_AVATAR_IDS[0],
    updatedAt: new Date().toISOString(),
  };
}

// ---------- Places ----------

// A record points either to an existing Fusion26 place (by its id)
// or to a custom place owned by the profile.
export type PlaceRef =
  | { kind: 'existing'; placeId: string }
  | { kind: 'custom'; customPlaceId: string };

export interface CustomPlace {
  id: string;
  name: string;
  lat: number;
  lng: number;
  createdAt: string;
}

// ---------- Memory visibility ----------

export const MEMORY_VISIBILITIES = ['public', 'friends', 'private'] as const;
export type MemoryVisibility = (typeof MEMORY_VISIBILITIES)[number];

// New memories start Private, and so does anything missing or unrecognised.
export const DEFAULT_MEMORY_VISIBILITY: MemoryVisibility = 'private';

export const MEMORY_VISIBILITY_LABELS: Record<MemoryVisibility, string> = {
  public: 'Public',
  friends: 'Friends Only',
  private: 'Private',
};

export const MEMORY_VISIBILITY_DESCRIPTIONS: Record<MemoryVisibility, string> = {
  public: 'Anyone can see this memory.',
  friends: 'You and your accepted friends can see this memory.',
  private: 'Only you can see this memory.',
};

export function isMemoryVisibility(value: unknown): value is MemoryVisibility {
  return typeof value === 'string' && (MEMORY_VISIBILITIES as readonly string[]).includes(value);
}

// ---------- Travel records and photos ----------

export interface TravelRecord {
  id: string;
  place: PlaceRef;
  visitDate: string | null; // "YYYY-MM-DD", or null when not set
  notes: string; // empty string when not set
  visibility: MemoryVisibility; // who can see this memory
  photoIds: string[]; // upload order; first is the cover
  createdAt: string;
  updatedAt: string;
}

// Metadata only. The image binary lives in IndexedDB under the same id.
export interface TravelPhoto {
  id: string;
  recordId: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

// ---------- Recycle Bin ----------

export interface RecycledRecord {
  record: TravelRecord; // record.photoIds is the order at deletion time
  photos: TravelPhoto[]; // photo metadata at deletion time
  deletedAt: string;
}

// A photo deleted on its own while its record stayed active.
export interface RecycledPhoto {
  photo: TravelPhoto;
  originalIndex: number; // position in record.photoIds before deletion
  deletedAt: string;
}

export interface RecycleBin {
  records: RecycledRecord[];
  photos: RecycledPhoto[];
}

// ---------- Persisted metadata (localStorage) ----------

// Everything lives under one key so metadata writes are a single operation.
export interface ProfileData {
  version: 1;
  profile: UserProfile;
  records: TravelRecord[];
  photos: TravelPhoto[]; // metadata for photos attached to active records
  customPlaces: CustomPlace[];
  recycleBin: RecycleBin;
  updatedAt: string;
}

export function createEmptyProfileData(): ProfileData {
  return {
    version: 1,
    profile: createDefaultProfile(),
    records: [],
    photos: [],
    customPlaces: [],
    recycleBin: { records: [], photos: [] },
    updatedAt: new Date().toISOString(),
  };
}

// ---------- Operation results ----------

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function fail<T = never>(error: string): Result<T> {
  return { ok: false, error };
}