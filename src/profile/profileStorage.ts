// localStorage layer for Profile metadata (profile, records, photo metadata,
// custom places, Recycle Bin). Photo binaries are NOT stored here (see photoDb.ts).
// Uses its own namespaced key and never touches the existing "mhe_*" keys.

import {
  PROFILE_STORAGE_KEY,
  USERNAME_PATTERN,
  LIMITS,
  PRESET_AVATAR_IDS,
  ProfileData,
  UserProfile,
  TravelRecord,
  TravelPhoto,
  CustomPlace,
  PlaceRef,
  RecycleBin,
  RecycledRecord,
  RecycledPhoto,
  Result,
  ok,
  fail,
  createDefaultProfile,
  createEmptyProfileData,
} from './types';

const PROFILE_BACKUP_KEY = `${PROFILE_STORAGE_KEY}_backup`;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type LoadStatus = 'ok' | 'fresh' | 'recovered';

export interface LoadOutcome {
  data: ProfileData;
  status: LoadStatus; // fresh = nothing saved yet; recovered = stored data was damaged
  message?: string;
}

// ---------- Small helpers ----------

interface Tally {
  dropped: number;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidCoordinate(lat: unknown, lng: unknown): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function sanitizeList<T>(
  value: unknown,
  sanitizeItem: (item: unknown) => T | null,
  tally: Tally,
): T[] {
  if (!Array.isArray(value)) return [];
  const result: T[] = [];
  for (const item of value) {
    const clean = sanitizeItem(item);
    if (clean) result.push(clean);
    else tally.dropped += 1;
  }
  return result;
}

// ---------- Sanitizers (stored data is untrusted) ----------

function sanitizeProfile(value: unknown): UserProfile {
  const defaults = createDefaultProfile();
  if (!isObject(value)) return defaults;

  const displayName =
    isNonEmptyString(value.displayName) ? value.displayName.trim().slice(0, LIMITS.DISPLAY_NAME_MAX) : defaults.displayName;

  const username =
    typeof value.username === 'string' && USERNAME_PATTERN.test(value.username)
      ? value.username
      : defaults.username;

  const bio = typeof value.bio === 'string' ? value.bio.slice(0, LIMITS.BIO_MAX) : defaults.bio;

  let interests = defaults.interests;
  if (Array.isArray(value.interests)) {
    const seen = new Set<string>();
    interests = [];
    for (const item of value.interests) {
      if (typeof item !== 'string') continue;
      const label = item.trim().slice(0, LIMITS.INTEREST_LABEL_MAX);
      const key = label.toLowerCase();
      if (!label || seen.has(key)) continue;
      seen.add(key);
      interests.push(label);
      if (interests.length >= LIMITS.INTERESTS_MAX) break;
    }
  }

  const avatarId =
    typeof value.avatarId === 'string' && (PRESET_AVATAR_IDS as readonly string[]).includes(value.avatarId)
      ? value.avatarId
      : defaults.avatarId;

  const updatedAt = typeof value.updatedAt === 'string' ? value.updatedAt : defaults.updatedAt;

  return { displayName, username, bio, interests, avatarId, updatedAt };
}

function sanitizePlaceRef(value: unknown): PlaceRef | null {
  if (!isObject(value)) return null;
  if (value.kind === 'existing' && isNonEmptyString(value.placeId)) {
    return { kind: 'existing', placeId: value.placeId };
  }
  if (value.kind === 'custom' && isNonEmptyString(value.customPlaceId)) {
    return { kind: 'custom', customPlaceId: value.customPlaceId };
  }
  return null;
}

function sanitizeRecord(value: unknown): TravelRecord | null {
  if (!isObject(value) || !isNonEmptyString(value.id)) return null;
  const place = sanitizePlaceRef(value.place);
  if (!place) return null;
  if (typeof value.createdAt !== 'string' || typeof value.updatedAt !== 'string') return null;

  const visitDate =
    typeof value.visitDate === 'string' && DATE_PATTERN.test(value.visitDate) ? value.visitDate : null;
  const notes = typeof value.notes === 'string' ? value.notes.slice(0, LIMITS.NOTES_MAX) : '';
  const photoIds = Array.isArray(value.photoIds)
    ? value.photoIds.filter((id): id is string => isNonEmptyString(id))
    : [];

  return {
    id: value.id,
    place,
    visitDate,
    notes,
    photoIds: Array.from(new Set(photoIds)),
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

function sanitizePhoto(value: unknown): TravelPhoto | null {
  if (!isObject(value)) return null;
  if (!isNonEmptyString(value.id) || !isNonEmptyString(value.recordId)) return null;
  if (typeof value.createdAt !== 'string') return null;
  return {
    id: value.id,
    recordId: value.recordId,
    fileName: typeof value.fileName === 'string' ? value.fileName : 'photo',
    mimeType: typeof value.mimeType === 'string' ? value.mimeType : '',
    size: typeof value.size === 'number' && Number.isFinite(value.size) ? value.size : 0,
    createdAt: value.createdAt,
  };
}

function sanitizeCustomPlace(value: unknown): CustomPlace | null {
  if (!isObject(value) || !isNonEmptyString(value.id) || !isNonEmptyString(value.name)) return null;
  if (!isValidCoordinate(value.lat, value.lng)) return null;
  return {
    id: value.id,
    name: value.name.trim(),
    lat: value.lat as number,
    lng: value.lng as number,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : new Date().toISOString(),
  };
}

function sanitizeRecycledRecord(value: unknown): RecycledRecord | null {
  if (!isObject(value) || typeof value.deletedAt !== 'string') return null;
  const record = sanitizeRecord(value.record);
  if (!record) return null;
  const photos: TravelPhoto[] = [];
  if (Array.isArray(value.photos)) {
    for (const item of value.photos) {
      const photo = sanitizePhoto(item);
      if (photo) photos.push(photo);
    }
  }
  return { record, photos, deletedAt: value.deletedAt };
}

function sanitizeRecycledPhoto(value: unknown): RecycledPhoto | null {
  if (!isObject(value) || typeof value.deletedAt !== 'string') return null;
  const photo = sanitizePhoto(value.photo);
  if (!photo) return null;
  const originalIndex =
    typeof value.originalIndex === 'number' && Number.isInteger(value.originalIndex) && value.originalIndex >= 0
      ? value.originalIndex
      : 0;
  return { photo, originalIndex, deletedAt: value.deletedAt };
}

function sanitizeRecycleBin(value: unknown, tally: Tally): RecycleBin {
  if (!isObject(value)) return { records: [], photos: [] };
  return {
    records: sanitizeList(value.records, sanitizeRecycledRecord, tally),
    photos: sanitizeList(value.photos, sanitizeRecycledPhoto, tally),
  };
}

// ---------- Backup of damaged data ----------

// Keeps the first damaged copy so a bad read can never silently destroy user data.
function backupRawData(raw: string): void {
  try {
    if (localStorage.getItem(PROFILE_BACKUP_KEY) === null) {
      localStorage.setItem(PROFILE_BACKUP_KEY, raw);
    }
  } catch (err) {
    console.error('Could not back up damaged profile data:', err);
  }
}

// ---------- Public API ----------

export function loadProfileData(): Result<LoadOutcome> {
  let raw: string | null;
  try {
    raw = localStorage.getItem(PROFILE_STORAGE_KEY);
  } catch (err) {
    console.error('Local storage is unavailable:', err);
    return fail('Your browser storage is unavailable, so profile data cannot be loaded.');
  }

  if (raw === null) {
    return ok({ data: createEmptyProfileData(), status: 'fresh' });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error('Stored profile data is not valid JSON:', err);
    backupRawData(raw);
    return ok({
      data: createEmptyProfileData(),
      status: 'recovered',
      message: 'Saved profile data was damaged and could not be read. A fresh profile was started.',
    });
  }

  if (!isObject(parsed) || parsed.version !== 1) {
    backupRawData(raw);
    return ok({
      data: createEmptyProfileData(),
      status: 'recovered',
      message: 'Saved profile data was in an unknown format. A fresh profile was started.',
    });
  }

  const tally: Tally = { dropped: 0 };
  const data: ProfileData = {
    version: 1,
    profile: sanitizeProfile(parsed.profile),
    records: sanitizeList(parsed.records, sanitizeRecord, tally),
    photos: sanitizeList(parsed.photos, sanitizePhoto, tally),
    customPlaces: sanitizeList(parsed.customPlaces, sanitizeCustomPlace, tally),
    recycleBin: sanitizeRecycleBin(parsed.recycleBin, tally),
    updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
  };

  if (tally.dropped > 0) {
    backupRawData(raw);
    return ok({
      data,
      status: 'recovered',
      message: `${tally.dropped} damaged item(s) in your saved profile data were ignored.`,
    });
  }

  return ok({ data, status: 'ok' });
}

// Writes all metadata in one setItem call, so it fully succeeds or fully fails.
// Returns the saved data with its new updatedAt stamp; callers should keep that copy.
export function saveProfileData(data: ProfileData): Result<ProfileData> {
  const stamped: ProfileData = { ...data, updatedAt: new Date().toISOString() };
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(stamped));
    return ok(stamped);
  } catch (err) {
    console.error('Failed to save profile data:', err);
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      return fail('Browser storage is full, so your changes could not be saved.');
    }
    return fail('Your changes could not be saved to browser storage.');
  }
}

// Reads only the stored updatedAt stamp (null if nothing is stored or it is unreadable).
export function peekStoredUpdatedAt(): string | null {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isObject(parsed) && typeof parsed.updatedAt === 'string' ? parsed.updatedAt : null;
  } catch {
    return null;
  }
}

// True when stored data changed after the copy the UI is holding (e.g. another tab saved).
export function isProfileDataStale(knownUpdatedAt: string): boolean {
  const stored = peekStoredUpdatedAt();
  return stored !== null && stored !== knownUpdatedAt;
}

// Removes ONLY the Profile metadata (and its damaged-data backup).
// Does not touch any existing "mhe_*" key.
export function removeProfileData(): Result<void> {
  try {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
    localStorage.removeItem(PROFILE_BACKUP_KEY);
    return ok(undefined);
  } catch (err) {
    console.error('Failed to remove profile data:', err);
    return fail('Profile data could not be removed from browser storage.');
  }
}