import React from 'react';
import { HeritagePlace, Itinerary, CulturalMission, MissionProof } from '../../types';
import { SavedTripPage } from '../../pages/SavedTripPage';
import { loadItinerary, loadCompletedMissions, loadMissionProofs } from '../../lib/persistence';

interface MyTripsPageProps {
  places: HeritagePlace[];
  onOpenSavedTrips?: () => void;
  onExplore?: () => void;
  savedItinerary?: Itinerary | null;
  favorites?: string[];
  completedMissionIds?: string[];
  missions?: CulturalMission[];
  onToggleFavorite?: (id: string) => void;
  onSelectPlace?: (place: HeritagePlace) => void;
  onInspectAI?: (place: HeritagePlace) => void;
  onNavigate?: (tab: any) => void;
  onClearAllSaved?: () => void;
  proofs?: Record<string, MissionProof>;
  onBack?: () => void;
}

export const MyTripsPage: React.FC<MyTripsPageProps> = (props) => {
  const currentItin = props.savedItinerary ?? loadItinerary();
  const missionsCompleted = props.completedMissionIds ?? loadCompletedMissions();
  const proofsData = props.proofs ?? loadMissionProofs();

  return (
    <SavedTripPage
      savedItinerary={currentItin}
      favorites={props.favorites ?? []}
      places={props.places}
      completedMissionIds={missionsCompleted}
      missions={props.missions ?? []}
      onToggleFavorite={props.onToggleFavorite ?? (() => {})}
      onSelectPlace={props.onSelectPlace ?? (() => {})}
      onInspectAI={props.onInspectAI ?? (() => {})}
      onNavigate={props.onNavigate ?? (() => {})}
      onClearAllSaved={props.onClearAllSaved ?? (() => {})}
      proofs={proofsData}
      onBack={props.onBack}
    />
  );
};