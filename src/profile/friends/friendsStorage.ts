// localStorage layer for the Friends demo. It only reads and writes its own keys
// (see friendsTypes.ts) and never touches Profile data or any existing "mhe_*" key.

import { Result, ok, fail } from '../types';
import {
  FRIENDS_BACKUP_KEY,
  FRIENDS_STORAGE_KEY,
  FriendLink,
  FriendLinkStatus,
  FriendsData,
  createEmptyFriendsData,
  pairKeyOf,
} from './friendsTypes';
import { isKnownUserId } from './demoUsers';

export type FriendsLoadStatus = 'ok' | 'fresh' | 'recovered';

export interface FriendsLoadOutcome {
  data: FriendsData;
  status: FriendsLoadStatus; // fresh = nothing saved yet; recovered = stored data was damaged
  message?: string;
  // Only set when status is 'recovered'.
  // true  = the clean data was saved and the damaged original is safely backed up.
  // false = the clean data exists only in memory and the stored original was left untouched,
  //         so the same recovery will happen again on the next load.
  recoveryPersisted?: boolean;
}

interface Tally {
  dropped: number;
}

// A second backup slot. The first slot (FRIENDS_BACKUP_KEY) keeps the first damaged copy and
// is never overwritten; a newer, different damaged copy goes here.
const FRIENDS_BACKUP_LATEST_KEY = `${FRIENDS_BACKUP_KEY}_latest`;

const NOT_CLEANED_NOTE =
  ' The damaged data could not be replaced yet, so this notice may appear again.';

// ---------- Checks (stored data is untrusted) ----------

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStatus(value: unknown): value is FriendLinkStatus {
  return value === 'pending' || value === 'accepted';
}

function isValidTimestamp(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(new Date(value).getTime());
}

// Returns a clean link, or null if anything about it is invalid.
function sanitizeLink(value: unknown): FriendLink | null {
  if (!isObject(value)) return null;
  const { id, fromId, toId, status, createdAt } = value;

  if (typeof id !== 'string' || id.trim() === '') return null;
  if (typeof fromId !== 'string' || typeof toId !== 'string') return null;
  if (!isKnownUserId(fromId) || !isKnownUserId(toId)) return null; // unknown user ids
  if (fromId === toId) return null; // self-link
  if (!isStatus(status)) return null;
  if (!isValidTimestamp(createdAt)) return null;

  return { id, fromId, toId, status, createdAt };
}

// Keeps at most one link per pair of users. If a pair has both a pending and an accepted
// link, the accepted one wins. Links with a repeated id are dropped.
function sanitizeLinks(value: unknown, tally: Tally): FriendLink[] {
  if (!Array.isArray(value)) {
    tally.dropped += 1;
    return [];
  }

  const byPair = new Map<string, FriendLink>();
  const seenIds = new Set<string>();

  for (const item of value) {
    const link = sanitizeLink(item);
    if (!link || seenIds.has(link.id)) {
      tally.dropped += 1;
      continue;
    }

    const key = pairKeyOf(link.fromId, link.toId);
    const existing = byPair.get(key);

    if (!existing) {
      byPair.set(key, link);
      seenIds.add(link.id);
    } else if (existing.status === 'pending' && link.status === 'accepted') {
      seenIds.delete(existing.id);
      byPair.set(key, link);
      seenIds.add(link.id);
      tally.dropped += 1;
    } else {
      tally.dropped += 1; // a duplicate pair
    }
  }

  return [...byPair.values()];
}

// Returns the data when the stored text is fully valid, or null when it is damaged in any way.
// Uses the same checks as loadFriendsData, so "damaged" means the same thing in both places.
function parseCleanData(raw: string): FriendsData | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isObject(parsed) || parsed.version !== 1) return null;

  const tally: Tally = { dropped: 0 };
  const links = sanitizeLinks(parsed.links, tally);
  if (tally.dropped > 0) return null;

  return {
    version: 1,
    links,
    updatedAt: isValidTimestamp(parsed.updatedAt) ? parsed.updatedAt : new Date().toISOString(),
  };
}

// ---------- Backup of damaged data ----------

// Returns true only when this exact damaged text is safely kept in a backup slot.
// The first slot is never overwritten. If it already holds a different copy, the second
// slot is used, so a newer damaged copy can always be backed up without losing the first.
function backupRawData(raw: string): boolean {
  try {
    const first = localStorage.getItem(FRIENDS_BACKUP_KEY);
    if (first === null) {
      localStorage.setItem(FRIENDS_BACKUP_KEY, raw);
      return localStorage.getItem(FRIENDS_BACKUP_KEY) === raw;
    }
    if (first === raw) return true;

    if (localStorage.getItem(FRIENDS_BACKUP_LATEST_KEY) !== raw) {
      localStorage.setItem(FRIENDS_BACKUP_LATEST_KEY, raw);
    }
    return localStorage.getItem(FRIENDS_BACKUP_LATEST_KEY) === raw;
  } catch (err) {
    console.error('Could not back up damaged friends data:', err);
    return false;
  }
}

// Stored damaged text may only be replaced once it is safely backed up. This runs before
// every save, so no caller can overwrite damaged data without a verified backup.
function checkSafeToOverwrite(): Result<void> {
  let raw: string | null;
  try {
    raw = localStorage.getItem(FRIENDS_STORAGE_KEY);
  } catch (err) {
    console.error('Local storage is unavailable:', err);
    return fail('Your browser storage is unavailable, so your change could not be saved.');
  }

  if (raw === null || parseCleanData(raw) !== null) return ok(undefined);
  if (backupRawData(raw)) return ok(undefined);

  return fail(
    'Saved friends data is damaged and could not be backed up first, so nothing was changed. Please try again.',
  );
}

// Tries to store the clean recovered data. saveFriendsData backs up the damaged original first
// and refuses to replace it if it cannot, so recoveryPersisted is only true when both worked.
function recoveredOutcome(data: FriendsData, message: string): Result<FriendsLoadOutcome> {
  const result = saveFriendsData(data);
  if (result.ok) {
    return ok({ data: result.value, status: 'recovered', message, recoveryPersisted: true });
  }
  return ok({
    data,
    status: 'recovered',
    message: message + NOT_CLEANED_NOTE,
    recoveryPersisted: false,
  });
}

// ---------- Public API ----------

export function loadFriendsData(): Result<FriendsLoadOutcome> {
  let raw: string | null;
  try {
    raw = localStorage.getItem(FRIENDS_STORAGE_KEY);
  } catch (err) {
    console.error('Local storage is unavailable:', err);
    return fail('Your browser storage is unavailable, so friends data cannot be loaded.');
  }

  if (raw === null) {
    return ok({ data: createEmptyFriendsData(), status: 'fresh' });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error('Stored friends data is not valid JSON:', err);
    return recoveredOutcome(
      createEmptyFriendsData(),
      'Saved friends data was damaged and could not be read. A fresh friends list was started.',
    );
  }

  if (!isObject(parsed) || parsed.version !== 1) {
    return recoveredOutcome(
      createEmptyFriendsData(),
      'Saved friends data was in an unknown format. A fresh friends list was started.',
    );
  }

  const tally: Tally = { dropped: 0 };
  const data: FriendsData = {
    version: 1,
    links: sanitizeLinks(parsed.links, tally),
    updatedAt: isValidTimestamp(parsed.updatedAt) ? parsed.updatedAt : new Date().toISOString(),
  };

  if (tally.dropped > 0) {
    return recoveredOutcome(
      data,
      `${tally.dropped} damaged or duplicate item(s) in your saved friends data were ignored.`,
    );
  }

  return ok({ data, status: 'ok' });
}

// Writes everything in one setItem call, then reads it back, so success is only reported when
// the browser really kept the data. Damaged stored text is backed up first (see above).
// Returns the saved data with its new updatedAt stamp.
export function saveFriendsData(data: FriendsData): Result<FriendsData> {
  const safe = checkSafeToOverwrite();
  if (!safe.ok) return safe;

  const stamped: FriendsData = { ...data, updatedAt: new Date().toISOString() };
  const json = JSON.stringify(stamped);

  try {
    localStorage.setItem(FRIENDS_STORAGE_KEY, json);
    if (localStorage.getItem(FRIENDS_STORAGE_KEY) !== json) {
      return fail('Your browser did not keep the saved friends data. Please try again.');
    }
    return ok(stamped);
  } catch (err) {
    console.error('Failed to save friends data:', err);
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      return fail('Browser storage is full, so your change could not be saved.');
    }
    return fail('Your change could not be saved to browser storage.');
  }
}

// Removes ONLY the Friends demo keys, including both backup slots.
// Not used yet: the reset stage will decide when to call it.
export function removeFriendsData(): Result<void> {
  try {
    localStorage.removeItem(FRIENDS_STORAGE_KEY);
    localStorage.removeItem(FRIENDS_BACKUP_KEY);
    localStorage.removeItem(FRIENDS_BACKUP_LATEST_KEY);
    return ok(undefined);
  } catch (err) {
    console.error('Failed to remove friends data:', err);
    return fail('Friends data could not be removed from browser storage.');
  }
}