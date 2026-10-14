import React, { useState, useEffect } from 'react';
import { NavTab, Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { MelakaPage } from './pages/MelakaPage';
import { PlannerPage } from './pages/PlannerPage';
import { MissionsPage } from './pages/MissionsPage';
import { SavedTripPage } from './pages/SavedTripPage';
import { AboutDataPage } from './pages/AboutDataPage';

import { PlaceDetailModal } from './components/places/PlaceDetailModal';
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
} from './types';

import {
  loadFavourites,
  toggleFavourite,
  loadItinerary,
  loadCompletedMissions,
  completeMission,
  clearAllSavedData,
} from './lib/persistence';

import { inspectPlaceReasoning, inspectItineraryReasoning } from './lib/aiReasoning';
import { generateItinerary } from './lib/planner';

export const App: React.FC = () => {
  // Navigation
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [selectedStateId, setSelectedStateId] = useState<string>('ALL');

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

  // Modals
  const [detailPlace, setDetailPlace] = useState<HeritagePlace | null>(null);
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
      // Generate default starter Melaka itinerary
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
    setCurrentTab('planner');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToItinerary = (place: HeritagePlace) => {
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
      // Check if place already exists
      const alreadyIn = currentItinerary.stops.some((s) => s.placeId === place.id);
      if (!alreadyIn) {
        const updatedStops = [
          ...currentItinerary.stops,
          {
            placeId: place.id,
            order: currentItinerary.stops.length + 1,
            visitDurationMinutes: place.visitDurationMinutes || 45,
            routeDataStatus: 'estimated' as const,
            reasonSelected: `Manually added by user from exploration view.`,
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
    setCurrentTab('planner');
  };

  const handleClearAllSaved = () => {
    clearAllSavedData();
    setFavorites([]);
    setSavedItinerary(null);
    setCompletedMissionIds([]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-amber-200 selection:text-amber-900">
      {/* Navigation */}
      <Navbar
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        favoritesCount={favorites.length}
        completedMissionsCount={completedMissionIds.length}
      />

      {/* Main Container */}
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
            onAddToItinerary={handleAddToItinerary}
          />
        )}

        {currentTab === 'melaka' && (
          <MelakaPage
            places={places}
            collections={collections}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onSelectPlace={setDetailPlace}
            onInspectAI={handleInspectPlaceAI}
            onAddToItinerary={handleAddToItinerary}
            onNavigate={(tab) => {
              setCurrentTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onLoadCollectionIntoPlanner={handleLoadCollectionIntoPlanner}
          />
        )}

        {currentTab === 'planner' && (
          <PlannerPage
            states={states}
            places={places}
            currentItinerary={currentItinerary}
            onUpdateItinerary={(itin) => {
              setCurrentItinerary(itin);
              if (itin) setSavedItinerary(itin);
            }}
            onSelectPlace={setDetailPlace}
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
              clearAllSavedData();
            }}
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
          />
        )}

        {currentTab === 'about' && <AboutDataPage />}
      </main>

      {/* Detail Modal */}
      <PlaceDetailModal
        place={detailPlace}
        isOpen={detailPlace !== null}
        onClose={() => setDetailPlace(null)}
        isFavorite={detailPlace ? favorites.includes(detailPlace.id) : false}
        onToggleFavorite={handleToggleFavorite}
        onInspectAI={handleInspectPlaceAI}
        onAddToItinerary={handleAddToItinerary}
      />

      {/* AI Inspector Modal */}
      <AIReasoningModal
        isOpen={aiInspection !== null}
        onClose={() => setAiInspection(null)}
        inspection={aiInspection}
        subjectTitle={aiInspectionTitle}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default App;
