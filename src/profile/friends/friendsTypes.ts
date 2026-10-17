// Types, constants and defaults for the Friends demo.
// This is a local demo only: there are no real accounts, no backend and no syncing.

// ---------- Storage identifiers ----------

// Its own key, separate from the Profile data key and from every existing "mhe_*" key.
export const FRIENDS_STORAGE_KEY = 'fusion26_friends_demo_v1';
// Damaged stored data is copied here before the app recovers, so nothing is lost silently.
export const FRIENDS_BACKUP_KEY = 'fusion26_friends_demo_v1_backup';

// ---------- Identities ----------

// "me" stands for your real local Profile. Demo users have their own ids (see demoUsers.ts).
export const ME_ID = 'me';

// ---------- Demo users ----------

// A short travel memory belonging to a demo user. It is fixed demo data written in code:
// it is never read from, or mixed with, the real user's own memories or photos.
export interface DemoMemory {
  id: string;
  placeId: string | null; // an existing Fusion26 place id when known, otherwise null
  placeName: string; // the name to show when the id is missing or cannot be found
  visitDate: string | null; // "YYYY-MM-DD"
  note: string;
}

export interface DemoUser {
  id: string;
  displayName: string;
  username: string;
  bio: string;
  interests: string[];
  avatarId: string; // one of PRESET_AVATAR_IDS
  sampleMemories: DemoMemory[];
}

// ---------- Relationships ----------

export type FriendLinkStatus = 'pending' | 'accepted';

// One link joins two users. A pair of users never has more than one link, in either direction.
export interface FriendLink {
  id: string;
  fromId: string; // the sender of the request
  toId: string; // the recipient of the request
  status: FriendLinkStatus;
  createdAt: string; // ISO timestamp
}

export interface FriendsData {
  version: 1;
  links: FriendLink[];
  updatedAt: string;
}

export function createEmptyFriendsData(): FriendsData {
  return { version: 1, links: [], updatedAt: new Date().toISOString() };
}

// How two users relate, seen from the viewer's side.
export type RelationshipStatus =
  | 'self' // the viewer and the other user are the same person
  | 'none' // no request and not friends: show "Add Friend"
  | 'outgoing' // the viewer sent a request: show "Request Sent"
  | 'incoming' // the other user sent a request: show "Accept Request"
  | 'friends';

// A link together with the user on the other side of it (not the viewer).
export interface FriendLinkEntry {
  link: FriendLink;
  otherId: string;
}

// The same key for a pair no matter which direction it points, used to spot duplicates.
export function pairKeyOf(a: string, b: string): string {
  return [a, b].sort().join('|');
}