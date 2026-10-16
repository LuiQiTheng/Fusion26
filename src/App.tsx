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
  toggleFavourite,
  loadItinerary,
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
      setSavedItinerary(storedItin);
      setCurrentItinerary(storedItin);
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

  // Handlers
  const handleToggleFavorite = (placeId: string) => {
    const updated = toggleFavourite(placeId);
    setFavorites(updated);
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
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        favoritesCount={favorites.length}
        completedMissionsCount={completedMissionIds.length}
        onSignIn={() => openAuth('login')}
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
            favorites={favorites}
            onNavigate={(tab) => {
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
          if (!currentItinerary) {
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