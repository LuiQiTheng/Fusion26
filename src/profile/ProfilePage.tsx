import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';
import { HeritagePlace, Itinerary, CulturalMission, MissionProof } from '../types';
import { NavTab } from '../components/layout/Navbar';
import { loadItinerary } from '../lib/persistence';
import { TravelRecord } from './types';
import { configurePlaceLookup, isProfileDataStale, loadProfile } from './profileRepository';
import { DEFAULT_MEMORIES_VIEW, MemoriesViewState } from './memoryUtils';
import { DEFAULT_TRAVEL_MAP_VIEW, TravelMapViewState } from './mapUtils';
import { ProfileOverviewPage, OverviewTarget } from './pages/ProfileOverviewPage';
import { EditProfilePage } from './pages/EditProfilePage';
import { RecordFormPage } from './pages/RecordFormPage';
import { MemoryDetailPage } from './pages/MemoryDetailPage';
import { MemoriesPage } from './pages/MemoriesPage';
import { RecycleBinPage } from './pages/RecycleBinPage';
import { TravelMapPage } from './pages/TravelMapPage';
import { SettingsPage } from './pages/SettingsPage';
import { MyTripsPage } from './pages/MyTripsPage';
import { SavedTripPage } from '../pages/SavedTripPage';
import { WishlistPage } from './pages/WishlistPage';
import type { WishlistActionResult } from './pages/WishlistPage';
import { ConfirmDialog } from './components/ConfirmDialog';
import { Toast, ToastMessage, ToastTone } from './components/Toast';

export interface ProfilePageProps {
  places: HeritagePlace[];
  favorites: string[]; // existing Favorites from App.tsx
  // Lets App.tsx know when a Profile form has unsaved changes. Pass a stable state setter.
  onUnsavedChange?: (hasUnsavedChanges: boolean) => void;
  tripPlaceIds: string[]; // places in the current trip
  onWishlistRemove: (placeId: string) => WishlistActionResult;
  onWishlistAddToTrip: (place: HeritagePlace) => WishlistActionResult;
  onViewPlace: (place: HeritagePlace) => void;
  onNavigate: (tab: NavTab) => void;
  // Saved trips & missions integration
  savedItinerary?: Itinerary | null;
  completedMissionIds?: string[];
  missions?: CulturalMission[];
  onToggleFavorite?: (id: string) => void;
  onInspectAI?: (place: HeritagePlace) => void;
  onClearAllSaved?: () => void;
  proofs?: Record<string, MissionProof>;
}

// Profile subpages. Overview, Edit Profile, the memory pages, Memories, the Recycle Bin and
// the Travel Map exist so far; Settings still shows a placeholder until a later stage.
type ProfileView =
  | 'overview'
  | 'edit-profile'
  | 'settings'
  | 'my-trips'
  | 'wishlist'
  | 'map'
  | 'memories'
  | 'recycle-bin'
  | 'add-memory'
  | 'edit-memory'
  | 'memory-detail';

const VIEW_TITLES: Record<Exclude<ProfileView, 'overview'>, string> = {
  'edit-profile': 'Edit Profile',
  settings: 'Settings',
  'my-trips': 'My Trips',
  wishlist: 'Wishlist',
  map: 'Travel Map',
  memories: 'Memories',
  'recycle-bin': 'Recycle Bin',
  'add-memory': 'Add Memory',
  'edit-memory': 'Edit Memory',
  'memory-detail': 'Memory',
};

// Where the user started a memory flow, so Cancel, delete and breadcrumbs can lead back there.
type FlowOrigin = 'overview' | 'memories' | 'map' | 'settings';

interface Crumb {
  label: string;
  onClick?: () => void; // present when the crumb is a link
}

const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087E83]';

export const ProfilePage: React.FC<ProfilePageProps> = ({
  places,
  favorites,
  tripPlaceIds,
  onWishlistRemove,
  onWishlistAddToTrip,
  onViewPlace,
  onUnsavedChange,
  onNavigate,
  savedItinerary,
  completedMissionIds,
  missions,
  onToggleFavorite,
  onInspectAI,
  onClearAllSaved,
  proofs,
}) => {
  const [view, setView] = useState<ProfileView>('overview');
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [origin, setOrigin] = useState<FlowOrigin>('overview');

  // Memories search, filters, sort and display mode. Kept here so they survive opening a memory.
  const [memoriesView, setMemoriesView] = useState<MemoriesViewState>(DEFAULT_MEMORIES_VIEW);

  // Travel Map date filter, viewport, selected pin and mobile panel state. Kept here for the same reason.
  const [mapView, setMapView] = useState<TravelMapViewState>(DEFAULT_TRAVEL_MAP_VIEW);

  // Merges a partial update into the latest state, so quick map moves never overwrite other changes.
  const patchMapView = useCallback((patch: Partial<TravelMapViewState>) => {
    setMapView((current) => ({ ...current, ...patch }));
  }, []);

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
  const [pendingDest, setPendingDest] = useState<ProfileView | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  // Tell App.tsx whether a form has unsaved changes, so it can warn before the user switches
  // navbar tabs or opens Sign In. App passes a stable state setter, so this does not loop.
  useEffect(() => {
    onUnsavedChange?.(isFormDirty);
  }, [isFormDirty, onUnsavedChange]);

  // When Profile closes, nothing is unsaved any more.
  useEffect(() => {
    return () => onUnsavedChange?.(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Moves to another Profile page, reloading data first so every page is current.
  const navigateTo = (dest: ProfileView) => {
    if (dest === 'overview') {
      goBackToProfile();
      return;
    }
    refresh();
    goTo(dest);
  };

  // Used by Back to Profile, Cancel and breadcrumb links: ask first if there are unsaved changes.
  const requestLeaveTo = (dest: ProfileView) => {
    if (isFormDirty) {
      setPendingDest(dest);
      setConfirmLeaveOpen(true);
    } else {
      navigateTo(dest);
    }
  };

  const handleDiscard = () => {
    const dest = pendingDest ?? 'overview';
    setConfirmLeaveOpen(false);
    setPendingDest(null);
    setIsFormDirty(false);
    navigateTo(dest);
  };

  const handleKeepEditing = () => {
    setConfirmLeaveOpen(false);
    setPendingDest(null);
  };

  // Cancel goes back one step, not always to the Overview.
  const cancelDestination = (current: ProfileView): ProfileView => {
    if (current === 'edit-memory') return 'memory-detail';
    if (current === 'add-memory') return origin;
    return 'overview';
  };

  const handleProfileSaved = () => {
    setIsFormDirty(false);
    showToast('success', 'Profile saved.');
    goBackToProfile();
  };

  const handleMemorySaved = (record: TravelRecord, mode: 'created' | 'updated') => {
    setIsFormDirty(false);
    refresh();
    setSelectedRecordId(record.id);
    showToast('success', mode === 'created' ? 'Memory added.' : 'Memory updated.');
    goTo('memory-detail');
  };

  const handleMemoryDeleted = () => {
    setSelectedRecordId(null);
    showToast('success', 'Memory moved to the Recycle Bin.');
    if (origin === 'memories' || origin === 'map') {
      refresh();
      goTo(origin);
    } else {
      goBackToProfile();
    }
  };

  // After Reset Profile finished: forget remembered Memories and Travel Map state, then show the Overview.
  const handleResetDone = () => {
    setMemoriesView(DEFAULT_MEMORIES_VIEW);
    setMapView(DEFAULT_TRAVEL_MAP_VIEW);
    setSelectedRecordId(null);
    setOrigin('overview');
    setIsFormDirty(false);
    showToast('success', 'Profile reset.');
    goBackToProfile();
  };

  const handleEditMemory = (recordId: string) => {
    setSelectedRecordId(recordId);
    goTo('edit-memory');
  };

  const handleOverviewNavigate = (target: OverviewTarget) => {
    if (target === 'add-memory') {
      setSelectedRecordId(null);
      setOrigin('overview');
    }
    goTo(target);
  };

  const handleOpenMemoryFromOverview = (recordId: string) => {
    setSelectedRecordId(recordId);
    setOrigin('overview');
    goTo('memory-detail');
  };

  const handleOpenMemoryFromMemories = (recordId: string) => {
    setSelectedRecordId(recordId);
    setOrigin('memories');
    goTo('memory-detail');
  };

  const handleOpenMemoryFromMap = (recordId: string) => {
    setSelectedRecordId(recordId);
    setOrigin('map');
    goTo('memory-detail');
  };

  const handleAddMemoryFromMemories = () => {
    setSelectedRecordId(null);
    setOrigin('memories');
    goTo('add-memory');
  };

  const handleAddMemoryFromMap = () => {
    setSelectedRecordId(null);
    setOrigin('map');
    goTo('add-memory');
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
  const recycleBinCount = data.recycleBin.records.length + data.recycleBin.photos.length;

  // Breadcrumb items shown after "Profile /". Items with onClick are links.
  const buildCrumbs = (current: Exclude<ProfileView, 'overview'>): Crumb[] => {
    const memoriesLink: Crumb = { label: 'Memories', onClick: () => requestLeaveTo('memories') };
    const mapLink: Crumb = { label: 'Travel Map', onClick: () => requestLeaveTo('map') };
    // The page the user started from, if it is not the Overview.
    const originCrumbs: Crumb[] = origin === 'memories' ? [memoriesLink] : origin === 'map' ? [mapLink] : [];

    switch (current) {
      case 'recycle-bin':
        return origin === 'settings'
          ? [{ label: 'Settings', onClick: () => requestLeaveTo('settings') }, { label: 'Recycle Bin' }]
          : [memoriesLink, { label: 'Recycle Bin' }];
      case 'memory-detail':
        return [...originCrumbs, { label: 'Memory' }];
      case 'add-memory':
        return [...originCrumbs, { label: 'Add Memory' }];
      case 'edit-memory':
        return [
          ...originCrumbs,
          { label: 'Memory', onClick: () => requestLeaveTo('memory-detail') },
          { label: 'Edit Memory' },
        ];
      default:
        return [{ label: VIEW_TITLES[current] }];
    }
  };

  const renderSubpage = (current: Exclude<ProfileView, 'overview'>): React.ReactNode => {
    switch (current) {
      case 'edit-profile':
        return (
          <EditProfilePage
            profile={data.profile}
            onSaved={handleProfileSaved}
            onCancel={() => requestLeaveTo(cancelDestination(current))}
            onDirtyChange={setIsFormDirty}
          />
        );
      case 'add-memory':
        return (
          <RecordFormPage
            key="add-memory"
            places={places}
            data={data}
            onSaved={handleMemorySaved}
            onCancel={() => requestLeaveTo(cancelDestination(current))}
            onDirtyChange={setIsFormDirty}
          />
        );
      case 'edit-memory':
        return selectedRecordId ? (
          <RecordFormPage
            key={`edit-memory-${selectedRecordId}`}
            places={places}
            data={data}
            recordId={selectedRecordId}
            onSaved={handleMemorySaved}
            onCancel={() => requestLeaveTo(cancelDestination(current))}
            onDirtyChange={setIsFormDirty}
          />
        ) : null;
      case 'memory-detail':
        return selectedRecordId ? (
          <MemoryDetailPage
            key={selectedRecordId}
            data={data}
            places={places}
            recordId={selectedRecordId}
            onEdit={handleEditMemory}
            onDeleted={handleMemoryDeleted}
          />
        ) : null;
      case 'memories':
        return (
          <MemoriesPage
            data={data}
            view={memoriesView}
            onViewChange={setMemoriesView}
            recycleBinCount={recycleBinCount}
            onOpenMemory={handleOpenMemoryFromMemories}
            onAddMemory={handleAddMemoryFromMemories}
            onOpenRecycleBin={() => {
              setOrigin('memories');
              goTo('recycle-bin');
            }}
          />
        );
      case 'recycle-bin':
        return <RecycleBinPage data={data} onDataChanged={refresh} onNotify={showToast} />;
      case 'settings':
        return (
          <SettingsPage
            data={data}
            recycleBinCount={recycleBinCount}
            onEditProfile={() => goTo('edit-profile')}
            onOpenRecycleBin={() => {
              setOrigin('settings');
              goTo('recycle-bin');
            }}
            onDataChanged={refresh}
            onResetDone={handleResetDone}
          />
        );
      case 'wishlist':
        return (
          <WishlistPage
            places={places}
            favorites={favorites}
            tripPlaceIds={tripPlaceIds}
            onRemove={onWishlistRemove}
            onAddToTrip={onWishlistAddToTrip}
            onViewPlace={onViewPlace}
            onExplore={() => onNavigate('explore')}
            onOpenTrips={() => goTo('my-trips')}
            onNotify={showToast}
          />
        );
      case 'my-trips':
        return (
          <SavedTripPage
            savedItinerary={savedItinerary ?? loadItinerary()}
            favorites={favorites}
            places={places}
            completedMissionIds={completedMissionIds ?? []}
            missions={missions ?? []}
            onToggleFavorite={onToggleFavorite ?? (() => {})}
            onSelectPlace={onViewPlace}
            onInspectAI={onInspectAI ?? (() => {})}
            onNavigate={onNavigate}
            onClearAllSaved={onClearAllSaved ?? (() => {})}
            proofs={proofs ?? {}}
            onBack={() => requestLeaveTo('overview')}
          />
        );
      case 'map':
        return (
          <TravelMapPage
            data={data}
            view={mapView}
            onViewChange={patchMapView}
            onOpenMemory={handleOpenMemoryFromMap}
            onAddMemory={handleAddMemoryFromMap}
          />
        );
      default:
        return (
          <div className="rounded-2xl border border-[#D4AF37]/25 bg-[#0A1F1C]/70 p-8 text-center">
            <h1 className="font-serif text-2xl font-bold text-[#F5F5F0]">{VIEW_TITLES[current]}</h1>
            <p className="mt-2 text-sm text-[#F5F5F0]/60">
              This page has not been built yet. It will be added in a later stage.
            </p>
          </div>
        );
    }
  };

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
          onOpenMemory={handleOpenMemoryFromOverview}
        />
      ) : (
        <div className="space-y-6">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-3 text-sm">
            <button
              type="button"
              onClick={() => requestLeaveTo('overview')}
              className={`inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-[#087E83]/30 bg-white px-3 font-semibold text-[#0A2F25] hover:border-[#087E83] hover:bg-[#E6F3ED] cursor-pointer ${FOCUS}`}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to Profile
            </button>
            <p className="flex flex-wrap items-center gap-x-2 text-[#45665C]">
              <span>Profile</span>
              {buildCrumbs(view).map((crumb, index) => (
                <React.Fragment key={`${crumb.label}-${index}`}>
                  <span aria-hidden="true">/</span>
                  {crumb.onClick ? (
                    <button
                      type="button"
                      onClick={crumb.onClick}
                      className={`inline-flex min-h-[44px] items-center rounded px-1 font-semibold text-[#087E83] underline-offset-2 hover:text-[#0A2F25] hover:underline cursor-pointer ${FOCUS}`}
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <span aria-current="page" className="font-semibold text-[#0A2F25]">
                      {crumb.label}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </p>
          </nav>

          {renderSubpage(view)}
        </div>
      )}

      <ConfirmDialog
        open={confirmLeaveOpen}
        title="Discard unsaved changes?"
        confirmLabel="Discard Changes"
        cancelLabel="Continue Editing"
        tone="danger"
        onConfirm={handleDiscard}
        onCancel={handleKeepEditing}
      >
        <p>You have changes that have not been saved. If you leave now, they will be lost.</p>
      </ConfirmDialog>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
};