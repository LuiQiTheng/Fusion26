import React from 'react';
import { Itinerary, HeritagePlace, CulturalMission } from '../types';
import { PlaceCard } from '../components/places/PlaceCard';
import { Bookmark, Calendar, Award, Trash2, ArrowRight, ShieldCheck } from 'lucide-react';
import { NavTab } from '../components/layout/Navbar';

interface SavedTripPageProps {
  savedItinerary: Itinerary | null;
  favorites: string[];
  places: HeritagePlace[];
  completedMissionIds: string[];
  missions: CulturalMission[];
  onToggleFavorite: (id: string) => void;
  onSelectPlace: (place: HeritagePlace) => void;
  onInspectAI: (place: HeritagePlace) => void;
  onNavigate: (tab: NavTab) => void;
  onClearAllSaved: () => void;
}

export const SavedTripPage: React.FC<SavedTripPageProps> = ({
  savedItinerary,
  favorites,
  places,
  completedMissionIds,
  missions,
  onToggleFavorite,
  onSelectPlace,
  onInspectAI,
  onNavigate,
  onClearAllSaved,
}) => {
  const favoritePlaces = places.filter((p) => favorites.includes(p.id));
  const completedMissions = missions.filter((m) => completedMissionIds.includes(m.id));

  const hasAnySaved =
    savedItinerary !== null || favoritePlaces.length > 0 || completedMissions.length > 0;

  return (
    <div className="space-y-12">
      {/* Title & Clear Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif font-bold text-3xl text-slate-900">
            Saved Trips & Bookmarks
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Persisted locally in your browser session. No cloud account or tracking required.
          </p>
        </div>

        {hasAnySaved && (
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all locally saved itineraries and bookmarks?')) {
                onClearAllSaved();
              }
            }}
            className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1.5 self-start sm:self-auto py-2 px-3 rounded-xl border border-red-200 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Clear All Local Data
          </button>
        )}
      </div>

      {!hasAnySaved ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
            <Bookmark className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="font-serif font-bold text-xl text-slate-900">
              No Saved Cultural Data Yet
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Explore Melaka or generate a personalized itinerary to save trips, bookmark favorite heritage monuments, and track mission badges.
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('planner')}
              className="px-5 py-2.5 rounded-xl bg-amber-600 text-white font-semibold text-xs shadow-md hover:bg-amber-700"
            >
              Generate Itinerary
            </button>
            <button
              onClick={() => onNavigate('explore')}
              className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-800 font-semibold text-xs hover:bg-slate-200"
            >
              Explore Monuments
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Saved Itinerary Section */}
          {savedItinerary && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-serif font-bold text-2xl text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-600" /> Saved Itinerary
                </h2>
                <button
                  onClick={() => onNavigate('planner')}
                  className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
                >
                  Open in Planner <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-md space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 text-amber-900">
                      {savedItinerary.destinationStateId} Plan
                    </span>
                    <h3 className="font-serif font-bold text-xl text-slate-900 mt-1">
                      {savedItinerary.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-600">
                    <span>⏱ {savedItinerary.totalPlannedMinutes} mins</span>
                    <span>🏛 {savedItinerary.stops.length} stops</span>
                    <span className="capitalize">🚶 {savedItinerary.transportMode}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
                  {savedItinerary.stops.map((stop) => {
                    const place = places.find((p) => p.id === stop.placeId);
                    if (!place) return null;
                    return (
                      <div
                        key={stop.placeId}
                        onClick={() => onSelectPlace(place)}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-amber-400 cursor-pointer transition-all"
                      >
                        <span className="text-[10px] font-bold text-amber-700">Stop {stop.order}</span>
                        <p className="font-serif font-bold text-xs text-slate-900 line-clamp-1">{place.name}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{stop.visitDurationMinutes} mins visit</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Bookmarked Favourites Grid */}
          <div className="space-y-4">
            <h2 className="font-serif font-bold text-2xl text-slate-900 flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-amber-600" /> Bookmarked Heritage Places ({favoritePlaces.length})
            </h2>

            {favoritePlaces.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No monuments bookmarked yet. Click the bookmark icon on any place card to save it here.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoritePlaces.map((place) => (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    isFavorite={true}
                    onToggleFavorite={onToggleFavorite}
                    onSelect={onSelectPlace}
                    onInspectAI={onInspectAI}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Completed Missions Badges */}
          {completedMissions.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-serif font-bold text-2xl text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600" /> Earned Cultural Badges ({completedMissions.length})
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {completedMissions.map((m) => (
                  <div
                    key={m.id}
                    className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex items-start gap-3"
                  >
                    <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-sm text-emerald-950">{m.title}</h4>
                      <p className="text-xs text-emerald-800 mt-0.5">{m.learningObjective}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
