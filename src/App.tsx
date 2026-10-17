import React, { useState, useEffect } from 'react';
import { NavTab, Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { MissionsPage } from './pages/MissionsPage';
import { SavedTripPage } from './pages/SavedTripPage';
import { AboutDataPage } from './pages/AboutDataPage';
import { AuthPage, AuthView } from './pages/AuthPage';
import { ProfilePage } from './profile/ProfilePage';

import { PlaceDetailModal } from './components/places/PlaceDetailModal';
import { MelakaShowcaseModal } from './components/places/MelakaShowcaseModal';
import { AIReasoningModal } from './components/common/AIReasoningModal';

import statesData from './data/states.json';
import placesData from './data/places.json';
import missionsData from './data/missions.json';
import collectionsData from './data/collections.json';

import {
  StateRecord,
  HeritagePlace,
  CulturalMission,
  CuratedCollection,
  Itinerary,
  AIReasoningInspection,
  MissionProof,
} from './types';

import {
  loadFavourites,
  saveFavourites,
  loadItinerary,
  saveItinerary,
  loadCompletedMissions,
  completeMission,
  clearAllSavedData,
  loadMissionProofs,
  addMissionProof,
  saveCompletedMissions,
  saveMissionProofs,
  saveUnlockedBadges,
} from './lib/persistence';

import { inspectPlaceReasoning, inspectItineraryReasoning } from './lib/aiReasoning';
import { generateItinerary } from './lib/planner';
import type { WishlistActionResult } from './profile/pages/WishlistPage';
import { calculateHaversineDistanceKm } from './lib/routing';
import { X } from 'lucide-react';

export const App: React.FC = () => {
  // Navigation: Only 4 simplified tabs
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [selectedStateId, setSelectedStateId] = useState<string>('ALL');
  // Frontend-only auth screens (null = normal website). Existing tab/page state is kept while open.
  const [authView, setAuthView] = useState<AuthView | null>(null);

  // Domain Data
  const states = statesData as StateRecord[];
  const places = placesData as HeritagePlace[];
  const missions = missionsData as CulturalMission[];
  const collections = collectionsData as CuratedCollection[];

  // Persistence State
  const [favorites, setFavorites] = useState<string[]>([]);
  const [savedItinerary, setSavedItinerary] = useState<Itinerary | null>(null);
  const [currentItinerary, setCurrentItinerary] = useState<Itinerary | null>(null);
  const [completedMissionIds, setCompletedMissionIds] = useState<string[]>([]);
  const [missionProofs, setMissionProofs] = useState<Record<string, MissionProof>>({});
  // Places added to the trip from the Wishlist but not yet saved with the planner's Save button.
  // Kept in memory only, like the unsaved trip itself, so a refresh clears both together.
  const [pendingWishlistTripIds, setPendingWishlistTripIds] = useState<string[]>([]);
  // True while a Profile form has unsaved changes (reported by ProfilePage).
  const [profileHasUnsavedChanges, setProfileHasUnsavedChanges] = useState(false);

  // Modals
  const [detailPlace, setDetailPlace] = useState<HeritagePlace | null>(null);
  const [isMelakaShowcaseOpen, setIsMelakaShowcaseOpen] = useState(false);
  const [isEthicsModalOpen, setIsEthicsModalOpen] = useState(false);
  const [aiInspection, setAiInspection] = useState<AIReasoningInspection | null>(null);
  const [aiInspectionTitle, setAiInspectionTitle] = useState<string>('');

  // Initial Load from localStorage
  useEffect(() => {
    setFavorites(loadFavourites());
    const storedItin = loadItinerary();
    if (storedItin) {
      const statePhysicalPlaces = places.filter(
        (p) => p.stateId === storedItin.destinationStateId && p.latitude && p.longitude
      );
      const itinPhysicalStops = storedItin.stops.filter((s) => {
        const p = places.find((pl) => pl.id === s.placeId);
        return p && p.latitude && p.longitude;
      });

      const distinctPhysicalStops = itinPhysicalStops.filter((s, idx, arr) => {
        const p1 = places.find((pl) => pl.id === s.placeId);
        if (!p1 || p1.latitude === undefined || p1.longitude === undefined) return false;
        if (idx === 0) return true;
        const prev = places.find((pl) => pl.id === arr[idx - 1].placeId);
        if (!prev || prev.latitude === undefined || prev.longitude === undefined) return true;
        const dist = calculateHaversineDistanceKm(p1.latitude, p1.longitude, prev.latitude, prev.longitude);
        return dist >= 0.10;
      });

      if (statePhysicalPlaces.length >= 2 && distinctPhysicalStops.length < 2) {
        const refreshed = generateItinerary(
          {
            destinationStateId: storedItin.destinationStateId,
            availableMinutes: storedItin.availableMinutes || 240,
            interests:
              storedItin.interests && storedItin.interests.length > 0
                ? storedItin.interests
                : ['Living Tradition', 'Architecture', 'Colonial'],
            transportMode: storedItin.transportMode || 'walking',
            budgetLevel: storedItin.budgetLevel || 'flexible',
          },
          places
        );
        setSavedItinerary(refreshed);
        setCurrentItinerary(refreshed);
        saveItinerary(refreshed);
      } else {
        setSavedItinerary(storedItin);
        setCurrentItinerary(storedItin);
      }
    } else {
      // Generate starter Melaka itinerary
      const starter = generateItinerary(
        {
          destinationStateId: 'MLK',
          availableMinutes: 210,
          interests: ['Living Tradition', 'Architecture', 'Colonial'],
          transportMode: 'walking',
          budgetLevel: 'flexible',
        },
        places
      );
      setCurrentItinerary(starter);
    }
    setCompletedMissionIds(loadCompletedMissions());
    setMissionProofs(loadMissionProofs());
  }, []);

    // After the planner's Save, remove Wishlist places that are now in the stored trip.
  useEffect(() => {
    if (pendingWishlistTripIds.length === 0) return;

    const saved = loadItinerary();
    const savedIds = new Set(saved && Array.isArray(saved.stops) ? saved.stops.map((s) => s.placeId) : []);
    const currentIds = new Set(currentItinerary ? currentItinerary.stops.map((s) => s.placeId) : []);

    // Pending places were not in the stored trip when they were added,
    // so finding one there now means a Save has written it.
    const persisted = pendingWishlistTripIds.filter((id) => savedIds.has(id));
    // Places taken out of the trip before saving are no longer pending.
    const stillPending = pendingWishlistTripIds.filter((id) => !savedIds.has(id) && currentIds.has(id));

    const toRemove = persisted.filter((id) => favorites.includes(id));
    if (toRemove.length > 0) {
      const remaining = favorites.filter((id) => !toRemove.includes(id));
      // If this fails, change nothing and try again at the next check.
      if (!saveFavourites(remaining)) return;
      setFavorites(remaining);
    }
    if (persisted.length > 0 || stillPending.length !== pendingWishlistTripIds.length) {
      setPendingWishlistTripIds(stillPending);
    }
  }, [currentTab, currentItinerary, pendingWishlistTripIds, favorites]);

  // Handlers
    // Hearts on Home and Explore: same behaviour as before, but the list is only updated
  // after it was really saved, so the screen never shows a favorite that was not stored.
  const handleToggleFavorite = (placeId: string) => {
    const updated = favorites.includes(placeId)
      ? favorites.filter((id) => id !== placeId)
      : [...favorites, placeId];
    if (!saveFavourites(updated)) {
      window.alert('Your favorites could not be saved in this browser, so nothing was changed. Please try again.');
      return;
    }
    setFavorites(updated);
  };

  // ---------- Profile > Wishlist ----------

  const handleWishlistRemove = (placeId: string): WishlistActionResult => {
    const updated = favorites.filter((id) => id !== placeId);
    if (!saveFavourites(updated)) {
      return { ok: false, error: 'Your favorites could not be saved in this browser.' };
    }
    setFavorites(updated);
    const name = places.find((p) => p.id === placeId)?.name;
    return { ok: true, message: name ? `"${name}" removed from your Wishlist.` : 'Removed from your Wishlist.' };
  };

    // Works out the trip that would result from adding a place. It changes no state.
  const planAddPlaceToTrip = (
    place: HeritagePlace
  ): { itinerary: Itinerary; startedNewTrip: boolean; replacedCurrent: boolean } | { error: string } => {
    const stored = loadItinerary();
    const hasStoredTrip = stored !== null && Array.isArray(stored.stops);
    const needsNewTrip = !currentItinerary || currentItinerary.destinationStateId !== place.stateId;

    if (needsNewTrip) {
      // Starting a new trip would replace the one the user has. Only allow it when no saved
      // trip and no customised current trip would be lost.
      if (hasStoredTrip || currentItinerary?.isCustomized) {
        return {
          error: currentItinerary
            ? 'This place is in a different state from your current trip. Adding it would replace that trip, so nothing was changed. Plan a new trip for it in Explore instead.'
            : 'You already have a saved trip, so a new trip was not started. Open Saved Trips or Explore first.',
        };
      }
      const created = generateItinerary(
        {
          destinationStateId: place.stateId,
          availableMinutes: 240,
          interests: place.culturalThemes,
          transportMode: 'walking',
          budgetLevel: 'flexible',
          startingPlaceId: place.id,
        },
        places
      );
      // Only count it as added if the place is genuinely in the new trip.
      if (!created.stops.some((s) => s.placeId === place.id)) {
        return { error: 'The trip planner could not include this place.' };
      }
      return { itinerary: created, startedNewTrip: true, replacedCurrent: currentItinerary !== null };
    }

    // Same state: add the place to the current trip.
    if (!currentItinerary) return { error: 'There is no current trip.' };
    if (currentItinerary.stops.some((s) => s.placeId === place.id)) {
      return { error: 'This place is already in your current trip.' };
    }
    const visit = place.visitDurationMinutes || 45;
    const next: Itinerary = {
      ...currentItinerary,
      stops: [
        ...currentItinerary.stops,
        {
          placeId: place.id,
          order: currentItinerary.stops.length + 1,
          visitDurationMinutes: visit,
          routeDataStatus: 'estimated' as const,
          reasonSelected: 'Added by user from Wishlist.',
        },
      ],
      totalPlannedMinutes: currentItinerary.totalPlannedMinutes + visit + 10,
      totalVisitMinutes: currentItinerary.totalVisitMinutes + visit,
      totalTravelMinutes: currentItinerary.totalTravelMinutes + 10,
      isCustomized: true,
    };
    return { itinerary: next, startedNewTrip: false, replacedCurrent: false };
  };

    const handleWishlistAddToTrip = (place: HeritagePlace): WishlistActionResult => {
    const plan = planAddPlaceToTrip(place);
    if ('error' in plan) return { ok: false, error: plan.error };

    // A place that is already part of the stored trip must never be mistaken later for a trip
    // that was just saved, so it is not marked as pending.
    const stored = loadItinerary();
    const alreadyStored =
      stored && Array.isArray(stored.stops) ? stored.stops.some((s) => s.placeId === place.id) : false;

    // Only the in-memory trip changes. The favorite stays until the trip is saved.
    setCurrentItinerary(plan.itinerary);

    if (alreadyStored) {
      return {
        ok: true,
        message: `"${place.name}" added to your current trip. It is already part of your saved trip, so it stays in your Wishlist. Use Remove if you no longer need it there.`,
      };
    }

    setPendingWishlistTripIds((current) => (current.includes(place.id) ? current : [...current, place.id]));

    const stateName = states.find((s) => s.id === place.stateId)?.name ?? 'this state';
    const what = plan.startedNewTrip
      ? plan.replacedCurrent
        ? `A new trip for ${stateName} was started with "${place.name}", replacing your unsaved current trip.`
        : `A new trip for ${stateName} was started with "${place.name}".`
      : `"${place.name}" added to your current trip.`;
    return {
      ok: true,
      message: `${what} It stays in your Wishlist until you press Save in the trip planner.`,
    };
  };

  const handleCompleteMission = (missionId: string) => {
    const updated = completeMission(missionId);
    setCompletedMissionIds(updated);
  };

  const handleUploadProof = (proof: MissionProof) => {
    const updated = addMissionProof(proof);
    setMissionProofs(updated);
  };

  const handleInspectPlaceAI = (place: HeritagePlace) => {
    const inspection = inspectPlaceReasoning(place);
    setAiInspection(inspection);
    setAiInspectionTitle(place.name);
  };

  const handleInspectItineraryAI = (itinerary: Itinerary) => {
    const placeMap = new Map<string, HeritagePlace>(places.map((p) => [p.id, p]));
    const inspection = inspectItineraryReasoning(itinerary, placeMap);
    setAiInspection(inspection);
    setAiInspectionTitle(`${itinerary.title} (${itinerary.stops.length} Stops)`);
  };

  const handleLoadCollectionIntoPlanner = (col: CuratedCollection) => {
    const matchedPlaces = places.filter((p) => col.placeIds.includes(p.id));
    const newItin = generateItinerary(
      {
        destinationStateId: col.stateId,
        availableMinutes: col.recommendedDurationMinutes,
        interests: [col.theme],
        transportMode: 'walking',
        budgetLevel: 'flexible',
        startingPlaceId: col.placeIds[0],
      },
      matchedPlaces.length > 0 ? matchedPlaces : places
    );
    newItin.title = col.title;
    setCurrentItinerary(newItin);
    setCurrentTab('explore');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearAllSaved = () => {
    clearAllSavedData();
    setFavorites([]);
    setSavedItinerary(null);
    setCompletedMissionIds([]);
    setMissionProofs({});
  };

  // Warns before leaving Profile while a Profile form has unsaved changes.
  // Returns true when it is fine to go ahead.
  const confirmLeaveProfile = (): boolean => {
    if (currentTab !== 'profile' || !profileHasUnsavedChanges) return true;
    return window.confirm('You have unsaved changes on your Profile. Leave without saving?');
  };

  const openAuth = (view: AuthView) => {
    setAuthView(view);
    window.scrollTo({ top: 0 });
  };

  if (authView) {
    return (
      <AuthPage
        view={authView}
        onViewChange={openAuth}
        onBack={() => {
          setAuthView(null);
          window.scrollTo({ top: 0 });
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col overflow-x-clip bg-[#F4F9F6] bg-gradient-to-b from-[#EBF5F0] via-[#F4F9F6] to-[#E8F3EE] text-[#0A2F25] selection:bg-[#C5A028]/25 selection:text-[#0A2F25]">
      {/* Navbar: 4 Clean Tabs */}
      <Navbar
        currentTab={currentTab}
        onTabChange={(tab) => {
          if (tab !== currentTab && !confirmLeaveProfile()) return;
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        favoritesCount={favorites.length}
        completedMissionsCount={completedMissionIds.length}
        onSignIn={() => {
          if (!confirmLeaveProfile()) return;
          openAuth('login');
        }}
      />

      {/* Main Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {currentTab === 'home' && (
          <HomePage
            states={states}
            places={places}
            collections={collections}
            onNavigate={(tab) => {
              setCurrentTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectPlace={setDetailPlace}
            onSelectState={(stId) => {
              setSelectedStateId(stId);
              setCurrentTab('explore');
            }}
            onOpenMelakaShowcase={() => setIsMelakaShowcaseOpen(true)}
          />
        )}

        {currentTab === 'explore' && (
          <ExplorePage
            states={states}
            places={places}
            selectedStateId={selectedStateId}
            onSelectState={setSelectedStateId}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onSelectPlace={setDetailPlace}
            onInspectAI={handleInspectPlaceAI}
            currentItinerary={currentItinerary}
            onUpdateItinerary={(itin) => {
              setCurrentItinerary(itin);
              if (itin) setSavedItinerary(itin);
            }}
            onInspectItineraryAI={handleInspectItineraryAI}
          />
        )}

        {currentTab === 'missions' && (
          <MissionsPage
            missions={missions}
            completedMissionIds={completedMissionIds}
            onCompleteMission={handleCompleteMission}
            places={places}
            onSelectPlace={setDetailPlace}
            onResetMissions={() => {
              setCompletedMissionIds([]);
              setMissionProofs({});
              saveCompletedMissions([]);
              saveMissionProofs({});
              saveUnlockedBadges([]);
            }}
            proofs={missionProofs}
            onUploadProof={handleUploadProof}
          />
        )}

        {currentTab === 'saved' && (
          <SavedTripPage
            savedItinerary={currentItinerary}
            favorites={favorites}
            places={places}
            completedMissionIds={completedMissionIds}
            missions={missions}
            onToggleFavorite={handleToggleFavorite}
            onSelectPlace={setDetailPlace}
            onInspectAI={handleInspectPlaceAI}
            onNavigate={(tab) => {
              setCurrentTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onClearAllSaved={handleClearAllSaved}
            proofs={missionProofs}
          />
        )}

        {currentTab === 'profile' && (
          <ProfilePage
            places={places}
            tripPlaceIds={currentItinerary ? currentItinerary.stops.map((s) => s.placeId) : []}
            onWishlistRemove={handleWishlistRemove}
            onWishlistAddToTrip={handleWishlistAddToTrip}
            onViewPlace={setDetailPlace}
            favorites={favorites}
            onUnsavedChange={setProfileHasUnsavedChanges}
           onNavigate={(tab) => {
              if (tab !== currentTab && !confirmLeaveProfile()) return;

              setCurrentTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </main>

      {/* Place Detail Modal */}
      <PlaceDetailModal
        place={detailPlace}
        isOpen={detailPlace !== null}
        onClose={() => setDetailPlace(null)}
        isFavorite={detailPlace ? favorites.includes(detailPlace.id) : false}
        onToggleFavorite={handleToggleFavorite}
        onInspectAI={handleInspectPlaceAI}
        onAddToItinerary={(place) => {
          if (!currentItinerary || currentItinerary.destinationStateId !== place.stateId) {
            const newItin = generateItinerary(
              {
                destinationStateId: place.stateId,
                availableMinutes: 240,
                interests: place.culturalThemes,
                transportMode: 'walking',
                budgetLevel: 'flexible',
                startingPlaceId: place.id,
              },
              places
            );
            setCurrentItinerary(newItin);
          } else {
            const alreadyIn = currentItinerary.stops.some((s) => s.placeId === place.id);
            if (!alreadyIn) {
              const updatedStops = [
                ...currentItinerary.stops,
                {
                  placeId: place.id,
                  order: currentItinerary.stops.length + 1,
                  visitDurationMinutes: place.visitDurationMinutes || 45,
                  routeDataStatus: 'estimated' as const,
                  reasonSelected: `Added by user from details view.`,
                },
              ];
              setCurrentItinerary({
                ...currentItinerary,
                stops: updatedStops,
                totalPlannedMinutes: currentItinerary.totalPlannedMinutes + (place.visitDurationMinutes || 45) + 10,
                totalVisitMinutes: currentItinerary.totalVisitMinutes + (place.visitDurationMinutes || 45),
                totalTravelMinutes: currentItinerary.totalTravelMinutes + 10,
                isCustomized: true,
              });
            }
          }
          setCurrentTab('explore');
        }}
      />

      {/* Melaka Showcase Pop-Up Modal (Directly on Home without leaving page) */}
      <MelakaShowcaseModal
        isOpen={isMelakaShowcaseOpen}
        onClose={() => setIsMelakaShowcaseOpen(false)}
        places={places}
        collections={collections}
        favorites={favorites}
        onToggleFavorite={handleToggleFavorite}
        onSelectPlace={setDetailPlace}
        onInspectAI={handleInspectPlaceAI}
        onAddToItinerary={(place) => {
          setCurrentTab('explore');
        }}
        onLoadCollectionIntoPlanner={handleLoadCollectionIntoPlanner}
      />

      {/* AI Inspector Modal */}
      <AIReasoningModal
        isOpen={aiInspection !== null}
        onClose={() => setAiInspection(null)}
        inspection={aiInspection}
        subjectTitle={aiInspectionTitle}
      />

      {/* Responsible Design Canvas Modal (For Judges / Deliverable 3) */}
      {isEthicsModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-teal-900/15">
            <div className="bg-gradient-to-r from-[#EBF5F0] via-white to-[#E8F3EE] border-b border-teal-900/10 text-[#0A2F25] p-5 flex items-center justify-between shrink-0">
              <h3 className="font-serif font-bold text-lg text-[#0A2F25]">
                Responsible Design Canvas & Ethics (Deliverable 3)
              </h3>
              <button
                onClick={() => setIsEthicsModalOpen(false)}
                className="p-1.5 rounded-lg bg-white text-[#0A2F25]/70 hover:text-[#0A2F25] border border-teal-900/15 hover:bg-[#EBF5F0] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto bg-[#F4F9F6]">
              <AboutDataPage />
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer onOpenEthicsModal={() => setIsEthicsModalOpen(true)} />
    </div>
  );
};

export default App;