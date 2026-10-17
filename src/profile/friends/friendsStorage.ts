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
}

interface Tally {
  dropped: number;
}

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

// ---------- Backup of damaged data ----------

// Keeps the first damaged copy, so a bad read can never silently destroy user data.
function backupRawData(raw: string): void {
  try {
    if (localStorage.getItem(FRIENDS_BACKUP_KEY) === null) {
      localStorage.setItem(FRIENDS_BACKUP_KEY, raw);
    }
  } catch (err) {
    console.error('Could not back up damaged friends data:', err);
  }
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
    backupRawData(raw);
    return ok({
      data: createEmptyFriendsData(),
      status: 'recovered',
      message: 'Saved friends data was damaged and could not be read. A fresh friends list was started.',
    });
  }

  if (!isObject(parsed) || parsed.version !== 1) {
    backupRawData(raw);
    return ok({
      data: createEmptyFriendsData(),
      status: 'recovered',
      message: 'Saved friends data was in an unknown format. A fresh friends list was started.',
    });
  }

  const tally: Tally = { dropped: 0 };
  const data: FriendsData = {
    version: 1,
    links: sanitizeLinks(parsed.links, tally),
    updatedAt: isValidTimestamp(parsed.updatedAt) ? parsed.updatedAt : new Date().toISOString(),
  };

  if (tally.dropped > 0) {
    backupRawData(raw);
    return ok({
      data,
      status: 'recovered',
      message: `${tally.dropped} damaged or duplicate item(s) in your saved friends data were ignored.`,
    });
  }

  return ok({ data, status: 'ok' });
}

// Writes everything in one setItem call, then reads it back, so success is only reported when
// the browser really kept the data. Returns the saved data with its new updatedAt stamp.
export function saveFriendsData(data: FriendsData): Result<FriendsData> {
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

// Removes ONLY the Friends demo keys. Not used yet: the reset stage will decide when to call it.
export function removeFriendsData(): Result<void> {
  try {
    localStorage.removeItem(FRIENDS_STORAGE_KEY);
    localStorage.removeItem(FRIENDS_BACKUP_KEY);
    return ok(undefined);
  } catch (err) {
    console.error('Failed to remove friends data:', err);
    return fail('Friends data could not be removed from browser storage.');
  }
}