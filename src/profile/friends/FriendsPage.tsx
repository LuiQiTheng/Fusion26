import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowLeft, Check, Info, RefreshCw, Search, Users, X } from 'lucide-react';
import { HeritagePlace } from '../../types';
import { Result, UserProfile, fail } from '../types';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { formatVisitDate } from '../memoryUtils';
import { DEMO_USERS, getDemoUser } from './demoUsers';
import { DemoIdentityBar } from './DemoIdentityBar';
import { FriendCardAction, FriendCardUser, FriendUserCard } from './FriendUserCard';
import { FriendLinkEntry, FriendsData, ME_ID, pairKeyOf } from './friendsTypes';
import {
  acceptFriendRequest,
  cancelFriendRequest,
  getAcceptedFriends,
  getIncomingRequests,
  getOutgoingRequests,
  getRelationshipStatus,
  loadFriends,
  rejectFriendRequest,
  removeFriend,
  sendFriendRequest,
} from './friendsRepository';

interface FriendsPageProps {
  profile: UserProfile; // the real local Profile, shown as "You"
  places: HeritagePlace[]; // existing Fusion26 places, used to name the sample memories' places
}

type Tab = 'discover' | 'requests' | 'friends';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'ready'; data: FriendsData };

interface Notice {
  id: number;
  tone: 'success' | 'error';
  text: string;
}

interface PendingState {
  userId: string;
  action: FriendCardAction;
}

interface RemoveRequest {
  linkId: string;
  userId: string;
  name: string;
}

const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087E83]';
const PANEL = 'rounded-2xl border border-[#087E83]/20 bg-white shadow-sm';

// ---------- Small helpers ----------

function findLink(data: FriendsData, a: string, b: string) {
  const key = pairKeyOf(a, b);
  return data.links.find((link) => pairKeyOf(link.fromId, link.toId) === key);
}

function matchesQuery(user: FriendCardUser, query: string): boolean {
  const q = query.trim().toLowerCase().replace(/^@/, '');
  if (q === '') return true;
  return user.displayName.toLowerCase().includes(q) || user.username.toLowerCase().includes(q);
}

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

// ---------- Small pieces ----------

interface SearchFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

const SearchField: React.FC<SearchFieldProps> = ({ id, label, value, onChange, placeholder }) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="block text-sm font-semibold text-[#0A2F25]">
      {label}
    </label>
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0A2F25]/60"
        aria-hidden="true"
      />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className={`min-h-[44px] w-full rounded-xl border border-[#087E83]/40 bg-white py-2 pl-10 pr-4 text-sm text-[#0A2F25] placeholder:text-[#0A2F25]/50 ${FOCUS}`}
      />
    </div>
  </div>
);

interface EmptyStateProps {
  title: string;
  text: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, text, actionLabel, onAction }) => (
  <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#087E83]/40 bg-white px-6 py-10 text-center">
    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E6F3ED] text-[#087E83]">
      <Users className="h-6 w-6" aria-hidden="true" />
    </span>
    <p className="font-semibold text-[#0A2F25]">{title}</p>
    <p className="max-w-md text-sm text-[#0A2F25]/75">{text}</p>
    {actionLabel && onAction && (
      <button
        type="button"
        onClick={onAction}
        className={`inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#087E83] px-5 py-2 text-sm font-bold text-white hover:bg-[#066468] cursor-pointer ${FOCUS}`}
      >
        {actionLabel}
      </button>
    )}
  </div>
);

// ---------- A friend's profile (read-only) ----------

interface FriendProfileDetailProps {
  user: FriendCardUser;
  placesById: Map<string, HeritagePlace>;
  backLabel: string;
  onBack: () => void;
}

const FriendProfileDetail: React.FC<FriendProfileDetailProps> = ({ user, placesById, backLabel, onBack }) => {
  const headingId = useId();
  const demo = getDemoUser(user.id);
  const isMe = user.id === ME_ID;
  const memories = demo ? demo.sampleMemories : [];
  const placeCount = new Set(memories.map((memory) => memory.placeId ?? memory.placeName.toLowerCase())).size;

  return (
    <article aria-labelledby={headingId} className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#087E83] bg-white px-4 py-2 text-sm font-bold text-[#0A2F25] hover:bg-[#E6F3ED] cursor-pointer ${FOCUS}`}
      >
        <ArrowLeft className="h-4 w-4 text-[#087E83]" aria-hidden="true" />
        {backLabel}
      </button>

      <div
        role="note"
        className="flex items-start gap-3 rounded-xl border border-[#087E83]/20 border-l-4 border-l-[#B88E18] bg-white p-4 text-sm text-[#0A2F25]"
      >
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#087E83]" aria-hidden="true" />
        <p>
          <span className="font-bold">Read-only.</span> You are looking at {user.displayName}'s profile as a
          friend. You can view it but not change it.
          {demo && ' This is a demo user, so everything here is sample data.'}
        </p>
      </div>

      <section className={`${PANEL} space-y-4 p-5 sm:p-6`}>
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-start sm:text-left">
          <ProfileAvatar avatarId={user.avatarId} size="xl" label={`Avatar of ${user.displayName}`} />
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <h2 id={headingId} className="break-words font-serif text-2xl font-bold text-[#0A2F25]">
                {user.displayName}
              </h2>
              <p className="break-all text-sm text-[#087E83]">@{user.username}</p>
            </div>
            {user.bio ? (
              <p className="whitespace-pre-line break-words text-sm text-[#0A2F25]/85">{user.bio}</p>
            ) : (
              <p className="text-sm italic text-[#0A2F25]/60">No bio yet.</p>
            )}
            {user.interests.length > 0 && (
              <ul
                aria-label={`Interests of ${user.displayName}`}
                className="flex flex-wrap justify-center gap-2 sm:justify-start"
              >
                {user.interests.map((interest) => (
                  <li
                    key={interest}
                    className="rounded-full border border-[#087E83]/25 bg-[#E6F3ED] px-3 py-1 text-xs font-semibold text-[#0A2F25]"
                  >
                    {interest}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {demo && (
        <section aria-labelledby={`${headingId}-memories`} className={`${PANEL} space-y-4 p-5 sm:p-6`}>
          <h3 id={`${headingId}-memories`} className="font-serif text-lg font-bold text-[#0A2F25]">
            Travel information
          </h3>

          <dl className="grid grid-cols-2 gap-3 sm:max-w-md">
            <div className="rounded-xl bg-[#E6F3ED] p-3 text-center">
              <dd className="font-serif text-xl font-bold text-[#0A2F25]">{placeCount}</dd>
              <dt className="text-xs text-[#0A2F25]/75">Places visited</dt>
            </div>
            <div className="rounded-xl bg-[#E6F3ED] p-3 text-center">
              <dd className="font-serif text-xl font-bold text-[#0A2F25]">{memories.length}</dd>
              <dt className="text-xs text-[#0A2F25]/75">Sample memories</dt>
            </div>
          </dl>

          <ul aria-label={`Sample memories of ${user.displayName}`} className="space-y-3">
            {memories.map((memory) => {
              const place = memory.placeId ? placesById.get(memory.placeId) : undefined;
              return (
                <li key={memory.id} className="space-y-1 rounded-xl border border-[#087E83]/15 bg-[#F4F9F6] p-4">
                  <h4 className="break-words font-semibold text-[#0A2F25]">{place?.name ?? memory.placeName}</h4>
                  {place?.locality && <p className="text-xs text-[#0A2F25]/70">{place.locality}</p>}
                  <p className="text-xs font-semibold text-[#087E83]">{formatVisitDate(memory.visitDate)}</p>
                  {memory.note && <p className="text-sm text-[#0A2F25]/85">{memory.note}</p>}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {isMe && (
        <p className="rounded-xl bg-[#E6F3ED] p-4 text-sm text-[#0A2F25]">
          This is the real profile on this device. Its memories and photos are private and are never shown in the
          demo.
        </p>
      )}
    </article>
  );
};

// ---------- Page ----------

export const FriendsPage: React.FC<FriendsPageProps> = ({ profile, places }) => {
  const uid = useId();

  const [load, setLoad] = useState<LoadState>({ status: 'loading' });
  // Kept in state because only the first read reports the repair; later reads return plain "ok".
  const [recoveryNote, setRecoveryNote] = useState<string | null>(null);

  // Demo identity: page state only. It is never saved, so leaving this page returns to "You".
  const [actingAsId, setActingAsId] = useState<string>(ME_ID);
  const [tab, setTab] = useState<Tab>('discover');
  const [discoverQuery, setDiscoverQuery] = useState('');
  const [friendsQuery, setFriendsQuery] = useState('');
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [pending, setPending] = useState<PendingState | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<RemoveRequest | null>(null);

  const busyRef = useRef(false);
  const noticeRef = useRef<HTMLDivElement>(null);
  const noticeCounter = useRef(0);

  // ---------- Loading ----------

  // quiet = keep showing the current data if reading fails (used after a failed action).
  const refresh = useCallback((quiet: boolean) => {
    const result = loadFriends();
    if (result.ok) {
      setLoad({ status: 'ready', data: result.value.data });
      if (result.value.status === 'recovered' && result.value.message) {
        setRecoveryNote(result.value.message);
      }
    } else if (!quiet) {
      setLoad({ status: 'error', error: result.error });
    }
  }, []);

  useEffect(() => {
    refresh(false);
  }, [refresh]);

  // ---------- People ----------

  const meUser: FriendCardUser = useMemo(
    () => ({
      id: ME_ID,
      displayName: profile.displayName,
      username: profile.username,
      bio: profile.bio,
      interests: profile.interests,
      avatarId: profile.avatarId,
    }),
    [profile],
  );

  const everyone: FriendCardUser[] = useMemo(() => [meUser, ...DEMO_USERS], [meUser]);

  const resolveUser = useCallback(
    (id: string): FriendCardUser | null => (id === ME_ID ? meUser : (getDemoUser(id) ?? null)),
    [meUser],
  );

  const placesById = useMemo(() => new Map(places.map((place) => [place.id, place])), [places]);

  const actingAsMe = actingAsId === ME_ID;
  const actingUser = resolveUser(actingAsId) ?? meUser;
  const who = actingAsMe ? 'You' : actingUser.displayName;
  const whose = actingAsMe ? 'your' : `${actingUser.displayName}'s`;

  const data = load.status === 'ready' ? load.data : null;

  const entriesToUsers = (entries: FriendLinkEntry[]): FriendCardUser[] =>
    entries
      .map((entry) => resolveUser(entry.otherId))
      .filter((user): user is FriendCardUser => user !== null);

  const incoming = data ? getIncomingRequests(data, actingAsId) : [];
  const outgoing = data ? getOutgoingRequests(data, actingAsId) : [];
  const acceptedFriends = data ? getAcceptedFriends(data, actingAsId) : [];

  // ---------- Viewing a friend's profile ----------

  const profileUser = profileUserId ? resolveUser(profileUserId) : null;
  const profileIsFriend =
    data !== null && profileUserId !== null
      ? getRelationshipStatus(data, actingAsId, profileUserId) === 'friends'
      : false;
  const showProfile = profileUser !== null && profileIsFriend;

  // If the friendship ends while a profile is open, return to the lists.
  useEffect(() => {
    if (profileUserId !== null && data !== null && !showProfile) setProfileUserId(null);
  }, [profileUserId, data, showProfile]);

  // ---------- Feedback ----------

  const showNotice = (tone: Notice['tone'], text: string) => {
    noticeCounter.current += 1;
    setNotice({ id: noticeCounter.current, tone, text });
  };

  // The clicked button often disappears (for example after Accept), so keyboard and screen
  // reader users are moved to the result message.
  const noticeId = notice?.id;
  useEffect(() => {
    if (noticeId !== undefined) noticeRef.current?.focus();
  }, [noticeId]);

  // ---------- Actions ----------

  // Runs one repository action. The repository re-reads and re-checks the stored data first, so a
  // stale screen gets a clear message. After a failure the lists are re-read to catch up.
  const runAction = (
    userId: string,
    action: FriendCardAction,
    op: () => Result<FriendsData>,
    successText: string,
  ) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setPending({ userId, action });

    let result: Result<FriendsData>;
    try {
      result = op();
    } catch (err) {
      console.error('Friends action failed unexpectedly:', err);
      result = fail('Something went wrong. Nothing was changed.');
    }

    if (result.ok) {
      setLoad({ status: 'ready', data: result.value });
      showNotice('success', successText);
    } else {
      showNotice('error', result.error);
      refresh(true);
    }

    setPending(null);
    busyRef.current = false;
  };

  const handleIdentityChange = (id: string) => {
    setActingAsId(id);
    setProfileUserId(null);
    setConfirmRemove(null);
    setNotice(null);
  };

  const openProfile = (userId: string) => {
    if (!data || getRelationshipStatus(data, actingAsId, userId) !== 'friends') {
      showNotice('error', 'You can only view the profile of a friend.');
      return;
    }
    setProfileUserId(userId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmRemove = () => {
    const target = confirmRemove;
    if (!target) return;
    setConfirmRemove(null);
    runAction(
      target.userId,
      'remove',
      () => removeFriend(actingAsId, target.linkId),
      `${target.name} removed from ${whose} friends.`,
    );
  };

  // ---------- Cards ----------

  const renderCard = (user: FriendCardUser, current: FriendsData) => {
    const status = getRelationshipStatus(current, actingAsId, user.id);
    const link = findLink(current, actingAsId, user.id);
    const name = user.displayName;

    return (
      <FriendUserCard
        viewerId={actingAsId}
        user={user}
        status={status}
        onAddFriend={() =>
          runAction(user.id, 'add', () => sendFriendRequest(actingAsId, user.id), `Friend request sent to ${name}.`)
        }
        onCancelRequest={
          link
            ? () =>
                runAction(
                  user.id,
                  'cancel',
                  () => cancelFriendRequest(actingAsId, link.id),
                  `Request to ${name} cancelled.`,
                )
            : undefined
        }
        onAcceptRequest={
          link
            ? () =>
                runAction(
                  user.id,
                  'accept',
                  () => acceptFriendRequest(actingAsId, link.id),
                  `${who} and ${name} are now friends.`,
                )
            : undefined
        }
        onRejectRequest={
          link
            ? () =>
                runAction(
                  user.id,
                  'reject',
                  () => rejectFriendRequest(actingAsId, link.id),
                  `Request from ${name} rejected.`,
                )
            : undefined
        }
        onViewProfile={() => openProfile(user.id)}
        onRemoveFriend={link ? () => setConfirmRemove({ linkId: link.id, userId: user.id, name }) : undefined}
        pendingAction={pending && pending.userId === user.id ? pending.action : null}
        disabled={pending !== null}
      />
    );
  };

  const renderCardGrid = (users: FriendCardUser[], current: FriendsData, label: string) => (
    <ul aria-label={label} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {users.map((user) => (
        <li key={user.id} className="h-full">
          {renderCard(user, current)}
        </li>
      ))}
    </ul>
  );

  // ---------- Loading and error states ----------

  if (load.status === 'loading') {
    return (
      <p role="status" className="py-10 text-center text-sm text-[#0A2F25]/75">
        Loading friends...
      </p>
    );
  }

  if (load.status === 'error') {
    return (
      <div role="alert" className={`${PANEL} mx-auto max-w-lg space-y-4 p-6 text-center`}>
        <AlertTriangle className="mx-auto h-8 w-8 text-red-700" aria-hidden="true" />
        <p className="font-semibold text-[#0A2F25]">Friends could not be loaded</p>
        <p className="text-sm text-[#0A2F25]/80">{load.error}</p>
        <button
          type="button"
          onClick={() => refresh(false)}
          className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#087E83] px-5 py-2 text-sm font-bold text-white hover:bg-[#066468] cursor-pointer ${FOCUS}`}
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Retry
        </button>
      </div>
    );
  }

  // ---------- Page content ----------

  const current = load.data;

  const discoverUsers = everyone.filter((user) => user.id !== actingAsId && matchesQuery(user, discoverQuery));
  const friendUsers = entriesToUsers(acceptedFriends).filter((user) => matchesQuery(user, friendsQuery));
  const incomingUsers = entriesToUsers(incoming);
  const outgoingUsers = entriesToUsers(outgoing);

  const tabs: { id: Tab; label: string; count: number | null }[] = [
    { id: 'discover', label: 'Discover people', count: null },
    { id: 'requests', label: 'Friend requests', count: incoming.length },
    { id: 'friends', label: 'My friends', count: null },
  ];

  const backLabel =
    tab === 'friends' ? 'Back to My friends' : tab === 'requests' ? 'Back to Friend requests' : 'Back to Discover people';

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold text-[#0A2F25] sm:text-3xl">Friends</h1>

      <DemoIdentityBar
        actingAsId={actingAsId}
        onChange={handleIdentityChange}
        meDisplayName={profile.displayName}
        disabled={pending !== null}
      />

      {recoveryNote && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-[#087E83]/20 border-l-4 border-l-[#B88E18] bg-white p-4 text-sm text-[#0A2F25]"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#B88E18]" aria-hidden="true" />
          <p className="flex-1">{recoveryNote}</p>
          <button
            type="button"
            onClick={() => setRecoveryNote(null)}
            aria-label="Dismiss notice"
            className={`-m-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[#0A2F25]/70 hover:text-[#0A2F25] cursor-pointer ${FOCUS}`}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {notice && (
        <div
          ref={noticeRef}
          tabIndex={-1}
          role={notice.tone === 'error' ? 'alert' : 'status'}
          className={`flex items-start gap-3 rounded-xl border p-4 text-sm focus:outline-none ${
            notice.tone === 'error'
              ? 'border-red-700/40 bg-red-50 text-red-900'
              : 'border-[#087E83]/40 bg-[#E6F3ED] text-[#0A2F25]'
          }`}
        >
          {notice.tone === 'error' ? (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-700" aria-hidden="true" />
          ) : (
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#087E83]" aria-hidden="true" />
          )}
          <p className="flex-1 break-words">{notice.text}</p>
          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Dismiss message"
            className={`-m-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg opacity-70 hover:opacity-100 cursor-pointer ${FOCUS}`}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {showProfile && profileUser ? (
        <FriendProfileDetail
          user={profileUser}
          placesById={placesById}
          backLabel={backLabel}
          onBack={() => setProfileUserId(null)}
        />
      ) : (
        <>
          <nav aria-label="Friends sections" className="flex flex-wrap gap-2">
            {tabs.map((item) => {
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold cursor-pointer ${
                    active
                      ? 'bg-[#087E83] text-white'
                      : 'border border-[#087E83]/40 bg-white text-[#0A2F25] hover:bg-[#E6F3ED]'
                  } ${FOCUS}`}
                >
                  {item.label}
                  {item.count !== null && item.count > 0 && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        active ? 'bg-white text-[#0A2F25]' : 'bg-[#E6F3ED] text-[#0A2F25]'
                      }`}
                    >
                      {item.count}
                      <span className="sr-only">{item.id === 'requests' ? ' incoming' : ''}</span>
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Discover people */}
          {tab === 'discover' && (
            <section aria-labelledby={`${uid}-discover`} className="space-y-4">
              <h2 id={`${uid}-discover`} className="font-serif text-xl font-bold text-[#0A2F25]">
                Discover people
              </h2>
              <p className="text-sm text-[#0A2F25]/75">
                Everyone here is a demo user or your own profile. Search by display name or username.
              </p>

              <SearchField
                id={`${uid}-discover-search`}
                label="Search people"
                value={discoverQuery}
                onChange={setDiscoverQuery}
                placeholder="Display name or @username"
              />
              <p role="status" className="sr-only">
                {plural(discoverUsers.length, 'person', 'people')} found
              </p>

              {discoverUsers.length === 0 ? (
                <EmptyState
                  title="No people match your search"
                  text={`Nobody matches "${discoverQuery.trim()}". Try a different name or username.`}
                  actionLabel="Clear search"
                  onAction={() => setDiscoverQuery('')}
                />
              ) : (
                renderCardGrid(discoverUsers, current, 'People you can add')
              )}
            </section>
          )}

          {/* Friend requests */}
          {tab === 'requests' && (
            <div className="space-y-8">
              <section aria-labelledby={`${uid}-incoming`} className="space-y-4">
                <h2 id={`${uid}-incoming`} className="font-serif text-xl font-bold text-[#0A2F25]">
                  Incoming requests{' '}
                  <span className="text-sm font-normal text-[#0A2F25]/70">({incoming.length})</span>
                </h2>
                {incomingUsers.length === 0 ? (
                  <EmptyState
                    title="No incoming requests"
                    text={
                      actingAsMe
                        ? 'Tip: switch to a demo user above, send a request to your profile, then switch back to see it here.'
                        : `${actingUser.displayName} has no incoming requests. Switch to another identity, send one, then switch back.`
                    }
                  />
                ) : (
                  renderCardGrid(incomingUsers, current, 'Incoming friend requests')
                )}
              </section>

              <section aria-labelledby={`${uid}-outgoing`} className="space-y-4">
                <h2 id={`${uid}-outgoing`} className="font-serif text-xl font-bold text-[#0A2F25]">
                  Outgoing requests{' '}
                  <span className="text-sm font-normal text-[#0A2F25]/70">({outgoing.length})</span>
                </h2>
                {outgoingUsers.length === 0 ? (
                  <EmptyState
                    title="No outgoing requests"
                    text="Requests you send will wait here until the other person answers."
                    actionLabel="Discover people"
                    onAction={() => setTab('discover')}
                  />
                ) : (
                  renderCardGrid(outgoingUsers, current, 'Outgoing friend requests')
                )}
              </section>
            </div>
          )}

          {/* My friends */}
          {tab === 'friends' && (
            <section aria-labelledby={`${uid}-friends`} className="space-y-4">
              <h2 id={`${uid}-friends`} className="font-serif text-xl font-bold text-[#0A2F25]">
                My friends <span className="text-sm font-normal text-[#0A2F25]/70">({acceptedFriends.length})</span>
              </h2>

              {acceptedFriends.length === 0 ? (
                <EmptyState
                  title="No friends yet"
                  text={`${who === 'You' ? 'You have' : `${who} has`} no friends yet. Send a request and have it accepted to see friends here.`}
                  actionLabel="Discover people"
                  onAction={() => setTab('discover')}
                />
              ) : (
                <>
                  <SearchField
                    id={`${uid}-friends-search`}
                    label="Search my friends"
                    value={friendsQuery}
                    onChange={setFriendsQuery}
                    placeholder="Display name or @username"
                  />
                  <p role="status" className="sr-only">
                    {plural(friendUsers.length, 'friend', 'friends')} found
                  </p>
                  {friendUsers.length === 0 ? (
                    <EmptyState
                      title="No friends match your search"
                      text={`None of ${whose} friends match "${friendsQuery.trim()}".`}
                      actionLabel="Clear search"
                      onAction={() => setFriendsQuery('')}
                    />
                  ) : (
                    renderCardGrid(friendUsers, current, 'Friends')
                  )}
                </>
              )}
            </section>
          )}
        </>
      )}

      <ConfirmDialog
        open={confirmRemove !== null}
        title="Remove friend?"
        confirmLabel="Remove Friend"
        cancelLabel="Keep Friend"
        tone="danger"
        onConfirm={handleConfirmRemove}
        onCancel={() => setConfirmRemove(null)}
      >
        <p>
          {confirmRemove
            ? `${confirmRemove.name} will be removed from ${whose} friends. This ends the friendship for both people. Either of you can send a new request later.`
            : ''}
        </p>
      </ConfirmDialog>
    </div>
  );
};