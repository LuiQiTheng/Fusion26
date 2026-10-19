import React, { useEffect, useState } from 'react';
import {
  Pencil,
  Settings,
  Heart,
  Briefcase,
  Map as MapIcon,
  Camera,
  MapPin,
  Calendar,
  Plus,
  ChevronRight,
  Users,
} from 'lucide-react';
import { ProfileData, TravelRecord } from '../types';
import { getRecentRecords, getVisitedPlaceCount, resolvePlace } from '../profileRepository';
import { loadPhotoBlob } from '../photoDb';
import { ProfileAvatar } from '../components/ProfileAvatar';

// Where a click on the Overview should lead. ProfilePage decides what each target opens.
export type OverviewTarget =
  | 'edit-profile'
  | 'settings'
  | 'wishlist'
  | 'my-trips'
  | 'map'
  | 'memories'
  | 'add-memory'
  | 'friends';

interface ProfileOverviewPageProps {
  data: ProfileData;
  savedPlacesCount: number; // distinct currently favorited places (from existing Favorites)
  tripsCount: number; // 1 if a saved itinerary exists in storage, otherwise 0
  onNavigate: (target: OverviewTarget) => void;
  onOpenMemory: (recordId: string) => void;
}

const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087E83]';
const CARD =
  'rounded-2xl border border-[#087E83]/20 bg-white shadow-sm';

// "2025-03-14" -> "14 Mar 2025". Built from the parts so time zones cannot shift the day.
function formatVisitDate(value: string | null): string {
  if (!value) return 'Date not set';
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return 'Date not set';
  return date.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Loads one photo from IndexedDB and exposes it as a temporary object URL.
function useCoverUrl(photoId: string | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!photoId) {
      setUrl(null);
      return;
    }
    let cancelled = false;
    let objectUrl: string | null = null;

    loadPhotoBlob(photoId).then((result) => {
      if (cancelled) return;
      if (result.ok && result.value) {
        objectUrl = URL.createObjectURL(result.value);
        setUrl(objectUrl);
      } else {
        setUrl(null);
      }
    });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [photoId]);

  return url;
}

interface StatButtonProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  onClick: () => void;
}

const StatButton: React.FC<StatButtonProps> = ({ label, value, icon, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={`${label}: ${value}. Open ${label}`}
    className={`${CARD} flex min-h-[88px] flex-col items-center justify-center gap-1 px-2 py-4 text-center transition-all hover:border-[#087E83]/50 hover:bg-[#E6F3ED]/80 cursor-pointer ${FOCUS}`}
  >
    <span className="text-[#087E83]">{icon}</span>
    <span className="font-serif text-2xl font-bold text-[#0A2F25]">{value}</span>
    <span className="text-xs font-semibold text-[#0A2F25]/70">{label}</span>
  </button>
);

interface RecentMemoryCardProps {
  record: TravelRecord;
  placeName: string;
  onOpen: () => void;
}

const RecentMemoryCard: React.FC<RecentMemoryCardProps> = ({ record, placeName, onOpen }) => {
  const coverUrl = useCoverUrl(record.photoIds[0]);

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`${CARD} overflow-hidden text-left transition-all hover:border-[#087E83]/50 hover:bg-[#E6F3ED]/80 cursor-pointer ${FOCUS}`}
    >
      <div className="flex h-36 w-full items-center justify-center bg-[#E6F3ED]">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={`Cover photo for your memory at ${placeName}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <Camera className="h-8 w-8 text-[#D4AF37]/40" aria-hidden="true" />
        )}
      </div>
      <div className="space-y-1.5 p-4">
        <h3 className="flex items-center gap-1.5 font-semibold text-[#0A2F25]">
          <MapPin className="h-4 w-4 shrink-0 text-[#D4AF37]" aria-hidden="true" />
          <span className="truncate">{placeName}</span>
        </h3>
        <p className="flex items-center gap-1.5 text-xs text-[#0A2F25]/60">
          <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {formatVisitDate(record.visitDate)}
          {record.photoIds.length > 0 && (
            <span>
              {' '}
              · {record.photoIds.length} {record.photoIds.length === 1 ? 'photo' : 'photos'}
            </span>
          )}
        </p>
        {record.notes && <p className="line-clamp-2 text-sm text-[#0A2F25]/75">{record.notes}</p>}
      </div>
    </button>
  );
};

const FEATURE_CARDS: {
  target: OverviewTarget;
  title: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    target: 'wishlist',
    title: 'Wishlist',
    description: 'Places you want to visit',
    icon: <Heart className="h-6 w-6" aria-hidden="true" />,
  },
  {
    target: 'my-trips',
    title: 'My Trips',
    description: 'Your saved itinerary',
    icon: <Briefcase className="h-6 w-6" aria-hidden="true" />,
  },
  {
    target: 'map',
    title: 'Travel Map',
    description: 'Places you have visited',
    icon: <MapIcon className="h-6 w-6" aria-hidden="true" />,
  },
  {
    target: 'memories',
    title: 'Memories',
    description: 'Photos and notes from your travels',
    icon: <Camera className="h-6 w-6" aria-hidden="true" />,
  },
  {
    target: 'friends',
    title: 'Friends',
    description: 'Connect with fellow travellers',
    icon: <Users className="h-6 w-6" aria-hidden="true" />,
  },
];

export const ProfileOverviewPage: React.FC<ProfileOverviewPageProps> = ({
  data,
  savedPlacesCount,
  tripsCount,
  onNavigate,
  onOpenMemory,
}) => {
  const { profile } = data;
  const visitedCount = getVisitedPlaceCount(data);
  const recentRecords = getRecentRecords(data, 3);

  return (
    <div className="space-y-8">
      {/* Profile header */}
      <section aria-label="Profile" className={`${CARD} p-6 sm:p-8`}>
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:text-left">
          <ProfileAvatar
            avatarId={profile.avatarId}
            size="xl"
            label={`Avatar of ${profile.displayName}`}
          />

          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <h1 className="break-words font-serif text-2xl font-bold text-[#0A2F25] sm:text-3xl">
                {profile.displayName}
              </h1>
              <p className="text-sm text-[#087E83]">@{profile.username}</p>
            </div>

            {profile.bio ? (
              <p className="whitespace-pre-line break-words text-sm text-[#0A2F25]/80">{profile.bio}</p>
            ) : (
              <p className="text-sm italic text-[#0A2F25]/50">No bio yet. Add one in Edit Profile.</p>
            )}

            {profile.interests.length > 0 && (
              <ul
                aria-label="Travel interests"
                className="flex flex-wrap justify-center gap-2 sm:justify-start"
              >
                {profile.interests.map((interest) => (
                  <li
                    key={interest}
                    className="rounded-full border border-[#D4AF37]/35 bg-[#087E83]/15 px-3 py-1 text-xs font-semibold text-[#087E83]"
                  >
                    {interest}
                  </li>
                ))}
              </ul>
            )}

            <div className="flex flex-wrap justify-center gap-3 pt-1 sm:justify-start">
              <button
                type="button"
                onClick={() => onNavigate('edit-profile')}
                className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#087E83] px-4 py-2 text-sm font-bold text-white transition-all hover:bg-[#0A2F25] cursor-pointer ${FOCUS}`}
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Edit Profile
              </button>
              <button
                type="button"
                onClick={() => onNavigate('settings')}
                className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#087E83]/25 bg-white px-4 py-2 text-sm font-bold text-[#0A2F25] transition-all hover:border-[#087E83] cursor-pointer ${FOCUS}`}
              >
                <Settings className="h-4 w-4 text-[#087E83]" aria-hidden="true" />
                Settings
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature entry cards */}
      <section aria-label="Profile features" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURE_CARDS.map((card) => (
          <button
            key={card.target}
            type="button"
            onClick={() => onNavigate(card.target)}
            className={`${CARD} group flex min-h-[44px] items-center gap-4 p-5 text-left transition-all hover:border-[#087E83]/50 hover:bg-[#E6F3ED]/80 cursor-pointer ${FOCUS}`}
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#087E83]/20 bg-[#E6F3ED] text-[#087E83]">
              {card.icon}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-[#0A2F25]">{card.title}</span>
              <span className="block text-xs text-[#0A2F25]/60">{card.description}</span>
            </span>
            <ChevronRight
              className="h-4 w-4 shrink-0 text-[#D4AF37]/60 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </button>
        ))}
      </section>

      {/* Recent memories */}
      <section aria-labelledby="recent-memories-heading" className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 id="recent-memories-heading" className="font-serif text-xl font-bold text-[#0A2F25]">
            Recent Memories
          </h2>
          {recentRecords.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigate('memories')}
              className={`inline-flex min-h-[44px] items-center gap-1 rounded-lg px-2 text-sm font-semibold text-[#087E83] hover:text-[#0A2F25] cursor-pointer ${FOCUS}`}
            >
              View all
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {recentRecords.length === 0 ? (
          <div className={`${CARD} flex flex-col items-center gap-4 px-6 py-10 text-center`}>
            <Camera className="h-10 w-10 text-[#D4AF37]/50" aria-hidden="true" />
            <div className="space-y-1">
              <p className="font-semibold text-[#0A2F25]">No memories yet</p>
              <p className="text-sm text-[#0A2F25]/60">
                Record a place you have visited, with an optional date, notes and photos.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('add-memory')}
              className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#087E83] px-5 py-2 text-sm font-bold text-white transition-all hover:bg-[#0A2F25] cursor-pointer ${FOCUS}`}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add First Memory
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {recentRecords.map((record) => (
              <RecentMemoryCard
                key={record.id}
                record={record}
                placeName={resolvePlace(data, record.place)?.name ?? 'Unknown place'}
                onOpen={() => onOpenMemory(record.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};