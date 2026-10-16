import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';
import { HeritagePlace } from '../types';
import { NavTab } from '../components/layout/Navbar';
import { loadItinerary } from '../lib/persistence';
import { configurePlaceLookup, isProfileDataStale, loadProfile } from './profileRepository';
import { ProfileOverviewPage, OverviewTarget } from './pages/ProfileOverviewPage';
import { EditProfilePage } from './pages/EditProfilePage';
import { ConfirmDialog } from './components/ConfirmDialog';
import { Toast, ToastMessage, ToastTone } from './components/Toast';

interface ProfilePageProps {
  places: HeritagePlace[];
  favorites: string[]; // existing Favorites from App.tsx
  onNavigate: (tab: NavTab) => void;
}

// Profile subpages. Overview and Edit Profile exist so far; the others show a placeholder
// and are replaced one by one in later stages.
type ProfileView = 'overview' | 'edit-profile' | 'settings' | 'map' | 'memories' | 'add-memory' | 'memory-detail';

const VIEW_TITLES: Record<Exclude<ProfileView, 'overview'>, string> = {
  'edit-profile': 'Edit Profile',
  settings: 'Settings',
  map: 'Travel Map',
  memories: 'Memories',
  'add-memory': 'Add Memory',
  'memory-detail': 'Memory',
};

const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00F0FF]';

export const ProfilePage: React.FC<ProfilePageProps> = ({ places, favorites, onNavigate }) => {
  const [view, setView] = useState<ProfileView>('overview');
  // Reserved for the memory detail page (built in a later stage).
  const [, setSelectedRecordId] = useState<string | null>(null);

  // Give the repository access to the real Fusion26 places. This runs before any child
  // renders, so existing places can be resolved straight away.
  useMemo(() => {
    const byId = new Map(places.map((place) => [place.id, place]));
    configurePlaceLookup((placeId) => {
      const place = byId.get(placeId);
      return place ? { name: place.name, lat: place.latitude, lng: place.longitude } : null;
    });
  }, [places]);

  // Profile data is read when this page opens, so statistics are always current.
  const [loadResult, setLoadResult] = useState(() => loadProfile());
  // Trips follows the existing semantics: 1 if an itinerary is saved in storage, else 0.
  const [tripsCount, setTripsCount] = useState(() => (loadItinerary() ? 1 : 0));
  const [isStale, setIsStale] = useState(false);

  // Unsaved-change guard and toast.
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = (tone: ToastTone, text: string) => {
    setToast({ id: Date.now(), tone, text });
  };

  const refresh = useCallback(() => {
    setLoadResult(loadProfile());
    setTripsCount(loadItinerary() ? 1 : 0);
    setIsStale(false);
  }, []);

  const knownUpdatedAt = loadResult.ok ? loadResult.value.data.updatedAt : null;

  // If another tab saved newer data, tell the user instead of silently overwriting it later.
  useEffect(() => {
    if (knownUpdatedAt === null) return;
    const check = () => {
      if (isProfileDataStale(knownUpdatedAt)) setIsStale(true);
    };
    window.addEventListener('focus', check);
    return () => window.removeEventListener('focus', check);
  }, [knownUpdatedAt]);

  const goTo = (next: ProfileView) => {
    setView(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBackToProfile = () => {
    refresh();
    goTo('overview');
  };

  // Used by Back to Profile and Cancel: ask first if there are unsaved changes.
  const requestLeave = () => {
    if (isFormDirty) {
      setConfirmLeaveOpen(true);
    } else {
      goBackToProfile();
    }
  };

  const handleDiscard = () => {
    setConfirmLeaveOpen(false);
    setIsFormDirty(false);
    goBackToProfile();
  };

  const handleProfileSaved = () => {
    setIsFormDirty(false);
    showToast('success', 'Profile saved.');
    goBackToProfile();
  };

  const handleOverviewNavigate = (target: OverviewTarget) => {
    // Wishlist and My Trips reuse the existing Saved Trips page until Stage 7.
    if (target === 'wishlist' || target === 'my-trips') {
      onNavigate('saved');
      return;
    }
    goTo(target);
  };

  const handleOpenMemory = (recordId: string) => {
    setSelectedRecordId(recordId);
    goTo('memory-detail');
  };

  if (!loadResult.ok) {
    return (
      <div role="alert" className="mx-auto max-w-lg space-y-4 rounded-2xl border border-red-400/40 bg-red-950/30 p-6 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-red-300" aria-hidden="true" />
        <p className="font-semibold text-[#F5F5F0]">Your profile could not be loaded</p>
        <p className="text-sm text-[#F5F5F0]/75">{loadResult.error}</p>
        <button
          type="button"
          onClick={refresh}
          className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-2 text-sm font-bold text-slate-950 hover:bg-[#E5C05C] cursor-pointer ${FOCUS}`}
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Retry
        </button>
      </div>
    );
  }

  const { data, status, message } = loadResult.value;
  const savedPlacesCount = new Set(favorites).size;

  return (
    <div className="space-y-6">
      {status === 'recovered' && message && (
        <div role="status" className="flex items-start gap-3 rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 p-4 text-sm text-[#F5F5F0]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#E5C05C]" aria-hidden="true" />
          <p>{message}</p>
        </div>
      )}

      {isStale && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#00F0FF]/40 bg-[#00F0FF]/10 p-4 text-sm text-[#F5F5F0]">
          <p>Your profile data was changed in another tab. Reload to see the latest version.</p>
          <button
            type="button"
            onClick={refresh}
            className={`inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-[#00F0FF]/50 px-4 py-2 font-semibold hover:bg-[#00F0FF]/15 cursor-pointer ${FOCUS}`}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Reload
          </button>
        </div>
      )}

      {view === 'overview' ? (
        <ProfileOverviewPage
          data={data}
          savedPlacesCount={savedPlacesCount}
          tripsCount={tripsCount}
          onNavigate={handleOverviewNavigate}
          onOpenMemory={handleOpenMemory}
        />
      ) : (
        <div className="space-y-6">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-3 text-sm">
            <button
              type="button"
              onClick={requestLeave}
              className={`inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-[#D4AF37]/40 px-3 font-semibold text-[#E5C05C] hover:border-[#00F0FF] cursor-pointer ${FOCUS}`}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to Profile
            </button>
            <p className="text-[#F5F5F0]/70">
              Profile / <span className="font-semibold text-[#F5F5F0]">{VIEW_TITLES[view]}</span>
            </p>
          </nav>

          {view === 'edit-profile' ? (
            <EditProfilePage
              profile={data.profile}
              onSaved={handleProfileSaved}
              onCancel={requestLeave}
              onDirtyChange={setIsFormDirty}
            />
          ) : (
            <div className="rounded-2xl border border-[#D4AF37]/25 bg-[#0A1F1C]/70 p-8 text-center">
              <h1 className="font-serif text-2xl font-bold text-[#F5F5F0]">{VIEW_TITLES[view]}</h1>
              <p className="mt-2 text-sm text-[#F5F5F0]/60">
                This page has not been built yet. It will be added in a later stage.
              </p>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmLeaveOpen}
        title="Discard unsaved changes?"
        confirmLabel="Discard Changes"
        cancelLabel="Continue Editing"
        tone="danger"
        onConfirm={handleDiscard}
        onCancel={() => setConfirmLeaveOpen(false)}
      >
        <p>You have changes that have not been saved. If you leave now, they will be lost.</p>
      </ConfirmDialog>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
};