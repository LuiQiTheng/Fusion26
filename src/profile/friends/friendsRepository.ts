// Friends repository: the only module the UI should call for friend requests and friendships.
// Every change re-reads the stored data first, checks the rules, then saves. The functions
// never throw: they return a Result, so the UI can show a clear message.
//
// Rules: no self-friendship; one link per pair of users; only the recipient can accept or
// reject; only the sender can cancel; only an accepted friendship can be removed.

import { Result, ok, fail } from '../types';
import {
  FriendLink,
  FriendLinkEntry,
  FriendsData,
  RelationshipStatus,
  pairKeyOf,
} from './friendsTypes';
import { FriendsLoadOutcome, loadFriendsData, saveFriendsData } from './friendsStorage';
import { isKnownUserId } from './demoUsers';

// ---------- Small helpers ----------

function createLinkId(): string {
  const random =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  return `link_${random}`;
}

// A fresh copy of the stored data, so a failed change never alters what the caller holds.
function loadDraft(): Result<FriendsData> {
  const loaded = loadFriendsData();
  if (!loaded.ok) return fail(loaded.error);
  const { data } = loaded.value;
  return ok({ ...data, links: data.links.map((link) => ({ ...link })) });
}

function findPairLink(links: FriendLink[], a: string, b: string): FriendLink | undefined {
  const key = pairKeyOf(a, b);
  return links.find((link) => pairKeyOf(link.fromId, link.toId) === key);
}

// Loads fresh data and finds one link by id. A missing link means the screen is out of date,
// for example the request was answered in another tab or by another demo user.
function loadLink(viewerId: string, linkId: string): Result<{ data: FriendsData; link: FriendLink }> {
  if (!isKnownUserId(viewerId)) return fail('This user could not be found.');

  const draft = loadDraft();
  if (!draft.ok) return draft;

  const link = draft.value.links.find((item) => item.id === linkId);
  if (!link) {
    return fail(
      'This request or friendship no longer exists. It may have been changed in another tab or by another demo user.',
    );
  }
  return ok({ data: draft.value, link });
}

function newestFirst(a: FriendLinkEntry, b: FriendLinkEntry): number {
  return b.link.createdAt.localeCompare(a.link.createdAt) || b.link.id.localeCompare(a.link.id);
}

// ---------- Reading ----------

// Loads the stored friends data (validated). The outcome says if it was fresh or recovered.
export function loadFriends(): Result<FriendsLoadOutcome> {
  return loadFriendsData();
}

// How the other user relates to the viewer: self, none, outgoing, incoming or friends.
export function getRelationshipStatus(
  data: FriendsData,
  viewerId: string,
  otherId: string,
): RelationshipStatus {
  if (viewerId === otherId) return 'self';
  const link = findPairLink(data.links, viewerId, otherId);
  if (!link) return 'none';
  if (link.status === 'accepted') return 'friends';
  return link.fromId === viewerId ? 'outgoing' : 'incoming';
}

// Pending requests other users sent to the viewer, newest first.
export function getIncomingRequests(data: FriendsData, viewerId: string): FriendLinkEntry[] {
  return data.links
    .filter((link) => link.status === 'pending' && link.toId === viewerId)
    .map((link) => ({ link, otherId: link.fromId }))
    .sort(newestFirst);
}

// Pending requests the viewer sent, newest first.
export function getOutgoingRequests(data: FriendsData, viewerId: string): FriendLinkEntry[] {
  return data.links
    .filter((link) => link.status === 'pending' && link.fromId === viewerId)
    .map((link) => ({ link, otherId: link.toId }))
    .sort(newestFirst);
}

// The viewer's accepted friends, newest first.
export function getAcceptedFriends(data: FriendsData, viewerId: string): FriendLinkEntry[] {
  return data.links
    .filter((link) => link.status === 'accepted' && (link.fromId === viewerId || link.toId === viewerId))
    .map((link) => ({ link, otherId: link.fromId === viewerId ? link.toId : link.fromId }))
    .sort(newestFirst);
}

// ---------- Changing ----------
// Each change returns the saved data on success. The UI should show the returned data.

export function sendFriendRequest(senderId: string, recipientId: string): Result<FriendsData> {
  if (!isKnownUserId(senderId) || !isKnownUserId(recipientId)) {
    return fail('This user could not be found.');
  }
  if (senderId === recipientId) return fail('You cannot add yourself as a friend.');

  const draft = loadDraft();
  if (!draft.ok) return draft;
  const data = draft.value;

  const existing = findPairLink(data.links, senderId, recipientId);
  if (existing) {
    if (existing.status === 'accepted') return fail('You are already friends.');
    if (existing.fromId === senderId) return fail('A friend request has already been sent.');
    return fail('This user has already sent you a request. Accept it instead.');
  }

  data.links.push({
    id: createLinkId(),
    fromId: senderId,
    toId: recipientId,
    status: 'pending',
    createdAt: new Date().toISOString(),
  });
  return saveFriendsData(data);
}

export function acceptFriendRequest(viewerId: string, linkId: string): Result<FriendsData> {
  const found = loadLink(viewerId, linkId);
  if (!found.ok) return found;
  const { data, link } = found.value;

  if (link.status === 'accepted') return fail('This request was already accepted.');
  if (link.toId !== viewerId) return fail('Only the person who received a request can accept it.');

  link.status = 'accepted';
  return saveFriendsData(data);
}

export function rejectFriendRequest(viewerId: string, linkId: string): Result<FriendsData> {
  const found = loadLink(viewerId, linkId);
  if (!found.ok) return found;
  const { data, link } = found.value;

  if (link.status !== 'pending') {
    return fail('Only a pending request can be rejected. This one has already been accepted.');
  }
  if (link.toId !== viewerId) return fail('Only the person who received a request can reject it.');

  data.links = data.links.filter((item) => item.id !== link.id);
  return saveFriendsData(data);
}

export function cancelFriendRequest(viewerId: string, linkId: string): Result<FriendsData> {
  const found = loadLink(viewerId, linkId);
  if (!found.ok) return found;
  const { data, link } = found.value;

  if (link.status !== 'pending') {
    return fail('This request has already been accepted, so it cannot be cancelled. Remove the friend instead.');
  }
  if (link.fromId !== viewerId) return fail('Only the person who sent a request can cancel it.');

  data.links = data.links.filter((item) => item.id !== link.id);
  return saveFriendsData(data);
}

export function removeFriend(viewerId: string, linkId: string): Result<FriendsData> {
  const found = loadLink(viewerId, linkId);
  if (!found.ok) return found;
  const { data, link } = found.value;

  if (link.status !== 'accepted') {
    return fail('Only an accepted friendship can be removed. Use Cancel or Reject for a request.');
  }
  if (link.fromId !== viewerId && link.toId !== viewerId) {
    return fail('You can only remove your own friends.');
  }

  data.links = data.links.filter((item) => item.id !== link.id);
  return saveFriendsData(data);
}