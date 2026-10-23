// Profile repository: the only module the UI should call for Profile data.
// It coordinates localStorage metadata (profileStorage) and IndexedDB photo files (photoDb).
//
// Safety rules used throughout:
// - New photo files are written first. If the metadata save then fails, only those
//   new files are removed, so old data is never touched.
// - Permanent deletion saves metadata first and removes files afterwards, so a failure
//   can leave an unused file behind but can never leave a record pointing at a missing file.
// - Nothing here touches the existing "mhe_*" keys or clearAllSavedData().

import {
  ACCEPTED_PHOTO_TYPES,
  DEFAULT_MEMORY_VISIBILITY,
  MemoryVisibility,
  MemoryComment,
  isMemoryVisibility,
  LIMITS,
  PRESET_AVATAR_IDS,
  USERNAME_PATTERN,
  CustomPlace,
  PlaceRef,
  ProfileData,
  Result,
  TravelPhoto,
  TravelRecord,
  UserProfile,
  fail,
  ok,
} from './types';
import {
  LoadOutcome,
  loadProfileData,
  saveProfileData,
  removeProfileData,
  isProfileDataStale,
} from './profileStorage';
import {
  savePhotoBlobs,
  deletePhotoBlobs,
  clearAllPhotoBlobs,
  findExistingPhotoIds,
  listStoredPhotoIds,
  hasRoomFor,
} from './photoDb';
import { MemoryViewerRelation } from './memoryUtils';

export { isProfileDataStale };

// ---------- Existing-place lookup (configured in Stage 4 from places.json) ----------

export interface ExistingPlaceInfo {
  name: string;
  lat: number | undefined;
  lng: number | undefined;
}

export type PlaceLookup = (placeId: string) => ExistingPlaceInfo | null;

let placeLookup: PlaceLookup | null = null;

// The UI layer calls this once, passing a function that reads the real place data.
export function configurePlaceLookup(lookup: PlaceLookup): void {
  placeLookup = lookup;
}

// ---------- Small helpers ----------

function createId(prefix: string): string {
  const random =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}_${random}`;
}

function cloneData(data: ProfileData): ProfileData {
  return JSON.parse(JSON.stringify(data)) as ProfileData;
}

function isValidCoordinate(lat: unknown, lng: unknown): lat is number {
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

function todayString(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

// Keeps records and photo metadata consistent with each other.
function normalizeRelationships(data: ProfileData): ProfileData {
  const photoById = new Map(data.photos.map((photo) => [photo.id, photo]));
  const used = new Set<string>();

  const records = data.records.map((record) => {
    const photoIds = record.photoIds.filter((id) => {
      const photo = photoById.get(id);
      if (!photo || photo.recordId !== record.id || used.has(id)) return false;
      used.add(id);
      return true;
    });
    return photoIds.length === record.photoIds.length ? record : { ...record, photoIds };
  });

  return { ...data, records, photos: data.photos.filter((photo) => used.has(photo.id)) };
}

function loadDraft(): Result<ProfileData> {
  const loaded = loadProfileData();
  if (!loaded.ok) return fail(loaded.error);
  return ok(normalizeRelationships(cloneData(loaded.value.data)));
}

// Removes custom places that no active or recycled record uses any more.
function pruneCustomPlaces(draft: ProfileData): void {
  const used = new Set<string>();
  for (const record of draft.records) {
    if (record.place.kind === 'custom') used.add(record.place.customPlaceId);
  }
  for (const entry of draft.recycleBin.records) {
    if (entry.record.place.kind === 'custom') used.add(entry.record.place.customPlaceId);
  }
  draft.customPlaces = draft.customPlaces.filter((place) => used.has(place.id));
}

// Saves metadata, writing any new photo files first and removing only those
// new files again if the metadata save fails.
async function saveWithNewBlobs(
  draft: ProfileData,
  newBlobs: { id: string; blob: Blob }[],
): Promise<Result<ProfileData>> {
  if (newBlobs.length > 0) {
    const bytes = newBlobs.reduce((sum, item) => sum + item.blob.size, 0);
    if (!(await hasRoomFor(bytes))) {
      return fail('Not enough browser storage space for these photos. Remove some photos and try again.');
    }
    const written = await savePhotoBlobs(newBlobs);
    if (!written.ok) return fail(written.error);
  }

  const saved = saveProfileData(draft);
  if (!saved.ok) {
    if (newBlobs.length > 0) await deletePhotoBlobs(newBlobs.map((item) => item.id));
    return saved;
  }
  return saved;
}

// After a permanent delete: remove photo files that nothing references any more.
async function removeUnreferencedBlobs(ids: string[], saved: ProfileData): Promise<string | undefined> {
  const referenced = new Set<string>(saved.photos.map((photo) => photo.id));
  for (const entry of saved.recycleBin.records) {
    for (const photo of entry.photos) referenced.add(photo.id);
  }
  for (const entry of saved.recycleBin.photos) referenced.add(entry.photo.id);

  const toDelete = ids.filter((id) => !referenced.has(id));
  if (toDelete.length === 0) return undefined;

  const result = await deletePhotoBlobs(toDelete);
  return result.ok ? undefined : 'Some unused photo files could not be removed from browser storage.';
}

// ---------- Reading ----------

export function loadProfile(): Result<LoadOutcome> {
  const loaded = loadProfileData();
  if (!loaded.ok) return loaded;
  return ok({ ...loaded.value, data: normalizeRelationships(loaded.value.data) });
}

export function placeKeyOf(place: PlaceRef): string {
  return place.kind === 'existing' ? `existing:${place.placeId}` : `custom:${place.customPlaceId}`;
}

export interface ResolvedPlace {
  key: string;
  name: string;
  lat: number;
  lng: number;
  isCustom: boolean;
}

// Returns null when the place or its coordinates cannot be resolved.
export function resolvePlace(data: ProfileData, place: PlaceRef): ResolvedPlace | null {
  if (place.kind === 'custom') {
    const custom = data.customPlaces.find((item) => item.id === place.customPlaceId);
    if (!custom) return null;
    return { key: placeKeyOf(place), name: custom.name, lat: custom.lat, lng: custom.lng, isCustom: true };
  }
  if (!placeLookup) return null;
  const info = placeLookup(place.placeId);
  if (!info || !isValidCoordinate(info.lat, info.lng)) return null;
  return { key: placeKeyOf(place), name: info.name, lat: info.lat, lng: info.lng as number, isCustom: false };
}

// Distinct places with at least one active record.
// Existing-place coordinates are validated when a record is saved, so they are not
// re-checked here; custom places must still exist.
export function getVisitedPlaceCount(data: ProfileData): number {
  const customIds = new Set(data.customPlaces.map((place) => place.id));
  const keys = new Set<string>();
  for (const record of data.records) {
    if (record.place.kind === 'existing' || customIds.has(record.place.customPlaceId)) {
      keys.add(placeKeyOf(record.place));
    }
  }
  return keys.size;
}

export function getRecentRecords(data: ProfileData, count: number): TravelRecord[] {
  return [...data.records].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, count);
}

// ---------- Profile editing ----------

export interface ProfileInput {
  displayName: string;
  username: string;
  bio: string;
  interests: string[];
  avatarId: string;
}

export type ProfileFieldErrors = Partial<Record<keyof ProfileInput, string>>;

export function validateProfileInput(input: ProfileInput): ProfileFieldErrors {
  const errors: ProfileFieldErrors = {};

  const displayName = input.displayName.trim();
  if (!displayName) errors.displayName = 'Display name is required.';
  else if (displayName.length > LIMITS.DISPLAY_NAME_MAX) {
    errors.displayName = `Display name can be at most ${LIMITS.DISPLAY_NAME_MAX} characters.`;
  }

  if (!USERNAME_PATTERN.test(input.username.trim())) {
    errors.username = `Username must be ${LIMITS.USERNAME_MIN}-${LIMITS.USERNAME_MAX} characters using only English letters, numbers or underscores.`;
  }

  if (input.bio.length > LIMITS.BIO_MAX) {
    errors.bio = `Bio can be at most ${LIMITS.BIO_MAX} characters.`;
  }

  const seen = new Set<string>();
  for (const raw of input.interests) {
    const label = raw.trim();
    if (!label) {
      errors.interests = 'Interests cannot be empty.';
      break;
    }
    if (label.length > LIMITS.INTEREST_LABEL_MAX) {
      errors.interests = `Each interest can be at most ${LIMITS.INTEREST_LABEL_MAX} characters.`;
      break;
    }
    const key = label.toLowerCase();
    if (seen.has(key)) {
      errors.interests = `"${label}" is already in your interests.`;
      break;
    }
    seen.add(key);
  }
  if (!errors.interests && input.interests.length > LIMITS.INTERESTS_MAX) {
    errors.interests = `You can choose at most ${LIMITS.INTERESTS_MAX} interests.`;
  }

  if (!(PRESET_AVATAR_IDS as readonly string[]).includes(input.avatarId)) {
    errors.avatarId = 'Please choose one of the preset avatars.';
  }

  return errors;
}

export function updateProfile(input: ProfileInput): Result<UserProfile> {
  if (Object.keys(validateProfileInput(input)).length > 0) {
    return fail('Please fix the highlighted fields and try again.');
  }
  const draft = loadDraft();
  if (!draft.ok) return draft;

  draft.value.profile = {
    displayName: input.displayName.trim(),
    username: input.username.trim(),
    bio: input.bio,
    interests: input.interests.map((item) => item.trim()),
    avatarId: input.avatarId,
    updatedAt: new Date().toISOString(),
  };

  const saved = saveProfileData(draft.value);
  if (!saved.ok) return saved;
  return ok(saved.value.profile);
}

// ---------- Photo validation ----------

export interface RejectedFile {
  fileName: string;
  reason: string;
}

export interface PhotoValidation {
  accepted: File[];
  rejected: RejectedFile[];
}

const EXTENSION_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

function inferMimeType(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  return EXTENSION_TYPES[ext] ?? '';
}

// currentCount = photos the record will already have (after any removals).
export function validatePhotoFiles(files: File[], currentCount: number): PhotoValidation {
  const accepted: File[] = [];
  const rejected: RejectedFile[] = [];

  for (const file of files) {
    const mime = inferMimeType(file);
    if (!(ACCEPTED_PHOTO_TYPES as readonly string[]).includes(mime)) {
      rejected.push({ fileName: file.name, reason: 'Unsupported format. Use JPG, JPEG, PNG or WebP.' });
    } else if (file.size === 0) {
      rejected.push({ fileName: file.name, reason: 'The file is empty.' });
    } else if (file.size > LIMITS.PHOTO_MAX_BYTES) {
      rejected.push({ fileName: file.name, reason: 'The file is larger than 10 MB.' });
    } else if (currentCount + accepted.length >= LIMITS.PHOTOS_PER_RECORD) {
      rejected.push({
        fileName: file.name,
        reason: `A memory can have at most ${LIMITS.PHOTOS_PER_RECORD} photos.`,
      });
    } else {
      accepted.push(file);
    }
  }
  return { accepted, rejected };
}

function buildPhotos(recordId: string, files: File[], now: string) {
  const photos: TravelPhoto[] = [];
  const blobs: { id: string; blob: Blob }[] = [];
  for (const file of files) {
    const id = createId('photo');
    photos.push({
      id,
      recordId,
      fileName: file.name,
      mimeType: inferMimeType(file),
      size: file.size,
      createdAt: now,
    });
    blobs.push({ id, blob: file });
  }
  return { photos, blobs };
}

// ---------- Travel records ----------

export type PlaceInput =
  | { kind: 'existing'; placeId: string }
  | { kind: 'custom'; customPlaceId: string }
  | { kind: 'newCustom'; name: string; lat: number; lng: number };

export interface RecordInput {
  // Optional: when creating, a missing value means Private; when editing, it keeps the current value.
  visibility?: MemoryVisibility;
  place: PlaceInput;
  visitDate: string | null;
  notes: string;
}

export function validateRecordFields(
  input: Pick<RecordInput, 'visitDate' | 'notes'> & { visibility?: unknown },
): string | null {
  if (input.visibility !== undefined && !isMemoryVisibility(input.visibility)) {
    return 'Please choose who can see this memory.';
  }
  if (input.visitDate !== null && input.visitDate !== '') {
    if (!isValidDateString(input.visitDate)) return 'Please enter a valid visit date.';
    if (input.visitDate > todayString()) return 'The visit date cannot be in the future.';
  }
  if (input.notes.length > LIMITS.NOTES_MAX) {
    return `Notes can be at most ${LIMITS.NOTES_MAX} characters.`;
  }
  return null;
}

function findMatchingCustomPlace(
  draft: ProfileData,
  name: string,
  lat: number,
  lng: number,
): CustomPlace | undefined {
  const target = name.trim().toLowerCase();
  return draft.customPlaces.find(
    (place) =>
      place.name.trim().toLowerCase() === target &&
      Math.abs(place.lat - lat) < 0.0001 &&
      Math.abs(place.lng - lng) < 0.0001,
  );
}

// Turns the form's place choice into a stored PlaceRef (creating a custom place if needed).
function resolvePlaceInput(draft: ProfileData, input: PlaceInput): Result<PlaceRef> {
  if (input.kind === 'existing') {
    if (!placeLookup) return fail('Place data is not ready yet. Please try again.');
    const info = placeLookup(input.placeId);
    if (!info) return fail('This place could not be found.');
    if (!isValidCoordinate(info.lat, info.lng)) {
      return fail('This place has no valid map location. Choose another place or set a confirmed location.');
    }
    return ok({ kind: 'existing', placeId: input.placeId });
  }

  if (input.kind === 'custom') {
    if (!draft.customPlaces.some((place) => place.id === input.customPlaceId)) {
      return fail('This custom place no longer exists. Please choose the location again.');
    }
    return ok({ kind: 'custom', customPlaceId: input.customPlaceId });
  }

  const name = input.name.trim();
  if (!name) return fail('Please enter a name for this place.');
  if (name.length > 100) return fail('Place names can be at most 100 characters.');
  if (!isValidCoordinate(input.lat, input.lng)) return fail('Please confirm a valid map location.');

  const existing = findMatchingCustomPlace(draft, name, input.lat, input.lng);
  if (existing) return ok({ kind: 'custom', customPlaceId: existing.id });

  const created: CustomPlace = {
    id: createId('place'),
    name,
    lat: input.lat,
    lng: input.lng,
    createdAt: new Date().toISOString(),
  };
  draft.customPlaces.push(created);
  return ok({ kind: 'custom', customPlaceId: created.id });
}

export async function createRecord(input: RecordInput, files: File[] = []): Promise<Result<TravelRecord>> {
  const fieldError = validateRecordFields(input);
  if (fieldError) return fail(fieldError);

  const check = validatePhotoFiles(files, 0);
  if (check.rejected.length > 0) return fail(`${check.rejected[0].fileName}: ${check.rejected[0].reason}`);

  const draft = loadDraft();
  if (!draft.ok) return draft;

  const place = resolvePlaceInput(draft.value, input.place);
  if (!place.ok) return place;

  const now = new Date().toISOString();
  const recordId = createId('record');
  const built = buildPhotos(recordId, check.accepted, now);

  const record: TravelRecord = {
    id: recordId,
    place: place.value,
    visitDate: input.visitDate ? input.visitDate : null,
    notes: input.notes,
    visibility: input.visibility ?? DEFAULT_MEMORY_VISIBILITY,
    photoIds: built.photos.map((photo) => photo.id),
    createdAt: now,
    updatedAt: now,
  };

  draft.value.records.push(record);
  draft.value.photos.push(...built.photos);

  const saved = await saveWithNewBlobs(draft.value, built.blobs);
  if (!saved.ok) return saved;
  return ok(record);
}

export interface PhotoChanges {
  addFiles?: File[];
  removePhotoIds?: string[];
}

export async function updateRecord(
  recordId: string,
  input: RecordInput,
  changes: PhotoChanges = {},
): Promise<Result<TravelRecord>> {
  const fieldError = validateRecordFields(input);
  if (fieldError) return fail(fieldError);

  const draftResult = loadDraft();
  if (!draftResult.ok) return draftResult;
  const draft = draftResult.value;

  const index = draft.records.findIndex((record) => record.id === recordId);
  if (index < 0) return fail('This memory could not be found. It may have been deleted.');
  const existing = draft.records[index];

  const removeIds = new Set((changes.removePhotoIds ?? []).filter((id) => existing.photoIds.includes(id)));
  const keptIds = existing.photoIds.filter((id) => !removeIds.has(id));

  const check = validatePhotoFiles(changes.addFiles ?? [], keptIds.length);
  if (check.rejected.length > 0) return fail(`${check.rejected[0].fileName}: ${check.rejected[0].reason}`);

  const place = resolvePlaceInput(draft, input.place);
  if (!place.ok) return place;

  const now = new Date().toISOString();
  const built = buildPhotos(recordId, check.accepted, now);

  // Removed photos go to the Recycle Bin; their files stay in IndexedDB.
  existing.photoIds.forEach((id, originalIndex) => {
    if (!removeIds.has(id)) return;
    const photo = draft.photos.find((item) => item.id === id);
    if (photo) draft.recycleBin.photos.push({ photo, originalIndex, deletedAt: now });
  });
  draft.photos = draft.photos.filter((photo) => !removeIds.has(photo.id)).concat(built.photos);

  const updated: TravelRecord = {
    ...existing,
    place: place.value,
    visitDate: input.visitDate ? input.visitDate : null,
    notes: input.notes,
    visibility: input.visibility ?? existing.visibility,
    photoIds: [...keptIds, ...built.photos.map((photo) => photo.id)],
    updatedAt: now,
  };
  draft.records[index] = updated;
  pruneCustomPlaces(draft);

  const saved = await saveWithNewBlobs(draft, built.blobs);
  if (!saved.ok) return saved;
  return ok(updated);
}

// Moves a record, with its photos and comments, to the Recycle Bin.
export function deleteRecord(recordId: string): Result<void> {
  const draftResult = loadDraft();
  if (!draftResult.ok) return draftResult;
  const draft = draftResult.value;

  const record = draft.records.find((item) => item.id === recordId);
  if (!record) return fail('This memory could not be found. It may already have been deleted.');

  const photos = record.photoIds
    .map((id) => draft.photos.find((photo) => photo.id === id))
    .filter((photo): photo is TravelPhoto => photo !== undefined);

  draft.recycleBin.records.push({ record, photos, deletedAt: new Date().toISOString() });
  draft.records = draft.records.filter((item) => item.id !== recordId);
  draft.photos = draft.photos.filter((photo) => !record.photoIds.includes(photo.id));
  // Comments on a deleted record are removed immediately (no recycle for comments).
  draft.comments = (draft.comments ?? []).filter((c) => c.recordId !== recordId);

  const saved = saveProfileData(draft);
  return saved.ok ? ok(undefined) : saved;
}

// Moves one photo to the Recycle Bin; the record stays active.
export function deletePhoto(recordId: string, photoId: string): Result<void> {
  const draftResult = loadDraft();
  if (!draftResult.ok) return draftResult;
  const draft = draftResult.value;

  const index = draft.records.findIndex((record) => record.id === recordId);
  if (index < 0) return fail('This memory could not be found.');
  const record = draft.records[index];

  const originalIndex = record.photoIds.indexOf(photoId);
  const photo = draft.photos.find((item) => item.id === photoId);
  if (originalIndex < 0 || !photo) return fail('This photo could not be found.');

  const now = new Date().toISOString();
  draft.recycleBin.photos.push({ photo, originalIndex, deletedAt: now });
  draft.photos = draft.photos.filter((item) => item.id !== photoId);
  draft.records[index] = {
    ...record,
    photoIds: record.photoIds.filter((id) => id !== photoId),
    updatedAt: now,
  };

  const saved = saveProfileData(draft);
  return saved.ok ? ok(undefined) : saved;
}

// ---------- Recycle Bin: restore ----------

export interface RestoreRecordResult {
  record: TravelRecord;
  missingPhotoNames: string[]; // photos whose files could not be found or read
}

export async function restoreRecord(recordId: string): Promise<Result<RestoreRecordResult>> {
  const draftResult = loadDraft();
  if (!draftResult.ok) return draftResult;
  const draft = draftResult.value;

  const entryIndex = draft.recycleBin.records.findIndex((entry) => entry.record.id === recordId);
  if (entryIndex < 0) return fail('This memory is no longer in the Recycle Bin.');
  const entry = draft.recycleBin.records[entryIndex];

  // Guard against restoring the same record twice.
  if (draft.records.some((record) => record.id === recordId)) {
    draft.recycleBin.records.splice(entryIndex, 1);
    saveProfileData(draft);
    return fail('This memory has already been restored.');
  }

  const record = entry.record;
  if (record.place.kind === 'custom') {
    const customId = record.place.customPlaceId;
    if (!draft.customPlaces.some((place) => place.id === customId)) {
      return fail('The place for this memory is no longer available, so it cannot be restored.');
    }
  } else {
    const info = placeLookup ? placeLookup(record.place.placeId) : null;
    if (!info || !isValidCoordinate(info.lat, info.lng)) {
      return fail('The place for this memory is no longer available, so it cannot be restored.');
    }
  }

  const photoById = new Map(entry.photos.map((photo) => [photo.id, photo]));
  const stored = await findExistingPhotoIds(record.photoIds);
  if (!stored.ok) return fail(`Photo storage could not be checked, so nothing was restored. ${stored.error}`);

  const restoredPhotos: TravelPhoto[] = [];
  const missingPhotoNames: string[] = [];
  for (const id of record.photoIds) {
    const photo = photoById.get(id);
    if (photo && stored.value.has(id)) restoredPhotos.push(photo);
    else missingPhotoNames.push(photo ? photo.fileName : 'Unknown photo');
  }

  const restored: TravelRecord = {
    ...record,
    photoIds: restoredPhotos.map((photo) => photo.id),
  };

  draft.recycleBin.records.splice(entryIndex, 1);
  draft.records.push(restored);
  draft.photos.push(...restoredPhotos);

  const saved = saveProfileData(draft);
  if (!saved.ok) return saved;
  return ok({ record: restored, missingPhotoNames });
}

export async function restorePhoto(photoId: string): Promise<Result<void>> {
  const draftResult = loadDraft();
  if (!draftResult.ok) return draftResult;
  const draft = draftResult.value;

  const entryIndex = draft.recycleBin.photos.findIndex((entry) => entry.photo.id === photoId);
  if (entryIndex < 0) return fail('This photo is no longer in the Recycle Bin.');
  const entry = draft.recycleBin.photos[entryIndex];

  const recordIndex = draft.records.findIndex((record) => record.id === entry.photo.recordId);
  if (recordIndex < 0) return fail('Restore the memory this photo belonged to first.');
  const record = draft.records[recordIndex];

  if (record.photoIds.includes(photoId)) {
    draft.recycleBin.photos.splice(entryIndex, 1);
    saveProfileData(draft);
    return fail('This photo has already been restored.');
  }
  if (record.photoIds.length >= LIMITS.PHOTOS_PER_RECORD) {
    return fail(`That memory already has ${LIMITS.PHOTOS_PER_RECORD} photos. Remove one before restoring this photo.`);
  }

  const stored = await findExistingPhotoIds([photoId]);
  if (!stored.ok) return fail(`Photo storage could not be checked. ${stored.error}`);
  if (!stored.value.has(photoId)) {
    // The file is gone for good, so remove the empty Recycle Bin entry.
    draft.recycleBin.photos.splice(entryIndex, 1);
    saveProfileData(draft);
    return fail(`"${entry.photo.fileName}" could not be restored because its file is missing.`);
  }

  const photoIds = [...record.photoIds];
  photoIds.splice(Math.min(entry.originalIndex, photoIds.length), 0, photoId);

  draft.recycleBin.photos.splice(entryIndex, 1);
  draft.photos.push(entry.photo);
  draft.records[recordIndex] = { ...record, photoIds, updatedAt: new Date().toISOString() };

  const saved = saveProfileData(draft);
  return saved.ok ? ok(undefined) : saved;
}

export interface RestoreAllSummary {
  restoredRecords: number;
  restoredPhotos: number;
  missingPhotoNames: string[];
  problems: string[];
}

export async function restoreAll(): Promise<Result<RestoreAllSummary>> {
  const snapshot = loadDraft();
  if (!snapshot.ok) return snapshot;

  const recordIds = snapshot.value.recycleBin.records.map((entry) => entry.record.id);
  const photoIds = [...snapshot.value.recycleBin.photos]
    .sort((a, b) => a.originalIndex - b.originalIndex)
    .map((entry) => entry.photo.id);

  const summary: RestoreAllSummary = {
    restoredRecords: 0,
    restoredPhotos: 0,
    missingPhotoNames: [],
    problems: [],
  };

  // Records first, so independently deleted photos can find their record.
  for (const id of recordIds) {
    const result = await restoreRecord(id);
    if (result.ok) {
      summary.restoredRecords += 1;
      summary.missingPhotoNames.push(...result.value.missingPhotoNames);
    } else {
      summary.problems.push(result.error);
    }
  }
  for (const id of photoIds) {
    const result = await restorePhoto(id);
    if (result.ok) summary.restoredPhotos += 1;
    else summary.problems.push(result.error);
  }
  return ok(summary);
}

// ---------- Recycle Bin: permanent deletion ----------

export type PermanentDeleteResult = Result<{ warning?: string }>;

export async function permanentlyDeleteRecycledRecord(recordId: string): Promise<PermanentDeleteResult> {
  const draftResult = loadDraft();
  if (!draftResult.ok) return draftResult;
  const draft = draftResult.value;

  const entry = draft.recycleBin.records.find((item) => item.record.id === recordId);
  if (!entry) return fail('This memory is no longer in the Recycle Bin.');

  // Photos deleted on their own earlier belonged to this record too, so they go with it.
  const ids = new Set<string>([
    ...entry.record.photoIds,
    ...entry.photos.map((photo) => photo.id),
    ...draft.recycleBin.photos.filter((item) => item.photo.recordId === recordId).map((item) => item.photo.id),
  ]);

  draft.recycleBin.records = draft.recycleBin.records.filter((item) => item.record.id !== recordId);
  draft.recycleBin.photos = draft.recycleBin.photos.filter((item) => item.photo.recordId !== recordId);
  pruneCustomPlaces(draft);

  const saved = saveProfileData(draft);
  if (!saved.ok) return saved;

  const warning = await removeUnreferencedBlobs([...ids], saved.value);
  return ok({ warning });
}

export async function permanentlyDeleteRecycledPhoto(photoId: string): Promise<PermanentDeleteResult> {
  const draftResult = loadDraft();
  if (!draftResult.ok) return draftResult;
  const draft = draftResult.value;

  if (!draft.recycleBin.photos.some((item) => item.photo.id === photoId)) {
    return fail('This photo is no longer in the Recycle Bin.');
  }
  draft.recycleBin.photos = draft.recycleBin.photos.filter((item) => item.photo.id !== photoId);

  const saved = saveProfileData(draft);
  if (!saved.ok) return saved;

  const warning = await removeUnreferencedBlobs([photoId], saved.value);
  return ok({ warning });
}

export async function emptyRecycleBin(): Promise<PermanentDeleteResult> {
  const draftResult = loadDraft();
  if (!draftResult.ok) return draftResult;
  const draft = draftResult.value;

  const ids = new Set<string>();
  for (const entry of draft.recycleBin.records) {
    entry.record.photoIds.forEach((id) => ids.add(id));
    entry.photos.forEach((photo) => ids.add(photo.id));
  }
  draft.recycleBin.photos.forEach((entry) => ids.add(entry.photo.id));

  draft.recycleBin = { records: [], photos: [] };
  pruneCustomPlaces(draft);

  const saved = saveProfileData(draft);
  if (!saved.ok) return saved;

  const warning = await removeUnreferencedBlobs([...ids], saved.value);
  return ok({ warning });
}

// ---------- Comments ----------

// Mirrors the canViewMemory rule: owner can always comment; public memories allow anyone;
// friends-only memories require an accepted friendship; private memories are owner-only.
export function canCommentOnRecord(
  record: TravelRecord,
  relation: MemoryViewerRelation,
): boolean {
  if (relation === 'owner') return true;
  switch (record.visibility) {
    case 'public':
      return true;
    case 'friends':
      return relation === 'friend';
    default:
      return false;
  }
}

export function addComment(
  recordId: string,
  authorId: string,
  text: string,
): Result<MemoryComment> {
  const trimmed = text.trim();
  if (!trimmed) return fail('Comment text cannot be empty.');
  if (trimmed.length > LIMITS.COMMENT_TEXT_MAX) {
    return fail(`Comments can be at most ${LIMITS.COMMENT_TEXT_MAX} characters.`);
  }

  const draftResult = loadDraft();
  if (!draftResult.ok) return draftResult;
  const draft = draftResult.value;

  if (!draft.records.some((r) => r.id === recordId)) {
    return fail('This memory could not be found.');
  }

  const existing = draft.comments.filter((c) => c.recordId === recordId);
  if (existing.length >= LIMITS.COMMENTS_PER_RECORD) {
    return fail(`This memory already has ${LIMITS.COMMENTS_PER_RECORD} comments.`);
  }

  const comment: MemoryComment = {
    id: createId('comment'),
    recordId,
    authorId,
    text: trimmed,
    createdAt: new Date().toISOString(),
  };

  draft.comments.push(comment);
  const saved = saveProfileData(draft);
  if (!saved.ok) return saved;
  return ok(comment);
}

// Only the memory owner (i.e. the profile owner, not the comment author) may delete comments.
// The caller is responsible for verifying that the current user is the record owner before calling.
export function deleteComment(commentId: string): Result<void> {
  const draftResult = loadDraft();
  if (!draftResult.ok) return draftResult;
  const draft = draftResult.value;

  if (!draft.comments.some((c) => c.id === commentId)) {
    return fail('This comment could not be found. It may already have been deleted.');
  }

  draft.comments = draft.comments.filter((c) => c.id !== commentId);
  const saved = saveProfileData(draft);
  return saved.ok ? ok(undefined) : saved;
}

// ---------- Reset Profile ----------

// Removes ONLY Profile-owned data. Favorites, itinerary, missions, proofs, badges and
// preferences are never touched. The steps can be repeated safely if one of them fails.
export async function resetProfile(): Promise<Result<void>> {
  // 1. Check that photo storage is reachable before destroying anything.
  const reachable = await listStoredPhotoIds();
  if (!reachable.ok) {
    const loaded = loadProfileData();
    const hasPhotoData =
      !loaded.ok ||
      loaded.value.data.photos.length > 0 ||
      loaded.value.data.recycleBin.photos.length > 0 ||
      loaded.value.data.recycleBin.records.some((entry) => entry.photos.length > 0);
    if (hasPhotoData) {
      return fail(`Photo storage could not be accessed, so nothing was reset. ${reachable.error}`);
    }
    // No photos exist anywhere, so resetting the metadata alone is safe.
    const removedOnly = removeProfileData();
    return removedOnly.ok ? ok(undefined) : removedOnly;
  }

  // 2. Remove the metadata.
  const removed = removeProfileData();
  if (!removed.ok) return fail(`${removed.error} Nothing was reset.`);

  // 3. Remove the photo files. If this fails, Retry repeats steps 1-3 safely.
  const cleared = await clearAllPhotoBlobs();
  if (!cleared.ok) {
    return fail(`Your profile was reset, but some photo files could not be removed. ${cleared.error}`);
  }
  return ok(undefined);
}